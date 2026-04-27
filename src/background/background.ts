import { ExtensionSettings, DEFAULT_SETTINGS, ThreatStats, BlockedRequest } from '../types';
import { ThreatLog } from '../types';
import { db } from './database';
import { ThreatIntelligence } from './threat-intelligence';
import { SureCookieIntegration } from './surecookie-integration';
import { GeolocationService } from './geolocation';
import { AttackAnalyzer } from './attack-analyzer';
import { ISPReporter } from './isp-reporter';

let threatIntel: ThreatIntelligence;
let surecookieIntegration: SureCookieIntegration;
let geolocationService: GeolocationService;
let attackAnalyzer: AttackAnalyzer;
let ispReporter: ISPReporter;
let settings: ExtensionSettings = DEFAULT_SETTINGS;

// Initialize extension
async function initialize() {
  console.log('🛡️ Threat Blocker initializing...');

  // Load settings
  const stored = await chrome.storage.local.get('settings');
  settings = stored.settings || DEFAULT_SETTINGS;

  // Initialize threat intelligence
  threatIntel = new ThreatIntelligence(settings);

  // Initialize surecookie integration
  surecookieIntegration = new SureCookieIntegration();

  // Initialize new services
  geolocationService = new GeolocationService();
  attackAnalyzer = new AttackAnalyzer();
  ispReporter = new ISPReporter();

  // Initial threat feed update
  await threatIntel.updateAllFeeds();

  // Set up periodic updates
  chrome.alarms.create('updateFeeds', { periodInMinutes: settings.updateInterval });
  chrome.alarms.create('cleanupLogs', { periodInMinutes: 1440 }); // Daily cleanup
  chrome.alarms.create('retryISPReports', { periodInMinutes: 60 }); // Hourly retry

  console.log('✅ Threat Blocker ready');
}

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateFeeds') {
    await threatIntel.updateAllFeeds();
  }
  if (alarm.name === 'cleanupLogs') {
    await db.clearOldThreatLogs(settings.logRetentionDays || 30);
    await db.clearOldIndicators(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  if (alarm.name === 'retryISPReports') {
    await ispReporter.retryFailedReports();
  }
});

// Handle web requests (non-async callback as per Chrome API)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!settings.blockingEnabled) return {};

    // Process threat check asynchronously in background
    (async () => {
      const threat = await threatIntel.checkUrl(details.url);

      if (threat) {
        console.log('🚫 Blocked threat:', details.url);

        // Generate unique log ID
        const logId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Extract IP address from URL
        const ipAddress = geolocationService.extractIPFromURL(details.url);

        // Get IP geolocation if enabled
        let ipLocation;
        if (settings.enableGeolocation && ipAddress) {
          ipLocation = await geolocationService.getIPLocation(ipAddress);
        }

        // Analyze attack structure
        const attackStructure = attackAnalyzer.analyzeAttackStructure(details.url);
        const attackType = attackAnalyzer.classifyAttackType(details.url, [threat]);

        // Extract metadata
        const metadata = await attackAnalyzer.extractThreatMetadata(details.url);

        // Create detailed threat log
        const threatLog: ThreatLog = {
          id: logId,
          url: details.url,
          timestamp: Date.now(),
          ipAddress,
          ipLocation,
          attackType,
          attackStructure,
          indicators: [threat],
          metadata,
          userAgent: navigator.userAgent,
          blocked: true,
          resumed: false,
          reportedToISP: false,
          tabId: details.tabId
        };

        // Save to database
        await db.addThreatLog(threatLog);

        // Record blocked request
        const blockedRequest: BlockedRequest = {
          url: details.url,
          timestamp: Date.now(),
          indicators: [threat],
          tabId: details.tabId
        };
        await db.addBlockedRequest(blockedRequest);

        // Send alert to surecookie_pilot
        await surecookieIntegration.alertThreat({
          url: details.url,
          threat: threat,
          timestamp: Date.now(),
          tabId: details.tabId,
          logId: logId,
          ipLocation: ipLocation,
          attackType: attackType
        });

        // Report to ISP if enabled
        if (settings.enableISPReporting) {
          await ispReporter.reportToISP(threatLog);
        }

        // Show notification if enabled
        if (settings.notificationsEnabled) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'Threat Blocked',
            message: `Blocked ${threat.type}: ${details.url}`,
            priority: 2
          });
        }

        // Redirect to block page in tab
        const blockUrl = chrome.runtime.getURL('blocked.html') + 
          `?url=${encodeURIComponent(details.url)}` +
          `&threat=${encodeURIComponent(JSON.stringify(threat))}`;
          `&logId=${logId}`;

        chrome.tabs.update(details.tabId, { url: blockUrl });
      }
    })();

    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'getStats':
        const stats = await getStats();
        sendResponse(stats);
        break;

      case 'getSettings':
        sendResponse(settings);
        break;

      case 'updateSettings':
        settings = message.settings;
        await chrome.storage.local.set({ settings });
        threatIntel = new ThreatIntelligence(settings);
        sendResponse({ success: true });
        break;

      case 'manualUpdate':
        await threatIntel.updateAllFeeds();
        sendResponse({ success: true });
        break;

      case 'checkUrl':
        const threat = await threatIntel.checkUrl(message.url);
        sendResponse({ isThreat: !!threat, threat });
        break;

      case 'addToWhitelist':
        settings.whitelistedDomains.push(message.domain);
        await chrome.storage.local.set({ settings });
        sendResponse({ success: true });
        break;

      case 'getThreatLogs':
        const logs = await db.getThreatLogs(message.limit || 100);
        sendResponse({ logs });
        break;

      case 'getThreatLog':
        const log = await db.getThreatLogById(message.id);
        sendResponse({ log });
        break;

      case 'resumeFromThreat':
        // Mark threat as resumed (user chose to continue)
        await db.updateThreatLog(message.logId, { resumed: true, blocked: false });
        sendResponse({ success: true });
        break;

      case 'reportToISP':
        const threatLog = await db.getThreatLogById(message.logId);
        if (threatLog) {
          const reported = await ispReporter.reportToISP(threatLog);
          sendResponse({ success: reported });
        } else {
          sendResponse({ success: false, error: 'Threat log not found' });
        }
        break;

      case 'getISPReports':
        const reports = await db.getISPReports(message.limit || 50);
        sendResponse({ reports });
        break;

      case 'getEmailTemplates':
        const templates = await ispReporter.getEmailTemplates();
        sendResponse({ templates });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();

  return true;
});

async function getStats(): Promise<ThreatStats> {
  const totalBlocked = await db.getTotalBlocked();
  const blockedToday = await db.getBlockedToday();
  const indicatorCount = await db.indicators.count();

  const allIndicators = await db.indicators.toArray();
  const bySource: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  allIndicators.forEach((indicator: any) => {
    bySource[indicator.source] = (bySource[indicator.source] || 0) + 1;
    bySeverity[indicator.severity] = (bySeverity[indicator.severity] || 0) + 1;
  });

  return {
    totalBlocked,
    blockedToday,
    lastUpdate: Date.now(),
    indicatorCount,
    bySource,
    bySeverity
  };
}

// Start the extension
initialize();
