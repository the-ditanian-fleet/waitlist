use std::{collections::HashMap, iter};

use crate::util::types::Character;

pub async fn lookup(db: &crate::DB, ids: &[i64]) -> Result<HashMap<i64, Character>, sqlx::Error> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let placeholders = iter::repeat("?")
        .take(ids.len())
        .collect::<Vec<_>>()
        .join(",");
    let query_str = format!(
        "SELECT id, name FROM `character` WHERE id IN ({})",
        placeholders
    );
    let mut query = sqlx::query_as::<_, CharacterRecord>(&query_str);

    #[derive(Debug, sqlx::FromRow)]
    struct CharacterRecord {
        id: i64,
        name: String,
    }
    for id in ids {
        query = query.bind(id);
    }
    Ok(query
        .fetch_all(db)
        .await?
        .into_iter()
        .map(|record| {
            (
                record.id,
                Character {
                    id: record.id,
                    name: record.name,
                },
            )
        })
        .collect())
}
