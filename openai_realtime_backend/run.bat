@echo off

:: Activate virtual environment if it exists
if exist venv (
    call venv\Scripts\activate
)

:: Run the server
uvicorn openai_realtime_backend.main:app --host 0.0.0.0 --port 8000 --reload 