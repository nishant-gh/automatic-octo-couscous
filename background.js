/**
 * GuardianAI Background Service Worker
 * Coordinates scam detection and user protection
 */

importScripts('guardian-ai.js');

// Global state
let guardianAI = null;
let protectionEnabled = true;
let trustedContacts = [];

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('GuardianAI installed:', details.reason);

  // Set default settings
  await chrome.storage.local.set({
    protectionEnabled: true,
    trustedContacts: [],
    familyAlertsEnabled: false,
    trainingMode: false,
    scamReports: [],
    settings: {
      monitoringLevel: 'high', // low, medium, high
      interventionDelay: 5, // seconds before showing warning
      notifyFamily: false,
      soundAlerts: true,
      visualAlerts: true
    }
  });

  // Initialize GuardianAI
  await initializeGuardianAI();

  // Show welcome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'GuardianAI Protection Activated',
    message: 'You are now protected against online scams. Click to learn more.',
    priority: 2
  });

  // Open welcome page
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'dashboard.html?welcome=true' });
  }
});

// Initialize GuardianAI instance
async function initializeGuardianAI() {
  try {
    guardianAI = new GuardianAI();
    await guardianAI.initialize();

    if (guardianAI.aiAvailable) {
      console.log('✅ GuardianAI initialized with full AI capabilities');
    } else {
      console.log('⚠️ GuardianAI initialized with pattern-based detection only');

      // Show notification about AI features
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'GuardianAI: Limited Mode',
        message: 'Chrome AI not available. Using pattern detection. Click for setup instructions.',
        priority: 1,
        requireInteraction: true
      });

      // Open setup guide when notification clicked
      chrome.notifications.onClicked.addListener(() => {
        chrome.tabs.create({ url: 'dashboard.html?setup=ai' });
      });
    }
  } catch (error) {
    console.error('Failed to initialize GuardianAI:', error);

    // Should not reach here with updated graceful fallback
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'GuardianAI Error',
      message: 'Unexpected initialization error. Extension may not work correctly.',
      priority: 2
    });
  }
}

