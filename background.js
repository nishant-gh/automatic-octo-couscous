// GlobalRead - Background Service Worker
// Manages Chrome Built-in AI APIs and extension lifecycle

let aiCapabilities = {
  summarizer: null,
  translator: null,
  rewriter: null,
  proofreader: null,
  promptAPI: null
};

// Initialize AI capabilities on extension load
chrome.runtime.onInstalled.addListener(async () => {
  console.log('GlobalRead installed - checking AI capabilities');
  await checkAICapabilities();
  createContextMenus();
});

// Check which AI APIs are available
async function checkAICapabilities() {
  try {
    // Check Summarizer API
    if ('ai' in self && 'summarizer' in self.ai) {
      const canSummarize = await self.ai.summarizer.capabilities();
      aiCapabilities.summarizer = canSummarize.available;
      console.log('Summarizer API:', canSummarize.available);
    }

    // Check Translator API
    if ('translation' in self && 'canTranslate' in self.translation) {
      aiCapabilities.translator = 'available';
      console.log('Translator API: available');
    }

    // Check Rewriter API
    if ('ai' in self && 'rewriter' in self.ai) {
      const canRewrite = await self.ai.rewriter.capabilities();
      aiCapabilities.rewriter = canRewrite.available;
      console.log('Rewriter API:', canRewrite.available);
    }

    // Check Proofreader API (Writer API)
    if ('ai' in self && 'writer' in self.ai) {
      const canWrite = await self.ai.writer.capabilities();
      aiCapabilities.proofreader = canWrite.available;
      console.log('Writer API:', canWrite.available);
    }

    // Check Prompt API
    if ('ai' in self && 'languageModel' in self.ai) {
      const canPrompt = await self.ai.languageModel.capabilities();
      aiCapabilities.promptAPI = canPrompt.available;
      console.log('Prompt API:', canPrompt.available);
    }

    // Store capabilities for sidebar access
    await chrome.storage.local.set({ aiCapabilities });
  } catch (error) {
    console.error('Error checking AI capabilities:', error);
  }
}

// Create context menus for quick actions
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'summarize',
      title: 'Summarize with GlobalRead',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'translate',
      title: 'Translate with GlobalRead',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'simplify',
      title: 'Simplify with GlobalRead',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'proofread',
      title: 'Proofread with GlobalRead',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'study-notes',
      title: 'Generate Study Notes',
      contexts: ['selection']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const action = info.menuItemId;
  const selectedText = info.selectionText;

  // Send message to content script to show sidebar
  chrome.tabs.sendMessage(tab.id, {
    action: 'openSidebar',
    feature: action,
    text: selectedText
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  const commandMap = {
    'summarize-selection': 'summarize',
    'translate-selection': 'translate',
    'simplify-selection': 'simplify'
  };

  const action = commandMap[command];
  if (action) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'openSidebar',
      feature: action,
      getSelection: true
    });
  }
});

// Handle messages from content scripts and sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCapabilities') {
    sendResponse({ capabilities: aiCapabilities });
    return true;
  }

  if (request.action === 'summarize') {
    handleSummarize(request.text, request.options).then(sendResponse);
    return true;
  }

  if (request.action === 'translate') {
    handleTranslate(request.text, request.targetLang).then(sendResponse);
    return true;
  }

  if (request.action === 'rewrite') {
    handleRewrite(request.text, request.tone, request.level).then(sendResponse);
    return true;
  }

  if (request.action === 'proofread') {
    handleProofread(request.text).then(sendResponse);
    return true;
  }

  if (request.action === 'generateStudyNotes') {
    handleGenerateStudyNotes(request.text).then(sendResponse);
    return true;
  }

  if (request.action === 'analyzeImage') {
    handleAnalyzeImage(request.imageUrl).then(sendResponse);
    return true;
  }
});

