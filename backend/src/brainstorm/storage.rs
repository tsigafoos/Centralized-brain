use crate::brainstorm::{BrainstormSession, SessionContext};
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[async_trait]
pub trait BrainstormStore: Send + Sync {
    async fn create_session(&self, session: BrainstormSession) -> Result<BrainstormSession>;
    async fn get_session(&self, id: &str) -> Result<Option<BrainstormSession>>;
    async fn update_session(&self, session: BrainstormSession) -> Result<BrainstormSession>;
    async fn delete_session(&self, id: &str) -> Result<()>;
    async fn list_sessions(&self) -> Result<Vec<BrainstormSession>>;

    async fn create_context(&self, context: SessionContext) -> Result<SessionContext>;
    async fn get_context(&self, session_id: &str) -> Result<Option<SessionContext>>;
    async fn update_context(&self, context: SessionContext) -> Result<SessionContext>;
}

pub struct InMemoryBrainstormStore {
    sessions: Arc<RwLock<HashMap<String, BrainstormSession>>>,
    contexts: Arc<RwLock<HashMap<String, SessionContext>>>,
}

impl InMemoryBrainstormStore {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            contexts: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl BrainstormStore for InMemoryBrainstormStore {
    async fn create_session(&self, session: BrainstormSession) -> Result<BrainstormSession> {
        let mut sessions = self.sessions.write().await;
        sessions.insert(session.id.clone(), session.clone());
        Ok(session)
    }

    async fn get_session(&self, id: &str) -> Result<Option<BrainstormSession>> {
        let sessions = self.sessions.read().await;
        Ok(sessions.get(id).cloned())
    }

    async fn update_session(&self, session: BrainstormSession) -> Result<BrainstormSession> {
        let mut sessions = self.sessions.write().await;
        sessions.insert(session.id.clone(), session.clone());
        Ok(session)
    }

    async fn delete_session(&self, id: &str) -> Result<()> {
        let mut sessions = self.sessions.write().await;
        sessions.remove(id);
        Ok(())
    }

    async fn list_sessions(&self) -> Result<Vec<BrainstormSession>> {
        let sessions = self.sessions.read().await;
        Ok(sessions.values().cloned().collect())
    }

    async fn create_context(&self, context: SessionContext) -> Result<SessionContext> {
        let mut contexts = self.contexts.write().await;
        contexts.insert(context.session_id.clone(), context.clone());
        Ok(context)
    }

    async fn get_context(&self, session_id: &str) -> Result<Option<SessionContext>> {
        let contexts = self.contexts.read().await;
        Ok(contexts.get(session_id).cloned())
    }

    async fn update_context(&self, context: SessionContext) -> Result<SessionContext> {
        let mut contexts = self.contexts.write().await;
        contexts.insert(context.session_id.clone(), context.clone());
        Ok(context)
    }
}
