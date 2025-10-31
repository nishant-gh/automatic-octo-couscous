# GuardianAI Setup Guide

## Quick Start

Follow these steps to get GuardianAI running in 5 minutes!

---

## Prerequisites

### 1. Chrome Version

GuardianAI requires **Chrome 128 or higher** with Built-in AI features.

**Check your Chrome version:**
1. Open Chrome
2. Go to `chrome://version`
3. Check the first line for version number

**If you need Chrome Dev/Canary:**
- Download Chrome Dev: https://www.google.com/chrome/dev/
- Download Chrome Canary: https://www.google.com/chrome/canary/

### 2. Enable Chrome AI Features

**Enable Required Flags:**

1. Open `chrome://flags` in a new tab

2. Search for and enable these flags:
   - **"Prompt API for Gemini Nano"** → Set to "Enabled"
   - **"Rewriter API"** → Set to "Enabled"
   - **"Summarization API"** → Set to "Enabled" (optional)

3. Click "Relaunch" button at the bottom

4. Wait for Chrome to restart

**Verify AI is Available:**

Open DevTools Console (F12) and run:
```javascript
console.log(await ai.languageModel.capabilities());
```

If you see `available: "readily"` or `available: "after-download"`, you're good to go!

---

## Installation

### Method 1: Load Unpacked (Development)

1. **Download GuardianAI:**
   ```bash
   git clone https://github.com/yourusername/guardianai.git
   cd guardianai
   ```

2. **Open Chrome Extensions Page:**
   - Navigate to `chrome://extensions/`
   - Or: Menu → Extensions → Manage Extensions

3. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top right

4. **Load Extension:**
   - Click "Load unpacked" button
   - Select the `guardianai` folder
   - Extension should appear in the list

5. **Pin Extension (Optional):**
   - Click the puzzle icon in Chrome toolbar
   - Find "GuardianAI"
   - Click the pin icon to keep it visible

### Method 2: Install from CRX (Production)

1. Download `guardianai.crx` file
2. Open `chrome://extensions/`
3. Drag and drop the CRX file onto the page
4. Click "Add extension"

---

## First Launch

### Welcome Screen

On first install, GuardianAI automatically opens the welcome dashboard.

**Initial Configuration:**

1. **Protection Status:**
   - Protection is enabled by default
   - Toggle can be found in popup or dashboard

2. **Add Trusted Contacts (Optional but Recommended):**
   - Go to "Trusted Contacts" section
   - Click "Add Trusted Contact"
   - Fill in name, email, phone, relationship
   - Click "Save Contact"

3. **Try Training Mode:**
   - Go to "Training" section
   - Click "Start New Training Scenario"
   - Practice identifying scams

4. **Adjust Settings:**
   - Go to "Settings" section
   - Choose monitoring level (High recommended)
   - Enable/disable sound alerts
   - Enable/disable family alerts

---

## Testing the Extension

### 1. Open Demo Page

Open `demo-test-page.html` in Chrome to test all features:

```bash
# From guardianai directory
open demo-test-page.html
# or
chrome demo-test-page.html
```

### 2. Test Scenarios

Try each test on the demo page:

- [ ] Tech support scam pop-up
- [ ] Phishing login form
- [ ] Gift card payment request
- [ ] Urgency countdown timer
- [ ] Fake support phone number
- [ ] Remote access download
- [ ] Safe content (should NOT trigger)

### 3. Check Protection Status

**Via Popup:**
- Click GuardianAI icon in toolbar
- View current page status
- See statistics

**Via Dashboard:**
- Click "View Full Dashboard" in popup
- Or right-click icon → "Open Dashboard"
- Review detailed reports and statistics

---

## Verifying AI Functionality

### Check AI Initialization

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for message: `GuardianAI initialized successfully`

### Test AI Analysis

Open DevTools Console and run:

```javascript
// Get background service worker
chrome.runtime.sendMessage({
  type: 'ANALYZE_TEXT',
  data: {
    text: 'URGENT! Your account will be suspended! Call 1-888-555-1234 immediately!',
    context: { source: 'test' }
  }
}, response => console.log(response));
```

Expected result: High threat level with identified red flags.

---

## Troubleshooting

### Issue: "AI capabilities not available"

**Solutions:**

1. **Check Chrome version:**
   - Must be Chrome 128+
   - Or Chrome Dev/Canary

2. **Verify flags are enabled:**
   - Go to `chrome://flags`
   - Search "Prompt API"
   - Ensure it's "Enabled"
   - Restart Chrome

3. **Download AI model:**
   - Open DevTools Console
   - Run: `await ai.languageModel.capabilities()`
   - If shows `"after-download"`, the model needs to download
   - Keep Chrome open, model downloads in background (can take 10-30 minutes)

4. **Check disk space:**
   - AI model requires ~1-2GB
   - Ensure sufficient disk space

### Issue: Extension not loading

**Solutions:**

