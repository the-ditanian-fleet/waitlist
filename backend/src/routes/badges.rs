use std::collections::HashMap;

use crate::{
    app::Application, core::auth::AuthenticatedAccount, util::madness::Madness,
};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct Badge {
  id: i64,
  name: String,
  #[serde(skip_serializing_if = "is_negative")]
  member_count: i32
}

#[derive(Debug, Serialize)]
struct BadgeAssignment {
    badge: Badge,
    character: Character,
    granted_by: Character,
    granted_at: i64
}

#[derive(Debug, Deserialize, Serialize)]
struct Character {
    id: i64,
    #[serde(skip_deserializing)]
    name: String
}

// This is used so we can tell serde
// not to serialize a field where the
// number is less than 0
fn is_negative(num: &i32) -> bool {
    *num < 0
}

// Returns an array of badges, used to build
// our assign badge modal & our results filter
#[get("/api/badges")]
async fn list_badges(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount
) -> Result<Json<Vec<Badge>>, Madness> {
    account.require_access("badges-manage")?;
    
    let rows = sqlx::query!(
        "SELECT badge.id, badge.name, 
            (
                SELECT COUNT(*)
                FROM badge_assignment AS badge_assignment
                WHERE badge_assignment.badgeId = badge.id
            ) AS member_count
        FROM badge"
    )
    .fetch_all(app.get_db())
    .await?;

    let badges = rows
        .into_iter()
        .map(|badge| {
            Badge {
                id: badge.id,
                name: badge.name.to_string(),
                member_count: badge.member_count
            }
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
    badge_id: i64
) -> Result<Json<Vec<BadgeAssignment>>, Madness> {
    account.require_access("badges-manage")?;

    // note to next dev:  I couldn't work out how to do a relational SELECT
    //  where I joined with the character table twice to fetch
    //  the Character and Admin values. You are welcome to fix this
    let badge_assignments = sqlx::query!(
        "SELECT characterId, grantedAt, grantedById FROM badge_assignment WHERE badge_assignment.badgeId = ?",
        badge_id
    )
    .fetch_all(app.get_db())
    .await?;

    let characters = sqlx::query!(
        "SELECT DISTINCT c.id, c.name FROM character AS c INNER JOIN badge_assignment AS ba ON c.id = ba.characterId OR c.id = ba.grantedById WHERE ba.badgeId=?",
        badge_id
    )
    .fetch_all(app.get_db())
    .await?;

    let character_map: HashMap<i64, String> = characters 
        .into_iter()
        .map(|character| {
            (
                character.id,
                character.name
            )
        })
        .collect();

    let badge = sqlx::query!(
        "SELECT name FROM badge WHERE id=? LIMIT 1",
        badge_id
    )
    .fetch_one(app.get_db())
    .await?;

    let badge_assignments = badge_assignments
        .into_iter()
        .map(|assignment| {
            BadgeAssignment {
                badge: Badge {
                    id: badge_id,
                    name: badge.name.to_string(),
                    member_count: -1
                },
                granted_at: assignment.GrantedAt,
                character: Character {
                    id: assignment.CharacterId,
                    name: character_map.get(&assignment.CharacterId)
                            .unwrap()
                            .to_string()
                },
                granted_by: Character {
                    id: assignment.GrantedById.unwrap(),
                    name: character_map.get(&assignment.GrantedById.unwrap())
                            .unwrap()
                            .to_string()
                }
            }
        })
        .collect();

    Ok(Json(badge_assignments))
}

// Assigns a badge to a given character
// The character ID should be specified in JSON { "id": 0 }
#[post("/api/badges/<badge_id>/members", data="<character>")]
async fn assign_badge(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    badge_id: i64,
    character: Json<Character>
) -> Result<&'static str, Madness> {
    account.require_access("badges-manage")?;
    
    // Ensure the requested badge exists
    if sqlx::query!( "SELECT id FROM badge WHERE id=? LIMIT 1", badge_id )  
    .fetch_all(app.get_db())
    .await?
    .len() <= 0 {
        return Err(Madness::BadRequest(format!("Badge not found (ID: {badge_id})")));
    }

    // Ensure the requested character exists
    if sqlx::query!( "SELECT id FROM character WHERE id=? LIMIT 1", character.id ) 
    .fetch_all(app.get_db())
    .await?
    .len() <= 0 {
        let id = character.id;
        return Err(Madness::BadRequest(format!("Character not found (ID: {id})")));
    }

    // Make sure we don't duplicate this record
    if sqlx::query!( 
        "SELECT * FROM badge_assignment WHERE characterid=? AND badgeId=?", 
        character.id, badge_id
    )
    .fetch_all(app.get_db())
    .await?
    .len() > 0 {
        return Err(Madness::BadRequest(format!("The pilot already has that badge, it cannot be applied a second time")));
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
    character_id: i64
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