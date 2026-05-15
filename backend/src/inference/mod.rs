pub mod response_parser;
pub mod provider;
pub mod local_gguf;
pub mod cloud_openai;
pub mod model_manager;
pub mod voxtral_tts;

pub use response_parser::ResponseParser;
pub use provider::{InferenceProvider, LocalGGUFConfig, CloudOpenAIConfig};
pub use local_gguf::LocalGGUFInference;
pub use cloud_openai::CloudOpenAIInference;
pub use model_manager::ModelManager;
pub use voxtral_tts::{VoxtralTTS, VoxtralConfig};

use anyhow::Result;
use std::sync::Arc;

/// Factory function to create the right inference provider based on config
pub async fn create_inference_provider(
    inference_mode: &str,
    local_config: Option<LocalGGUFConfig>,
    cloud_config: Option<CloudOpenAIConfig>,
) -> Result<Arc<dyn InferenceProvider>> {
    match inference_mode.to_lowercase().as_str() {
        "local" => {
            let config = local_config
                .ok_or_else(|| anyhow::anyhow!("Local GGUF config required for local mode"))?;
            Ok(Arc::new(LocalGGUFInference::new(config)?))
        }
        "cloud" | "openai" => {
            let config = cloud_config
                .ok_or_else(|| anyhow::anyhow!("Cloud OpenAI config required for cloud mode"))?;
            Ok(Arc::new(CloudOpenAIInference::new(config)))
        }
        _ => Err(anyhow::anyhow!(
            "Unknown inference mode: {}. Use 'local' or 'cloud'",
            inference_mode
        )),
    }
}
