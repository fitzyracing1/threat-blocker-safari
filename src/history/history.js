// Threat History Viewer
let allLogs = [];
let filteredLogs = [];

// Load threat logs on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadThreatLogs();
  setupEventListeners();
});

async function loadThreatLogs() {
  const loading = document.getElementById('loading');
  const noData = document.getElementById('noData');
  
  try {
    loading.style.display = 'block';
    noData.style.display = 'none';

    const response = await chrome.runtime.sendMessage({ type: 'getThreatLogs', limit: 500 });
    allLogs = response.logs || [];
    filteredLogs = [...allLogs];

    loading.style.display = 'none';

    if (allLogs.length === 0) {
      noData.style.display = 'block';
    } else {
      updateStats();
      renderThreatList();
    }
  } catch (error) {
    console.error('Error loading threat logs:', error);
    loading.textContent = 'Error loading threats';
  }
}

function updateStats() {
  const total = allLogs.length;
  const blocked = allLogs.filter(log => log.blocked).length;
  const resumed = allLogs.filter(log => log.resumed).length;
  const reported = allLogs.filter(log => log.reportedToISP).length;

  document.getElementById('totalThreats').textContent = total;
  document.getElementById('blockedThreats').textContent = blocked;
  document.getElementById('resumedThreats').textContent = resumed;
  document.getElementById('reportedThreats').textContent = reported;
}

function renderThreatList() {
  const container = document.getElementById('threatList');
  container.innerHTML = '';

  if (filteredLogs.length === 0) {
    container.innerHTML = '<div class="no-data">No threats match the current filters</div>';
    return;
  }

  filteredLogs.forEach(log => {
    const item = createThreatItem(log);
    container.appendChild(item);
  });
}

function createThreatItem(log) {
  const div = document.createElement('div');
  div.className = 'threat-item';
  
  // Get highest severity from indicators
  const severity = getHighestSeverity(log.indicators);
  
  div.innerHTML = `
    <div class="threat-header">
      <div class="threat-url">${escapeHtml(log.url)}</div>
      <div class="threat-badges">
        <span class="badge badge-${severity}">${severity.toUpperCase()}</span>
        ${log.blocked ? '<span class="badge badge-blocked">🚫 Blocked</span>' : ''}
        ${log.resumed ? '<span class="badge badge-resumed">▶️ Resumed</span>' : ''}
        ${log.reportedToISP ? '<span class="badge badge-reported">📧 Reported</span>' : ''}
      </div>
    </div>
    
    <div class="threat-details">
      <div class="detail-item">
        <div class="detail-label">Attack Type</div>
        <div class="detail-value">${log.attackType || 'Unknown'}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">IP Address</div>
        <div class="detail-value">${log.ipAddress || 'N/A'}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Location</div>
        <div class="detail-value">${formatLocation(log.ipLocation)}</div>
      </div>
      
      <div class="detail-item">
        <div class="detail-label">Timestamp</div>
        <div class="detail-value">${formatDate(log.timestamp)}</div>
      </div>
    </div>
    
    <div class="threat-actions">
      <button class="btn btn-primary btn-small view-details" data-id="${log.id}">
        🔍 View Details
      </button>
      ${!log.reportedToISP ? `
        <button class="btn btn-secondary btn-small report-isp" data-id="${log.id}">
          📧 Report to ISP
        </button>
      ` : ''}
      ${log.blocked && !log.resumed ? `
        <button class="btn btn-secondary btn-small resume-threat" data-id="${log.id}">
          ▶️ Mark as Resumed
        </button>
      ` : ''}
    </div>
  `;
  
  // Add event listeners
  div.querySelector('.view-details').addEventListener('click', () => showThreatDetails(log.id));
  
  const reportBtn = div.querySelector('.report-isp');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => reportToISP(log.id));
  }
  
  const resumeBtn = div.querySelector('.resume-threat');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => markAsResumed(log.id));
  }
  
  return div;
}

