import time
import uuid
import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from sqlalchemy import text

from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.db.base import Base
from app.db.session import engine, SessionLocal
from scripts.seed_data import seed_database

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("railpulse.main")

# Prometheus Metrics
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP Requests", ["method", "endpoint", "http_status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP Request Duration", ["method", "endpoint"])

app = FastAPI(
    title="RailPulse India API",
    description="Cloud-Native Train Journey Intelligence Platform API",
    version=settings.APP_VERSION,
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID & Prometheus Latency Middleware
@app.middleware("http")
async def add_metrics_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    start_time = time.time()
    response: Response = await call_next(request)
    duration = time.time() - start_time
    
    endpoint = request.url.path
    REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, http_status=response.status_code).inc()
    REQUEST_LATENCY.labels(method=request.method, endpoint=endpoint).observe(duration)
    
    response.headers["X-Request-ID"] = request_id
    return response

# Register API Endpoints
app.include_router(api_v1_router)

# Health Check Probes for Kubernetes
@app.get("/health/live", tags=["health"])
def liveness():
    """Liveness probe: verifies application process is alive."""
    return {"status": "UP", "timestamp": time.time()}

@app.get("/health/ready", tags=["health"])
def readiness():
    """Readiness probe: verifies database & cache readiness."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "READY", "db": "CONNECTED"}
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        return Response(content='{"status": "NOT_READY"}', status_code=503, media_type="application/json")

@app.get("/metrics", tags=["monitoring"])
def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.on_event("startup")
def startup_event():
    """Create database tables and seed initial sample trains if empty."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
