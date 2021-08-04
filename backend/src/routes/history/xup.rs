use crate::{
    app,
    core::auth::{authorize_character, AuthenticatedAccount},
    util::{madness::Madness, types::Hull},
};

use eve_data_core::{TypeDB, TypeID};
use rocket::serde::json::Json;
use serde::Serialize;

#[derive(Serialize, Debug)]
struct XupHistoryLine {
    logged_at: i64,
    dna: String,
    implants: Vec<TypeID>,
    hull: Hull,
}

#[derive(Serialize, Debug)]
struct XupHistory {
    xups: Vec<XupHistoryLine>,
}

#[get("/api/history/xup?<character_id>")]
async fn xup_history(
    character_id: i64,
    account: AuthenticatedAccount,
    app: &rocket::State<app::Application>,
) -> Result<Json<XupHistory>, Madness> {
    authorize_character(
        app.get_db(),
        &account,
        character_id,
        Some("fit-history-view"),
    )
    .await?;

    let xups = sqlx::query!(
        "
        SELECT dna, hull, implants, logged_at FROM fit_history
        JOIN fitting ON fit_history.fit_id=fitting.id
        JOIN implant_set ON fit_history.implant_set_id=implant_set.id
        WHERE character_id = ?
        ORDER BY fit_history.id DESC
    ",
        character_id
    )
    .fetch_all(app.get_db())
    .await?;

    let mut lines = Vec::new();
    for xup in xups {
        lines.push(XupHistoryLine {
            logged_at: xup.logged_at,
            dna: xup.dna,
            implants: xup
                .implants
                .split(':')
                .filter(|s| !s.is_empty())
                .map(|i| i.parse::<TypeID>().unwrap())
                .collect(),
            hull: Hull {
                id: xup.hull as TypeID,
                name: TypeDB::name_of(xup.hull as TypeID)?,
            },
        });
    }

    Ok(Json(XupHistory { xups: lines }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![xup_history]
}
