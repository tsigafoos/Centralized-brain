use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Settings {
    pub server_host: String,
    pub server_port: u16,
    pub openai_endpoint: String,
    pub voice_backend: VoiceBackend,
    pub storage_path: String,
    pub firebase_project_id: Option<String>,
    pub google_cloud_credentials: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum VoiceBackend {
    Local,
    Google,
}

impl Settings {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        let voice_backend = match env::var("VOICE_BACKEND").unwrap_or_default().as_str() {
            "google" => VoiceBackend::Google,
            _ => VoiceBackend::Local,
        };

        Ok(Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()?,
            openai_endpoint: env::var("OPENAI_ENDPOINT")
                .unwrap_or_else(|_| "http://127.0.0.1:8001".to_string()),
            voice_backend,
            storage_path: env::var("STORAGE_PATH")
                .unwrap_or_else(|_| "./data".to_string()),
            firebase_project_id: env::var("FIREBASE_PROJECT_ID").ok(),
            google_cloud_credentials: env::var("GOOGLE_CLOUD_CREDENTIALS").ok(),
        })
    }
}
