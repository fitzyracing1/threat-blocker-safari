interface ThreatData {
    value: string;
    type: string;
    source: string;
    severity: string;
    description?: string;
    tags?: string[];
}
declare let logId: string | undefined;
declare function getUrlParams(): {
    url?: string;
    threat?: ThreatData;
    logId?: string;
};
declare function displayThreatInfo(): void;
declare function getSeverityColor(severity: string): string;
