use serde::Deserialize;

use crate::{data::yamlhelper, util::types::WaitlistCategory};

use eve_data_core::{Fitting, TypeDB, TypeError, TypeID};

struct CategoryData {
    categories: Vec<WaitlistCategory>,
    rules: Vec<(TypeID, String)>,
}

lazy_static::lazy_static! {
    static ref CATEGORY_DATA: CategoryData = build_category_data().unwrap();
}

fn build_category_data() -> Result<CategoryData, TypeError> {
    #[derive(Deserialize)]
    struct CategoryRule {
        item: String,
        category: String,
    }

    #[derive(Deserialize)]
    struct CategoryFile {
        categories: Vec<WaitlistCategory>,
        rules: Vec<CategoryRule>,
    }

    let file: CategoryFile = yamlhelper::from_file("./data/categories.yaml");

    let rules = {
        let mut rules = Vec::new();

        for rule in file.rules {
            let item = TypeDB::id_of(&rule.item)?;
            rules.push((item, rule.category));
        }

        rules
    };
    Ok(CategoryData {
        categories: file.categories,
        rules,
    })
}

pub fn categories() -> &'static Vec<WaitlistCategory> {
    &CATEGORY_DATA.categories
}

pub fn rules() -> &'static Vec<(TypeID, String)> {
    &CATEGORY_DATA.rules
}

pub fn categorize(fit: &Fitting) -> Option<String> {
    for (type_id, category) in &CATEGORY_DATA.rules {
        if fit.hull == *type_id || fit.modules.contains_key(type_id) {
            return Some(category.clone());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::categories;

    #[test]
    fn test_data_load() {
        let cats = categories();
        assert!(!cats.is_empty());
        assert!(!cats[0].id.is_empty());
        assert!(!cats[0].name.is_empty());
    }
}
