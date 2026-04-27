import { ThreatIndicator } from '../types';
export interface ThreatAlert {
    url: string;
    threat: ThreatIndicator;
    timestamp: number;
    tabId: number;
    logId?: string;
    ipLocation?: any;
    attackType?: string;
}
export interface SureCookieAlert {
    eventType: 'threat_detected' | 'threat_blocked' | 'feed_updated';
    severity: string;
    source: string;
    url: string;
    details: {
        threatType: string;
        threatIndicator: string;
        threatTags: string[];
        description?: string;
        timestamp: number;
    };
    metadata: {
        extensionVersion: string;
        timestamp: number;
        correlationId: string;
    };
}
export declare class SureCookieIntegration {
    private surecookieEndpoint;
    private apiKey;
    private correlationCounter;
    constructor();
    private loadConfig;
    alertThreat(alert: ThreatAlert): Promise<void>;
    private buildAlert;
    private generateCorrelationId;
    private storeFailedAlert;
    retryFailedAlerts(): Promise<void>;
    updateSureCookieConfig(endpoint: string, apiKey?: string): Promise<void>;
    getSureCookieConfig(): Promise<{
        endpoint: string;
        apiKey: string | null;
    }>;
}
