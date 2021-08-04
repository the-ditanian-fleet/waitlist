use std::collections::{HashMap, HashSet};

use crate::data::yamlhelper;
use eve_data_core::{SkillLevel, TypeDB, TypeError, TypeID};
use serde::Deserialize;

pub type SkillRequirements = HashMap<String, HashMap<TypeID, HashMap<&'static str, SkillLevel>>>;
pub type SkillCategories = HashMap<String, Vec<TypeID>>;

pub struct SkillData {
    pub requirements: SkillRequirements,
    pub categories: SkillCategories,
    pub relevant_skills: HashSet<TypeID>,
    pub name_lookup: HashMap<String, TypeID>,
}

lazy_static::lazy_static! {
    static ref SKILL_DATA: SkillData = build_skill_data().unwrap();
}

pub fn skill_data() -> &'static SkillData {
    &SKILL_DATA
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
            let mut these_tiers = HashMap::new();
            let min_level = tiers.get("min");
            let elite_level = tiers.get("elite").or(min_level);
            let gold_level = tiers.get("gold").or(elite_level);

            if let Some(min_level) = min_level {
                these_tiers.insert("min", *min_level);
            }
            if let Some(elite_level) = elite_level {
                these_tiers.insert("elite", *elite_level);
            }
            if let Some(gold_level) = gold_level {
                these_tiers.insert("gold", *gold_level);
            }

            let skill_id = TypeDB::id_of(&skill_name)?;
            these_skills.insert(skill_id, these_tiers);
            known_skills.insert(skill_id);
        }
        requirements.insert(ship_name, these_skills);
    }

    let mut name_lookup = HashMap::new();
    for (id, name) in TypeDB::names_of(&known_skills.iter().copied().collect::<Vec<TypeID>>())? {
        name_lookup.insert(name, id);
    }

    Ok(SkillData {
        requirements,
        categories,
        relevant_skills: known_skills,
        name_lookup,
    })
}
