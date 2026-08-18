# 🚆 RailPulse Cloud — The Open-Source Railway SRE Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_App-railpulse--6f8.pages.dev-00C7B7?style=for-the-badge&logo=cloudflare&logoColor=white)](https://railpulse-6f8.pages.dev)
[![API Health](https://img.shields.io/badge/⚡_API_Status-Live_UP-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://train-schedule-devops.onrender.com/health/live)
[![Pytest](https://img.shields.io/badge/🧪_Tests-20%2F20_Passed-brightgreen?style=for-the-badge)](backend/tests/)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15-3ECF8E.svg)](https://supabase.com/)
[![Upstash](https://img.shields.io/badge/Upstash-Redis_7-00E599.svg)](https://upstash.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-HPA-326CE5.svg)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS_IaC-7B42BC.svg)](https://www.terraform.io/)

> **RailPulse Cloud is an open-source cloud-native Railway Operations Platform that demonstrates how operational events, processing pipelines, observability, resilience, and modern DevOps practices work together to operate reliable railway software systems.**

---

## 🎯 The Platform Engineering Challenge

Railway software systems process millions of operational events—train delays, platform assignments, and departures. When an upstream API goes down, the cache evicts data too quickly, or an event queue backs up, downstream operational dashboards fail. 

For **Platform Engineers, DevOps Teams, and Site Reliability Engineers (SREs)**, the challenge is not just keeping servers running. The challenge is ensuring the *business logic* remains highly available.

RailPulse Cloud solves this by demonstrating **Business Observability**—building a pipeline where infrastructure directly supports and measures the business domain.

---

## 💡 The Event Processing Pipeline

RailPulse Cloud is built around an enterprise-grade Event Chaining Pipeline. Instead of monolithic logic, small, isolated Processors listen for specific events and emit new ones, simulating a robust event bus in-memory:

`Event Sources` → `Ingestion API` → `Processing Engine` → `Persistence` → `Observability` → `Operations Console`

### 🎛️ Core Modules
#### 1. The Chaos Engine (Simulator)
Generates high-throughput deterministic operational events (`TrainDelayed`, `TrainArrived`) to test the pipeline, inject failures (Redis timeouts), and observe recovery.
#### 2. The Operational Processing Engine
The heart of the platform. An in-memory event dispatcher routes events through specialized processors (e.g., `DelayProcessor` emits a `PlatformConflict` event, which triggers the `ConflictProcessor`).
#### 3. Deep Observability (Prometheus / Grafana)
Metrics that tell an operational story across three dashboards:
- **Pipeline Health**: `events_processed_total`, `processing_latency_seconds`
- **Business Health**: `TrainDelayed`, `PlatformConflict`, `RecommendationGenerated`
- **Infrastructure Health**: CPU, Memory, Redis, Database
#### 4. The Operations Console
A React UI designed like a Mission Control center (Overview, Live Events, Pipeline, Metrics) to observe the state of the processing platform.

---

## 📘 Architecture Decision Records (ADRs)

RailPulse Cloud is a learning reference. We document *why* we chose our stack:

* [**ADR-001: Why FastAPI?**](docs/ADR/ADR-001-Why-FastAPI.md) - Handling high-volume asynchronous I/O event ingestion.
* [**ADR-002: Why Redis?**](docs/ADR/ADR-002-Why-Redis.md) - Protecting fragile providers with a Cache-Aside pattern.
* [**ADR-003: Why Kubernetes?**](docs/ADR/ADR-003-Why-Kubernetes.md) - Ensuring mission-critical high availability and zero-downtime deployments.

---

## 🔗 Live Production Endpoints

| Resource | Environment | Live URL | Status |
|---|---|---|---|
| **🌐 SRE Platform Dashboard** | Cloudflare Pages | **[https://railpulse-6f8.pages.dev](https://railpulse-6f8.pages.dev)** | 🟢 `ACTIVE` |
| **⚡ Backend Processing API** | Render | **[https://train-schedule-devops.onrender.com](https://train-schedule-devops.onrender.com)** | 🟢 `ACTIVE` |
| **🩺 Liveness Probe** | Render SRE Probe | **[https://train-schedule-devops.onrender.com/health/live](https://train-schedule-devops.onrender.com/health/live)** | 🟢 `UP` |
| **📘 Interactive API Docs (Swagger)** | OpenAPI | **[https://train-schedule-devops.onrender.com/docs](https://train-schedule-devops.onrender.com/docs)** | 🟢 `ACTIVE` |

---

## 🚀 Quick Start (Local Stack)

```bash
# Launch the full SRE stack (API, Web, DB, Redis, Prometheus, Grafana)
docker compose up -d --build
```
* **React Operations Console**: `http://localhost` (or port 80)
* **Prometheus Metrics**: `http://localhost:9090`
* **Grafana Dashboards**: `http://localhost:3001` (admin/admin)
