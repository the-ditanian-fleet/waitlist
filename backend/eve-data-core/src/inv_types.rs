use super::{Attribute, Category, Effect};
use rusqlite::OptionalExtension;
use std::collections::{HashMap, HashSet};
use std::iter;
use std::sync::{Arc, RwLock};

pub type TypeID = i32;
pub type SkillLevel = i8;

#[derive(thiserror::Error, Debug)]
pub enum TypeError {
    #[error("database error")]
    Database(#[from] rusqlite::Error),
    #[error("no matches for item")]
    NothingMatched,
    #[error("unexpectedly got multiple item matches")]
    MultipleMatches,
}

#[derive(Clone, Debug)]
pub struct Type {
    pub id: TypeID,
    pub name: String,
    pub category: Category,
    pub attributes: HashMap<Attribute, f32>,
    pub effects: HashSet<Effect>,
    pub skill_requirements: HashMap<TypeID, SkillLevel>,
}

impl Type {
    pub fn slot(&self) -> Option<&'static str> {
        if self.effects.contains(&Effect::low_power()) {
            return Some("low");
        }
        if self.effects.contains(&Effect::med_power()) {
            return Some("med");
        }
        if self.effects.contains(&Effect::high_power()) {
            return Some("high");
        }
        if self.effects.contains(&Effect::rig_slot()) {
            return Some("rig");
        }
        if self.category == Category::Drone {
            return Some("drone");
        }
        None
    }

    pub fn is_always_cargo(&self) -> bool {
        self.category == Category::Charge || self.category == Category::Implant
    }
}

std::thread_local!(static CONN: rusqlite::Connection = rusqlite::Connection::open("sqlite-shrunk.sqlite").unwrap());

lazy_static::lazy_static! {
    static ref TYPE_CACHE: RwLock<HashMap<TypeID, Option<Arc<Type>>>> = RwLock::new(HashMap::new());
    static ref NAME_CACHE: RwLock<HashMap<String, TypeID>> = RwLock::new(HashMap::new());
    static ref MAX_TYPE_ID: TypeID = TypeDB::get_max_type_id().unwrap();
}

