// Blocked Page TypeScript

interface ThreatData {
  value: string;
  type: string;
  source: string;
  severity: string;
  description?: string;
  tags?: string[];
}

let logId: string | undefined;

function getUrlParams(): { url?: string; threat?: ThreatData; logId?: string } {
  const params = new URLSearchParams(window.location.search);
  
  logId = params.get('logId') || undefined;
  
  return {
    url: params.get('url') || undefined,
    threat: params.get('threat') ? JSON.parse(decodeURIComponent(params.get('threat')!)) : undefined,
    logId
  };
}

function displayThreatInfo(): void {
  const { url, threat } = getUrlParams();

  if (!threat) {
    console.error('No threat data provided');
    return;
  }

  // Display threat information
  document.getElementById('threatType')!.textContent = threat.type.toUpperCase();
  document.getElementById('threatSeverity')!.textContent = threat.severity.toUpperCase();
  document.getElementById('threatSource')!.textContent = threat.source;
  document.getElementById('threatDescription')!.textContent = threat.description || 'Threat detected';
  document.getElementById('blockedUrl')!.textContent = url || 'Unknown URL';
  document.getElementById('blockedTime')!.textContent = new Date().toLocaleString();

  // Add severity styling
  const severityEl = document.getElementById('threatSeverity')!;
  severityEl.style.color = getSeverityColor(threat.severity);
  severityEl.style.fontWeight = 'bold';
}

function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return '#d32f2f';
    case 'high': return '#f57c00';
    case 'medium': return '#fbc02d';
    case 'low': return '#388e3c';
    default: return '#999';
  }
}

// Go back button
document.getElementById('goBackBtn')?.addEventListener('click', () => {
  window.history.back();
});

// Continue Anyway button (with warning)
document.getElementById('continueBtn')?.addEventListener('click', () => {
  const { url } = getUrlParams();
  
  if (!url) {
    alert('Cannot continue: URL not found');
    return;
  }
  
  const confirmed = confirm(
    '⚠️ WARNING: This site has been identified as a security threat.\n\n' +
    'Continuing may expose you to:\n' +
    '• Malware infections\n' +
    '• Data theft (passwords, credit cards)\n' +
    '• Phishing attacks\n' +
    '• System compromise\n\n' +
    'Are you ABSOLUTELY SURE you want to continue?'
  );
  
  if (confirmed) {
    // Mark threat as resumed
    if (logId) {
      chrome.runtime.sendMessage({
        type: 'resumeFromThreat',
        logId
      });
    }
    
    // Navigate to the original URL
    window.location.href = url;
  }
});

// View Threat History button
document.getElementById('viewHistoryBtn')?.addEventListener('click', () => {
  const historyUrl = chrome.runtime.getURL('history.html');
  chrome.tabs.create({ url: historyUrl });
});

// Whitelist button
document.getElementById('whitelistBtn')?.addEventListener('click', () => {
  const { url } = getUrlParams();
  if (!url) {
    alert('Cannot whitelist: URL not found');
    return;
  }

  try {
    const domain = new URL(url).hostname;
    chrome.runtime.sendMessage({
      type: 'addToWhitelist',
      domain
    }, (response) => {
      if (response.success) {
        alert(`✅ Added ${domain} to whitelist`);
        setTimeout(() => window.history.back(), 1000);
      } else {
        alert('❌ Failed to add to whitelist');
      }
    });
  } catch (error) {
    alert('Invalid URL');
  }
});

// Report button
document.getElementById('reportBtn')?.addEventListener('click', () => {
  const { url, threat } = getUrlParams();
  
  const message = `Report false positive:\n\n` +
    `URL: ${url}\n` +
    `Threat Type: ${threat?.type}\n` +
    `Source: ${threat?.source}\n\n` +
    `Please include details about why you believe this is a false positive.`;

  alert(message);

  // In a real implementation, this would send data to a reporting endpoint
  chrome.runtime.sendMessage({
    type: 'reportFalsePositive',
    url,
    threat
  });
});

// Display threat info on page load
window.addEventListener('load', displayThreatInfo);

console.log('🚫 Blocked page loaded');
