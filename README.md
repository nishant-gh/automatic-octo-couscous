# 🛡️ GuardianAI - Anti-Scam Shield for Elderly Users

<div align="center">

**Winner Candidate for Google Chrome AI 2025 Hackathon**

*Protecting elderly users from online scams using Chrome's Built-in AI*

[Live Demo](#demo-scenarios) • [Features](#key-features) • [Installation](#installation) • [How It Works](#how-it-works)

</div>

---

## 🎯 The Problem

Elderly people lose **$28+ billion annually** to online scams. They face:
- Tech support scams with fake pop-ups
- Phishing emails pretending to be banks
- Romance scams asking for money
- Grandparent emergency scams
- IRS/Social Security impersonation

**Traditional solutions fail because:**
- Complex interfaces confuse elderly users
- Cloud-based detection compromises privacy
- No real-time multimodal analysis
- Lack of intervention before damage occurs

## 💡 Our Solution

**GuardianAI** is a Chrome extension that uses **Chrome's Built-in AI APIs** to provide:

✅ **Real-time scam detection** across text, images, and behavior
✅ **Privacy-first** - All analysis happens locally on device
✅ **Multimodal protection** - Analyzes content in multiple ways
✅ **Proactive intervention** - Blocks dangerous actions before they occur
✅ **Family safety network** - Alerts trusted contacts about threats
✅ **Educational training** - Safe environment to learn scam recognition

---

## 🚀 Key Features

### 1. Real-Time Multi-Layer Scam Detection

#### 📝 Text Analysis
- Detects urgency tactics ("act now", "limited time")
- Identifies emotional manipulation
- Flags authority impersonation (IRS, Microsoft, banks)
- Catches suspicious financial requests (gift cards, wire transfers)

#### 🖼️ Visual Analysis
- Identifies fake security badges
- Detects countdown timers (urgency tactic)
- Flags unclosable pop-ups
- Recognizes tech support scam screens

#### 🎯 Behavioral Protection
- **Wire Transfer Blocker** - Pauses suspicious money transfers
- **Gift Card Alert** - Warns that legitimate companies never accept gift cards
- **Remote Access Prevention** - Blocks dangerous downloads (TeamViewer, AnyDesk)
- **Password Sharing Warning** - Prevents credential theft

### 2. Protective Intervention System

When danger is detected, GuardianAI shows a full-screen overlay that:
1. Blocks the threat immediately
2. Explains the scam in simple, clear language
3. Lists specific red flags found
4. Provides recommended actions
5. Requires confirmation to proceed

### 3. Trust Network & Family Alerts

**Family Guardian Mode:**
- Add trusted family members
- Automatic alerts for dangerous threats
- Review activity reports
- Monitor elderly loved ones

### 4. Scam Recognition Training

**Safe Learning Environment:**
- Realistic but harmless scam scenarios
- Interactive red flag identification
- Builds pattern recognition skills
- Three difficulty levels

**Training Scenarios:**
- Tech support scams
- Phishing emails
- Romance scams
- Government impersonation

### 5. Comprehensive Dashboard

Track your protection with:
- Total scans performed
- Threats blocked
- Recent activity log
- Detailed reports
- Settings management

---

## 🏆 Why This Wins the Hackathon

### Perfect Use of Chrome Built-in AI

**Prompt API for Scam Detection:**
```javascript
const session = await ai.languageModel.create({
  systemPrompt: `You are GuardianAI, specialized in identifying scams
  targeting elderly users. Analyze for urgency tactics, emotional
  manipulation, authority impersonation, and financial requests.`
});
```

**Rewriter API for Simple Explanations:**
```javascript
const simplified = await rewriterSession.rewrite(explanation, {
  tone: 'casual',
  length: 'short',
  context: 'Explain to elderly person in simple terms'
});
```

**Local-First Architecture:**
- All sensitive data stays on device
- No cloud processing = maximum privacy
- Fast analysis without network latency

### Competitive Advantages

| Feature | GuardianAI | Traditional Solutions |
|---------|------------|----------------------|
| Real-time AI analysis | ✅ | ❌ |
| Multimodal detection | ✅ | ❌ |
| Behavioral intervention | ✅ | ❌ |
| Privacy-first (local AI) | ✅ | ❌ |
| Elderly-friendly UI | ✅ | ❌ |
| Family safety network | ✅ | ❌ |
| Educational training | ✅ | ❌ |

### Real-World Impact

**Measurable Outcomes:**
- Number of scams prevented
- Dollar amount protected
- User confidence increase
- Family peace of mind

**Target Users:**
- 50+ million elderly internet users in US
- Senior living facilities
- Adult children of elderly parents

---

## 🛠️ Technical Architecture

### Technology Stack

- Chrome Extension (Manifest V3)
- Chrome Built-in AI APIs (Prompt API, Rewriter API)
- Local Storage for privacy
- Pure JavaScript - no build step required

### Key Components

1. **guardian-ai.js** - Core AI logic using Chrome's Prompt API
2. **background.js** - Service worker coordinating protection
3. **content.js** - Real-time page monitoring and intervention
4. **Dashboard** - Full user interface with statistics and training

---

## 📦 Installation

### Requirements

- Chrome 128+ with Built-in AI features enabled
- Enable flags:
  - `chrome://flags` → "Prompt API for Gemini Nano"
  - `chrome://flags` → "Rewriter API"

### Setup

1. Clone or download this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the GuardianAI folder
6. Extension is ready!

### Initial Configuration

1. Extension auto-opens welcome dashboard
2. Protection is enabled by default
3. (Optional) Add trusted contacts for family alerts
4. Try the training mode to learn scam patterns

---

## 🎮 Demo Scenarios

### Scenario 1: Tech Support Scam

**Situation:** Fake "virus detected" pop-up appears

**GuardianAI Response:**
```
🛡️ DANGER: This is a tech support scam!

⚠️ Warning Signs:
• Fake Microsoft branding
• Suspicious phone number
• Creates false urgency
• Cannot close normally

Action: Close this tab immediately
```

### Scenario 2: Phishing Email

**Situation:** User clicks "verify bank account" link

**GuardianAI Response:**
```
⚠️ WARNING: Suspicious Login Form

This site is asking for banking credentials, but:
• URL doesn't match your bank
• No proper SSL certificate
• Form sends data to suspicious server

STOP: Do not enter your password!
Close this page and use your bank's official app.
```

### Scenario 3: Gift Card Payment

**Situation:** Site requests payment via gift cards

**GuardianAI Response:**
```
🛡️ CRITICAL WARNING

You are about to purchase gift cards as payment.

IMPORTANT: Legitimate companies NEVER accept
gift cards as payment!

This is always a scam. Gift cards are untraceable.

[Go Back] [Contact Family]
```

---

## 📊 How It Works

### Detection Pipeline

```
Page Load
   ↓
Quick Pattern Screening
   ↓
[Risk Score > Threshold?]
   ↓ Yes
AI Analysis (Prompt API)
   ↓
Threat Assessment
   ↓
[Danger/Suspicious?]
   ↓ Yes
Protective Intervention
   ↓
User Education
```

### Scam Pattern Database

GuardianAI maintains local databases of:
- Urgency keywords
- Manipulation phrases
- Financial red flags
- Authority impersonation patterns
- Dangerous action indicators

### AI Enhancement

Chrome's Prompt API analyzes:
- Context and intent
- Emotional manipulation
- Sophisticated patterns
- Multi-step scams

---

## 🔒 Privacy & Security

### Privacy-First Design

- ✅ All AI analysis happens locally
- ✅ No scam content sent to cloud
- ✅ Financial data never leaves device
- ✅ Minimal data collection
- ✅ Full user control

### Security Features

- Content Security Policy
- Minimal permissions
- Sandboxed execution
- Open source code

---

## 🎓 Training Mode

Learn to identify scams in a safe environment:

**Training Scenarios Include:**

1. **Tech Support Scams (Easy)**
   - Fake virus warnings
   - Suspicious phone numbers
   - Urgency tactics

2. **Phishing Emails (Medium)**
   - Fake sender domains
   - Urgency language
   - Suspicious links

3. **Romance Scams (Hard)**
   - Long-term manipulation
   - Emotional exploitation
   - Money requests

Each scenario teaches you to spot red flags and take proper action.

---

## 🌟 Future Enhancements

### Planned Features
- Voice call analysis (phone scam detection)
- SMS/text message scanning
- Deepfake video detection
- Multi-language support
- Community scam database

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 About

**Built for Google Chrome AI 2025 Hackathon**

GuardianAI combines cutting-edge AI technology with real-world social impact to protect vulnerable populations from online threats.

---

## 📞 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: support@guardianai.com

---

<div align="center">

**🛡️ GuardianAI - Because everyone deserves to feel safe online 🛡️**

*Protecting 50+ million elderly internet users, one scam at a time*

</div>
