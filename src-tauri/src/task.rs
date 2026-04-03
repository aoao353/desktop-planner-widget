use chrono::Local;
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

fn priority_rank(p: Priority) -> i32 {
    match p {
        Priority::Urgent => 0,
        Priority::High => 1,
        Priority::Normal => 2,
        Priority::Low => 3,
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Tag {
    Work,
    Design,
    Personal,
}

fn default_task_order() -> i32 {
    0
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: u32,
    pub name: String,
    pub priority: Priority,
    pub tag: Tag,
    pub due: Option<String>,
    pub done: bool,
    /// 同一 `priority` 内的排序，越小越靠前；写入 `tasks.json` 前会按优先级再按 order 排序。
    #[serde(default = "default_task_order")]
    pub order: i32,
    /// 创建日 YYYY-MM-DD（本地）
    #[serde(default)]
    pub created_date: Option<String>,
    /// 完成日 YYYY-MM-DD（本地），未完成则为 None
    #[serde(default)]
    pub completed_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

fn local_ymd() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

fn due_first_ymd(due: &Option<String>) -> Option<String> {
    due.as_ref().and_then(|s| {
        let s = s.trim();
        if s.len() >= 10 {
            let ymd = &s[..10];
            if ymd.chars().filter(|c| *c == '-').count() == 2 {
                return Some(ymd.to_string());
            }
        }
        None
    })
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

fn sort_tasks_for_storage(tasks: &mut [Task]) {
    tasks.sort_by(|a, b| {
        priority_rank(a.priority)
            .cmp(&priority_rank(b.priority))
            .then_with(|| a.order.cmp(&b.order))
            .then_with(|| a.id.cmp(&b.id))
    });
}

/// 同一优先级内：未完成任务在上，已完成在下；各段内按原 `order`、`id` 稳定排序。
fn reorder_priority_done_at_bottom(tasks: &mut Vec<Task>, priority: Priority) {
    let mut entries: Vec<(u32, bool, i32)> = tasks
        .iter()
        .filter(|t| t.priority == priority)
        .map(|t| (t.id, t.done, t.order))
        .collect();
    entries.sort_by(|a, b| {
        a.1.cmp(&b.1) // false(未完成) < true(已完成)
            .then_with(|| a.2.cmp(&b.2))
            .then_with(|| a.0.cmp(&b.0))
    });
    for (i, (id, _, _)) in entries.iter().enumerate() {
        if let Some(t) = tasks.iter_mut().find(|t| t.id == *id) {
            t.order = i as i32;
        }
    }
}

fn write_tasks(path: &Path, tasks: &mut [Task]) -> Result<(), String> {
    sort_tasks_for_storage(tasks);
    let json = serde_json::to_string_pretty(tasks).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    // Windows 上 `rename(tmp → 已存在的 tasks.json)` 会失败；直接覆盖写入。
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

/// 补全 `created_date`；未完成且已有过期 `due` 时滚到今日，并写回磁盘（若有变更）。
fn apply_startup_task_fixes(tasks: &mut Vec<Task>, path: &Path) -> Result<(), String> {
    let today = local_ymd();
    let mut changed = false;
    for t in tasks.iter_mut() {
        if t.created_date.as_ref().map_or(true, |s| s.is_empty()) {
            t.created_date = Some(due_first_ymd(&t.due).unwrap_or_else(|| today.clone()));
            changed = true;
        }
        // 仅当明确设置了截止日期且已过期时，将未完成任务的 due 滚到今日（不将「无截止日」改为今日）
        if !t.done {
            if let Some(due_ymd) = due_first_ymd(&t.due) {
                if due_ymd < today {
                    t.due = Some(today.clone());
                    changed = true;
                }
            }
        }
    }
    if changed {
        write_tasks(path, tasks)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_tasks(app: AppHandle, state: State<TaskMutex>) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    apply_startup_task_fixes(&mut tasks, &path)?;
    sort_tasks_for_storage(&mut tasks);
    Ok(tasks)
}

#[tauri::command]
pub fn add_task(app: AppHandle, state: State<TaskMutex>, task: NewTask) -> Result<Task, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let id = tasks.iter().map(|t| t.id).max().unwrap_or(0).saturating_add(1);
    let order = tasks
        .iter()
        .filter(|t| t.priority == task.priority)
        .map(|t| t.order)
        .max()
        .unwrap_or(-1)
        + 1;
    let today = local_ymd();
    let new_task = Task {
        id,
        name: task.name,
        priority: task.priority,
        tag: task.tag,
        due: task.due,
        done: false,
        order,
        created_date: Some(today),
        completed_date: None,
    };
    tasks.push(new_task.clone());
    write_tasks(&path, &mut tasks)?;
    Ok(new_task)
}

#[tauri::command]
pub fn update_task(app: AppHandle, state: State<TaskMutex>, task: Task) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let pos = tasks
        .iter()
        .position(|t| t.id == task.id)
        .ok_or_else(|| "task not found".to_string())?;
    let old = tasks[pos].clone();
    let mut task = task;
    if task.created_date.as_ref().map_or(true, |s| s.is_empty()) {
        task.created_date = old.created_date.clone();
    }
    if !task.done {
        task.completed_date = None;
    } else if task.completed_date.is_none() {
        task.completed_date = Some(local_ymd());
    }
    let old_priority = old.priority;
    let new_priority = task.priority;
    tasks[pos] = task.clone();
    reorder_priority_done_at_bottom(&mut tasks, new_priority);
    if old_priority != new_priority {
        reorder_priority_done_at_bottom(&mut tasks, old_priority);
    }
    write_tasks(&path, &mut tasks)?;
    Ok(tasks)
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
        write_tasks(&path, &mut tasks)?;
    }
    Ok(removed)
}

#[tauri::command]
pub fn toggle_task(app: AppHandle, state: State<TaskMutex>, id: u32) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    let priority = {
        let task = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| "task not found".to_string())?;
        task.done = !task.done;
        if task.done {
            task.completed_date = Some(local_ymd());
        } else {
            task.completed_date = None;
        }
        task.priority
    };
    reorder_priority_done_at_bottom(&mut tasks, priority);
    write_tasks(&path, &mut tasks)?;
    Ok(tasks)
}

fn reorder_in_priority_impl(
    tasks: &mut Vec<Task>,
    priority: Priority,
    ordered_ids: &[u32],
) -> Result<(), String> {
    let mut ids_in_priority: Vec<u32> = tasks
        .iter()
        .filter(|t| t.priority == priority)
        .map(|t| t.id)
        .collect();
    ids_in_priority.sort_unstable();

    let mut ordered_sorted = ordered_ids.to_vec();
    ordered_sorted.sort_unstable();

    if ids_in_priority != ordered_sorted {
        return Err("reorder: ids must exactly match tasks in this priority".to_string());
    }

    for (i, &id) in ordered_ids.iter().enumerate() {
        let t = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| "task not found".to_string())?;
        t.order = i as i32;
    }
    Ok(())
}

