use crate::{
    app::Application,
    core::esi::{ESIError, ESIScope},
};
use eve_data_core::TypeID;

pub async fn get_implants(app: &Application, character_id: i64) -> Result<Vec<TypeID>, ESIError> {
    let path = format!("/v2/characters/{}/implants/", character_id);
    Ok(app
        .esi_client
        .get(&path, character_id, ESIScope::Clones_ReadImplants_v1)
        .await?)
}