async function showThreatDetails(logId) {
  const response = await chrome.runtime.sendMessage({ type: 'getThreatLog', id: logId });
  const log = response.log;
  
  if (!log) return;
  
  const modal = document.getElementById('detailsModal');
  const content = document.getElementById('threatDetails');
  
  content.innerHTML = `
    <div class="detail-section">
      <h3>🌐 Threat Information</h3>
      <div class="detail-row">
        <div class="detail-row-label">URL:</div>
        <div class="detail-row-value">${escapeHtml(log.url)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-row-label">Attack Type:</div>
        <div class="detail-row-value">${log.attackType}</div>
      </div>
      <div class="detail-row">
        <div class="detail-row-label">Timestamp:</div>
        <div class="detail-row-value">${formatDate(log.timestamp)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-row-label">Status:</div>
        <div class="detail-row-value">
          ${log.blocked ? '🚫 Blocked' : '✅ Allowed'} 
          ${log.resumed ? ' • ▶️ Resumed by user' : ''}
          ${log.reportedToISP ? ' • 📧 Reported to ISP' : ''}
        </div>
      </div>
    </div>
    
    ${log.ipAddress ? `
    <div class="detail-section">
      <h3>🌍 IP Information</h3>
      <div class="detail-row">
        <div class="detail-row-label">IP Address:</div>
        <div class="detail-row-value">${log.ipAddress}</div>
      </div>
      ${log.ipLocation ? `
      <div class="detail-row">
        <div class="detail-row-label">Location:</div>
        <div class="detail-row-value">${formatLocationFull(log.ipLocation)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-row-label">ISP/Organization:</div>
        <div class="detail-row-value">${log.ipLocation.isp || 'Unknown'}</div>
      </div>
      ${log.ipLocation.asn ? `
      <div class="detail-row">
        <div class="detail-row-label">ASN:</div>
        <div class="detail-row-value">${log.ipLocation.asn}</div>
      </div>
      ` : ''}
      ` : ''}
    </div>
    ` : ''}
    
    ${log.attackStructure ? `
    <div class="detail-section">
      <h3>🔬 Attack Structure</h3>
      <div class="detail-row">
        <div class="detail-row-label">Protocol:</div>
        <div class="detail-row-value">${log.attackStructure.protocol.toUpperCase()}</div>
      </div>
      <div class="detail-row">
        <div class="detail-row-label">Obfuscation Detected:</div>
        <div class="detail-row-value">${log.attackStructure.obfuscationDetected ? '⚠️ Yes' : 'No'}</div>
      </div>
      ${log.attackStructure.suspiciousPatterns.length > 0 ? `
      <div class="detail-row">
        <div class="detail-row-label">Suspicious Patterns:</div>
        <div class="detail-row-value">
          <ul class="pattern-list">
            ${log.attackStructure.suspiciousPatterns.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      </div>
      ` : ''}
      ${log.attackStructure.encodingSchemes && log.attackStructure.encodingSchemes.length > 0 ? `
      <div class="detail-row">
        <div class="detail-row-label">Encoding Schemes:</div>
        <div class="detail-row-value">${log.attackStructure.encodingSchemes.join(', ')}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <div class="detail-section">
      <h3>⚠️ Threat Indicators (${log.indicators.length})</h3>
      ${log.indicators.map((ind, i) => `
        <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid ${getSeverityColor(ind.severity)}">
          <strong>Source:</strong> ${ind.source}<br>
          <strong>Type:</strong> ${ind.type}<br>
          <strong>Severity:</strong> <span class="badge badge-${ind.severity}">${ind.severity.toUpperCase()}</span><br>
          ${ind.description ? `<strong>Description:</strong> ${escapeHtml(ind.description)}<br>` : ''}
          ${ind.tags && ind.tags.length > 0 ? `<strong>Tags:</strong> ${ind.tags.join(', ')}` : ''}
        </div>
      `).join('')}
    </div>
    
    ${log.metadata ? `
    <div class="detail-section">
      <h3>📊 Metadata</h3>
      ${log.metadata.malwareFamily ? `
      <div class="detail-row">
        <div class="detail-row-label">Malware Family:</div>
        <div class="detail-row-value">${log.metadata.malwareFamily}</div>
      </div>
      ` : ''}
      ${log.metadata.sslCertValid !== undefined ? `
      <div class="detail-row">
        <div class="detail-row-label">SSL Certificate:</div>
        <div class="detail-row-value">${log.metadata.sslCertValid ? '✅ Valid' : '❌ Invalid'}</div>
      </div>
      ` : ''}
      ${log.metadata.httpHeaders ? `
      <div class="detail-row">
        <div class="detail-row-label">HTTP Headers:</div>
        <div class="detail-row-value">
          <pre>${JSON.stringify(log.metadata.httpHeaders, null, 2)}</pre>
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${log.userAgent ? `
    <div class="detail-section">
      <h3>💻 Browser Information</h3>
      <div class="detail-row">
        <div class="detail-row-label">User Agent:</div>
        <div class="detail-row-value">${escapeHtml(log.userAgent)}</div>
      </div>
    </div>
    ` : ''}
  `;
  
  modal.style.display = 'flex';
}

async function reportToISP(logId) {
  if (!confirm('Report this threat to the ISP? This will generate an email template and send it to your configured backend.')) {
    return;
  }
  
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳ Reporting...';
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      type: 'reportToISP', 
      logId: logId 
    });
    
    if (response.success) {
      alert('✅ Threat reported to ISP successfully!');
      await loadThreatLogs(); // Refresh
    } else {
      alert('❌ Failed to report to ISP: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    alert('❌ Error reporting to ISP: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📧 Report to ISP';
  }
}

async function markAsResumed(logId) {
  try {
    await chrome.runtime.sendMessage({ 
      type: 'resumeFromThreat', 
      logId: logId 
    });
    
    await loadThreatLogs(); // Refresh
  } catch (error) {
    console.error('Error marking as resumed:', error);
  }
}

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadThreatLogs);
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Search input
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  
  // Filter dropdowns
  document.getElementById('attackTypeFilter').addEventListener('change', applyFilters);
  document.getElementById('severityFilter').addEventListener('change', applyFilters);
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  
  // Modal close buttons
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });
  
  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const attackType = document.getElementById('attackTypeFilter').value.toLowerCase();
  const severity = document.getElementById('severityFilter').value.toLowerCase();
  const status = document.getElementById('statusFilter').value.toLowerCase();
  
  filteredLogs = allLogs.filter(log => {
    // Search filter
    if (searchTerm) {
      const matches = 
        log.url.toLowerCase().includes(searchTerm) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm)) ||
        (log.attackType && log.attackType.toLowerCase().includes(searchTerm));
      if (!matches) return false;
    }
    
    // Attack type filter
    if (attackType && !log.attackType.toLowerCase().includes(attackType)) {
      return false;
    }
    
    // Severity filter
    if (severity) {
      const hasSeverity = log.indicators.some(ind => ind.severity === severity);
      if (!hasSeverity) return false;
    }
    
    // Status filter
    if (status) {
      if (status === 'blocked' && !log.blocked) return false;
      if (status === 'resumed' && !log.resumed) return false;
      if (status === 'reported' && !log.reportedToISP) return false;
    }
    
    return true;
  });
  
  renderThreatList();
}

