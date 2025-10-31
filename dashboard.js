/**
 * GuardianAI Dashboard Script
 */

// Initialize dashboard
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Set up navigation
  setupNavigation();

  // Load statistics
  await loadStatistics();

  // Load recent activity
  await loadRecentActivity();

  // Load reports
  await loadReports();

  // Load contacts
  await loadContacts();

  // Load settings
  await loadSettings();

  // Set up event listeners
  setupEventListeners();

  // Check URL parameters
  checkURLParameters();
}

// Set up navigation
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show corresponding section
      const sectionId = item.dataset.section;
      showSection(sectionId);
    });
  });
}

// Show section
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');

  sections.forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(sectionId).classList.add('active');
}

// Load statistics
async function loadStatistics() {
  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });

    // Update overview stats
    document.getElementById('totalScans').textContent = stats.totalScans || 0;
    document.getElementById('threatsBlocked').textContent = stats.threatsBlocked || 0;
    document.getElementById('suspiciousFlags').textContent = stats.suspiciousFlags || 0;
    document.getElementById('safeSites').textContent = stats.safeSites || 0;

    // Update header
    document.getElementById('headerThreatsBlocked').textContent = stats.threatsBlocked || 0;

    // Update threat change
    const threatChange = document.getElementById('threatChange');
    if (stats.recentThreats !== undefined) {
      threatChange.textContent = `${stats.recentThreats > 0 ? '↑' : '↓'} ${stats.recentThreats} this week`;
      threatChange.className = stats.recentThreats > 0 ? 'stat-change stat-up' : 'stat-change stat-down';
    }
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const stored = await chrome.storage.local.get(['scamReports']);
    const reports = stored.scamReports || [];

    const recentActivity = document.getElementById('recentActivity');

    if (reports.length === 0) {
      return; // Keep empty state
    }

    recentActivity.innerHTML = '';

    // Show last 5 reports
    reports.slice(0, 5).forEach(report => {
      const item = createReportItem(report);
      recentActivity.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load recent activity:', error);
  }
}

// Load reports
async function loadReports() {
  try {
    const stored = await chrome.storage.local.get(['scamReports']);
    const reports = stored.scamReports || [];

    const reportsList = document.getElementById('reportsList');

    if (reports.length === 0) {
      return; // Keep empty state
    }

    reportsList.innerHTML = '';

    reports.forEach(report => {
      const item = createReportItem(report);
      reportsList.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load reports:', error);
  }
}

// Create report item
function createReportItem(report) {
  const item = document.createElement('li');
  item.className = 'report-item';

  const analysis = report.analysis;
  const threatLevel = analysis.threatLevel || analysis.textAnalysis?.threatLevel || 'safe';

  const icon = threatLevel === 'danger' ? '🚨' :
               threatLevel === 'suspicious' ? '⚠️' : '✅';

  const timestamp = new Date(report.timestamp);
  const timeAgo = formatTimeAgo(timestamp);

  item.innerHTML = `
    <div class="report-icon">${icon}</div>
    <div class="report-content">
      <div class="report-title">
        ${analysis.scamType || analysis.textAnalysis?.scamType || 'Content Analysis'}
        <span class="threat-badge threat-${threatLevel}">${threatLevel.toUpperCase()}</span>
      </div>
      <div class="report-details">
        ${analysis.explanation || analysis.textAnalysis?.explanation || 'Scanned for threats'}
      </div>
      <div class="report-time">${timeAgo} • ${report.context?.url || 'Unknown URL'}</div>
    </div>
  `;

  return item;
}

// Format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

// Load contacts
async function loadContacts() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const contacts = settings.trustedContacts || [];

    const contactsList = document.getElementById('contactsList');

    if (contacts.length === 0) {
      return; // Keep empty state
    }

    contactsList.innerHTML = '';

    contacts.forEach(contact => {
      const item = createContactItem(contact);
      contactsList.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load contacts:', error);
  }
}

// Create contact item
function createContactItem(contact) {
  const item = document.createElement('li');
  item.className = 'contact-item';

  item.innerHTML = `
    <div class="contact-info">
      <div class="contact-name">${contact.name}</div>
      <div class="contact-details">
        ${contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)} •
        ${contact.email}
        ${contact.phone ? ` • ${contact.phone}` : ''}
      </div>
    </div>
    <button class="btn btn-danger btn-sm" data-contact-id="${contact.id}">Remove</button>
  `;

  // Add remove listener
  item.querySelector('.btn-danger').addEventListener('click', () => {
    removeContact(contact.id);
  });

  return item;
}

// Load settings
async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    // Update toggles
    updateToggle('toggleRealtime', settings.protectionEnabled ?? true);
    updateToggle('toggleSound', settings.soundAlerts ?? true);
    updateToggle('toggleFamily', settings.familyAlertsEnabled ?? false);

    // Update monitoring level
    document.getElementById('monitoringLevel').value = settings.monitoringLevel || 'high';
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Update toggle
function updateToggle(id, active) {
  const toggle = document.getElementById(id);

  if (active) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Toggle switches
  document.getElementById('toggleRealtime').addEventListener('click', function() {
    this.classList.toggle('active');
  });

  document.getElementById('toggleSound').addEventListener('click', function() {
    this.classList.toggle('active');
  });

  document.getElementById('toggleFamily').addEventListener('click', function() {
    this.classList.toggle('active');
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', saveSettings);

  // Add contact
  document.getElementById('showAddContact').addEventListener('click', () => {
    document.getElementById('addContactForm').style.display = 'block';
  });

  document.getElementById('cancelAddContact').addEventListener('click', () => {
    document.getElementById('addContactForm').style.display = 'none';
    document.getElementById('contactForm').reset();
  });

  document.getElementById('contactForm').addEventListener('submit', handleAddContact);

  // Training
  document.getElementById('startTraining').addEventListener('click', startTraining);
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      protectionEnabled: document.getElementById('toggleRealtime').classList.contains('active'),
      soundAlerts: document.getElementById('toggleSound').classList.contains('active'),
      familyAlertsEnabled: document.getElementById('toggleFamily').classList.contains('active'),
      monitoringLevel: document.getElementById('monitoringLevel').value
    };

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settings
    });

    showAlert('success', 'Settings saved successfully!');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showAlert('danger', 'Failed to save settings. Please try again.');
  }
}

