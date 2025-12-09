@echo off
echo ========================================
echo Bitki Yasami - Web Server Baslatiliyor
echo ========================================
echo.
echo Python HTTP Server baslatiliyor...
echo Tarayiciyi acin: http://localhost:8000
echo.
echo Durdurmak icin Ctrl+C basin
echo.
cd /d "%~dp0"
python -m http.server 8000
pause

