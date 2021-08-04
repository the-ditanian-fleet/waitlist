use crate::{
    app::Application,
    core::auth::AuthenticatedAccount,
    util::madness::{Madness, UserMadness},
};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct AddBanRequest {
    kind: String,
    id: i64,
    duration: Option<i64>,
}

#[post("/api/bans/add", data = "<input>")]
async fn add_ban(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<AddBanRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("bans-manage")?;

    if input.kind != "character" && input.kind != "corporation" && input.kind != "alliance" {
        return Err(UserMadness::BadRequest("Invalid argument for 'kind'".to_string()).into());
    }

    let expiry = match input.duration {
        None => None,
        Some(0) => None,
        Some(i) if i < 0 => {
            return Err(
                UserMadness::BadRequest("Duration must be zero or positive".to_string()).into(),
            )
        }
        Some(i) => Some(chrono::Utc::now() + chrono::Duration::minutes(i)),
    };

    sqlx::query!(
        "REPLACE INTO ban (kind, id, expires_at) VALUES (?, ?, ?)",
        input.kind,
        input.id,
        expiry
    )
    .execute(app.get_db())
    .await?;

    Ok("OK")
}

#[derive(Debug, Deserialize)]
struct RemoveBanRequest {
    kind: String,
    id: i64,
}

#[post("/api/bans/remove", data = "<input>")]
async fn remove_ban(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<RemoveBanRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("bans-manage")?;

    sqlx::query!(
        "DELETE FROM ban WHERE kind=? AND id=?",
        input.kind,
        input.id
    )
    .execute(app.get_db())
    .await?;

    Ok("OK")
}

#[derive(Debug, Serialize)]
struct BanListResponseEntry {
    kind: String,
    id: i64,
    expires_at: Option<i64>,
    name: Option<String>,
}

#[derive(Debug, Serialize)]
struct BanListResponse {
    bans: Vec<BanListResponseEntry>,
}

#[get("/api/bans/list")]
async fn list_bans(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<BanListResponse>, Madness> {
    account.require_access("bans-view")?;

    // Purge expired bans
    let now = chrono::Utc::now();
    sqlx::query!("DELETE FROM ban WHERE expires_at < ?", now)
        .execute(app.get_db())
        .await?;

    let bans = sqlx::query!(
        "
            SELECT id, kind, expires_at, (SELECT name FROM `character` WHERE id=ban.id LIMIT 1) `character_name?` FROM ban ORDER BY kind ASC, id ASC
        ").fetch_all(app.get_db()).await?.into_iter()
        .map(|row| BanListResponseEntry{
            expires_at: row.expires_at.map(|t| t.timestamp()),
            name: if row.kind == "character" {
                row.character_name
            } else {
                None
            },
            id: row.id,
            kind: row.kind,
        })
        .collect();

    Ok(Json(BanListResponse { bans }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_bans, remove_ban, add_ban]
}
