// Threat Blocker Safari Web Extension - Content Script

class ThreatFeed {
  constructor() {
    this.blocklist = new Map();
    this.lastUpdated = 0;
  }

  async initialize() {
    await this.fetchFeeds();
    setInterval(() => this.fetchFeeds(), 3600000);
  }

  async fetchFeeds() {
    try {
      const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/');
      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          data.results.forEach(item => {
            this.blocklist.set(item.url, { severity: 'high', source: 'URLhaus' });
          });
        }
      }
      this.lastUpdated = Date.now();
      console.log(`✅ Threat feeds updated: ${this.blocklist.size} indicators`);
    } catch (e) {
      console.error('Error fetching threats:', e);
    }
  }

  isThreat(url) {
    try {
      const urlObj = new URL(url);
      return this.blocklist.has(urlObj.hostname) || this.blocklist.has(url);
    } catch (e) {
      return false;
    }
  }
}

const threatFeed = new ThreatFeed();
window.addEventListener('load', () => threatFeed.initialize());

// Intercept link clicks
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href]');
  if (link && threatFeed.isThreat(link.href)) {
    e.preventDefault();
    alert('⚠️ Malicious link blocked by Threat Blocker');
  }
}, true);

console.log('🛡️ Threat Blocker extension loaded');
