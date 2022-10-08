use rocket::serde::json::Json;

use crate::{
    app::Application,
    core::{
        auth::{authorize_character, AuthenticatedAccount},
        esi::ESIScope,
    },
    util::{madness::Madness, types::Character},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct SearchResponse {
    query: String,
    results: Vec<Character>,
}

#[derive(Debug, Deserialize)]
struct EsiSearchRequest {
    search: String,
    category: String,
    strict: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct EsiSearchResponse {
    character: Option<Vec<i32>>,
    corporation: Option<Vec<i32>>,
    alliance: Option<Vec<i32>>,
}

#[get("/api/search?<query>")]
async fn query(
    query: String,
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
) -> Result<Json<SearchResponse>, Madness> {
    account.require_access("search")?;

    let search_like = format!("%{}%", query);
    let results = sqlx::query!(
        "SELECT id, name FROM `character` WHERE name LIKE ?",
        search_like
    )
    .fetch_all(app.get_db())
    .await?
    .into_iter()
    .map(|r| Character {
        id: r.id,
        name: r.name,
    })
    .collect();

    Ok(Json(SearchResponse { query, results }))
}

// ESI Search: Resolve names to IDs using
// GET /latest/characters/:characterId/search
#[post("/api/search", data = "<req_body>")]
async fn esi_search(
    account: AuthenticatedAccount,
    app: &rocket::State<Application>,
    req_body: Json<EsiSearchRequest>,
) -> Result<Json<Vec<i32>>, Madness> {
    account.require_access("fleet-invite")?; // Any FC has the search scope.

    authorize_character(app.get_db(), &account, account.id, None).await?;

    if !(req_body.category.contains("character")
        || req_body.category.contains("corporation")
        || req_body.category.contains("alliance"))
    {
        return Err(Madness::BadRequest(format!(
            "Body paramater \"category\" must be one of [\"{}\", \"{}\", \"{}\"]",
            "character", "corporation", "alliance"
        )));
    }

    let ids: EsiSearchResponse = app
        .esi_client
        .get(
            &format!(
                "/latest/characters/{}/search/?categories={}&search={}&strict={}",
                account.id,
                req_body.category,
                req_body.search,
                match req_body.strict {
                    Some(bool) => bool,
                    None => false,
                }
            ),
            account.id,
            ESIScope::Search_v1,
        )
        .await?;

    if let Some(ids) = ids.character {
        Ok(Json(ids))
    } else if let Some(ids) = ids.corporation {
        Ok(Json(ids))
    } else if let Some(ids) = ids.alliance {
        Ok(Json(ids))
    } else {
        Ok(Json(Vec::new()))
    }
}

pub fn routes() -> Vec<rocket::Route> {
    routes![esi_search, query]
}