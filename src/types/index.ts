// Type definitions for Threat Blocker Safari Extension

export interface ThreatIndicator {
  value: string;
  type: 'url' | 'domain' | 'ip' | 'hash';
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastSeen: number;
  description?: string;
  tags?: string[];
}

export interface ThreatCheck {
  url: string;
  domain: string;
  ip?: string;
  timestamp: number;
  isThreat: boolean;
  indicators?: ThreatIndicator[];
}

export interface BlockedRequest {
  url: string;
  timestamp: number;
  indicators: ThreatIndicator[];
  tabId: number;
}

  // Enhanced threat log with detailed attack information
  export interface ThreatLog {
    id: string;
    url: string;
    timestamp: number;
    ipAddress?: string;
    ipLocation?: IPLocation;
    attackType: string;
    attackStructure?: AttackStructure;
    indicators: ThreatIndicator[];
    metadata?: ThreatMetadata;
    userAgent?: string;
    referrer?: string;
    blocked: boolean;
    resumed: boolean;
    reportedToISP: boolean;
    tabId: number;
  }

  export interface IPLocation {
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

  export interface AttackStructure {
    method: string; // GET, POST, etc.
    protocol: string; // http, https
    hasRedirects: boolean;
    redirectChain?: string[];
    suspiciousPatterns: string[];
    encodingSchemes?: string[];
    obfuscationDetected: boolean;
    payloadSize?: number;
  }

  export interface ThreatMetadata {
    domainAge?: number;
    sslCertValid?: boolean;
    sslIssuer?: string;
    whoisData?: string;
    httpHeaders?: Record<string, string>;
    dnsRecords?: string[];
    malwareFamily?: string;
    campaignId?: string;
    firstSeenGlobal?: number;
    reportCount?: number;
  }

  export interface ISPReport {
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

export interface ThreatStats {
  totalBlocked: number;
  blockedToday: number;
  lastUpdate: number;
  indicatorCount: number;
  bySource: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface ExtensionSettings {
  enabledFeeds: string[];
  updateInterval: number; // minutes
  blockingEnabled: boolean;
  whitelistedDomains: string[];
  notificationsEnabled: boolean;
    enableISPReporting: boolean;
    ispReportEmail?: string;
    enableGeolocation: boolean;
    logRetentionDays: number;
  apiKeys: {
    virusTotal?: string;
    abuseIPDB?: string;
  };
}

export interface ThreatFeed {
  name: string;
  url: string;
  enabled: boolean;
  requiresApiKey: boolean;
  lastUpdate?: number;
  indicatorCount?: number;
}

export const THREAT_FEEDS: ThreatFeed[] = [
  {
    name: 'URLhaus',
    url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
    enabled: true,
    requiresApiKey: false
  },
  {
    name: 'PhishTank',
    url: 'https://data.phishtank.com/data/online-valid.json',
    enabled: true,
    requiresApiKey: false
  },
  {
    name: 'VirusTotal',
    url: 'https://www.virustotal.com/api/v3/',
    enabled: false,
    requiresApiKey: true
  },
  {
    name: 'AbuseIPDB',
    url: 'https://api.abuseipdb.com/api/v2/',
    enabled: false,
    requiresApiKey: true
  }
];

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabledFeeds: ['URLhaus', 'PhishTank'],
  updateInterval: 60,
  blockingEnabled: true,
  whitelistedDomains: [],
  notificationsEnabled: true,
    enableISPReporting: false,
    enableGeolocation: true,
    logRetentionDays: 30,
  apiKeys: {}
};
