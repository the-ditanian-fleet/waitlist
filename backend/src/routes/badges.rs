use crate::{
    app::Application, core::auth::AuthenticatedAccount, util::madness::Madness,
};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct Badge {
  id: i64,
  name: String,
  member_count: i32
}

#[derive(Debug, Serialize)]
struct BadgeAssignment {
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

pub fn routes() -> Vec<rocket::Route> {
    routes![list_badges]
}