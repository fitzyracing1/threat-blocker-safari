// Attack Structure Analyzer
import { AttackStructure, ThreatMetadata } from '../types';

export class AttackAnalyzer {
  /**
   * Analyze URL structure for attack patterns
   */
  analyzeAttackStructure(url: string, headers?: Record<string, string>): AttackStructure {
    const urlObj = new URL(url);
    const suspiciousPatterns: string[] = [];
    const encodingSchemes: string[] = [];
    let obfuscationDetected = false;

    // Detect suspicious patterns
    if (this.hasBase64Encoding(url)) {
      suspiciousPatterns.push('Base64 encoding detected');
      encodingSchemes.push('base64');
      obfuscationDetected = true;
    }

    if (this.hasURLEncoding(url)) {
      suspiciousPatterns.push('Multiple URL encoding layers');
      encodingSchemes.push('url-encoding');
    }

    if (this.hasIPAddress(url)) {
      suspiciousPatterns.push('IP address instead of domain');
    }

    if (this.hasSuspiciousPort(url)) {
      suspiciousPatterns.push('Non-standard port detected');
    }

    if (this.hasLongURL(url)) {
      suspiciousPatterns.push('Unusually long URL (possible data exfiltration)');
    }

    if (this.hasSuspiciousParameters(url)) {
      suspiciousPatterns.push('Suspicious query parameters');
      obfuscationDetected = true;
    }

    if (this.hasHomoglyphAttack(url)) {
      suspiciousPatterns.push('Homoglyph/IDN attack detected');
      obfuscationDetected = true;
    }

    if (this.hasJavaScriptScheme(url)) {
      suspiciousPatterns.push('JavaScript protocol detected');
    }

    const structure: AttackStructure = {
      method: 'GET', // Default, can be enhanced with actual request data
      protocol: urlObj.protocol.replace(':', ''),
      hasRedirects: false, // Will be updated if redirect chain is detected
      suspiciousPatterns,
      encodingSchemes: encodingSchemes.length > 0 ? encodingSchemes : undefined,
      obfuscationDetected,
      payloadSize: url.length
    };

    return structure;
  }

  /**
   * Extract metadata from threat
   */
  async extractThreatMetadata(url: string): Promise<ThreatMetadata> {
    const metadata: ThreatMetadata = {};

    try {
      const urlObj = new URL(url);
      
      // Try to get HTTP headers (if accessible)
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000)
        });
        
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        
        metadata.httpHeaders = headers;
        metadata.sslCertValid = url.startsWith('https://');
      } catch {
        // Headers not accessible
      }

      // Detect malware families based on patterns
      const malwarePatterns = this.detectMalwareFamily(url);
      if (malwarePatterns) {
        metadata.malwareFamily = malwarePatterns;
      }

    } catch (error) {
      console.error('Error extracting metadata:', error);
    }

    return metadata;
  }

  /**
   * Classify attack type based on indicators
   */
  classifyAttackType(url: string, indicators: any[]): string {
    const urlLower = url.toLowerCase();

    // Check indicators for specific attack types
    const types: string[] = [];

    for (const indicator of indicators) {
      if (indicator.tags) {
        if (indicator.tags.includes('phishing')) types.push('Phishing');
        if (indicator.tags.includes('malware')) types.push('Malware Distribution');
        if (indicator.tags.includes('ransomware')) types.push('Ransomware');
        if (indicator.tags.includes('c2') || indicator.tags.includes('c&c')) types.push('Command & Control');
        if (indicator.tags.includes('exploit')) types.push('Exploit Kit');
      }

      if (indicator.description) {
        const desc = indicator.description.toLowerCase();
        if (desc.includes('trojan')) types.push('Trojan');
        if (desc.includes('botnet')) types.push('Botnet');
        if (desc.includes('cryptominer')) types.push('Cryptomining');
        if (desc.includes('ddos')) types.push('DDoS Infrastructure');
      }
    }

    // URL-based detection
    if (urlLower.includes('login') || urlLower.includes('signin') || urlLower.includes('account')) {
      types.push('Credential Phishing');
    }

    if (urlLower.includes('.exe') || urlLower.includes('.dll') || urlLower.includes('.scr')) {
      types.push('Malicious Binary Download');
    }

    if (urlLower.includes('paypal') || urlLower.includes('bank') || urlLower.includes('invoice')) {
      types.push('Financial Phishing');
    }

    // Return unique types
    return types.length > 0 ? [...new Set(types)].join(', ') : 'Unknown Threat';
  }

  // Helper methods for pattern detection

  private hasBase64Encoding(url: string): boolean {
    const base64Pattern = /[A-Za-z0-9+\/]{20,}={0,2}/;
    return base64Pattern.test(url);
  }

  private hasURLEncoding(url: string): boolean {
    const encodingCount = (url.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    return encodingCount > 5; // Multiple encoded characters
  }

  private hasIPAddress(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipPattern.test(urlObj.hostname);
    } catch {
      return false;
    }
  }

  private hasSuspiciousPort(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const port = parseInt(urlObj.port);
      const suspiciousPorts = [8080, 8888, 4444, 5555, 6666, 7777, 3389, 1337];
      return suspiciousPorts.includes(port);
    } catch {
      return false;
    }
  }

  private hasLongURL(url: string): boolean {
    return url.length > 200;
  }

  private hasSuspiciousParameters(url: string): boolean {
    const suspiciousParams = ['cmd', 'exec', 'command', 'shell', 'eval', 'system', 'passthru'];
    return suspiciousParams.some(param => url.toLowerCase().includes(param + '='));
  }

  private hasHomoglyphAttack(url: string): boolean {
    // Check for Unicode homoglyphs (e.g., paypal with Cyrillic 'a')
    const homoglyphPattern = /[\u0430-\u044f\u0410-\u042f]/; // Cyrillic
    return homoglyphPattern.test(url);
  }

  private hasJavaScriptScheme(url: string): boolean {
    return url.toLowerCase().startsWith('javascript:');
  }

  private detectMalwareFamily(url: string): string | undefined {
    const urlLower = url.toLowerCase();
    
    const families = [
      { pattern: /emotet/i, name: 'Emotet' },
      { pattern: /trickbot/i, name: 'TrickBot' },
      { pattern: /ryuk/i, name: 'Ryuk' },
      { pattern: /wannacry/i, name: 'WannaCry' },
      { pattern: /zeus/i, name: 'Zeus' },
      { pattern: /dridex/i, name: 'Dridex' },
      { pattern: /locky/i, name: 'Locky' },
      { pattern: /cerber/i, name: 'Cerber' }
    ];

    for (const family of families) {
      if (family.pattern.test(urlLower)) {
        return family.name;
      }
    }

    return undefined;
  }
}
