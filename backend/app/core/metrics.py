from prometheus_client import Counter, Histogram

# RailRadar External API Metrics
RAILRADAR_REQUESTS = Counter(
    "railpulse_railradar_requests_total",
    "Total requests sent to RailRadar API",
    ["status"]
)

RAILRADAR_LATENCY = Histogram(
    "railpulse_railradar_latency_seconds",
    "Latency of requests sent to RailRadar API in seconds",
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# Redis Cache Metrics
REDIS_CACHE_HITS = Counter(
    "railpulse_redis_cache_hits_total",
    "Total Redis cache hits for journey status and search"
)

REDIS_CACHE_MISSES = Counter(
    "railpulse_redis_cache_misses_total",
    "Total Redis cache misses requiring external API / database lookup"
)
