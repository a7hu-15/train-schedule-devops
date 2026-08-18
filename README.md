# RailPulse Cloud

RailPulse Cloud is a modern, event-driven Platform Engineering project that simulates the backend operations of a high-throughput railway network. It demonstrates how to handle asynchronous data streams, manage caching failures, and build a resilient software architecture.

## Overview

Unlike a standard CRUD application, RailPulse acts as an operational nervous system:
- **Event Chaining:** It ingests real-time events (like `TrainDelayed`) and automatically calculates secondary events (like `PlatformConflict`).
- **Resilience:** If the primary Redis cache fails, the API gracefully falls back to an in-memory cache without dropping events or crashing.
- **Traceability:** Every event is assigned a unique `correlation_id`, allowing engineers to trace the entire pipeline chain.

## Tech Stack

- **Backend:** FastAPI (Python 3.11)
- **Primary Database (Event Store):** PostgreSQL
- **Live State Cache:** Redis
- **Frontend Console:** React 18, TypeScript, Vite, Tailwind CSS
- **Observability:** Prometheus, Grafana
- **Infrastructure:** Docker & Kubernetes (Manifests included)

## Architecture

1. **Ingestion API:** Receives raw operational events and offloads them to a background dispatcher.
2. **Processing Engine:** Specialized processors (DelayProcessor, ConflictProcessor) consume events and generate new operational intelligence.
3. **State Projection:** The current state (e.g., Platform Occupancy) is persisted to Redis for fast reads.
4. **Event Store:** The historical record of all events is saved to PostgreSQL for audit and recovery.
5. **Operations Console:** A minimalist React frontend that visualizes the pipeline metrics, live events, and trace logs.

## Running Locally

You can launch the entire stack (API, Frontend, Database, Cache, and Metrics) using Docker Compose:

```bash
docker compose up -d --build
```

**Services Available:**
- **Operations Console:** `http://localhost:80`
- **Prometheus Metrics:** `http://localhost:9090`
- **Grafana Dashboards:** `http://localhost:3001` (login: admin/admin)
- **API Swagger Docs:** `http://localhost:8000/docs`
