use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct AnnouncementResponse {
    created_at: i64,
    created_by: String,
    message: String,
}

#[derive(Debug, Deserialize)]
struct ChangeAnnouncement {
    message: String,
    id: i64,
}

#[get("/api/announcement/read?<id>")]
async fn read_announcement(
    id: i64,
    app: &rocket::State<Application>,
) -> Result<Json<AnnouncementResponse>, Madness> {
    let announcement = sqlx::query!("SELECT * from announcement WHERE id=?", id)
        .fetch_optional(app.get_db())
        .await?;
    if announcement.is_none() {
        return Err(Madness::BadRequest(format!(
            "Unknown announcement with ID {}",
            id
        )));
    }
    let entry = announcement.unwrap();
	let character = sqlx::query!("SELECT name from character WHERE id=?", entry.character_id)
        .fetch_one(app.get_db())
        .await?;
	

    Ok(Json(AnnouncementResponse {
        created_at: entry.created_at,
        created_by: character.name,
        message: entry.message,
    }))
}

#[post("/api/announcement/write", data = "<input>")]
async fn change_announcement(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    input: Json<ChangeAnnouncement>,
) -> Result<&'static str, Madness> {
    account.require_access("access-manage")?;
    let now = chrono::Utc::now().timestamp();
    let entry = sqlx::query!("SELECT * from announcement WHERE id=?", input.id)
        .fetch_optional(app.get_db())
        .await?;
    if entry.is_none() {
        if ![1, 2, 3, 4].iter().any(|e| input.id == *e) {
            return Err(Madness::BadRequest(format!(
                "Unknown announcement with ID {}",
                input.id
            )));
        }

        sqlx::query!(
            "INSERT INTO announcement (id, message, character_id, created_at) VALUES (?, ?, ?, ?)",
            input.id,
            input.message,
            account.id,
            now,
        )
        .execute(app.get_db())
        .await?;
    }

    sqlx::query!(
            "UPDATE announcement SET message=?, character_id=?, created_at=? WHERE id=?",
            input.message,
            account.id,
            now,
		    input.id,
        )
    .execute(app.get_db())
    .await?;
	
    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![read_announcement, change_announcement]
}
