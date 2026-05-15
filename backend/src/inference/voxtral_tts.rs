use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct VoxtralConfig {
    pub api_key: String,
    pub api_endpoint: String, // Default: https://api.mistral.ai/v1/audio/speech
}

#[derive(Debug, Serialize)]
struct VoxtralRequest {
    model: String,
    input: String,
    voice: String,
}

#[derive(Debug, Deserialize)]
struct VoxtralResponse {
    #[serde(default)]
    audio_url: Option<String>,
    #[serde(default)]
    error: Option<String>,
}

pub struct VoxtralTTS {
    config: VoxtralConfig,
    client: reqwest::Client,
}

impl VoxtralTTS {
    pub fn new(config: VoxtralConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    /// Generate speech from text using Voxtral
    pub async fn synthesize(
        &self,
        text: &str,
        voice: &str,
    ) -> Result<Vec<u8>> {
        if text.is_empty() {
            return Err(anyhow::anyhow!("Text cannot be empty"));
        }

        let request = VoxtralRequest {
            model: "mistral-voxtral-1".to_string(),
            input: text.to_string(),
            voice: voice.to_string(),
        };

        let response: reqwest::Response = self
            .client
            .post(&format!("{}/speech", self.config.api_endpoint))
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text: String = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!(
                "Voxtral API error: {}",
                error_text
            ));
        }

        // Voxtral returns audio as binary (WAV)
        let audio_bytes = response.bytes().await?;
        Ok(audio_bytes.to_vec())
    }

    /// List available voices
    pub fn available_voices() -> Vec<&'static str> {
        vec![
            "Alice",
            "Bob",
            "Charlie",
            "Diana",
            "Elena",
            "Frank",
        ]
    }
}