// Handle add contact
async function handleAddContact(event) {
  event.preventDefault();

  const contact = {
    name: document.getElementById('contactName').value,
    email: document.getElementById('contactEmail').value,
    phone: document.getElementById('contactPhone').value,
    relationship: document.getElementById('contactRelationship').value
  };

  try {
    await chrome.runtime.sendMessage({
      type: 'ADD_TRUSTED_CONTACT',
      data: contact
    });

    // Hide form and reset
    document.getElementById('addContactForm').style.display = 'none';
    document.getElementById('contactForm').reset();

    // Reload contacts
    await loadContacts();

    showAlert('success', 'Trusted contact added successfully!');
  } catch (error) {
    console.error('Failed to add contact:', error);
    showAlert('danger', 'Failed to add contact. Please try again.');
  }
}

// Remove contact
async function removeContact(contactId) {
  if (!confirm('Are you sure you want to remove this contact?')) {
    return;
  }

  try {
    const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const contacts = settings.trustedContacts.filter(c => c.id !== contactId);

    await chrome.storage.local.set({ trustedContacts: contacts });

    // Reload contacts
    await loadContacts();

    showAlert('success', 'Contact removed successfully!');
  } catch (error) {
    console.error('Failed to remove contact:', error);
    showAlert('danger', 'Failed to remove contact. Please try again.');
  }
}