pub struct TypeDB {}
impl TypeDB {
    fn load_types_from_db(ids: &[TypeID]) -> Result<HashMap<TypeID, Option<Type>>, TypeError> {
        assert!(!ids.is_empty());

        let placeholders = iter::repeat("?")
            .take(ids.len())
            .collect::<Vec<&str>>()
            .join(",");

        struct BasicData {
            id: TypeID,
            name: String,
            category: Category,
        }

        let mut basic_data = CONN.with(|conn| -> Result<_, rusqlite::Error> {
            let query = format!("
                SELECT
                    typeID,
                    typeName,
                    (SELECT categoryID FROM invGroups WHERE invGroups.groupID = invTypes.groupID) categoryID
                FROM invTypes
                WHERE typeID IN ({})
                ORDER BY published ASC
            ", placeholders);

            let mut prepared = conn.prepare(&query)?;
            let rows = prepared.query_map(rusqlite::params_from_iter(ids), |row| {
                Ok(BasicData {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category: Category::from_id(row.get(2)?),
                })
            })?;
            let mut basic = HashMap::new();
            for row in rows {
                let row = row?;
                basic.insert(row.id, row);
            }
            Ok(basic)
        })?;

        let mut attributes = CONN.with(|conn| -> Result<_, rusqlite::Error> {
            let query = format!("
                SELECT typeID, attributeID, COALESCE(valueInt,valueFloat) FROM dgmTypeAttributes WHERE typeID IN ({})
            ", placeholders);

            let mut prepared = conn.prepare(&query)?;
            let rows = prepared.query_map(rusqlite::params_from_iter(ids), |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })?;
            let mut result = HashMap::new();
            for row in rows {
                let row: (TypeID, i32, f32) = row?;
                let (type_id, attribute_id, attribute_value) = row;
                result
                    .entry(type_id)
                    .or_insert_with(HashMap::new)
                    .insert(Attribute::from_id(attribute_id), attribute_value);
            }
            for &id in ids {
                result.entry(id).or_insert_with(HashMap::new);
            }
            Ok(result)
        })?;

        let mut effects = CONN.with(|conn| -> Result<_, rusqlite::Error> {
            let query = format!(
                "
                SELECT typeID, effectID FROM dgmTypeEffects WHERE typeID IN ({})
            ",
                placeholders
            );

            let mut prepared = conn.prepare(&query)?;
            let rows = prepared.query_map(rusqlite::params_from_iter(ids), |row| {
                Ok((row.get(0)?, row.get(1)?))
            })?;

            let mut result = HashMap::new();
            for row in rows {
                let row: (TypeID, i32) = row?;
                let (type_id, effect_id) = row;

                result
                    .entry(type_id)
                    .or_insert_with(HashSet::new)
                    .insert(Effect(effect_id));
            }
            for &id in ids {
                result.entry(id).or_insert_with(HashSet::new);
            }

            Ok(result)
        })?;

        let mut result = HashMap::new();
        for &id in ids {
            if let Some(basic) = basic_data.remove(&id) {
                let attrs = attributes.remove(&id).unwrap();
                let skill_requirements = {
                    let mut reqs = HashMap::new();

                    if let Some(skill_id) = attrs.get(&Attribute::PrimarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::PrimarySkillLevel).unwrap() as SkillLevel,
                        );
                    }
                    if let Some(skill_id) = attrs.get(&Attribute::SecondarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::SecondarySkillLevel).unwrap() as SkillLevel,
                        );
                    }
                    if let Some(skill_id) = attrs.get(&Attribute::TertiarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::TertiarySkillLevel).unwrap() as SkillLevel,
                        );
                    }
                    if let Some(skill_id) = attrs.get(&Attribute::QuaternarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::QuaternarySkillLevel).unwrap() as SkillLevel,
                        );
                    }
                    if let Some(skill_id) = attrs.get(&Attribute::QuinarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::QuinarySkillLevel).unwrap() as SkillLevel,
                        );
                    }
                    if let Some(skill_id) = attrs.get(&Attribute::SenarySkill) {
                        reqs.insert(
                            *skill_id as TypeID,
                            *attrs.get(&Attribute::SenarySkillLevel).unwrap() as SkillLevel,
                        );
                    }

                    reqs
                };

                result.insert(
                    id,
                    Some(Type {
                        id,
                        name: basic.name,
                        category: basic.category,
                        attributes: attrs,
                        effects: effects.remove(&id).unwrap(),
                        skill_requirements,
                    }),
                );
            } else {
                result.insert(id, None);
            }
        }

        Ok(result)
    }

    pub fn load_types(ids: &[TypeID]) -> Result<HashMap<TypeID, Option<Arc<Type>>>, TypeError> {
        let mut unique_ids = HashSet::new();
        for &id in ids {
            unique_ids.insert(id);
        }

        let mut missing = Vec::new();
        let mut result = HashMap::new();

        // Fetch from cache
        {
            let max_id: TypeID = *MAX_TYPE_ID;
            let cache = TYPE_CACHE.read().unwrap();
            for id in &unique_ids {
                if *id > max_id || *id <= 0 {
                    result.insert(*id, None);
                } else if !cache.contains_key(id) {
                    missing.push(*id);
                } else {
                    result.insert(*id, cache.get(id).unwrap().clone());
                }
            }
        }

        if !missing.is_empty() {
            let from_db = Self::load_types_from_db(&missing)?;
            assert!(from_db.len() == missing.len());

            // Save the names just in case we didn't have them yet
            {
                let mut cache = NAME_CACHE.write().unwrap();
                for (id, typ) in &from_db {
                    if let Some(typ) = typ {
                        cache.insert(typ.name.clone(), *id);
                    }
                }
            }

            // Save to cache
            {
                let mut cache = TYPE_CACHE.write().unwrap();
                for (id, typ) in from_db {
                    let type_opt = typ.map(Arc::new);
                    result.insert(id, type_opt.clone());
                    cache.insert(id, type_opt);
                }
            }
        }

        assert!(result.len() == unique_ids.len());

        Ok(result)
    }

    pub fn load_type(id: TypeID) -> Result<Arc<Type>, TypeError> {
        let mut types = Self::load_types(&[id])?;
        assert!(types.len() == 1);
        if let Some(the_type) = types.remove(&id).unwrap() {
            Ok(the_type)
        } else {
            Err(TypeError::NothingMatched)
        }
    }

    pub fn names_of(ids: &[TypeID]) -> Result<HashMap<TypeID, String>, TypeError> {
        let types = Self::load_types(ids)?;
        let mut result = HashMap::new();
        for (id, typ) in types {
            if let Some(typ) = typ {
                result.insert(id, typ.name.clone());
            }
        }
        Ok(result)
    }

    pub fn ids_of<'a>(names: &[&'a str]) -> Result<HashMap<&'a str, TypeID>, TypeError> {
        let mut result = HashMap::new();
        let mut missing = HashSet::new();
        {
            let cache = NAME_CACHE.read().unwrap();
            for &name in names {
                if let Some(id) = cache.get(name) {
                    result.insert(name, *id);
                } else {
                    missing.insert(name);
                }
            }
        }
        if !missing.is_empty() {
            let from_db = CONN.with(|conn| -> Result<_, TypeError> {
                let placeholders = iter::repeat("?").take(missing.len()).collect::<Vec<&str>>().join(",");
                let query = format!("SELECT typeID, typeName FROM invTypes WHERE typeName IN ({}) ORDER BY published ASC", placeholders);

                let mut prepared = conn.prepare(&query)?;
                let rows = prepared.query_map(rusqlite::params_from_iter(missing.iter()), |row| {
                    Ok((row.get(0)?, row.get(1)?))
                })?;

                let mut result: HashMap<String, TypeID> = HashMap::new();
                for row in rows {
                    let (id, name) = row?;
                    result.insert(name, id);
                }

                Ok(result)
            })?;

            for name in missing {
                if let Some(type_id) = from_db.get(name) {
                    result.insert(name, *type_id);
                }
            }

            {
                // Store them in our cache for future use
                let mut cache = NAME_CACHE.write().unwrap();
                for (name, id) in from_db {
                    cache.insert(name, id);
                }
            }
        }

        Ok(result)
    }

    pub fn name_of(id: TypeID) -> Result<String, TypeError> {
        let the_type = Self::load_type(id)?;
        Ok(the_type.name.clone())
    }

    pub fn id_of(name: &str) -> Result<TypeID, TypeError> {
        let mut ids = Self::ids_of(&[name])?;
        if let Some(id) = ids.remove(name) {
            Ok(id)
        } else {
            Err(TypeError::NothingMatched)
        }
    }

    pub fn id_of_fuzzy(name: &str) -> Result<TypeID, TypeError> {
        CONN.with(|conn| {
            let mut prepared = conn.prepare("SELECT typeID FROM invTypes WHERE typeName LIKE ?")?;
            let mut rows = prepared.query([name])?;
            let mut result = None;
            while let Some(row) = rows.next()? {
                if result.is_none() {
                    let type_id = row.get(0)?;
                    result = Some(type_id);
                } else {
                    return Err(TypeError::MultipleMatches);
                }
            }
            match result {
                Some(type_id) => Ok(type_id),
                None => Err(TypeError::NothingMatched),
            }
        })
    }

    fn get_max_type_id() -> Result<TypeID, TypeError> {
        Ok(CONN.with(|conn| {
            conn.query_row("SELECT MAX(typeID) FROM invTypes", [], |row| row.get(0))
        })?)
    }

    pub fn type_variations(id: TypeID) -> Result<HashMap<TypeID, i64>, TypeError> {
        let parent_type_id =
            CONN.with(|conn| -> Result<Option<Option<TypeID>>, rusqlite::Error> {
                conn.query_row(
                    "SELECT parentTypeID FROM invMetaTypes WHERE typeID=?",
                    [id],
                    |row| row.get(0),
                )
                .optional()
            })?;

        let parent_type_id = match parent_type_id {
            Some(Some(i)) => i,
            Some(None) => id,
            None => id,
        };

        let mut metas = HashMap::new();
        metas.insert(parent_type_id, 0);

        CONN.with(|conn| -> Result<_, rusqlite::Error> {
            let mut prepared = conn.prepare(
                "
                SELECT invMetaTypes.typeID, COALESCE(valueInt, valueFloat), metaGroupID
                FROM invMetaTypes LEFT JOIN dgmTypeAttributes
                ON invMetaTypes.typeID = dgmTypeAttributes.typeID
                AND attributeID = 633
                WHERE parentTypeID=?
            ",
            )?;
            let mut rows = prepared.query([parent_type_id])?;
            while let Some(row) = rows.next()? {
                let meta_type_id: TypeID = row.get(0)?;
                let meta_level: Option<f64> = row.get(1)?;
                let meta_group_id: i64 = row.get(2)?;

                if let Some(meta_level) = meta_level {
                    metas.insert(meta_type_id, meta_level as i64);
                } else if meta_group_id == 1 {
                    // T1
                    metas.insert(meta_type_id, 1);
                } else if meta_group_id == 2 {
                    // T2
                    metas.insert(meta_type_id, 2);
                }
            }

            Ok(())
        })?;

        Ok(metas)
    }
}

