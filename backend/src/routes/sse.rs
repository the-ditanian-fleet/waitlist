use rocket::response::Redirect;

use crate::core::auth::AuthenticatedAccount;

#[get("/api/sse/stream")]
fn stream(app: &rocket::State<crate::app::Application>, account: AuthenticatedAccount) -> Redirect {
    let mut topics = vec!["waitlist".to_string(), format!("account;{}", account.id)];

    if account.access.contains("waitlist-view") {
        topics.push("xup".to_string());
    }
    if account.access.contains("fleet-view") {
        topics.push("fleet_comp".to_string());
    }

    Redirect::temporary(app.sse_client.events_url(&topics))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![stream,]
}
