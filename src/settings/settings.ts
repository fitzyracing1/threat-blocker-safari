// Settings Page TypeScript

import { ExtensionSettings, DEFAULT_SETTINGS, THREAT_FEEDS } from '../types';

let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;

async function loadSettings(): Promise<void> {
  const stored = await chrome.storage.local.get('settings');
  currentSettings = stored.settings || DEFAULT_SETTINGS;
  
  // Populate form fields
  document.getElementById('blockingEnabled')!.setAttribute('checked', 
    currentSettings.blockingEnabled ? '' : 'false');
  document.getElementById('notificationsEnabled')!.setAttribute('checked', 
    currentSettings.notificationsEnabled ? '' : 'false');
  document.getElementById('updateInterval')!.setAttribute('value', 
    currentSettings.updateInterval.toString());
  
  // Load API keys
  if (currentSettings.apiKeys.virusTotal) {
    (document.getElementById('virusTotalKey') as HTMLInputElement).value = currentSettings.apiKeys.virusTotal;
  }
  if (currentSettings.apiKeys.abuseIPDB) {
    (document.getElementById('abuseIPDBKey') as HTMLInputElement).value = currentSettings.apiKeys.abuseIPDB;
  }

  // Load whitelist
  populateWhitelist();
  
  // Populate feeds
  populateFeeds();

  // Load SureCookie config
  const surecookieStored = await chrome.storage.local.get('surecookieConfig');
  if (surecookieStored.surecookieConfig) {
    (document.getElementById('surecookieEndpoint') as HTMLInputElement).value = 
      surecookieStored.surecookieConfig.endpoint || '';
    document.getElementById('surecookieEnabled')!.setAttribute('checked', 'true');
  }
}

function populateFeeds(): void {
  const container = document.getElementById('feedsContainer')!;
  container.innerHTML = '';

  THREAT_FEEDS.forEach(feed => {
    const div = document.createElement('div');
    div.className = 'feed-option';
    
    const isEnabled = currentSettings.enabledFeeds.includes(feed.name);
    const apiKeyStatus = feed.requiresApiKey ? '(requires API key)' : '(free)';
    
    div.innerHTML = `
      <input type="checkbox" id="feed-${feed.name}" ${isEnabled ? 'checked' : ''}>
      <div class="feed-info">
        <div class="feed-name">${feed.name} ${apiKeyStatus}</div>
        <div class="feed-status">${feed.url}</div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

function populateWhitelist(): void {
  const container = document.getElementById('whitelistContainer')!;
  container.innerHTML = '';

  currentSettings.whitelistedDomains.forEach(domain => {
    const div = document.createElement('div');
    div.className = 'whitelist-item';
    div.innerHTML = `
      <span>${domain}</span>
      <button type="button">Remove</button>
    `;
    
    div.querySelector('button')!.addEventListener('click', () => {
      currentSettings.whitelistedDomains = 
        currentSettings.whitelistedDomains.filter(d => d !== domain);
      populateWhitelist();
    });
    
    container.appendChild(div);
  });

  if (currentSettings.whitelistedDomains.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center;">No domains whitelisted</p>';
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = (e.target as HTMLElement).getAttribute('data-tab');
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName!)!.classList.add('active');
    (e.target as HTMLElement).classList.add('active');
  });
});

// Add whitelist domain
document.getElementById('addWhitelistBtn')?.addEventListener('click', () => {
  const input = document.getElementById('whitelistInput') as HTMLInputElement;
  const domain = input.value.trim().toLowerCase();
  
  if (domain && !currentSettings.whitelistedDomains.includes(domain)) {
    currentSettings.whitelistedDomains.push(domain);
    input.value = '';
    populateWhitelist();
  } else if (currentSettings.whitelistedDomains.includes(domain)) {
    alert('Domain already in whitelist');
  }
});

// Test SureCookie connection
document.getElementById('testConnection')?.addEventListener('click', async () => {
  const endpoint = (document.getElementById('surecookieEndpoint') as HTMLInputElement).value;
  const statusDiv = document.getElementById('connectionStatus')!;
  
  try {
    statusDiv.textContent = '⏳ Testing...';
    statusDiv.style.display = 'block';
    statusDiv.className = 'status-message info';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.ok) {
      statusDiv.textContent = '✅ Connection successful!';
      statusDiv.className = 'status-message success';
    } else {
      statusDiv.textContent = `❌ Connection failed (${response.status})`;
      statusDiv.className = 'status-message error';
    }
  } catch (error) {
    statusDiv.textContent = `❌ Error: ${(error as Error).message}`;
    statusDiv.className = 'status-message error';
  }
});

// Save settings
document.getElementById('saveBtn')?.addEventListener('click', async () => {
  // Collect feed selections
  const enabledFeeds: string[] = [];
  THREAT_FEEDS.forEach(feed => {
    const checkbox = document.getElementById(`feed-${feed.name}`) as HTMLInputElement;
    if (checkbox && checkbox.checked) {
      enabledFeeds.push(feed.name);
    }
  });

  // Update settings object
  currentSettings.blockingEnabled = (document.getElementById('blockingEnabled') as HTMLInputElement).checked;
  currentSettings.notificationsEnabled = (document.getElementById('notificationsEnabled') as HTMLInputElement).checked;
  currentSettings.updateInterval = parseInt((document.getElementById('updateInterval') as HTMLInputElement).value);
  currentSettings.enabledFeeds = enabledFeeds;
  
  currentSettings.apiKeys.virusTotal = (document.getElementById('virusTotalKey') as HTMLInputElement).value || undefined;
  currentSettings.apiKeys.abuseIPDB = (document.getElementById('abuseIPDBKey') as HTMLInputElement).value || undefined;

  // Save settings
  await chrome.storage.local.set({ settings: currentSettings });

  // Save SureCookie config if enabled
  if ((document.getElementById('surecookieEnabled') as HTMLInputElement).checked) {
    await chrome.storage.local.set({
      surecookieConfig: {
        endpoint: (document.getElementById('surecookieEndpoint') as HTMLInputElement).value,
        apiKey: (document.getElementById('surecookieApiKey') as HTMLInputElement).value || null
      }
    });
  }

  // Show success message
  const statusDiv = document.getElementById('saveStatus')!;
  statusDiv.textContent = '✅ Settings saved successfully!';
  statusDiv.className = 'status-message success';
  statusDiv.style.display = 'block';

  // Notify background script
  chrome.runtime.sendMessage({
    type: 'updateSettings',
    settings: currentSettings
  });

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
});

// Reset to defaults
document.getElementById('resetBtn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = DEFAULT_SETTINGS;
    chrome.storage.local.set({ settings: currentSettings });
    loadSettings();
    
    const statusDiv = document.getElementById('saveStatus')!;
    statusDiv.textContent = '🔄 Settings reset to defaults';
    statusDiv.className = 'status-message info';
    statusDiv.style.display = 'block';
  }
});

// Load settings on page load
loadSettings();
