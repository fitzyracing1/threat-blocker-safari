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

export class SureCookieIntegration {
  private surecookieEndpoint = 'http://localhost:5000/api/threats'; // Configurable
  private apiKey: string | null = null;
  private correlationCounter = 0;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    const stored = await chrome.storage.local.get('surecookieConfig');
    if (stored.surecookieConfig) {
      this.surecookieEndpoint = stored.surecookieConfig.endpoint || this.surecookieEndpoint;
      this.apiKey = stored.surecookieConfig.apiKey || null;
    }
  }

  async alertThreat(alert: ThreatAlert): Promise<void> {
    try {
      const surecookieAlert = this.buildAlert(alert);
      
      console.log('📤 Sending threat alert to surecookie_pilot:', surecookieAlert);

      const response = await fetch(this.surecookieEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(surecookieAlert)
      });

      if (!response.ok) {
        console.error(`⚠️ surecookie_pilot API error: ${response.status}`);
        // Store locally for retry if needed
        await this.storeFailedAlert(surecookieAlert);
        return;
      }

      const result = await response.json();
      console.log('✅ Threat alert sent successfully:', result);

    } catch (error) {
      console.error('❌ Error sending threat alert:', error);
      // Store locally for retry
      await this.storeFailedAlert(this.buildAlert(alert));
    }
  }

  private buildAlert(alert: ThreatAlert): SureCookieAlert {
    return {
      eventType: 'threat_blocked',
      severity: alert.threat.severity.toUpperCase(),
      source: alert.threat.source,
      url: alert.url,
      details: {
        threatType: alert.threat.type,
        threatIndicator: alert.threat.value,
        threatTags: alert.threat.tags || [],
        description: alert.threat.description,
        timestamp: alert.timestamp
      },
      metadata: {
        extensionVersion: '1.0.0',
        timestamp: Date.now(),
        correlationId: this.generateCorrelationId()
      }
    };
  }

  private generateCorrelationId(): string {
    this.correlationCounter++;
    return `threat-blocker-${Date.now()}-${this.correlationCounter}`;
  }

  private async storeFailedAlert(alert: SureCookieAlert): Promise<void> {
    const stored = await chrome.storage.local.get('failedAlerts');
    const failedAlerts = stored.failedAlerts || [];
    
    failedAlerts.push({
      alert,
      retryCount: 0,
      lastRetry: Date.now()
    });

    await chrome.storage.local.set({ failedAlerts });
  }

  async retryFailedAlerts(): Promise<void> {
    const stored = await chrome.storage.local.get('failedAlerts');
    const failedAlerts = stored.failedAlerts || [];

    const remaining: any[] = [];

    for (const item of failedAlerts) {
      if (item.retryCount >= 3) {
        console.warn('⚠️ Max retries exceeded for alert:', item.alert.metadata.correlationId);
        continue;
      }

      try {
        const response = await fetch(this.surecookieEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          body: JSON.stringify(item.alert)
        });

        if (response.ok) {
          console.log('✅ Retry successful for:', item.alert.metadata.correlationId);
        } else {
          item.retryCount++;
          item.lastRetry = Date.now();
          remaining.push(item);
        }
      } catch (error) {
        console.error('❌ Retry failed:', error);
        item.retryCount++;
        item.lastRetry = Date.now();
        remaining.push(item);
      }
    }

    await chrome.storage.local.set({ failedAlerts: remaining });
  }

  async updateSureCookieConfig(endpoint: string, apiKey?: string): Promise<void> {
    this.surecookieEndpoint = endpoint;
    if (apiKey) {
      this.apiKey = apiKey;
    }

    await chrome.storage.local.set({
      surecookieConfig: {
        endpoint,
        apiKey: this.apiKey
      }
    });

    console.log('✅ surecookie_pilot configuration updated');
  }

  async getSureCookieConfig(): Promise<{ endpoint: string; apiKey: string | null }> {
    return {
      endpoint: this.surecookieEndpoint,
      apiKey: this.apiKey
    };
  }
}
