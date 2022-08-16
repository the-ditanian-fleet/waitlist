use eve_data_core::TypeID;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug, Clone)]
pub struct Character {
    pub id: i64,
    pub name: String,
}

#[derive(Serialize, Debug)]
pub struct Hull {
    pub id: TypeID,
    pub name: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct WaitlistCategory {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct CharacterAndLevel {
    pub id: i64,
    pub name: String,
    pub tags: Vec<String>,
}
