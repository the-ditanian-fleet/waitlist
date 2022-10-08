use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, sync::Arc};

struct ESIRawClient {
    http: reqwest::Client,
    client_id: String,
    client_secret: String,
}

pub struct ESIClient {
    db: Arc<crate::DB>,
    raw: ESIRawClient,
}

pub struct EsiErrorReason {
    pub error: String,
    pub details: String,
}

impl EsiErrorReason {
    // CCP returns a poorly structured error when fleet invites fail
    // so we need to provide special parsing logic to grab the error
    // message. If the POST error is related to anything else, we should
    // be able to grab the error property without additional logic.
    pub fn new(body: String) -> Self {
        let json: Result<serde_json::Value, serde_json::Error> = serde_json::from_str(&body);

        match json {
            Ok(json) => {
                let body_value = json.get("error").unwrap().to_string();
                let parts: Vec<&str> = body_value.split(", ").collect();

                return EsiErrorReason {
                    error: parts[0].to_string().replace('"', ""),
                    details: "".to_string(), // We could grab the remaining JSON value but
                };                           // I don't know how to do it without the logic
            }                                // crashing due to index out of bounds
            Err(e) => {
                return EsiErrorReason {
                    error: "Failed to parse ESI error reason".to_string(),
                    details: e.to_string(),
                };
            }
        };
    }
}

#[derive(Debug, Deserialize)]
struct OAuthTokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
}

#[derive(Debug)]
pub struct AuthResult {
    pub character_id: i64,
    pub character_name: String,
    pub access_token: String,
    pub access_token_expiry: chrono::DateTime<chrono::Utc>,
    pub refresh_token: String,
    pub scopes: BTreeSet<String>,
}

#[derive(thiserror::Error, Debug)]
pub enum ESIError {
    #[error("database error")]
    DatabaseError(#[from] sqlx::Error),
    #[error("ESI http error")]
    HTTPError(reqwest::Error),
    #[error("ESI returned {0}")]
    Status(u16),
    #[error("{1}")]
    WithMessage(u16, String),
    #[error("no ESI token found")]
    NoToken,
    #[error("missing ESI scope")]
    MissingScope,
}

#[derive(Debug, Clone, Copy)]
#[allow(non_camel_case_types)]
pub enum ESIScope {
    PublicData,
    Fleets_ReadFleet_v1,
    Fleets_WriteFleet_v1,
    UI_OpenWindow_v1,
    Skills_ReadSkills_v1,
    Clones_ReadImplants_v1,
    Search_v1,
}

impl ESIScope {
    pub fn as_str(&self) -> &'static str {
        use ESIScope::*;
        match self {
            PublicData => "publicData",
            Fleets_ReadFleet_v1 => "esi-fleets.read_fleet.v1",
            Fleets_WriteFleet_v1 => "esi-fleets.write_fleet.v1",
            UI_OpenWindow_v1 => "esi-ui.open_window.v1",
            Skills_ReadSkills_v1 => "esi-skills.read_skills.v1",
            Clones_ReadImplants_v1 => "esi-clones.read_implants.v1",
            Search_v1 => "esi-search.search_structures.v1",
        }
    }
}

impl From<reqwest::Error> for ESIError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_status() {
            return ESIError::Status(error.status().unwrap().as_u16());
        }
        ESIError::HTTPError(error)
    }
}

impl ESIRawClient {
    pub fn new(client_id: String, client_secret: String) -> ESIRawClient {
        ESIRawClient {
            http: reqwest::Client::builder()
                .user_agent("Waitlist (https://github.com/TvdW/tdf-waitlist)")
                .build()
                .unwrap(),
            client_id,
            client_secret,
        }
    }

    async fn process_oauth_token(
        &self,
        grant_type: &str,
        token: &str,
        scopes: Option<&BTreeSet<String>>,
    ) -> Result<OAuthTokenResponse, ESIError> {
        #[derive(Serialize)]
        struct OAuthTokenRequest<'a> {
            grant_type: &'a str,
            refresh_token: Option<&'a str>,
            code: Option<&'a str>,
            scope: Option<String>,
        }

        let scope_str = scopes.map(|s| join_scopes(s));

