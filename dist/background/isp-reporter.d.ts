import { ThreatLog } from '../types';
export declare class ISPReporter {
    private settings;
    constructor();
    private loadSettings;
    /**
     * Generate ISP report from threat log
     */
    reportToISP(threatLog: ThreatLog): Promise<boolean>;
    /**
     * Send report via email or API
     */
    private sendReport;
    /**
     * Generate email template for manual ISP reporting
     */
    private generateEmailTemplate;
    /**
     * Detect ISP email from WHOIS or IP location
     */
    private detectISPEmail;
    /**
     * Calculate overall threat level
     */
    private calculateThreatLevel;
    /**
     * Collect evidence from threat log
     */
    private collectEvidence;
    /**
     * Retry failed ISP reports
     */
    retryFailedReports(): Promise<void>;
    /**
     * Get email templates for manual sending
     */
    getEmailTemplates(): Promise<any[]>;
}
