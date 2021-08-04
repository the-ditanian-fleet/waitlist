mod approve;
mod empty;
mod invite;
mod list;
mod notify;
mod open;
mod remove;
mod xup;

pub fn routes() -> Vec<rocket::Route> {
    [
        list::routes(),
        approve::routes(),
        open::routes(),
        empty::routes(),
        remove::routes(),
        invite::routes(),
        xup::routes(),
    ]
    .concat()
}
