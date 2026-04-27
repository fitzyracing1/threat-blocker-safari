# Threat Blocker - Deployment & Launch Guide

## Quick Start (5 minutes)

### 1. Grant Executable Permissions
```bash
chmod +x /Users/joshuafitzgerald/threat-blocker-safari/ThreatBlocker.app/Contents/MacOS/ThreatBlocker
```

### 2. Launch the Application
```bash
open /Users/joshuafitzgerald/threat-blocker-safari/ThreatBlocker.app
```

### 3. Enable in Safari
1. Open **Safari** → **Settings** (⌘,)
2. Go to **Extensions** tab
3. Find **"Threat Blocker"** in the list
4. Check the box to enable it
5. Click **"Allow All Websites"** (or configure site permissions)

### 4. Verify Installation
- Look for the shield icon (🛡️) in Safari's address bar
- Visit a known malicious site to test blocking
- Check Safari's web console (Develop → Show Web Inspector) for blocking logs

---

## Project Contents

### Core Application
- **ThreatBlocker.app** (79 KB)
  - macOS application bundle
  - Swift executable with SafariServices integration
  - Info.plist configuration

### Source Code
- **Sources/main.swift** - Main application entry point
- **ThreatBlocker/AppDelegate.swift** - App lifecycle management
- **ThreatBlocker/ViewController.swift** - UI controller
- **ThreatBlockerExtension/SafariWebExtensionHandler.swift** - Extension message handler
- **ThreatBlockerExtension/content-script.js** - Safari content script (threat detection)

### Configuration
- **Package.swift** - Swift package manifest
- **package.json** / **package-lock.json** - npm dependencies
- **manifest.json** - Extension metadata

---

## Features

### 🛡️ Threat Detection
- Intercepts network requests to malicious domains
- Fetches threat intelligence from URLhaus API
- Updates threat database hourly
- Real-time blocking with user notifications

### 🔄 Background Updates
- Automatic threat feed refresh every 60 minutes
- No manual intervention required
- Graceful error handling with fallback defaults

### 🧠 Smart Blocking
- Domain-based detection
- URL pattern matching
- Memory-efficient blocklist storage
- Minimal performance impact

---

## Configuration

### Modify Threat Feed Update Interval
Edit `ThreatBlockerExtension/content-script.js`, line 12:
```javascript
setInterval(() => this.fetchFeeds(), 3600000);  // 1 hour = 3600000 ms
```

### Add Additional Threat Sources
Extend the `fetchFeeds()` method in `content-script.js`:
```javascript
// Example: Add PhishTank feed
const phishing = await fetch('https://phishtank.com/phish_search.php?...');
```

### Customize Blocking Message
Edit the alert message in `content-script.js`, line 39:
```javascript
alert('⚠️ Malicious link blocked by Threat Blocker');
```

---

## Troubleshooting

### App Won't Launch
```bash
# Check executable permissions
ls -l ThreatBlocker.app/Contents/MacOS/ThreatBlocker

# Should show: -rwxr-xr-x (executable)
# If not, run: chmod +x ThreatBlocker.app/Contents/MacOS/ThreatBlocker
```

### Extension Not Appearing in Safari
1. Ensure app is running
2. Restart Safari completely (⌘Q)
3. Open Safari Settings again
4. Check "Develop" → "Allow Unsigned Extensions" if needed

### Blocking Not Working
1. Check web console: Safari → Develop → Show Web Inspector
2. Look for console logs starting with "🛡️" or "✅"
3. Verify threat feed loaded: Check for "Threat feeds updated"

### Performance Issues
- Reduce feed update frequency (increase interval in content-script.js)
- Clear browser cache and extension data
- Disable other extensions temporarily

---

## Security & Privacy

### What This Extension Does
✅ **Protects You:**
- Blocks connections to known malicious domains
- Prevents credential theft and malware infection
- Provides real-time threat intelligence

✅ **Respects Your Privacy:**
- No tracking of user browsing
- No data collection beyond threat checking
- All threat feeds from public sources (URLhaus)
- No telemetry or analytics

### Threat Intelligence Sources
- **URLhaus**: Community-driven malware URL database
  - URL: https://urlhaus.abuse.ch/
  - License: CC0 (Public Domain)
  - Updated: Continuously

---

## Building from Source

### Requirements
- **Xcode 15.0+** or **Swift 5.0+**
- **macOS 11.0+** for running
- **Node.js** 16+ (for npm dependencies)

### Build Steps
```bash
cd /Users/joshuafitzgerald/threat-blocker-safari

# Build Swift executable
swift build

# The app bundle is already in: ThreatBlocker.app/
```

### Release Build
```bash
swift build -c release
# Output: .build/release/ThreatBlocker
```

---

## Advanced Usage

### Command-Line Flags
```bash
# Run with debug logging
ThreatBlocker --debug

# Check version
ThreatBlocker --version

# Show help
ThreatBlocker --help
```

### Directory Locations
- **Codebase**: `/Users/joshuafitzgerald/threat-blocker-safari/`
- **Built App**: `/Users/joshuafitzgerald/threat-blocker-safari/ThreatBlocker.app`
- **Cache**: `~/.Library/Preferences/com.threatblocker.safari.app/`
- **Logs**: `~/Library/Logs/ThreatBlocker/`

### Manual Extension Installation (Development)
If extension doesn't auto-register:
1. Build: `swift build`
2. Copy extension files to app bundle:
   ```bash
   cp ThreatBlockerExtension/* ThreatBlocker.app/Contents/Resources/
   ```
3. Reload Safari extension (Develop → Reload Extensions)

---

## Support & Contributing

### Report Issues
Create detailed report including:
- Safari version (Safari → About Safari)
- macOS version (Apple menu → About This Mac)
- Extension version (Safari Settings → Extensions)
- Console error logs (Develop → Show Web Inspector → Console tab)

### Contribute Threat Intelligence
- Submit malicious URLs to https://urlhaus.abuse.ch/submit/
- Vote on existing submissions
- Help improve the threat database

---

## Legal & Ethical Use

**IMPORTANT**: This tool is designed for **defensive security purposes only**.

### Permitted Uses
✅ Protect yourself from malware and phishing
✅ Monitor your browsing for security threats
✅ Contribute to community threat intelligence
✅ Test security and safe browsing features

### Prohibited Uses
❌ Scanning others' networks without permission
❌ Blocking legitimate sites for malicious purposes
❌ Using threat data outside of this extension
❌ Bypassing blocking for harmful sites

---

**Last Updated**: December 14, 2025
**Version**: 1.0
**Status**: Production Ready
