use rocket::serde::json::Json;
use serde::Deserialize;

use crate::{
    app::Application,
    core::auth::{authorize_character, AuthenticatedAccount},
    util::madness::Madness,
};

#[derive(Debug, Deserialize)]
struct RemoveFitRequest {
    id: i64,
}

#[post("/api/waitlist/remove_fit", data = "<input>")]
async fn remove_fit(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    input: Json<RemoveFitRequest>,
) -> Result<&'static str, Madness> {
    let waitlist_entry = sqlx::query!(
        "
            SELECT account_id, entry_id, waitlist_id FROM waitlist_entry_fit wef
            JOIN waitlist_entry we ON wef.entry_id=we.id
            WHERE wef.id=?
        ",
        input.id
    )
    .fetch_one(app.get_db())
    .await?;

    authorize_character(
        app.get_db(),
        &account,
        waitlist_entry.account_id,
        Some("waitlist-manage"),
    )
    .await?;

    let mut tx = app.get_db().begin().await?;

    sqlx::query!("DELETE FROM waitlist_entry_fit WHERE id = ?", input.id)
        .execute(&mut tx)
        .await?;
    let remaining = sqlx::query!(
        "SELECT id FROM waitlist_entry_fit WHERE entry_id=?",
        waitlist_entry.entry_id
    )
    .fetch_optional(&mut tx)
    .await?;

    if remaining.is_none() {
        sqlx::query!(
            "DELETE FROM waitlist_entry WHERE id=?",
            waitlist_entry.entry_id
        )
        .execute(&mut tx)
        .await?;
    }

    tx.commit().await?;

    super::notify::notify_waitlist_update(app, waitlist_entry.waitlist_id).await?;

    Ok("OK")
}

#[derive(Debug, Deserialize)]
struct RemoveXRequest {
    id: i64,
}

#[post("/api/waitlist/remove_x", data = "<input>")]
async fn remove_x(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<RemoveXRequest>,
) -> Result<&'static str, Madness> {
    let entry = sqlx::query!(
        "SELECT id, waitlist_id, account_id FROM waitlist_entry WHERE id=?",
        input.id
    )
    .fetch_one(app.get_db())
    .await?;

    authorize_character(
        app.get_db(),
        &account,
        entry.account_id,
        Some("waitlist-manage"),
    )
    .await?;

    let mut tx = app.get_db().begin().await?;
    sqlx::query!("DELETE FROM waitlist_entry_fit WHERE entry_id=?", input.id)
        .execute(&mut tx)
        .await?;
    sqlx::query!("DELETE FROM waitlist_entry WHERE id=?", input.id)
        .execute(&mut tx)
        .await?;
    tx.commit().await?;

    super::notify::notify_waitlist_update(app, entry.waitlist_id).await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![remove_fit, remove_x,]
}
