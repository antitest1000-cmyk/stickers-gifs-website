@echo off
echo ===================================================
echo   STICKERPENCIL - LOCAL DEVELOPMENT SERVER
echo ===================================================
echo Server starting on http://localhost:8080 ...
echo Press Ctrl+C to stop the server anytime.
echo ===================================================
python -m http.server 8080
pause

