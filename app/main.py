import sys
from pathlib import Path

# Ensure project root is on sys.path so 'import app...' works regardless of current working directory
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import lifespan
from app.api.v1.router import api_v1_router
from app.exceptions.handlers import AppException, app_exception_handler
from app.middleware.correlation import CorrelationIdMiddleware

def create_application() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-Powered Multimodal Learning Platform for Dyslexic Learners",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # Middleware
    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    
    # Routers
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
    
    # Health check
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "app": settings.APP_NAME}
    
    return app

app = create_application()
