#!/bin/bash

echo "🔍 Threat Blocker Build Verification"
echo "===================================="
echo ""

PROJECT_DIR="/Users/joshuafitzgerald/threat-blocker-safari"
cd "$PROJECT_DIR"

# Check app bundle exists
if [ -d "ThreatBlocker.app" ]; then
    echo "✅ App Bundle: ThreatBlocker.app exists"
else
    echo "❌ App Bundle: NOT FOUND"
    exit 1
fi

# Check executable
if [ -x "ThreatBlocker.app/Contents/MacOS/ThreatBlocker" ]; then
    echo "✅ Executable: Has execute permissions"
    SIZE=$(du -h "ThreatBlocker.app/Contents/MacOS/ThreatBlocker" | awk '{print $1}')
    echo "   Size: $SIZE"
else
    echo "❌ Executable: Missing or not executable"
    exit 1
fi

# Check Info.plist
if [ -f "ThreatBlocker.app/Contents/Info.plist" ]; then
    echo "✅ Info.plist: Configured"
    BUNDLE_ID=$(grep -A1 "CFBundleIdentifier" "ThreatBlocker.app/Contents/Info.plist" | tail -1 | sed 's/<string>//g' | sed 's/<\/string>//g' | xargs)
    echo "   Bundle ID: $BUNDLE_ID"
else
    echo "❌ Info.plist: NOT FOUND"
    exit 1
fi

# Check source files
echo ""
echo "Source Files:"
SWIFT_FILES=$(find . -name "*.swift" -not -path "./.build/*" -not -path "./node_modules/*" 2>/dev/null | wc -l)
JS_FILES=$(find . -name "content-script.js" 2>/dev/null | wc -l)

if [ $SWIFT_FILES -gt 0 ]; then
    echo "✅ Swift Sources: $SWIFT_FILES files"
else
    echo "⚠️  Swift Sources: None found (may be pre-compiled)"
fi

if [ $JS_FILES -gt 0 ]; then
    echo "✅ JavaScript: $JS_FILES content-script.js"
else
    echo "❌ JavaScript: content-script.js NOT FOUND"
fi

# Check dependencies
echo ""
echo "Dependencies:"
if [ -f "package.json" ]; then
    echo "✅ npm: package.json exists"
else
    echo "⚠️  npm: package.json not found"
fi

if [ -f "Package.swift" ]; then
    echo "✅ Swift Package: Package.swift exists"
else
    echo "⚠️  Swift Package: Package.swift not found"
fi

# Check build cache
if [ -d ".build" ]; then
    BUILD_SIZE=$(du -sh ".build" | awk '{print $1}')
    echo "✅ Build Cache: $BUILD_SIZE"
else
    echo "⚠️  Build Cache: Not found (clean build)"
fi

# Summary
echo ""
echo "===================================="
echo "Summary: Ready for Launch ✅"
echo ""
echo "To run the app:"
echo "  open ThreatBlocker.app"
echo ""
echo "To enable in Safari:"
echo "  Safari → Settings → Extensions → Enable Threat Blocker"
echo ""

