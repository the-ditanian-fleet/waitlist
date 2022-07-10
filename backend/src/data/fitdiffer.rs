use std::{cmp::min, collections::BTreeMap};

use crate::data::variations::{Variation, Variator};

use eve_data_core::{Fitting, TypeID};

#[derive(Debug)]
struct SectionDiff {
    missing: BTreeMap<TypeID, i64>,
    extra: BTreeMap<TypeID, i64>,
    upgraded: BTreeMap<TypeID, BTreeMap<TypeID, i64>>,
    downgraded: BTreeMap<TypeID, BTreeMap<TypeID, i64>>,
}

#[derive(Debug)]
pub struct DiffResult {
    pub module_missing: BTreeMap<TypeID, i64>,
    pub module_extra: BTreeMap<TypeID, i64>,
    pub module_upgraded: BTreeMap<TypeID, BTreeMap<TypeID, i64>>,
    pub module_downgraded: BTreeMap<TypeID, BTreeMap<TypeID, i64>>,
    pub cargo_missing: BTreeMap<TypeID, i64>,
}

pub struct FitDiffer {}

impl FitDiffer {
    fn section_diff(
        expect: &BTreeMap<TypeID, i64>,
        actual: &BTreeMap<TypeID, i64>,
        variator: &'static Variator,
    ) -> SectionDiff {
        let mut extra = actual.clone();
        let mut missing = expect.clone();
        let mut downgraded = BTreeMap::new();
        let mut upgraded = BTreeMap::new();

        for (&expect_type_id, remaining) in missing.iter_mut() {
            let or_else = [Variation {
                from: expect_type_id,
                to: expect_type_id,
                meta_diff: 0,
            }];

            // First pass: only check meta_diff==0
            for variation in variator.get(expect_type_id).unwrap_or(&or_else) {
                if variation.meta_diff != 0 {
                    continue;
                }
                let sub = min(*remaining, *extra.get(&variation.to).unwrap_or(&0));
                if sub > 0 {
                    *remaining -= sub;
                    *extra.get_mut(&variation.to).unwrap() -= sub;
                }
            }
        }

        for (&expect_type_id, remaining) in missing.iter_mut() {
            let or_else = [Variation {
                from: expect_type_id,
                to: expect_type_id,
                meta_diff: 0,
            }];

            // Second pass: check all metas
            for variation in variator.get(expect_type_id).unwrap_or(&or_else) {
                let sub = min(*remaining, *extra.get(&variation.to).unwrap_or(&0));
                if sub > 0 {
                    *remaining -= sub;
                    *extra.get_mut(&variation.to).unwrap() -= sub;

                    match variation.meta_diff {
                        diff if diff > 0 => {
                            // Higher meta -> upgrade
                            *upgraded
                                .entry(variation.from)
                                .or_insert_with(BTreeMap::new)
                                .entry(variation.to)
                                .or_insert(0) += sub;
                        }
                        diff if diff < 0 => {
                            // Lower meta -> downgrade
                            *downgraded
                                .entry(variation.from)
                                .or_insert_with(BTreeMap::new)
                                .entry(variation.to)
                                .or_insert(0) += sub;
                        }
                        _ => (),
                    };
                }
            }
        }

        let extra = extra.into_iter().filter(|(_k, v)| *v > 0).collect();
        let missing = missing.into_iter().filter(|(_k, v)| *v > 0).collect();

        SectionDiff {
            missing,
            extra,
            upgraded,
            downgraded,
        }
    }

