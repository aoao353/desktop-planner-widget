//! 应用配置：`AppData` 下的 `config.json`（窗口几何、快捷键、自启、透明度与置顶等）。
//! - **关闭窗口 / 托盘退出** 时更新窗口位置与尺寸，其它设置字段保持不变。
//! - **启动** 时读取并应用窗口、置顶、自启；全局快捷键仅在配置非空时注册（默认不注册）。

use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_autostart::ManagerExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(default = "default_global_shortcut")]
    pub global_shortcut: String,
    #[serde(default)]
    pub autostart: bool,
    #[serde(default = "default_window_opacity")]
    pub window_opacity: f64,
    #[serde(default)]
    pub always_on_top: bool,
    /// 界面基准字号（px），12–18，对应前端根元素 `font-size`
    #[serde(default = "default_font_size_px")]
    pub font_size_px: u32,
}

fn default_global_shortcut() -> String {
    String::new()
}

fn default_window_opacity() -> f64 {
    1.0
}

fn default_font_size_px() -> u32 {
    14
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            x: None,
            y: None,
            width: None,
            height: None,
            global_shortcut: default_global_shortcut(),
            autostart: false,
            window_opacity: default_window_opacity(),
            always_on_top: false,
            font_size_px: default_font_size_px(),
        }
    }
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

/// 确保 `path` 的父目录存在（含多级），避免首次写入时「找不到路径」。
fn ensure_parent_dir(path: &std::path::Path) -> Result<(), String> {
    let Some(parent) = path.parent() else {
        return Ok(());
    };
    if parent.as_os_str().is_empty() {
        return Ok(());
    }
    std::fs::create_dir_all(parent).map_err(|e| e.to_string())
}

fn write_config(app: &AppHandle, cfg: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;
    ensure_parent_dir(&path)?;
    let json = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn save_window_state(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "missing main window".to_string())?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let mut cfg = load_config(app)?;
    cfg.x = Some(pos.x);
    cfg.y = Some(pos.y);
    cfg.width = Some(size.width);
    cfg.height = Some(size.height);
    write_config(app, &cfg)
}

pub fn apply_window_geometry(app: &AppHandle, cfg: &AppConfig) -> Result<(), String> {
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

fn apply_always_on_top(app: &AppHandle, on: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "missing main window".to_string())?;
    window
        .set_always_on_top(on)
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn apply_autostart(app: &AppHandle, enable: bool) -> Result<(), String> {
    let manager = app.autolaunch();
    if enable {
        manager.enable().map_err(|e| e.to_string())?;
    } else {
        // 从未开启过自启时，Windows 上 `disable` 可能报 os error 2（无注册项可删），不应导致设置保存失败。
        if let Err(e) = manager.disable() {
            let s = e.to_string();
            let benign = s.contains("os error 2") || s.contains("找不到指定的文件");
            if !benign {
                return Err(s);
            }
        }
    }
    Ok(())
}

/// 根据配置注册全局快捷键（先清空再注册）；失败仅打印，不返回 Err。
pub fn apply_global_shortcut(app: &AppHandle, cfg: &AppConfig) {
    let Some(gs) = app.try_state::<tauri_plugin_global_shortcut::GlobalShortcut<tauri::Wry>>() else {
        return;
    };
    if let Err(e) = gs.unregister_all() {
        eprintln!("快捷键注册失败: {}", e);
    }
    let shortcut_str = cfg.global_shortcut.trim();
    if shortcut_str.is_empty() {
        return;
    }
    if let Err(e) = gs.on_shortcut(shortcut_str, |app, _shortcut, event| {
        use tauri_plugin_global_shortcut::ShortcutState;
        if event.state == ShortcutState::Pressed {
            crate::toggle_window(app);
        }
    }) {
        eprintln!("快捷键注册失败: {}", e);
    }
}

/// 启动时：几何、置顶、自启、快捷键（透明度由前端根据配置自行应用）。失败只打日志，不向上返回错误。
pub fn apply_config_on_startup(app: &AppHandle) {
    let cfg = match load_config(app) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("配置应用失败: {}", e);
            return;
        }
    };
    if let Err(e) = apply_window_geometry(app, &cfg) {
        eprintln!("窗口位置/尺寸应用失败: {}", e);
    }
    if let Err(e) = apply_always_on_top(app, cfg.always_on_top) {
        eprintln!("置顶应用失败: {}", e);
    }
    if let Err(e) = apply_autostart(app, cfg.autostart) {
        eprintln!("自启应用失败: {}", e);
    }
    apply_global_shortcut(app, &cfg);
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAppSettingsPayload {
    pub global_shortcut: String,
    pub autostart: bool,
    pub window_opacity: f64,
    pub always_on_top: bool,
    pub font_size_px: u32,
}

pub fn save_app_settings_impl(
    app: &AppHandle,
    payload: SaveAppSettingsPayload,
) -> Result<AppConfig, String> {
    let mut cfg = load_config(app)?;
    let s = payload.global_shortcut.trim();
    cfg.global_shortcut = s.to_string();
    cfg.autostart = payload.autostart;
    cfg.window_opacity = payload.window_opacity.clamp(0.35, 1.0);
    cfg.always_on_top = payload.always_on_top;
    cfg.font_size_px = payload.font_size_px.clamp(12, 18);
    write_config(app, &cfg)?;
    apply_always_on_top(app, cfg.always_on_top)?;
    apply_autostart(app, cfg.autostart)?;
    apply_global_shortcut(app, &cfg);
    Ok(cfg)
}

#[tauri::command]
pub fn get_app_config(app: AppHandle) -> Result<AppConfig, String> {
    load_config(&app)
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, payload: SaveAppSettingsPayload) -> Result<AppConfig, String> {
    save_app_settings_impl(&app, payload)
}
