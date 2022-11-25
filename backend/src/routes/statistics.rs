use std::collections::BTreeMap;

use eve_data_core::{TypeDB, TypeError, TypeID};
use rocket::serde::json::Json;

use crate::{app::Application, core::auth::AuthenticatedAccount, util::madness::Madness};

use serde::Serialize;

macro_rules! from_unixtime {
    ( $a:expr ) => {
        concat!("from_unixtime(", $a, ")")
    };
}

macro_rules! year_month {
    ( $a:expr ) => {
        concat!("date_format(", $a, ", '%Y-%m')")
    };
}

#[derive(PartialEq, Eq, PartialOrd, Ord, Debug, Clone, Copy)]
struct YearMonth(pub i32, pub i32);

impl std::fmt::Display for YearMonth {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:04}-{:02}", self.0, self.1)
    }
}

impl YearMonth {
    fn parse(input: &str) -> YearMonth {
        let mut pieces = input.split('-');
        let first = pieces
            .next()
            .expect("First piece always there")
            .parse()
            .expect("Should parse");
        let second = pieces
            .next()
            .expect("Second piece better be there")
            .parse()
            .expect("Should parse");
        YearMonth(first, second)
    }
}

impl Serialize for YearMonth {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let formatted = format!("{}", self);
        serializer.serialize_str(&formatted)
    }
}

fn filter_into_other_1d(source: BTreeMap<String, f64>, threshold: f64) -> BTreeMap<String, f64> {
    let sum: f64 = source.values().sum();

    let mut other = 0.;
    let mut result = BTreeMap::new();
    for (name, value) in source {
        if value / sum > threshold {
            result.insert(name, value);
        } else {
            other += value;
        }
    }
    result.insert("Other".to_string(), other);

    result
}

fn filter_into_other_2d<T: Ord>(
    source: BTreeMap<T, BTreeMap<String, f64>>,
    threshold: f64,
) -> BTreeMap<T, BTreeMap<String, f64>> {
    let mut sums = BTreeMap::new();
    let mut total = 0.;

    for series in source.values() {
        for (name, &value) in series {
            *sums.entry(name.to_string()).or_insert(0.) += value;
            total += value;
        }
    }

    let mut result = BTreeMap::new();
    for (top_level_key, series) in source {
        let mut other = 0.;
        let mut these = BTreeMap::new();

        for (name, value) in series {
            let fraction = sums.get(&name).unwrap() / total;
            if fraction > threshold {
                these.insert(name, value);
            } else {
                other += value;
            }
        }

        these.insert("Other".to_string(), other);
        result.insert(top_level_key, these);
    }

    result
}

fn translate_hulls_1d<T: Copy>(
    source: &BTreeMap<TypeID, T>,
) -> Result<BTreeMap<String, T>, TypeError> {
    let ids: Vec<TypeID> = source.keys().copied().collect();
    let types = TypeDB::load_types(&ids)?;

    let mut result = BTreeMap::new();
    for (t, value) in source {
        if let Some(the_type) = types.get(t).unwrap() {
            result.insert(the_type.name.clone(), *value);
        } else {
            return Err(TypeError::NothingMatched);
        }
    }

    Ok(result)
}

fn translate_hulls_2d<K: Copy + Ord, T: Copy>(
    source: &BTreeMap<K, BTreeMap<TypeID, T>>,
) -> Result<BTreeMap<K, BTreeMap<String, T>>, TypeError> {
    let mut result = BTreeMap::new();
    for (k, value) in source {
        result.insert(*k, translate_hulls_1d(value)?);
    }
    Ok(result)
}

struct Queries {}

impl Queries {
    async fn fleet_seconds_by_character_by_month(
        db: &crate::DB,
    ) -> Result<BTreeMap<YearMonth, BTreeMap<i64, f64>>, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct Result {
            yearmonth: String,
            character_id: i64,
            time_in_fleet: i64,
        }

        let res: Vec<Result> = sqlx::query_as(concat!(
            "
            SELECT
                ",
            year_month!(from_unixtime!("first_seen")),
            " yearmonth,
                character_id,
                CAST(SUM(last_seen - first_seen) AS SIGNED) time_in_fleet
            FROM fleet_activity
            GROUP BY 1, 2
        "
        ))
        .fetch_all(db)
        .await?;

        let mut result = BTreeMap::new();
        for row in res {
            result
                .entry(YearMonth::parse(&row.yearmonth))
                .or_insert_with(BTreeMap::new)
                .insert(row.character_id, row.time_in_fleet as f64);
        }

