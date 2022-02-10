use crate::core::esi::{self, ESIScope};
use crate::data::character;
use crate::{config::Config, util::madness::Madness};
use eve_data_core::TypeID;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use super::sse;

pub struct FleetUpdater {
    esi_client: esi::ESIClient,
    sse_client: sse::SSEClient,
    db: Arc<crate::DB>,
    config: Config,
}

impl FleetUpdater {
    pub fn new(db: Arc<crate::DB>, config: Config) -> FleetUpdater {
        FleetUpdater {
            esi_client: esi::ESIClient::new(
                db.clone(),
                config.esi.client_id.clone(),
                config.esi.client_secret.clone(),
            ),
            sse_client: sse::SSEClient::new(
                config.sse.url.clone(),
                &hex::decode(&config.sse.secret).unwrap(),
            ),
            db,
            config,
        }
    }

    pub fn start(self) {
        tokio::spawn(async move {
            self.run().await;
        });
    }

    async fn run(self) {
        loop {
            let sleep_time = match self.run_once().await {
                Ok(()) => 6,
                Err(e) => {
                    error!("Error in fleet updater: {:#?}", e);
                    30
                }
            };

            tokio::time::sleep(tokio::time::Duration::from_secs(sleep_time)).await;
        }
    }

    fn get_db(&self) -> &crate::DB {
        &self.db
    }

    async fn run_once(&self) -> Result<(), Madness> {
        // XXX Get global update lock

        let fleets = sqlx::query!("SELECT id FROM fleet")
            .fetch_all(self.get_db())
            .await?;

        for fleet in fleets {
            self.update_fleet(fleet.id).await?;
        }

        Ok(())
    }

