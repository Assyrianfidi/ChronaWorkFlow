#!/bin/bash
# Fix WSL dependency issues - reinstall platform-specific binaries

set -e

echo "🔧 Fixing WSL dependencies for AccuBooks..."

cd /mnt/c/FidiMyProjects2025/Software_Projects/AccuBooks/AccuBooks

# Remove platform-specific binaries
echo "📦 Removing Windows-specific binaries..."
rm -rf node_modules/@esbuild/win32-x64 2>/dev/null || true
rm -rf node_modules/@rollup/rollup-win32-x64-msvc 2>/dev/null || true
rm -rf node_modules/esbuild/esbuild.exe 2>/dev/null || true

# Install Linux-specific binaries
echo "📦 Installing Linux-specific binaries..."
npm install --no-save @esbuild/linux-x64
npm install --no-save esbuild

# Verify installation
echo "✅ Verifying esbuild installation..."
if [ -f "node_modules/@esbuild/linux-x64/bin/esbuild" ]; then
    echo "✅ esbuild Linux binary installed successfully"
else
    echo "❌ esbuild Linux binary not found"
    exit 1
fi

echo "✅ WSL dependencies fixed successfully"
echo "🚀 Ready to start backend"
