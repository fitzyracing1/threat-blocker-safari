import { ThreatIndicator, ExtensionSettings } from '../types';
export declare class ThreatIntelligence {
    private settings;
    constructor(settings: ExtensionSettings);
    updateAllFeeds(): Promise<void>;
    private updateFeed;
    private fetchURLhaus;
    private fetchPhishTank;
    private fetchVirusTotal;
    private fetchAbuseIPDB;
    private hasApiKey;
    private mapThreatLevel;
    checkUrl(url: string): Promise<ThreatIndicator | undefined>;
}
