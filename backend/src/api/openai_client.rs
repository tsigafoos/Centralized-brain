use anyhow::Result;

pub struct OpenAIClient {
    endpoint: String,
    client: reqwest::Client,
}

impl OpenAIClient {
    pub fn new(endpoint: String) -> Self {
        Self {
            endpoint,
            client: reqwest::Client::new(),
        }
    }

    pub async fn send_prompt(&self, prompt: &str) -> Result<String> {
        // TODO: Implement OpenAI-compatible endpoint call
        Ok(format!("Mock response for: {}", prompt))
    }
}
