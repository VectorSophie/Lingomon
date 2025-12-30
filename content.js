// Import and initialize animation functions from shared module
// Note: animations.js is loaded via manifest.json before this script
if (typeof initAnimations !== 'undefined') {
  initAnimations();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Lingomon: Received message:', message);

  if (message.type === 'wordCaught') {
    console.log('Lingomon: Showing success popup for:', message.word);
    if (typeof showCatchAnimation !== 'undefined') {
      showCatchAnimation(message.word, message.origin, message.rarity, message.isNew, message.firstCaught);
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