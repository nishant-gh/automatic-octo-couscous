/**
 * GuardianAI Content Script
 * Monitors page content and user interactions for scam indicators
 */

// State
let protectionActive = true;
let currentOverlay = null;
let monitoringInterval = null;

// Initialize
initialize();

async function initialize() {
  console.log('GuardianAI content script loaded');

  // Check protection status
  const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  protectionActive = settings.protectionEnabled;

  if (protectionActive) {
    // Start page monitoring
    startPageMonitoring();

    // Monitor user interactions
    monitorUserInteractions();

    // Analyze initial page load
    analyzeCurrentPage();
  }
}

// Start continuous page monitoring
function startPageMonitoring() {
  // Monitor DOM changes
  const observer = new MutationObserver((mutations) => {
    handleDOMChanges(mutations);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Periodic check for dynamic content
  monitoringInterval = setInterval(() => {
    checkForDynamicThreats();
  }, 5000);
}

// Handle DOM changes
function handleDOMChanges(mutations) {
  for (const mutation of mutations) {
    // Check for suspicious pop-ups
    if (mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          checkElementForThreats(node);
        }
      });
    }
  }
}

// Check element for threat indicators
function checkElementForThreats(element) {
  // Check for unclosable popups
  if (isUnclosablePopup(element)) {
    flagThreat('unclosable-popup', element);
  }

  // Check for fake security alerts
  if (isFakeSecurityAlert(element)) {
    flagThreat('fake-security-alert', element);
  }

  // Check for countdown timers (urgency tactic)
  if (hasCountdownTimer(element)) {
    flagThreat('countdown-timer', element);
  }

  // Check for prominent phone numbers (tech support scam)
  if (hasProminentPhoneNumber(element)) {
    flagThreat('tech-support-scam', element);
  }
}

// Detect unclosable popup
function isUnclosablePopup(element) {
  const styles = window.getComputedStyle(element);

  // Check for overlay that covers full screen
  if (styles.position === 'fixed' || styles.position === 'absolute') {
    const rect = element.getBoundingClientRect();

    if (rect.width > window.innerWidth * 0.8 &&
        rect.height > window.innerHeight * 0.8) {

      // Check if has close button
      const hasCloseButton = element.querySelector('[class*="close"], [aria-label*="close"], button[title*="close"]');

      if (!hasCloseButton) {
        return true;
      }
    }
  }

  return false;
}

// Detect fake security alert
function isFakeSecurityAlert(element) {
  const text = element.innerText?.toLowerCase() || '';

  const fakeSecurityPhrases = [
    'your computer is infected',
    'virus detected',
    'call this number immediately',
    'microsoft has blocked',
    'your system is at risk',
    'trojan detected'
  ];

  return fakeSecurityPhrases.some(phrase => text.includes(phrase));
}

// Detect countdown timer
function hasCountdownTimer(element) {
  const text = element.innerText?.toLowerCase() || '';

  return (
    (text.includes('offer expires') || text.includes('time left')) &&
    /\d{1,2}:\d{2}/.test(text) // Contains time format
  );
}

// Detect prominent phone number
function hasProminentPhoneNumber(element) {
  const text = element.innerText || '';
  const phonePattern = /1-?8\d{2}-?\d{3}-?\d{4}/;

  if (phonePattern.test(text)) {
    // Check if phone number is in large text
    const styles = window.getComputedStyle(element);
    const fontSize = parseInt(styles.fontSize);

    if (fontSize > 24) {
      return true;
    }
  }

  return false;
}

// Flag potential threat
async function flagThreat(type, element) {
  console.log('Threat flagged:', type);

  // Analyze with backend
  const analysis = await chrome.runtime.sendMessage({
    type: 'ANALYZE_TEXT',
    data: {
      text: element.innerText || '',
      context: {
        source: 'dom-element',
        threatType: type
      }
    }
  });

  if (analysis.success && analysis.analysis.threatLevel !== 'safe') {
    // Highlight suspicious element
    highlightSuspiciousElement(element);
  }
}

// Highlight suspicious element
function highlightSuspiciousElement(element) {
  element.style.outline = '3px solid #f59e0b';
  element.style.opacity = '0.5';

  // Add warning badge
  const badge = document.createElement('div');
  badge.textContent = '⚠️ SUSPICIOUS';
  badge.style.cssText = `
    position: absolute;
    top: 0;
    right: 0;
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
  `;

  element.style.position = 'relative';
  element.appendChild(badge);
}

// Check for dynamic threats
async function checkForDynamicThreats() {
  const visualContext = analyzeVisualContext();

  if (visualContext.riskScore > 0) {
    const analysis = await chrome.runtime.sendMessage({
      type: 'ANALYZE_PAGE',
      data: {
        pageContent: extractPageContent(),
        visualContext
      }
    });

    if (analysis.success && analysis.analysis.threatLevel === 'danger') {
      showDangerOverlay(analysis.analysis);
    }
  }
}

