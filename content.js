// GlobalRead - Content Script
// Handles page interactions and text selection

console.log('GlobalRead content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidebar') {
    handleOpenSidebar(request);
  }
});

// Handle opening sidebar with selected text
async function handleOpenSidebar(request) {
  let text = request.text;

  // If no text provided, get current selection
  if (request.getSelection || !text) {
    const selection = window.getSelection();
    text = selection.toString().trim();
  }

  // If still no text, get page content
  if (!text) {
    text = getPageContent();
  }

  // Store the text and feature for the sidebar to access
  await chrome.storage.local.set({
    pendingAction: {
      feature: request.feature,
      text: text,
      timestamp: Date.now()
    }
  });

  // Open the side panel
  chrome.runtime.sendMessage({ action: 'openSidePanel' });
}

// Extract main content from page
function getPageContent() {
  // Try to find main content area
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const content = article || main || document.body;

  // Get visible text content
  const textContent = content.innerText || content.textContent;

  // Limit to first 10000 characters to avoid overwhelming the AI
  return textContent.slice(0, 10000).trim();
}

// Add visual feedback for selected text
let selectionHighlight = null;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text && text.length > 10) {
    // Show subtle indicator that GlobalRead can work with this selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Remove existing highlight
    if (selectionHighlight) {
      selectionHighlight.remove();
    }

    // Create floating action button
    selectionHighlight = document.createElement('div');
    selectionHighlight.className = 'globalread-selection-actions';
    selectionHighlight.innerHTML = `
      <button class="globalread-action" data-action="summarize" title="Summarize">📝</button>
      <button class="globalread-action" data-action="translate" title="Translate">🌐</button>
      <button class="globalread-action" data-action="simplify" title="Simplify">💡</button>
    `;

    selectionHighlight.style.position = 'fixed';
    selectionHighlight.style.top = `${rect.top - 45}px`;
    selectionHighlight.style.left = `${rect.left + rect.width / 2}px`;
    selectionHighlight.style.transform = 'translateX(-50%)';

    document.body.appendChild(selectionHighlight);

    // Add click handlers
    selectionHighlight.querySelectorAll('.globalread-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        await handleOpenSidebar({ feature: action, text: text });
        selectionHighlight.remove();
        selectionHighlight = null;
      });
    });

    // Remove after 5 seconds or on next selection
    setTimeout(() => {
      if (selectionHighlight) {
        selectionHighlight.remove();
        selectionHighlight = null;
      }
    }, 5000);
  }
});

// Remove highlight when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (selectionHighlight && !selectionHighlight.contains(e.target)) {
    selectionHighlight.remove();
    selectionHighlight = null;
  }
});

// Inject floating button to quickly open GlobalRead
function injectQuickAccessButton() {
  const button = document.createElement('button');
  button.className = 'globalread-quick-access';
  button.innerHTML = '🌍';
  button.title = 'Open GlobalRead';
  button.onclick = () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  };
  document.body.appendChild(button);
}

// Inject button after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectQuickAccessButton);
} else {
  injectQuickAccessButton();
}
