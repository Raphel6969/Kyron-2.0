@echo off
if "%1"=="" goto help
if "%1"=="verify" (
    bash scripts/verify.sh
    exit /b %ERRORLEVEL%
)
if "%1"=="verify-full" (
    bash scripts/verify-full.sh
    exit /b %ERRORLEVEL%
)
if "%1"=="reset-demo" (
    bash scripts/reset-demo.sh
    exit /b %ERRORLEVEL%
)
if "%1"=="seed" (
    bash scripts/seed.sh
    exit /b %ERRORLEVEL%
)
:help
echo Hack Engine Target Commands:
echo   make verify       - Fast tier gate
echo   make verify-full  - Slow tier gate
echo   make reset-demo   - Restores deterministic demo state
echo   make seed         - Seeds database
