use serde::Deserialize;

#[derive(Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub min_connections: u32,
    pub max_connections: u32,
    pub idle_timeout: u64,
    pub connect_timeout: u64,
}

#[derive(Deserialize, Clone)]
pub struct ESIConfig {
    pub client_id: String,
    pub client_secret: String,
    pub url: String,
}

#[derive(Deserialize, Clone)]
pub struct AppConfig {
    pub token_secret: String,
}

#[derive(Deserialize, Clone)]
pub struct SSEConfig {
    pub url: String,
    pub secret: String,
}

#[derive(Deserialize, Clone)]
pub struct FleetUpdaterConfig {
    pub enable: bool,
    pub min_in_fleet: usize,
}

#[derive(Deserialize, Clone)]
pub struct SkillUpdaterConfig {
    pub enable: bool,
    pub runtime: f64,
}

#[derive(Deserialize, Clone)]
pub struct Config {
    pub database: DatabaseConfig,
    pub app: AppConfig,
    pub esi: ESIConfig,
    pub sse: SSEConfig,
    pub fleet_updater: FleetUpdaterConfig,
    pub skill_updater: SkillUpdaterConfig,
}
