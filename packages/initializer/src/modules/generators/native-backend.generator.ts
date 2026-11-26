import { rustPackageName } from './rust-contracts.generator.js';
import type { Framework } from '../../types/index.js';

export const GO_HEALTH_RESPONSE = `type HealthResponse struct {
\tStatus string \`json:"status"\`
\tService string \`json:"service"\`
\tVersion string \`json:"version"\`
\tTimestamp string \`json:"timestamp"\`
\tUptimeSeconds float64 \`json:"uptimeSeconds"\`
}`;

export function renderGoBackend(
  framework: Framework,
  service: string,
  module: string,
  shared?: { module: string; directory: string },
) {
  const frameworks = {
    chi: {
      module: 'github.com/go-chi/chi/v5',
      version: 'v5.2.1',
      import: 'github.com/go-chi/chi/v5',
      router: 'router := chi.NewRouter()\n\trouter.Get("/health", healthHandler)',
    },
    gin: {
      module: 'github.com/gin-gonic/gin',
      version: 'v1.10.0',
      import: 'github.com/gin-gonic/gin',
      router: 'router := gin.New()\n\trouter.GET("/health", gin.WrapF(healthHandler))',
    },
    echo: {
      module: 'github.com/labstack/echo/v4',
      version: 'v4.13.3',
      import: 'github.com/labstack/echo/v4',
      router:
        'router := echo.New()\n\trouter.GET("/health", echo.WrapHandler(http.HandlerFunc(healthHandler)))',
    },
    fiber: {
      module: 'github.com/gofiber/fiber/v2',
      version: 'v2.52.6',
      import: 'github.com/gofiber/fiber/v2',
      router: '',
    },
  };
  if (!(framework in frameworks)) throw new Error(`Unsupported Go backend: ${framework}`);
  const fw = frameworks[framework as keyof typeof frameworks];
  const fiber = framework === 'fiber';
  const source = `package main

import (
${fiber ? '' : '\t"encoding/json"\n'}\t"log"
${fiber ? '' : '\t"net/http"\n'}\t"os"
\t"time"
\t"${fw.import}"${shared ? `\n\tcontracts "${shared.module}"` : ''}
)

var startedAt = time.Now()

${shared ? 'type HealthResponse = contracts.HealthResponse' : GO_HEALTH_RESPONSE}

func healthPayload() HealthResponse {
\treturn HealthResponse{Status: "ok", Service: "${service}", Version: "0.1.0", Timestamp: time.Now().UTC().Format(time.RFC3339), UptimeSeconds: time.Since(startedAt).Seconds()}
}

${
  fiber
    ? `func newRouter() *fiber.App {
\trouter := fiber.New()
\trouter.Get("/health", func(c *fiber.Ctx) error { return c.JSON(healthPayload()) })
\treturn router
}`
    : `func healthHandler(w http.ResponseWriter, _ *http.Request) {
\tw.Header().Set("Content-Type", "application/json")
\tif err := json.NewEncoder(w).Encode(healthPayload()); err != nil { log.Printf("encode health response: %v", err) }
}

func newRouter() http.Handler {
\t${fw.router}
\treturn router
}`
}

func main() {
\tport := os.Getenv("PORT")
\tif port == "" { port = "4000" }
${fiber ? '\tlog.Fatal(newRouter().Listen(":" + port))' : '\tserver := &http.Server{Addr: ":" + port, Handler: newRouter(), ReadHeaderTimeout: 5 * time.Second}\n\tlog.Fatal(server.ListenAndServe())'}
}
`;
  const test = `package main

import (
\t"encoding/json"
\t"net/http"
\t"net/http/httptest"
\t"testing"
)

func TestHealth(t *testing.T) {
\treq := httptest.NewRequest(http.MethodGet, "/health", nil)
${fiber ? '\tres, err := newRouter().Test(req)\n\tif err != nil { t.Fatal(err) }' : '\trecorder := httptest.NewRecorder()\n\tnewRouter().ServeHTTP(recorder, req)\n\tres := recorder.Result()'}
\tdefer res.Body.Close()
\tif res.StatusCode != http.StatusOK { t.Fatalf("status = %d", res.StatusCode) }
\tvar payload HealthResponse
\tif err := json.NewDecoder(res.Body).Decode(&payload); err != nil { t.Fatal(err) }
\tif payload.Status != "ok" || payload.Service != "${service}" || payload.Timestamp == "" { t.Fatalf("invalid health: %+v", payload) }
}
`;
  return {
    manifest: `module ${module}\n\ngo 1.23.0\n\nrequire ${fw.module} ${fw.version}\n${shared ? `\nrequire ${shared.module} v0.0.0\nreplace ${shared.module} => ../../packages/${shared.directory}\n` : ''}`,
    source,
    test,
  };
}

