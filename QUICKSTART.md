# 🚀 GuardianAI Quick Start Guide

Get GuardianAI running in **5 minutes**!

---

## Prerequisites Checklist

- [ ] Chrome 128+ (or Chrome Dev/Canary)
- [ ] Chrome AI features enabled (see below)
- [ ] 5 minutes of your time

---

## Step 1: Enable Chrome AI (2 minutes)

### Enable Required Flags

1. Open a new tab and go to: `chrome://flags`

2. Search for and enable these flags:
   - **Prompt API for Gemini Nano** → Set to **"Enabled"**
   - **Rewriter API** → Set to **"Enabled"**

3. Click the blue **"Relaunch"** button at the bottom

4. Wait for Chrome to restart

### Verify AI is Available

1. Open Chrome DevTools (Press F12)
2. Go to the **Console** tab
3. Paste this code and press Enter:

```javascript
ai.languageModel.capabilities().then(c => console.log(c))
```

4. You should see: `available: "readily"` or `available: "after-download"`

✅ If you see this, you're ready! If not, check the troubleshooting section below.

---

## Step 2: Load the Extension (1 minute)

1. **Open Chrome Extensions Page:**
   - Type `chrome://extensions/` in address bar
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner

3. **Load GuardianAI:**
   - Click **"Load unpacked"** button (top-left)
   - Navigate to the `automatic-octo-couscous` folder
   - Click **"Select Folder"**

4. **Verify Installation:**
   - GuardianAI should appear in the extension list
   - You should see the shield icon 🛡️
   - Status should be "On"

---

## Step 3: Test It! (2 minutes)

### Option A: Use the Demo Page

1. In the extension folder, find `demo-test-page.html`
2. Double-click to open it in Chrome
3. Try the test scenarios:
   - Click "Simulate Tech Support Scam" button
   - Try submitting the phishing form
   - Click the gift card payment button

**Expected:** GuardianAI should show warning overlays!

### Option B: Check the Popup

1. Click the GuardianAI shield icon in Chrome toolbar
2. You should see:
   - "Protection Active" status
   - Statistics (0 threats blocked initially)
   - Scan current page button

3. Click **"View Full Dashboard"** to see all features

---

## ✅ Success Indicators

You'll know GuardianAI is working when:

- ✅ Extension shows in Chrome toolbar with shield icon
- ✅ Popup opens when you click the icon
- ✅ Demo page triggers warning overlays
- ✅ Dashboard shows statistics
- ✅ Console shows: "GuardianAI protection active"

---

## 🎯 What to Do Next

### Try the Training Mode
1. Open dashboard (click extension icon → "View Full Dashboard")
2. Go to **"Training"** tab
3. Click **"Start New Training Scenario"**
4. Learn to identify real scam patterns!

### Add a Trusted Contact (Optional)
1. Open dashboard
2. Go to **"Trusted Contacts"** tab
3. Click **"Add Trusted Contact"**
4. Enter family member's information
5. Enable family alerts in Settings

### Browse Normally
GuardianAI now monitors in the background. Browse as usual - you'll be alerted if threats are detected!

---

## 🐛 Quick Troubleshooting

### "Could not load icon" Error

**Fix:** The icons weren't generated. Run:
```bash
python3 generate_icons.py
```

Then reload the extension.

### "AI capabilities not available"

**Possible causes:**

1. **Wrong Chrome version**
   - Need Chrome 128+ or Dev/Canary
   - Check: `chrome://version`

2. **Flags not enabled**
   - Verify flags at `chrome://flags`
   - Must be "Enabled" not "Default"
   - Relaunch Chrome after changing

3. **AI model downloading**
   - First time may take 10-30 minutes
   - Model downloads in background (~1-2GB)
   - Keep Chrome open
   - Check: `ai.languageModel.capabilities()`

### Extension Not Detecting Scams

**Check these:**

1. **Protection enabled?**
   - Click extension icon
   - Toggle should show "Protection Active"

2. **Content script loaded?**
   - Open DevTools Console (F12)
   - Should see: "GuardianAI protection active"

3. **Try the demo page**
   - Open `demo-test-page.html`
   - Should detect multiple threats

4. **Reload extension**
   - Go to `chrome://extensions/`
   - Click reload icon on GuardianAI

### Overlays Not Showing

1. **Test with demo page first** - some sites may have conflicts
2. **Check other extensions** - try disabling other extensions temporarily
3. **Try incognito mode** - enable extension in incognito and test

---

## 📚 Full Documentation

- **README.md** - Complete project overview and features
- **SETUP.md** - Detailed installation and configuration guide
- **DEVPOST.md** - Hackathon submission information

---

## 🆘 Still Need Help?

### Check Console for Errors
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for red error messages
4. Check background service worker:
   - `chrome://extensions/` → GuardianAI → "Details" → "Inspect views"

### Test Individual Components

**Test AI initialization:**
```javascript
// In DevTools Console
chrome.runtime.sendMessage({
  type: 'ANALYZE_TEXT',
  data: {
    text: 'URGENT! Call 1-888-555-1234 immediately! Your account will be suspended!',
    context: { source: 'test' }
  }
}, response => console.log(response));
```

Should return analysis with high threat level.

### Common Chrome Versions

- **Chrome Stable** (128+): Should work but AI features may be limited
- **Chrome Dev**: Best for testing, full AI support
- **Chrome Canary**: Latest features, may be unstable

Download: https://www.google.com/chrome/dev/

---

## 🎉 You're Protected!

GuardianAI is now running and protecting you from online scams!

**What's happening now:**
- 🔍 Every webpage is being analyzed
- 🛡️ Dangerous actions are being intercepted
- 📊 Statistics are being tracked
- 👨‍👩‍👧 Family alerts are ready (if configured)

**Remember:**
- GuardianAI works best when you also stay aware
- Complete training scenarios to improve your skills
- Add family contacts for extra safety
- Check dashboard weekly to review protection stats

---

**🛡️ Stay safe online! 🛡️**

Need more help? Check the full documentation or open an issue on GitHub.
