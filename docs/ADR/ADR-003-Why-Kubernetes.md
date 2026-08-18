# ADR-003: Why Kubernetes?

**Status:** Accepted
**Date:** 2026-08-18

## Context
A Railway Operations Platform is mission-critical. If the platform goes down during a major delay cascade (e.g., due to severe weather), SRE teams lose visibility exactly when they need it most. The system must support zero-downtime deployments, self-healing, and rapid autoscaling based on event queue size.

## Decision
We orchestrate the RailPulse processing pipeline and dashboards using **Kubernetes (K8s)**.

## Rationale
1. **Liveness & Readiness Probes**: K8s continuously monitors our FastAPI endpoints. If an API pod deadlocks while parsing a malformed train event, K8s automatically restarts the pod without human intervention.
2. **Horizontal Pod Autoscaling (HPA)**: During normal hours, the system runs with minimal resources. If a weather event causes a massive spike in delay updates, HPA automatically scales the FastAPI worker pods based on CPU or custom Prometheus metrics (like event queue depth).
3. **Zero-Downtime Rolling Updates**: Railway operations are 24/7; there are no "maintenance windows." K8s allows us to deploy new versions of the conflict recommendation engine seamlessly without dropping active websocket connections or API requests from the dashboards.
