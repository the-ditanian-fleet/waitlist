use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct Badge {
    id: i64,
    name: String,
    #[serde(skip_serializing_if = "is_negative")]
    member_count: i64,
    #[serde(skip_serializing_if = "is_negative")]
    exclude_badge_id: i64,
}

#[derive(Debug, Serialize)]
struct BadgeAssignment {
    badge: Badge,
    character: Character,
    granted_by: Character,
    granted_at: i64,
}

#[derive(Debug, Deserialize, Serialize)]
struct Character {
    id: i64,
    #[serde(skip_deserializing)]
    name: String,
}

// This is used so we can tell serde
// not to serialize a field where the
// number is less than 0
fn is_negative(num: &i64) -> bool {
    *num < 0
}

// Returns an array of badges, used to build
// our assign badge modal & our results filter
#[get("/api/badges")]
async fn list_badges(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
) -> Result<Json<Vec<Badge>>, Madness> {
    account.require_access("badges-manage")?;

    let rows = sqlx::query!(
        "SELECT id as `id!`, name as `name!`, 
            (
                SELECT COUNT(*)
                FROM badge_assignment AS badge_assignment
                WHERE badge_assignment.badgeId = badge.id
            ) AS `member_count!: i64`
        FROM badge"
    )
    .fetch_all(app.get_db())
    .await?;

    let badges = rows
        .into_iter()
        .map(|badge| Badge {
            id: badge.id,
            name: badge.name,
            member_count: badge.member_count,
            exclude_badge_id: -1,
        })
        .collect();

    Ok(Json(badges))
}

// Returns an list of users with a given badge
// will return 204 EMPTY if the badge doesn't exist
#[get("/api/badges/<badge_id>/members")]
async fn get_badge_members(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    badge_id: i64,
) -> Result<Json<Vec<BadgeAssignment>>, Madness> {
    account.require_access("badges-manage")?;

    let badge_assignments = sqlx::query!(
        "SELECT 
        c.id, 
        c.name, 
        g.id AS `grantedById!`, 
        g.name AS `grantedByName!`, 
        b.id AS `badge_id`, 
        b.name AS `badge_name`, 
        grantedAt 
      FROM 
        badge_assignment 
        JOIN `character` AS c ON characterId = c.id 
        JOIN `character` AS g ON grantedById = g.id 
        JOIN badge AS b ON badgeId = b.id 
      WHERE 
        badgeId = ?",
        badge_id
    )
    .fetch_all(app.get_db())
    .await?;

    let badge_assignments = badge_assignments
        .into_iter()
        .map(|assignment| BadgeAssignment {
            badge: Badge {
                id: assignment.badge_id,
                name: assignment.badge_name,
                member_count: -1,
                exclude_badge_id: -1,
            },
            granted_at: assignment.grantedAt,
            character: Character {
                id: assignment.id,
                name: assignment.name,
            },
            granted_by: Character {
                id: assignment.grantedById,
                name: assignment.grantedByName,
            },
        })
        .collect();

    Ok(Json(badge_assignments))
}

// Assigns a badge to a given character
// The character ID should be specified in JSON { "id": 0 }
#[post("/api/badges/<badge_id>/members", data = "<request_character>")]
async fn assign_badge(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    badge_id: i64,
    request_character: Json<Character>,
) -> Result<&'static str, Madness> {
    account.require_access("badges-manage")?;

    // Ensure the requested badge exists
    let badge = sqlx::query!("SELECT * FROM badge WHERE id=? LIMIT 1", badge_id)
        .fetch_optional(app.get_db())
        .await?;

    if badge.is_none() {
        return Err(Madness::BadRequest(format!(
            "Badge not found (ID: {})",
            badge_id
        )));
    }

    // Ensure the requested character exists
    let character = sqlx::query!(
        "SELECT id as `id!`, name as `name!` FROM `character` WHERE id=? LIMIT 1",
        request_character.id
    )
    .fetch_optional(app.get_db())
    .await?;

    if character.is_none() {
        return Err(Madness::BadRequest(format!(
            "Character not found (ID: {})",
            request_character.id
        )));
    }

    let badge = badge.unwrap();
    let character = character.unwrap();

    if sqlx::query!(
        "SELECT id FROM `character` WHERE id=? LIMIT 1",
        character.id
    )
    .fetch_all(app.get_db())
    .await?
    .len()
        <= 0
    {
        return Err(Madness::BadRequest(format!(
            "Character not found (ID: {})",
            request_character.id
        )));
    }

    // Make sure we don't duplicate this record
    if sqlx::query!(
        "SELECT * FROM badge_assignment WHERE characterid=? AND badgeId=?",
        character.id,
        badge_id
    )
    .fetch_all(app.get_db())
    .await?
    .len()
        > 0
    {
        return Err(Madness::BadRequest(format!(
            "{} already has {} and cannot be assigned it a second time",
            character.name, badge.name
        )));
    }

    // If the badge we are trying to assign has an exclude_badge_id
    // we need make sure the pilot does not have the excluded badge
    // if they do we want to return an error. This will prompt the
    // FC to remove the existing badge before they can assign the new badge.
    if !badge.exclude_badge_id.is_none() {
        let exclude_id = badge.exclude_badge_id.unwrap();

        if let Some(excluded_badge) = sqlx::query!(
            "SELECT b.name FROM badge_assignment JOIN badge AS b ON b.id=badgeId WHERE badgeId=? AND characterId=?",
            exclude_id,
            character.id
        )
        .fetch_optional(app.get_db())
        .await?
        {
            return Err(Madness::BadRequest(format!(
                "Cannot assign {} to {} while they have been assigned {}",
                badge.name,
                character.name,
                excluded_badge.name
            )));
        }
    }

    let now = chrono::Utc::now().timestamp();
    sqlx::query!(
        "INSERT INTO badge_assignment (characterId, badgeId, grantedById, grantedAt) VALUES (?, ?, ?, ?)",
        character.id,
        badge_id,
        account.id,
        now
    )
    .execute(app.get_db())
    .await?;

    Ok("Ok")
}

// Revokes a badge from a given character
#[delete("/api/badges/<badge_id>/members/<character_id>")]
async fn revoke_badge(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    badge_id: i64,
    character_id: i64,
) -> Result<&'static str, Madness> {
    account.require_access("badges-manage")?;

    sqlx::query!(
        "DELETE FROM badge_assignment WHERE characterId=? AND badgeId=?",
        character_id,
        badge_id
    )
    .execute(app.get_db())
    .await?;

    Ok("Ok")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_badges, get_badge_members, assign_badge, revoke_badge]
}