// Analyze visual context
function analyzeVisualContext() {
  const context = {
    riskScore: 0,
    hasFakeSecurityBadges: false,
    hasCountdownTimer: false,
    hasUnclosablePopup: false,
    exclamationCount: 0,
    hasProminentPhoneNumber: false
  };

  const bodyText = document.body.innerText;

  // Count exclamation marks
  context.exclamationCount = (bodyText.match(/!/g) || []).length;
  if (context.exclamationCount > 5) context.riskScore += 10;

  // Check for countdown timer
  if (/\d{1,2}:\d{2}:\d{2}/.test(bodyText)) {
    context.hasCountdownTimer = true;
    context.riskScore += 15;
  }

  // Check for phone numbers
  if (/1-?8\d{2}-?\d{3}-?\d{4}/.test(bodyText)) {
    context.hasProminentPhoneNumber = true;
    context.riskScore += 20;
  }

  // Check for security badge images
  const images = document.querySelectorAll('img[src*="secure"], img[src*="ssl"], img[alt*="secure"]');
  if (images.length > 3) {
    context.hasFakeSecurityBadges = true;
    context.riskScore += 15;
  }

  return context;
}

// Extract page content
function extractPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    text: document.body.innerText.substring(0, 10000), // Limit text size
    forms: Array.from(document.querySelectorAll('form')).map(form => ({
      action: form.action,
      method: form.method,
      inputs: Array.from(form.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        required: input.required
      }))
    })),
    buttons: Array.from(document.querySelectorAll('button, input[type="submit"]')).map(btn => btn.innerText)
  };
}

// Monitor user interactions
function monitorUserInteractions() {
  // Monitor form submissions
  document.addEventListener('submit', handleFormSubmit, true);

  // Monitor clicks on external links
  document.addEventListener('click', handleClick, true);

  // Monitor input into sensitive fields
  document.addEventListener('input', handleInput, true);

  // Monitor paste events (password managers)
  document.addEventListener('paste', handlePaste, true);
}

// Handle form submission
async function handleFormSubmit(event) {
  const form = event.target;

  // Extract form data
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  // Check if contains sensitive information
  const hasSensitiveData = Object.keys(data).some(key =>
    /password|ssn|social|credit|card|account|routing/i.test(key)
  );

  if (hasSensitiveData) {
    event.preventDefault();

    // Analyze form action
    const analysis = await chrome.runtime.sendMessage({
      type: 'ANALYZE_TEXT',
      data: {
        text: `Form submission to: ${form.action}\nForm fields: ${Object.keys(data).join(', ')}`,
        context: {
          source: 'form-submission',
          url: form.action
        }
      }
    });

    if (analysis.success && analysis.analysis.threatLevel === 'danger') {
      showInterventionOverlay({
        type: 'form-submission',
        message: 'This form is requesting sensitive information. Are you sure this is a legitimate website?',
        analysis: analysis.analysis
      });
    } else {
      // Pause and confirm
      const confirmed = await showConfirmationDialog(
        'You are about to submit sensitive information. Have you verified this website is legitimate?'
      );

      if (confirmed) {
        form.submit();
      }
    }
  }
}

// Handle click events
async function handleClick(event) {
  const target = event.target.closest('a, button');

  if (!target) return;

  // Check for download links
  if (target.tagName === 'A' && target.hasAttribute('download')) {
    const fileName = target.getAttribute('download') || target.href.split('/').pop();

    // Check for suspicious downloads
    if (/teamviewer|anydesk|remote|exe|msi/i.test(fileName)) {
      event.preventDefault();

      showInterventionOverlay({
        type: 'dangerous-download',
        message: 'This file could give someone remote access to your computer. Only download if you trust the source.',
        fileName
      });
    }
  }

  // Check for external links
  if (target.tagName === 'A' && target.href) {
    const currentDomain = window.location.hostname;
    const linkDomain = new URL(target.href).hostname;

    if (linkDomain !== currentDomain) {
      // Analyze link
      const analysis = await chrome.runtime.sendMessage({
        type: 'ANALYZE_TEXT',
        data: {
          text: `External link: ${target.href}\nLink text: ${target.innerText}`,
          context: {
            source: 'external-link'
          }
        }
      });

      if (analysis.success && analysis.analysis.threatLevel === 'danger') {
        event.preventDefault();

        showWarningOverlay({
          type: 'dangerous-link',
          message: 'This link may lead to a scam website.',
          link: target.href,
          analysis: analysis.analysis
        });
      }
    }
  }
}

// Handle input events
function handleInput(event) {
  const input = event.target;

  // Warn if entering sensitive data
  if (input.type === 'password' ||
      /password|ssn|social|credit|card/i.test(input.name || input.id)) {

    // Check if on HTTPS
    if (window.location.protocol !== 'https:') {
      showWarningBadge(input, 'Not secure connection');
    }
  }
}

// Handle paste events
function handlePaste(event) {
  const input = event.target;

  // Check if pasting into password field on suspicious site
  if (input.type === 'password') {
    // Check page legitimacy
    checkPageLegitimacy();
  }
}

// Check page legitimacy
async function checkPageLegitimacy() {
  const pageContent = extractPageContent();

  const analysis = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PAGE',
    data: {
      pageContent,
      visualContext: analyzeVisualContext()
    }
  });

  if (analysis.success && analysis.analysis.threatLevel !== 'safe') {
    showPersistentWarningBadge(analysis.analysis);
  }
}

