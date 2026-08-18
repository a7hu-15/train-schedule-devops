# RailPulse Cloud: System Design Document

**Status:** Frozen (Final V1 Scope)  
**Date:** 2026-08-18  

---

## 1. Vision
RailPulse Cloud is an open-source **Railway Event Processing Platform** that teaches modern Cloud, DevOps, SRE, and event-driven architecture through a realistic railway domain.

## 2. Problem Statement
Railway systems generate massive volumes of operational events (delays, platform assignments, signal clears). These events must be ingested, validated, normalized, persisted, cached, analyzed, monitored, and visualized in real-time. RailPulse solves the software engineering problem of building a robust, observable event pipeline capable of handling this throughput via event-chaining, without relying on complex external brokers like Kafka.

## 3. Users
**Students, DevOps Engineers, Platform Engineers, Software Engineers, and Educators** building or operating event-driven software systems.

## 4. Architecture Diagram (CQRS Event Projection)
```text
                   RAILPULSE CLOUD
         (Railway Event Processing Platform)

                    EVENT SOURCES
        RailRadar (Prod)      Simulator (Dev/Chaos)

                         │
                         ▼

               EVENT INGESTION API (FastAPI)

                         │
                         ▼

               OPERATIONAL PROCESSING ENGINE
                (In-Memory Event Dispatcher)
                         
  TrainDelayed ──► DelayProcessor ──► PlatformConflict Event
                         │
                  Updates State ──► STATION STATE PROJECTION

                         │
                         ▼

                  EVENT STORE + CACHE
          (History) PostgreSQL + Redis (State)

                         │
                         ▼

                  OBSERVABILITY LAYER
               Prometheus ─ Grafana 

                         │
                         ▼

                  OPERATIONS CONSOLE (React)
    Overview | Live Events | Pipeline | Business Events | Metrics | Alerts | Utilities
```

## 5. Event Model & Lifecycle
Every event is wrapped in a strict JSON envelope (`event_id`, `timestamp`, `source`, `type`, `severity`, `payload`).
Events follow a strict lifecycle during processing:
`RECEIVED` → `VALIDATED` → `PROCESSED` → `COMPLETED` | `FAILED`

## 6. Data Flow & Event Chaining
1. **Ingestion**: FastAPI receives the event array and validates the envelope.
2. **Dispatch**: The internal `EventDispatcher` routes the event to specific Processors (e.g., `DelayProcessor`).
3. **Chaining**: Processors contain isolated business logic. If a `DelayProcessor` detects a conflict, it emits a *new* `PlatformConflict` event back to the Dispatcher.
4. **Telemetry**: The pipeline pushes detailed metrics (`events_processed_total`, `processing_latency_seconds`) to Prometheus.

## 7. Tech Stack
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React 18
- **Database**: PostgreSQL
- **Cache**: Redis
- **Observability**: Prometheus & Grafana
- **Orchestration**: Kubernetes & Docker
- **IaC & CI/CD**: Terraform & GitHub Actions

## 8. Deployment
Distributed microservices deployed via Kubernetes (HPA, Probes), with infrastructure provisioned by Terraform.

## 9. Observability
Grafana dashboards are explicitly tied to the pipeline:
- **Dashboard 1 (Pipeline)**: Events/sec, Latency, Failures, Queue Size.
- **Dashboard 2 (Business)**: TrainDelayed, PlatformConflict, RecommendationGenerated.
- **Dashboard 3 (Infrastructure)**: CPU, Memory, Redis, Database, API.

## 10. Security
Strict Pydantic validation drops malformed events at the ingestion edge. API endpoints are rate-limited. Trivy scans images.

## 11. Trade-offs
- **In-Memory Dispatcher vs Kafka**: We simulate an event bus in-memory to keep the learning curve manageable and focus on observability, deliberately avoiding the operational complexity of Kafka for Version 1.

## 12. Version 1 Core Scope
Frozen to: Event Ingestion API, Event Envelope, Chaos Simulator, Event Chaining Processing Engine, Postgres, Redis, Metrics, Grafana, Prometheus, Docker, K8s, Terraform, CI/CD, Documentation.
