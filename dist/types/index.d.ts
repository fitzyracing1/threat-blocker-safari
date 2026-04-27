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
    method: string;
    protocol: string;
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
    updateInterval: number;
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
export declare const THREAT_FEEDS: ThreatFeed[];
export declare const DEFAULT_SETTINGS: ExtensionSettings;
