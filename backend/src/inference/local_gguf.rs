use crate::inference::provider::{InferenceProvider, LocalGGUFConfig};
use anyhow::Result;
use async_trait::async_trait;
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, AddBos, LlamaModel},
    sampling::LlamaSampler,
    token::LlamaToken,
};
use std::{num::NonZeroU32, path::Path, sync::Arc};
use tokio::sync::mpsc;

/// Local GGUF model inference engine
pub struct LocalGGUFInference {
    backend: Arc<LlamaBackend>,
    model: Arc<Option<LlamaModel>>,
    config: LocalGGUFConfig,
}

impl LocalGGUFInference {
    /// Create new local GGUF inference provider
    pub fn new(config: LocalGGUFConfig) -> Result<Self> {
        let backend = LlamaBackend::init()?;
        Ok(Self {
            backend: Arc::new(backend),
            model: Arc::new(None),
            config,
        })
    }

    /// Load a GGUF model from disk
    pub fn load<P: AsRef<Path>>(&mut self, model_path: P) -> Result<()> {
        let model = LlamaModel::load_from_file(
            &self.backend,
            model_path.as_ref(),
            &LlamaModelParams::default(),
        )?;
        self.model = Arc::new(Some(model));
        Ok(())
    }

    /// Check if a model is loaded
    pub fn is_loaded(&self) -> bool {
        self.model.is_some()
    }
}

#[async_trait]
impl InferenceProvider for LocalGGUFInference {
    async fn infer(&self, prompt: &str, max_tokens: usize, temperature: f32) -> Result<String> {
        let model = self.model.clone();
        let backend = self.backend.clone();
        let prompt = prompt.to_string();
        let ctx_size = self.config.ctx_size;

        tokio::task::spawn_blocking(move || {
            if let Some(ref m) = *model {
                generate(m, &backend, &prompt, max_tokens, temperature, ctx_size)
            } else {
                Err(anyhow::anyhow!("No model loaded"))
            }
        })
        .await?
    }

    async fn infer_stream(
        &self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
    ) -> Result<mpsc::Receiver<Result<String>>> {
        let (tx, rx) = mpsc::channel(64);
        let model = self.model.clone();
        let backend = self.backend.clone();
        let prompt = prompt.to_string();
        let ctx_size = self.config.ctx_size;

        if model.is_none() {
            return Err(anyhow::anyhow!("No model loaded"));
        }

        tokio::task::spawn_blocking(move || {
            if let Some(ref m) = *model {
                generate_streaming(m, &backend, &prompt, max_tokens, temperature, ctx_size, tx);
            }
        });

        Ok(rx)
    }

    fn name(&self) -> &'static str {
        "LocalGGUF"
    }
}

fn generate(
    model: &LlamaModel,
    backend: &LlamaBackend,
    prompt: &str,
    max_tokens: usize,
    temperature: f32,
    ctx_size: u32,
) -> Result<String> {
    let ctx_params = LlamaContextParams::default().with_n_ctx(NonZeroU32::new(ctx_size));
    let mut ctx = model.new_context(backend, ctx_params)?;

    let tokens = model.str_to_token(prompt, AddBos::Always)?;
    if tokens.is_empty() {
        return Ok(String::new());
    }

    let n_ctx = ctx.n_ctx() as usize;
    if tokens.len() + max_tokens > n_ctx {
        anyhow::bail!(
            "Prompt ({} tokens) + max_tokens ({}) exceeds context size ({})",
            tokens.len(),
            max_tokens,
            n_ctx
        );
    }

    let mut batch = LlamaBatch::new(ctx_size as usize, 1);
    for (i, token) in tokens.iter().enumerate() {
        batch.add(*token, i as i32, &[0], false)?;
    }

    ctx.decode(&mut batch)?;

    let mut sampler = build_sampler(temperature);
    let mut decoder = encoding_rs::UTF_8.new_decoder();
    let mut response = String::new();
    let mut n_cur = batch.n_tokens();

    for _ in 0..max_tokens {
        let token = sampler.sample(&ctx, batch.n_tokens() - 1);
        sampler.accept(token);

        if model.is_eog_token(token) {
            break;
        }

        if let Some(piece) = token_to_string(model, &mut decoder, token) {
            response.push_str(&piece);
        }

        batch.clear();
        batch.add(token, n_cur, &[0], true)?;
        ctx.decode(&mut batch)?;
        n_cur += 1;
    }

    Ok(response)
}

fn generate_streaming(
    model: &LlamaModel,
    backend: &LlamaBackend,
    prompt: &str,
    max_tokens: usize,
    temperature: f32,
    ctx_size: u32,
    tx: mpsc::Sender<Result<String>>,
) {
    let ctx_params = match LlamaContextParams::default().with_n_ctx(NonZeroU32::new(ctx_size)) {
        cp => cp,
    };

    let mut ctx = match model.new_context(backend, ctx_params) {
        Ok(c) => c,
        Err(e) => {
            let _ = tx.blocking_send(Err(e.into()));
            return;
        }
    };

    let tokens = match model.str_to_token(prompt, AddBos::Always) {
        Ok(t) => t,
        Err(e) => {
            let _ = tx.blocking_send(Err(e.into()));
            return;
        }
    };

    if tokens.is_empty() {
        return;
    }

    let mut batch = match LlamaBatch::new(ctx_size as usize, 1) {
        b => b,
    };

    for (i, token) in tokens.iter().enumerate() {
        if let Err(e) = batch.add(*token, i as i32, &[0], false) {
            let _ = tx.blocking_send(Err(e.into()));
            return;
        }
    }

    if let Err(e) = ctx.decode(&mut batch) {
        let _ = tx.blocking_send(Err(e.into()));
        return;
    }

    let mut sampler = build_sampler(temperature);
    let mut decoder = encoding_rs::UTF_8.new_decoder();
    let mut n_cur = batch.n_tokens();

    for _ in 0..max_tokens {
        let token = sampler.sample(&ctx, batch.n_tokens() - 1);
        sampler.accept(token);

        if model.is_eog_token(token) {
            break;
        }

        if let Some(piece) = token_to_string(model, &mut decoder, token) {
            if tx.blocking_send(Ok(piece)).is_err() {
                break;
            }
        }

        batch.clear();
        if let Err(e) = batch.add(token, n_cur, &[0], true) {
            let _ = tx.blocking_send(Err(e.into()));
            break;
        }
        if let Err(e) = ctx.decode(&mut batch) {
            let _ = tx.blocking_send(Err(e.into()));
            break;
        }
        n_cur += 1;
    }
}

fn token_to_string(
    model: &LlamaModel,
    decoder: &mut encoding_rs::Decoder,
    token: LlamaToken,
) -> Option<String> {
    model.token_to_piece(token, decoder, true, None).ok()
}

fn build_sampler(temperature: f32) -> LlamaSampler {
    if temperature <= 0.0 {
        LlamaSampler::greedy()
    } else {
        LlamaSampler::chain_simple([
            LlamaSampler::temp(temperature),
            LlamaSampler::top_p(0.9, 1),
            LlamaSampler::dist(42),
        ])
    }
}
