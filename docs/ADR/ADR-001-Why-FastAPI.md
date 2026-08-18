# ADR-001: Why FastAPI?

**Status:** Accepted
**Date:** 2026-08-18

## Context
RailPulse Cloud processes high-volume operational events (train delays, conflicts) that need to be ingested, normalized, and cached rapidly. The processing pipeline must handle thousands of concurrent I/O-bound requests (database reads, cache writes, API fetching) without blocking the main event loop. 

## Decision
We selected **FastAPI** as the core backend framework over Django, Flask, or Express.js.

## Rationale
1. **Asynchronous I/O**: FastAPI natively supports `asyncio`, making it incredibly efficient for our I/O-bound pipeline (Redis fetching and PostgreSQL persisting) compared to synchronous frameworks.
2. **Pydantic Validation**: Operational events are chaotic. Pydantic ensures strict schema validation at the ingestion layer, dropping malformed events before they corrupt the operational state.
3. **Performance**: Built on Starlette and Uvicorn, FastAPI provides Node.js-level concurrency with the readability of Python, crucial for processing event bursts during station delay cascades.
4. **Built-in Observability Hooks**: Easy to integrate Prometheus middleware for tracking our critical business metrics (`railpulse_event_queue_size`, etc.).
