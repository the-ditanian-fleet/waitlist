use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct AnnouncementEntry {
    id: i64,
    created_at: i64,
    created_by: String,
    message: String,
}

#[derive(Debug, Serialize)]
struct AnnouncementResponseList {
    list: Vec<AnnouncementEntry>,
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
) -> Result<Json<AnnouncementEntry>, Madness> {
    let announcement = sqlx::query!("SELECT announcement.id, announcement.message, announcement.created_at, character.name FROM announcement INNER JOIN `character` ON character.id = announcement.character_id WHERE announcement.id=?", id)
        .fetch_optional(app.get_db())
        .await?;
    if announcement.is_none() {
        return Err(Madness::BadRequest(format!(
            "Unknown announcement with ID {}",
            id
        )));
    }
    let entry = announcement.unwrap();
    Ok(Json(AnnouncementEntry {
        id: entry.id,
        created_at: entry.created_at,
        created_by: entry.name,
        message: entry.message,
    }))
}

#[get("/api/announcement/read")]
async fn list_announcement(
    app: &rocket::State<Application>,
) -> Result<Json<AnnouncementResponseList>, Madness> {
    let announcements = sqlx::query!("SELECT announcement.id, announcement.message, announcement.created_at, character.name FROM announcement INNER JOIN `character` WHERE character.id = announcement.character_id")
        .fetch_all(app.get_db())
        .await?
		.into_iter()
    .map(|entry|
	AnnouncementEntry {
		id: entry.id,
        created_at: entry.created_at,
        created_by: entry.name,
        message: entry.message,
     }
	)
    .collect();
    Ok(Json(AnnouncementResponseList {
        list: announcements,
    }))
}

#[post("/api/announcement/write", data = "<input>")]
async fn change_announcement(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    input: Json<ChangeAnnouncement>,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-tag:HQ-FC")?;
    let now = chrono::Utc::now().timestamp();
    let entry = sqlx::query!("SELECT * from announcement WHERE id=?", input.id)
        .fetch_optional(app.get_db())
        .await?;
    if entry.is_none() {
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
    routes![read_announcement, change_announcement, list_announcement]
}