export function renderRustBackend(
  framework: Framework,
  service: string,
  contracts?: { name: string; directory: string },
) {
  if (framework !== 'axum' && framework !== 'hyper')
    throw new Error(`Unsupported Rust backend: ${framework}`);
  const deps = `tokio = { version = "=1.44.2", features = ["macros", "rt-multi-thread", "net", "signal"] }
serde = { version = "=1.0.219", features = ["derive"] }
serde_json = "=1.0.140"
chrono = { version = "=0.4.40", default-features = false, features = ["clock"] }
`;
  const health = `${contracts ? 'use shared_contracts::HealthResponse;' : 'use serde::Serialize;'}
use std::sync::OnceLock;
use std::time::Instant;

static STARTED: OnceLock<Instant> = OnceLock::new();

${
  contracts
    ? ''
    : `#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
    timestamp: String,
    uptime_seconds: f64,
}`
}

fn health_payload() -> HealthResponse {
    HealthResponse { status: "ok".into(), service: "${service}".into(), version: "0.1.0".into(), timestamp: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true), uptime_seconds: STARTED.get_or_init(Instant::now).elapsed().as_secs_f64() }
}
`;
  const axum = `${health}
use axum::{routing::get, Json, Router};

async fn health() -> Json<HealthResponse> { Json(health_payload()) }

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    STARTED.get_or_init(Instant::now);
    let port = std::env::var("PORT").unwrap_or_else(|_| "4000".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    let app = Router::new().route("/health", get(health));
    axum::serve(listener, app).with_graceful_shutdown(async { let _ = tokio::signal::ctrl_c().await; }).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn health_returns_json() {
        let Json(payload) = health().await;
        assert_eq!(payload.status, "ok");
        assert_eq!(payload.service, "${service}");
        assert!(!payload.timestamp.is_empty());
    }
}
`;
  const hyper = `${health}
use bytes::Bytes;
use http_body_util::Full;
use hyper::{body::Incoming, Method, Request, Response, StatusCode};
use hyper::service::service_fn;
use hyper_util::rt::TokioIo;
use std::convert::Infallible;

async fn route(req: Request<Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    if req.method() == Method::GET && req.uri().path() == "/health" {
        let body = serde_json::to_vec(&health_payload()).expect("health payload is serializable");
        let mut response = Response::new(Full::new(Bytes::from(body)));
        response.headers_mut().insert("content-type", hyper::header::HeaderValue::from_static("application/json"));
        Ok(response)
    } else {
        let mut response = Response::new(Full::new(Bytes::from_static(b"Not found")));
        *response.status_mut() = StatusCode::NOT_FOUND;
        Ok(response)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    STARTED.get_or_init(Instant::now);
    let port = std::env::var("PORT").unwrap_or_else(|_| "4000".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    loop {
        let (stream, _) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(error) = hyper::server::conn::http1::Builder::new().serve_connection(TokioIo::new(stream), service_fn(route)).await { eprintln!("connection error: {error}"); }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn health_is_serializable() {
        let json = serde_json::to_value(health_payload()).unwrap();
        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "${service}");
    }
}
`;
  return {
    manifest: `[package]\nname = "${rustPackageName(service)}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n${deps}${contracts ? `shared_contracts = { package = "${contracts.name}", path = "../../packages/${contracts.directory}" }\n` : ''}${framework === 'axum' ? 'axum = "=0.8.3"\n' : 'hyper = { version = "=1.6.0", features = ["server", "http1"] }\nhyper-util = { version = "=0.1.11", features = ["tokio"] }\nhttp-body-util = "=0.1.3"\nbytes = "=1.10.1"\n'}`,
    source: framework === 'axum' ? axum : hyper,
  };
}
