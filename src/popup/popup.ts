// Popup TypeScript

interface Stats {
  totalBlocked: number;
  blockedToday: number;
  indicatorCount: number;
  bySource: Record<string, number>;
  bySeverity: Record<string, number>;
}

async function loadStats(): Promise<void> {
  try {
    const response = await new Promise<Stats>((resolve) => {
      chrome.runtime.sendMessage({ type: 'getStats' }, resolve);
    });

    document.getElementById('blockedToday')!.textContent = response.blockedToday.toString();
    document.getElementById('totalBlocked')!.textContent = response.totalBlocked.toString();
    document.getElementById('indicatorCount')!.textContent = response.indicatorCount.toString();

    // Update severity counts
    document.getElementById('critical')!.textContent = (response.bySeverity['critical'] || 0).toString();
    document.getElementById('high')!.textContent = (response.bySeverity['high'] || 0).toString();
    document.getElementById('medium')!.textContent = (response.bySeverity['medium'] || 0).toString();
    document.getElementById('low')!.textContent = (response.bySeverity['low'] || 0).toString();

    // Update feeds list
    updateFeedsList(response.bySource);

    // Update last update time
    const lastUpdate = new Date().toLocaleTimeString();
    document.getElementById('lastUpdate')!.textContent = lastUpdate;

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateFeedsList(bySource: Record<string, number>): void {
  const feedsList = document.getElementById('feedsList')!;
  feedsList.innerHTML = '';

  const feeds = ['URLhaus', 'PhishTank', 'VirusTotal', 'AbuseIPDB'];
  
  feeds.forEach(feed => {
    const count = bySource[feed] || 0;
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `
      <span>${feed}</span>
      <span class="feed-status ${count > 0 ? 'active' : ''}">${count} indicators</span>
    `;
    feedsList.appendChild(div);
  });
}

// Event listeners
document.getElementById('settingsBtn')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('historyBtn')?.addEventListener('click', () => {
  const historyUrl = chrome.runtime.getURL('history.html');
  chrome.tabs.create({ url: historyUrl });
});

document.getElementById('blockingToggle')?.addEventListener('change', async (e) => {
  const enabled = (e.target as HTMLInputElement).checked;
  
  const response = await new Promise<any>((resolve) => {
    chrome.runtime.sendMessage({
      type: 'getSettings'
    }, resolve);
  });

  response.blockingEnabled = enabled;
  
  await new Promise<void>((resolve) => {
    chrome.runtime.sendMessage({
      type: 'updateSettings',
      settings: response
    }, () => resolve());
  });
});

document.getElementById('updateBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('updateBtn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = '⏳ Updating...';

  try {
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ type: 'manualUpdate' }, () => resolve());
    });

    // Reload stats
    await loadStats();
    
    btn.textContent = '✅ Updated';
    setTimeout(() => {
      btn.textContent = '🔄 Update Now';
      btn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Update error:', error);
    btn.textContent = '❌ Update Failed';
    btn.disabled = false;
  }
});

document.getElementById('reportBtn')?.addEventListener('click', () => {
  const email = 'report@threatblocker.local';
  alert(`Please report issues to:\n${email}\n\nInclude any relevant threat details.`);
});

// Load stats on popup open
loadStats();

// Refresh stats every 5 seconds
setInterval(loadStats, 5000);
