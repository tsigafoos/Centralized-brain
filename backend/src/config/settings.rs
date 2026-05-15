use anyhow::Result;
use std::env;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Settings {
    pub server_host: String,
    pub server_port: u16,
    pub inference_mode: InferenceMode,
    pub models_dir: PathBuf,
    pub openai_endpoint: String,
    pub voice_backend: VoiceBackend,
    pub storage_path: String,
    pub firebase_project_id: Option<String>,
    pub google_cloud_credentials: Option<String>,
    pub voxtral_api_key: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum InferenceMode {
    Local,   // Embedded llama.cpp with GGUF models
    Cloud,   // OpenAI-compatible endpoint
}

#[derive(Debug, Clone, PartialEq)]
pub enum VoiceBackend {
    Local,
    Google,
}

impl Settings {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        let inference_mode = match env::var("INFERENCE_MODE").unwrap_or_default().as_str() {
            "cloud" => InferenceMode::Cloud,
            _ => InferenceMode::Local, // Default to local (offline-first)
        };

        let voice_backend = match env::var("VOICE_BACKEND").unwrap_or_default().as_str() {
            "google" => VoiceBackend::Google,
            _ => VoiceBackend::Local,
        };

        let storage_path = env::var("STORAGE_PATH")
            .unwrap_or_else(|_| "./data".to_string());

        // Ensure models directory exists
        let models_dir = PathBuf::from(
            env::var("MODELS_DIR")
                .unwrap_or_else(|_| format!("{}/models", storage_path))
        );

        std::fs::create_dir_all(&models_dir).ok();

        Ok(Self {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()?,
            inference_mode,
            models_dir,
            openai_endpoint: env::var("OPENAI_ENDPOINT")
                .unwrap_or_else(|_| "http://127.0.0.1:8001".to_string()),
            voice_backend,
            storage_path,
            firebase_project_id: env::var("FIREBASE_PROJECT_ID").ok(),
            google_cloud_credentials: env::var("GOOGLE_CLOUD_CREDENTIALS").ok(),
            voxtral_api_key: env::var("VOXTRAL_API_KEY").ok(),
        })
    }
}
