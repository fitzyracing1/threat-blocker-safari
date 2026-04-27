interface PageAnalysis {
    threats: string[];
    safeLinks: string[];
    suspiciousElements: {
        iframes: string[];
        scripts: string[];
    };
}
declare class PageSecurityMonitor {
    private threats;
    private safeLinks;
    constructor();
    private setupObserver;
    private scanExistingLinks;
    private scanLinksInNode;
    private checkLinkSafety;
    private markLinkAsDangerous;
    getAnalysis(): PageAnalysis;
    private getSuspiciousIframes;
    private getSuspiciousScripts;
    private isDomainTrusted;
}
declare const monitor: PageSecurityMonitor;
