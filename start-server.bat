@echo off
echo ========================================
echo Bitki Yasami - Web Server Baslatiliyor
echo ========================================
echo.
echo Python HTTP Server baslatiliyor...
echo.
echo Tarayiciyi acin: http://localhost:8000
echo.
echo NOT: PWA ozellikleri icin HTTP/HTTPS sunucu gereklidir.
echo      file:// protokolu ile PWA calismaz.
echo.
echo ESP32 Baglanti Kontrolu:
echo - ESP32 IP: 172.20.10.7
echo - ESP32 ayni agda olmali
echo - ESP32'nin calistigindan emin olun
echo.
echo Durdurmak icin Ctrl+C basin
echo.
cd /d "%~dp0"

REM Python kontrolu
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Python bulunamadi!
    echo.
    echo Python yuklemek icin: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

python -m http.server 8000
pause

