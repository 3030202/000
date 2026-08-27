@echo off
REM ==========================================================
REM  [000-MISSION-CONTROL] NATIVE WINDOWS BUILD PIPELINE
REM ==========================================================

echo [1/4] Generating visual brand assets...
python scripts\generate_icons.py

echo [2/4] Compiling TypeScript and bundling Vite frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Vite build failed!
    exit /b %errorlevel%
)

echo [3/4] Packaging Standalone Windows .exe (Portable ^& Installer)...
call npx electron-builder --win portable nsis --x64
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    exit /b %errorlevel%
)

echo [4/4] Release packaging complete!
dir dist-release\
echo ==========================================================
echo  BUILD COMPLETE: Executables located in dist-release\
echo ==========================================================
pause
