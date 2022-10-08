use serde::Deserialize;
use std::sync::Arc;

use crate::util::madness::Madness;

#[derive(Debug, Deserialize)]
struct CharacterResponse {
    name: String,
    corporation_id: i64,
}

#[derive(Debug, Deserialize)]
struct CorporationResponse {
    name: String,
    alliance_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct AllianceResponse {
    name: String,
}

pub struct AffiliationService {
    db: Arc<crate::DB>,
    esi_client: crate::core::esi::ESIClient,
}

impl AffiliationService {
    pub fn new(
        database: Arc<crate::DB>,
        esi_client: crate::core::esi::ESIClient,
    ) -> AffiliationService {
        AffiliationService {
            db: database,
            esi_client,
        }
    }

    pub async fn update_character_affiliation(&self, id: i64) -> Result<(), Madness> {
        let character: CharacterResponse = self
            .esi_client
            .get_unauthenticated(&format!("/latest/characters/{}", id))
            .await?;
        self.update_corp_affiliation(character.corporation_id)
            .await?;

        if let None = sqlx::query!("SELECT * FROM `character` WHERE id=?", id)
            .fetch_optional(self.db.as_ref())
            .await?
        {
            sqlx::query!(
                "INSERT INTO `character` (id, name, corporation_id) VALUES (?, ?, ?)",
                id,
                character.name,
                character.corporation_id
            )
            .execute(self.db.as_ref())
            .await?;
        } else {
            sqlx::query!(
                "UPDATE `character` SET name=?, corporation_id=?",
                character.name,
                character.corporation_id
            )
            .execute(self.db.as_ref())
            .await?;
        }

        Ok(())
    }

    pub async fn update_corp_affiliation(&self, id: i64) -> Result<(), Madness> {
        let corporation = sqlx::query!("SELECT * FROM corporation WHERE id=?", id)
            .fetch_optional(self.db.as_ref())
            .await?;

        let now = chrono::Utc::now().timestamp();

        let mut known: bool = false;
        if let Some(corp) = corporation {
            known = true;

            // If the corp was updated in the last 24h, we don't need to fetch it again
            if corp.updated_at + 60 * 60 * 24 > now {
                return Ok(());
            }
        }

        let esi_res: CorporationResponse = self
            .esi_client
            .get_unauthenticated(&format!("/latest/corporations/{}", id))
            .await?;
        if let Some(alliance_id) = esi_res.alliance_id {
            self.update_alliance(alliance_id).await?;
        }

        if !known {
            sqlx::query!(
                "INSERT INTO corporation (id, name, alliance_id, updated_at) VALUES (?, ?, ?, ?)",
                id,
                esi_res.name,
                esi_res.alliance_id,
                now
            )
            .execute(self.db.as_ref())
            .await?;
        } else {
            sqlx::query!(
                "UPDATE corporation SET name=?, alliance_id=?, updated_at=? WHERE id=?",
                esi_res.name,
                esi_res.alliance_id,
                now,
                id
            )
            .execute(self.db.as_ref())
            .await?;
        }

        Ok(())
    }

    pub async fn update_alliance(&self, id: i64) -> Result<(), Madness> {
        let esi_res: AllianceResponse = self
            .esi_client
            .get_unauthenticated(&format!("/latest/alliances/{}", id))
            .await?;
        if let None = sqlx::query!("SELECT * FROM alliance WHERE id=?", id)
            .fetch_optional(self.db.as_ref())
            .await?
        {
            sqlx::query!(
                "INSERT INTO alliance (`id`, `name`) VALUES (?, ?)",
                id,
                esi_res.name
            )
            .fetch_optional(self.db.as_ref())
            .await?;
        } else {
            sqlx::query!("UPDATE alliance SET name=? WHERE id=?", esi_res.name, id)
                .fetch_optional(self.db.as_ref())
                .await?;
        }

        Ok(())
    }
}