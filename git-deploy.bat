@echo off
echo ========================================
echo Git Deploy - Akilli Saksi
echo ========================================
echo.

REM Git kontrolu
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Git bulunamadi!
    echo.
    echo Git yuklemek icin: https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

echo Git bulundu!
echo.

REM Mevcut durumu kontrol et
if not exist ".git" (
    echo Git repository baslatiliyor...
    git init
    echo.
)

echo Dosyalar ekleniyor...
git add .

echo.
set /p commit_msg="Commit mesaji (Enter = varsayilan): "
if "%commit_msg%"=="" set commit_msg="Akilli Saksi Web Uygulamasi - ESP32 entegrasyonu"

echo.
echo Commit yapiliyor...
git commit -m "%commit_msg%"

echo.
echo ========================================
echo Git'e yuklemek icin:
echo.
echo 1. GitHub'da yeni repository olusturun
echo 2. Asagidaki komutlari calistirin:
echo.
echo    git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
echo.
pause

