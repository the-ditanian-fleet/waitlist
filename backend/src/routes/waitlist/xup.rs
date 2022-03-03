use std::collections::{HashMap, HashSet};

use rocket::serde::json::Json;
use serde::Deserialize;

use crate::{
    app::Application,
    core::{
        auth::{authorize_character, AuthenticatedAccount},
        esi::ESIScope,
    },
    data::{implants, skills},
    tdf,
    util::madness::Madness,
};
use eve_data_core::{Fitting, TypeID};

#[derive(Debug, Deserialize)]
struct DnaXup {
    character_id: i64,
    dna: String,
}

#[derive(Debug, Deserialize)]
struct XupRequest {
    waitlist_id: i64,

    character_id: i64,
    eft: String,
    is_alt: bool,

    #[serde(default)]
    dna: Vec<DnaXup>,
}

const MAX_X_PER_ACCOUNT: usize = 10;

async fn dedup_implants(db: &mut crate::DBTX<'_>, implants: &[TypeID]) -> Result<i64, sqlx::Error> {
    let mut implants = Vec::from(implants);
    implants.sort_unstable();
    let implant_str = implants
        .into_iter()
        .map(|i| i.to_string())
        .collect::<Vec<_>>()
        .join(":");

    if let Some(implant_set) =
        sqlx::query!("SELECT id FROM implant_set WHERE implants = ?", implant_str)
            .fetch_optional(&mut *db)
            .await?
    {
        return Ok(implant_set.id);
    }

    let result = sqlx::query!("INSERT INTO implant_set (implants) VALUES (?)", implant_str)
        .execute(&mut *db)
        .await?;
    Ok(crate::last_insert_id!(result))
}

async fn dedup_dna(db: &mut crate::DBTX<'_>, hull: TypeID, dna: &str) -> Result<i64, sqlx::Error> {
    if let Some(fitting) = sqlx::query!("SELECT id FROM fitting WHERE dna = ?", dna)
        .fetch_optional(&mut *db)
        .await?
    {
        return Ok(fitting.id);
    };

    let result = sqlx::query!("INSERT INTO fitting (dna, hull) VALUES (?, ?)", dna, hull)
        .execute(&mut *db)
        .await?;
    Ok(crate::last_insert_id!(result))
}

async fn get_time_in_fleet(db: &crate::DB, character_id: i64) -> Result<i64, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct TimeResult {
        seconds: Option<i64>,
    }
    let result: TimeResult = sqlx::query_as::<_, TimeResult>(
        "SELECT CAST(SUM(last_seen - first_seen) AS SIGNED) AS seconds FROM fleet_activity WHERE character_id=?",
    )
    .bind(character_id)
    .fetch_one(db)
    .await?;
    Ok(result.seconds.unwrap_or(0))
}

async fn am_i_banned_check(db: &crate::DB, kind: &str, id: i64) -> Result<bool, sqlx::Error> {
    let now = chrono::Utc::now();
    Ok(sqlx::query!(
        "SELECT id FROM ban WHERE kind=? AND id=? AND (expires_at IS NULL OR expires_at > ?)",
        kind,
        id,
        now
    )
    .fetch_optional(db)
    .await?
    .is_some())
}

async fn am_i_banned(app: &Application, character_id: i64) -> Result<bool, Madness> {
    if am_i_banned_check(app.get_db(), "character", character_id).await? {
        return Ok(true);
    }

    #[derive(Deserialize)]
    struct ESIInfo {
        corporation_id: Option<i64>,
        alliance_id: Option<i64>,
    }

    let esi_info: ESIInfo = app
        .esi_client
        .get(
            &format!("/v5/characters/{}/", character_id),
            character_id,
            ESIScope::PublicData,
        )
        .await?;

    if let Some(corporation_id) = esi_info.corporation_id {
        if am_i_banned_check(app.get_db(), "corporation", corporation_id).await? {
            return Ok(true);
        }
    }
    if let Some(alliance_id) = esi_info.alliance_id {
        if am_i_banned_check(app.get_db(), "alliance", alliance_id).await? {
            return Ok(true);
        }
    }

    Ok(false)
}

