use branca::Branca;
use rocket::{
    http::{Header, Status},
    request::{FromRequest, Outcome, Request},
    Response,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

static COOKIE_NAME: &str = "authToken";

lazy_static::lazy_static! {
    static ref ACCESS_LEVELS: BTreeMap<String, BTreeSet<String>> = build_access_levels();
}

pub struct AuthenticatedAccount {
    pub id: i64,
    pub access: &'static std::collections::BTreeSet<String>,
}

#[derive(Debug)]
pub enum AuthenticationError {
    MissingCookie,
    InvalidToken,
    DatabaseError(sqlx::Error),
}

#[derive(Debug)]
pub enum AuthorizationError {
    AccessDenied,
    DatabaseError(sqlx::Error),
}

#[derive(Serialize, Deserialize)]
struct AuthToken {
    version: i32,
    account_id: i64,
}

pub struct CookieSetter(pub String, pub bool);
impl<'r> rocket::response::Responder<'r, 'static> for CookieSetter {
    fn respond_to(self, _: &'r rocket::request::Request<'_>) -> rocket::response::Result<'static> {
        // XXX: Secure is set via a parameter in CookieSetter, but we can get this from the App
        let mut response = Response::new();
        let mut cookie = format!(
            "{}={}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2678400",
            COOKIE_NAME, self.0
        );
        if self.1 {
            cookie += "; Secure";
        }
        response.set_header(Header::new("Set-Cookie", cookie));
        Ok(response)
    }
}

fn decode_token(token: &str, secret: &[u8]) -> Result<AuthToken, AuthenticationError> {
    let branca = Branca::new(secret).unwrap();
    let payload = match branca.decode(token, 31 * 86400) {
        Err(_) => return Err(AuthenticationError::InvalidToken),
        Ok(p) => p,
    };

    let decoded: AuthToken = match rmp_serde::from_read_ref(&payload) {
        Err(_) => return Err(AuthenticationError::InvalidToken),
        Ok(d) => d,
    };

    if decoded.version != 1 || decoded.account_id <= 0 {
        return Err(AuthenticationError::InvalidToken);
    }

    Ok(decoded)
}

pub fn create_cookie(app: &crate::app::Application, account_id: i64) -> CookieSetter {
    let mut branca = Branca::new(&app.token_secret).unwrap();

    let token = AuthToken {
        version: 1,
        account_id,
    };

    let payload = rmp_serde::to_vec_named(&token).unwrap();
    let encoded = branca.encode(&payload).unwrap();
    CookieSetter(encoded, app.config.esi.url.starts_with("https:"))
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthenticatedAccount {
    type Error = AuthenticationError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let app = req
            .guard::<&rocket::State<crate::app::Application>>()
            .await
            .unwrap();

        let token = match req.cookies().get(COOKIE_NAME) {
            None => {
                return Outcome::Failure((Status::Unauthorized, AuthenticationError::MissingCookie))
            }
            Some(t) => match decode_token(t.value(), &app.token_secret) {
                Ok(d) => d,
                Err(e) => return Outcome::Failure((Status::Unauthorized, e)),
            },
        };

        let access_level = match sqlx::query!(
            "SELECT * FROM admins WHERE character_id=?",
            token.account_id
        )
        .fetch_optional(app.get_db())
        .await
        {
            Err(e) => {
                return Outcome::Failure((
                    Status::InternalServerError,
                    AuthenticationError::DatabaseError(e),
                ))
            }
            Ok(Some(r)) => r.level,
            Ok(None) => "user".to_string(),
        };

        let access_keys = match ACCESS_LEVELS.get(&access_level) {
            Some(l) => l,
            None => {
                return Outcome::Failure((Status::Unauthorized, AuthenticationError::InvalidToken))
            }
        };

        Outcome::Success(AuthenticatedAccount {
            id: token.account_id,
            access: access_keys,
        })
    }
}

impl AuthenticatedAccount {
    pub fn require_access(&self, key: &'static str) -> Result<(), AuthorizationError> {
        match self.access.contains(key) {
            true => Ok(()),
            false => Err(AuthorizationError::AccessDenied),
        }
    }
}

fn build_access_levels() -> BTreeMap<String, BTreeSet<String>> {
    fn build_level(
        working: &mut BTreeMap<String, BTreeSet<String>>,
        source: &str,
        dest: &str,
        keys: Vec<&str>,
    ) {
        let mut level = working.get(source).cloned().unwrap();
        for key in keys {
            level.insert(key.to_string());
        }
        working.insert(dest.to_string(), level);
    }

    let mut result = BTreeMap::new();
    result.insert("user".to_string(), BTreeSet::new());

    build_level(
        &mut result,
        "user",
        "trainee",
        vec![
            "fleet-configure",
            "fleet-invite",
            "fleet-view",
            "pilot-view",
            "waitlist-view",
        ],
    );
    build_level(
        &mut result,
        "trainee",
        "trainee-advanced",
        vec!["fit-view", "skill-view", "waitlist-manage"],
    );
    build_level(
        &mut result,
        "trainee-advanced",
        "fc",
        vec![
            "fleet-activity-view",
            "fleet-comp-history",
            "fit-history-view",
            "search",
            "skill-history-view",
            "waitlist-edit",
            "stats-view",
            "access-view",
        ],
    );
    build_level(
        &mut result,
        "fc",
        "fc-trainer",
        vec![
            "access-manage",
            "access-manage:trainee",
            "access-manage:trainee-advanced",
            "access-manage:fc",
        ],
    );
    build_level(
        &mut result,
        "fc-trainer",
        "council",
        vec!["bans-view", "bans-manage", "access-manage:fc-trainer"],
    );
    build_level(&mut result, "council", "admin", vec!["access-manage-all"]);

    result
}

pub fn get_access_keys(level: &str) -> Option<&'static BTreeSet<String>> {
    ACCESS_LEVELS.get(level)
}

pub async fn authorize_character(
    db: &crate::DB,
    account: &AuthenticatedAccount,
    character_id: i64,
    permission_override: Option<&str>,
) -> Result<(), AuthorizationError> {
    if account.id == character_id {
        return Ok(());
    }

    if permission_override.is_some() && account.access.contains(permission_override.unwrap()) {
        return Ok(());
    }

    let alt_character = sqlx::query!(
        "SELECT alt_id FROM alt_character WHERE account_id = ? AND alt_id = ?",
        account.id,
        character_id
    )
    .fetch_optional(db)
    .await;

    match alt_character {
        Err(e) => Err(AuthorizationError::DatabaseError(e)),
        Ok(None) => Err(AuthorizationError::AccessDenied),
        Ok(Some(_)) => Ok(()),
    }
}
