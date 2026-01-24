// Shared animation module for Lingomon
// Can be used in both content.js (web pages) and popup.js (extension popup)

const rarityScale = {
  common: '#ebebeb',
  uncommon: '#a1ff96',
  rare: '#96c7ff',
  epic: '#b996ff',
  legendary: '#fffa96',
  mythic: '#ff6969',
  god: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
};

let lastClickedElement = null;
let loadingPopup = null;

function initAnimations() {
  // Track right-clicked elements for animations
  document.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      lastClickedElement = e.target;
      // Expose for content.js context capture
      window.lastClickedElement = e.target;
    }
  }, true);
}

function showCatchAnimation(word, origin, rarity, isNew, firstCaught, frequency, frequencySource, tags = []) {
  if (loadingPopup) {
    loadingPopup.remove();
    loadingPopup = null;
  }

  console.log('Lingomon: Creating catch popup for:', word, 'rarity:', rarity);

  if (lastClickedElement) {
    animateWordCatch(lastClickedElement, rarity);
  }

  // Sound Effects removed by user request
  
  const catchPopup = document.createElement('div');
  catchPopup.style.position = 'fixed';
  catchPopup.style.top = '50%';
  catchPopup.style.left = '50%';
  catchPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
  catchPopup.style.background = '#ffffff';
  if (rarity === 'god') {
    catchPopup.style.border = '3px solid transparent';
  } else {
    catchPopup.style.border = `3px solid ${rarityScale[rarity]}`;
  }
  catchPopup.style.borderRadius = '20px';
  catchPopup.style.padding = '32px';
  catchPopup.style.maxWidth = '440px';
  catchPopup.style.maxHeight = '80vh';
  catchPopup.style.overflow = 'auto';
  
  if (rarity === 'god') {
    catchPopup.style.boxShadow = 'none';
  } else {
    catchPopup.style.boxShadow = `0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px ${rarityScale[rarity]}40 inset`;
  }
  catchPopup.style.zIndex = '9999999';
  catchPopup.style.color = '#000000';
  catchPopup.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  catchPopup.style.opacity = '0';
  catchPopup.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  // Add pulsing glow for legendary and mythic
  if (rarity === 'legendary' || rarity === 'mythic' || rarity === 'god') {
    const glowKeyframes = `
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 20px ${rarityScale[rarity]}, 0 0 0 1px ${rarityScale[rarity]}40 inset; }
        50% { box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 40px ${rarityScale[rarity]}, 0 0 60px ${rarityScale[rarity]}80, 0 0 0 1px ${rarityScale[rarity]}80 inset; }
      }
      @keyframes rainbowBorder {
        0% { border-color: #ff0000; box-shadow: 0 0 20px #ff0000; }
        20% { border-color: #ffff00; box-shadow: 0 0 20px #ffff00; }
        40% { border-color: #00ff00; box-shadow: 0 0 20px #00ff00; }
        60% { border-color: #00ffff; box-shadow: 0 0 20px #00ffff; }
        80% { border-color: #0000ff; box-shadow: 0 0 20px #0000ff; }
        100% { border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff; }
      }
      @keyframes rainbow {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = glowKeyframes;
    document.head.appendChild(styleSheet);
    
    if (rarity === 'god') {
      catchPopup.style.animation = 'rainbowBorder 2s linear infinite';
      catchPopup.style.borderWidth = '5px';
    } else {
      catchPopup.style.animation = 'pulseGlow 1.5s ease-in-out infinite';
    }
  }

  // Get translation function - use translations directly with currentLanguage
  const translate = (key, replacements = {}) => {
    if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {
      const translation = translations[currentLanguage][key] || translations['en'][key] || key;
      let result = translation;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(`{${placeholder}}`, value);
      }
      return result;
    }
    return key;
  };

  const title = document.createElement('div');
  title.style.fontSize = '16px';
  title.style.fontWeight = '500';
  title.style.marginBottom = isNew ? '12px' : '4px';
  title.style.textAlign = 'center';
  title.style.color = '#666666';
  title.style.letterSpacing = '0.5px';
  title.textContent = isNew ? translate('newWordCaught') : translate('alreadyCaught');

  const firstCaughtDiv = document.createElement('div');
  if (!isNew && firstCaught) {
    const date = new Date(firstCaught);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    firstCaughtDiv.style.fontSize = '12px';
    firstCaughtDiv.style.textAlign = 'center';
    firstCaughtDiv.style.color = '#999999';
    firstCaughtDiv.style.marginBottom = '12px';
    firstCaughtDiv.textContent = `${translate('firstCaughtOn')} ${dateStr}`;
  }

  const wordTitle = document.createElement('div');
  wordTitle.style.fontSize = '36px';
  wordTitle.style.fontWeight = 'bold';
  wordTitle.style.color = rarityScale[rarity] || '#6b5b95';
  
  if (rarity === 'god') {
     wordTitle.style.backgroundImage = rarityScale[rarity];
     wordTitle.style.backgroundSize = '200% auto';
     wordTitle.style.webkitBackgroundClip = 'text';
     wordTitle.style.webkitTextFillColor = 'transparent';
     wordTitle.style.animation = 'rainbow 2s linear infinite';
  }

  if (rarity === 'common') {
    wordTitle.style.color = '#9b9b9b';
  }
  wordTitle.style.textAlign = 'center';
  wordTitle.style.marginBottom = '4px'; // Reduced bottom margin for tags
  if (rarity === 'god') {
    wordTitle.style.textShadow = '0 0 20px rgba(255,255,255,0.4)';
  } else {
    wordTitle.style.textShadow = `2px 2px 8px ${rarityScale[rarity]}80, 0 0 20px ${rarityScale[rarity]}40`;
  }
  wordTitle.style.overflowWrap = 'break-word';
  wordTitle.style.hyphens = 'none';
  wordTitle.textContent = word;

  // Word Type Tags
  const tagsContainer = document.createElement('div');
  tagsContainer.style.textAlign = 'center';
  tagsContainer.style.marginBottom = '12px';
  
  if (tags && tags.length > 0) {
      const typeMap = {
          noun: 'type_n',
          verb: 'type_v',
          adjective: 'type_adj',
          adverb: 'type_adv',
          pronoun: 'type_p',
          preposition: 'type_pre',
          conjunction: 'type_conj',
          interjection: 'type_interj'
      };
      
      tags.forEach(tag => {
          const lower = tag.toLowerCase();
          if (typeMap[lower]) {
              const tagBadge = document.createElement('span');
              tagBadge.textContent = translate(typeMap[lower]);
              tagBadge.style.fontSize = '12px';
              tagBadge.style.color = '#666';
              tagBadge.style.background = '#f0f0f0';
              tagBadge.style.padding = '2px 8px';
              tagBadge.style.borderRadius = '10px';
              tagBadge.style.margin = '0 4px';
              tagBadge.style.fontWeight = 'bold';
              tagsContainer.appendChild(tagBadge);
          }
      });
  }

  const rarityBadge = document.createElement('div');
  rarityBadge.style.display = 'inline-block';
  rarityBadge.style.padding = '6px 16px';
  rarityBadge.style.background = rarityScale[rarity];
  
  if (rarity === 'god') {
    rarityBadge.style.color = '#ffffff';
    rarityBadge.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
    rarityBadge.style.backgroundSize = '200% 200%';
    rarityBadge.style.animation = 'rainbow 2s linear infinite';
  } else {
    rarityBadge.style.color = '#000000';
  }

  rarityBadge.style.borderRadius = '20px';
  rarityBadge.style.fontSize = '12px';
  rarityBadge.style.fontWeight = '700';
  rarityBadge.style.letterSpacing = '1px';
  rarityBadge.style.marginBottom = '20px';
  if (rarity === 'god') {
    rarityBadge.style.boxShadow = 'none';
  } else {
    rarityBadge.style.boxShadow = `0 4px 12px ${rarityScale[rarity]}80`;
  }
  rarityBadge.textContent = translate(rarity.toUpperCase());

  const rarityContainer = document.createElement('div');
  rarityContainer.style.textAlign = 'center';
  rarityContainer.appendChild(rarityBadge);

  // Add frequency/scarcity info
  if (frequency !== undefined && frequency !== null) {
    const freqDiv = document.createElement('div');
    freqDiv.style.fontSize = '12px';
    freqDiv.style.color = '#888';
    freqDiv.style.marginBottom = '16px';
    freqDiv.style.marginTop = '-12px';
    
    const freqDisplay = frequency >= 1
      ? frequency.toFixed(2)
      : frequency.toFixed(4);
      
    let sourceLabel = 'API';
    if (frequencySource === 'local') sourceLabel = translate('sourceLocalDB');
    else if (frequencySource === 'korean-api') sourceLabel = translate('sourceKoreanAPI');
    else if (frequencySource === 'unknown') sourceLabel = 'Unknown';
    
    const freqLabel = translate('frequency') || 'Frequency';
    const perMillionLabel = translate('perMillion') || 'per million';
    
    if (typeof currentLanguage !== 'undefined' && currentLanguage === 'ko') {
        freqDiv.textContent = `${freqLabel}: ${perMillionLabel} ${freqDisplay} (${sourceLabel})`;
    } else {
        freqDiv.textContent = `${freqLabel}: ${freqDisplay} ${perMillionLabel} (${sourceLabel})`;
    }
    
    rarityContainer.appendChild(freqDiv);
  }

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
  closeBtn.textContent = translate('gotIt');
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
  if (!isNew && firstCaught) {
    catchPopup.appendChild(firstCaughtDiv);
  }
  catchPopup.appendChild(wordTitle);
  catchPopup.appendChild(tagsContainer); // Add tags container
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
  }, 12500);
}

function animateWordCatch(element, rarity) {
  if (!element) return;

  const originalBg = element.style.background;
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;

  element.style.transition = 'all 0.6s ease-out';
  
  if (rarity === 'god') {
     // No background change for god tier
     element.style.background = originalBg; 
     element.style.boxShadow = 'none';
  } else {
     element.style.background = rarityScale[rarity];
     element.style.boxShadow = `0 0 20px ${rarityScale[rarity]}`;
  }

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
  let particleCount = 12;
  let particleSymbols = ['*'];

  // Enhanced particles for legendary and mythic
  if (rarity === 'legendary') {
    particleCount = 24;
    particleSymbols = ['*', '+', '◆', '●'];
  } else if (rarity === 'mythic') {
    particleCount = 40;
    particleSymbols = ['*', '+', '◆', '●', '★', '▲'];
    createScreenShake();
  } else if (rarity === 'god') {
    particleCount = 60;
    particleSymbols = ['★', '✦', '✧', '❂', '✹', '✨'];
    createScreenShake();
  }

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const symbol = particleSymbols[Math.floor(Math.random() * particleSymbols.length)];
    particle.textContent = symbol;
    particle.style.position = 'fixed';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;
    particle.style.fontSize = (15 + Math.random() * 15) + 'px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999998';
    
    if (rarity === 'god') {
       // Random rainbow color for each particle
       const hue = Math.floor(Math.random() * 360);
       particle.style.color = `hsl(${hue}, 100%, 50%)`;
       particle.style.textShadow = `0 0 10px hsl(${hue}, 100%, 70%)`;
    } else {
       particle.style.color = rarityScale[rarity];
       particle.style.textShadow = `0 0 10px ${rarityScale[rarity]}`;
    }

    particle.style.transition = 'all ' + (1 + Math.random() * 0.5) + 's ease-out';

    document.body.appendChild(particle);

    const angle = (i / particleCount) * Math.PI * 2;
    const distance = (rarity === 'god' ? 120 : rarity === 'mythic' ? 100 : rarity === 'legendary' ? 80 : 50) + Math.random() * 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - Math.random() * 30;

    setTimeout(() => {
      particle.style.transform = `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random() * 360}deg)`;
      particle.style.opacity = '0';
    }, 10);

    setTimeout(() => particle.remove(), 1500);
  }
}

function createScreenShake() {
  const body = document.body;
  const originalTransform = body.style.transform;
  let shakeCount = 0;
  const maxShakes = 8;

  const shake = setInterval(() => {
    if (shakeCount >= maxShakes) {
      clearInterval(shake);
      body.style.transform = originalTransform;
      return;
    }

    const x = (Math.random() - 0.5) * 10;
    const y = (Math.random() - 0.5) * 10;
    body.style.transform = `translate(${x}px, ${y}px)`;
    shakeCount++;
  }, 50);
}

function showFailureAnimation(word, error) {
  if (loadingPopup) {
    loadingPopup.remove();
    loadingPopup = null;
  }
  
  // Get translation function - use translations directly with currentLanguage
  const translate = (key, replacements = {}) => {
    if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {
      const translation = translations[currentLanguage][key] || translations['en'][key] || key;
      let result = translation;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(`{${placeholder}}`, value);
      }
      return result;
    }
    return key;
  };

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
  failPopup.style.maxHeight = '80vh';
  failPopup.style.overflow = 'auto';
  failPopup.style.boxShadow = '0 20px 60px rgba(255,68,68,0.3)';
  failPopup.style.zIndex = '9999999';
  failPopup.style.color = '#000000';
  failPopup.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  failPopup.style.opacity = '0';
  failPopup.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const title = document.createElement('div');
  title.style.fontSize = '24px';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '12px';
  title.style.textAlign = 'center';
  title.style.color = '#ff4444';
  title.textContent = translate('failedToCatch');

  const wordTitle = document.createElement('div');
  wordTitle.style.fontSize = '32px';
  wordTitle.style.fontWeight = 'bold';
  wordTitle.style.color = '#333333';
  wordTitle.style.textAlign = 'center';
  wordTitle.style.marginBottom = '16px';
  wordTitle.style.overflowWrap = 'break-word';
  wordTitle.style.hyphens = 'none';
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
  closeBtn.textContent = translate('tryAgain');
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

function showLoadingAnimation(word) {
  if (loadingPopup) {
    loadingPopup.remove();
  }

  const translate = (key) => {
    if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {
      return translations[currentLanguage][key] || translations['en'][key] || key;
    }
    return key === 'catching' ? 'Catching...' : key;
  };

  loadingPopup = document.createElement('div');
  loadingPopup.style.position = 'fixed';
  loadingPopup.style.top = '50%';
  loadingPopup.style.left = '50%';
  loadingPopup.style.transform = 'translate(-50%, -50%) scale(0.8)';
  loadingPopup.style.background = '#ffffff';
  loadingPopup.style.borderRadius = '20px';
  loadingPopup.style.padding = '32px';
  loadingPopup.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)';
  loadingPopup.style.zIndex = '9999999';
  loadingPopup.style.display = 'flex';
  loadingPopup.style.flexDirection = 'column';
  loadingPopup.style.alignItems = 'center';
  loadingPopup.style.minWidth = '200px';
  loadingPopup.style.opacity = '0';
  loadingPopup.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const spinner = document.createElement('div');
  spinner.style.width = '40px';
  spinner.style.height = '40px';
  spinner.style.border = '4px solid #f3f3f3';
  spinner.style.borderTop = '4px solid #3498db';
  spinner.style.borderRadius = '50%';
  spinner.style.marginBottom = '16px';
  
  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  const styleSheet = document.createElement('style');
  styleSheet.textContent = spinKeyframes;
  document.head.appendChild(styleSheet);
  
  spinner.style.animation = 'spin 1s linear infinite';

  const text = document.createElement('div');
  text.textContent = `${translate('catching')} ${word}...`;
  text.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  text.style.fontSize = '16px';
  text.style.color = '#666';
  text.style.fontWeight = '500';

  loadingPopup.appendChild(spinner);
  loadingPopup.appendChild(text);
  document.body.appendChild(loadingPopup);

  setTimeout(() => {
    // Check if loadingPopup still exists before manipulating it
    if (loadingPopup) {
      loadingPopup.style.opacity = '1';
      loadingPopup.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }, 10);
}

// Expose functions and constants to global scope for use in browser extension
window.rarityScale = rarityScale;
window.initAnimations = initAnimations;
window.showCatchAnimation = showCatchAnimation;
window.showFailureAnimation = showFailureAnimation;
window.showLoadingAnimation = showLoadingAnimation;
window.animateWordCatch = animateWordCatch;
window.createParticles = createParticles;
window.createScreenShake = createScreenShake;
