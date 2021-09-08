use rocket::serde::json::Json;
use serde::Serialize;
use std::collections::HashMap;

use crate::{
    app::Application,
    core::auth::{authorize_character, AuthenticatedAccount},
    util::{
        madness::Madness,
        types::{Character, Hull},
    },
};

use eve_data_core::{TypeDB, TypeID};

#[derive(Serialize, Debug)]
struct ActivityEntry {
    hull: Hull,
    logged_at: i64,
    time_in_fleet: i64,
}

#[derive(Serialize, Debug)]
struct ActivitySummaryEntry {
    hull: Hull,
    time_in_fleet: i64,
}

#[derive(Serialize, Debug)]
struct ActivityResponse {
    activity: Vec<ActivityEntry>,
    summary: Vec<ActivitySummaryEntry>,
}

#[get("/api/history/fleet?<character_id>")]
async fn fleet_history(
    character_id: i64,
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<ActivityResponse>, Madness> {
    authorize_character(
        app.get_db(),
        &account,
        character_id,
        Some("fleet-activity-view"),
    )
    .await?;

    let mut time_by_hull = HashMap::new();
    let activity = sqlx::query!(
        "SELECT hull, first_seen, last_seen FROM fleet_activity WHERE character_id=? ORDER BY first_seen DESC",
        character_id
    )
    .fetch_all(app.get_db())
    .await?
    .into_iter()
    .map(|row| (row.hull as TypeID, row.first_seen, row.last_seen));

    let mut entries = Vec::new();
    for (hull, first_seen, last_seen) in activity {
        let time_in_fleet = last_seen - first_seen;
        *time_by_hull.entry(hull).or_insert(0) += time_in_fleet;

        entries.push(ActivityEntry {
            hull: Hull {
                id: hull,
                name: TypeDB::name_of(hull)?,
            },
            logged_at: first_seen,
            time_in_fleet,
        });
    }

    let mut summary = Vec::new();
    for (hull, time_in_fleet) in time_by_hull {
        summary.push(ActivitySummaryEntry {
            hull: Hull {
                id: hull,
                name: TypeDB::name_of(hull)?,
            },
            time_in_fleet,
        })
    }
    summary.sort_by(|a, b| b.time_in_fleet.cmp(&a.time_in_fleet));

    Ok(Json(ActivityResponse {
        activity: entries,
        summary,
    }))
}

#[derive(Debug, Serialize)]
struct FleetCompEntry {
    hull: Hull,
    character: Character,
    logged_at: i64,
    time_in_fleet: i64,
    is_boss: bool,
}

#[derive(Debug, Serialize)]
struct FleetCompResponse {
    fleets: HashMap<i64, Vec<FleetCompEntry>>,
}

#[get("/api/history/fleet-comp?<time>")]
async fn fleet_comp(
    time: i64,
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<FleetCompResponse>, Madness> {
    account.require_access("fleet-comp-history")?;

    let comp = sqlx::query!(
        "
            SELECT fleet_id, hull, first_seen, last_seen, character_id, is_boss, `character`.name AS character_name
            FROM fleet_activity JOIN `character` ON character_id=`character`.id
            WHERE first_seen <= ? AND last_seen >= ?
        ",
        time,
        time
    )
    .fetch_all(app.get_db())
    .await?;

    let mut fleets = HashMap::new();
    for entry in comp {
        let fleet = fleets.entry(entry.fleet_id).or_insert_with(Vec::new);

        fleet.push(FleetCompEntry {
            hull: Hull {
                id: entry.hull as TypeID,
                name: TypeDB::name_of(entry.hull as TypeID)?,
            },
            character: Character {
                id: entry.character_id,
                name: entry.character_name,
            },
            logged_at: entry.first_seen,
            time_in_fleet: entry.last_seen - entry.first_seen,
            is_boss: entry.is_boss > 0,
        })
    }

    Ok(Json(FleetCompResponse { fleets }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![fleet_history, fleet_comp]
}
