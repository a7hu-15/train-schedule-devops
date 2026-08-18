# ADR-002: Why Redis?

**Status:** Accepted
**Date:** 2026-08-18

## Context
Railway operational events generate massive read loads. SRE and station dashboards auto-refresh every few seconds to maintain situational awareness. If every dashboard refresh triggered a database query or an upstream API call, the system would collapse under connection exhaustion, and we would hit API rate limits instantly.

## Decision
We implemented a **Cache-Aside Architecture using Redis** as our primary operational state store for read-heavy operations.

## Rationale
1. **Microsecond Latency**: Operational dashboards require <50ms response times to feel "live." Redis serves the current platform state from memory in ~2ms.
2. **Provider Protection**: Upstream railway APIs (like RailRadar) are fragile and heavily rate-limited. Redis acts as a shield; we fetch from the provider once, cache the state, and serve thousands of operator dashboards from the cache.
3. **Graceful Degradation**: If the backend database or upstream API fails, the FastAPI layer is designed to serve "stale" state from Redis with a `degraded: true` flag. This ensures operators always have a dashboard, even during a partial outage.
