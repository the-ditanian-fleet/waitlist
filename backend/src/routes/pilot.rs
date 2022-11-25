use rocket::serde::json::Json;

use crate::{
    app,
    core::auth::{authorize_character, get_access_keys, AuthenticatedAccount},
    util::{
        madness::Madness,
        types::{Character, CharacterAndLevel},
    },
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

    let active_bans = app.ban_service.character_bans(character.id).await?;

    Ok(Json(CharacterAndLevel {
        id: character.id,
        name: character.name,
        tags,
        active_bans,
    }))
}

#[get("/api/pilot/alts?<character_id>")]
async fn alt_info(
    account: AuthenticatedAccount,
    character_id: i64,
    app: &rocket::State<app::Application>,
) -> Result<Json<Vec<Character>>, Madness> {
    account.require_access("waitlist-tag:HQ-FC")?;

    let characters = sqlx::query_as!(
        Character,
        "SELECT
            `id`,`name`,`corporation_id`
        FROM
            `character`
        JOIN
            `alt_character`AS `alt` ON (alt.alt_id=id OR alt.account_id=id)       
        WHERE
            (alt.alt_id=? OR alt.account_id=?) AND id!=?
        ORDER BY 
            `name` ASC",
        character_id,
        character_id,
        character_id
    )
    .fetch_all(app.get_db())
    .await?;

    Ok(Json(characters))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        alt_info,   //  GET     /api/pilot/alts
        pilot_info  //  GET     /api/pilot/info
    ]
}
