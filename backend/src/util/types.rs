use eve_data_core::TypeID;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug)]
pub struct Character {
    pub id: i64,
    pub name: String,
}

#[derive(Serialize, Debug)]
pub struct Hull {
    pub id: TypeID,
    pub name: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct WaitlistCategory {
    pub id: String,
    pub name: String,
}