        Ok(result)
    }

    async fn fleet_seconds_by_hull_by_month(
        db: &crate::DB,
    ) -> Result<BTreeMap<YearMonth, BTreeMap<TypeID, f64>>, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct Result {
            yearmonth: String,
            hull: i64,
            time_in_fleet: i64,
        }

        let res: Vec<Result> = sqlx::query_as(concat!(
            "
            SELECT
                ",
            year_month!(from_unixtime!("first_seen")),
            " yearmonth,
                hull,
                CAST(SUM(last_seen - first_seen) AS SIGNED) time_in_fleet
            FROM fleet_activity
            GROUP BY 1, 2
        "
        ))
        .fetch_all(db)
        .await?;

        let mut result = BTreeMap::new();
        for row in res {
            result
                .entry(YearMonth::parse(&row.yearmonth))
                .or_insert_with(BTreeMap::new)
                .insert(row.hull as TypeID, row.time_in_fleet as f64);
        }

        Ok(result)
    }

    async fn xes_by_hull_by_month(
        db: &crate::DB,
    ) -> Result<BTreeMap<YearMonth, BTreeMap<TypeID, f64>>, sqlx::Error> {
        #[derive(sqlx::FromRow)]
        struct Result {
            yearmonth: String,
            hull: i64,
            x_count: i64,
        }

        let res: Vec<Result> = sqlx::query_as(concat!(
            "
            SELECT
                ",
            year_month!(from_unixtime!("logged_at")),
            " yearmonth,
                hull,
                COUNT(DISTINCT character_id) x_count
            FROM fit_history
            JOIN fitting ON fit_history.fit_id=fitting.id
            GROUP BY 1, 2
        "
        ))
        .fetch_all(db)
        .await?;

        let mut result = BTreeMap::new();
        for row in res {
            result
                .entry(YearMonth::parse(&row.yearmonth))
                .or_insert_with(BTreeMap::new)
                .insert(row.hull as TypeID, row.x_count as f64);
        }

        Ok(result)
    }

    async fn xes_by_hull_28d(db: &crate::DB) -> Result<BTreeMap<TypeID, f64>, sqlx::Error> {
        let ago_28d = chrono::Utc::now().timestamp() - (28 * 86400);

        #[derive(sqlx::FromRow)]
        struct Result {
            hull: TypeID,
            x_count: i64,
        }
        let res: Vec<Result> = sqlx::query_as(concat!(
            "
            SELECT
                hull,
                COUNT(DISTINCT character_id) x_count
            FROM fit_history
            JOIN fitting ON fit_history.fit_id=fitting.id
            WHERE logged_at > ?
            GROUP BY 1
            "
        ))
        .bind(ago_28d)
        .fetch_all(db)
        .await?;

        Ok(res
            .into_iter()
            .map(|row| (row.hull as TypeID, row.x_count as f64))
            .collect())
    }

    async fn fleet_seconds_by_hull_28d(
        db: &crate::DB,
    ) -> Result<BTreeMap<TypeID, f64>, sqlx::Error> {
        let ago_28d = chrono::Utc::now().timestamp() - (28 * 86400);

        #[derive(sqlx::FromRow)]
        struct Result {
            hull: TypeID,
            fleet_seconds: i64,
        }
        let res: Vec<Result> = sqlx::query_as(concat!(
            "
            SELECT
                hull,
                CAST(SUM(last_seen - first_seen) AS SIGNED) fleet_seconds
            FROM fleet_activity
            WHERE first_seen > ?
            GROUP BY 1
        "
        ))
        .bind(ago_28d)
        .fetch_all(db)
        .await?;

        Ok(res
            .into_iter()
            .map(|row| (row.hull as TypeID, row.fleet_seconds as f64))
            .collect())
    }
}

struct Displayer {}
impl Displayer {
    fn build_fleet_seconds_by_hull_by_month(
        source: &BTreeMap<YearMonth, BTreeMap<TypeID, f64>>,
    ) -> Result<BTreeMap<YearMonth, BTreeMap<String, f64>>, Madness> {
        Ok(filter_into_other_2d(translate_hulls_2d(source)?, 0.01))
    }

    fn build_xes_by_hull_by_month(
        source: &BTreeMap<YearMonth, BTreeMap<TypeID, f64>>,
    ) -> Result<BTreeMap<YearMonth, BTreeMap<String, f64>>, Madness> {
        Ok(filter_into_other_2d(translate_hulls_2d(source)?, 0.01))
    }

    fn build_fleet_seconds_by_month(
        source: &BTreeMap<YearMonth, BTreeMap<TypeID, f64>>,
    ) -> BTreeMap<YearMonth, f64> {
        source
            .iter()
            .map(|(month, values)| (*month, values.values().sum()))
            .collect()
    }

    fn build_pilots_by_month(
        source: &BTreeMap<YearMonth, BTreeMap<i64, f64>>,
    ) -> BTreeMap<YearMonth, f64> {
        source
            .iter()
            .map(|(month, values)| (*month, values.len() as f64))
            .collect()
    }

    fn build_xes_by_hull_28d(
        source: &BTreeMap<TypeID, f64>,
    ) -> Result<BTreeMap<String, f64>, Madness> {
        Ok(filter_into_other_1d(translate_hulls_1d(source)?, 0.01))
    }

