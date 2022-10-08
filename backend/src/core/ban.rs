use std::sync::Arc;

use crate::util::{
    madness::Madness,
    types::{Ban, Character, Entity},
};

pub struct BanService {
    db: Arc<crate::DB>,
}

impl BanService {
    pub fn new(database: Arc<crate::DB>) -> BanService {
        BanService { db: database }
    }

    pub async fn character_bans(&self, character_id: i64) -> Result<Option<Vec<Ban>>, Madness> {
        if let Some(bans) = self.active_bans(character_id, "Character").await? {
            Ok(Some(bans))
        } else {
            if let Some(character) = sqlx::query!(
                "SELECT corporation_id FROM `character` WHERE id=?",
                character_id
            )
            .fetch_optional(self.db.as_ref())
            .await?
            {
                if let Some(corporation_id) = character.corporation_id {
                    if let Some(bans) = self.corporation_bans(corporation_id).await? {
                        return Ok(Some(bans));
                    }
                }
            }
            Ok(None)
        }
    }

    pub async fn corporation_bans(&self, corporation_id: i64) -> Result<Option<Vec<Ban>>, Madness> {
        if let Some(bans) = self.active_bans(corporation_id, "Corporation").await? {
            Ok(Some(bans))
        } else {
            if let Some(corporation) = sqlx::query!(
                "SELECT alliance_id as `alliance_id?` FROM corporation WHERE id=?",
                corporation_id
            )
            .fetch_optional(self.db.as_ref())
            .await?
            {
                if let Some(alliance_id) = corporation.alliance_id {
                    if let Some(bans) = self.aliance_bans(alliance_id).await? {
                        return Ok(Some(bans));
                    }
                }
            }

            Ok(None)
        }
    }

    pub async fn aliance_bans(&self, alliance_id: i64) -> Result<Option<Vec<Ban>>, Madness> {
        if let Some(bans) = self.active_bans(alliance_id, "Alliance").await? {
            Ok(Some(bans))
        } else {
            Ok(None)
        }
    }

    pub async fn active_bans(
        &self,
        entity_id: i64,
        entity_type: &str,
    ) -> Result<Option<Vec<Ban>>, Madness> {
        let now: i64 = chrono::Utc::now().timestamp();

        let rows = sqlx::query!(
            "SELECT 
                ban.id,
                entity_id,
                entity_name,
                entity_type,
                issued_at,
                public_reason,
                reason,
                revoked_at,
                issuer.id AS `issued_by_id`,
                issuer.name AS `issued_by_name`
            FROM
                ban
            JOIN
                `character` as issuer ON issued_by=issuer.id
            WHERE
                entity_id=? AND entity_type=? AND revoked_at IS NULL OR revoked_at > ?",
            entity_id,
            entity_type,
            now
        )
        .fetch_all(self.db.as_ref())
        .await?;

        if rows.len() == 0 {
            return Ok(None);
        }

        let bans: Vec<Ban> = rows
            .into_iter()
            .map(|ban| Ban {
                id: Some(ban.id),
                entity: Some(Entity {
                    id: ban.entity_id,
                    name: ban.entity_name,
                    category: ban.entity_type,
                }),
                issued_at: Some(ban.issued_at),
                issued_by: Some(Character {
                    id: ban.issued_by_id,
                    name: ban.issued_by_name,
                }),
                reason: ban.reason,
                public_reason: ban.public_reason,
                revoked_at: ban.revoked_at,
                revoked_by: None,
            })
            .collect();

        return Ok(Some(bans));
    }

    pub async fn all_bans(
        &self,
        entity_id: i64,
        entity_type: &str,
    ) -> Result<Option<Vec<Ban>>, Madness> {
        let rows = sqlx::query!(
            "SELECT 
                ban.id,
                entity_id,
                entity_name,
                entity_type,
                issued_at,
                public_reason,
                reason,
                revoked_at,
                issuer.id AS `issued_by_id`,
                issuer.name AS `issued_by_name`,
                revoked_by
            FROM
                ban
            JOIN
                `character` as issuer ON issued_by=issuer.id
            WHERE
                entity_id=? AND entity_type=?
            ORDER BY
                issued_at",
            entity_id,
            entity_type,
        )
        .fetch_all(self.db.as_ref())
        .await?;

        if rows.len() == 0 {
            return Ok(None);
        }

        let mut bans: Vec<Ban> = rows
            .into_iter()
            .map(|ban| Ban {
                id: Some(ban.id),
                entity: Some(Entity {
                    id: ban.entity_id,
                    name: ban.entity_name,
                    category: ban.entity_type,
                }),
                issued_at: Some(ban.issued_at),
                issued_by: Some(Character {
                    id: ban.issued_by_id,
                    name: ban.issued_by_name,
                }),
                reason: ban.reason,
                public_reason: ban.public_reason,
                revoked_at: ban.revoked_at,
                revoked_by: match ban.revoked_by {
                    Some(id) => Some(Character {
                        id,
                        name: "".to_string(),
                    }),
                    None => None,
                },
            })
            .collect();

        // foreach ban, go through and look up name
        for b in bans.iter_mut() {
            if let Some(revoked_by) = &b.revoked_by {
                if let Ok(row) = sqlx::query!("SELECT * FROM `character` WHERE id=?", revoked_by.id)
                    .fetch_optional(self.db.as_ref())
                    .await
                {
                    b.revoked_by = Some(Character {
                        id: revoked_by.id,
                        name: row.unwrap().name,
                    })
                }
            }
        }

        return Ok(Some(bans));
    }
}