        let request = OAuthTokenRequest {
            grant_type,
            refresh_token: match grant_type {
                "refresh_token" => Some(token),
                _ => None,
            },
            code: match grant_type {
                "refresh_token" => None,
                _ => Some(token),
            },
            scope: scope_str,
        };
        Ok(self
            .http
            .post("https://login.eveonline.com/v2/oauth/token")
            .basic_auth(&self.client_id, Some(&self.client_secret))
            .form(&request)
            .send()
            .await?
            .error_for_status()?
            .json::<OAuthTokenResponse>()
            .await?)
    }

    async fn process_verify(
        &self,
        access_token: &str,
    ) -> Result<(i64, String, BTreeSet<String>), ESIError> {
        #[derive(Debug, Deserialize)]
        struct VerifyResponse {
            #[serde(rename = "CharacterID")]
            character_id: i64,
            #[serde(rename = "CharacterName")]
            character_name: String,
            #[serde(rename = "Scopes")]
            scopes: String,
        }

        let result: VerifyResponse = self
            .get("https://login.eveonline.com/oauth/verify", access_token)
            .await?
            .json()
            .await?;
        let scopes = split_scopes(&result.scopes);
        Ok((result.character_id, result.character_name, scopes))
    }

    pub async fn process_auth(
        &self,
        grant_type: &str,
        token: &str,
        scopes: Option<&BTreeSet<String>>,
    ) -> Result<AuthResult, ESIError> {
        let token = self.process_oauth_token(grant_type, token, scopes).await?;
        let (character_id, name, scopes) = self.process_verify(&token.access_token).await?;
        Ok(AuthResult {
            character_id,
            character_name: name,
            access_token: token.access_token,
            access_token_expiry: chrono::Utc::now()
                + chrono::Duration::seconds(token.expires_in / 2),
            refresh_token: token.refresh_token,
            scopes,
        })
    }

    pub async fn get(&self, url: &str, access_token: &str) -> Result<reqwest::Response, ESIError> {
        Ok(self
            .http
            .get(url)
            .bearer_auth(access_token)
            .send()
            .await?
            .error_for_status()?)
    }

    pub async fn get_unauthenticated(&self, url: &str) -> Result<reqwest::Response, ESIError> {
        Ok(self.http.get(url).send().await?.error_for_status()?)
    }
    
    pub async fn delete(
        &self,
        url: &str,
        access_token: &str,
    ) -> Result<reqwest::Response, ESIError> {
        Ok(self
            .http
            .delete(url)
            .bearer_auth(access_token)
            .send()
            .await?
            .error_for_status()?)
    }

    pub async fn post<E: Serialize + ?Sized>(
        &self,
        url: &str,
        input: &E,
        access_token: &str,
    ) -> Result<reqwest::Response, ESIError> {
        let response = self
            .http
            .post(url)
            .bearer_auth(access_token)
            .json(input)
            .send()
            .await?;

        if let Err(err) = response.error_for_status_ref() {
            let response_body = response.text().await?;
            let payload: EsiErrorReason = EsiErrorReason::new(response_body);
            return Err(ESIError::WithMessage(
                err.status().unwrap().as_u16(),
                payload.error,
            ));
        };

        Ok(response)
    }
}

impl ESIClient {
    pub fn new(database: Arc<crate::DB>, client_id: String, client_secret: String) -> ESIClient {
        ESIClient {
            db: database,
            raw: ESIRawClient::new(client_id, client_secret),
        }
    }

    pub async fn process_authorization_code(&self, code: &str) -> Result<i64, ESIError> {
        let mut result = self
            .raw
            .process_auth("authorization_code", code, None)
            .await?;

        if let Some(previous_token) = sqlx::query!(
            "SELECT * FROM refresh_token WHERE character_id=?",
            result.character_id
        )
        .fetch_optional(self.db.as_ref())
        .await?
        {
            let mut merged_scopes = result.scopes.clone();
            for extra_scope in split_scopes(&previous_token.scopes) {
                merged_scopes.insert(extra_scope);
            }

            let second_attempt = match self
                .raw
                .process_auth("refresh_token", &result.refresh_token, Some(&merged_scopes))
                .await
            {
                Ok(r) => r,
                Err(ESIError::Status(400)) => result,
                Err(e) => return Err(e),
            };

            result = second_attempt;
        }

        self.save_auth(&result).await?;
        Ok(result.character_id)
    }

    async fn save_auth(&self, auth: &super::esi::AuthResult) -> Result<(), sqlx::Error> {
        let mut tx = self.db.begin().await?;

        if sqlx::query!("SELECT id FROM `character` WHERE id=?", auth.character_id)
            .fetch_optional(&mut tx)
            .await?
            .is_none()
        {
            sqlx::query!(
                "INSERT INTO `character` (id, name) VALUES (?, ?)",
                auth.character_id,
                auth.character_name
            )
            .execute(&mut tx)
            .await?;
        }

        let expiry_timestamp = auth.access_token_expiry.timestamp();
        let scopes = join_scopes(&auth.scopes);
        sqlx::query!(
            "REPLACE INTO access_token (character_id, access_token, expires, scopes) VALUES (?, ?, ?, ?)",
            auth.character_id,
            auth.access_token,
            expiry_timestamp,
            scopes,
        )
        .execute(&mut tx)
        .await?;

        sqlx::query!(
            "REPLACE INTO refresh_token (character_id, refresh_token, scopes) VALUES (?, ?, ?)",
            auth.character_id,
            auth.refresh_token,
            scopes,
        )
        .execute(&mut tx)
        .await?;

        tx.commit().await?;

        Ok(())
    }