    fn build_fleet_seconds_by_hull_28d(
        source: &BTreeMap<TypeID, f64>,
    ) -> Result<BTreeMap<String, f64>, Madness> {
        Ok(filter_into_other_1d(translate_hulls_1d(source)?, 0.01))
    }

    fn build_x_vs_time_by_hull_28d(
        source_x: &BTreeMap<TypeID, f64>,
        source_time: &BTreeMap<TypeID, f64>,
    ) -> Result<BTreeMap<String, BTreeMap<&'static str, f64>>, Madness> {
        let sum_x: f64 = source_x.values().sum();
        let sum_time: f64 = source_time.values().sum();
        let translated_x = filter_into_other_1d(translate_hulls_1d(source_x)?, 0.01);
        let translated_time = translate_hulls_1d(source_time)?;

        let mut result = BTreeMap::new();
        for (hull, x_count) in translated_x {
            let mut h = BTreeMap::new();
            h.insert("X", x_count / sum_x);
            h.insert("Time", 0.);
            result.insert(hull, h);
        }

        for (hull, time) in translated_time {
            let mut entry = result.get_mut(&hull);
            if entry.is_none() {
                entry = result.get_mut("Other");
            }
            let entry = entry.unwrap(); // filter_into_other guarantees "Other" exists
            *entry.get_mut("Time").unwrap() += time / sum_time;
        }

        Ok(result)
    }

    fn build_time_spent_in_fleet_by_month(
        source: &BTreeMap<YearMonth, BTreeMap<i64, f64>>,
    ) -> BTreeMap<YearMonth, BTreeMap<&'static str, f64>> {
        let mut result = BTreeMap::new();
        for (month, pilots) in source {
            let mut this_month = BTreeMap::new();
            for time_in_fleet in pilots.values() {
                let bucket = match *time_in_fleet {
                    t if t <= (3600. * 1.) => "a. <1h",
                    t if t <= (3600. * 5.) => "b. 1-5h",
                    t if t <= (3600. * 15.) => "c. 5-15h",
                    t if t <= (3600. * 40.) => "d. 15-40h",
                    _ => "e. 40h+",
                };
                *this_month.entry(bucket).or_default() += 1.;
            }
            result.insert(*month, this_month);
        }
        result
    }
}

#[derive(Serialize)]
struct StatsResponse {
    fleet_seconds_by_hull_by_month: BTreeMap<YearMonth, BTreeMap<String, f64>>,
    xes_by_hull_by_month: BTreeMap<YearMonth, BTreeMap<String, f64>>,
    fleet_seconds_by_month: BTreeMap<YearMonth, f64>,
    pilots_by_month: BTreeMap<YearMonth, f64>,
    xes_by_hull_28d: BTreeMap<String, f64>,
    fleet_seconds_by_hull_28d: BTreeMap<String, f64>,
    x_vs_time_by_hull_28d: BTreeMap<String, BTreeMap<&'static str, f64>>,
    time_spent_in_fleet_by_month: BTreeMap<YearMonth, BTreeMap<&'static str, f64>>,
}

#[get("/api/stats")]
async fn statistics(
    app: &rocket::State<Application>,
    account: AuthenticatedAccount,
) -> Result<Json<StatsResponse>, Madness> {
    account.require_access("stats-view")?;

    let seconds_by_character_month =
        Queries::fleet_seconds_by_character_by_month(app.get_db()).await?;
    let seconds_by_hull_month = Queries::fleet_seconds_by_hull_by_month(app.get_db()).await?;
    let xes_by_hull_month = Queries::xes_by_hull_by_month(app.get_db()).await?;
    let xes_by_hull_28d = Queries::xes_by_hull_28d(app.get_db()).await?;
    let seconds_by_hull_28d = Queries::fleet_seconds_by_hull_28d(app.get_db()).await?;

    Ok(Json(StatsResponse {
        fleet_seconds_by_hull_by_month: Displayer::build_fleet_seconds_by_hull_by_month(
            &seconds_by_hull_month,
        )?,
        xes_by_hull_by_month: Displayer::build_xes_by_hull_by_month(&xes_by_hull_month)?,
        fleet_seconds_by_month: Displayer::build_fleet_seconds_by_month(&seconds_by_hull_month),
        pilots_by_month: Displayer::build_pilots_by_month(&seconds_by_character_month),
        xes_by_hull_28d: Displayer::build_xes_by_hull_28d(&xes_by_hull_28d)?,
        fleet_seconds_by_hull_28d: Displayer::build_fleet_seconds_by_hull_28d(
            &seconds_by_hull_28d,
        )?,
        x_vs_time_by_hull_28d: Displayer::build_x_vs_time_by_hull_28d(
            &xes_by_hull_28d,
            &seconds_by_hull_28d,
        )?,
        time_spent_in_fleet_by_month: Displayer::build_time_spent_in_fleet_by_month(
            &seconds_by_character_month,
        ),
    }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![statistics]
}
