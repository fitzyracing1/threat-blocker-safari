# Threat Logging & ISP Reporting Features

## Overview

The enhanced Threat Blocker extension now includes comprehensive threat logging, detailed attack analysis, IP geolocation tracking, and ISP reporting capabilities. Users can resume from blocked threats, view detailed threat history, analyze attack patterns, and report threats to Internet Service Providers.

---

## New Components

### 1. **Threat Logging System** (`ThreatLog`)

Every detected threat is now logged with comprehensive metadata:

```typescript
interface ThreatLog {
  id: string;                    // Unique identifier
  url: string;                   // Malicious URL
  timestamp: number;             // When detected
  ipAddress?: string;            // Source IP
  ipLocation?: IPLocation;       // Geolocation data
  attackType: string;            // Classification
  attackStructure?: AttackStructure;  // Attack patterns
  indicators: ThreatIndicator[];  // Threat sources
  metadata?: ThreatMetadata;     // Additional context
  userAgent?: string;            // Browser info
  blocked: boolean;              // Was it blocked?
  resumed: boolean;              // User chose to continue?
  reportedToISP: boolean;        // Sent to ISP?
  tabId: number;                 // Browser tab
}
```

### 2. **IP Geolocation Service** (`GeolocationService`)

Automatically geolocates IP addresses using the free ipapi.co API:

```typescript
interface IPLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  asn?: string;
}
```

**Features:**
- Automatic IP extraction from URLs
- 24-hour caching to prevent rate limiting
- Batch location lookups
- Fallback handling for non-IP URLs
- 1000 requests/day limit per user (free tier)

### 3. **Attack Structure Analyzer** (`AttackAnalyzer`)

Deeply analyzes URLs and attack patterns:

```typescript
interface AttackStructure {
  method: string;                    // GET, POST, etc.
  protocol: string;                  // http, https
  hasRedirects: boolean;             // Redirect chain?
  redirectChain?: string[];          // URLs in chain
  suspiciousPatterns: string[];      // Detected patterns
  encodingSchemes?: string[];        // base64, url-encoding, etc.
  obfuscationDetected: boolean;      // Encoded/obfuscated?
  payloadSize?: number;              // URL length
}
```

**Detection Patterns:**
- Base64 encoding
- Multiple URL encoding layers
- IP addresses instead of domains
- Non-standard ports (8080, 4444, etc.)
- Unusually long URLs (200+ chars)
- Suspicious query parameters (cmd=, exec=, eval=, etc.)
- Homoglyph/IDN attacks (Unicode lookalikes)
- JavaScript protocol handlers

**Malware Family Detection:**
- Emotet, TrickBot, Ryuk
- WannaCry, Zeus, Dridex
- Locky, Cerber
- Custom pattern matching

### 4. **ISP Reporting System** (`ISPReporter`)

Generates and sends incident reports to ISPs:

```typescript
interface ISPReport {
  id: string;
  timestamp: number;
  threatLogId: string;
  ispEmail?: string;
  reportData: {
    sourceIP: string;
    attackType: string;
    threatLevel: string;
    evidence: string[];
    timestamp: string;
  };
  status: 'pending' | 'sent' | 'failed';
  response?: string;
}
```

**Reporting Features:**
- Automatic ISP email detection (Comcast, Verizon, AT&T, etc.)
- Email template generation
- Backend API integration (surecookie_pilot)
- Failed report retry logic (3 attempts, hourly)
- Evidence collection from threat log
- Automatic WHOIS lookups

**Supported ISPs (with abuse emails):**
- Comcast (abuse@comcast.net)
- Verizon (abuse@verizon.net)
- AT&T (abuse@att.net)
- Charter (abuse@charter.net)
- Cox (abuse@cox.net)
- CenturyLink (abuse@centurylink.net)
- Frontier (abuse@frontiernet.net)
- Custom ISP support

### 5. **Threat History Viewer** (`history.html`)

Complete web UI for browsing and analyzing threat logs:

**Features:**
- ✅ Live threat statistics dashboard
- ✅ Advanced filtering (URL, IP, attack type, severity, status)
- ✅ Full-text search across all logs
- ✅ Detailed threat information modal
- ✅ Attack pattern visualization
- ✅ IP location heatmap data
- ✅ ISP reporting interface
- ✅ CSV export functionality
- ✅ Dark mode support
- ✅ Responsive mobile design

**Dashboard Stats:**
- Total threats detected
- Threats blocked
- Threats resumed by user
- Threats reported to ISP

**Filter Options:**
- By attack type (Phishing, Malware, C&C, Exploit, Ransomware)
- By severity (Critical, High, Medium, Low)
- By status (Blocked, Resumed, Reported to ISP)
- By URL/IP/attack type (search)

---

## User Workflows

### **Workflow 1: Block & Continue Anyway**

1. User visits malicious URL
2. Extension blocks request
3. Block page shows threat details
4. User sees "⚠️ Continue Anyway (Not Recommended)" button
5. User confirms with strong warning dialog
6. Threat marked as "resumed" in logs
7. User proceeds to URL at their own risk
8. Log preserved for future analysis

