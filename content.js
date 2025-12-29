const rarityScale = {
  common: '#ebebeb',
  uncommon: '#a1ff96',
  rare: '#96c7ff',
  epic: '#b996ff',
  legendary: '#fffa96',
  mythic: '#ff6969'
};

let lastClickedElement = null;

document.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    lastClickedElement = e.target;
  }
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Lingomon: Received message:', message);

  if (message.type === 'wordCaught') {
    console.log('Lingomon: Showing success popup for:', message.word);
    showCatchAnimation(message.word, message.origin, message.rarity, message.isNew);
    sendResponse({ received: true });
  } else if (message.type === 'wordFailed') {
    console.log('Lingomon: Showing failure popup for:', message.word);
    showFailureAnimation(message.word, message.error);
    sendResponse({ received: true });
  }
  return true;
});

function showCatchAnimation(word, origin, rarity, isNew) {
  console.log('Lingomon: Creating catch popup for:', word, 'rarity:', rarity);

  if (lastClickedElement) {
    animateWordCatch(lastClickedElement, rarity);
  }

  const catchPopup = document.createElement('div');
  catchPopup.style.position = 'fixed';
  catchPopup.style.top = '50%';
  catchPopup.style.left = '50%';
  catchPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
  catchPopup.style.background = '#ffffff';
  catchPopup.style.border = `3px solid ${rarityScale[rarity]}`;
  catchPopup.style.borderRadius = '20px';
  catchPopup.style.padding = '32px';
  catchPopup.style.maxWidth = '440px';
  catchPopup.style.maxHeight = '80vh';
  catchPopup.style.overflow = 'auto';
  catchPopup.style.boxShadow = `0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px ${rarityScale[rarity]}40 inset`;
  catchPopup.style.zIndex = '9999999';
  catchPopup.style.color = '#000000';
  catchPopup.style.fontFamily = 'Georgia, serif';
  catchPopup.style.opacity = '0';
  catchPopup.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const title = document.createElement('div');
  title.style.fontSize = '16px';
  title.style.fontWeight = '500';
  title.style.marginBottom = '12px';
  title.style.textAlign = 'center';
  title.style.color = '#666666';
  title.style.letterSpacing = '0.5px';
  title.textContent = isNew ? 'New Word Caught!' : 'Word Updated!';

  const wordTitle = document.createElement('div');
  wordTitle.style.fontSize = '36px';
  wordTitle.style.fontWeight = 'bold';
  wordTitle.style.color = rarityScale[rarity] || '#6b5b95';
  if (rarity === 'common') {
    wordTitle.style.color = '#9b9b9b';
  }
  wordTitle.style.textAlign = 'center';
  wordTitle.style.marginBottom = '8px';
  wordTitle.style.textShadow = `2px 2px 8px ${rarityScale[rarity]}80, 0 0 20px ${rarityScale[rarity]}40`;
  wordTitle.textContent = word;

  const rarityBadge = document.createElement('div');
  rarityBadge.style.display = 'inline-block';
  rarityBadge.style.padding = '6px 16px';
  rarityBadge.style.background = rarityScale[rarity];
  rarityBadge.style.color = '#000000';
  rarityBadge.style.borderRadius = '20px';
  rarityBadge.style.fontSize = '12px';
  rarityBadge.style.fontWeight = '700';
  rarityBadge.style.letterSpacing = '1px';
  rarityBadge.style.marginBottom = '20px';
  rarityBadge.style.boxShadow = `0 4px 12px ${rarityScale[rarity]}80`;
  rarityBadge.textContent = rarity.toUpperCase();

  const rarityContainer = document.createElement('div');
  rarityContainer.style.textAlign = 'center';
  rarityContainer.appendChild(rarityBadge);

  const originText = document.createElement('div');
  originText.style.fontSize = '15px';
  originText.style.lineHeight = '1.7';
  originText.style.background = '#f8f8f8';
  originText.style.color = '#000000';
  originText.style.padding = '20px';
  originText.style.borderRadius = '12px';
  originText.style.marginTop = '16px';
  originText.style.whiteSpace = 'pre-wrap';
  originText.style.border = '2px solid #e0e0e0';
  originText.textContent = origin;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Got it';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.padding = '14px 28px';
  closeBtn.style.background = '#000000';
  closeBtn.style.color = '#ffffff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '25px';
  closeBtn.style.fontSize = '15px';
  closeBtn.style.fontWeight = '700';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.width = '100%';
  closeBtn.style.transition = 'all 0.2s';
  closeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  closeBtn.onmouseover = () => {
    closeBtn.style.transform = 'translateY(-2px)';
    closeBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    closeBtn.style.background = '#333333';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.transform = 'translateY(0)';
    closeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    closeBtn.style.background = '#000000';
  };
  closeBtn.onclick = () => {
    catchPopup.style.opacity = '0';
    catchPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => catchPopup.remove(), 300);
  };

  catchPopup.appendChild(title);
  catchPopup.appendChild(wordTitle);
  catchPopup.appendChild(rarityContainer);
  catchPopup.appendChild(originText);
  catchPopup.appendChild(closeBtn);

  document.body.appendChild(catchPopup);

  setTimeout(() => {
    catchPopup.style.opacity = '1';
    catchPopup.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);

  setTimeout(() => {
    if (catchPopup.parentNode) {
      catchPopup.style.opacity = '0';
      catchPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => catchPopup.remove(), 300);
    }
  }, 8000);
}

