# Runbook: High Event Latency

## Overview
This runbook guides the diagnosis and resolution of processing bottlenecks where `railpulse_processing_latency_seconds` spikes above expected thresholds (e.g., > 1.0s).

## Expected Behavior
Under high load (10k+ events), latency may increase linearly depending on CPU availability and Redis/PostgreSQL IOPS. The system should not drop events, but the Pipeline Trace may show delayed processing.

## Observed Behavior (Chaos Test Notes)
*(TODO: SRE, document your manual load testing observations here. Did latency spike at 1000, 5000, or 10000 events?)*

## Diagnostic Steps
1. **Check Grafana**: Look at the `Pipeline Latency` histogram. Is the latency isolated to a specific `event_type`?
2. **Trace API**: Hit `GET /api/v1/events/{correlation_id}` for a recent delayed event. Check the `processing_duration_ms` column to identify exactly which processor was slow (e.g., did `ConflictProcessor` take 900ms?).
3. **Infrastructure**: Check CPU and Memory utilization of the FastAPI pods and the PostgreSQL container.

## Recovery Steps
1. If the bottleneck is CPU, horizontally scale the FastAPI background workers (or introduce Celery/Kafka in a future refactor).
2. If the bottleneck is Database IO, verify database connection pooling limits in SQLAlchemy and optimize batch inserts.
