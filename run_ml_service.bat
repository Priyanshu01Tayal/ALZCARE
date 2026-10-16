@echo off
echo =======================================================
echo Starting Alzheimer's MRI ML Service (FastAPI) on Port 8000
echo =======================================================
cd ml_service
.venv\Scripts\python.exe app.py
pause
