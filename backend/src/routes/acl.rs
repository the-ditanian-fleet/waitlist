use crate::{
    app::Application,
    core::auth::{get_access_keys, AuthenticatedAccount},
    util::madness::{Madness, UserMadness},
};
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct AddAclRequest {
    level: String,
    id: i64,
}

#[post("/api/acl/add", data = "<input>")]
async fn add_acl(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    input: Json<AddAclRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("access-manage")?;

    let to_be_granted = get_access_keys(&input.level);
    if to_be_granted.is_none() {
        return Err(UserMadness::BadRequest(format!("Unknown level '{}'", input.level)).into());
    }

    let required_access = format!("access-manage:{}", input.level);
    if !account.access.contains(&required_access) && !account.access.contains("access-manage-all") {
        return Err(UserMadness::BadRequest(format!("Cannot grant {}", input.level)).into());
    }

    let character = sqlx::query!("SELECT name FROM `character` WHERE id=?", input.id)
        .fetch_optional(app.get_db())
        .await?;
    if character.is_none() {
        return Err(
            UserMadness::BadRequest(format!("Unknown character with ID {}", input.id)).into(),
        );
    }

    // Alts shouldn't have ACLs, so unlink them
    sqlx::query!("DELETE FROM alt_character WHERE alt_id = ?", input.id)
        .execute(app.get_db())
        .await?;

    sqlx::query!(
        "REPLACE INTO admins (character_id, level) VALUES (?, ?)",
        input.id,
        input.level
    )
    .execute(app.get_db())
    .await?;

    Ok("OK")
}

#[derive(Debug, Deserialize)]
struct RemoveAclRequest {
    id: i64,
}

#[post("/api/acl/remove", data = "<input>")]
async fn remove_acl(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<RemoveAclRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("access-manage")?;

    let the_acl = sqlx::query!("SELECT level FROM admins WHERE character_id=?", input.id)
        .fetch_optional(app.get_db())
        .await?;
    if let Some(the_acl) = the_acl {
        let require_access = format!("access-manage:{}", the_acl.level);
        if !account.access.contains(&require_access)
            && !account.access.contains("access-manage-all")
        {
            return Err(UserMadness::BadRequest(format!("Cannot revoke {}", the_acl.level)).into());
        }

        sqlx::query!("DELETE FROM admins WHERE character_id=?", input.id)
            .execute(app.get_db())
            .await?;
    }

    Ok("OK")
}

#[derive(Debug, Serialize)]
struct ACLResponseEntry {
    id: i64,
    name: String,
    level: String,
}

#[derive(Debug, Serialize)]
struct ACLResponse {
    acl: Vec<ACLResponseEntry>,
}

#[get("/api/acl/list")]
async fn list_acl(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<ACLResponse>, Madness> {
    account.require_access("access-view")?;

    let acls = sqlx::query!(
        "
        SELECT character_id, name AS character_name, level
        FROM admins JOIN `character` ON admins.character_id = `character`.id
        ORDER BY `character`.name ASC
        "
    )
    .fetch_all(app.get_db())
    .await?
    .into_iter()
    .map(|acl| ACLResponseEntry {
        id: acl.character_id,
        name: acl.character_name,
        level: acl.level,
    })
    .collect();

    Ok(Json(ACLResponse { acl: acls }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_acl, remove_acl, add_acl]
}