function animateWordCatch(element, rarity) {
  if (!element) return;

  const originalBg = element.style.background;
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;

  element.style.transition = 'all 0.6s ease-out';
  element.style.background = rarityScale[rarity];
  element.style.boxShadow = `0 0 20px ${rarityScale[rarity]}`;

  createParticles(element, rarity);

  setTimeout(() => {
    element.style.background = originalBg;
    element.style.boxShadow = originalBoxShadow;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 600);
  }, 600);
}

function createParticles(element, rarity) {
  const rect = element.getBoundingClientRect();
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.textContent = '✨';
    particle.style.position = 'fixed';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.fontSize = '20px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999998';
    particle.style.color = rarityScale[rarity];
    particle.style.transition = 'all 1s ease-out';

    document.body.appendChild(particle);

    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    setTimeout(() => {
      particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
      particle.style.opacity = '0';
    }, 10);

    setTimeout(() => particle.remove(), 1000);
  }
}

function showFailureAnimation(word, error) {
  const failPopup = document.createElement('div');
  failPopup.style.position = 'fixed';
  failPopup.style.top = '50%';
  failPopup.style.left = '50%';
  failPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
  failPopup.style.background = '#ffffff';
  failPopup.style.border = '3px solid #ff4444';
  failPopup.style.borderRadius = '20px';
  failPopup.style.padding = '32px';
  failPopup.style.maxWidth = '440px';
  failPopup.style.boxShadow = '0 20px 60px rgba(255,68,68,0.3)';
  failPopup.style.zIndex = '9999999';
  failPopup.style.color = '#000000';
  failPopup.style.fontFamily = 'Georgia, serif';
  failPopup.style.opacity = '0';
  failPopup.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const title = document.createElement('div');
  title.style.fontSize = '24px';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '12px';
  title.style.textAlign = 'center';
  title.style.color = '#ff4444';
  title.textContent = '❌ Failed to Catch';

  const wordTitle = document.createElement('div');
  wordTitle.style.fontSize = '32px';
  wordTitle.style.fontWeight = 'bold';
  wordTitle.style.color = '#333333';
  wordTitle.style.textAlign = 'center';
  wordTitle.style.marginBottom = '16px';
  wordTitle.textContent = word;

  const errorText = document.createElement('div');
  errorText.style.fontSize = '15px';
  errorText.style.lineHeight = '1.7';
  errorText.style.background = '#fff0f0';
  errorText.style.color = '#cc0000';
  errorText.style.padding = '16px';
  errorText.style.borderRadius = '12px';
  errorText.style.marginTop = '12px';
  errorText.style.border = '2px solid #ffcccc';
  errorText.style.textAlign = 'center';
  errorText.textContent = error;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Try Again';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.padding = '14px 28px';
  closeBtn.style.background = '#ff4444';
  closeBtn.style.color = '#ffffff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '25px';
  closeBtn.style.fontSize = '15px';
  closeBtn.style.fontWeight = '700';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.width = '100%';
  closeBtn.style.transition = 'all 0.2s';
  closeBtn.style.boxShadow = '0 4px 12px rgba(255,68,68,0.3)';
  closeBtn.onmouseover = () => {
    closeBtn.style.transform = 'translateY(-2px)';
    closeBtn.style.boxShadow = '0 6px 16px rgba(255,68,68,0.4)';
    closeBtn.style.background = '#ff6666';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.transform = 'translateY(0)';
    closeBtn.style.boxShadow = '0 4px 12px rgba(255,68,68,0.3)';
    closeBtn.style.background = '#ff4444';
  };
  closeBtn.onclick = () => {
    failPopup.style.opacity = '0';
    failPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => failPopup.remove(), 300);
  };

  failPopup.appendChild(title);
  failPopup.appendChild(wordTitle);
  failPopup.appendChild(errorText);
  failPopup.appendChild(closeBtn);

  document.body.appendChild(failPopup);

  setTimeout(() => {
    failPopup.style.opacity = '1';
    failPopup.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);

  setTimeout(() => {
    if (failPopup.parentNode) {
      failPopup.style.opacity = '0';
      failPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => failPopup.remove(), 300);
    }
  }, 5000);
}