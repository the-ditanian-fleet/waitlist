use std::{env, sync::Arc};
use rocket::Request;

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
type DBEngine = sqlx::MySql;


pub type DB = sqlx::Pool<DBEngine>;
pub type DBTX<'c> = sqlx::Transaction<'c, DBEngine>;

#[catch(401)]
fn not_authorized(_req: &Request) -> String {
    format!("401 Authorization Required")
}

#[catch(403)]
fn forbidden(_req: &Request) -> String {
    format!("403 Forbidden")
}

#[catch(404)]
fn not_found(_req: &Request) -> String {
    format!("404 Not Found")
}

#[tokio::main]
async fn main() {
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
        .register("/", catchers![not_authorized, forbidden, not_found])
        .mount("/", routes::routes())
        .manage(application)
        .attach(request_logger::RequestLogger {})
        .launch()
        .await
        .unwrap();
}
