from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ..services import openai_service
from ..config import DEFAULT_MODEL, EPHEMERAL_KEY_EXPIRATION

router = APIRouter(prefix="/api/v1/session", tags=["Session"])

class EphemeralKeyRequest(BaseModel):
    """Request model for generating an ephemeral API key."""
    scope: Optional[List[str]] = None
    expiration: Optional[int] = EPHEMERAL_KEY_EXPIRATION

class EphemeralKeyResponse(BaseModel):
    """Response model for the ephemeral API key."""
    key: str
    key_id: str
    expiration: int
    scope: List[str]

class ModelInfo(BaseModel):
    """Model for transcription model information."""
    model_id: str
    openai_model: str
    description: str

class SessionUpdateRequest(BaseModel):
    """Request model for updating a session."""
    model: Optional[str] = DEFAULT_MODEL
    instructions: Optional[str] = None
    modalities: Optional[List[str]] = None

@router.post("/key", response_model=EphemeralKeyResponse)
async def generate_ephemeral_key(request: EphemeralKeyRequest):
    """
    Generate an ephemeral API key for client-side use.
    
    This key will have limited scope and expiration time for security.
    """
    try:
        key_data = await openai_service.generate_ephemeral_key(
            scope=request.scope,
            expiration=request.expiration
        )
        return key_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ephemeral key: {str(e)}"
        )

@router.get("/models", response_model=List[ModelInfo])
async def get_available_models():
    """
    Get information about all available transcription models.
    """
    try:
        models = await openai_service.get_available_models()
        return models
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve models: {str(e)}"
        )

@router.get("/models/{model_name}", response_model=ModelInfo)
async def get_model_info(model_name: str):
    """
    Get information about a specific transcription model.
    """
    try:
        model_info = await openai_service.get_model_info(model_name)
        return model_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model information: {str(e)}"
        )

@router.post("/update", response_model=Dict[str, Any])
async def create_session_update(request: SessionUpdateRequest):
    """
    Create a session update payload for the OpenAI Realtime API.
    """
    try:
        payload = await openai_service.create_session_update_payload(
            model_name=request.model,
            instructions=request.instructions,
            modalities=request.modalities
        )
        return payload
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session update payload: {str(e)}"
        )
