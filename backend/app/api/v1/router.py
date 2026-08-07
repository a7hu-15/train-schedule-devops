from fastapi import APIRouter
from app.api.v1.trains import router as trains_router
from app.api.v1.journeys import router as journeys_router
from app.api.v1.operations import router as operations_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(trains_router)
api_v1_router.include_router(journeys_router)
api_v1_router.include_router(operations_router)
