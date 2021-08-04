use serde::Deserialize;

use crate::{data::yamlhelper, util::types::WaitlistCategory};

use eve_data_core::{Fitting, TypeDB, TypeError, TypeID};

use super::variations;

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
        meta: Option<String>,
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
        let variator = variations::get();

        for rule in file.rules {
            let item = TypeDB::id_of(&rule.item)?;
            if let Some(meta_cmp) = rule.meta {
                for variation in variator.get(item).unwrap() {
                    if !match meta_cmp.as_str() {
                        "gt" => variation.meta_diff > 0,
                        "lt" => variation.meta_diff < 0,
                        "ge" => variation.meta_diff >= 0,
                        "le" => variation.meta_diff <= 0,
                        "any" => true,
                        _ => panic!("Misunderstood meta_cmp '{}'", meta_cmp),
                    } {
                        continue;
                    }

                    rules.push((variation.to, rule.category.clone()));
                }
            } else {
                rules.push((item, rule.category));
            }
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
        assert!(cats.len() > 0);
        assert!(cats[0].id.len() > 0);
        assert!(cats[0].name.len() > 0);
    }
}