async fn xup_multi(
    app: &Application,
    account: AuthenticatedAccount,
    waitlist_id: i64,
    xups: Vec<(i64, Fitting)>,
    is_alt: bool,
) -> Result<(), Madness> {
    // Track the "now" from the start of the operation, to keep things fair
    let now = chrono::Utc::now().timestamp();

    // Input sanity
    if xups.is_empty() {
        return Err(Madness::BadRequest("No fits supplied".to_string()));
    } else if xups.len() > MAX_X_PER_ACCOUNT {
        return Err(Madness::BadRequest("Too many fits".to_string()));
    }

    // Make sure the waitlist is actually open
    if sqlx::query!(
        "SELECT id FROM waitlist WHERE id=? AND is_open=1",
        waitlist_id
    )
    .fetch_optional(app.get_db())
    .await?
    .is_none()
    {
        return Err(Madness::BadRequest("Waitlist is closed".to_string()));
    }

    // Dedupe character IDs to avoid double work
    let mut character_ids = HashSet::new();
    for xup in xups.iter() {
        character_ids.insert(xup.0);
    }

    // Check permissions/bans on all characters, and get ESI info
    let mut character_info = HashMap::new();
    for character_id in character_ids {
        authorize_character(app.get_db(), &account, character_id, None).await?;
        if am_i_banned(app, character_id).await? {
            return Err(Madness::BadRequest("You are banned".to_string()));
        }

        let time_in_fleet = get_time_in_fleet(app.get_db(), character_id).await?;
        let implants = implants::get_implants(app, character_id).await?;
        let skills = skills::load_skills(&app.esi_client, app.get_db(), character_id).await?;

        character_info.insert(character_id, (time_in_fleet, implants, skills));
    }

    let mut pilot_data = HashMap::new();
    for (character_id, (time_in_fleet, implants, skills)) in character_info.iter() {
        pilot_data.insert(
            character_id,
            tdf::fitcheck::PilotData {
                implants,
                time_in_fleet: *time_in_fleet,
                skills,
                access_keys: account.access,
            },
        );
    }

    // ESI work should now be done, start a db transaction
    let mut tx = app.get_db().begin().await?;

    // Create the waitlist_entry record
    let entry_id = match sqlx::query!(
        "SELECT id FROM waitlist_entry WHERE account_id=? AND waitlist_id=?",
        account.id,
        waitlist_id
    )
    .fetch_optional(&mut tx)
    .await?
    {
        Some(e) => e.id,
        None => {
            let result = sqlx::query!(
                "INSERT INTO waitlist_entry (waitlist_id, account_id, joined_at) VALUES (?, ?, ?)",
                waitlist_id,
                account.id,
                now,
            )
            .execute(&mut tx)
            .await?;
            crate::last_insert_id!(result)
        }
    };

    // Spam protection: limit x'es per account
    if (sqlx::query!(
        "SELECT COUNT(*) count FROM waitlist_entry_fit WHERE entry_id=?",
        entry_id
    )
    .fetch_one(&mut tx)
    .await?
    .count as usize)
        + xups.len()
        > MAX_X_PER_ACCOUNT
    {
        return Err(Madness::BadRequest("Too many fits".to_string()));
    }

    // Actually write the individual entries now
    for (character_id, fit) in xups {
        fit.validate()?;
        let this_pilot_data = pilot_data.get(&character_id).unwrap();

        let fit_id = dedup_dna(&mut tx, fit.hull, &fit.to_dna()?).await?;
        let implant_set_id = dedup_implants(&mut tx, this_pilot_data.implants).await?;

        // Delete existing X'up for the hull
        if let Some(existing_x) = sqlx::query!("
        SELECT waitlist_entry_fit.id FROM waitlist_entry_fit JOIN fitting ON fit_id=fitting.id WHERE character_id = ? AND hull = ?
        ",character_id, fit.hull).fetch_optional(&mut tx).await? {
            sqlx::query!("DELETE FROM waitlist_entry_fit WHERE id = ?", existing_x.id).execute(&mut tx).await?;
        }

        let fit_checked = tdf::fitcheck::FitChecker::check(this_pilot_data, &fit)?;
        if let Some(error) = fit_checked.errors.into_iter().next() {
            return Err(Madness::BadRequest(error));
        }

        let tags = fit_checked.tags.join(",");
        let fit_analysis: Option<String> = fit_checked
            .analysis
            .map(|f| serde_json::to_string(&f).unwrap());

        // Add the fit to the waitlist
        sqlx::query!("
            INSERT INTO waitlist_entry_fit (character_id, entry_id, fit_id, category, approved, tags, implant_set_id, fit_analysis, cached_time_in_fleet, is_alt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", character_id, entry_id, fit_id, fit_checked.category, fit_checked.approved, tags, implant_set_id, fit_analysis, this_pilot_data.time_in_fleet, is_alt)
        .execute(&mut tx).await?;

        // Log the x'up
        sqlx::query!(
            "INSERT INTO fit_history (character_id, fit_id, implant_set_id, logged_at) VALUES (?, ?, ?, ?)",
            character_id, fit_id, implant_set_id, now,
        ).execute(&mut tx).await?;
    }

    // Done! Commit
    tx.commit().await?;

    // Let people and listeners know what just happened
    super::notify::notify_waitlist_update_and_xup(app, waitlist_id).await?;

    Ok(())
}

#[post("/api/waitlist/xup", data = "<input>")]
async fn xup(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<XupRequest>,
) -> Result<&'static str, Madness> {
    // Character authorization is done by xup_multi!

    // EFT x'es
    let fits = Fitting::from_eft(&input.eft)?;
    let mut xups: Vec<_> = fits
        .into_iter()
        .map(|fit| (input.character_id, fit))
        .collect();

    // DNA x'es
    for dna_xup in &input.dna {
        let fit = Fitting::from_dna(&dna_xup.dna)?;
        xups.push((dna_xup.character_id, fit));
    }

    xup_multi(app, account, input.waitlist_id, xups, input.is_alt).await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![xup]
}
