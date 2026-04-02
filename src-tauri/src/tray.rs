#![cfg(not(any(target_os = "android", target_os = "ios")))]

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

use crate::app_config;
use crate::toggle_window;

pub fn create_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let show_hide = MenuItem::with_id(app, "toggle", "显示/隐藏", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &quit])?;

    let icon = app.default_window_icon().expect("default window icon").clone();

    TrayIconBuilder::with_id("main-tray")
        .tooltip("Task Widget")
        .icon(icon)
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "toggle" => {
                toggle_window(app);
            }
            "quit" => {
                let _ = app_config::save_window_state(app);
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
