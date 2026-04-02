mod task;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod app_config;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod tray;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tauri::Manager;

#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn toggle_window(app: &tauri::AppHandle) {
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
        let shortcut = if cfg!(target_os = "macos") {
            "cmd+shift+t"
        } else {
            "ctrl+shift+t"
        };
        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts([shortcut])
                .expect("register global shortcut ctrl/cmd+shift+t")
                .with_handler(|app, _shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        );
        builder = builder.plugin(tauri_plugin_autostart::Builder::new().build());
    }

    let app = builder
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_decorations(false);
                }
                tray::create_tray(app.handle())?;
                app_config::apply_window_config(app.handle())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            task::get_tasks,
            task::add_task,
            task::update_task,
            task::delete_task,
            task::toggle_task,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        use tauri::RunEvent;
        app.run(|app_handle, event| match event {
            RunEvent::ExitRequested { api, code, .. } => {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
            RunEvent::WindowEvent {
                label,
                event: tauri::WindowEvent::CloseRequested { api, .. },
                ..
            } => {
                if label == "main" {
                    api.prevent_close();
                    let _ = app_config::save_window_state(app_handle);
                    if let Some(w) = app_handle.get_webview_window("main") {
                        let _ = w.hide();
                    }
                }
            }
            _ => {}
        });
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    app.run(|_, _| {});
}
