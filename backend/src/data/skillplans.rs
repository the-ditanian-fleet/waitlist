use std::collections::{BTreeMap, BTreeSet, BinaryHeap};

use crate::{data::yamlhelper, tdf::skills::SkillTier};
use eve_data_core::{Attribute, SkillLevel, TypeDB, TypeError, TypeID};
use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum SkillPlanError {
    #[error("fit not found")]
    FitNotFound,

    #[error("type error")]
    TypeError(#[from] TypeError),

    #[error("invalid tier")]
    InvalidTier,
}

#[derive(Debug, Deserialize)]
struct SkillPlanFile {
    plans: Vec<SkillPlan>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SkillPlan {
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub alpha: bool,
    pub plan: Vec<SkillPlanLevel>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SkillPlanLevel {
    Fit { hull: String, fit: String },
    Skills { from: String, tier: String },
    Skill { from: String, level: SkillLevel },
    Tank { from: String },
}

type LevelPair = (TypeID, SkillLevel);

pub fn build_plan(plan: &SkillPlan) -> Result<Vec<LevelPair>, SkillPlanError> {
    let mut seen = BTreeSet::new();
    let mut skills = Vec::new();

    for plan_level in &plan.plan {
        let skill_reqs = match plan_level {
            SkillPlanLevel::Fit { hull, fit } => get_fit_plan(hull, fit)?,
            SkillPlanLevel::Skills { from, tier } => get_skill_plan(from, tier)?,
            SkillPlanLevel::Skill { from, level } => get_single_skill(from, *level)?,
            SkillPlanLevel::Tank { from } => get_tank_plan(from)?,
        };

        for req in skill_reqs {
            if !seen.contains(&req) {
                seen.insert(req);
                skills.push(req);
            }
        }
    }

    Ok(skills)
}

pub fn load_plans_from_file() -> Vec<SkillPlan> {
    let file: SkillPlanFile = yamlhelper::from_file("./data/skillplan.yaml");
    file.plans
}

#[derive(Debug, Default)]
struct DepEntry {
    dependees: Vec<LevelPair>,
    unsatisfied_requirements: usize,
    value: i64,
}

fn determine_value(
    skill: LevelPair,
    graph: &BTreeMap<LevelPair, DepEntry>,
    priority: &BTreeMap<TypeID, f64>,
    memo: &mut BTreeMap<LevelPair, f64>,
) -> Result<f64, SkillPlanError> {
    if let Some(&value) = memo.get(&skill) {
        return Ok(value);
    }

    let value = {
        let the_type = TypeDB::load_type(skill.0)?;
        let sp_needed = 250.
            * (*the_type
                .attributes
                .get(&Attribute::TrainingTimeMultiplier)
                .unwrap() as f64)
            * (f64::sqrt(32.).powi((skill.1 - 1) as i32));
        let mut value_per_sp = priority.get(&skill.0).copied().unwrap_or(1.) / sp_needed;

        let graph_entry = graph.get(&skill).unwrap();
        for &dependee in graph_entry.dependees.iter() {
            value_per_sp += determine_value(dependee, graph, priority, memo)? / 2.;
        }

        value_per_sp
    };

    memo.insert(skill, value);
    Ok(value)
}

fn create_skill_graph(
    reqs: &BTreeSet<LevelPair>,
    priority: &BTreeMap<TypeID, f64>,
) -> Result<BTreeMap<LevelPair, DepEntry>, SkillPlanError> {
    let mut requirements: BTreeMap<LevelPair, DepEntry> = BTreeMap::new();
    let mut to_process: Vec<LevelPair> = reqs.iter().copied().collect();
    let mut processed = BTreeSet::new();

    while let Some((skill_id, skill_level)) = to_process.pop() {
        if processed.contains(&(skill_id, skill_level)) {
            continue;
        }
        processed.insert((skill_id, skill_level));

        let mut these_reqs = BTreeSet::new();
        if skill_level >= 2 {
            these_reqs.insert((skill_id, skill_level - 1)); // Level N needs level N-1 trained
        } else if skill_level == 1 {
            // Only check skill requirements for level 1, or we'd be generating a very complex graph
            let the_type = TypeDB::load_type(skill_id)?;
            for (&req_id, &req_level) in the_type.skill_requirements.iter() {
                these_reqs.insert((req_id, req_level));
            }
        }

        requirements
            .entry((skill_id, skill_level))
            .or_default()
            .unsatisfied_requirements = these_reqs.len();

        for req in these_reqs {
            to_process.push(req);
            requirements
                .entry(req)
                .or_default()
                .dependees
                .push((skill_id, skill_level));
        }
    }

    let mut memo = BTreeMap::new();
    for pair in requirements.keys().copied().collect::<Vec<_>>() {
        let value = determine_value(pair, &requirements, priority, &mut memo)?;
        requirements.get_mut(&pair).unwrap().value = (value * 1000000000.) as i64;
    }

    Ok(requirements)
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct SkillGraphPriorityEntry {
    value: i64,
    level: SkillLevel,
    skill: TypeID,
}

fn flatten_skill_graph(mut graph: BTreeMap<LevelPair, DepEntry>) -> Vec<LevelPair> {
    let mut todo = BinaryHeap::new();
    for ((skill_id, skill_level), entry) in graph.iter() {
        if entry.unsatisfied_requirements == 0 {
            todo.push(SkillGraphPriorityEntry {
                value: entry.value,
                level: *skill_level,
                skill: *skill_id,
            });
        }
    }

    let mut order = vec![];
    while let Some(process_entry) = todo.pop() {
        let pair = (process_entry.skill, process_entry.level);
        order.push(pair);

        let entry = graph.remove(&pair).unwrap();
        for dependee in entry.dependees {
            let dependee_entry = graph.get_mut(&dependee).unwrap();
            dependee_entry.unsatisfied_requirements -= 1;
            if dependee_entry.unsatisfied_requirements == 0 {
                todo.push(SkillGraphPriorityEntry {
                    value: dependee_entry.value,
                    level: dependee.1,
                    skill: dependee.0,
                });
            }
        }
    }

    order
}

fn create_sorted_plan(
    for_hull: &str,
    requirements: &BTreeSet<LevelPair>,
) -> Result<Vec<LevelPair>, SkillPlanError> {
    let hull_skills = crate::tdf::skills::skill_data()
        .requirements
        .get(for_hull)
        .expect("Surely we checked this by now?");

    let skill_priority = hull_skills
        .iter()
        .map(|(&skill, tiers)| (skill, tiers.priority as f64))
        .collect();

    let graph = create_skill_graph(requirements, &skill_priority)?;
    Ok(flatten_skill_graph(graph))
}

fn get_fit_plan(hull: &str, fit_name: &str) -> Result<Vec<LevelPair>, SkillPlanError> {
    let hull_id = TypeDB::id_of(hull)?;
    let hull_fits = match crate::data::fits::get_fits().get(&hull_id) {
        Some(fits) => fits,
        None => return Err(SkillPlanError::FitNotFound),
    };

    if let Some(fit) = hull_fits.iter().find(|fit| fit.name == fit_name) {
        let mut to_process = vec![fit.fit.hull];
        for module_id in fit.fit.modules.keys() {
            to_process.push(*module_id);
        }

        let mut requirements = BTreeSet::new();
        for type_id in to_process {
            let the_type = TypeDB::load_type(type_id)?;
            for (&req_type, &req_level) in the_type.skill_requirements.iter() {
                requirements.insert((req_type, req_level));
            }
        }

        let hull_name = TypeDB::name_of(fit.fit.hull)?;
        create_sorted_plan(&hull_name, &requirements)
    } else {
        Err(SkillPlanError::FitNotFound)
    }
}

fn get_skill_plan(hull_name: &str, level_name: &str) -> Result<Vec<LevelPair>, SkillPlanError> {
    let tier = match level_name {
        "min" => SkillTier::Min,
        "elite" => SkillTier::Elite,
        "gold" => SkillTier::Gold,
        _ => return Err(SkillPlanError::InvalidTier),
    };

    create_sorted_plan(
        hull_name,
        &crate::tdf::skills::skill_data()
            .requirements
            .get(hull_name)
            .expect("Expected known ship")
            .iter()
            .map(|(&skill_id, tiers)| (skill_id, tiers.get(tier).unwrap_or_default()))
            .filter(|(_skill_id, skill_level)| *skill_level > 0)
            .collect(),
    )
}

fn get_tank_plan(level_name: &str) -> Result<Vec<LevelPair>, SkillPlanError> {
    let armor_comps = match level_name {
        "starter" => 2,
        _ => 4,
    } as SkillLevel;

    let mut reqs = BTreeSet::new();
    reqs.insert((type_id!("EM Armor Compensation"), armor_comps));
    reqs.insert((type_id!("Thermal Armor Compensation"), armor_comps));
    reqs.insert((type_id!("Kinetic Armor Compensation"), armor_comps));
    reqs.insert((type_id!("Explosive Armor Compensation"), armor_comps));

    if level_name == "bastion" {
        reqs.insert((type_id!("Mechanics"), 4));
        reqs.insert((type_id!("Hull Upgrades"), 5));
    }

    // The tank skill order isn't ship-specific so just specify Megathron here
    create_sorted_plan("Megathron", &reqs)
}

fn get_single_skill(skill_name: &str, level: SkillLevel) -> Result<Vec<LevelPair>, SkillPlanError> {
    let skill_id = TypeDB::id_of(skill_name)?;
    let mut reqs = BTreeSet::new();
    reqs.insert((skill_id, level));

    // Don't know what ship it is...
    create_sorted_plan("Megathron", &reqs)
}
