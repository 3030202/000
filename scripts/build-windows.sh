#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " [000-MISSION-CONTROL] STANDALONE WINDOWS BUILD PIPELINE  "
echo "=========================================================="

echo "[1/4] Generating & validating visual brand assets..."
python3 scripts/generate_icons.py

echo "[2/4] Compiling TypeScript & building Vite production assets..."
npm run build

echo "[3/4] Packaging Standalone Windows Executable (.exe)..."
npx electron-builder --win portable nsis --x64

echo "[4/4] Verifying generated release artifacts..."
ls -lh dist-release/

echo "=========================================================="
echo " BUILD SUCCESSFUL: Windows standalone binaries ready in dist-release/"
echo "=========================================================="
