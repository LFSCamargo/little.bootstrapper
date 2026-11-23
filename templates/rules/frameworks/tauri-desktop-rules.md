# Rule: tauri-desktop-rules

> Tauri v2 (Rust + React) desktop application security & performance rules.

- **Least-privilege capabilities**: Scope Tauri v2 ACLs strictly to required windows, commands, and filesystem paths; never grant wildcard shell/fs scopes.
- **Validate all IPC inputs in Rust**: Treat frontend payloads sent to `#[tauri::command]` as untrusted; validate types, paths, and bounds in Rust.
- **Never block the UI thread**: Run heavy Rust computation or I/O in `async` commands or `tauri::async_runtime::spawn_blocking`.
- **Structured Rust IPC errors**: Return typed serializable `Result<T, AppError>` instead of panicking with `.unwrap()`.
