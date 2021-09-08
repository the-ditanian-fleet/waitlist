use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

use crate::{
    app::Application,
    core::{
        auth::{authorize_character, AuthenticatedAccount},
        esi::ESIScope,
    },
    util::madness::Madness,
};

#[derive(Deserialize, Debug)]
struct OpenWindowRequest {
    character_id: i64,
    target_id: i64,
}

#[derive(Deserialize, Serialize, Debug)]
struct Empty {}

#[post("/api/open_window", data = "<input>")]
async fn open_window(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    input: Json<OpenWindowRequest>,
) -> Result<(), Madness> {
    authorize_character(app.get_db(), &account, input.character_id, None).await?;

    app.esi_client
        .post(
            &format!(
                "/v1/ui/openwindow/information/?target_id={}",
                input.target_id
            ),
            &Empty {},
            input.character_id,
            ESIScope::UI_OpenWindow_v1,
        )
        .await?;

    Ok(())
}

pub fn routes() -> Vec<rocket::Route> {
    routes![open_window]
}
