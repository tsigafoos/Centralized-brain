use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait SpeechToTextProvider: Send + Sync {
    async fn transcribe(&self, audio_data: Vec<u8>) -> Result<String>;
}

pub struct WhisperProvider {
    model_path: String,
}

impl WhisperProvider {
    pub fn new(model_path: String) -> Self {
        Self { model_path }
    }
}

#[async_trait]
impl SpeechToTextProvider for WhisperProvider {
    async fn transcribe(&self, _audio_data: Vec<u8>) -> Result<String> {
        // TODO: Implement local Whisper transcription
        Ok("Transcribed text from local Whisper".to_string())
    }
}

pub struct GoogleSpeechProvider {
    client: reqwest::Client,
}

impl GoogleSpeechProvider {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl SpeechToTextProvider for GoogleSpeechProvider {
    async fn transcribe(&self, _audio_data: Vec<u8>) -> Result<String> {
        // TODO: Implement Google Cloud Speech-to-Text
        Ok("Transcribed text from Google".to_string())
    }
}
