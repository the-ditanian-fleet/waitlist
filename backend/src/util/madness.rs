use std::io::Cursor;

use rocket::http::Status;
use rocket::Response;

use crate::core::esi::ESIError;
use crate::core::sse::SSEError;
use crate::{core::auth::AuthorizationError, data::skills::SkillsError};

use eve_data_core::{FitError, TypeError};

#[derive(Debug)]
pub enum InternalMadness {
    Database(sqlx::Error),
    ESIError(ESIError),
    SSEError(SSEError),
    TypeError(TypeError),
}

#[derive(Debug)]
pub enum UserMadness {
    AccessDenied,
    FitError(FitError),
    ESIScopeMissing,
    BadRequest(String),
    NotFound(&'static str),
}

#[derive(Debug)]
pub enum Madness {
    Internal(InternalMadness),
    User(UserMadness),
}

impl From<sqlx::Error> for Madness {
    fn from(error: sqlx::Error) -> Self {
        Madness::Internal(InternalMadness::Database(error))
    }
}

impl From<AuthorizationError> for Madness {
    fn from(error: AuthorizationError) -> Self {
        match error {
            AuthorizationError::DatabaseError(e) => e.into(),
            AuthorizationError::AccessDenied => UserMadness::AccessDenied.into(),
        }
    }
}

impl From<ESIError> for Madness {
    fn from(error: ESIError) -> Self {
        match error {
            ESIError::DatabaseError(e) => e.into(),
            ESIError::MissingScope => UserMadness::ESIScopeMissing.into(),
            _ => InternalMadness::ESIError(error).into(),
        }
    }
}

impl From<SSEError> for Madness {
    fn from(error: SSEError) -> Self {
        InternalMadness::SSEError(error).into()
    }
}

impl From<TypeError> for Madness {
    fn from(error: TypeError) -> Self {
        InternalMadness::TypeError(error).into()
    }
}

impl From<FitError> for Madness {
    fn from(error: FitError) -> Self {
        UserMadness::FitError(error).into()
    }
}

impl From<SkillsError> for Madness {
    fn from(error: SkillsError) -> Self {
        match error {
            SkillsError::ESIError(e) => e.into(),
            SkillsError::Database(e) => e.into(),
        }
    }
}

impl From<UserMadness> for Madness {
    fn from(error: UserMadness) -> Self {
        Madness::User(error)
    }
}

impl From<InternalMadness> for Madness {
    fn from(error: InternalMadness) -> Self {
        Madness::Internal(error)
    }
}

impl<'r> rocket::response::Responder<'r, 'static> for Madness {
    fn respond_to(self, _: &'r rocket::request::Request<'_>) -> rocket::response::Result<'static> {
        match self {
            Self::Internal(e) => {
                error!("Something went wrong in the request! {:#?}", e);
                Err(Status::InternalServerError)
            }
            Self::User(e) => match e {
                UserMadness::NotFound(e) => Ok(Response::build()
                    .sized_body(e.len(), Cursor::new(e))
                    .status(Status::NotFound)
                    .finalize()),
                UserMadness::BadRequest(e) => Ok(Response::build()
                    .sized_body(e.len(), Cursor::new(e))
                    .status(Status::BadRequest)
                    .finalize()),
                UserMadness::ESIScopeMissing => {
                    let err = "Missing ESI scopes";
                    Ok(Response::build()
                        .sized_body(err.len(), Cursor::new(err))
                        .status(Status::Unauthorized)
                        .finalize())
                }
                UserMadness::FitError(e) => {
                    let reason = match e {
                        FitError::InvalidFit => "Invalid fit",
                        FitError::InvalidModule => "Invalid module",
                        FitError::InvalidCount => "Invalid count",
                        FitError::InvalidHull => "Only ships can fly",
                    };
                    Ok(Response::build()
                        .sized_body(reason.len(), Cursor::new(reason))
                        .status(Status::BadRequest)
                        .finalize())
                }
                UserMadness::AccessDenied => Err(Status::Unauthorized),
            },
        }
    }
}