// Show intervention overlay
function showInterventionOverlay(intervention) {
  // Remove existing overlay
  if (currentOverlay) {
    currentOverlay.remove();
  }

  // Create full-screen overlay
  const overlay = document.createElement('div');
  overlay.id = 'guardianai-intervention';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(220, 38, 38, 0.95);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 40px;
    border-radius: 16px;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  content.innerHTML = `
    <div style="font-size: 80px; margin-bottom: 20px;">🛡️</div>
    <h1 style="color: #dc2626; font-size: 32px; margin-bottom: 20px; font-weight: 700;">
      GuardianAI Protection
    </h1>
    <p style="font-size: 20px; color: #374151; margin-bottom: 30px; line-height: 1.6;">
      ${intervention.message}
    </p>
    ${intervention.analysis ? `
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
        <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">⚠️ Warning Signs:</h3>
        <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
          ${intervention.analysis.redFlags.map(flag => `<li>${flag}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div style="display: flex; gap: 16px; justify-content: center;">
      <button id="guardianai-proceed" style="
        background: #6b7280;
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 18px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">I Understand, Proceed Anyway</button>
      <button id="guardianai-stop" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 18px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">Stop & Go Back</button>
    </div>
    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
      Call a trusted family member if you're unsure
    </p>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);
  currentOverlay = overlay;

  // Add event listeners
  document.getElementById('guardianai-stop').addEventListener('click', () => {
    overlay.remove();
    currentOverlay = null;
    window.history.back();
  });

  document.getElementById('guardianai-proceed').addEventListener('click', () => {
    overlay.remove();
    currentOverlay = null;
  });
}

// Show danger overlay
function showDangerOverlay(analysis) {
  showInterventionOverlay({
    type: 'danger',
    message: 'This page shows signs of being a scam. We recommend closing this tab immediately.',
    analysis
  });
}

// Show warning overlay
function showWarningOverlay(warning) {
  // Create warning banner at top of page
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #f59e0b;
    color: white;
    padding: 16px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  banner.innerHTML = `
    ⚠️ ${warning.message}
    <button id="guardianai-dismiss" style="
      background: white;
      color: #f59e0b;
      border: none;
      padding: 8px 16px;
      margin-left: 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    ">Dismiss</button>
  `;

  document.body.appendChild(banner);

  document.getElementById('guardianai-dismiss').addEventListener('click', () => {
    banner.remove();
  });
}

// Show warning badge
function showWarningBadge(element, message) {
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: absolute;
    background: #f59e0b;
    color: white;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
    font-weight: 600;
    z-index: 10000;
  `;
  badge.textContent = message;

  element.style.position = 'relative';
  element.parentElement.appendChild(badge);

  setTimeout(() => badge.remove(), 5000);
}

// Show persistent warning badge
function showPersistentWarningBadge(analysis) {
  const badge = document.createElement('div');
  badge.id = 'guardianai-persistent-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    z-index: 999997;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  badge.innerHTML = `
    🛡️ GuardianAI: ${analysis.threatLevel === 'danger' ? 'DANGER' : 'WARNING'}
    <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">
      ${analysis.explanation || 'Suspicious activity detected'}
    </div>
  `;

  document.body.appendChild(badge);

  setTimeout(() => badge.remove(), 10000);
}

// Show confirmation dialog
function showConfirmationDialog(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="background: white; padding: 32px; border-radius: 12px; max-width: 500px; text-align: center;">
        <p style="font-size: 18px; color: #374151; margin-bottom: 24px; line-height: 1.6;">
          ${message}
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="confirm-yes" style="
            background: #059669;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Yes, Continue</button>
          <button id="confirm-no" style="
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">No, Go Back</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    document.getElementById('confirm-yes').addEventListener('click', () => {
      dialog.remove();
      resolve(true);
    });

    document.getElementById('confirm-no').addEventListener('click', () => {
      dialog.remove();
      resolve(false);
    });
  });
}

// Analyze current page on load
async function analyzeCurrentPage() {
  // Wait for page to be fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', analyzeCurrentPage);
    return;
  }

  const pageContent = extractPageContent();
  const visualContext = analyzeVisualContext();

  const analysis = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PAGE',
    data: {
      pageContent,
      visualContext
    }
  });

  if (analysis.success && analysis.analysis.threatLevel === 'danger') {
    showDangerOverlay(analysis.analysis);
  } else if (analysis.success && analysis.analysis.threatLevel === 'suspicious') {
    showPersistentWarningBadge(analysis.analysis);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SHOW_DANGER_OVERLAY':
      showInterventionOverlay({
        type: message.reason,
        message: message.message
      });
      break;

    case 'PLAY_ALERT_SOUND':
      playAlertSound(message.threatLevel);
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
});

// Play alert sound
function playAlertSound(threatLevel) {
  // Create audio context and play tone
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Different tones for different threat levels
  oscillator.frequency.value = threatLevel === 'danger' ? 880 : 440;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

console.log('GuardianAI protection active');
