use eve_data_core::TypeID;
use rocket::serde::json::Json;
use serde::Serialize;

use crate::{
    app::Application,
    core::auth::{authorize_character, AuthenticatedAccount},
    data::implants,
    util::madness::Madness,
};

#[derive(Serialize, Debug)]
struct ImplantsResponse {
    implants: Vec<TypeID>,
}

#[get("/api/implants?<character_id>")]
async fn list_implants(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    character_id: i64,
) -> Result<Json<ImplantsResponse>, Madness> {
    authorize_character(app.get_db(), &account, character_id, None).await?;

    let fetched = implants::get_implants(app, character_id).await?;
    Ok(Json(ImplantsResponse { implants: fetched }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_implants]
}
