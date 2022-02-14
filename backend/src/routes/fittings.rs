use crate::{
    util::{
        madness::Madness,
    },
};
use crate::{data::yamlhelper};
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use eve_data_core::TypeID;


#[derive(Debug, Serialize)]
pub struct DNAFitting {
    pub name: String,
    pub dna: String,
}
#[derive(Debug, Serialize)]
struct FittingResponse {
    fittingdata: Option<Vec<DNAFitting>>,
	notes: Option<Vec<FittingNote>>,
	rules: Option<Vec<(TypeID, String)>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FittingNote {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
struct NoteFile {
    notes: Vec<FittingNote>,
}

fn load_notes_from_file() -> Vec<FittingNote> {
    let file: NoteFile = yamlhelper::from_file("./data/fitnotes.yaml");
    file.notes
}







#[get("/api/fittings")]
async fn fittings() -> Result<Json<FittingResponse>, Madness> {
    let mut fittingformatted = BTreeMap::new();
    let mut id = 0;
    for fit in crate::data::fits::get_fits().values().flatten() {
        let fitname = fit.name.clone();
        let dna = fit.fit.to_dna().unwrap();
        fittingformatted.entry(id).or_insert_with(|| DNAFitting {
            name: fitname,
            dna: dna.clone(),
        });
        id += 1;
    }
	let mut logirules = Vec::new();
	
	for rule in crate::data::categories::rules(){
		if rule.1 == "logi" {logirules.push(rule.clone())}
		
	}	
    Ok(Json(FittingResponse {
        fittingdata: Some(
            fittingformatted
                .into_iter()
                .map(|(_id, entry)| entry)
                .collect(),
        ),
		notes: Some(load_notes_from_file()),
		rules: Some(logirules),
    }))
}

pub fn routes() -> Vec<rocket::Route> {
    routes![fittings]
}
