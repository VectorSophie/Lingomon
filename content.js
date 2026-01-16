// Import and initialize animation functions from shared module
// Note: animations.js is loaded via manifest.json before this script
if (typeof initAnimations !== 'undefined') {
  initAnimations();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Lingomon: Received message:', message);

  if (message.type === 'getContext') {
    // 1. Try to get context from last right-clicked element
    let context = '';
    
    // Helper to clean text
    const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

    if (window.lastClickedElement) {
        context = cleanText(window.lastClickedElement.textContent || window.lastClickedElement.innerText || '');
        // If too long, try to narrow down to the sentence containing the word? 
        // For now, full element text is okay, but maybe limit length.
        if (context.length > 300) context = context.substring(0, 300) + '...';
    } else {
        // Fallback: Current selection context
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const container = selection.getRangeAt(0).commonAncestorContainer;
            context = cleanText(container.textContent || container.innerText || '');
             if (context.length > 300) context = context.substring(0, 300) + '...';
        }
    }
    
    sendResponse({ context: context });
  } else if (message.type === 'catchAttempt') {
    console.log('Lingomon: Showing loading animation for:', message.word);
    if (typeof showLoadingAnimation !== 'undefined') {
      showLoadingAnimation(message.word);
    }
    sendResponse({ received: true });
  } else if (message.type === 'wordCaught') {
    console.log('Lingomon: Showing success popup for:', message.word);
    if (typeof showCatchAnimation !== 'undefined') {
      showCatchAnimation(message.word, message.origin, message.rarity, message.isNew, message.firstCaught, message.frequency, message.frequencySource);
    }
    sendResponse({ received: true });
  } else if (message.type === 'wordFailed') {
    console.log('Lingomon: Showing failure popup for:', message.word);
    if (typeof showFailureAnimation !== 'undefined') {
      showFailureAnimation(message.word, message.error);
    }
    sendResponse({ received: true });
  }
  return true;
});