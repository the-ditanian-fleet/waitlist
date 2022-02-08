use rocket::serde::json::Json;
use serde::Serialize;

use crate::core::auth::AuthenticatedAccount;
use crate::data;
use crate::util::types::WaitlistCategory;

#[derive(Debug, Serialize)]
struct CategoryResponse {
    categories: &'static Vec<WaitlistCategory>,
}

#[get("/api/categories")]
fn categories(_account: AuthenticatedAccount) -> Json<CategoryResponse> {
    Json(CategoryResponse {
        categories: data::categories::squadcategories(),
    })
}

pub fn routes() -> Vec<rocket::Route> {
    routes![categories]
}