// Ensure GuardianAI is initialized
async function ensureInitialized() {
  if (!guardianAI) {
    await initializeGuardianAI();
  }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

// Handle messages
async function handleMessage(message, sender) {
  await ensureInitialized();

  switch (message.type) {
    case 'ANALYZE_TEXT':
      return await analyzeText(message.data, sender);

    case 'ANALYZE_PAGE':
      return await analyzePage(message.data, sender);

    case 'CHECK_ACTION':
      return await checkAction(message.data, sender);

    case 'GET_STATISTICS':
      return await guardianAI.getStatistics();

    case 'GET_SETTINGS':
      return await getSettings();

    case 'UPDATE_SETTINGS':
      return await updateSettings(message.data);

    case 'ADD_TRUSTED_CONTACT':
      return await addTrustedContact(message.data);

    case 'NOTIFY_FAMILY':
      return await notifyFamily(message.data);

    case 'DISMISS_WARNING':
      return await dismissWarning(message.data);

    case 'REPORT_SCAM':
      return await reportScam(message.data);

    default:
      return { error: 'Unknown message type' };
  }
}

// Analyze text content
async function analyzeText(data, sender) {
  const { text, context } = data;

  try {
    const analysis = await guardianAI.analyzeText(text, {
      ...context,
      url: sender.tab?.url,
      tabId: sender.tab?.id
    });

    // Generate report
    await guardianAI.generateReport(analysis, {
      type: 'text',
      source: context.source || 'unknown',
      url: sender.tab?.url
    });

    // Check if intervention needed
    if (analysis.threatLevel === 'danger' || analysis.threatLevel === 'suspicious') {
      await handleThreatDetected(analysis, sender.tab);
    }

    return { success: true, analysis };
  } catch (error) {
    console.error('Text analysis failed:', error);
    return { success: false, error: error.message };
  }
}

// Analyze full page
async function analyzePage(data, sender) {
  const { pageContent, visualContext } = data;

  try {
    // Analyze text content
    const textAnalysis = await guardianAI.analyzeText(pageContent.text, {
      title: pageContent.title,
      url: pageContent.url,
      forms: pageContent.forms,
      buttons: pageContent.buttons
    });

    // Analyze visual elements
    const visualAnalysis = await guardianAI.analyzeVisual(null, visualContext);

    // Combine analyses
    const combinedThreatLevel = getCombinedThreatLevel(
      textAnalysis.threatLevel,
      visualAnalysis.threatLevel
    );

    const analysis = {
      threatLevel: combinedThreatLevel,
      textAnalysis,
      visualAnalysis,
      combinedRedFlags: [
        ...textAnalysis.redFlags,
        ...visualAnalysis.redFlags
      ]
    };

    // Generate report
    await guardianAI.generateReport(analysis, {
      type: 'page',
      url: pageContent.url
    });

    // Handle threats
    if (combinedThreatLevel === 'danger' || combinedThreatLevel === 'suspicious') {
      await handleThreatDetected(analysis, sender.tab);
    }

    return { success: true, analysis };
  } catch (error) {
    console.error('Page analysis failed:', error);
    return { success: false, error: error.message };
  }
}

// Check if action should be blocked
async function checkAction(data, sender) {
  const { action } = data;

  try {
    const intervention = await guardianAI.analyzeAction(action);

    if (intervention.shouldIntervene) {
      // Log intervention
      await logIntervention(action, intervention, sender.tab);

      // Notify family if enabled
      const settings = await getSettings();
      if (settings.familyAlertsEnabled) {
        await notifyFamily({
          type: 'dangerous-action',
          action: action.type,
          url: sender.tab?.url
        });
      }
    }

    return { success: true, intervention };
  } catch (error) {
    console.error('Action check failed:', error);
    return { success: false, error: error.message };
  }
}

// Get combined threat level
function getCombinedThreatLevel(level1, level2) {
  const levels = { safe: 0, suspicious: 1, danger: 2 };
  const max = Math.max(levels[level1] || 0, levels[level2] || 0);

  return Object.keys(levels).find(key => levels[key] === max);
}

// Handle threat detected
async function handleThreatDetected(analysis, tab) {
  // Play alert sound if enabled
  const settings = await getSettings();
  if (settings.soundAlerts) {
    // Chrome doesn't support audio in service workers
    // Send message to content script to play sound
    chrome.tabs.sendMessage(tab.id, {
      type: 'PLAY_ALERT_SOUND',
      threatLevel: analysis.threatLevel
    });
  }

  // Show notification
  const notificationMessage = analysis.threatLevel === 'danger'
    ? '🛡️ DANGER: Potential scam detected on this page!'
    : '⚠️ WARNING: Suspicious content detected.';

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'GuardianAI Protection',
    message: notificationMessage,
    priority: 2
  });

  // Update badge
  chrome.action.setBadgeText({
    text: analysis.threatLevel === 'danger' ? '!' : '?',
    tabId: tab.id
  });

  chrome.action.setBadgeBackgroundColor({
    color: analysis.threatLevel === 'danger' ? '#dc2626' : '#f59e0b',
    tabId: tab.id
  });

  // Notify family if enabled and threat is danger
  if (settings.familyAlertsEnabled && analysis.threatLevel === 'danger') {
    await notifyFamily({
      type: 'threat-detected',
      threatLevel: analysis.threatLevel,
      scamType: analysis.scamType || analysis.textAnalysis?.scamType,
      url: tab.url,
      timestamp: new Date().toISOString()
    });
  }
}

// Log intervention
async function logIntervention(action, intervention, tab) {
  try {
    const stored = await chrome.storage.local.get(['interventions']);
    const interventions = stored.interventions || [];

    interventions.unshift({
      timestamp: new Date().toISOString(),
      action: action.type,
      intervention: intervention.level,
      url: tab?.url
    });

    // Keep last 50 interventions
    if (interventions.length > 50) {
      interventions.splice(50);
    }

    await chrome.storage.local.set({ interventions });
  } catch (error) {
    console.error('Failed to log intervention:', error);
  }
}

// Get settings
async function getSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'protectionEnabled',
      'trustedContacts',
      'familyAlertsEnabled',
      'settings'
    ]);

    return {
      protectionEnabled: stored.protectionEnabled ?? true,
      trustedContacts: stored.trustedContacts || [],
      familyAlertsEnabled: stored.familyAlertsEnabled || false,
      ...stored.settings
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return {};
  }
}

