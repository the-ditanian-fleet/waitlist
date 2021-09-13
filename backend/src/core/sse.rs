use branca::Branca;
use serde::Serialize;

pub struct SSEClient {
    branca: Branca,
    http: reqwest::Client,
    url: String,
}

#[derive(thiserror::Error, Debug)]
pub enum SSEError {
    #[error("HTTP error while contacting SSE server")]
    HTTPError(#[from] reqwest::Error),
}

#[derive(Debug, Serialize)]
struct SseSubscribe<'a> {
    topics: &'a [String],
}

#[derive(Debug, Serialize)]
pub struct Event<'a> {
    topic: &'a str,
    event: &'a str,
    data: String,
}

#[derive(Debug, Serialize)]
struct Submission<'a> {
    events: Vec<Event<'a>>,
}

impl SSEClient {
    pub fn new(url: String, key: &[u8]) -> SSEClient {
        SSEClient {
            url,
            http: reqwest::Client::new(),
            branca: Branca::new(key).unwrap(),
        }
    }

    pub fn events_url(&self, topics: &[String]) -> String {
        let request = SseSubscribe { topics };
        let payload = rmp_serde::to_vec_named(&request).unwrap();
        let token = self.branca.clone().encode(&payload).unwrap();
        format!("{}/events?token={}", self.url, token)
    }

    pub async fn submit(&self, events: Vec<Event<'_>>) -> Result<(), SSEError> {
        let submission = Submission { events };
        let payload = rmp_serde::to_vec_named(&submission).unwrap();
        let encoded = self.branca.clone().encode(&payload).unwrap();

        self.http
            .post(format!("{}/submit", self.url))
            .body(encoded)
            .send()
            .await?
            .error_for_status()?;

        Ok(())
    }
}

impl<'a> Event<'a> {
    pub fn new(topic: &'a str, event: &'a str, data: String) -> Event<'a> {
        Event { topic, event, data }
    }

    pub fn new_json<E: Serialize + ?Sized>(
        topic: &'a str,
        event: &'a str,
        data: &'_ E,
    ) -> Event<'a> {
        let encoded = serde_json::to_string(data).unwrap();
        Self::new(topic, event, encoded)
    }
}
