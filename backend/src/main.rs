use centralized_brain::{
    api::OpenAIClient,
    brainstorm::{InMemoryBrainstormStore, BrainstormSession},
    config::Settings,
    sync::MockCloudSync,
    task_queue::{InMemoryTaskStore, Task},
    voice::{WhisperProvider, PiperProvider},
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
    openai_client: Arc<OpenAIClient>,
    settings: Arc<Settings>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let settings = Settings::from_env()?;
    info!("Starting Centralized Brain Backend");
    info!("Voice Backend: {:?}", settings.voice_backend);
    info!("OpenAI Endpoint: {}", settings.openai_endpoint);

    let state = AppState {
        task_store: Arc::new(InMemoryTaskStore::new()),
        brainstorm_store: Arc::new(InMemoryBrainstormStore::new()),
        openai_client: Arc::new(OpenAIClient::new(settings.openai_endpoint.clone())),
        settings: Arc::new(settings.clone()),
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/task", post(create_task).get(list_tasks))
        .route("/session", post(create_session).get(list_sessions))
        .with_state(state);

    let addr = format!("{}:{}", settings.server_host, settings.server_port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!("Server listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "version": "0.1.0"
    }))
}

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
