# Runbook: Redis Down

## Overview
This runbook describes the expected behavior and recovery steps when the Redis Live State Cache is unavailable.

## Expected Behavior
RailPulse Cloud is designed with **graceful degradation**. If the Redis container crashes or is unreachable:
1. The ingestion pipeline **WILL NOT** fail.
2. The `cache.py` client will catch the `ConnectionError`.
3. An explicit log `[INFO] Redis unavailable. Falling back to LocalMemoryCache.` will be emitted.
4. The system will temporarily store the state projections in an in-memory dictionary.
5. The REST API and Grafana dashboards relying on live state may serve slightly stale or local-only data depending on the pod instance.

## Observed Behavior (Chaos Test Notes)
*(TODO: SRE, document your manual chaos testing observations here.)*

## Recovery Steps
1. Identify the cause of Redis failure (OOM, network partition, manual stop).
2. Restart the Redis container / Kubernetes pod.
3. Verify the `cache.py` client reconnects on the next state sync request.
4. The projected state will rapidly re-sync as new events flow through the system.
