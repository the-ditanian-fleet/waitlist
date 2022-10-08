use crate::{
    app::Application,
    core::auth::AuthenticatedAccount,
    util::{
        madness::Madness,
        types::{Ban, Character, Entity},
    },
};

use rocket::serde::json::Json;
use serde::Deserialize;
use sqlx::types::chrono::Utc;

#[derive(Deserialize)]
struct EsiResponse {
    name: String,
}

#[get("/api/v2/bans")]
async fn list(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<Vec<Ban>>, Madness> {
    account.require_access("bans-manage")?;

    let now = Utc::now().timestamp();

    let rows = sqlx::query!(
        "SELECT 
	        ban.id,
	        entity_id,
	        entity_name,
	        entity_type,
	        issued_at,
	        public_reason,
	        reason,
	        revoked_at,
	        issuer.id AS `issued_by_id`,
	        issuer.name AS `issued_by_name`
        FROM
	        ban
        JOIN
	        `character` as issuer ON issued_by=issuer.id
        WHERE
            revoked_at IS NULL OR revoked_at > ?",
        now
    )
    .fetch_all(app.get_db())
    .await?;

    let bans = rows
        .into_iter()
        .map(|ban| Ban {
            id: Some(ban.id),
            entity: Some(Entity {
                id: ban.entity_id,
                name: ban.entity_name,
                category: ban.entity_type,
            }),
            issued_at: Some(ban.issued_at),
            issued_by: Some(Character {
                id: ban.issued_by_id,
                name: ban.issued_by_name,
            }),
            reason: ban.reason,
            public_reason: ban.public_reason,
            revoked_at: ban.revoked_at,
            revoked_by: None,
        })
        .collect();

    return Ok(Json(bans));
}

#[post("/api/v2/bans", data = "<req_body>")]
async fn create(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    req_body: Json<Ban>,
) -> Result<&'static str, Madness> {
    account.require_access("bans-manage")?;

    let now = Utc::now().timestamp();

    if let None = &req_body.entity {
        return Err(Madness::BadRequest(format!(
            "One or more body paramaters are missing: [\"{}\", \"{}\", \"{}\"]",
            "id", "name", "kind"
        )));
    }

    let e = req_body.entity.as_ref().unwrap();
    let esi_res: EsiResponse = app
        .esi_client
        .get_unauthenticated(&format!(
            "/latest/{}s/{}",
            req_body.entity.as_ref().unwrap().category.to_lowercase(),
            req_body.entity.as_ref().unwrap().id
        ))
        .await?;

    sqlx::query!(
        "INSERT INTO ban (entity_type, entity_id, entity_name, issued_at, issued_by, reason, public_reason, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        e.category,
        e.id,
        esi_res.name,
        now,
        account.id,
        req_body.reason,
        req_body.public_reason,
        match req_body.revoked_at.as_ref() {
            None => None,
            Some(day) => {
                // Bans should expire at downtime - 1100 GMT
                let downtime = 60 * 60 * 11;
                Some(day + downtime)
            }
        },
    )
    .execute(app.get_db())
    .await?;

    Ok("Ok")
}

#[get("/api/v2/bans/<character_id>")]
async fn character_history(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    character_id: i64,
) -> Result<Json<Vec<Ban>>, Madness> {
    account.require_access("bans-manage")?;

    if let Some(bans) = app.ban_service.all_bans(character_id, "Character").await? {
        return Ok(Json(bans));
    }

    Ok(Json(Vec::new()))
}

#[patch("/api/v2/bans/<ban_id>", data = "<req_body>")]
async fn update(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    ban_id: i64,
    req_body: Json<Ban>,
) -> Result<&'static str, Madness> {
    account.require_access("bans-manage")?;

    let now = Utc::now().timestamp();

    if let None = sqlx::query!(
        "SELECT * FROM ban WHERE id=? AND (revoked_at IS NULL OR revoked_at > ?)",
        ban_id,
        now
    )
    .fetch_optional(app.get_db())
    .await?
    {
        return Err(Madness::BadRequest(format!(
            "Cannot revoke invalid ban. It is either invalid or doesn't exist"
        )));
    }

    sqlx::query!(
        "UPDATE
            ban
        SET
            reason=?,
            public_reason=?,
            revoked_at=?,
            issued_by=?,
            issued_at=?
        WHERE
          id=?",
        req_body.reason,
        req_body.public_reason,
        match req_body.revoked_at.as_ref() {
            None => None,
            Some(day) => {
                // Bans should expire at downtime - 1100 GMT
                let downtime = 60 * 60 * 11;
                Some(day + downtime)
            }
        },
        account.id,
        now,
        ban_id
    )
    .execute(app.get_db())
    .await?;

    Ok("Ok")
}

#[delete("/api/v2/bans/<ban_id>")]
async fn revoke(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    ban_id: i64,
) -> Result<&'static str, Madness> {
    account.require_access("bans-manage")?;

    if let Some(ban) = sqlx::query!("select * from ban WHERE id=?", ban_id)
        .fetch_optional(app.get_db())
        .await?
    {
        let now = Utc::now().timestamp();
        if !ban.revoked_at.is_none() && ban.revoked_at.unwrap() < now {
            if ban.revoked_by.is_none() {
                return Err(Madness::BadRequest(format!(
                    "Cannot revoke the ban as it has already expired"
                )));
            }

            let fc_id = ban.revoked_by.unwrap();

            let fc = sqlx::query!("SELECT * FROM `character` WHERE id=?", fc_id)
                .fetch_one(app.get_db())
                .await?;
            return Err(Madness::BadRequest(format!(
                "{} has already revoked this ban",
                fc.name
            )));
        }

        sqlx::query!(
            "UPDATE ban SET revoked_at=?, revoked_by=? WHERE id=?",
            now,
            account.id,
            ban_id
        )
        .execute(app.get_db())
        .await?;

        return Ok("Ok");
    }

    return Err(Madness::BadRequest(format!(
        "Could not find a ban with the ID of {}",
        ban_id
    )));
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        list,              //  GET     /api/v2/bans
        create,            //  POST    /api/v2/bans
        character_history, //  GET     /api/v2/bans/<character_id>
        update,            //  PUT     /api/v2/bans/<ban_id>
        revoke             //  DELETE  /api/v2/bans/<ban_id>
    ]
}
