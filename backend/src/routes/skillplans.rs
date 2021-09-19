use eve_data_core::{SkillLevel, TypeDB, TypeID};
use rocket::serde::json::Json;
use serde::Serialize;

use crate::{
    core::auth::AuthenticatedAccount,
    data::skillplans::{self, SkillPlan, SkillPlanError, SkillPlanLevel},
    util::types::Hull,
};

#[derive(Debug, Serialize)]
struct SkillPlansResponse {
    plans: Vec<SkillPlansResponsePlan>,
}

#[derive(Debug, Serialize)]
struct SkillPlansResponsePlan {
    source: SkillPlan,
    levels: Vec<(TypeID, SkillLevel)>,
    ships: Vec<Hull>,
}

fn build_data() -> Result<SkillPlansResponse, SkillPlanError> {
    let plans = skillplans::load_plans_from_file();
    let mut result = Vec::new();
    for plan in plans {
        let levels = skillplans::build_plan(&plan)?;
        let mut ships = Vec::new();

        for level in &plan.plan {
            match level {
                SkillPlanLevel::Skills { from, tier: _ } => {
                    let ship_id = TypeDB::id_of(from)?;
                    if !ships.contains(&ship_id) {
                        ships.push(ship_id);
                    }
                }
                SkillPlanLevel::Fit { hull, fit: _ } => {
                    let ship_id = TypeDB::id_of(hull)?;
                    if !ships.contains(&ship_id) {
                        ships.push(ship_id);
                    }
                }
                _ => (),
            };
        }

        let ships_lookup = TypeDB::load_types(&ships)?;
        let mut hulls = Vec::new();
        for ship in ships {
            let hull = ships_lookup
                .get(&ship)
                .unwrap()
                .as_ref()
                .expect("Ships exist");
            hulls.push(Hull {
                id: ship,
                name: hull.name.clone(),
            });
        }

        result.push(SkillPlansResponsePlan {
            source: plan,
            levels,
            ships: hulls,
        });
    }

    Ok(SkillPlansResponse { plans: result })
}

lazy_static::lazy_static! {
    static ref PLAN_DATA: SkillPlansResponse = build_data().unwrap();
}

#[get("/api/skills/plans")]
fn get_skill_plans(_account: AuthenticatedAccount) -> Json<&'static SkillPlansResponse> {
    Json(&PLAN_DATA)
}

pub fn routes() -> Vec<rocket::Route> {
    routes![get_skill_plans]
}
