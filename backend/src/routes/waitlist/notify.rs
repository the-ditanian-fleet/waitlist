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
    if let Ok(fleets) = sqlx::query!("SELECT `boss_id` FROM `fleet`")
        .fetch_all(app.get_db())
        .await {
            for fleet in fleets {
                app.sse_client
                .submit(vec![
                    Event::new_json(
                        &format!("account;{}", fleet.boss_id),
                        "message",
                        &Message {
                            message: "New x-up in waitlist"
                        }
                    )
                ])
                .await?;
            }
        }

    app.sse_client
        .submit(vec![
            Event::new_json(
                "waitlist",
                "waitlist_update",
                &WaitlistUpdate { waitlist_id },
            )
        ])
        .await?;
    Ok(())
}
