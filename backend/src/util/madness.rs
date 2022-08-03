use std::io::Cursor;

use rocket::http::Status;
use rocket::Response;

use crate::core::esi::ESIError;
use crate::core::sse::SSEError;
use crate::{core::auth::AuthorizationError, data::skills::SkillsError};

use eve_data_core::{FitError, TypeError};

#[derive(thiserror::Error, Debug)]
pub enum Madness {
    #[error("database error")]
    DatabaseError(#[from] sqlx::Error),
    #[error("SSE error: {0}")]
    SSEError(#[from] SSEError),
    #[error("ESI error: {0}")]
    ESIError(#[from] ESIError),
    #[error("type error: {0}")]
    TypeError(#[from] TypeError),
    #[error("fit error: {0}")]
    FitError(#[from] FitError),

    #[error("{0}")]
    BadRequest(String),
    #[error("access denied")]
    AccessDenied,
    #[error("{0}")]
    NotFound(&'static str),
}

impl From<AuthorizationError> for Madness {
    fn from(error: AuthorizationError) -> Self {
        match error {
            AuthorizationError::DatabaseError(e) => e.into(),
            AuthorizationError::AccessDenied => Self::AccessDenied,
        }
    }
}

impl From<SkillsError> for Madness {
    fn from(error: SkillsError) -> Self {
        match error {
            SkillsError::Database(e) => e.into(),
            SkillsError::ESIError(e) => e.into(),
        }
    }
}

impl<'r> rocket::response::Responder<'r, 'static> for Madness {
    fn respond_to(self, _: &'r rocket::request::Request<'_>) -> rocket::response::Result<'static> {
        let status = match &self {
            Self::AccessDenied | Self::ESIError(ESIError::MissingScope | ESIError::NoToken) => {
                Status::Unauthorized
            }

            Self::DatabaseError(_)
            | Self::SSEError(_)
            | Self::ESIError(
                ESIError::HTTPError(_) | ESIError::DatabaseError(_) | ESIError::Status(_),
            ) => Status::InternalServerError,

            
            Self::ESIError( ESIError::WithMessage(code, _body) ) => Status { code: *code },

            Self::NotFound(_) => Status::NotFound,

            Self::FitError(_) | Self::BadRequest(_) | Self::TypeError(_) => Status::BadRequest,
        };

        if status == Status::InternalServerError {
            error!("Request error: {}: {:#?}", self, self);
        }

        let error = format!("{}", self);
        Ok(Response::build()
            .sized_body(error.len(), Cursor::new(error))
            .status(status)
            .finalize())
    }
}
