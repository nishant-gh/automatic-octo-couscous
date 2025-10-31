/**
 * GuardianAI - Core AI Engine
 * Uses Chrome's built-in AI APIs for scam detection
 */

class GuardianAI {
  constructor() {
    this.session = null;
    this.rewriterSession = null;
    this.initialized = false;
    this.scamPatterns = this.loadScamPatterns();
  }

  /**
   * Initialize AI sessions
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if Prompt API is available
      const capabilities = await ai.languageModel.capabilities();

      if (capabilities.available === 'no') {
        throw new Error('AI capabilities not available');
      }

      // Create main scam detection session
      this.session = await ai.languageModel.create({
        systemPrompt: `You are GuardianAI, a protective assistant specialized in identifying scams targeting elderly users.

CRITICAL PRIORITIES:
1. User safety over convenience - when in doubt, flag as suspicious
2. Clear, simple explanations in plain language
3. Non-judgmental, empowering tone
4. Practical action steps

ANALYSIS FRAMEWORK:
- Urgency tactics (act now, limited time, emergency)
- Emotional manipulation (fear, anxiety, love, greed)
- Authority impersonation (government, tech support, banks)
- Financial requests (wire transfer, gift cards, cryptocurrency)
- Information requests (passwords, SSN, account numbers)
- Relationship exploitation (romance, family emergency)

RESPONSE FORMAT:
- Threat level: safe/suspicious/danger
- Scam type identification
- Specific red flags found
- Simple explanation for elderly users
- Recommended actions`,
        temperature: 0.3, // Lower temperature for more consistent safety
        topK: 40
      });

      // Create rewriter session for simplifying explanations
      if (ai.rewriter) {
        this.rewriterSession = await ai.rewriter.create({
          tone: 'casual',
          length: 'short'
        });
      }

      this.initialized = true;
      console.log('GuardianAI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GuardianAI:', error);
      throw error;
    }
  }

  /**
   * Load known scam patterns (local database)
   */
  loadScamPatterns() {
    return {
      urgencyKeywords: [
        'act now', 'immediately', 'urgent', 'expire', 'limited time',
        'last chance', 'today only', 'don\'t wait', 'hurry', 'asap'
      ],
      manipulationPhrases: [
        'verify your account', 'suspended', 'unusual activity',
        'security alert', 'confirm your identity', 'reactivate',
        'claim your prize', 'you\'ve won', 'congratulations'
      ],
      financialRedFlags: [
        'wire transfer', 'gift card', 'cryptocurrency', 'bitcoin',
        'western union', 'moneygram', 'cash app', 'venmo', 'zelle',
        'prepaid card', 'reload pack'
      ],
      authorityImpersonation: [
        'irs', 'social security', 'medicare', 'fbi', 'police',
        'microsoft', 'apple', 'google', 'amazon', 'geek squad',
        'mcafee', 'norton', 'your bank'
      ],
      dangerousRequests: [
        'password', 'pin', 'social security number', 'ssn',
        'account number', 'routing number', 'credit card',
        'download', 'install', 'remote access', 'teamviewer', 'anydesk'
      ]
    };
  }

  /**
   * Quick pattern-based pre-screening (before AI analysis)
   */
  quickScreening(text) {
    const lowerText = text.toLowerCase();
    let riskScore = 0;
    const foundPatterns = [];

    // Check for urgency
    const urgencyMatches = this.scamPatterns.urgencyKeywords.filter(
      keyword => lowerText.includes(keyword)
    );
    if (urgencyMatches.length > 0) {
      riskScore += urgencyMatches.length * 10;
      foundPatterns.push({ type: 'urgency', matches: urgencyMatches });
    }

    // Check for manipulation
    const manipulationMatches = this.scamPatterns.manipulationPhrases.filter(
      phrase => lowerText.includes(phrase)
    );
    if (manipulationMatches.length > 0) {
      riskScore += manipulationMatches.length * 15;
      foundPatterns.push({ type: 'manipulation', matches: manipulationMatches });
    }

    // Check for financial red flags
    const financialMatches = this.scamPatterns.financialRedFlags.filter(
      term => lowerText.includes(term)
    );
    if (financialMatches.length > 0) {
      riskScore += financialMatches.length * 20;
      foundPatterns.push({ type: 'financial', matches: financialMatches });
    }

    // Check for authority impersonation
    const authorityMatches = this.scamPatterns.authorityImpersonation.filter(
      authority => lowerText.includes(authority)
    );
    if (authorityMatches.length > 0) {
      riskScore += authorityMatches.length * 12;
      foundPatterns.push({ type: 'authority', matches: authorityMatches });
    }

    // Check for dangerous requests
    const dangerousMatches = this.scamPatterns.dangerousRequests.filter(
      request => lowerText.includes(request)
    );
    if (dangerousMatches.length > 0) {
      riskScore += dangerousMatches.length * 25;
      foundPatterns.push({ type: 'dangerous', matches: dangerousMatches });
    }

    return {
      riskScore,
      foundPatterns,
      requiresAIAnalysis: riskScore > 20
    };
  }

