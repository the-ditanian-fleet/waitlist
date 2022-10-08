use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

use crate::app;
use crate::core::auth::{AuthenticatedAccount, AuthenticationError, CookieSetter};
use crate::core::esi::ESIScope;
use crate::util::{madness::Madness, types};

#[derive(Serialize)]
struct WhoamiResponse {
    account_id: i64,
    access: Vec<&'static str>,
    characters: Vec<types::Character>,
}

#[get("/api/auth/whoami")]
async fn whoami(
    app: &rocket::State<app::Application>,
    account: AuthenticatedAccount,
) -> Result<Json<WhoamiResponse>, Madness> {
    let character = sqlx::query!("SELECT id, name FROM `character` WHERE id = ?", account.id)
        .fetch_one(app.get_db())
        .await?;
    let mut characters = vec![types::Character {
        id: character.id,
        name: character.name,
    }];

    let alts = sqlx::query!(
        "SELECT id, name FROM alt_character JOIN `character` ON alt_character.alt_id = `character`.id WHERE account_id = ?",
        account.id
    )
    .fetch_all(app.get_db())
    .await?;

    for alt in alts {
        characters.push(types::Character {
            id: alt.id,
            name: alt.name,
        });
    }

    let mut access_levels = Vec::new();
    for key in account.access {
        access_levels.push(key.as_str());
    }

    Ok(Json(WhoamiResponse {
        account_id: account.id,
        access: access_levels,
        characters,
    }))
}

#[get("/api/auth/logout")]
async fn logout<'r>(
    app: &rocket::State<app::Application>,
    account: Option<AuthenticatedAccount>,
) -> Result<CookieSetter, Madness> {
    if let Some(account) = account {
        sqlx::query!(
            "DELETE FROM alt_character WHERE account_id = ? OR alt_id = ?",
            account.id,
            account.id
        )
        .execute(app.get_db())
        .await?;
    }

    Ok(CookieSetter(
        "".to_string(),
        app.config.esi.url.starts_with("https:"),
    ))
}

#[get("/api/auth/login_url?<alt>&<fc>")]
fn login_url(alt: bool, fc: bool, app: &rocket::State<app::Application>) -> String {
    let state = match alt {
        true => "alt",
        false => "normal",
    };

    let mut scopes = vec![
        ESIScope::PublicData,
        ESIScope::Skills_ReadSkills_v1,
        ESIScope::Clones_ReadImplants_v1,
    ];
    if fc {
        scopes.extend(vec![
            ESIScope::Fleets_ReadFleet_v1,
            ESIScope::Fleets_WriteFleet_v1,
            ESIScope::UI_OpenWindow_v1,
            ESIScope::Search_v1,
        ])
    }

    format!(
        "https://login.eveonline.com/v2/oauth/authorize?response_type=code&redirect_uri={}&client_id={}&scope={}&state={}",
        app.config.esi.url,
        app.config.esi.client_id,
        scopes.iter().fold(String::new(), |acc, scope| acc + " " + scope.as_str()).trim_end(),
        state
    )
}

#[derive(Deserialize)]
struct CallbackData<'r> {
    code: &'r str,
    state: Option<&'r str>,
}

#[derive(Serialize)]
struct PublicBanPayload {
    category: String,
    expires_at: Option<i64>,
    reason: Option<String>,
}

#[post("/api/auth/cb", data = "<input>")]
async fn callback(
    input: Json<CallbackData<'_>>,
    app: &rocket::State<app::Application>,
    account_raw: Result<AuthenticatedAccount, AuthenticationError>,
) -> Result<CookieSetter, Madness> {
    let account = match account_raw {
        Err(AuthenticationError::MissingCookie) => None,
        Err(AuthenticationError::InvalidToken) => None,
        Err(AuthenticationError::DatabaseError(e)) => return Err(e.into()),
        Ok(acc) => Some(acc),
    };

    let character_id = app
        .esi_client
        .process_authorization_code(input.code)
        .await?;

    // Update the character's corporation and aliance information
    app.affiliation_service
        .update_character_affiliation(character_id)
        .await?;

    if let Some(ban) = app.ban_service.character_bans(character_id).await? {
        let ban = ban.first().unwrap();

        let payload = PublicBanPayload {
            category: ban.entity.to_owned().unwrap().category,
            expires_at: ban.revoked_at,
            reason: ban.public_reason.to_owned(),
        };

        if let Ok(json) = serde_json::to_string(&payload) {
            return Err(Madness::Forbidden(json));
        }
        return Err(Madness::BadRequest(format!(
            "You cannot login due to a ban. An error occurred when trying to retreive the details, please contact council for more information."
        )));
    }

    let logged_in_account =
        if input.state.is_some() && input.state.unwrap() == "alt" && account.is_some() {
            let account = account.unwrap();
            if account.id != character_id {
                let is_admin = sqlx::query!(
                    "SELECT character_id FROM admin WHERE character_id = ?",
                    character_id
                )
                .fetch_optional(app.get_db())
                .await?;

                if is_admin.is_some() {
                    return Err(Madness::BadRequest(
                        "Character is flagged as a main and cannot be added as an alt".to_string(),
                    ));
                }

                sqlx::query!(
                    "REPLACE INTO alt_character (account_id, alt_id) VALUES (?, ?)",
                    account.id,
                    character_id
                )
                .execute(app.get_db())
                .await?;
            }
            account.id
        } else {
            character_id
        };

    Ok(crate::core::auth::create_cookie(app, logged_in_account))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![whoami, logout, login_url, callback]
}
