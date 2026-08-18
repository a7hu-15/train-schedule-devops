# Runbook: PostgreSQL Database Failure

## Overview
This runbook covers the scenario where the primary PostgreSQL Event Store goes offline.

## Expected Behavior
Unlike the Redis cache, PostgreSQL is the **System of Record** for our Event Sourcing architecture. If PostgreSQL goes down:
1. The ingestion pipeline (`POST /ingest`) should still accept events into the background tasks (or message queue).
2. The `EventDispatcher` will fail to persist the `RECEIVED` status.
3. Depending on the `SQLAlchemy` retry configuration, the processors may crash and the event will be lost, OR the dispatcher will queue the event for a retry.
4. Alerts for `railpulse_events_failed_total` should spike in Grafana.

## Observed Behavior (Chaos Test Notes)
*(TODO: SRE, document your manual chaos testing observations here. Specifically note what happens to in-flight events when the database connection drops.)*

## Recovery Steps
1. Restore the PostgreSQL cluster/container.
2. Verify the FastAPI application successfully reconnects to the connection pool.
3. Identify the window of lost events via Prometheus metrics.
4. Manually re-ingest lost events from the upstream DLQ (if implemented in future phases) or Simulator.
