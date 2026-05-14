use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait TextToSpeechProvider: Send + Sync {
    async fn synthesize(&self, text: &str) -> Result<Vec<u8>>;
}

pub struct PiperProvider {
    model_path: String,
}

impl PiperProvider {
    pub fn new(model_path: String) -> Self {
        Self { model_path }
    }
}

#[async_trait]
impl TextToSpeechProvider for PiperProvider {
    async fn synthesize(&self, _text: &str) -> Result<Vec<u8>> {
        // TODO: Implement local Piper TTS
        Ok(vec![])
    }
}

pub struct GoogleTextToSpeechProvider {
    client: reqwest::Client,
}

impl GoogleTextToSpeechProvider {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl TextToSpeechProvider for GoogleTextToSpeechProvider {
    async fn synthesize(&self, _text: &str) -> Result<Vec<u8>> {
        // TODO: Implement Google Cloud Text-to-Speech
        Ok(vec![])
    }
}
