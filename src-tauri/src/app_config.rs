use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

fn config_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .resolve("config.json", BaseDirectory::AppData)
        .map_err(|e| e.to_string())
}

pub fn load_config(app: &AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if data.trim().is_empty() {
        return Ok(AppConfig::default());
    }
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

pub fn save_window_state(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "missing main window".to_string())?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let cfg = AppConfig {
        x: Some(pos.x),
        y: Some(pos.y),
        width: Some(size.width),
        height: Some(size.height),
    };
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("tmp");
    let json = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn apply_window_config(app: &AppHandle) -> Result<(), String> {
    let cfg = load_config(app)?;
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "missing main window".to_string())?;
    if let (Some(x), Some(y)) = (cfg.x, cfg.y) {
        let _ = window.set_position(tauri::Position::Physical(PhysicalPosition { x, y }));
    }
    if let (Some(w), Some(h)) = (cfg.width, cfg.height) {
        let _ = window.set_size(tauri::Size::Physical(PhysicalSize { width: w, height: h }));
    }
    Ok(())
}
