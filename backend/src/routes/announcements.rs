use crate::{
    app::Application,
    core::{auth::AuthenticatedAccount, sse::Event},
    util::{madness::Madness, types::Character},
};

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct Announcement {
    id: i64,
    message: String,
    is_alert: bool,
    pages: Option<String>,
    created_by_id: i64,
    created_at: i64,
    revoked_by_id: Option<i64>,
    revoked_at: Option<i64>,
}

#[derive(Deserialize)]
struct RequestPayload {
    message: String,
    is_alert: bool,
    pages: Option<String>,
}

#[derive(Serialize)]
struct AnnouncementPayload {
    id: i64,
    message: String,
    is_alert: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pages: Option<String>,
    created_by: Option<Character>,
    created_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    revoked_by: Option<Character>,
    #[serde(skip_serializing_if = "Option::is_none")]
    revoked_at: Option<i64>,
}

async fn get_active_announcements(app: &Application) -> Result<Vec<AnnouncementPayload>, Madness> {
    let announcements: Vec<Announcement> = sqlx::query_as!(
        Announcement,
        "SELECT
        id,
        message,
        is_alert AS `is_alert!: bool`,
        pages,
        created_by_id,
        created_at,
        revoked_by_id,
        revoked_at
      FROM
        announcement
      WHERE
        revoked_at IS NULL"
    )
    .fetch_all(app.get_db())
    .await?;

    let mut payloads = Vec::new();

    for a in announcements {
        let created_by = sqlx::query_as!(
            Character,
            "SELECT * FROM `character` WHERE id=?",
            a.created_by_id
        )
        .fetch_optional(app.get_db())
        .await?;

        payloads.push(AnnouncementPayload {
            id: a.id,
            message: a.message,
            is_alert: a.is_alert,
            pages: a.pages,
            created_by,
            created_at: a.created_at,
            revoked_by: None,
            revoked_at: None,
        });
    }

    Ok(payloads)
}

#[get("/api/v2/announcements")]
async fn list(app: &rocket::State<Application>) -> Result<Json<Vec<AnnouncementPayload>>, Madness> {
    let payloads = get_active_announcements(app).await?;
    return Ok(Json(payloads));
}

#[post("/api/v2/announcements", data = "<body>")]
async fn create(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    body: Json<RequestPayload>,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-tag:HQ-FC")?;

    let now = chrono::Utc::now().timestamp();

    sqlx::query!(
        "INSERT INTO announcement (message, is_alert, pages, created_by_id, created_at) VALUES (?, ?, ?, ?, ?)",
        body.message,
        body.is_alert,
        body.pages,
        account.id,
        now
    )
    .execute(app.get_db())
    .await?;

    // Send an updated array of announcements to users active on the site
    let payloads = get_active_announcements(app).await?;

    app.sse_client
        .submit(vec![Event::new_json(
            "announcments",
            "announcment;new",
            &payloads,
        )])
        .await?;

    return Ok("Ok");
}

#[put("/api/v2/announcements/<announcement_id>", data = "<body>")]
async fn update(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    announcement_id: i64,
    body: Json<RequestPayload>,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-tag:HQ-FC")?;

    let announcement: Option<Announcement> = sqlx::query_as!(
        Announcement,
        "SELECT
          id,
          message,
          is_alert AS `is_alert!: bool`,
          pages,
          created_by_id,
          created_at,
          revoked_by_id,
          revoked_at
        FROM
          announcement
        WHERE
          id=? AND revoked_at IS NULL",
        announcement_id
    )
    .fetch_optional(app.get_db())
    .await?;

    if announcement.is_none() {
        return Err(Madness::BadRequest(format!(
            "Announcment could not be found."
        )));
    }

    sqlx::query!(
        "UPDATE announcement SET message=?, is_alert=?, pages=? WHERE id=?",
        body.message,
        body.is_alert,
        body.pages,
        announcement_id
    )
    .execute(app.get_db())
    .await?;

    // Send an updated array of announcements to users active on the site
    let payloads = get_active_announcements(app).await?;

    app.sse_client
        .submit(vec![Event::new_json(
            "announcments",
            "announcment;updated",
            &payloads,
        )])
        .await?;

    return Ok("Ok");
}

#[delete("/api/v2/announcements/<announcement_id>")]
async fn revoke(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    announcement_id: i64,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-tag:HQ-FC")?;

    let announcement: Option<Announcement> = sqlx::query_as!(
        Announcement,
        "SELECT
          id,
          message,
          is_alert AS `is_alert!: bool`,
          pages,
          created_by_id,
          created_at,
          revoked_by_id,
          revoked_at
        FROM
          announcement
        WHERE
          id=? AND revoked_at IS NULL",
        announcement_id
    )
    .fetch_optional(app.get_db())
    .await?;

    if announcement.is_none() {
        return Err(Madness::BadRequest(format!(
            "Announcment could not be found or has already been deleted."
        )));
    }

    let now = chrono::Utc::now().timestamp();

    sqlx::query!(
        "UPDATE announcement SET revoked_by_id=?, revoked_at=? WHERE id=?",
        account.id,
        now,
        announcement_id
    )
    .execute(app.get_db())
    .await?;

    // Send an updated array of announcements to users active on the site
    let payloads = get_active_announcements(app).await?;

    app.sse_client
        .submit(vec![Event::new_json(
            "announcments",
            "announcment;updated",
            &payloads,
        )])
        .await?;

    return Ok("Ok");
}

pub fn routes() -> Vec<rocket::Route> {
    routes![
        list,   // GET      /api/v2/announcements
        create, // POST     /api/v2/announcements
        update, // PUT      /api/v2/announcements/<announcements_id>
        revoke, // DELETE   /api/v2/announcements/<announcements_id>
    ]
}
