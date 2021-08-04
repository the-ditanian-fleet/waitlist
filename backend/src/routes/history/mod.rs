mod activity;
mod skills;
mod xup;

pub fn routes() -> Vec<rocket::Route> {
    [skills::routes(), xup::routes(), activity::routes()].concat()
}