#[cfg(test)]
mod tests {
    use super::{Attribute, Category, Effect, TypeDB, TypeID};

    fn id_of(s: &str) -> TypeID {
        TypeDB::id_of(s).unwrap()
    }

    #[test]
    fn test_capsule() {
        let item = TypeDB::load_type(670).unwrap();

        assert!(item.id == 670);
        assert!(item.name == "Capsule");
        assert!(item.category == Category::Ship);
        assert_eq!(item.category.category_name(), "ship");

        assert_eq!(TypeDB::name_of(670).unwrap(), item.name);
        assert_eq!(TypeDB::id_of("Capsule").unwrap(), 670);
    }

    #[test]
    fn test_500mn() {
        let name = "Core X-Type 500MN Microwarpdrive";
        let id = id_of(name);
        let item = TypeDB::load_type(id).unwrap();

        assert!(item.category == Category::Module);
        assert_eq!(item.name, name);
        assert_eq!(*item.attributes.get(&Attribute::MetaLevel).unwrap(), 16.0);
        assert!(!item.effects.contains(&Effect::low_power()));
        assert!(item.effects.contains(&Effect::med_power()));
        assert!(!item.effects.contains(&Effect::high_power()));
        assert!(!item.effects.contains(&Effect::rig_slot()));
    }

