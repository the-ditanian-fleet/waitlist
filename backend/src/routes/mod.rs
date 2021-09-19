mod acl;
mod auth;
mod bans;
mod categories;
mod fleet;
mod healthcheck;
mod history;
mod implants;
mod modules;
mod notes;
mod pilot;
mod search;
mod skillplans;
mod skills;
mod sse;
mod statistics;
mod waitlist;
mod window;

pub fn routes() -> Vec<rocket::Route> {
    [
        auth::routes(),
        sse::routes(),
        skills::routes(),
        pilot::routes(),
        history::routes(),
        window::routes(),
        acl::routes(),
        bans::routes(),
        modules::routes(),
        search::routes(),
        categories::routes(),
        fleet::routes(),
        waitlist::routes(),
        statistics::routes(),
        healthcheck::routes(),
        implants::routes(),
        notes::routes(),
        skillplans::routes(),
    ]
    .concat()
}
