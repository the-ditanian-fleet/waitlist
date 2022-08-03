use rocket::serde::json::Json;

use crate::{
    app::Application,
    core::{
        auth::{authorize_character, AuthenticatedAccount},
        esi::ESIScope,
        sse::Event,
    },
    util::madness::Madness,
};
use eve_data_core::{TypeDB, TypeID};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct InviteRequest {
    id: i64,
    character_id: i64,
}

#[post("/api/waitlist/invite", data = "<input>")]
async fn invite(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<InviteRequest>,
) -> Result<&'static str, Madness> {
    account.require_access("fleet-invite")?;
    authorize_character(app.get_db(), &account, input.character_id, None).await?;
    let xup = sqlx::query!(
        "
            SELECT
                wef.id wef_id,
                wef.category wef_category,
                wef.character_id wef_character_id,
				wef.is_alt wef_is_alt,
                we.account_id we_account_id,
                fitting.hull fitting_hull
            FROM waitlist_entry_fit wef
            JOIN waitlist_entry we ON wef.entry_id=we.id
            JOIN fitting ON wef.fit_id = fitting.id
            WHERE wef.id = ?
        ",
        input.id
    )
    .fetch_one(app.get_db())
    .await?;
    // needs to match category.yaml file
    let select_cat = if xup.wef_is_alt > 0 {
        "alt".to_string()
    } else {
        xup.wef_category
    };
    let squad_info = match sqlx::query!(
        "
            SELECT fleet_id, squad_id, wing_id FROM fleet
            JOIN fleet_squad ON fleet.id=fleet_squad.fleet_id
            WHERE boss_id=? AND category=?
        ",
        input.character_id,
        select_cat,
    )
    .fetch_optional(app.get_db())
    .await?
    {
        Some(fleet) => fleet,
        None => return Err(Madness::BadRequest("Fleet not configured".to_string())),
    };

    #[derive(Debug, Serialize)]
    struct Invite {
        character_id: i64,
        role: &'static str,
        squad_id: i64,
        wing_id: i64,
    }
    app.esi_client
        .post(
            &format!("/v1/fleets/{}/members/", squad_info.fleet_id),
            &Invite {
                character_id: xup.wef_character_id,
                role: "squad_member",
                squad_id: squad_info.squad_id,
                wing_id: squad_info.wing_id,
            },
            input.character_id,
            ESIScope::Fleets_WriteFleet_v1,
        )
        .await?;

    app.sse_client
        .submit(vec![Event::new(
            &format!("account;{}", xup.we_account_id),
            "wakeup",
            format!(
                "You have been invited to fleet with {}",
                TypeDB::name_of(xup.fitting_hull as TypeID)?
            ),
        )])
        .await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![invite]
}
