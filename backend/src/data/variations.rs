use std::collections::{BTreeMap, BTreeSet, HashMap};

use serde::Deserialize;

use crate::data::yamlhelper;

use eve_data_core::{Attribute, TypeDB, TypeError, TypeID};

lazy_static::lazy_static! {
    static ref INSTANCE: Variator = Builder::build().unwrap();
}

#[derive(Debug)]
pub struct Variation {
    pub from: TypeID,
    pub to: TypeID,
    pub meta_diff: i64,
}

#[derive(Debug)]
pub struct Variator {
    variations: BTreeMap<TypeID, Vec<Variation>>,
    pub cargo_ignore: BTreeSet<TypeID>,
}

impl Variator {
    pub fn get(&self, from: TypeID) -> Option<&[Variation]> {
        match self.variations.get(&from) {
            Some(vars) => Some(vars),
            None => None,
        }
    }
}

#[derive(Deserialize)]
struct FromMetaEntry {
    base: String,
    abyssal: Option<String>,
    alternative: Option<String>,
}

#[derive(Deserialize)]
struct FromAttributeEntry {
    base: Vec<String>,
    attribute: i32,
    reverse: Option<bool>,
}

#[derive(Deserialize)]
struct ModuleFile {
    alternatives: Vec<Vec<Vec<String>>>,
    from_meta: Vec<FromMetaEntry>,
    from_attribute: Vec<FromAttributeEntry>,
    accept_t1: Vec<String>,
    cargo_ignore: Vec<String>,
}

#[derive(Deserialize)]
struct AddDrug {
    name: String,
    amount: i64,
}

#[derive(Deserialize)]
struct AddRemove {
    detect: String,
    remove: Vec<String>,
    add: Vec<AddDrug>,
}

#[derive(Debug)]
pub struct DrugChanger {
    pub add: BTreeMap<TypeID, i64>,
    pub remove: BTreeSet<TypeID>,
}

#[derive(Deserialize)]
struct ModuleFileDrug {
    drugs_approve_override: Vec<AddRemove>,
}

struct Builder {
    variations: BTreeMap<TypeID, Vec<Variation>>,
    cargo_ignore: BTreeSet<TypeID>,
    file: ModuleFile,
}

impl Builder {
    fn build() -> Result<Variator, TypeError> {
        let mut builder = Builder {
            variations: BTreeMap::new(),
            cargo_ignore: BTreeSet::new(),
            file: yamlhelper::from_file("./data/modules.yaml"),
        };
        builder.add_alternatives()?;
        builder.add_meta()?;
        builder.add_t1()?;
        builder.add_by_attribute()?;
        builder.add_cargo_ignore()?;

        Ok(Variator {
            variations: builder.variations,
            cargo_ignore: builder.cargo_ignore,
        })
    }

    fn merge_tiers(&mut self, tiers: HashMap<TypeID, i64>) {
        for (&module_i, &tier_i) in &tiers {
            if self.variations.contains_key(&module_i) {
                panic!("Duplicate declaration for ID {}", module_i);
            }
            let mut vars = Vec::new();

            for (&module_j, &tier_j) in &tiers {
                vars.push(Variation {
                    from: module_i,
                    to: module_j,
                    meta_diff: tier_j - tier_i,
                });
            }

            vars.sort_by_key(|v| {
                if v.meta_diff < 0 {
                    1000000 - v.meta_diff
                } else {
                    v.meta_diff
                }
            });

            self.variations.insert(module_i, vars);
        }
    }

    fn add_alternatives(&mut self) -> Result<(), TypeError> {
        let mut to_merge = vec![];
        for group in &self.file.alternatives {
            let mut tiers = HashMap::new();
            let mut tier_i = 0;
            for tier in group {
                tier_i += 1;
                for module in tier {
                    tiers.insert(TypeDB::id_of(module)?, tier_i);
                }
            }
            to_merge.push(tiers);
        }
        for merge in to_merge {
            self.merge_tiers(merge);
        }
        Ok(())
    }
    fn add_cargo_ignore(&mut self) -> Result<(), TypeError> {
        for entry in &self.file.cargo_ignore {
            self.cargo_ignore.insert(TypeDB::id_of(entry)?);
        }
        Ok(())
    }

    fn add_meta(&mut self) -> Result<(), TypeError> {
        let mut to_merge = vec![];
        for entry in &self.file.from_meta {
            let base_id = TypeDB::id_of(&entry.base)?;
            let mut variations = TypeDB::type_variations(base_id)?;
            if let Some(abyssal) = &entry.abyssal {
                variations.insert(TypeDB::id_of(abyssal)?, *variations.get(&base_id).unwrap());
            }
            if let Some(alternative) = &entry.alternative {
                variations.insert(
                    TypeDB::id_of(alternative)?,
                    *variations.get(&base_id).unwrap(),
                );
            }
            to_merge.push(variations);
        }
        for merge in to_merge {
            self.merge_tiers(merge);
        }
        Ok(())
    }

    fn add_t1(&mut self) -> Result<(), TypeError> {
        let mut to_merge = vec![];
        for entry in &self.file.accept_t1 {
            let mut tiers = HashMap::new();
            tiers.insert(TypeDB::id_of(entry)?, 2);
            tiers.insert(TypeDB::id_of(&entry[..entry.len() - 1])?, 1);
            to_merge.push(tiers);
        }
        for merge in to_merge {
            self.merge_tiers(merge);
        }
        Ok(())
    }

