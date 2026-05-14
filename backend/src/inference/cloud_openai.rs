use crate::inference::provider::{CloudOpenAIConfig, InferenceProvider};
use anyhow::Result;
use async_trait::async_trait;
use tokio::sync::mpsc;

/// Cloud OpenAI-compatible inference (TODO: implement proper streaming)
pub struct CloudOpenAIInference {
    config: CloudOpenAIConfig,
}

impl CloudOpenAIInference {
    /// Create new cloud OpenAI inference provider
    pub fn new(config: CloudOpenAIConfig) -> Self {
        Self { config }
    }
}

#[async_trait]
impl InferenceProvider for CloudOpenAIInference {
    async fn infer(&self, _prompt: &str, _max_tokens: usize, _temperature: f32) -> Result<String> {
        Err(anyhow::anyhow!(
            "Cloud OpenAI inference not yet implemented. Endpoint: {}",
            self.config.endpoint
        ))
    }

    async fn infer_stream(
        &self,
        _prompt: &str,
        _max_tokens: usize,
        _temperature: f32,
    ) -> Result<mpsc::Receiver<Result<String>>> {
        Err(anyhow::anyhow!(
            "Cloud OpenAI streaming not yet implemented"
        ))
    }

    fn name(&self) -> &'static str {
        "CloudOpenAI"
    }
}
