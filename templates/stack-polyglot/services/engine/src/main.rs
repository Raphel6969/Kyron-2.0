use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    latency_guarantee_ms: u32,
}

async fn healthz() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy",
        service: "rust-solver-engine",
        latency_guarantee_ms: 5,
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/healthz", get(healthz));
    let addr = SocketAddr::from(([0, 0, 0, 0], 8090));
    println!("Rust Engine listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
