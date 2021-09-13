use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};

use rocket::serde::json::Json;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct EmptyWaitlistRequest {
    waitlist_id: i64,
}

#[post("/api/waitlist/empty", data = "<input>")]
async fn empty_waitlist(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<EmptyWaitlistRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-edit")?;

    let waitlist = sqlx::query!("SELECT is_open FROM waitlist WHERE id=?", input.waitlist_id)
        .fetch_one(app.get_db())
        .await?;
    if waitlist.is_open > 0 {
        return Err(Madness::BadRequest(
            "Waitlist must be closed in order to empty it".to_string(),
        ));
    }

    let mut tx = app.get_db().begin().await?;

    sqlx::query!(
        "
            DELETE FROM waitlist_entry_fit
            WHERE entry_id IN (SELECT id FROM waitlist_entry WHERE waitlist_id=?)
        ",
        input.waitlist_id
    )
    .execute(&mut tx)
    .await?;

    sqlx::query!(
        "DELETE FROM waitlist_entry WHERE waitlist_id=?",
        input.waitlist_id
    )
    .execute(&mut tx)
    .await?;

    tx.commit().await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![empty_waitlist]
}
