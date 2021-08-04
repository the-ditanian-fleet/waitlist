use crate::{app::Application, data, tdf, util::madness::Madness};

#[get("/healthz")]
async fn health_check(app: &rocket::State<Application>) -> Result<&'static str, Madness> {
    // Check database connection
    let _oneoneone = sqlx::query!("SELECT 1 'one'")
        .fetch_one(app.get_db())
        .await?;

    // Statically initialized data - would panic if there's trouble
    let _skills = tdf::skills::skill_data();
    let _fits = data::fits::get_fits();

    // Don't check ESI.

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![health_check]
}
