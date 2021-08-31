use crate::core::esi;
use crate::data;
use crate::{config::Config, util::madness::Madness};
use rand::seq::SliceRandom;
use std::sync::Arc;

pub struct SkillUpdater {
    esi_client: esi::ESIClient,
    db: Arc<crate::DB>,
    config: Config,
}

impl SkillUpdater {
    pub fn new(db: Arc<crate::DB>, config: Config) -> SkillUpdater {
        SkillUpdater {
            esi_client: esi::ESIClient::new(
                db.clone(),
                config.esi.client_id.clone(),
                config.esi.client_secret.clone(),
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
            if let Err(e) = self.run_once().await {
                error!("Error in skill updater: {:#?}", e);
            };

            // Back off, and also to avoid infinite loops if we have 0 tokens stored
            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
        }
    }

    fn get_db(&self) -> &crate::DB {
        &self.db
    }

    async fn run_once(&self) -> Result<(), Madness> {
        let mut to_update = sqlx::query!("SELECT character_id FROM refresh_token")
            .fetch_all(self.get_db())
            .await?;

        let runtime_per_char =
            (self.config.skill_updater.runtime as f64) / (to_update.len() as f64);
        let sleep_duration = tokio::time::Duration::from_secs_f64(runtime_per_char);

        to_update.shuffle(&mut rand::thread_rng());
        let to_update_iter = to_update.into_iter().map(|r| r.character_id);

        for character_id in to_update_iter {
            match data::skills::load_skills(&self.esi_client, &self.db, character_id).await {
                Ok(_) => (),
                Err(data::skills::SkillsError::ESIError(e)) => {
                    warn!("Ignoring error in skill updater: {:#?}", e);
                }
                Err(e) => return Err(e.into()),
            };
            tokio::time::sleep(sleep_duration).await;
        }

        Ok(())
    }
}
