use std::collections::BTreeMap;

use eve_data_core::{TypeDB, TypeID};
use rocket::serde::json::Json;
use serde::Serialize;

use crate::{core::auth::AuthenticatedAccount, util::madness::Madness};

#[derive(Debug, Serialize)]
struct Module {
    name: String,
    category: &'static str,
    slot: Option<&'static str>,
}
type ModuleResponse = BTreeMap<TypeID, Module>;

fn module_info_impl(ids: &[TypeID]) -> Result<ModuleResponse, Madness> {
    let mut result = BTreeMap::new();
    for (id, typeinfo) in TypeDB::load_types(ids)? {
        if let Some(typeinfo) = typeinfo {
            result.insert(
                id,
                Module {
                    name: typeinfo.name.clone(),
                    category: typeinfo.category.category_name(),
                    slot: typeinfo.slot(),
                },
            );
        }
    }

    Ok(result)
}

lazy_static::lazy_static! {
    static ref PRELOAD: ModuleResponse = make_preload();
}

#[get("/api/module/info?<ids>")]
fn module_info(
    _account: AuthenticatedAccount,
    ids: String,
) -> Result<Json<ModuleResponse>, Madness> {
    let mut type_ids = Vec::new();
    for id in ids.split(',') {
        let numeric_id = id.parse::<TypeID>();
        if numeric_id.is_err() {
            return Err(Madness::BadRequest("Invalid type ID given".to_string()));
        }
        type_ids.push(numeric_id.unwrap());
    }

    if type_ids.len() > 200 {
        return Err(Madness::BadRequest("Too many IDs".to_string()));
    }

    Ok(Json(module_info_impl(&type_ids)?))
}

fn make_preload() -> ModuleResponse {
    let module_ids = crate::data::fits::used_module_ids();
    module_info_impl(&module_ids).unwrap()
}

#[get("/api/module/preload")]
fn preload() -> Json<&'static ModuleResponse> {
    Json(&PRELOAD)
}

pub fn routes() -> Vec<rocket::Route> {
    routes![module_info, preload]
}