// Summarizer API Implementation
async function handleSummarize(text, options = {}) {
  try {
    if (!aiCapabilities.summarizer || aiCapabilities.summarizer === 'no') {
      return { error: 'Summarizer API not available' };
    }

    const summarizer = await self.ai.summarizer.create({
      type: options.type || 'key-points',
      format: options.format || 'markdown',
      length: options.length || 'medium'
    });

    const summary = await summarizer.summarize(text);
    summarizer.destroy();

    return { success: true, result: summary };
  } catch (error) {
    console.error('Summarize error:', error);
    return { error: error.message };
  }
}

// Translator API Implementation
async function handleTranslate(text, targetLang = 'en') {
  try {
    if (!aiCapabilities.translator) {
      return { error: 'Translator API not available' };
    }

    // Detect source language
    const detector = await self.translation.createDetector();
    const detectedLangs = await detector.detect(text);
    const sourceLang = detectedLangs[0]?.detectedLanguage || 'en';

    // Check if translation is available
    const canTranslate = await self.translation.canTranslate({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    if (canTranslate === 'no') {
      return { error: `Translation from ${sourceLang} to ${targetLang} not available` };
    }

    // Create translator
    const translator = await self.translation.createTranslator({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    // Wait for model to be ready if needed
    if (canTranslate === 'after-download') {
      await translator.ready;
    }

    const translated = await translator.translate(text);
    translator.destroy();

    return {
      success: true,
      result: translated,
      sourceLang,
      targetLang
    };
  } catch (error) {
    console.error('Translate error:', error);
    return { error: error.message };
  }
}

// Rewriter API Implementation
async function handleRewrite(text, tone = 'casual', level = 'medium') {
  try {
    if (!aiCapabilities.rewriter || aiCapabilities.rewriter === 'no') {
      return { error: 'Rewriter API not available' };
    }

    const rewriter = await self.ai.rewriter.create({
      tone: tone,
      length: level
    });

    const rewritten = await rewriter.rewrite(text);
    rewriter.destroy();

    return { success: true, result: rewritten };
  } catch (error) {
    console.error('Rewrite error:', error);
    return { error: error.message };
  }
}

// Proofreader API (Writer API) Implementation
async function handleProofread(text) {
  try {
    if (!aiCapabilities.proofreader || aiCapabilities.proofreader === 'no') {
      return { error: 'Proofreader API not available' };
    }

    const writer = await self.ai.writer.create({
      tone: 'neutral',
      format: 'plain-text'
    });

    const proofread = await writer.write(`Please proofread and improve the following text while maintaining its meaning:\n\n${text}`);
    writer.destroy();

    return { success: true, result: proofread };
  } catch (error) {
    console.error('Proofread error:', error);
    return { error: error.message };
  }
}

// Prompt API Implementation for Study Notes
async function handleGenerateStudyNotes(text) {
  try {
    if (!aiCapabilities.promptAPI || aiCapabilities.promptAPI === 'no') {
      return { error: 'Prompt API not available' };
    }

    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful study assistant. Generate comprehensive study notes from the provided text including: key concepts, important points, definitions, and suggested review questions.'
    });

    const prompt = `Generate study notes from this content:\n\n${text}\n\nFormat as:\n1. Key Concepts\n2. Important Points\n3. Definitions\n4. Review Questions`;

    const studyNotes = await session.prompt(prompt);
    session.destroy();

    return { success: true, result: studyNotes };
  } catch (error) {
    console.error('Generate study notes error:', error);
    return { error: error.message };
  }
}

// Multimodal - Analyze Image using Prompt API
async function handleAnalyzeImage(imageUrl) {
  try {
    if (!aiCapabilities.promptAPI || aiCapabilities.promptAPI === 'no') {
      return { error: 'Prompt API not available for image analysis' };
    }

    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant that describes and analyzes images in detail.'
    });

    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const studyNotes = await session.prompt('Describe this image in detail, including any text, objects, or important visual elements.', {
      image: blob
    });

    session.destroy();

    return { success: true, result: studyNotes };
  } catch (error) {
    console.error('Analyze image error:', error);
    return { error: error.message };
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

console.log('GlobalRead background service worker loaded');