/// 同一优先级内按 id 顺序重排 `order` 字段（0..n-1），并排序写入 `tasks.json`。
/// 前端 `invoke` 须使用 **camelCase** 键名，与本参数对应：`ordered_ids` → `orderedIds`（Tauri 默认）。
#[tauri::command]
pub fn reorder_tasks_in_priority(
    app: AppHandle,
    state: State<TaskMutex>,
    priority: Priority,
    ordered_ids: Vec<u32>,
) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;
    reorder_in_priority_impl(&mut tasks, priority, &ordered_ids)?;
    write_tasks(&path, &mut tasks)?;
    Ok(tasks)
}

/// 将任务移到目标优先级并按 `ordered_ids_in_target` 重排该优先级内顺序（须包含移动后的全部 id）。
#[tauri::command]
pub fn move_task_between_priorities(
    app: AppHandle,
    state: State<TaskMutex>,
    task_id: u32,
    target_priority: Priority,
    ordered_ids_in_target: Vec<u32>,
) -> Result<Vec<Task>, String> {
    let _guard = state.0.lock().map_err(|e| e.to_string())?;
    let path = tasks_path(&app)?;
    let mut tasks = read_tasks(&path)?;

    let from_priority = tasks
        .iter()
        .find(|t| t.id == task_id)
        .map(|t| t.priority)
        .ok_or_else(|| "task not found".to_string())?;

    if from_priority == target_priority {
        reorder_in_priority_impl(&mut tasks, target_priority, &ordered_ids_in_target)?;
        write_tasks(&path, &mut tasks)?;
        return Ok(tasks);
    }

    {
        let t = tasks
            .iter_mut()
            .find(|t| t.id == task_id)
            .ok_or_else(|| "task not found".to_string())?;
        t.priority = target_priority;
    }

    // 源优先级重新编号 order
    let mut source_ids: Vec<u32> = tasks
        .iter()
        .filter(|t| t.priority == from_priority)
        .map(|t| t.id)
        .collect();
    source_ids.sort_by_key(|&id| {
        tasks
            .iter()
            .find(|t| t.id == id)
            .map(|t| (t.order, t.id))
            .unwrap()
    });
    for (i, &sid) in source_ids.iter().enumerate() {
        let t = tasks.iter_mut().find(|t| t.id == sid).unwrap();
        t.order = i as i32;
    }

    // 目标优先级顺序
    let mut target_set: Vec<u32> = tasks
        .iter()
        .filter(|t| t.priority == target_priority)
        .map(|t| t.id)
        .collect();
    target_set.sort_unstable();
    let mut ordered_sorted = ordered_ids_in_target.clone();
    ordered_sorted.sort_unstable();
    if target_set != ordered_sorted {
        return Err("move_task: orderedIds must match all tasks in target priority".to_string());
    }

    for (i, &id) in ordered_ids_in_target.iter().enumerate() {
        let t = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| "task not found".to_string())?;
        t.order = i as i32;
    }

    write_tasks(&path, &mut tasks)?;
    Ok(tasks)
}
