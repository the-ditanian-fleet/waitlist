use crate::config::Config;
use std::sync::Arc;

pub struct Application {
    pub db: Arc<crate::DB>,
    pub config: Config,
    pub esi_client: crate::core::esi::ESIClient,
    pub sse_client: crate::core::sse::SSEClient,
    pub token_secret: Vec<u8>,
}

pub fn new(db: Arc<crate::DB>, config: Config) -> Application {
    Application {
        token_secret: hex::decode(&config.app.token_secret).unwrap(),
        esi_client: crate::core::esi::ESIClient::new(
            db.clone(),
            config.esi.client_id.clone(),
            config.esi.client_secret.clone(),
        ),
        sse_client: crate::core::sse::SSEClient::new(
            config.sse.url.clone(),
            &hex::decode(&config.sse.secret).unwrap(),
        ),
        config,
        db,
    }
}

impl Application {
    pub fn get_db(&self) -> &crate::DB {
        &self.db
    }
}
