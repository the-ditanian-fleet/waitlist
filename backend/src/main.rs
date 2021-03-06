use std::{env, sync::Arc};

mod app;
mod config;
mod core;
mod data;
mod request_logger;
mod routes;
mod tdf;
mod util;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate eve_data_macros;

extern crate sqlx;

#[cfg(feature = "mysql")]
type DBEngine = sqlx::MySql;
#[cfg(not(feature = "mysql"))]
type DBEngine = sqlx::Sqlite;

pub type DB = sqlx::Pool<DBEngine>;
pub type DBTX<'c> = sqlx::Transaction<'c, DBEngine>;

#[tokio::main]
async fn main() {
    #[cfg(feature = "sqlite")]
    let options = sqlx::sqlite::SqlitePoolOptions::new();
    #[cfg(feature = "mysql")]
    let options = sqlx::mysql::MySqlPoolOptions::new();

    let config_file = env::var("WAITLIST_CONFIG").unwrap_or_else(|_| "./config.toml".to_string());
    let raw_config = std::fs::read_to_string(&config_file).expect("Could not load config");
    let config: config::Config = toml::from_str(&raw_config).expect("Could not load config");

    let database = options
        .idle_timeout(std::time::Duration::from_secs(config.database.idle_timeout))
        .connect_timeout(std::time::Duration::from_secs(
            config.database.connect_timeout,
        ))
        .min_connections(config.database.min_connections)
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await
        .unwrap();
    let database = Arc::new(database);

    if config.fleet_updater.enable {
        let fleet_updater =
            core::fleet_updater::FleetUpdater::new(database.clone(), config.clone());
        fleet_updater.start();
    }

    if config.skill_updater.enable {
        let skill_updater =
            core::skill_updater::SkillUpdater::new(database.clone(), config.clone());
        skill_updater.start();
    }

    let application = app::new(database, config);
    rocket::build()
        .mount("/", routes::routes())
        .manage(application)
        .attach(request_logger::RequestLogger {})
        .launch()
        .await
        .unwrap();
}
