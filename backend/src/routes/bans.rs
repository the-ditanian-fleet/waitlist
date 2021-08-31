use std::collections::HashSet;

use crate::{
    app::Application,
    core::auth::AuthenticatedAccount,
    data::character,
    util::madness::{Madness, UserMadness},
    util::types::Character,
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
        "REPLACE INTO ban (kind, id, expires_at, added_by) VALUES (?, ?, ?, ?)",
        input.kind,
        input.id,
        expiry,
        account.id
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
    added_by: Option<Character>,
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

    let rows =
        sqlx::query!("SELECT id, kind, expires_at, added_by FROM ban ORDER BY kind ASC, id ASC")
            .fetch_all(app.get_db())
            .await?;

    let mut character_ids = HashSet::new();
    for row in &rows {
        if let Some(character) = row.added_by {
            character_ids.insert(character);
        }
        if row.kind == "character" {
            character_ids.insert(row.id);
        }
    }
    let character_ids = character_ids.into_iter().collect::<Vec<_>>();
    let character_lookup = character::lookup(app.get_db(), &character_ids).await?;

    let bans = rows
        .into_iter()
        .map(|ban| {
            let added_by = ban
                .added_by
                .and_then(|id| character_lookup.get(&id).cloned());
            let name = match ban.kind.as_str() {
                "character" => character_lookup.get(&ban.id).map(|c| c.name.clone()),
                _ => None,
            };

            BanListResponseEntry {
                kind: ban.kind,
                id: ban.id,
                expires_at: ban.expires_at.map(|ts| ts.timestamp()),
                name,
                added_by,
            }
        })
        .collect();

    Ok(Json(BanListResponse { bans }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_bans, remove_ban, add_ban]
}
