#!/bin/bash
# Build script for Threat Blocker Safari Extension

set -e

echo "🔨 Building Threat Blocker Safari Extension..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Create placeholder icons (in production, replace with actual icons)
echo "🎨 Creating placeholder icons..."

# Create 16x16 icon
convert -size 16x16 xc:gradient:blue-purple -pointsize 8 -draw "text 2,12 '♦'" icons/icon-16.png 2>/dev/null || echo "Convert not available, skipping icon generation"

# Create 32x32 icon
convert -size 32x32 xc:gradient:blue-purple -pointsize 16 -draw "text 6,22 '♦'" icons/icon-32.png 2>/dev/null || true

# Create 48x48 icon
convert -size 48x48 xc:gradient:blue-purple -pointsize 24 -draw "text 10,34 '♦'" icons/icon-48.png 2>/dev/null || true

# Create 128x128 icon
convert -size 128x128 xc:gradient:blue-purple -pointsize 64 -draw "text 26,90 '♦'" icons/icon-128.png 2>/dev/null || true

echo "🔄 Building with webpack..."
npm run build

echo "✅ Build complete!"
echo ""
echo "📂 Extension files are in: dist/"
echo ""
echo "Next steps for loading in Safari:"
echo "1. Go to Safari > Settings > Extensions"
echo "2. Click the + button in the bottom left"
echo "3. Select the ThreatBlocker.xcodeproj from this folder"
echo "4. Follow the Xcode build process"