    fn add_by_attribute(&mut self) -> Result<(), TypeError> {
        let mut to_merge = vec![];

        for entry in &self.file.from_attribute {
            let attribute = Attribute::from_id(entry.attribute);

            let mut module_ids = Vec::new();
            for base in &entry.base {
                for (variation_id, _meta) in TypeDB::type_variations(TypeDB::id_of(base)?)? {
                    module_ids.push(variation_id);
                }
            }

            let mut modules_with_attribute = TypeDB::load_types(&module_ids)
                .unwrap()
                .into_iter()
                .map(|(type_id, the_type)| {
                    if let Some(attr) = the_type.unwrap().attributes.get(&attribute) {
                        (type_id, *attr)
                    } else {
                        panic!("Missing attribute {:?} for type {}", attribute, type_id);
                    }
                })
                .collect::<Vec<_>>();
            modules_with_attribute.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
            if let Some(true) = entry.reverse {
                modules_with_attribute.reverse();
            }

            let mut tiers = HashMap::new();
            let mut tier_i = 1;
            let mut last_value = modules_with_attribute.get(0).unwrap().1;
            for (type_id, attribute_value) in modules_with_attribute {
                if (last_value - attribute_value).abs() > 0.0000000001 {
                    tier_i += 1;
                    last_value = attribute_value;
                }

                tiers.insert(type_id, tier_i);
            }

            to_merge.push(tiers);
        }

        for merge in to_merge {
            self.merge_tiers(merge);
        }

        Ok(())
    }
}

pub fn drug_handling() -> Result<BTreeMap<TypeID, DrugChanger>, TypeError> {
    let data: ModuleFileDrug = yamlhelper::from_file("./data/modules.yaml");

    let mut drugmap = BTreeMap::<TypeID, DrugChanger>::new();

    for itemtype in &data.drugs_approve_override {
        let mut remove = BTreeSet::<TypeID>::new();
        let mut add = BTreeMap::<TypeID, i64>::new();
        for entry in &itemtype.remove {
            remove.insert(TypeDB::id_of(entry)?);
        }
        for entry in &itemtype.add {
            add.insert(TypeDB::id_of(&entry.name)?, entry.amount);
        }
        drugmap.insert(
            TypeDB::id_of(&itemtype.detect)?,
            DrugChanger {
                add: add,
                remove: remove,
            },
        );
    }
    Ok(drugmap)
}

pub fn get() -> &'static Variator {
    &INSTANCE
}

#[cfg(test)]
mod tests {
    use super::{TypeDB, TypeID};

    #[derive(Debug)]
    enum Diff {
        Better,
        Worse,
        Equal,
    }

    fn id_of(s: &str) -> TypeID {
        TypeDB::id_of(s).unwrap()
    }

    fn test_diff(from: &str, to: &str, diff: Diff) {
        let variations = super::get()
            .get(id_of(from))
            .expect("Missing expected variation [from]");
        let to_id = id_of(to);
        let the_match = variations
            .iter()
            .find(|v| v.to == to_id)
            .expect("Missing expected variation [to]");
        match diff {
            Diff::Better => assert!(
                the_match.meta_diff > 0,
                "Expecting {:?}: {:#?}",
                diff,
                the_match
            ),
            Diff::Worse => assert!(
                the_match.meta_diff < 0,
                "Expecting {:?}: {:#?}",
                diff,
                the_match
            ),
            Diff::Equal => assert!(
                the_match.meta_diff == 0,
                "Expecting {:?}: {:#?}",
                diff,
                the_match
            ),
        }
    }

    #[test]
    fn test_a_few() {
        // Hardcoded ones
        test_diff(
            "Agency 'Pyrolancea' DB5 Dose II",
            "Agency 'Pyrolancea' DB3 Dose I",
            Diff::Worse,
        );
        test_diff(
            "Agency 'Pyrolancea' DB5 Dose II",
            "Agency 'Pyrolancea' DB7 Dose III",
            Diff::Better,
        );
        test_diff(
            "Agency 'Pyrolancea' DB5 Dose II",
            "Agency 'Pyrolancea' DB5 Dose II",
            Diff::Equal,
        );

        // T2->T1
        test_diff(
            "Heavy Hull Maintenance Bot II",
            "Heavy Hull Maintenance Bot I",
            Diff::Worse,
        );
        test_diff(
            "Heavy Hull Maintenance Bot I",
            "Heavy Hull Maintenance Bot II",
            Diff::Better,
        );
        test_diff(
            "Heavy Hull Maintenance Bot II",
            "Heavy Hull Maintenance Bot II",
            Diff::Equal,
        );

        // Meta
        test_diff(
            "Core X-Type 500MN Microwarpdrive",
            "Core C-Type 500MN Microwarpdrive",
            Diff::Worse,
        );
        test_diff(
            "500MN Microwarpdrive I",
            "Core C-Type 500MN Microwarpdrive",
            Diff::Better,
        );
        test_diff(
            "Gist X-Type 500MN Microwarpdrive",
            "Core X-Type 500MN Microwarpdrive",
            Diff::Equal,
        );

        // Attributes
        test_diff(
            "Centum A-Type Multispectrum Energized Membrane",
            "Centii A-Type Multispectrum Coating",
            Diff::Worse,
        );
        test_diff(
            "Centum A-Type Multispectrum Energized Membrane",
            "Corpum A-Type Multispectrum Energized Membrane",
            Diff::Equal,
        );
        test_diff(
            "Federation Navy Multispectrum Energized Membrane",
            "Multispectrum Energized Membrane II",
            Diff::Equal,
        );
    }
}
