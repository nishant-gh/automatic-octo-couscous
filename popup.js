/**
 * GuardianAI Popup Script
 */

// Initialize popup
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Load current status
  await loadStatus();

  // Load statistics
  await loadStatistics();

  // Set up event listeners
  setupEventListeners();

  // Check current page
  await checkCurrentPage();
}

// Load protection status
async function loadStatus() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    const toggle = document.getElementById('toggleProtection');
    const statusText = document.getElementById('statusText');

    if (settings.protectionEnabled) {
      toggle.classList.add('active');
      statusText.textContent = 'Protection Active';
      statusText.classList.add('status-active');
      statusText.classList.remove('status-inactive');
    } else {
      toggle.classList.remove('active');
      statusText.textContent = 'Protection Disabled';
      statusText.classList.remove('status-active');
      statusText.classList.add('status-inactive');
    }
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

// Load statistics
async function loadStatistics() {
  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });

    document.getElementById('threatsBlocked').textContent = stats.threatsBlocked || 0;
    document.getElementById('totalScans').textContent = stats.totalScans || 0;
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

// Check current page
async function checkCurrentPage() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab) return;

    // Get cached analysis if available
    const stored = await chrome.storage.local.get(['scamReports']);
    const reports = stored.scamReports || [];

    // Find recent analysis for this URL
    const recentReport = reports.find(report => {
      const reportUrl = report.context?.url;
      const age = Date.now() - new Date(report.timestamp).getTime();

      return reportUrl === currentTab.url && age < 60000; // Within last minute
    });

    const statusElement = document.getElementById('currentPageStatus');

    if (recentReport) {
      const analysis = recentReport.analysis;

      if (analysis.threatLevel === 'danger') {
        statusElement.className = 'threat-level threat-danger';
        statusElement.textContent = '⚠️ DANGER: This page may be a scam!';
      } else if (analysis.threatLevel === 'suspicious') {
        statusElement.className = 'threat-level threat-suspicious';
        statusElement.textContent = '⚠️ WARNING: Suspicious content detected';
      } else {
        statusElement.className = 'threat-level threat-safe';
        statusElement.textContent = '✓ Current page is safe';
      }
    } else {
      statusElement.className = 'threat-level threat-safe';
      statusElement.textContent = '○ Page not yet scanned';
    }
  } catch (error) {
    console.error('Failed to check current page:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Toggle protection
  document.getElementById('toggleProtection').addEventListener('click', toggleProtection);

  // Open dashboard
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });

  // Scan page
  document.getElementById('scanPage').addEventListener('click', scanCurrentPage);

  // Training mode
  document.getElementById('trainingMode').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'dashboard.html?mode=training' });
  });

  // Add contact
  document.getElementById('addContact').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'dashboard.html?section=contacts' });
  });

  // Report scam
  document.getElementById('reportScam').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'dashboard.html?section=report' });
  });
}

// Toggle protection
async function toggleProtection() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const newStatus = !settings.protectionEnabled;

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: { protectionEnabled: newStatus }
    });

    // Reload status
    await loadStatus();

    // Show confirmation
    showNotification(
      newStatus ? 'Protection Enabled' : 'Protection Disabled',
      newStatus ? 'You are now protected against scams' : 'Protection has been disabled'
    );
  } catch (error) {
    console.error('Failed to toggle protection:', error);
  }
}

// Scan current page
async function scanCurrentPage() {
  const button = document.getElementById('scanPage');
  button.textContent = '⏳ Scanning...';
  button.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab) {
      throw new Error('No active tab');
    }

    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      });
    } catch (error) {
      // Content script may already be injected
    }

    // Trigger page analysis
    await chrome.tabs.sendMessage(currentTab.id, { type: 'ANALYZE_PAGE' });

    // Wait a bit for analysis to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Refresh status
    await checkCurrentPage();
    await loadStatistics();

    showNotification('Scan Complete', 'Page has been analyzed for scam indicators');
  } catch (error) {
    console.error('Failed to scan page:', error);
    showNotification('Scan Failed', 'Unable to scan this page');
  } finally {
    button.textContent = '🔍 Scan Current Page';
    button.disabled = false;
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 1
  });
}