    #[test]
    fn test_ids_of() {
        let exists = vec![
            "Core X-Type 500MN Microwarpdrive",
            "Gist X-Type 500MN Microwarpdrive",
            "The Friend Ship",
        ];
        let does_not_exist = vec!["TDF Titan", "Core Y-Type 500MN Microwarpdrive"];

        let ids = TypeDB::ids_of(&[exists.clone(), does_not_exist.clone()].concat()).unwrap();

        for name in exists {
            assert!(ids.contains_key(name));
            assert!(*ids.get(name).unwrap() > 0);
        }
        for name in does_not_exist {
            assert!(!ids.contains_key(name));
        }
    }

    #[test]
    fn test_requirements() {
        let t = TypeDB::load_type(id_of("Monitor")).unwrap();
        assert_eq!(t.skill_requirements.get(&id_of("Amarr Cruiser")), Some(&1));
        assert_eq!(
            t.skill_requirements.get(&id_of("Gallente Cruiser")),
            Some(&1)
        );
        assert_eq!(
            t.skill_requirements.get(&id_of("Minmatar Cruiser")),
            Some(&1)
        );
        assert_eq!(
            t.skill_requirements.get(&id_of("Caldari Cruiser")),
            Some(&1)
        );
        assert_eq!(t.skill_requirements.get(&id_of("Flag Cruisers")), Some(&1));
        assert_eq!(t.skill_requirements.len(), 5);
    }

    #[test]
    fn test_variations() {
        let variations =
            TypeDB::type_variations(id_of("Core X-Type 500MN Microwarpdrive")).unwrap();
        assert_eq!(variations.get(&id_of("500MN Microwarpdrive I")), Some(&0));
        assert_eq!(variations.get(&id_of("500MN Microwarpdrive II")), Some(&5));
        assert_eq!(
            variations.get(&id_of("Core X-Type 500MN Microwarpdrive")),
            Some(&16)
        );
    }
}
