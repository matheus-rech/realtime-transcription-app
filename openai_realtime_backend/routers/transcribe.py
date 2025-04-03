import json
import asyncio
import base64
import logging
from typing import Optional, Dict, Any, List
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from pydantic import BaseModel

from ..services import openai_service
from ..config import WEBSOCKET_PATH, WEBRTC_PATH, DEFAULT_MODEL

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Transcription"])

class TranscribeParams(BaseModel):
    """Parameters for transcription."""
    model: Optional[str] = DEFAULT_MODEL
    instructions: Optional[str] = None
    modalities: Optional[List[str]] = ["text"]

async def validate_connection_params(
    api_key: Optional[str] = Query(None),
    model: str = Query(DEFAULT_MODEL),
):
    """Validate connection parameters."""
    # Validate model
    try:
        await openai_service.get_model_info(model)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # API key is optional as we can use the server key
    return {
        "api_key": api_key,
        "model": model
    }

@router.websocket(WEBSOCKET_PATH)
async def transcribe_websocket(
    websocket: WebSocket, 
    model: str = Query(DEFAULT_MODEL),
    instructions: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time audio transcription using the OpenAI Realtime API.
    
    The client sends audio data, which is forwarded to OpenAI's Realtime API for transcription.
    Transcription results are streamed back to the client in real-time.
    """
    logger.info(f"WebSocket connection requested for model {model}")
    
    # Accept the WebSocket connection
    await websocket.accept()
    
    try:
        # Validate model
        try:
            await openai_service.get_model_info(model)
        except ValueError as e:
            await websocket.send_json({
                "type": "error",
                "error": {
                    "message": str(e),
                    "code": "invalid_model"
                }
            })
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Get WebSocket URL and headers
        ws_url = await openai_service.get_websocket_url(model)
        headers = await openai_service.get_session_headers()
        
        # Connect to OpenAI WebSocket
        async with websockets.connect(ws_url, extra_headers=headers) as openai_ws:
            # Send session update
            session_update = await openai_service.create_session_update_payload(
                model_name=model,
                instructions=instructions,
                modalities=["text"]
            )
            await openai_ws.send(json.dumps(session_update))
            
            # Handle communication between client and OpenAI
            await asyncio.gather(
                forward_client_to_openai(websocket, openai_ws),
                forward_openai_to_client(openai_ws, websocket)
            )
    except WebSocketDisconnect:
        logger.info("Client disconnected from WebSocket")
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "error": {
                    "message": str(e),
                    "code": "internal_error"
                }
            })
        except:
            pass

@router.websocket(WEBRTC_PATH)
async def transcribe_webrtc(
    websocket: WebSocket, 
    params: Dict = Depends(validate_connection_params)
):
    """
    WebRTC endpoint for real-time audio transcription using the OpenAI Realtime API.
    
    The client sends WebRTC SDP offers/answers and ICE candidates, which are
    processed and forwarded to OpenAI's Realtime API. Transcription results are
    streamed back to the client in real-time.
    """
    logger.info(f"WebRTC connection requested for model {params['model']}")
    
    # Accept the WebSocket connection
    await websocket.accept()
    
    try:
        # Get WebSocket URL
        model = params["model"]
        ws_url = await openai_service.get_websocket_url(model)
        
        # Use client API key if provided, otherwise use server key
        api_key = params.get("api_key")
        if api_key:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "OpenAI-Beta": "realtime=v1"
            }
        else:
            headers = await openai_service.get_session_headers()
        
        # Connect to OpenAI WebSocket
        async with websockets.connect(ws_url, extra_headers=headers) as openai_ws:
            await websocket.send_json({
                "type": "connection.established",
                "message": "Connected to OpenAI Realtime API"
            })
            
            # Handle WebRTC communication between client and OpenAI
            await asyncio.gather(
                forward_client_to_openai(websocket, openai_ws),
                forward_openai_to_client(openai_ws, websocket)
            )
    except WebSocketDisconnect:
        logger.info("Client disconnected from WebRTC WebSocket")
    except Exception as e:
        logger.error(f"Error in WebRTC connection: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "error": {
                    "message": str(e),
                    "code": "internal_error"
                }
            })
        except:
            pass

async def forward_client_to_openai(client_ws: WebSocket, openai_ws: websockets.WebSocketClientProtocol):
    """Forward messages from client to OpenAI."""
    try:
        while True:
            # Receive message from client
            message = await client_ws.receive_text()
            
            # Forward message to OpenAI
            await openai_ws.send(message)
    except WebSocketDisconnect:
        logger.info("Client disconnected while forwarding to OpenAI")
    except Exception as e:
        logger.error(f"Error forwarding client to OpenAI: {str(e)}")

async def forward_openai_to_client(openai_ws: websockets.WebSocketClientProtocol, client_ws: WebSocket):
    """Forward messages from OpenAI to client."""
    try:
        while True:
            # Receive message from OpenAI
            message = await openai_ws.recv()
            
            # Forward message to client
            await client_ws.send_text(message)
    except websockets.exceptions.ConnectionClosed:
        logger.info("OpenAI WebSocket closed")
        await client_ws.close(code=status.WS_1000_NORMAL)
    except Exception as e:
        logger.error(f"Error forwarding OpenAI to client: {str(e)}")
        try:
            await client_ws.send_json({
                "type": "error",
                "error": {
                    "message": str(e),
                    "code": "openai_error"
                }
            })
        except:
            pass
