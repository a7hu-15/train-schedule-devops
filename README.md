# 🚆 RailPulse India — Intelligent Train Tracking & Operations Scheduling Intelligence Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_App-railpulse--6f8.pages.dev-00C7B7?style=for-the-badge&logo=cloudflare&logoColor=white)](https://railpulse-6f8.pages.dev)
[![API Health](https://img.shields.io/badge/⚡_API_Status-Live_UP-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://train-schedule-devops.onrender.com/health/live)
[![Pytest](https://img.shields.io/badge/🧪_Tests-20%2F20_Passed-brightgreen?style=for-the-badge)](backend/tests/)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15-3ECF8E.svg)](https://supabase.com/)
[![Upstash](https://img.shields.io/badge/Upstash-Redis_7-00E599.svg)](https://upstash.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020.svg)](https://pages.cloudflare.com/)
[![Render](https://img.shields.io/badge/Render-FastAPI-46E3B7.svg)](https://render.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-HPA-326CE5.svg)](https://kubernetes.io/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS_IaC-7B42BC.svg)](https://www.terraform.io/)

> **RailPulse India** is a cloud-native train tracking and railway operations scheduling intelligence platform designed to deliver sub-second journey ETA status to passengers while empowering railway dispatchers with real-time station platform occupancy tracking and automated conflict resolution.

---

## 🔗 Live Production Endpoints

| Resource | Environment | Live URL | Status |
|---|---|---|---|
| **🌐 Production Web Application** | Cloudflare Pages | **[https://railpulse-6f8.pages.dev](https://railpulse-6f8.pages.dev)** | 🟢 `ACTIVE` |
| **⚡ Backend Microservice API** | Render | **[https://train-schedule-devops.onrender.com](https://train-schedule-devops.onrender.com)** | 🟢 `ACTIVE` |
| **🩺 Liveness Probe** | Render SRE Probe | **[https://train-schedule-devops.onrender.com/health/live](https://train-schedule-devops.onrender.com/health/live)** | 🟢 `UP` |
| **🩺 Readiness Probe** | Render SRE Probe | **[https://train-schedule-devops.onrender.com/health/ready](https://train-schedule-devops.onrender.com/health/ready)** | 🟢 `READY` |
| **📘 Interactive API Docs (Swagger)** | OpenAPI | **[https://train-schedule-devops.onrender.com/docs](https://train-schedule-devops.onrender.com/docs)** | 🟢 `ACTIVE` |
| **📦 GitHub Repository** | Main Branch | **[https://github.com/a7hu-15/train-schedule-devops](https://github.com/a7hu-15/train-schedule-devops)** | 🟢 `MAIN` |

---

## 🎯 The Problem It Solves

Indian Railways handles over 23 million passengers and 13,000 passenger trains daily. Managing journey tracking and station operations at this scale introduces three fundamental engineering challenges:

### 1. The Passenger Challenge (Stale Data & Network Constraints)
* **High Latency & Low Bandwidth**: Mobile users on moving trains experience intermittent connectivity and slow network speeds. Heavy web apps fail to load.
* **Strict Upstream Rate Limits**: Live APIs (such as RailRadar) impose daily quota restrictions (e.g., 50 calls/day on free tiers). Unthrottled direct polling quickly exhausts quota.
* **False Precision**: Traditional apps display static scheduled times rather than dynamic delay-based Estimated Time of Arrival (ETA).

### 2. The Operations Challenge (Platform Overcrowding & Bottlenecks)
* **Manual Overlap Conflicts**: When incoming trains are delayed (e.g., +15 mins on Rajdhani Express), platform arrival windows overlap, causing station gridlock.
* **Lack of Real-Time Optimization**: Station masters lack automated decision support systems to reassign platforms or adjust departure slots dynamically.

### 3. The DevOps & Resilience Challenge (System Availability)
* **Single-Point Failure Risks**: When upstream railway APIs go down or rate-limit, passenger apps crash without fallback.
* **Infrastructure Inconsistency**: Inability to roll back deployments seamlessly without dropping active HTTP connections.

---

## 💡 How RailPulse India Solves It

```text
                                RAILPULSE INDIA ARCHITECTURE
                    Intelligent Train Tracking & Operations Platform

       PASSENGER TRACKER MODE                        OPERATIONS CONTROL MODE
       (Real RailRadar Data)                           (Simulation Engine)
                 │                                               │
                 ▼                                               ▼
      ┌─────────────────────┐                         ┌─────────────────────┐
      │ Live Train Search   │                         │ Station Occupancy   │
      │ Station Timeline    │                         │ Conflict Detector   │
      │ Real-Time ETA       │                         │ Automated Dispatch  │
      └──────────┬──────────┘                         └──────────┬──────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                            Cloudflare Pages (React 18)
                                         │
                                     (REST API)
                                         │
                                         ▼
                            Render Web Service (FastAPI)
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
         Supabase PostgreSQL                       Upstash Redis Cache
         (ORM & Data Persistence)                  (60s TTL Cache-Aside)
                    │                                         │
                    ▼                                         ▼
          RailRadar Engine API                      Dual Resilience Fallback
```

### 🛠️ Architecture Highlights
1. **Cache-Aside Layer (Redis 7 & Upstash)**: Caches live journey data with a **60-second TTL**. 99.9% of passenger searches are served directly from Redis memory in **< 2ms**, consuming only 1 upstream API request per minute per train.
2. **Dual-Layer Fallback Resiliency**:
   * *Server Degradation Fallback*: If RailRadar returns 429 (rate-limit) or 503 (timeout), FastAPI serves stale Redis cache (`degraded: true`, `source: "CACHED"`) accompanied by an amber banner.
   * *Client Offline Backup*: If the entire backend is unreachable, the React client automatically serves browser `localStorage` snapshots (`source: "OFFLINE_LOCAL"`) with a rose alert banner.
3. **Platform Conflict Detection Algorithm**: Evaluates arrival/departure time intervals across station platforms (`NDLS`, `MMCT`, `RKMP`, `BSB`, `TVC`):
   $$\text{Conflict} = (\text{Train}_A.\text{arrival} < \text{Train}_B.\text{departure}) \land (\text{Train}_B.\text{arrival} < \text{Train}_A.\text{departure})$$
   When a conflict occurs, the rule-based engine generates instant resolution options (e.g., *"Reassign Train 12002 to Platform 4"*).

---

## ✨ Core Product Features

### 🚄 1. Passenger Tracker Module
* **Search Engine**: Search flagship trains by number or name (`12951` Mumbai Rajdhani, `22436` Vande Bharat, `12002` Bhopal Shatabdi, `12259` Sealdah Duronto, `12626` Kerala Express).
* **Auto-Suggestions Dropdown**: Instant auto-complete search matching route info (e.g., `MMCT → NDLS`).
* **Route & Station Timeline**: Completed stops, active segment indicators, scheduled vs. actual arrival/departure, and distance progress bar.
* **Live Freshness Ticker**: Prominent live counter showing `"Updated X seconds ago"`.
* **Bookmarking**: Save favorite trains locally in browser `localStorage`.

### 🎛️ 2. Operations & Scheduling Control Center
* **Station Platform Occupancy Board**: Real-time status pills (`AVAILABLE` 🟢, `OCCUPIED` 🔴, `CONFLICT` 🟡).
* **Interval Overlap Conflict Detector**: Detects platform bottlenecks caused by delay propagation.
* **Automated Resolution Engine**: Rule-based dispatch optimization (Platform reassignment or slot adjustment).

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend UI** | React, TypeScript, Vite, TailwindCSS | 18.3 / 5.4 | Apple/Linear translucent glassmorphism interface |
| **Backend API** | FastAPI, Python, Pydantic V2 | 0.110 / 3.11 | High-performance async REST API with SRE probes |
| **Database** | PostgreSQL, SQLAlchemy | 15.0 / 2.0 | Managed database on **Supabase** |
| **Caching** | Redis, `redis-py` | 7.0 | Serverless low-latency cache on **Upstash** |
| **Frontend Hosting**| Cloudflare Pages | Global Edge | Global CDN hosting (`railpulse-6f8.pages.dev`) |
| **Backend Hosting** | Render Web Service | Free Tier | Production container hosting (`train-schedule-devops.onrender.com`) |
| **Containerization**| Docker, Docker Compose | 24.0 / 2.20 | 6-container local stack (API, Web, Postgres, Redis, Prometheus, Grafana) |
| **Orchestration**  | Kubernetes (Minikube / EKS) | 1.28 | HPA autoscaling, liveness/readiness probes, zero-downtime rolling updates |
| **IaC** | Terraform | 1.5 | AWS ECR, VPC, Subnets, and Security Groups automation |
| **Observability**  | Prometheus, Grafana | Latest | RED metrics, Redis cache hit ratio, request latency tracking |
| **CI/CD** | GitHub Actions | Workflows | Automated Pytest suite & Trivy security vulnerability scanner |

---

## 🚀 Quick Start & Local Setup

### Option A: Run locally with Docker Compose (6 Services)
```bash
# Clone the repository
git clone https://github.com/a7hu-15/train-schedule-devops.git
cd train-schedule-devops

# Launch the full stack (API, Web, Postgres, Redis, Prometheus, Grafana)
docker compose up -d --build

# Verify container health
docker compose ps
```
Local Access:
* **Frontend Web App**: `http://localhost:3000`
* **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`
* **Prometheus Metrics**: `http://localhost:9090`
* **Grafana Dashboard**: `http://localhost:3001` (Credentials: `admin` / `admin`)

---

### Option B: Run Backend Unit Tests (20/20 Passed)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run pytest suite
PYTHONPATH=. pytest tests/ -v
```

---

### Option C: Validate Infrastructure (Kubernetes & Terraform)
```bash
# Validate Kubernetes Manifests
python3 -c "import yaml, glob; [list(yaml.safe_load_all(open(f))) for f in glob.glob('infra/k8s/*.yaml')]; print('K8s Manifests Valid!')"

# Run Terraform Plan (AWS IaC)
cd infra/terraform
./terraform init -backend=false
./terraform plan
```

---

## 📁 Repository Directory Map

```text
RailPulse/
├── README.md                           # Master Project Documentation
├── LICENSE                             # MIT License
├── CHANGELOG.md                        # Semantic Versioning History
├── CONTRIBUTING.md                     # Contribution Guidelines
├── docker-compose.yml                  # 6-Service Local Stack Spec
├── docs/
│   └── RAILPULSE_FINAL_PROJECT_REPORT.md # Comprehensive Report & Viva Guide
├── backend/                            # FastAPI Python 3.11 Microservice
│   ├── app/
│   │   ├── api/v1/                     # Journeys, Trains, Operations endpoints
│   │   ├── core/                       # Config, metrics, logging
│   │   ├── db/                         # SQLAlchemy models, sessions, base
│   │   ├── providers/                  # RailRadar API provider & simulator
│   │   ├── schemas/                    # Pydantic request/response models
│   │   └── services/                   # Cache-aside & scheduling logic
│   ├── tests/                          # 20 Pytest Unit & Integration Tests
│   └── Dockerfile
├── frontend/                           # React 18 + TypeScript Application
│   ├── src/
│   │   ├── components/                 # SearchBar, StatusHeader, JourneyTimeline, OperationsBoard
│   │   ├── App.tsx                     # Main application layout
│   │   ├── api.ts                      # Fetch helper with fallback logic
│   │   └── index.css                   # Glassmorphic CSS design system
│   └── Dockerfile
├── infra/
│   ├── k8s/                            # Kubernetes Manifests (Deployments, HPA, Probes, Secrets)
│   └── terraform/                      # AWS IaC (VPC, Subnets, ECR, Security Groups)
└── ops/
    ├── monitoring/                     # Prometheus rules & Grafana dashboard specs
    └── workflows/                      # GitHub Actions CI & Trivy Security Scans
```

---

## 📜 License & Author

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Developed with ❤️ by **Ashu Chaudhary** (RailPulse Team).

