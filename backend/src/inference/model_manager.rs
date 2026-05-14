use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub path: PathBuf,
    pub size_mb: u64,
    pub loaded: bool,
}

pub struct ModelManager {
    models_dir: PathBuf,
    loaded_model: Arc<RwLock<Option<String>>>,
}

impl ModelManager {
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            models_dir,
            loaded_model: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn list_models(&self) -> Result<Vec<ModelInfo>> {
        let mut models = Vec::new();

        if !self.models_dir.exists() {
            return Ok(models);
        }

        let entries = std::fs::read_dir(&self.models_dir)?;
        let loaded = self.loaded_model.read().await.clone();

        for entry in entries {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(filename) = path.file_name() {
                    if let Some(name_str) = filename.to_str() {
                        if name_str.ends_with(".gguf") {
                            let metadata = std::fs::metadata(&path)?;
                            let size_mb = metadata.len() / (1024 * 1024);
                            let id = name_str.replace(".gguf", "");

                            models.push(ModelInfo {
                                id: id.clone(),
                                name: name_str.to_string(),
                                path,
                                size_mb,
                                loaded: loaded.as_ref().map(|l| l == &id).unwrap_or(false),
                            });
                        }
                    }
                }
            }
        }

        // Sort by name
        models.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(models)
    }

    pub async fn load_model(&self, model_id: &str) -> Result<()> {
        // Verify model exists
        let models = self.list_models().await?;
        if !models.iter().any(|m| m.id == model_id) {
            return Err(anyhow!("Model not found: {}", model_id));
        }

        let mut loaded = self.loaded_model.write().await;
        *loaded = Some(model_id.to_string());

        Ok(())
    }

    pub async fn unload_model(&self) -> Result<()> {
        let mut loaded = self.loaded_model.write().await;
        *loaded = None;
        Ok(())
    }

    pub async fn get_loaded_model(&self) -> Option<String> {
        self.loaded_model.read().await.clone()
    }

    pub async fn get_model_path(&self, model_id: &str) -> Result<PathBuf> {
        let models = self.list_models().await?;
        models
            .iter()
            .find(|m| m.id == model_id)
            .map(|m| m.path.clone())
            .ok_or_else(|| anyhow!("Model not found: {}", model_id))
    }
}
