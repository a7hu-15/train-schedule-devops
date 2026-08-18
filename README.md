# RailPulse Cloud

RailPulse Cloud is a modern, event-driven Platform Engineering project that simulates the backend operations of a high-throughput railway network. It demonstrates how to handle asynchronous data streams, manage caching failures, and build a resilient software architecture.

## Overview

Unlike a standard CRUD application, RailPulse acts as an operational nervous system:
- **Event Chaining:** It ingests real-time events (like `TrainDelayed`) and automatically calculates secondary events (like `PlatformConflict`).
- **Resilience:** If the primary data store is unavailable, the API gracefully handles the failure without dropping events or crashing.
- **Traceability:** Every event is assigned a unique `correlation_id`, allowing engineers to trace the entire pipeline chain.

## Tech Stack

- **Backend:** FastAPI (Python 3.11)
- **Database:** PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Monitoring:** Prometheus, Grafana 
- **Containerization:** Docker
- **Orchestration:** Kubernetes *(Local manifests included)*

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
