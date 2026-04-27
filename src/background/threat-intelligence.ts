import { ThreatIndicator, THREAT_FEEDS, ExtensionSettings } from '../types';
import { db } from './database';

export class ThreatIntelligence {
  private settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this.settings = settings;
  }

  async updateAllFeeds(): Promise<void> {
    console.log('🔄 Updating threat feeds...');
    
    const updatePromises = THREAT_FEEDS
      .filter(feed => this.settings.enabledFeeds.includes(feed.name))
      .map(feed => this.updateFeed(feed.name, feed.url, feed.requiresApiKey));

    await Promise.allSettled(updatePromises);
    
    // Clean up indicators older than 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    await db.clearOldIndicators(sevenDaysAgo);
    
    console.log('✅ Threat feeds updated');
  }

  private async updateFeed(name: string, url: string, requiresApiKey: boolean): Promise<void> {
    try {
      if (requiresApiKey && !this.hasApiKey(name)) {
        console.warn(`⚠️ ${name} requires API key`);
        return;
      }

      let indicators: ThreatIndicator[] = [];

      switch (name) {
        case 'URLhaus':
          indicators = await this.fetchURLhaus(url);
          break;
        case 'PhishTank':
          indicators = await this.fetchPhishTank(url);
          break;
        case 'VirusTotal':
          indicators = await this.fetchVirusTotal(url);
          break;
        case 'AbuseIPDB':
          indicators = await this.fetchAbuseIPDB(url);
          break;
      }

      if (indicators.length > 0) {
        await db.addIndicators(indicators);
        console.log(`✅ ${name}: Added ${indicators.length} indicators`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${name}:`, error);
    }
  }

  private async fetchURLhaus(url: string): Promise<ThreatIndicator[]> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) throw new Error(`URLhaus API error: ${response.status}`);

    const data = await response.json();
    
    return (data.urls || []).map((item: any) => ({
      value: item.url,
      type: 'url' as const,
      source: 'URLhaus',
      severity: this.mapThreatLevel(item.threat),
      lastSeen: Date.now(),
      description: item.tags?.join(', '),
      tags: item.tags
    }));
  }

  private async fetchPhishTank(url: string): Promise<ThreatIndicator[]> {
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`PhishTank API error: ${response.status}`);

    const data = await response.json();
    
    return data.slice(0, 5000).map((item: any) => ({
      value: item.url,
      type: 'url' as const,
      source: 'PhishTank',
      severity: item.verified === 'yes' ? 'high' : 'medium',
      lastSeen: Date.now(),
      description: `Phishing: ${item.target || 'Unknown target'}`,
      tags: ['phishing']
    }));
  }

  private async fetchVirusTotal(baseUrl: string): Promise<ThreatIndicator[]> {
    const apiKey = this.settings.apiKeys.virusTotal;
    if (!apiKey) return [];

    // VirusTotal implementation would require specific endpoint calls
    return [];
  }

  private async fetchAbuseIPDB(baseUrl: string): Promise<ThreatIndicator[]> {
    const apiKey = this.settings.apiKeys.abuseIPDB;
    if (!apiKey) return [];

    const response = await fetch(`${baseUrl}blacklist`, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`AbuseIPDB API error: ${response.status}`);

    const data = await response.json();
    
    return (data.data || []).map((item: any) => ({
      value: item.ipAddress,
      type: 'ip' as const,
      source: 'AbuseIPDB',
      severity: item.abuseConfidenceScore > 75 ? 'high' : 'medium',
      lastSeen: Date.now(),
      description: `Abuse confidence: ${item.abuseConfidenceScore}%`,
      tags: ['malicious-ip']
    }));
  }

  private hasApiKey(feedName: string): boolean {
    return !!(this.settings.apiKeys as any)[feedName.toLowerCase().replace(/\s+/g, '')];
  }

  private mapThreatLevel(threat: string): 'low' | 'medium' | 'high' | 'critical' {
    const level = threat?.toLowerCase() || '';
    if (level.includes('malware') || level.includes('ransomware')) return 'critical';
    if (level.includes('phishing')) return 'high';
    return 'medium';
  }

  async checkUrl(url: string): Promise<ThreatIndicator | undefined> {
    try {
      // Check full URL
      const urlIndicator = await db.checkThreat(url);
      if (urlIndicator) return urlIndicator;

      // Extract and check domain
      const domain = new URL(url).hostname;
      const domainIndicator = await db.checkThreat(domain);
      if (domainIndicator) return domainIndicator;

      // Check against whitelist
      if (this.settings.whitelistedDomains.some(d => domain.includes(d))) {
        return undefined;
      }

      return undefined;
    } catch (error) {
      console.error('Error checking URL:', error);
      return undefined;
    }
  }
}
