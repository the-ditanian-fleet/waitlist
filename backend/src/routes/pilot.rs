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

    let mut tags: Vec<String> = Vec::new();

    // Add the ACL tag to the array
    if let Some(admin) = sqlx::query!("SELECT role FROM admin WHERE character_id=?", character.id)
        .fetch_optional(app.get_db())
        .await?
    {
        let keys = get_access_keys(&admin.role).unwrap();
        if keys.contains("waitlist-tag:HQ-FC") {
            tags.push("HQ-FC".to_string());
        } else if keys.contains("waitlist-tag:TRAINEE") {
            tags.push("TRAINEE".to_string());
        };
    }

    // Add specialist badges to the tags array
    for badge in sqlx::query!("SELECT b.name from badge_assignment AS ba INNER JOIN badge AS b on b.id=ba.BadgeId WHERE ba.CharacterId=?", character.id)
        .fetch_all(app.get_db())
        .await?
        .iter() {
            tags.push(badge.name.to_string());
        };

    Ok(Json(CharacterAndLevel {
        id: character.id,
        name: character.name,
        tags,
    }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![pilot_info]
}
