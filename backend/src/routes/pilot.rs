use rocket::serde::json::Json;

use crate::{
    app,
    core::auth::{authorize_character, AuthenticatedAccount},
    util::{madness::Madness, types::Character},
};

#[get("/api/pilot/info?<character_id>")]
async fn pilot_info(
    account: AuthenticatedAccount,
    character_id: i64,
    app: &rocket::State<app::Application>,
) -> Result<Json<Character>, Madness> {
    authorize_character(&app.db, &account, character_id, Some("pilot-view")).await?;

    let character = sqlx::query!("SELECT id, name FROM `character` WHERE id=?", character_id)
        .fetch_one(app.get_db())
        .await?;

    Ok(Json(Character {
        id: character.id,
        name: character.name,
    }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![pilot_info]
}
