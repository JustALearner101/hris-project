"""FastAPI application entrypoint for IOH-RAG-POC."""

import asyncio
from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

load_dotenv()

from src.api.routers import chat, health
from src.worker.cv_consumer import CvStreamWorker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ioh_rag_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for initialization and cleanup."""
    logger.info("Starting IOH-RAG-POC API Service...")
    worker: CvStreamWorker | None = None
    worker_task: asyncio.Task[None] | None = None

    if os.getenv("ENABLE_CV_WORKER", "true").strip().lower() != "false":
        worker = CvStreamWorker()
        app.state.cv_worker = worker
        worker_task = asyncio.create_task(worker.run_forever())
        logger.info("Started background CvStreamWorker task.")

    yield

    logger.info("Shutting down IOH-RAG-POC API Service...")
    if worker is not None:
        worker.stop()
    if worker_task is not None:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title="IOH RAG Chat API",
        description="Realtime streaming chat, retrieval, and ATS CV worker API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Enable CORS for Next.js frontends (localhost:3000 main HRIS & localhost:3001 ATS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "*",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(chat.router)

    return app


app = create_app()
