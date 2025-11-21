#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Wry};

fn main() {
    tauri::Builder::<Wry>::default()
        .setup(|app| {
            let main_window = app.get_webview_window("main").expect("main window");
            main_window.set_title("StorePulse")?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run StorePulse");
}
