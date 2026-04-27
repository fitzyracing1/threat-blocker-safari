import { AttackStructure, ThreatMetadata } from '../types';
export declare class AttackAnalyzer {
    /**
     * Analyze URL structure for attack patterns
     */
    analyzeAttackStructure(url: string, headers?: Record<string, string>): AttackStructure;
    /**
     * Extract metadata from threat
     */
    extractThreatMetadata(url: string): Promise<ThreatMetadata>;
    /**
     * Classify attack type based on indicators
     */
    classifyAttackType(url: string, indicators: any[]): string;
    private hasBase64Encoding;
    private hasURLEncoding;
    private hasIPAddress;
    private hasSuspiciousPort;
    private hasLongURL;
    private hasSuspiciousParameters;
    private hasHomoglyphAttack;
    private hasJavaScriptScheme;
    private detectMalwareFamily;
}
