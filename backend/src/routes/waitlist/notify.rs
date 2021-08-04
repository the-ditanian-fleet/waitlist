use crate::{
    app::Application,
    core::sse::{Event, SSEError},
};
use serde::Serialize;

#[derive(Debug, Serialize)]
struct WaitlistUpdate {
    waitlist_id: i64,
}

#[derive(Debug, Serialize)]
struct Message {
    message: &'static str,
}

pub async fn notify_waitlist_update(app: &Application, waitlist_id: i64) -> Result<(), SSEError> {
    app.sse_client
        .submit(vec![Event::new_json(
            "waitlist",
            "waitlist_update",
            &WaitlistUpdate { waitlist_id },
        )])
        .await?;
    Ok(())
}

pub async fn notify_waitlist_update_and_xup(
    app: &Application,
    waitlist_id: i64,
) -> Result<(), SSEError> {
    app.sse_client
        .submit(vec![
            Event::new_json(
                "waitlist",
                "waitlist_update",
                &WaitlistUpdate { waitlist_id },
            ),
            Event::new_json(
                "xup",
                "message",
                &Message {
                    message: "New x-up in waitlist",
                },
            ),
        ])
        .await?;
    Ok(())
}
