use std::fs;
use std::path::Path;

/// Read a UTF-8 text file from any absolute path the user picked via a dialog.
/// We use a plain command (instead of the fs plugin) so we don't have to fight
/// scope rules for arbitrary user-chosen locations.
#[tauri::command]
fn read_text(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {path}: {e}"))
}

/// Write a UTF-8 text file, creating parent directories if needed.
#[tauri::command]
fn write_text(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {e}"))?;
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write {path}: {e}"))
}

/// Write raw bytes (used for pasted / dropped images).
#[tauri::command]
fn write_binary(path: String, data: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {e}"))?;
    }
    fs::write(&path, data).map_err(|e| format!("Failed to write {path}: {e}"))
}

/// True if a path exists (used to resolve name collisions for saved images).
#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Ensure a directory exists.
#[tauri::command]
fn ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create dir {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            read_text,
            write_text,
            write_binary,
            path_exists,
            ensure_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
