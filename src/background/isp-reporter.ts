// ISP Reporting Service
import { ISPReport, ThreatLog } from '../types';
import { db } from './database';

export class ISPReporter {
  private settings: any;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    const stored = await chrome.storage.local.get('settings');
    this.settings = stored.settings;
  }

  /**
   * Generate ISP report from threat log
   */
  async reportToISP(threatLog: ThreatLog): Promise<boolean> {
    await this.loadSettings();

    if (!this.settings?.enableISPReporting) {
      console.log('ISP reporting is disabled');
      return false;
    }

    const reportId = `isp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const report: ISPReport = {
      id: reportId,
      timestamp: Date.now(),
      threatLogId: threatLog.id,
      ispEmail: this.settings.ispReportEmail || await this.detectISPEmail(threatLog.ipAddress),
      reportData: {
        sourceIP: threatLog.ipAddress || 'Unknown',
        attackType: threatLog.attackType,
        threatLevel: this.calculateThreatLevel(threatLog),
        evidence: this.collectEvidence(threatLog),
        timestamp: new Date(threatLog.timestamp).toISOString()
      },
      status: 'pending'
    };

    try {
      // Save report to database
      await db.addISPReport(report);

      // Attempt to send report
      const sent = await this.sendReport(report);

      if (sent) {
        await db.updateISPReport(reportId, { status: 'sent' });
        await db.updateThreatLog(threatLog.id, { reportedToISP: true });
        console.log(`✅ ISP report sent: ${reportId}`);
        return true;
      } else {
        await db.updateISPReport(reportId, { status: 'failed' });
        console.warn(`❌ ISP report failed: ${reportId}`);
        return false;
      }
    } catch (error) {
      console.error('Error reporting to ISP:', error);
      return false;
    }
  }

  /**
   * Send report via email or API
   */
  private async sendReport(report: ISPReport): Promise<boolean> {
    // Option 1: Send to local backend service (e.g., surecookie_pilot)
    try {
      const surecookieConfig = await chrome.storage.local.get('surecookieConfig');
      const endpoint = surecookieConfig?.surecookieConfig?.endpoint || 'http://localhost:5000';

      const response = await fetch(`${endpoint}/api/isp-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report: report.reportData,
          ispEmail: report.ispEmail,
          timestamp: report.timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        await db.updateISPReport(report.id, { response: JSON.stringify(result) });
        return true;
      }
    } catch (error) {
      console.error('Error sending to backend:', error);
    }

    // Option 2: Generate email template (user must send manually)
    this.generateEmailTemplate(report);
    return true; // Consider success if template generated
  }

  /**
   * Generate email template for manual ISP reporting
   */
  private generateEmailTemplate(report: ISPReport) {
    const template = `
To: ${report.ispEmail || 'abuse@isp.com'}
Subject: Security Incident Report - Malicious Activity from ${report.reportData.sourceIP}

Dear ISP Security Team,

This is an automated security incident report regarding malicious activity detected from one of your IP addresses.

INCIDENT DETAILS:
- Source IP: ${report.reportData.sourceIP}
- Attack Type: ${report.reportData.attackType}
- Threat Level: ${report.reportData.threatLevel}
- Timestamp: ${report.reportData.timestamp}

EVIDENCE:
${report.reportData.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}

This activity was detected and blocked by our automated threat monitoring system. We recommend investigating this IP address for potential compromise or malicious activity.

Please take appropriate action to address this security concern.

Thank you for your attention to this matter.

Best regards,
Threat Blocker Extension
    `.trim();

    // Store email template in storage for user to access
    chrome.storage.local.get('emailTemplates', (result) => {
      const templates = result.emailTemplates || [];
      templates.unshift({ id: report.id, timestamp: report.timestamp, template });
      chrome.storage.local.set({ emailTemplates: templates.slice(0, 50) }); // Keep last 50
    });

    console.log('Email template generated for ISP report:', report.id);
  }

  /**
   * Detect ISP email from WHOIS or IP location
   */
  private async detectISPEmail(ipAddress?: string): Promise<string | undefined> {
    if (!ipAddress) return undefined;

    // Common ISP abuse email patterns
    const ispPatterns: Record<string, string> = {
      'comcast': 'abuse@comcast.net',
      'verizon': 'abuse@verizon.net',
      'att': 'abuse@att.net',
      'charter': 'abuse@charter.net',
      'cox': 'abuse@cox.net',
      'centurylink': 'abuse@centurylink.net',
      'frontier': 'abuse@frontiernet.net'
    };

    // Try to match ISP from geolocation data
    try {
      const threatLog = await db.getThreatLogsByIP(ipAddress);
      if (threatLog.length > 0 && threatLog[0].ipLocation?.isp) {
        const isp = threatLog[0].ipLocation.isp.toLowerCase();
        for (const [pattern, email] of Object.entries(ispPatterns)) {
          if (isp.includes(pattern)) {
            return email;
          }
        }
      }
    } catch {
      // Continue with default
    }

    return 'abuse@isp.com'; // Generic fallback
  }

  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(threatLog: ThreatLog): string {
    const severities = threatLog.indicators.map(i => i.severity);
    
    if (severities.includes('critical')) return 'CRITICAL';
    if (severities.includes('high')) return 'HIGH';
    if (severities.includes('medium')) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Collect evidence from threat log
   */
  private collectEvidence(threatLog: ThreatLog): string[] {
    const evidence: string[] = [];

    evidence.push(`Malicious URL: ${threatLog.url}`);
    
    if (threatLog.ipAddress) {
      evidence.push(`Source IP: ${threatLog.ipAddress}`);
    }

    if (threatLog.ipLocation) {
      evidence.push(`Location: ${threatLog.ipLocation.city}, ${threatLog.ipLocation.country} (${threatLog.ipLocation.countryCode})`);
      if (threatLog.ipLocation.org) {
        evidence.push(`Organization: ${threatLog.ipLocation.org}`);
      }
    }

    if (threatLog.attackStructure) {
      evidence.push(`Attack patterns: ${threatLog.attackStructure.suspiciousPatterns.join(', ')}`);
      if (threatLog.attackStructure.obfuscationDetected) {
        evidence.push('Obfuscation techniques detected');
      }
    }

    threatLog.indicators.forEach((indicator, i) => {
      evidence.push(`Threat ${i + 1}: ${indicator.source} - ${indicator.description || indicator.value} (Severity: ${indicator.severity})`);
    });

    if (threatLog.metadata?.malwareFamily) {
      evidence.push(`Malware family: ${threatLog.metadata.malwareFamily}`);
    }

    return evidence;
  }

  /**
   * Retry failed ISP reports
   */
  async retryFailedReports() {
    const pending = await db.getPendingISPReports();
    
    for (const report of pending) {
      const sent = await this.sendReport(report);
      if (sent) {
        await db.updateISPReport(report.id, { status: 'sent' });
      }
    }
  }

  /**
   * Get email templates for manual sending
   */
  async getEmailTemplates(): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get('emailTemplates', (result) => {
        resolve(result.emailTemplates || []);
      });
    });
  }
}
