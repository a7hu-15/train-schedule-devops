# Changelog

All notable changes to **RailPulse India** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-07

### Added
- **Passenger Tracker Engine**: Real-time train location tracking powered by RailRadar API.
- **Station Platform Operations Board**: Real-time platform occupancy and automated interval overlap conflict detection.
- **Dual Fallback Resiliency**: Redis stale cache fallback (`degraded: true`) and browser `localStorage` offline banner.
- **Container Orchestration**: 6-container Docker Compose setup (`railpulse-api`, `railpulse-web`, `railpulse-postgres`, `railpulse-redis`, `railpulse-prometheus`, `railpulse-grafana`).
- **Kubernetes Production Manifests**: Deployment manifests with HPA CPU autoscaling, liveness/readiness probes, and rolling updates.
- **Infrastructure-as-Code**: Terraform scripts for AWS ECR, VPC, Subnets, and Security Groups.
- **CI/CD Pipelines**: Dual GitHub Actions workflows with automated Pytest and Trivy security scanning.
- **Apple/Linear Design Language**: Translucent glassmorphism, glowing status pills, and dark mode UI components.