  /**
   * Analyze text content for scams
   */
  async analyzeText(text, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Quick screening first
    const screening = this.quickScreening(text);

    if (!screening.requiresAIAnalysis && screening.riskScore < 10) {
      return {
        threatLevel: 'safe',
        riskScore: screening.riskScore,
        scamType: 'none',
        redFlags: [],
        explanation: 'Content appears safe.',
        confidence: 0.9
      };
    }

    // Perform AI analysis
    try {
      const prompt = `Analyze this content for scam indicators:

CONTENT:
${text}

CONTEXT:
${JSON.stringify(context, null, 2)}

PRE-SCREENING FOUND:
${JSON.stringify(screening.foundPatterns, null, 2)}

Provide analysis in JSON format:
{
  "threatLevel": "safe" | "suspicious" | "danger",
  "scamType": "specific type or none",
  "redFlags": ["flag1", "flag2"],
  "explanation": "simple explanation for elderly users",
  "confidence": 0.0 to 1.0,
  "recommendedActions": ["action1", "action2"]
}`;

      const response = await this.session.prompt(prompt);

      // Parse JSON response
      const analysis = this.parseAIResponse(response);
      analysis.riskScore = screening.riskScore;

      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);

      // Fallback to pattern-based analysis
      return this.fallbackAnalysis(screening);
    }
  }

  /**
   * Analyze visual content (screenshots, images)
   */
  async analyzeVisual(imageData, pageContext = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Note: Chrome's Prompt API may support images in future
    // For now, we'll analyze visual elements from page context
    const visualRedFlags = this.detectVisualScamPatterns(pageContext);

    if (visualRedFlags.length > 0) {
      return {
        threatLevel: 'suspicious',
        scamType: 'visual-manipulation',
        redFlags: visualRedFlags,
        explanation: 'This page has visual elements commonly used in scams.',
        confidence: 0.7,
        recommendedActions: [
          'Do not click any buttons or links',
          'Close this page',
          'Clear your browser cache'
        ]
      };
    }

    return {
      threatLevel: 'safe',
      scamType: 'none',
      redFlags: [],
      explanation: 'Visual elements appear normal.',
      confidence: 0.8
    };
  }

  /**
   * Detect visual scam patterns from page analysis
   */
  detectVisualScamPatterns(pageContext) {
    const redFlags = [];

    // Check for fake security badges
    if (pageContext.hasFakeSecurityBadges) {
      redFlags.push('Suspicious security badges detected');
    }

    // Check for countdown timers (urgency tactic)
    if (pageContext.hasCountdownTimer) {
      redFlags.push('Countdown timer creating false urgency');
    }

    // Check for pop-ups that can't be closed
    if (pageContext.hasUnclosablePopup) {
      redFlags.push('Pop-up that prevents closing (common in tech support scams)');
    }

    // Check for excessive exclamation marks
    if (pageContext.exclamationCount > 5) {
      redFlags.push('Excessive exclamation marks (manipulation tactic)');
    }

    // Check for phone numbers in unusual places
    if (pageContext.hasProminentPhoneNumber) {
      redFlags.push('Prominent phone number (tech support scam indicator)');
    }

    return redFlags;
  }

  /**
   * Analyze user action for danger
   */
  async analyzeAction(action) {
    const dangerousActions = {
      wireTransfer: {
        level: 'danger',
        message: 'Wire transfers are irreversible and commonly used in scams',
        pauseTime: 24 * 60 * 60 * 1000 // 24 hours
      },
      giftCardPurchase: {
        level: 'danger',
        message: 'Legitimate organizations NEVER ask for payment via gift cards',
        pauseTime: 60 * 60 * 1000 // 1 hour
      },
      remoteAccessDownload: {
        level: 'danger',
        message: 'Remote access software can give scammers full control of your computer',
        pauseTime: 24 * 60 * 60 * 1000
      },
      passwordSharing: {
        level: 'danger',
        message: 'Never share passwords, even with "tech support"',
        pauseTime: 0 // Immediate block
      },
      largePurchase: {
        level: 'suspicious',
        message: 'Unusual purchase amount detected',
        pauseTime: 60 * 60 * 1000
      }
    };

    if (action.type in dangerousActions) {
      const intervention = dangerousActions[action.type];

      // Use AI to provide personalized explanation
      const explanation = await this.simplifyExplanation(
        intervention.message + '. ' + this.getScamExample(action.type)
      );

      return {
        shouldIntervene: true,
        ...intervention,
        explanation
      };
    }

    return { shouldIntervene: false };
  }

  /**
   * Simplify explanation for elderly users
   */
  async simplifyExplanation(text) {
    if (!this.rewriterSession) {
      return text;
    }

    try {
      const simplified = await this.rewriterSession.rewrite(text, {
        context: 'Explain to elderly person in simple terms'
      });
      return simplified;
    } catch (error) {
      return text;
    }
  }

  /**
   * Get example of scam type
   */
  getScamExample(scamType) {
    const examples = {
      wireTransfer: 'Scammers often pretend to be grandchildren in trouble or government officials demanding immediate payment.',
      giftCardPurchase: 'Real companies like Microsoft, IRS, or your bank will NEVER ask you to pay with gift cards. This is always a scam.',
      remoteAccessDownload: 'Scammers use these programs to steal your personal information, banking details, and money.',
      passwordSharing: 'Real tech support can help you without knowing your password. Anyone asking for it is trying to steal your accounts.',
      largePurchase: 'Make sure you intended to make this purchase and recognize the seller.'
    };

    return examples[scamType] || '';
  }

  /**
   * Parse AI response (handles both JSON and text)
   */
  parseAIResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
    }

    // Fallback: Parse structured text response
    return {
      threatLevel: response.includes('danger') ? 'danger' :
                   response.includes('suspicious') ? 'suspicious' : 'safe',
      scamType: 'unknown',
      redFlags: [],
      explanation: response,
      confidence: 0.5,
      recommendedActions: ['Review this content carefully', 'Verify with trusted sources']
    };
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  fallbackAnalysis(screening) {
    let threatLevel = 'safe';
    if (screening.riskScore > 50) threatLevel = 'danger';
    else if (screening.riskScore > 20) threatLevel = 'suspicious';

    const redFlags = screening.foundPatterns.flatMap(p => p.matches);

    return {
      threatLevel,
      riskScore: screening.riskScore,
      scamType: screening.foundPatterns[0]?.type || 'unknown',
      redFlags,
      explanation: `Found ${redFlags.length} warning signs. This may be a scam.`,
      confidence: 0.6,
      recommendedActions: [
        'Do not provide any personal information',
        'Do not make any payments',
        'Close this page or hang up',
        'Contact the organization directly using official channels'
      ]
    };
  }

  /**
   * Generate scam report
   */
  async generateReport(analysis, context) {
    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      context,
      userProtected: analysis.threatLevel !== 'safe'
    };

    // Store report locally
    await this.storeReport(report);

    return report;
  }

  /**
   * Store scam report in local storage
   */
  async storeReport(report) {
    try {
      const stored = await chrome.storage.local.get(['scamReports']);
      const reports = stored.scamReports || [];

      reports.unshift(report);

      // Keep last 100 reports
      if (reports.length > 100) {
        reports.splice(100);
      }

      await chrome.storage.local.set({ scamReports: reports });
    } catch (error) {
      console.error('Failed to store report:', error);
    }
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    try {
      const stored = await chrome.storage.local.get(['scamReports']);
      const reports = stored.scamReports || [];

      const stats = {
        totalScans: reports.length,
        threatsBlocked: reports.filter(r => r.analysis.threatLevel === 'danger').length,
        suspiciousFlags: reports.filter(r => r.analysis.threatLevel === 'suspicious').length,
        safeSites: reports.filter(r => r.analysis.threatLevel === 'safe').length,
        recentThreats: reports.filter(r => {
          const age = Date.now() - new Date(r.timestamp).getTime();
          return age < 7 * 24 * 60 * 60 * 1000; // Last 7 days
        }).filter(r => r.analysis.threatLevel === 'danger').length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalScans: 0,
        threatsBlocked: 0,
        suspiciousFlags: 0,
        safeSites: 0,
        recentThreats: 0
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GuardianAI;
}
