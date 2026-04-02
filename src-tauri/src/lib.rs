mod task;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod app_config;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod tray;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tauri::Manager;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub(crate) fn toggle_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        match w.is_visible() {
            Ok(true) => {
                let _ = w.hide();
            }
            Ok(false) => {
                let _ = w.show();
                let _ = w.set_focus();
            }
            Err(_) => {}
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(task::TaskMutex::default());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // 不在此预注册任何快捷键；仅当用户在设置中填写并保存后才注册。
        builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());
        builder = builder.plugin(tauri_plugin_autostart::Builder::new().build());

        builder = builder.on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = app_config::save_window_state(window.app_handle());
                let _ = window.hide();
            }
        });
    }

    let app = match builder
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_decorations(false);
                }
                if let Err(e) = tray::create_tray(app.handle()) {
                    eprintln!("托盘创建失败: {}", e);
                }
                app_config::apply_config_on_startup(app.handle());
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            task::get_tasks,
            task::add_task,
            task::update_task,
            task::delete_task,
            task::toggle_task,
            task::reorder_tasks_in_priority,
            task::move_task_between_priorities,
            app_config::get_app_config,
            app_config::save_app_settings,
        ])
        .build(tauri::generate_context!())
    {
        Ok(app) => app,
        Err(e) => {
            eprintln!("应用构建失败: {}", e);
            return;
        }
    };

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        use tauri::RunEvent;
        app.run(|_app_handle, event| match event {
            RunEvent::ExitRequested { api, code, .. } => {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
            _ => {}
        });
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    app.run(|_, _| {});
}