    async fn update_fleet(&self, fleet_id: i64) -> Result<(), Madness> {
        let fleet = sqlx::query!("SELECT * FROM fleet WHERE id = ?", fleet_id)
            .fetch_one(self.get_db())
            .await?;
        let members_raw =
            match esi::fleet_members::get(&self.esi_client, fleet_id, fleet.boss_id).await {
                Ok(m) => m,
                Err(
                    esi::ESIError::Status(403)
                    | esi::ESIError::Status(404)
                    | esi::ESIError::NoToken
                    | esi::ESIError::MissingScope,
                ) => {
                    // 403/404 => Delete the fleet, move on
                    let mut tx = self.get_db().begin().await?;
                    sqlx::query!("DELETE FROM fleet_squad WHERE fleet_id=?", fleet_id)
                        .execute(&mut tx)
                        .await?;
                    sqlx::query!("DELETE FROM fleet WHERE id=?", fleet_id)
                        .execute(&mut tx)
                        .await?;
                    tx.commit().await?;
                    return Ok(());
                }
                Err(e) => return Err(Madness::from(e)),
            };
        let members: HashMap<_, _> = members_raw.iter().map(|m| (m.character_id, m)).collect();
        let member_ids: Vec<i64> = members.iter().map(|(&id, _mem)| id).collect();

        {
            // Update characters to make sure we have each in the database
            let characters = character::lookup(self.get_db(), &member_ids).await?;
            for &id in &member_ids {
                if !characters.contains_key(&id) {
                    #[derive(Deserialize)]
                    struct CharacterResponse {
                        name: String,
                    }

                    let character_info: CharacterResponse = self
                        .esi_client
                        .get(
                            &format!("/v5/characters/{}/", id),
                            fleet.boss_id,
                            ESIScope::PublicData,
                        )
                        .await?;

                    sqlx::query!(
                        "REPLACE INTO `character` (id, name) VALUES (?, ?)",
                        id,
                        character_info.name
                    )
                    .execute(self.get_db())
                    .await?;
                }
            }
        }

        let changed_waitlist_ids: Vec<i64> = {
            // Update the waitlist: remove people who are in fleet
            let mut changed = HashSet::new();

            let on_waitlist: HashMap<i64, _> =
                sqlx::query!("SELECT entry_id, waitlist_id, character_id, is_alt FROM waitlist_entry_fit JOIN waitlist_entry ON waitlist_entry_fit.entry_id=waitlist_entry.id")
                    .fetch_all(self.get_db())
                    .await?
                    .into_iter()
                    .map(|r| (r.character_id, r))
                    .collect();

            let mut tx = self.get_db().begin().await?;
            for &id in &member_ids {
                if let Some(record) = on_waitlist.get(&id) {
                    changed.insert(record.waitlist_id);
                    if record.is_alt > 0 {
                        sqlx::query!(
                            "DELETE FROM waitlist_entry_fit WHERE character_id=?",
                            record.character_id
                        )
                        .execute(&mut tx)
                        .await?;
                    } else {
                        sqlx::query!(
                            "DELETE FROM waitlist_entry_fit WHERE entry_id=? AND is_alt = 0",
                            record.entry_id
                        )
                        .execute(&mut tx)
                        .await?;
                    }
                }
            }
            sqlx::query!("DELETE FROM waitlist_entry WHERE id NOT IN (SELECT entry_id FROM waitlist_entry_fit)").execute(&mut tx).await?;
            tx.commit().await?;

            changed.into_iter().collect()
        };

        let fleet_comp_changed: bool = {
            // Update the fleet activity data
            let current_time = chrono::Utc::now().timestamp();
            let mut new_fleet_comp = false;

            let mut tx = self.get_db().begin().await?;
            let stored_in_fleet: HashMap<i64, _> = sqlx::query!(
                "SELECT * FROM fleet_activity WHERE fleet_id=? AND has_left=0",
                fleet_id
            )
            .fetch_all(&mut tx)
            .await?
            .into_iter()
            .map(|r| (r.character_id, r))
            .collect();

            // Require a certain amount of toons in fleet before we track time
            let have_in_fleet = match members.len() >= self.config.fleet_updater.min_in_fleet {
                true => members.clone(),
                false => HashMap::new(),
            };

            // Detect newly joined members
            for (&id, member) in &have_in_fleet {
                let is_boss = (fleet.boss_id == id) as i8;

                let mut should_insert = false;
                if let Some(stored) = stored_in_fleet.get(&id) {
                    if (stored.hull as TypeID) == member.ship_type_id
                        && (stored.is_boss as i8) == is_boss
                    {
                        if stored.last_seen < current_time - 60 {
                            sqlx::query!(
                                "UPDATE fleet_activity SET last_seen=? WHERE id=?",
                                current_time,
                                stored.id
                            )
                            .execute(&mut tx)
                            .await?;
                        }
                    } else {
                        sqlx::query!(
                            "UPDATE fleet_activity SET has_left=1, last_seen=? WHERE id=?",
                            current_time,
                            stored.id
                        )
                        .execute(&mut tx)
                        .await?;
                        should_insert = true;
                    }
                } else {
                    should_insert = true;
                }

                if should_insert {
                    sqlx::query!(
                        "INSERT INTO fleet_activity (character_id, fleet_id, first_seen, last_seen, is_boss, hull, has_left) VALUES (?, ?, ?, ?, ?, ?, 0)",
                        member.character_id, fleet_id, current_time, current_time, is_boss, member.ship_type_id,
                    ).execute(&mut tx).await?;
                    new_fleet_comp = true;
                }
            }

            // Detect members that left
            for (id, stored) in stored_in_fleet {
                if !have_in_fleet.contains_key(&id) {
                    sqlx::query!("UPDATE fleet_activity SET has_left=1 WHERE id=?", stored.id)
                        .execute(&mut tx)
                        .await?;
                    new_fleet_comp = true;
                }
            }

            tx.commit().await?;

            new_fleet_comp
        };

        self.notify_sse(fleet_id, &changed_waitlist_ids, fleet_comp_changed)
            .await?;

        Ok(())
    }

    async fn notify_sse(
        &self,
        fleet_id: i64,
        changed_waitlist_ids: &[i64],
        fleet_comp_changed: bool,
    ) -> Result<(), Madness> {
        #[derive(Debug, Serialize)]
        struct WaitlistUpdate {
            waitlist_id: i64,
        }
        #[derive(Debug, Serialize)]
        struct NewFleetComp {
            fleet_id: i64,
        }

        let mut events = Vec::new();
        for &id in changed_waitlist_ids {
            events.push(sse::Event::new_json(
                "waitlist",
                "waitlist_update",
                &WaitlistUpdate { waitlist_id: id },
            ));
        }
        if fleet_comp_changed {
            events.push(sse::Event::new_json(
                "fleet_comp",
                "comp_update",
                &NewFleetComp { fleet_id },
            ))
        }

        if !events.is_empty() {
            self.sse_client.submit(events).await?;
        }

        Ok(())
    }
}
