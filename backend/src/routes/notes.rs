use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

use crate::{
    app,
    core::auth::AuthenticatedAccount,
    util::{madness::Madness, types::Character},
};

#[derive(Debug, Serialize)]
struct NotesListNote {
    author: Character,
    logged_at: i64,
    note: String,
}

#[derive(Debug, Serialize)]
struct NotesList {
    notes: Vec<NotesListNote>,
}

#[get("/api/notes?<character_id>")]
async fn list_notes(
    account: AuthenticatedAccount,
    character_id: i64,
    app: &rocket::State<app::Application>,
) -> Result<Json<NotesList>, Madness> {
    account.require_access("notes-view")?;

    let notes_q = sqlx::query!(
        "
            SELECT author_id, author.name author_name, note, logged_at FROM character_note
            JOIN `character` author ON author.id = author_id
            WHERE character_id = ?
        ",
        character_id
    )
    .fetch_all(app.get_db())
    .await?;
    let notes = notes_q
        .into_iter()
        .map(|note| NotesListNote {
            author: Character {
                id: note.author_id,
                name: note.author_name,
                corporation_id: None,
            },
            logged_at: note.logged_at,
            note: note.note,
        })
        .collect();

    Ok(Json(NotesList { notes }))
}

#[derive(Deserialize)]
struct AddNoteInput {
    character_id: i64,
    note: String,
}

#[post("/api/notes/add", data = "<input>")]
async fn add_note(
    account: AuthenticatedAccount,
    app: &rocket::State<app::Application>,
    input: Json<AddNoteInput>,
) -> Result<&'static str, Madness> {
    account.require_access("notes-add")?;

    if input.note.len() < 20 || input.note.len() > 5000 {
        return Err(Madness::BadRequest("Invalid note".to_string()));
    }

    let now = chrono::Utc::now().timestamp();
    sqlx::query!(
        "INSERT INTO character_note (author_id, character_id, note, logged_at) VALUES (?, ?, ?, ?)",
        account.id,
        input.character_id,
        input.note,
        now,
    )
    .execute(app.get_db())
    .await?;

    Ok("OK")
}

pub fn routes() -> Vec<rocket::Route> {
    routes![list_notes, add_note]
}
