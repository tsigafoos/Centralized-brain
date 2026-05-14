use crate::inference::provider::{CloudOpenAIConfig, InferenceProvider};
use anyhow::Result;
use async_trait::async_trait;
use serde_json::json;
use tokio::sync::mpsc;

/// Cloud OpenAI-compatible inference
pub struct CloudOpenAIInference {
    config: CloudOpenAIConfig,
    client: reqwest::Client,
}

impl CloudOpenAIInference {
    /// Create new cloud OpenAI inference provider
    pub fn new(config: CloudOpenAIConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl InferenceProvider for CloudOpenAIInference {
    async fn infer(&self, prompt: &str, max_tokens: usize, temperature: f32) -> Result<String> {
        let body = json!({
            "model": "gpt-3.5-turbo",
            "messages": [
                { "role": "user", "content": prompt }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
        });

        let mut req = self.client.post(&format!("{}/v1/chat/completions", self.config.endpoint));

        if let Some(ref api_key) = self.config.api_key {
            req = req.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = req.json(&body).send().await?;
        let result: serde_json::Value = response.json().await?;

        let content = result["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("No response content"))?;

        Ok(content.to_string())
    }

    async fn infer_stream(
        &self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
    ) -> Result<mpsc::Receiver<Result<String>>> {
        let (tx, rx) = mpsc::channel(64);
        let config = self.config.clone();
        let client = self.client.clone();
        let prompt = prompt.to_string();

        tokio::spawn(async move {
            let body = json!({
                "model": "gpt-3.5-turbo",
                "messages": [
                    { "role": "user", "content": prompt }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": true,
            });

            let mut req = client.post(&format!("{}/v1/chat/completions", config.endpoint));

            if let Some(ref api_key) = config.api_key {
                req = req.header("Authorization", format!("Bearer {}", api_key));
            }

            match req.json(&body).send().await {
                Ok(response) => {
                    let mut stream = response.bytes_stream();
                    while let Some(chunk) = tokio_stream::StreamExt::next(&mut stream).await {
                        match chunk {
                            Ok(bytes) => {
                                let text = String::from_utf8_lossy(&bytes).to_string();
                                if let Err(_) = tx.send(Ok(text)).await {
                                    break;
                                }
                            }
                            Err(e) => {
                                let _ = tx.send(Err(e.into())).await;
                                break;
                            }
                        }
                    }
                }
                Err(e) => {
                    let _ = tx.send(Err(e.into())).await;
                }
            }
        });

        Ok(rx)
    }

    fn name(&self) -> &'static str {
        "CloudOpenAI"
    }
}
