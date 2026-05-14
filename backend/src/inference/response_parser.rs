use crate::task_queue::Task;
use anyhow::Result;

pub struct ResponseParser;

impl ResponseParser {
    pub fn parse_tasks(response: &str) -> Result<Vec<Task>> {
        // TODO: Parse model response and extract tasks with success criteria
        Ok(vec![])
    }

    pub fn extract_success_criteria(prompt: &str) -> Vec<String> {
        // TODO: Extract success criteria from original prompt
        vec![]
    }
}