    async fn access_token_raw(
        &self,
        character_id: i64,
    ) -> Result<(String, BTreeSet<String>), ESIError> {
        if let Some(record) = sqlx::query!(
            "SELECT * FROM access_token WHERE character_id=?",
            character_id
        )
        .fetch_optional(self.db.as_ref())
        .await?
        {
            if record.expires >= chrono::Utc::now().timestamp() {
                return Ok((record.access_token, split_scopes(&record.scopes)));
            }
        }

        let refresh = match sqlx::query!(
            "SELECT * FROM refresh_token WHERE character_id=?",
            character_id
        )
        .fetch_optional(self.db.as_ref())
        .await?
        {
            Some(r) => r,
            None => return Err(ESIError::NoToken),
        };

        let refresh_scopes = split_scopes(&refresh.scopes);
        let refreshed = match self
            .raw
            .process_auth(
                "refresh_token",
                &refresh.refresh_token,
                Some(&refresh_scopes),
            )
            .await
        {
            Ok(r) => r,
            Err(ESIError::Status(400)) => {
                warn!(
                    "Deleting refresh token for character {} as it failed to be used: HTTP 400",
                    character_id
                );
                let mut tx = self.db.begin().await?;
                sqlx::query!(
                    "DELETE FROM access_token WHERE character_id=?",
                    character_id
                )
                .execute(&mut tx)
                .await?;
                sqlx::query!(
                    "DELETE FROM refresh_token WHERE character_id=?",
                    character_id
                )
                .execute(&mut tx)
                .await?;
                tx.commit().await?;

                return Err(ESIError::NoToken);
            }
            Err(e) => return Err(e),
        };
        self.save_auth(&refreshed).await?;

        Ok((refreshed.access_token, refreshed.scopes))
    }

    async fn access_token(&self, character_id: i64, scope: ESIScope) -> Result<String, ESIError> {
        let (token, scopes) = self.access_token_raw(character_id).await?;

        if !scopes.contains(scope.as_str()) {
            return Err(ESIError::MissingScope);
        }

        Ok(token)
    }

    pub async fn get<D: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        character_id: i64,
        scope: ESIScope,
    ) -> Result<D, ESIError> {
        let access_token = self.access_token(character_id, scope).await?;
        let url = format!("https://esi.evetech.net{}", path);
        Ok(self.raw.get(&url, &access_token).await?.json().await?)
    }

    pub async fn get_unauthenticated<D: serde::de::DeserializeOwned>(
        &self,
        path: &str,
    ) -> Result<D, ESIError> {
        let url = format!("https://esi.evetech.net{}", path);
        Ok(self.raw.get_unauthenticated(&url).await?.json().await?)
    }

    pub async fn delete(
        &self,
        path: &str,
        character_id: i64,
        scope: ESIScope,
    ) -> Result<(), ESIError> {
        let access_token = self.access_token(character_id, scope).await?;
        let url = format!("https://esi.evetech.net{}", path);
        self.raw.delete(&url, &access_token).await?;
        Ok(())
    }

    pub async fn post<E: Serialize + ?Sized>(
        &self,
        path: &str,
        input: &E,
        character_id: i64,
        scope: ESIScope,
    ) -> Result<(), ESIError> {
        let access_token = self.access_token(character_id, scope).await?;
        let url = format!("https://esi.evetech.net{}", path);
        self.raw.post::<E>(&url, input, &access_token).await?;
        Ok(())
    }
}

pub mod fleet_members {
    use eve_data_core::TypeID;

    use crate::core::esi::ESIScope;

    use super::{ESIClient, ESIError};
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    pub struct ESIFleetMember {
        pub character_id: i64,
        pub ship_type_id: TypeID,
        pub squad_id: i64,
    }

    pub async fn get(
        client: &ESIClient,
        fleet_id: i64,
        boss_id: i64,
    ) -> Result<Vec<ESIFleetMember>, ESIError> {
        Ok(client
            .get(
                &format!("/v1/fleets/{}/members", fleet_id),
                boss_id,
                ESIScope::Fleets_ReadFleet_v1,
            )
            .await?)
    }
}

fn split_scopes(input: &str) -> BTreeSet<String> {
    input
        .split(' ')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

fn join_scopes(input: &BTreeSet<String>) -> String {
    input.iter().fold(String::new(), |a, b| a + b + " ")
}