**Block Page Buttons:**
- ← Go Back (cancel request)
- ⚠️ Continue Anyway (resume from threat)
- ✅ Add to Whitelist (exclude domain from blocking)
- 📋 Report False Positive (flag as incorrect)
- 📊 View Threat History (open history viewer)

### **Workflow 2: Analyze Threat History**

1. Click "📊 History" button in popup
2. View dashboard with threat statistics
3. Apply filters (attack type, severity, status)
4. Search for specific URL or IP
5. Click threat to view full details
6. See attack patterns, obfuscation methods
7. View IP location and ISP info
8. Check if already reported to ISP

### **Workflow 3: Report to ISP**

1. User finds threatening attack from unknown IP
2. Opens threat history viewer
3. Clicks threat to view details
4. Clicks "📧 Report to ISP" button
5. System extracts threat data into email template
6. Sends to configured backend or generates email
7. User can copy template and send manually
8. Report logged with status tracking
9. Failed reports automatically retry hourly

### **Workflow 4: Export & Share**

1. Apply filters to narrow threat list
2. Click "📥 Export" button
3. Generates CSV file with all visible threats
4. Include in security reports
5. Share with other admins/teams
6. Timestamp, URL, attack type, IP, severity, status included

---

## Configuration Settings

### **Settings > General Tab**

New options for threat logging:

```
☑ Blocking Enabled
☑ Notifications Enabled
☑ Enable Geolocation Tracking
  └─ (Requires ipapi.co API, ~1000 requests/day limit)
☑ Enable ISP Reporting
  └─ ISP Email: [custom@isp.com]
     └─ (Auto-detected or user-provided)

Log Retention: [30] days
  └─ Auto-delete logs older than specified days
```

### **Settings > SureCookie Tab**

Enhanced SureCookie integration:

```
☑ SureCookie Integration Enabled
Endpoint: [http://localhost:5000/api/threats]
API Key: [optional-key]

Alert Severity Threshold:
○ Critical only
○ Critical + High
○ Critical + High + Medium
○ All threats

Test Connection [Button] → "✅ Connected"
```

---

## Database Schema

### **threatLogs Table**

```sql
CREATE TABLE threatLogs (
  id STRING PRIMARY KEY,
  timestamp NUMBER,
  ipAddress STRING,
  attackType STRING,
  blocked BOOLEAN,
  resumed BOOLEAN,
  reportedToISP BOOLEAN,
  url TEXT,
  ipLocation JSON,
  attackStructure JSON,
  indicators JSON,
  metadata JSON
);

-- Indices
INDEX: timestamp (DESC)
INDEX: ipAddress
INDEX: attackType
INDEX: blocked
INDEX: resumed
INDEX: reportedToISP
```

### **ispReports Table**

```sql
CREATE TABLE ispReports (
  id STRING PRIMARY KEY,
  timestamp NUMBER,
  threatLogId STRING,
  status STRING, -- 'pending', 'sent', 'failed'
  reportData JSON,
  response TEXT
);

-- Indices
INDEX: timestamp (DESC)
INDEX: threatLogId
INDEX: status
```

---

## API Integration Points

### **1. IP Geolocation API**

```
Service: ipapi.co
Endpoint: https://ipapi.co/{ip}/json/
Rate Limit: 1000 requests/day (free)
Auth: None required
Response:
{
  "ip": "1.2.3.4",
  "city": "San Francisco",
  "country_name": "United States",
  "country_code": "US",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "timezone": "America/Los_Angeles",
  "org": "Acme Corp",
  "asn": "AS1234"
}
```

### **2. ISP Report Backend API**

```
Endpoint: POST {endpoint}/api/isp-reports
Headers: Content-Type: application/json
Body:
{
  "report": {
    "sourceIP": "1.2.3.4",
    "attackType": "Phishing",
    "threatLevel": "HIGH",
    "evidence": ["URL: ...", "ISP: ...", ...],
    "timestamp": "2025-12-19T10:30:00Z"
  },
  "ispEmail": "abuse@isp.com",
  "timestamp": 1766203800000
}

Response:
{
  "success": true,
  "reportId": "report_123",
  "message": "Report queued for processing"
}
```

---

## Privacy & Security

### **Data Retention**

- **Threat Logs**: Configurable retention (default 30 days)
- **IP Location Data**: Cached for 24 hours, then forgotten
- **ISP Reports**: Permanently stored with status
- **User Settings**: Encrypted in chrome.storage.local

### **IP Address Handling**

- IPs extracted from malicious URLs only
- Geolocation cached locally to minimize API calls
- No IP data shared unless user explicitly reports
- Free tier API (ipapi.co) does not log usage

### **ISP Reporting**

- User must explicitly enable ISP reporting
- Email templates generated locally before sending
- Failed reports stored locally, not sent without permission
- Correlation IDs prevent duplicate reports

### **Content Security**

