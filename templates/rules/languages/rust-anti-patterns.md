# Rule: rust-anti-patterns

> Idiomatic Rust safety, async, and performance rules.

- **No `.unwrap()` or `.expect()` in production paths**: Return `Result<T, E>` with typed domain errors (`thiserror`) or contextual app errors (`anyhow`).
- **Borrow before `.clone()`**: Prefer `&str` / `&[T]` / lifetimes over cloning in hot paths.
- **Never block inside async executors**: Offload CPU-heavy or blocking file/sync calls with `tokio::task::spawn_blocking`.
- **Keep `unsafe` minimal & audited**: Every `unsafe` block MUST carry a `// SAFETY:` invariant justification and dedicated unit tests.
- **Make invalid states unrepresentable**: Use newtypes (`UserId(Uuid)`, `Cents(i64)`) and enums rather than primitive obsession.
