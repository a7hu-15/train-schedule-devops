import logging
from prometheus_client import Counter, Histogram

logger = logging.getLogger(__name__)

# --- Pipeline Metrics ---
EVENTS_RECEIVED = Counter(
    "railpulse_events_received_total",
    "Total number of events received by the ingestion API",
    ["event_type"]
)

EVENTS_PROCESSED = Counter(
    "railpulse_events_processed_total",
    "Total number of events successfully processed",
    ["event_type"]
)

EVENTS_FAILED = Counter(
    "railpulse_events_failed_total",
    "Total number of events that failed processing",
    ["event_type"]
)

PROCESSING_LATENCY = Histogram(
    "railpulse_processing_latency_seconds",
    "Time taken to process an event (in seconds)",
    ["event_type"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]
)

# --- Business Metrics ---
BUSINESS_EVENTS_GENERATED = Counter(
    "railpulse_business_events_total",
    "Total number of intelligence/business events generated",
    ["event_type"]
)


def increment_event_received(event_type: str):
    EVENTS_RECEIVED.labels(event_type=event_type).inc()

def increment_event_processed(event_type: str):
    EVENTS_PROCESSED.labels(event_type=event_type).inc()
    
    # Also track business generation for specific events
    if event_type in ["PlatformConflict", "RecommendationGenerated", "AlertGenerated"]:
        BUSINESS_EVENTS_GENERATED.labels(event_type=event_type).inc()

def increment_event_failed(event_type: str):
    EVENTS_FAILED.labels(event_type=event_type).inc()

def record_processing_latency(event_type: str, duration_seconds: float):
    PROCESSING_LATENCY.labels(event_type=event_type).observe(duration_seconds)