// Start training
async function startTraining() {
  const scenarios = [
    {
      title: 'Tech Support Scam',
      difficulty: 'Easy',
      content: `
        <p style="font-size: 18px; color: #dc2626; font-weight: bold; margin-bottom: 16px;">
          ⚠️ CRITICAL SECURITY ALERT ⚠️
        </p>
        <p style="margin-bottom: 12px;">
          Your Windows computer has been infected with a Trojan virus! Your files will be encrypted in 24 hours!
        </p>
        <p style="margin-bottom: 12px;">
          Call Microsoft Support immediately at: <strong style="font-size: 24px;">1-888-555-0123</strong>
        </p>
        <p style="color: #dc2626;">
          DO NOT TURN OFF YOUR COMPUTER! Call now to prevent data loss!
        </p>
      `,
      redFlags: [
        'Creates false urgency ("24 hours", "immediately")',
        'Uses fear tactics ("infected", "encrypted")',
        'Impersonates legitimate company (Microsoft)',
        'Provides suspicious phone number',
        'Uses excessive punctuation and capital letters'
      ]
    },
    {
      title: 'Phishing Email',
      difficulty: 'Medium',
      content: `
        <p style="margin-bottom: 12px;"><strong>From:</strong> security@bankofamerica-secure.com</p>
        <p style="margin-bottom: 12px;"><strong>Subject:</strong> Unusual Activity Detected - Action Required</p>
        <hr style="margin: 16px 0;">
        <p style="margin-bottom: 12px;">Dear Valued Customer,</p>
        <p style="margin-bottom: 12px;">
          We detected unusual activity on your account. For your security, we have temporarily suspended your account.
        </p>
        <p style="margin-bottom: 12px;">
          Please verify your identity by clicking the link below within 24 hours to reactivate your account:
        </p>
        <p style="margin-bottom: 12px;">
          <a href="#" style="color: #0066cc;">Verify Account Now</a>
        </p>
        <p style="margin-bottom: 12px;">
          If you do not verify within 24 hours, your account will be permanently closed.
        </p>
        <p>Bank of America Security Team</p>
      `,
      redFlags: [
        'Suspicious sender domain (bankofamerica-secure.com vs bankofamerica.com)',
        'Creates urgency ("24 hours", "temporarily suspended")',
        'Requests account verification via email link',
        'Threatens account closure',
        'Generic greeting ("Dear Valued Customer")'
      ]
    },
    {
      title: 'Romance Scam',
      difficulty: 'Hard',
      content: `
        <p style="font-style: italic; margin-bottom: 12px;">From: Sarah Johnson (Online Dating)</p>
        <hr style="margin: 16px 0;">
        <p style="margin-bottom: 12px;">Hi sweetheart! 💕</p>
        <p style="margin-bottom: 12px;">
          I'm so sorry I haven't been able to video chat. I've been working on an oil rig in the North Sea and the internet is terrible here.
        </p>
        <p style="margin-bottom: 12px;">
          I have some wonderful news - I'll be coming to visit you in 2 weeks! I've saved up enough for the flight and I can't wait to finally meet you in person! ✈️
        </p>
        <p style="margin-bottom: 12px;">
          But I ran into a small problem... The company here requires workers to pay a $2,500 exit fee before leaving the rig. It's standard procedure but I didn't budget for it.
        </p>
        <p style="margin-bottom: 12px;">
          Could you help me with this? I promise I'll pay you back as soon as I land. I can't wait to hold you in my arms! We've been talking for 6 months and I really feel like you're my soulmate. ❤️
        </p>
        <p>All my love,<br>Sarah</p>
      `,
      redFlags: [
        'Avoids video chat with excuses',
        'Claims to work in remote location',
        'Builds emotional connection quickly ("soulmate")',
        'Creates urgent financial request',
        'Promises to pay back money',
        'Uses excessive emotions and emojis'
      ]
    }
  ];

  const container = document.getElementById('trainingScenarios');
  container.innerHTML = '';

  scenarios.forEach(scenario => {
    const scenarioDiv = document.createElement('div');
    scenarioDiv.className = 'training-scenario';

    scenarioDiv.innerHTML = `
      <div class="training-header">
        <div class="training-title">📚 ${scenario.title}</div>
        <div class="training-difficulty">${scenario.difficulty}</div>
      </div>

      <div class="training-content">
        ${scenario.content}
      </div>

      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <strong style="color: #dc2626; display: block; margin-bottom: 8px;">🚩 Red Flags to Identify:</strong>
        <ul style="margin-left: 20px; color: #374151;">
          ${scenario.redFlags.map(flag => `<li style="margin-bottom: 4px;">${flag}</li>`).join('')}
        </ul>
      </div>

      <div style="background: #d1fae5; padding: 16px; border-radius: 8px;">
        <strong style="color: #065f46; display: block; margin-bottom: 8px;">✅ What To Do:</strong>
        <ul style="margin-left: 20px; color: #065f46;">
          <li style="margin-bottom: 4px;">Do not respond or click any links</li>
          <li style="margin-bottom: 4px;">Do not provide personal information or money</li>
          <li style="margin-bottom: 4px;">Contact the organization directly using official channels</li>
          <li style="margin-bottom: 4px;">Report the scam attempt</li>
        </ul>
      </div>
    `;

    container.appendChild(scenarioDiv);
  });

  showAlert('success', 'Training scenarios loaded! Review each scenario to learn how to identify scams.');
}

// Show alert
function showAlert(type, message) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(alert, container.firstChild);

  // Remove after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Check URL parameters
function checkURLParameters() {
  const params = new URLSearchParams(window.location.search);

  if (params.has('section')) {
    const section = params.get('section');
    showSection(section);

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === section) {
        item.classList.add('active');
      }
    });
  }

  if (params.has('mode') && params.get('mode') === 'training') {
    showSection('training');
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.section === 'training') {
        item.classList.add('active');
      }
    });
    startTraining();
  }

  if (params.has('welcome')) {
    showWelcomeMessage();
  }
}

// Show welcome message
function showWelcomeMessage() {
  showAlert('success', 'Welcome to GuardianAI! Your protection is now active. Explore the dashboard to customize your settings.');
}
