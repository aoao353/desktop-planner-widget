use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Priority {
    Urgent,
    High,
    Normal,
    Low,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Tag {
    Work,
    Design,
    Personal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Task {
    pub id: u32,
    pub name: String,
    pub priority: Priority,
    pub tag: Tag,
    pub due: Option<String>,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTask {
    pub name: String,
    pub priority: Priority,
    pub tag: Tag,
    pub due: Option<String>,
}

pub struct TaskMutex(pub Mutex<()>);

impl Default for TaskMutex {
    fn default() -> Self {
        Self(Mutex::new(()))
    }
}

fn tasks_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .resolve("tasks.json", BaseDirectory::AppData)
        .map_err(|e| e.to_string())
}

fn read_tasks(path: &Path) -> Result<Vec<Task>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    if data.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn write_tasks(path: &Path, tasks: &[Task]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(tasks).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_tasks(app: AppHandle, state: State<TaskMutex>) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    read_tasks(&path)
}

#[tauri::command]
pub fn add_task(app: AppHandle, state: State<TaskMutex>, task: NewTask) -> Result<Task, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let id = tasks.iter().map(|t| t.id).max().unwrap_or(0).saturating_add(1);
    let new_task = Task {
        id,
        name: task.name,
        priority: task.priority,
        tag: task.tag,
        due: task.due,
        done: false,
    };
    tasks.push(new_task.clone());
    write_tasks(&path, &tasks)?;
    Ok(new_task)
}

#[tauri::command]
pub fn update_task(app: AppHandle, state: State<TaskMutex>, task: Task) -> Result<Task, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let pos = tasks
        .iter()
        .position(|t| t.id == task.id)
        .ok_or_else(|| "task not found".to_string())?;
    tasks[pos] = task.clone();
    write_tasks(&path, &tasks)?;
    Ok(task)
}

#[tauri::command]
pub fn delete_task(app: AppHandle, state: State<TaskMutex>, id: u32) -> Result<bool, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let before = tasks.len();
    tasks.retain(|t| t.id != id);
    let removed = tasks.len() < before;
    if removed {
        write_tasks(&path, &tasks)?;
    }
    Ok(removed)
}

#[tauri::command]
pub fn toggle_task(app: AppHandle, state: State<TaskMutex>, id: u32) -> Result<Task, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let task = tasks
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| "task not found".to_string())?;
    task.done = !task.done;
    let updated = task.clone();
    write_tasks(&path, &tasks)?;
    Ok(updated)
}
