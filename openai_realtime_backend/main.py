import logging
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import HOST, PORT
from .routers import session_router, transcribe_router
from .services import openai_service

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="OpenAI Realtime Transcription API",
    description="Backend service for real-time transcription using OpenAI's Realtime API",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, this should be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session_router)
app.include_router(transcribe_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

# Periodically clean up expired ephemeral keys
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_expired_keys())

async def cleanup_expired_keys():
    while True:
        try:
            openai_service.cleanup_expired_keys()
        except Exception as e:
            logger.error(f"Error cleaning up expired keys: {str(e)}")
        await asyncio.sleep(600)  # Run every 10 minutes

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint, returns basic API information."""
    return {
        "name": "OpenAI Realtime Transcription API",
        "version": "1.0.0",
        "description": "Backend service for real-time transcription using OpenAI's Realtime API",
    }

# Run the app if executed directly
if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {HOST}:{PORT}")
    uvicorn.run("openai_realtime_backend.main:app", host=HOST, port=PORT, reload=True)
