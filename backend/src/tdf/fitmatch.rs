use std::collections::HashSet;

use eve_data_core::{Fitting, TypeDB, TypeError, TypeID};
use serde::Deserialize;

use crate::data::{
    fitdiffer::{DiffResult, FitDiffer},
    fits::{self, DoctrineFit},
    variations, yamlhelper,
};

lazy_static::lazy_static! {
    static ref INSTANCE: Identifier = load().unwrap();
}

struct Identifier {
    rules: HashSet<TypeID>,
}

fn load() -> Result<Identifier, TypeError> {
    #[derive(Deserialize, Debug)]
    struct File {
        identification: Vec<String>,
    }

    let f: File = yamlhelper::from_file("./data/modules.yaml");

    let mut result = HashSet::new();

    for module_name in f.identification {
        let module_id = TypeDB::id_of(&module_name)?;
        if let Some(vars) = variations::get().get(module_id) {
            for var in vars {
                result.insert(var.to);
            }
        } else {
            result.insert(module_id);
        }
    }

    Ok(Identifier { rules: result })
}

pub fn find_fit(fit: &Fitting) -> Option<(&'static DoctrineFit, DiffResult)> {
    INSTANCE.find_fit(fit)
}

impl Identifier {
    fn find_fit(&self, fit: &Fitting) -> Option<(&'static DoctrineFit, DiffResult)> {
        if let Some(ship_fits) = fits::get_fits().get(&fit.hull) {
            let mut matches = ship_fits
                .iter()
                .map(|doctrine_fit| (doctrine_fit, FitDiffer::diff(&doctrine_fit.fit, fit)))
                .collect::<Vec<_>>();

            matches.sort_by_key(|f| self.fit_score(&f.1));

            matches.into_iter().next()
        } else {
            None
        }
    }

    fn fit_score(&self, diff: &DiffResult) -> i64 {
        let mut score = 0;

        // Missing modules: it is definitely not there
        for (&type_id, count) in &diff.module_missing {
            score += 12 * count * self.multiplier(type_id);
        }
        // Extra: does this belong here?
        for (&type_id, count) in &diff.module_extra {
            score += 8 * count * self.multiplier(type_id);
        }
        // Downgraded. Didn't have money?
        for (&type_id, to) in &diff.module_downgraded {
            for count in to.values() {
                score += 5 * count * self.multiplier(type_id);
            }
        }
        // Upgraded? Either rich, or not actually part of our fit
        for (&type_id, to) in &diff.module_upgraded {
            for count in to.values() {
                score += count * self.multiplier(type_id);
            }
        }

        score
    }

    fn multiplier(&self, type_id: TypeID) -> i64 {
        if self.rules.contains(&type_id) {
            100
        } else {
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::fits;

    #[test]
    fn match_all() {
        for ship_fits in fits::get_fits().values() {
            for fit in ship_fits {
                let matched_fit = super::find_fit(&fit.fit).expect("Should have matched a fit!");
                assert_eq!(
                    fit.name, matched_fit.0.name,
                    "({}) {:?} should match {:?}",
                    fit.name, matched_fit, fit
                );
            }
        }
    }
}
