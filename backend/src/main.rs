use centralized_brain::{
    brainstorm::{InMemoryBrainstormStore, BrainstormSession},
    config::{Settings, InferenceMode},
    inference::{create_inference_provider, InferenceProvider, LocalGGUFConfig, CloudOpenAIConfig},
    task_queue::{InMemoryTaskStore, Task},
};
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
struct AppState {
    task_store: Arc<InMemoryTaskStore>,
    brainstorm_store: Arc<InMemoryBrainstormStore>,
    inference_provider: Arc<dyn InferenceProvider>,
    settings: Arc<Settings>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let settings = Settings::from_env()?;
    info!("Starting Centralized Brain Backend (Desktop)");
    info!("Inference Mode: {:?}", settings.inference_mode);
    info!("Models Directory: {}", settings.models_dir.display());
    info!("Voice Backend: {:?}", settings.voice_backend);

    // Create inference provider based on config
    let inference_provider = match settings.inference_mode {
        InferenceMode::Local => {
            info!("Using local GGUF inference (llama.cpp)");
            create_inference_provider(
                "local",
                Some(LocalGGUFConfig {
                    models_dir: settings.models_dir.clone(),
                    ctx_size: 4096,
                    threads: None,
                }),
                None,
            )
            .await?
        }
        InferenceMode::Cloud => {
            info!("Using cloud OpenAI-compatible endpoint: {}", settings.openai_endpoint);
            create_inference_provider(
                "cloud",
                None,
                Some(CloudOpenAIConfig {
                    endpoint: settings.openai_endpoint.clone(),
                    api_key: None, // Optional: load from env if needed
                }),
            )
            .await?
        }
    };

    let state = AppState {
        task_store: Arc::new(InMemoryTaskStore::new()),
        brainstorm_store: Arc::new(InMemoryBrainstormStore::new()),
        inference_provider,
        settings: Arc::new(settings.clone()),
    };

    let app = Router::new()
        // Health check
        .route("/health", get(health_check))
        // Task endpoints
        .route("/task", post(create_task).get(list_tasks))
        // Session/Brainstorm endpoints
        .route("/session", post(create_session).get(list_sessions))
        // Chat/Inference endpoint
        .route("/v1/chat/completions", post(chat_completions))
        // Model info endpoint
        .route("/v1/models", get(list_models))
        .with_state(state);

    let addr = format!("{}:{}", settings.server_host, settings.server_port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!("🧠 Centralized Brain listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "version": "0.1.0",
        "type": "centralized-brain-desktop"
    }))
}

/// Create a new task
async fn create_task(
    State(state): State<AppState>,
    Json(req): Json<CreateTaskRequest>,
) -> impl IntoResponse {
    let task = Task::new(req.title, req.success_criteria);
    match state.task_store.create(task).await {
        Ok(task) => (StatusCode::CREATED, Json(task)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// List all tasks
async fn list_tasks(State(state): State<AppState>) -> impl IntoResponse {
    match state.task_store.list().await {
        Ok(tasks) => (StatusCode::OK, Json(tasks)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// Create a new brainstorm session
async fn create_session(
    State(state): State<AppState>,
    Json(req): Json<CreateSessionRequest>,
) -> impl IntoResponse {
    let session = BrainstormSession::new(req.title, req.device_origin);
    match state.brainstorm_store.create_session(session).await {
        Ok(session) => (StatusCode::CREATED, Json(session)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// List all brainstorm sessions
async fn list_sessions(State(state): State<AppState>) -> impl IntoResponse {
    match state.brainstorm_store.list_sessions().await {
        Ok(sessions) => (StatusCode::OK, Json(sessions)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// OpenAI-compatible chat completions endpoint
async fn chat_completions(
    State(state): State<AppState>,
    Json(req): Json<ChatCompletionRequest>,
) -> impl IntoResponse {
    // Extract the user's last message as the prompt
    let prompt = req
        .messages
        .last()
        .and_then(|msg| {
            if msg.role == "user" {
                Some(msg.content.clone())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "Hello".to_string());

    let max_tokens = req.max_tokens.unwrap_or(512);
    let temperature = req.temperature.unwrap_or(0.7);

    match state.inference_provider.infer(&prompt, max_tokens as usize, temperature).await {
        Ok(response) => {
            (StatusCode::OK, Json(json!({
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": response
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": prompt.len() / 4,
                    "completion_tokens": response.len() / 4,
                    "total_tokens": (prompt.len() + response.len()) / 4
                }
            }))).into_response()
        }
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "error": {
                    "message": e.to_string(),
                    "type": "inference_error"
                }
            }))).into_response()
        }
    }
}

/// Get available models info
async fn list_models(State(state): State<AppState>) -> impl IntoResponse {
    Json(json!({
        "object": "list",
        "data": [
            {
                "id": "local-gguf",
                "object": "model",
                "owned_by": "local",
                "inference_mode": format!("{:?}", state.settings.inference_mode)
            }
        ]
    }))
}

// Request types
#[derive(serde::Deserialize)]
struct CreateTaskRequest {
    title: String,
    success_criteria: Vec<String>,
}

#[derive(serde::Deserialize)]
struct CreateSessionRequest {
    title: String,
    device_origin: String,
}

#[derive(serde::Deserialize)]
struct ChatCompletionRequest {
    messages: Vec<ChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}