1. **Check for errors:**
   - Go to `chrome://extensions/`
   - Look for error messages under GuardianAI
   - Click "Details" → "Inspect views: service worker"

2. **Verify file structure:**
   ```
   guardianai/
   ├── manifest.json
   ├── guardian-ai.js
   ├── background.js
   ├── content.js
   ├── popup.html
   ├── popup.js
   ├── dashboard.html
   ├── dashboard.js
   ├── styles/
   │   └── content.css
   └── icons/
       └── (icon files)
   ```

3. **Reload extension:**
   - Go to `chrome://extensions/`
   - Click reload icon on GuardianAI card

### Issue: Not detecting scams

**Check:**

1. **Protection is enabled:**
   - Open popup
   - Verify toggle shows "Protection Active"

2. **Content script is injected:**
   - Open DevTools Console on test page
   - Look for: "GuardianAI protection active"

3. **Test with demo page:**
   - Use `demo-test-page.html`
   - Should detect multiple threats

4. **Check background service worker:**
   - Go to `chrome://extensions/`
   - GuardianAI → "Details" → "Inspect views: service worker"
   - Look for initialization messages

### Issue: Overlays not showing

**Solutions:**

1. **Check CSS injection:**
   - Verify `styles/content.css` exists
   - Content script should inject styles

2. **Check z-index conflicts:**
   - Some sites may have elements with very high z-index
   - GuardianAI uses `z-index: 2147483647` (maximum)

3. **Test in incognito:**
   - Enable extension in incognito mode
   - Test if overlays work there
   - May indicate conflict with other extensions

---

## Advanced Configuration

### Custom Scam Patterns

Edit `guardian-ai.js` to add custom patterns:

```javascript
loadScamPatterns() {
  return {
    urgencyKeywords: [
      'act now',
      'immediately',
      // Add your keywords here
    ],
    // ... other patterns
  };
}
```

### Adjust Detection Sensitivity

In `guardian-ai.js`, modify risk score thresholds:

```javascript
// Current default
requiresAIAnalysis: riskScore > 20

// Make more sensitive (more alerts)
requiresAIAnalysis: riskScore > 10

// Make less sensitive (fewer alerts)
requiresAIAnalysis: riskScore > 30
```

### Custom Intervention Messages

Edit intervention messages in `content.js`:

```javascript
showInterventionOverlay({
  message: 'Your custom warning message here',
  // ... other options
});
```

---

## Performance Optimization

### Reduce Memory Usage

1. **Limit report history:**
   - Default: 100 reports
   - Edit `guardian-ai.js` → `storeReport()` function
   - Change `reports.splice(100)` to lower number

2. **Adjust monitoring frequency:**
   - Default: checks every 5 seconds
   - Edit `content.js` → `monitoringInterval`
   - Increase interval for less frequent checks

### Improve Response Time

1. **Adjust pre-screening threshold:**
   - Higher threshold = less AI analysis = faster
   - Edit thresholds in `guardian-ai.js`

2. **Disable features you don't need:**
   - Turn off family alerts if not used
   - Disable sound alerts
   - Lower monitoring level

---

## Updating GuardianAI

### Check for Updates

```bash
cd guardianai
git pull origin main
```

### Reload Extension

1. Go to `chrome://extensions/`
2. Find GuardianAI
3. Click reload icon
4. Verify new version number

---

## Uninstalling

### Remove Extension

1. Go to `chrome://extensions/`
2. Find GuardianAI
3. Click "Remove"
4. Confirm removal

### Clear Data

Extension data is automatically removed when uninstalling. To manually clear:

```javascript
// Open DevTools Console on any page
chrome.storage.local.clear();
```

---

## Getting Help

### Documentation

- README.md - Project overview
- DEVPOST.md - Hackathon submission details
- This file - Setup instructions

### Support Channels

- **GitHub Issues**: Report bugs, request features
- **GitHub Discussions**: Ask questions, share tips
- **Email**: guardianai@example.com

### Common Questions

**Q: Does GuardianAI work on all websites?**
A: Yes, GuardianAI monitors all websites except Chrome's internal pages (chrome://).

**Q: Will it slow down my browsing?**
A: No, GuardianAI uses efficient pre-screening to minimize overhead. <100ms on most pages.

**Q: Does it work offline?**
A: Yes! All AI analysis happens locally. No internet required after initial setup.

**Q: Is my data safe?**
A: Absolutely. All analysis happens on your device. Nothing is sent to external servers.

**Q: Can I use it for my elderly parent?**
A: Yes! Install it on their computer and add yourself as a trusted contact for alerts.

---

## Next Steps

✅ Extension installed and working
✅ Tested with demo page
✅ Configured settings
✅ Added trusted contacts (optional)
✅ Tried training mode

**You're protected!** GuardianAI is now monitoring in the background.

**Recommended:**
- Complete all training scenarios
- Review dashboard weekly
- Keep extension updated
- Share with friends and family

---

**🛡️ Stay safe online! 🛡️**