- All URLs sanitized in history viewer
- HTML escaping prevents XSS attacks
- CSP headers in manifest
- No external resources loaded from untrusted sources

---

## Performance Considerations

### **Optimization**

- ✅ IP geolocation cached for 24 hours
- ✅ Threat logs indexed by timestamp, IP, type
- ✅ Automatic cleanup of logs older than 30 days
- ✅ Failed ISP reports batched for hourly retry
- ✅ History viewer paginated (100 logs per load)

### **Resource Usage**

- **Memory**: ~5-10 MB for 500 threat logs
- **Storage**: ~1-2 MB for 30 days of logs (IndexedDB)
- **Network**: ~1 IP geolocation API call per threat (cached)
- **CPU**: Negligible for threat analysis

---

## Troubleshooting

### **Issue: IP Geolocation Not Working**

**Solution:**
- Check ipapi.co is accessible (not blocked by network)
- Verify you haven't exceeded 1000 requests/day
- Disable and re-enable in settings to clear cache

### **Issue: ISP Reports Not Sending**

**Solution:**
- Verify backend endpoint is running (`http://localhost:5000`)
- Check ISP email is correctly configured
- Look for failed reports in history (status = 'failed')
- Reports auto-retry every hour

### **Issue: Threat Logs Growing Too Large**

**Solution:**
- Reduce log retention period (Settings > General)
- Manually export/backup old logs with CSV
- Clear browser storage to reset IndexedDB

### **Issue: History Viewer Very Slow**

**Solution:**
- Apply filters to reduce displayed threats
- Use date range or severity filters
- Export and clean up very old logs
- Increase log retention period if needed

---

## Advanced Features

### **Email Template System**

For users unable to send reports via backend API:

```
To: abuse@isp.com
Subject: Security Incident Report - Malicious Activity from {IP}

INCIDENT DETAILS:
- Source IP: {IP}
- Attack Type: {TYPE}
- Threat Level: {SEVERITY}
- Timestamp: {TIME}

EVIDENCE:
1. Malicious URL: ...
2. Source IP: ...
3. Location: ...
4. ISP/Organization: ...
5. Suspicious Patterns: ...

...
```

User can copy template and send manually if needed.

### **Threat Correlation**

Link multiple threats from same IP:

```typescript
// Get all threats from attacker IP
const threats = await db.getThreatLogsByIP('1.2.3.4');
// Shows attack patterns, evolution, targets
```

### **Attack Pattern Analysis**

Visual indicators for:
- Single vs. distributed attacks
- Attack escalation over time
- Targeting patterns (same victim repeatedly)
- Obfuscation techniques used
- Malware families detected

---

## Example: Complete Threat Detection Flow

```
1. User visits: http://evil.com/malware.exe?cmd=download

2. Extension detects:
   - URL in URLhaus database
   - Severity: CRITICAL
   - Type: Malware Distribution
   
3. IP extracted:
   - 198.51.100.42
   
4. Geolocation lookup:
   - City: Beijing
   - Country: China
   - ISP: ChinaNet
   
5. Attack analysis:
   - Protocol: HTTP (no HTTPS)
   - Non-standard port: 8080
   - Suspicious parameter: cmd=
   - Payload size: 156 bytes
   - Obfuscation: Base64 in URL
   
6. Threat log created:
   {
     id: "threat_1766203800000_abc123"
     url: "http://evil.com/malware.exe?cmd=download"
     ipAddress: "198.51.100.42"
     ipLocation: { city: "Beijing", country: "China", ... }
     attackType: "Malware Distribution"
     blocked: true
     resumed: false
     indicators: [{ source: "URLhaus", severity: "critical", ... }]
     attackStructure: {
       protocol: "http"
       suspiciousPatterns: ["HTTP instead of HTTPS", "Suspicious parameter: cmd=", ...]
       obfuscationDetected: true
     }
   }
   
7. User action:
   - Block page shown
   - User decides not to resume
   - Threat remains blocked

8. Admin action:
   - Opens threat history
   - Sees threat from China IP
   - Clicks "Report to ISP"
   - Email template generated
   - Sent to ChinaNet abuse contact

9. Database records:
   - threatLogs[threat_id] = {...}
   - ispReports[report_id] = {
       status: "sent"
       reportData: { sourceIP: "198.51.100.42", ... }
     }
```

---

## Future Enhancements

- 🔴 **Machine Learning**: Attack pattern clustering
- 🔴 **Threat Intelligence Feeds**: Automatic ML model updates
- 🔴 **Visualization**: Attack heatmaps and timeline graphs
- 🔴 **Team Sharing**: Collaborative threat analysis
- 🔴 **Alert Webhooks**: Real-time incident webhooks
- 🔴 **STIX/TAXII**: Industry standard threat format export

---

## Support & Feedback

- **Report Issues**: Use "📋 Report False Positive" in block page
- **View History**: "📊 History" button in popup
- **Configure Settings**: "⚙️ Settings" in popup
- **Export Data**: CSV export from threat history viewer