function exportToCSV() {
  const headers = [
    'Timestamp', 'URL', 'Attack Type', 'IP Address', 'Location', 
    'Severity', 'Blocked', 'Resumed', 'Reported to ISP'
  ];
  
  const rows = filteredLogs.map(log => [
    formatDate(log.timestamp),
    log.url,
    log.attackType || 'Unknown',
    log.ipAddress || 'N/A',
    formatLocation(log.ipLocation),
    getHighestSeverity(log.indicators),
    log.blocked ? 'Yes' : 'No',
    log.resumed ? 'Yes' : 'No',
    log.reportedToISP ? 'Yes' : 'No'
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `threat-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper functions
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function formatLocation(location) {
  if (!location) return 'Unknown';
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.country) parts.push(location.country);
  return parts.join(', ') || 'Unknown';
}

function formatLocationFull(location) {
  if (!location) return 'Unknown';
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);
  if (location.countryCode) parts.push(`(${location.countryCode})`);
  return parts.join(', ') || 'Unknown';
}

function getHighestSeverity(indicators) {
  const severities = ['critical', 'high', 'medium', 'low'];
  for (const sev of severities) {
    if (indicators.some(ind => ind.severity === sev)) {
      return sev;
    }
  }
  return 'low';
}

function getSeverityColor(severity) {
  const colors = {
    critical: '#ff4444',
    high: '#ff8800',
    medium: '#ffcc00',
    low: '#4caf50'
  };
  return colors[severity] || '#999';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
