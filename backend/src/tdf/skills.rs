use std::collections::{HashMap, HashSet};

use crate::data::yamlhelper;
use eve_data_core::{SkillLevel, TypeDB, TypeError, TypeID};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy)]
pub enum SkillTier {
    Min,
    Elite,
    Gold,
}

#[derive(Debug, Serialize)]
pub struct SkillTiers {
    min: Option<SkillLevel>,
    elite: Option<SkillLevel>,
    gold: Option<SkillLevel>,

    pub priority: i8,
}
pub type SkillRequirements = HashMap<String, HashMap<TypeID, SkillTiers>>;
pub type SkillCategories = HashMap<String, Vec<TypeID>>;

pub struct SkillData {
    pub requirements: SkillRequirements,
    pub categories: SkillCategories,
    pub relevant_skills: HashSet<TypeID>,
    pub name_lookup: HashMap<String, TypeID>,
    pub id_lookup: HashMap<TypeID, String>,
}

lazy_static::lazy_static! {
    static ref SKILL_DATA: SkillData = build_skill_data().unwrap();
}

pub fn skill_data() -> &'static SkillData {
    &SKILL_DATA
}

fn extend_known_skills(known_skills: &mut HashSet<TypeID>) -> Result<(), TypeError> {
    // Extend known_skills with skills required to fly our fits
    {
        let mut fit_types = HashSet::new();
        for fit in crate::data::fits::get_fits().values().flatten() {
            fit_types.insert(fit.fit.hull);
            for module_id in fit.fit.modules.keys() {
                fit_types.insert(*module_id);
            }
            for cargo_id in fit.fit.cargo.keys() {
                fit_types.insert(*cargo_id);
            }
        }

        let fit_types: Vec<TypeID> = fit_types.into_iter().collect();
        for the_type in TypeDB::load_types(&fit_types)?.values().flatten() {
            for &skill_id in the_type.skill_requirements.keys() {
                known_skills.insert(skill_id);
            }
        }
    }

    // Loop through known_skills and resolve requirements
    {
        let mut to_process: Vec<TypeID> = known_skills.iter().copied().collect();
        while let Some(skill_id) = to_process.pop() {
            let the_type = TypeDB::load_type(skill_id)?;
            for &requirement in the_type.skill_requirements.keys() {
                to_process.push(requirement);
                known_skills.insert(requirement);
            }
        }
    }

    Ok(())
}

fn build_skill_data() -> Result<SkillData, TypeError> {
    #[derive(Deserialize, Debug)]
    struct SkillFile {
        categories: HashMap<String, Vec<String>>,
        requirements: HashMap<String, HashMap<String, HashMap<String, SkillLevel>>>,
    }

    let skill_data: SkillFile = yamlhelper::from_file("./data/skills.yaml");

    // Build the category data. Content is {category:[..skill_ids]}
    let mut categories = HashMap::new();
    for (category_name, skill_names) in skill_data.categories {
        let mut these_skills = Vec::new();
        for skill_name in skill_names {
            these_skills.push(TypeDB::id_of(&skill_name)?);
        }
        categories.insert(category_name, these_skills);
    }

    // Build the requirement data. Content is {shipName:{skillID:{tier:level}}}, where tier is min/elite/gold
    let mut requirements = HashMap::new();
    let mut known_skills = HashSet::new();
    for (ship_name, skills) in skill_data.requirements {
        let mut these_skills = HashMap::new();
        for (skill_name, tiers) in skills {
            let min_level = tiers.get("min");
            let elite_level = tiers.get("elite").or(min_level);
            let gold_level = tiers.get("gold").or(Some(&5));

            let skill_id = TypeDB::id_of(&skill_name)?;
            these_skills.insert(
                skill_id,
                SkillTiers {
                    min: min_level.copied(),
                    elite: elite_level.copied(),
                    gold: gold_level.copied(),

                    priority: tiers.get("priority").copied().unwrap_or(1),
                },
            );
            known_skills.insert(skill_id);
        }
        requirements.insert(ship_name, these_skills);
    }

    extend_known_skills(&mut known_skills)?;

    let mut name_lookup = HashMap::new();
    let mut id_lookup = HashMap::new();
    for (id, name) in TypeDB::names_of(&known_skills.iter().copied().collect::<Vec<TypeID>>())? {
        id_lookup.insert(id, name.clone());
        name_lookup.insert(name, id);
    }

    Ok(SkillData {
        requirements,
        categories,
        relevant_skills: known_skills,
        name_lookup,
        id_lookup,
    })
}

impl SkillTiers {
    pub fn get(&self, tier: SkillTier) -> Option<SkillLevel> {
        use SkillTier::*;
        match tier {
            Min => self.min,
            Elite => self.elite,
            Gold => self.gold,
        }
    }
}
