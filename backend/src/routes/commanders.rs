use std::cmp::Ordering;

use crate::{
    app::Application,
    core::auth::{get_access_keys, AuthenticatedAccount},
    util::madness::Madness,
};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct RequestPayload {
    character_id: Option<i64>,
    role: String,
}

#[derive(Serialize)]
struct Character {
    id: i64,
    name: String,
}

#[derive(Serialize)]
struct Commander {
    character: Character,
    role: String,
    granted_by: Character,
    granted_at: i64,
}

#[derive(Serialize)]
struct CommanderRank {
    name: String,
    member_count: i64,
}

#[derive(Serialize)]
struct CommanderList {
    commanders: Vec<Commander>,
    filters: Vec<CommanderRank>,
}

#[get("/api/commanders")]
async fn list(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<CommanderList>, Madness> {
    account.require_access("access-manage")?;

    let mut filters = Vec::new();

    let rows =
        sqlx::query!("SELECT role, count(role) as `member_count!: i64` FROM admin GROUP BY role")
            .fetch_all(app.get_db())
            .await?;

    for acl in rows {
        filters.push(CommanderRank {
            name: acl.role,
            member_count: acl.member_count,
        });
    }

    let rows = sqlx::query!(
        "SELECT 
        role, 
        granted_at, 
        fc.id AS `id`, 
        fc.name AS `name`, 
        a.id AS `admin_id`, 
        a.name AS `admin_name`
      FROM 
        admin
        JOIN `character` AS fc ON character_id = fc.id 
        JOIN `character` AS a ON granted_by_id = a.id"
    )
    .fetch_all(app.get_db())
    .await?;

    let commanders = rows
        .into_iter()
        .map(|cmdr| Commander {
            character: Character {
                id: cmdr.id,
                name: cmdr.name,
            },
            role: cmdr.role,
            granted_by: Character {
                id: cmdr.admin_id,
                name: cmdr.admin_name,
            },
            granted_at: cmdr.granted_at,
        })
        .collect();

    return Ok(Json(CommanderList {
        commanders,
        filters,
    }));
}

#[post("/api/commanders", data = "<body>")]
async fn assign(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    body: Json<RequestPayload>,
) -> Result<&'static str, Madness> {
    account.require_access("access-manage")?;

    // Because character_id in the RequestPayload struct is optional
    // so we need to add additional error handling for this method
    if body.character_id.is_none() {
        return Err(Madness::BadRequest(format!(
            "Request body missing required property {}",
            "character_id"
        )));
    }

    // Ensure the requested role exists
    let role = get_access_keys(&body.role);
    if role.is_none() {
        return Err(Madness::BadRequest(format!(
            "The FC rank \"{}\" does not exist",
            body.role
        )));
    }

    // Ensure the authenticated user has permission to assign this role
    let required_scope = format!("access-manage:{}", body.role);
    if !account.access.contains(&required_scope) {
        return Err(Madness::Forbidden(format!(
            "You do not have permission to grant the role \"{}\"",
            body.role
        )));
    }

    let character_id = body.character_id.unwrap();
    if let Some(character) = sqlx::query!("SELECT * FROM `character` WHERE id=?", character_id)
        .fetch_optional(app.get_db())
        .await?
    {
        // Ensure the character doesn't already have a role - Character <-> Admin is a 1 to 1 relationship
        if let Some(_) = sqlx::query!("SELECT * FROM admin WHERE character_id=?", character_id)
            .fetch_optional(app.get_db())
            .await?
        {
            return Err(Madness::BadRequest(format!(
                "Cannot assign \"{}\" to {} as they already have a role",
                body.role, character.name
            )));
        }

        let now = chrono::Utc::now().timestamp();
        sqlx::query!(
            "INSERT INTO admin VALUES (?, ?, ?, ?)",
            character_id,
            body.role,
            now,
            account.id
        )
        .execute(app.get_db())
        .await?;

        return Ok("Ok");
    }

    // todo: return error message
    return Err(Madness::NotFound(""));
}

#[get("/api/commanders/roles")]
async fn assignable(account: AuthenticatedAccount) -> Result<Json<Vec<&'static str>>, Madness> {
    account.require_access("access-manage")?;

    let role_order = vec!["trainee", "trainee-advanced", "fc", "fc-trainer", "council"];

    let mut options = Vec::new();
    for scope in account.access.into_iter() {
        if scope.contains("access-manage:") {
            // 14 is the index of ":".
            let (_, b) = scope.split_at(14);

            options.push(b);
        }
    }

    options.sort_by(|a, b| {
        if let Some(a) = role_order.iter().position(|&r| &r == a) {
            if let Some(b) = role_order.iter().position(|&r| &r == b) {
                if a < b {
                    return Ordering::Less;
                } else {
                    return Ordering::Greater;
                }
            }
        }

        Ordering::Equal
    });

    Ok(Json(options))
}

#[get("/api/commanders/<character_id>")]
async fn lookup(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    character_id: i64,
) -> Result<String, Madness> {
    account.require_access("access-manage")?;

    if let Some(role) = sqlx::query!("Select * FROM admin WHERE character_id=?", character_id)
        .fetch_optional(app.get_db())
        .await?
    {
        return Ok(role.role);
    }

    // todo: return error message
    return Err(Madness::NotFound(""));
}

#[delete("/api/commanders/<character_id>")]
async fn revoke(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    character_id: i64,
) -> Result<&'static str, Madness> {
    account.require_access("access-manage")?;

    // Stop user from revoking their own role
    if account.id == character_id {
        return Err(Madness::BadRequest(format!(
            "You cannot revoke your own rank."
        )));
    }

    // Check the target user has a role. If they do not return a 200, if they do...
    if let Some(role) = sqlx::query!("SELECT * FROM admin WHERE character_id=?", character_id)
        .fetch_optional(app.get_db())
        .await?
    {
        // Ensure the authenticated user is allowed to revoke the role
        let required_scope = format!("access-manage:{}", role.role);
        if !account.access.contains(&required_scope) {
            return Err(Madness::Forbidden(format!(
                "You do not have permission to revoke the role \"{}\"",
                role.role
            )));
        }

        // Revoke the role
        sqlx::query!("DELETE FROM admin WHERE character_id=?", character_id)
            .execute(app.get_db())
            .await?;
    };

    return Ok("Ok");
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        assign,     // POST     /api/commanders
        list,       // GET      /api/commanders
        assignable, // GET      /api/commanders/roles
        lookup,     // GET      /api/commanders/<character_id>
        revoke      // DELETE   /api/commanders/<character_id>
    ]
}