// Update settings
async function updateSettings(newSettings) {
  try {
    const current = await getSettings();
    const updated = { ...current, ...newSettings };

    await chrome.storage.local.set({
      protectionEnabled: updated.protectionEnabled,
      familyAlertsEnabled: updated.familyAlertsEnabled,
      settings: updated
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: error.message };
  }
}

// Add trusted contact
async function addTrustedContact(contact) {
  try {
    const settings = await getSettings();
    const contacts = settings.trustedContacts || [];

    contacts.push({
      id: Date.now().toString(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      relationship: contact.relationship,
      addedAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ trustedContacts: contacts });

    return { success: true };
  } catch (error) {
    console.error('Failed to add contact:', error);
    return { success: false, error: error.message };
  }
}

// Notify family (simplified version - in production would use Firebase)
async function notifyFamily(alert) {
  try {
    const settings = await getSettings();

    if (!settings.familyAlertsEnabled || !settings.trustedContacts?.length) {
      return { success: false, reason: 'Family alerts not configured' };
    }

    // Store alert for family dashboard access
    const stored = await chrome.storage.local.get(['familyAlerts']);
    const alerts = stored.familyAlerts || [];

    alerts.unshift({
      id: Date.now().toString(),
      ...alert,
      notifiedContacts: settings.trustedContacts.map(c => c.id)
    });

    // Keep last 20 alerts
    if (alerts.length > 20) {
      alerts.splice(20);
    }

    await chrome.storage.local.set({ familyAlerts: alerts });

    // In production, this would send email/SMS via Firebase Functions
    console.log('Family alert created:', alert);

    return { success: true, alertId: alerts[0].id };
  } catch (error) {
    console.error('Failed to notify family:', error);
    return { success: false, error: error.message };
  }
}

// Dismiss warning
async function dismissWarning(data) {
  const { warningId, feedback } = data;

  // Log dismissal for learning
  try {
    const stored = await chrome.storage.local.get(['dismissals']);
    const dismissals = stored.dismissals || [];

    dismissals.push({
      warningId,
      feedback,
      timestamp: new Date().toISOString()
    });

    await chrome.storage.local.set({ dismissals });

    return { success: true };
  } catch (error) {
    console.error('Failed to log dismissal:', error);
    return { success: false, error: error.message };
  }
}

// Report scam
async function reportScam(data) {
  const { url, description, evidence } = data;

  // Store report
  try {
    const stored = await chrome.storage.local.get(['userReports']);
    const reports = stored.userReports || [];

    reports.unshift({
      id: Date.now().toString(),
      url,
      description,
      evidence,
      timestamp: new Date().toISOString(),
      status: 'submitted'
    });

    await chrome.storage.local.set({ userReports: reports });

    // In production, would submit to central database
    console.log('Scam reported:', data);

    return { success: true };
  } catch (error) {
    console.error('Failed to report scam:', error);
    return { success: false, error: error.message };
  }
}

// Tab monitoring
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Reset badge when navigating to new page
    chrome.action.setBadgeText({ text: '', tabId });

    // Check if URL is in known scam database
    const isKnownScam = await checkKnownScamDatabase(tab.url);

    if (isKnownScam) {
      // Immediately alert
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_DANGER_OVERLAY',
        reason: 'known-scam',
        message: 'This website is a known scam. Close this tab immediately!'
      });
    }
  }
});

// Check known scam database (simplified)
async function checkKnownScamDatabase(url) {
  // In production, would check against maintained database
  const knownScamPatterns = [
    /free-iphone/i,
    /claim.*prize/i,
    /microsoft.*support/i,
    /geek.*squad.*refund/i
  ];

  return knownScamPatterns.some(pattern => pattern.test(url));
}

// Periodic statistics update
chrome.alarms.create('update-statistics', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'update-statistics') {
    await ensureInitialized();
    const stats = await guardianAI.getStatistics();
    await chrome.storage.local.set({ cachedStatistics: stats });
  }
});

console.log('GuardianAI background service worker loaded');
