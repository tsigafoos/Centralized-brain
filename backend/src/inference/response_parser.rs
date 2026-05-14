use crate::task_queue::Task;
use anyhow::Result;
use regex::Regex;

pub struct ResponseParser;

impl ResponseParser {
    pub fn parse_tasks(response: &str) -> Result<Vec<Task>> {
        let mut tasks = Vec::new();

        // Pattern 1: Numbered lists "1. Task title"
        let num_pattern = Regex::new(r"^\d+\.\s+(.+?)(?:\n|$)")?;
        for cap in num_pattern.captures_iter(response) {
            if let Some(title) = cap.get(1) {
                let task = Task::new(title.as_str().to_string(), vec![]);
                tasks.push(task);
            }
        }

        // Pattern 2: Bullet points "- Task title" or "* Task title"
        let bullet_pattern = Regex::new(r"^[\-\*]\s+(.+?)(?:\n|$)")?;
        for cap in bullet_pattern.captures_iter(response) {
            if let Some(title) = cap.get(1) {
                let task = Task::new(title.as_str().to_string(), vec![]);
                tasks.push(task);
            }
        }

        // Pattern 3: "TODO: task title"
        let todo_pattern = Regex::new(r"(?i)TODO[:\s]+(.+?)(?:\.|,|$)")?;
        for cap in todo_pattern.captures_iter(response) {
            if let Some(title) = cap.get(1) {
                let task_title = title.as_str().trim().to_string();
                if !task_title.is_empty() && task_title.len() < 200 {
                    let task = Task::new(task_title, vec![]);
                    tasks.push(task);
                }
            }
        }

        // Remove duplicates while preserving order
        let mut seen = std::collections::HashSet::new();
        tasks.retain(|t| seen.insert(t.title.clone()));

        Ok(tasks)
    }

    pub fn extract_success_criteria(response: &str) -> Vec<String> {
        let mut criteria = Vec::new();

        // Look for "success criteria" or "acceptance criteria" sections
        let criteria_pattern = Regex::new(
            r"(?i)(?:success|acceptance)\s+criteria:?\s*\n((?:[\-\*\d]+\s+.+\n?)+)"
        ).unwrap_or_else(|_| Regex::new(r"(?i)criteria:\s*(.+)").unwrap());

        for cap in criteria_pattern.captures_iter(response) {
            if let Some(criteria_text) = cap.get(1) {
                // Split by lines and bullet points
                let lines = criteria_text.as_str();
                let items: Vec<&str> = lines
                    .lines()
                    .filter_map(|line| {
                        let trimmed = line.trim();
                        if trimmed.is_empty() {
                            return None;
                        }
                        // Remove leading bullets/numbers
                        let cleaned = trimmed
                            .trim_start_matches(|c: char| c.is_numeric() || c == '.' || c == '-' || c == '*' || c == ' ')
                            .trim();
                        if !cleaned.is_empty() {
                            Some(cleaned)
                        } else {
                            None
                        }
                    })
                    .collect();
                criteria.extend(items.iter().map(|s| s.to_string()));
            }
        }

        criteria
    }

    pub fn parse_response_with_context(
        user_prompt: &str,
        ai_response: &str,
    ) -> Result<Vec<Task>> {
        // Extract tasks from AI response
        let mut tasks = Self::parse_tasks(ai_response)?;

        // Enhance tasks with success criteria from the original prompt
        let success_criteria = Self::extract_success_criteria(user_prompt);

        // Distribute criteria to tasks
        if !success_criteria.is_empty() && !tasks.is_empty() {
            let criteria_per_task = (success_criteria.len() + tasks.len() - 1) / tasks.len();
            for (i, task) in tasks.iter_mut().enumerate() {
                let start = i * criteria_per_task;
                let end = std::cmp::min(start + criteria_per_task, success_criteria.len());
                task.success_criteria = success_criteria[start..end].to_vec();
            }
        }

        Ok(tasks)
    }
}
