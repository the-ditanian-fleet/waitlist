use std::time::Instant;

use rocket::fairing::{Fairing, Kind};

pub struct RequestLogger {}

struct RequestStart(Option<Instant>);

#[rocket::async_trait]
impl Fairing for RequestLogger {
    fn info(&self) -> rocket::fairing::Info {
        rocket::fairing::Info {
            name: "Request Logger",
            kind: Kind::Request | Kind::Response,
        }
    }

    async fn on_request(&self, req: &mut rocket::Request<'_>, _data: &mut rocket::Data<'_>) {
        req.local_cache(|| RequestStart(Some(Instant::now())));
    }

    async fn on_response<'r>(&self, req: &'r rocket::Request<'_>, res: &mut rocket::Response<'r>) {
        let start_time = req.local_cache(|| RequestStart(None));
        if let Some(the_time) = start_time.0 {
            let elapsed = the_time.elapsed();
            let now = chrono::Utc::now();
            println!(
                r#"[{}] {} "{}" {} {}"#,
                now,
                req.method(),
                req.uri(),
                res.status(),
                elapsed.as_secs_f32()
            );
        } else {
            error!("Cannot log request, on_request was not invoked?");
        }
    }
}