    pub fn diff(expect: &Fitting, actual: &Fitting) -> DiffResult {
        let variator = crate::data::variations::get();
        let modules = Self::section_diff(&expect.modules, &actual.modules, &variator);
        let cargo_changer = crate::data::variations::drug_handling().unwrap_or(BTreeMap::new());
        let mut mexcargo = expect.cargo.clone();
        mexcargo.retain(|id, _| !&variator.cargo_ignore.contains(id));
        // Change expected cargo (yaml config) does fit have the detecting drug?
        for (detect, drugchange) in &cargo_changer {
            if mexcargo.contains_key(&detect) {
                mexcargo.retain(|id, _| !drugchange.remove.contains(id));
                for (id, amount) in drugchange.add.iter() {
                    mexcargo.insert(*id, *amount);
                }
            }
        }
        let cargo = Self::section_diff(&mexcargo, &actual.cargo, &variator);
        // "Downgraded" cargo isn't a thing. Count those as missing
        let mut cargo_missing = cargo.missing;
        for (type_id, to) in cargo.downgraded {
            for (_type_id, count) in to {
                *cargo_missing.entry(type_id).or_insert(0) += count;
            }
        }

        // Only count cargo as missing if it's more than 70%
        let cargo_missing = cargo_missing
            .into_iter()
            .filter(|(type_id, count)| {
                let expect = *mexcargo.get(type_id).unwrap();
                if expect >= 10 {
                    *count > (expect * 80 / 100) // Integer way of doing *0.8
                } else {
                    true
                }
            })
            .collect();

        DiffResult {
            module_missing: modules.missing,
            module_extra: modules.extra,
            module_downgraded: modules.downgraded,
            module_upgraded: modules.upgraded,
            cargo_missing,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{FitDiffer, Fitting};

    #[test]
    fn test_parse_dna() {
        let parsed = Fitting::from_dna("670::").unwrap();
        assert_eq!(parsed.hull, 670);
        assert!(parsed.modules.is_empty());
        assert!(parsed.cargo.is_empty());
        assert_eq!(parsed.to_dna().unwrap(), "670::");

        let parsed = Fitting::from_dna("59630:24554;1:23674;1:24550;1:24552;1::").unwrap();
        assert_eq!(parsed.hull, 59630);
        assert!(parsed.cargo.is_empty());
        assert_eq!(*parsed.modules.get(&24554).unwrap(), 1);
        assert_eq!(*parsed.modules.get(&23674).unwrap(), 1);
        assert_eq!(*parsed.modules.get(&24550).unwrap(), 1);
        assert_eq!(*parsed.modules.get(&24552).unwrap(), 1);
        assert_eq!(parsed.modules.len(), 4);
        assert_eq!(
            parsed.to_dna().unwrap(),
            "59630:23674;1:24550;1:24552;1:24554;1::"
        );

        let parsed = Fitting::from_dna("17736:3057;4:12816;2:4383_;1::").unwrap();
        assert_eq!(parsed.hull, 17736);
        assert_eq!(parsed.modules.len(), 1);
        assert_eq!(parsed.cargo.len(), 2);
        assert_eq!(*parsed.modules.get(&3057).unwrap(), 4);
        assert_eq!(*parsed.cargo.get(&12816).unwrap(), 2);
        assert_eq!(*parsed.cargo.get(&4383).unwrap(), 1);
        assert_eq!(parsed.to_dna().unwrap(), "17736:3057;4:4383_;1:12816;2::");
    }

    #[test]
    fn test_parse_eft() {
        let parsed = Fitting::from_eft(
            "[Nightmare, Nightmare]


Mega Pulse Laser II
Mega Pulse Laser II
Mega Pulse Laser II
Mega Pulse Laser II





Conflagration L x2
Large Micro Jump Drive x1
",
        )
        .unwrap();
        assert_eq!(parsed.len(), 1);
        let parsed = parsed.into_iter().next().unwrap();
        assert_eq!(parsed.hull, 17736);
        assert_eq!(parsed.modules.len(), 1);
        assert_eq!(parsed.cargo.len(), 2);
        assert_eq!(*parsed.modules.get(&3057).unwrap(), 4);
        assert_eq!(*parsed.cargo.get(&12816).unwrap(), 2);
        assert_eq!(*parsed.cargo.get(&4383).unwrap(), 1);
        assert_eq!(parsed.to_dna().unwrap(), "17736:3057;4:4383_;1:12816;2::");
    }

    #[test]
    fn test_parse_eft_2() {
        let parsed = Fitting::from_eft(
            "[Venture, *Simulated Venture Fitting]






Hobgoblin II x2

1600mm Steel Plates II x1

",
        )
        .unwrap()
        .pop()
        .expect("Parsed");
        assert_eq!(*parsed.modules.get(&2456).unwrap(), 2);
        assert_eq!(*parsed.cargo.get(&20353).unwrap(), 1);
    }

    #[test]
    fn test_diff() {
        let expect = Fitting::from_eft(
            "[Atron, test]
Mega Pulse Laser II
Core X-Type 500MN Microwarpdrive
10MN Afterburner II
Centum A-Type Multispectrum Energized Membrane
Conflagration L x123
",
        )
        .expect("Parsed?")
        .pop()
        .unwrap();
        let actual = Fitting::from_eft(
            "[Atron, test]
Mega Pulse Laser II
10MN Abyssal Afterburner
Centii A-Type Multispectrum Coating
Sensor Booster II
",
        )
        .expect("Parsed?")
        .pop()
        .unwrap();

        let diff = FitDiffer::diff(&expect, &actual);

        assert_eq!(diff.cargo_missing.len(), 1);
        assert_eq!(
            *diff
                .cargo_missing
                .get(&type_id!("Conflagration L"))
                .unwrap(),
            123
        );

        assert_eq!(diff.module_missing.len(), 1);
        assert_eq!(
            *diff
                .module_missing
                .get(&type_id!("Core X-Type 500MN Microwarpdrive"))
                .unwrap(),
            1
        );

        assert_eq!(diff.module_extra.len(), 1);
        assert_eq!(
            *diff
                .module_extra
                .get(&type_id!("Sensor Booster II"))
                .unwrap(),
            1
        );

        assert_eq!(diff.module_upgraded.len(), 1);
        assert_eq!(
            *diff
                .module_upgraded
                .get(&type_id!("10MN Afterburner II"))
                .unwrap()
                .get(&type_id!("10MN Abyssal Afterburner"))
                .unwrap(),
            1
        );

        assert_eq!(diff.module_downgraded.len(), 1);
        assert_eq!(
            *diff
                .module_downgraded
                .get(&type_id!("Centum A-Type Multispectrum Energized Membrane"))
                .unwrap()
                .get(&type_id!("Centii A-Type Multispectrum Coating"))
                .unwrap(),
            1
        );
    }
}
