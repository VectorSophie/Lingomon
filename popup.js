// rarityScale is now imported from animations.js
// rarityOrder is now imported from profile.js
// escapeHtml, displayWordDex, etc are now imported from worddex.js

async function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  // Wait for language to be loaded
  await getCurrentLanguage();

  return new Promise((resolve) => {
    chrome.storage.local.get(['darkMode'], (data) => {
      if (data.darkMode) {
        document.body.classList.add('dark-mode');
        toggle.textContent = t('lightMode');
      } else {
        toggle.textContent = t('darkMode');
      }

      toggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        toggle.textContent = isDark ? t('lightMode') : t('darkMode');
        chrome.storage.local.set({ darkMode: isDark });
      });

      resolve();
    });
  });
}

function updateUILanguage() {
  // Update header title
  const headerTitle = document.querySelector('h3');
  // if (headerTitle) {
  //   headerTitle.textContent = t('wordDex');
  // }

  // Update search placeholder
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.placeholder = t('searchPlaceholder');
  }

  // Update sort buttons
  const sortButtons = document.querySelectorAll('.sort-btn');
  if (sortButtons.length >= 3) {
    sortButtons[0].textContent = t('sortAlpha');
    sortButtons[1].textContent = t('sortRecent');
    sortButtons[2].textContent = t('sortTag');
  }

  // Update tabs
  const tabs = document.querySelectorAll('.nav-tab');
  if (tabs.length >= 3) {
    tabs[0].textContent = t('tabDex');
    tabs[1].textContent = t('tabQuiz');
    tabs[2].textContent = t('tabBattle');
  }

  // Update quiz button
  const quizBtn = document.getElementById('quizBtn');
  if (quizBtn) {
    quizBtn.textContent = t('quiz');
  }

  // Update dark mode button
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? t('lightMode') : t('darkMode');
  }
}

async function setupLanguageToggle() {
  const toggle = document.getElementById('langToggle');
  if (!toggle) return;

  // Load current language and update UI
  const lang = await getCurrentLanguage();
  toggle.textContent = lang === 'ko' ? 'KO' : 'EN';
  updateUILanguage();

  toggle.addEventListener('click', async () => {
    const currentLang = await getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'ko' : 'en';
    await setLanguage(newLang);
    toggle.textContent = newLang === 'ko' ? 'KO' : 'EN';

    // Update all UI text
    updateUILanguage();

    // Check active tab and refresh appropriate view
    const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');

    if (activeTab === 'quiz') {
        const container = document.getElementById('quizContainer');
        // Check if we are in the menu (contains start button) or in a quiz
        if (container.querySelector('#btnStartCustomQuiz')) {
            renderQuizMenu();
        } else if (typeof quizData !== 'undefined' && quizData.currentIndex < quizData.total) {
            showQuestion();
        } else {
            showResults();
        }
    } else if (activeTab === 'battle') {
        const container = document.getElementById('battleContainer');
        // Check if menu or battle
        if (container.querySelector('#btnRandomBattle')) {
            renderBattleMenu();
        } else if (typeof battleSystem !== 'undefined' && battleSystem && battleSystem.active) {
             const oldLog = document.getElementById('battleLog')?.innerHTML;
             battleSystem.renderLayout();
             battleSystem.updateUI();
             if (oldLog && document.getElementById('battleLog')) {
                 document.getElementById('battleLog').innerHTML = oldLog;
             }
        } else {
             // Default fallback to menu
             renderBattleMenu();
        }
    } else {
        // Default to Dex
        if (typeof displayWordDex !== 'undefined') {
            displayWordDex(currentSort); // currentSort is now global from worddex.js
        }
    }
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update Tab UI
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
  });

  // Hide All Views
  if (document.getElementById('mainContent')) document.getElementById('mainContent').style.display = 'none';
  if (document.getElementById('quizContainer')) document.getElementById('quizContainer').style.display = 'none';
  if (document.getElementById('battleContainer')) document.getElementById('battleContainer').style.display = 'none';
  if (document.getElementById('profileContainer')) document.getElementById('profileContainer').style.display = 'none';
  
  // Show Controls/Search only on Dex tab
  const showControls = (tabName === 'dex');
  const searchBar = document.getElementById('searchBar');
  const controls = document.querySelector('.controls');
  
  if (searchBar) searchBar.style.display = showControls ? 'block' : 'none';
  if (controls) controls.style.display = showControls ? 'flex' : 'none';

  // Logic per tab
  if (tabName === 'dex') {
    document.getElementById('mainContent').style.display = 'block';
    if (typeof displayWordDex !== 'undefined') {
        displayWordDex(currentSort);
    }
  } else if (tabName === 'quiz') {
    document.getElementById('quizContainer').style.display = 'block';
    renderQuizMenu();
  } else if (tabName === 'battle') {
    startBattle();
  }
}

function initKofi() {
  if (typeof kofiwidget2 !== 'undefined') {
    kofiwidget2.init('Support me on Ko-fi', '#72a4f2', 'E1E21LP8M8');
    const container = document.getElementById('kofi-container');
    if (container) {
      container.innerHTML = kofiwidget2.getHTML();
    }
  }
}

async function initializePopup() {
  // Initialize Supabase (from profile.js)
  initSupabase();
  
  await setupDarkMode();
  await setupLanguageToggle();
  
  if (typeof setupSortButtons !== 'undefined') setupSortButtons();
  if (typeof setupSearchBar !== 'undefined') setupSearchBar();
  setupTabs();
  
  initKofi();
  
  if (typeof displayWordDex !== 'undefined') {
      displayWordDex(currentSort);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

// Initialize animations for popup (enables word catching animations in popup)
if (typeof initAnimations !== 'undefined') {
  initAnimations();
}

// Listen for word caught messages to display animations in popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Lingomon Popup: Received message:', message);

  if (message.type === 'wordCaught') {
    console.log('Lingomon Popup: Showing success popup for:', message.word);
    if (typeof showCatchAnimation !== 'undefined') {
      showCatchAnimation(message.word, message.origin, message.rarity, message.isNew, message.firstCaught);
    }
    // Refresh the display to show the newly caught word
    if (typeof displayWordDex !== 'undefined') {
        displayWordDex(currentSort);
    }
    sendResponse({ received: true });
  } else if (message.type === 'wordFailed') {
    console.log('Lingomon Popup: Showing failure popup for:', message.word);
    if (typeof showFailureAnimation !== 'undefined') {
      showFailureAnimation(message.word, message.error);
    }
    sendResponse({ received: true });
  }
  return true;
});
