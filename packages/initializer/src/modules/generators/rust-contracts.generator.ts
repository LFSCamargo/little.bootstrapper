import fs from 'node:fs/promises';
import path from 'node:path';

/** Cargo names cannot contain the dots allowed in repository names. */
export function rustPackageName(project: string, workspace = ''): string {
  const name = `${project}${workspace ? `-${workspace}` : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  return /^[a-z]/.test(name) ? name : `app-${name}`;
}

export async function scaffoldRustContracts(dir: string, name: string): Promise<void> {
  await fs.mkdir(path.join(dir, 'src'), { recursive: true });
  await fs.writeFile(
    path.join(dir, 'Cargo.toml'),
    `[package]
name = "${name}"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "=1.0.219", features = ["derive"] }
chrono = { version = "=0.4.40", default-features = false, features = ["std"] }

[dev-dependencies]
serde_json = "=1.0.140"
`,
  );
  await fs.writeFile(
    path.join(dir, 'src/lib.rs'),
    `use serde::{Deserialize, Serialize};

pub const HEALTH_ENDPOINT_PATH: &str = "/health";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HealthResponse {
    #[serde(deserialize_with = "status")]
    pub status: String,
    #[serde(deserialize_with = "nonempty")]
    pub service: String,
    #[serde(deserialize_with = "nonempty")]
    pub version: String,
    #[serde(deserialize_with = "timestamp")]
    pub timestamp: String,
    #[serde(deserialize_with = "uptime")]
    pub uptime_seconds: f64,
}

fn nonempty<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    let value = String::deserialize(deserializer)?;
    if value.is_empty() { Err(serde::de::Error::custom("must not be empty")) } else { Ok(value) }
}
fn status<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    let value = String::deserialize(deserializer)?;
    if value == "ok" || value == "degraded" { Ok(value) } else { Err(serde::de::Error::custom("invalid health status")) }
}
fn timestamp<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<String, D::Error> {
    let value = String::deserialize(deserializer)?;
    if value.ends_with('Z') && chrono::DateTime::parse_from_rfc3339(&value).is_ok() { Ok(value) } else { Err(serde::de::Error::custom("expected UTC RFC3339 timestamp")) }
}
fn uptime<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<f64, D::Error> {
    let value = f64::deserialize(deserializer)?;
    if value.is_finite() && value >= 0.0 { Ok(value) } else { Err(serde::de::Error::custom("expected nonnegative uptime")) }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn health_contract_roundtrips_with_frontend_field_names() {
        let json = r#"{"status":"ok","service":"api","version":"0.1.0","timestamp":"2026-01-01T00:00:00Z","uptimeSeconds":1.0}"#;
        let payload: HealthResponse = serde_json::from_str(json).unwrap();
        assert_eq!(payload.uptime_seconds, 1.0);
        assert_eq!(serde_json::to_value(payload).unwrap()["uptimeSeconds"], 1.0);
        assert!(serde_json::from_str::<HealthResponse>(r#"{"status":"ok"}"#).is_err());
        assert_eq!(HEALTH_ENDPOINT_PATH, "/health");
        for (field, invalid) in [("status", serde_json::json!("garbage")), ("service", serde_json::json!("")), ("version", serde_json::json!("")), ("timestamp", serde_json::json!("invalid")), ("uptimeSeconds", serde_json::json!(-1))] {
            let mut data: serde_json::Value = serde_json::from_str(json).unwrap();
            data[field] = invalid;
            assert!(serde_json::from_value::<HealthResponse>(data).is_err(), "accepted invalid {field}");
        }
    }
}
`,
  );
}
