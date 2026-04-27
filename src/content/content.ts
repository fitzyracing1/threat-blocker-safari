// Content script for monitoring and blocking malicious content in web pages

interface PageAnalysis {
  threats: string[];
  safeLinks: string[];
  suspiciousElements: {
    iframes: string[];
    scripts: string[];
  };
}

class PageSecurityMonitor {
  private threats: string[] = [];
  private safeLinks: string[] = [];

  constructor() {
    this.setupObserver();
    this.scanExistingLinks();
  }

  private setupObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Scan newly added links
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanLinksInNode(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private scanExistingLinks(): void {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const url = (link as HTMLAnchorElement).href;
      if (url) {
        this.checkLinkSafety(url, link as HTMLAnchorElement);
      }
    });
  }

  private scanLinksInNode(node: Element): void {
    const links = node.querySelectorAll('a[href]');
    links.forEach(link => {
      const url = (link as HTMLAnchorElement).href;
      if (url) {
        this.checkLinkSafety(url, link as HTMLAnchorElement);
      }
    });
  }

  private checkLinkSafety(url: string, linkElement: HTMLAnchorElement): void {
    // Send message to background script to check URL
    chrome.runtime.sendMessage(
      { type: 'checkUrl', url },
      (response) => {
        if (response.isThreat) {
          this.threats.push(url);
          this.markLinkAsDangerous(linkElement, response.threat);
        } else {
          this.safeLinks.push(url);
        }
      }
    );
  }

  private markLinkAsDangerous(linkElement: HTMLAnchorElement, threat: any): void {
    // Add visual warning
    linkElement.style.borderBottom = '2px solid #ff4444';
    linkElement.title = `⚠️ Threat detected: ${threat.type.toUpperCase()}\n${threat.description}`;

    // Add warning icon
    const warning = document.createElement('span');
    warning.innerHTML = ' ⚠️';
    warning.style.color = '#ff4444';
    warning.style.marginLeft = '2px';
    warning.style.fontWeight = 'bold';
    linkElement.appendChild(warning);

    // Prevent navigation on click
    linkElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Show warning dialog
      alert(`⛔ This link is blocked for security reasons:\n\n${threat.description}\n\nThreat Type: ${threat.type}\nSeverity: ${threat.severity}`);
      
      return false;
    }, true);
  }

  public getAnalysis(): PageAnalysis {
    return {
      threats: this.threats,
      safeLinks: this.safeLinks,
      suspiciousElements: {
        iframes: this.getSuspiciousIframes(),
        scripts: this.getSuspiciousScripts()
      }
    };
  }

  private getSuspiciousIframes(): string[] {
    const iframes = document.querySelectorAll('iframe');
    const suspicious: string[] = [];

    iframes.forEach(iframe => {
      const src = iframe.src;
      if (src && !this.isDomainTrusted(src)) {
        suspicious.push(src);
      }
    });

    return suspicious;
  }

  private getSuspiciousScripts(): string[] {
    const scripts = document.querySelectorAll('script[src]');
    const suspicious: string[] = [];

    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !this.isDomainTrusted(src)) {
        suspicious.push(src);
      }
    });

    return suspicious;
  }

  private isDomainTrusted(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const currentDomain = window.location.hostname;
      
      // Check if same domain
      return urlObj.hostname === currentDomain || 
             urlObj.hostname.endsWith(`.${currentDomain}`);
    } catch {
      return false;
    }
  }
}

// Initialize monitor
const monitor = new PageSecurityMonitor();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getPageAnalysis') {
    sendResponse(monitor.getAnalysis());
  }
});

// Report page analysis to background script periodically
setInterval(() => {
  const analysis = monitor.getAnalysis();
  if (analysis.threats.length > 0 || analysis.suspiciousElements.iframes.length > 0) {
    chrome.runtime.sendMessage({
      type: 'pageAnalysisReport',
      analysis,
      url: window.location.href
    });
  }
}, 30000); // Every 30 seconds

console.log('🛡️ Threat Blocker content script loaded');
