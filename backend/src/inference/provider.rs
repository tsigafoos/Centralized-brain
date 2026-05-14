use anyhow::Result;
use async_trait::async_trait;

/// Inference provider: local GGUF or cloud OpenAI-compatible endpoint
#[async_trait]
pub trait InferenceProvider: Send + Sync {
    /// Run inference synchronously and return full response
    async fn infer(&self, prompt: &str, max_tokens: usize, temperature: f32) -> Result<String>;

    /// Stream tokens as they are generated. Returns a channel receiver.
    async fn infer_stream(
        &self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
    ) -> Result<tokio::sync::mpsc::Receiver<Result<String>>>;

    /// Get provider name for logging/debugging
    fn name(&self) -> &'static str;
}

/// Local GGUF inference configuration
#[derive(Debug, Clone)]
pub struct LocalGGUFConfig {
    pub models_dir: std::path::PathBuf,
    pub ctx_size: u32,
    pub threads: Option<usize>,
}

/// Cloud OpenAI-compatible endpoint configuration
#[derive(Debug, Clone)]
pub struct CloudOpenAIConfig {
    pub endpoint: String,
    pub api_key: Option<String>,
}
