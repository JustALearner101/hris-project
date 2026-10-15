"""FastAPI application entrypoint for IOH-RAG-POC."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

load_dotenv()

from src.api.routers import chat, health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ioh_rag_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for initialization and cleanup."""
    logger.info("Starting IOH-RAG-POC API Service...")
    yield
    logger.info("Shutting down IOH-RAG-POC API Service...")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title="IOH RAG Chat API",
        description="Realtime streaming chat and retrieval API for IOH Knowledge Assistant",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Enable CORS for Next.js frontend (localhost:3000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(chat.router)

    return app


app = create_app()
