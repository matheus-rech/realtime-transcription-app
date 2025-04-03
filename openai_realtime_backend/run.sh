#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the server
uvicorn openai_realtime_backend.main:app --host 0.0.0.0 --port 8000 --reload 