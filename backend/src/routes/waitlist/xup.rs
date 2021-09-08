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
    util::madness::{Madness, UserMadness},
};
use eve_data_core::{Category, Fitting, TypeDB, TypeID};

#[derive(Debug, Deserialize)]
struct XupRequest {
    eft: String,
    waitlist_id: i64,
    character_id: i64,
}

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
            &format!("/v4/characters/{}/", character_id),
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

#[post("/api/waitlist/xup", data = "<input>")]
async fn xup(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
    input: Json<XupRequest>,
) -> Result<&'static str, Madness> {
    authorize_character(app.get_db(), &account, input.character_id, None).await?;

    let now = chrono::Utc::now().timestamp();

    let fits = Fitting::from_eft(&input.eft)?;
    if fits.is_empty() {
        return Err(UserMadness::BadRequest("No fits supplied".to_string()).into());
    } else if fits.len() > 10 {
        return Err(UserMadness::BadRequest("Too many fits".to_string()).into());
    }

    if sqlx::query!(
        "SELECT id FROM waitlist WHERE id=? AND is_open=1",
        input.waitlist_id
    )
    .fetch_optional(app.get_db())
    .await?
    .is_none()
    {
        return Err(UserMadness::BadRequest("Waitlist is closed".to_string()).into());
    }

    if am_i_banned(app, input.character_id).await? {
        return Err(UserMadness::BadRequest("You are banned".to_string()).into());
    }

    let time_in_fleet = get_time_in_fleet(app.get_db(), input.character_id).await?;
    let implants = implants::get_implants(app, input.character_id).await?;
    let skills = skills::load_skills(&app.esi_client, app.get_db(), input.character_id).await?;

    let mut tx = app.get_db().begin().await?;

    let entry_id = match sqlx::query!(
        "SELECT id FROM waitlist_entry WHERE account_id=? AND waitlist_id=?",
        account.id,
        input.waitlist_id
    )
    .fetch_optional(&mut tx)
    .await?
    {
        Some(e) => e.id,
        None => {
            let result = sqlx::query!(
                "INSERT INTO waitlist_entry (waitlist_id, account_id, joined_at) VALUES (?, ?, ?)",
                input.waitlist_id,
                account.id,
                now,
            )
            .execute(&mut tx)
            .await?;
            crate::last_insert_id!(result)
        }
    };

    if sqlx::query!(
        "SELECT COUNT(*) count FROM waitlist_entry_fit WHERE entry_id=?",
        entry_id
    )
    .fetch_one(&mut tx)
    .await?
    .count
        > 10
    {
        return Err(UserMadness::BadRequest("Too many fits".to_string()).into());
    }

    let implant_set_id = dedup_implants(&mut tx, &implants).await?;

    let pilot_data = tdf::fitcheck::PilotData {
        implants: &implants,
        time_in_fleet,
        skills: &skills,
        access_keys: account.access,
    };

    for fit in fits {
        let hull_type = TypeDB::load_type(fit.hull)?;
        if hull_type.category != Category::Ship {
            return Err(UserMadness::BadRequest("Only ships can fly".to_string()).into());
        }

        let fit_id = dedup_dna(&mut tx, fit.hull, &fit.to_dna()?).await?;

        // Delete existing X'up for the hull
        if let Some(existing_x) = sqlx::query!("
            SELECT waitlist_entry_fit.id FROM waitlist_entry_fit JOIN fitting ON fit_id=fitting.id WHERE entry_id = ? AND hull = ?
        ", entry_id, fit.hull).fetch_optional(&mut tx).await? {
            sqlx::query!("DELETE FROM waitlist_entry_fit WHERE id = ?", existing_x.id).execute(&mut tx).await?;
        }

        let fit_checked = tdf::fitcheck::FitChecker::check(&pilot_data, &fit)?;
        if let Some(error) = fit_checked.errors.into_iter().next() {
            return Err(UserMadness::BadRequest(error).into());
        }

        let tags = fit_checked.tags.join(",");
        let fit_analysis: Option<String> = fit_checked
            .analysis
            .map(|f| serde_json::to_string(&f).unwrap());

        // Add the fit to the waitlist
        sqlx::query!("
            INSERT INTO waitlist_entry_fit (character_id, entry_id, fit_id, category, approved, tags, implant_set_id, fit_analysis, cached_time_in_fleet)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", input.character_id, entry_id, fit_id, fit_checked.category, fit_checked.approved, tags, implant_set_id, fit_analysis, time_in_fleet)
        .execute(&mut tx).await?;

        // Log the x'up
        sqlx::query!(
            "INSERT INTO fit_history (character_id, fit_id, implant_set_id, logged_at) VALUES (?, ?, ?, ?)",
            input.character_id, fit_id, implant_set_id, now,
        ).execute(&mut tx).await?;
    }

    tx.commit().await?;

    super::notify::notify_waitlist_update_and_xup(app, input.waitlist_id).await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![xup]
}
