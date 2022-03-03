use rocket::serde::json::Json;

use crate::{
    app,
    core::auth::{authorize_character, get_access_keys, AuthenticatedAccount},
    util::{madness::Madness, types::CharacterAndLevel},
};

#[get("/api/pilot/info?<character_id>")]
async fn pilot_info(
    account: AuthenticatedAccount,
    character_id: i64,
    app: &rocket::State<app::Application>,
) -> Result<Json<CharacterAndLevel>, Madness> {
    authorize_character(&app.db, &account, character_id, Some("pilot-view")).await?;

    let character = sqlx::query!("SELECT id, name FROM `character` WHERE id=?", character_id)
        .fetch_one(app.get_db())
        .await?;
    let admin = sqlx::query!(
        "SELECT level FROM admins WHERE character_id=?",
        character.id
    )
    .fetch_optional(app.get_db())
    .await?;
    let mut tags = Vec::new();
    if let Some(admin) = admin {
        let keys = get_access_keys(&admin.level).unwrap();
        if keys.contains("waitlist-tag:BASTION") {
            tags.push("BASTION");
        }
        if keys.contains("waitlist-tag:WEB") {
            tags.push("WEB");
        }
        if keys.contains("waitlist-tag:HQ-FC") {
            tags.push("HQ-FC");
        } else if keys.contains("waitlist-tag:LOGI") {
            tags.push("LOGI");
        }
    }
    Ok(Json(CharacterAndLevel {
        id: character.id,
        name: character.name,
        tags: tags,
    }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![pilot_info]
}
