use rocket::serde::json::Json;
use serde::Deserialize;

use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};

#[derive(Debug, Deserialize)]
struct SetOpenRequest {
    open: bool,
    waitlist_id: i64,
}

#[post("/api/waitlist/set_open", data = "<input>")]
async fn set_open(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<SetOpenRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("waitlist-edit")?;

    sqlx::query!(
        "UPDATE waitlist SET is_open=? WHERE id=?",
        input.open,
        input.waitlist_id
    )
    .execute(app.get_db())
    .await?;

    super::notify::notify_waitlist_update(app, input.waitlist_id).await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![set_open]
}
