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
    sortButtons[2].textContent = t('sortRarity');
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

function sortEntries(entries, sortType) {
  switch(sortType) {
    case 'alpha':
      return entries.sort((a, b) => a[0].localeCompare(b[0]));

    case 'recent':
      return entries.sort((a, b) => {
        const timeA = a[1].timestamp || 0;
        const timeB = b[1].timestamp || 0;
        return timeB - timeA;
      });

    case 'rarity':
      return entries.sort((a, b) => {
        const rarityA = rarityOrder[a[1].rarity] ?? 3;
        const rarityB = rarityOrder[b[1].rarity] ?? 3;
        if (rarityA !== rarityB) {
          return rarityA - rarityB;
        }
        return a[0].localeCompare(b[0]);
      });

    default:
      return entries;
  }
}

function displayWordDex(sortType = 'alpha') {
  chrome.storage.local.get(["wordDex", "achievements", "streakData", "badges"], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      displayError("Error loading word collection. Please try again.");
      return;
    }

    try {
      const dex = data.wordDex || {};
      const stats = data.achievements || {};
      const dexDiv = document.getElementById("dex");
      const statsDiv = document.getElementById("stats");

      if (!dexDiv || !statsDiv) {
        console.error('Required DOM elements not found');
        return;
      }

      wordData = dex;
      dexDiv.innerHTML = '';

      let entries = Object.entries(dex);

      // Filter by search query
      if (searchQuery) {
        entries = entries.filter(([word, info]) => {
          const searchLower = searchQuery.toLowerCase();
          return word.toLowerCase().includes(searchLower) ||
                 (info.origin && info.origin.toLowerCase().includes(searchLower));
        });
      }

      entries = sortEntries(entries, sortType);

      if (entries.length === 0 && searchQuery) {
        dexDiv.innerHTML = `<p style="color: gray; text-align: center; padding: 20px;">${t('noSearchResults')}</p>`;
      } else if (entries.length === 0) {
        dexDiv.innerHTML = `<p style="color: gray; text-align: center; padding: 20px;">${t('noWordsMessage')}</p>`;
      } else {
        entries.forEach(([word, info]) => {
          if (!info || typeof info !== 'object') {
            console.warn(`Invalid data for word: ${word}`);
            return;
          }

          const div = document.createElement("div");
          div.className = "word-entry";
          div.style.position = 'relative';

          const rarity = info.rarity || 'common';
          const origin = info.origin || info.definition || 'No information available';

          const wordStrong = document.createElement('strong');
          wordStrong.textContent = word;
          wordStrong.style.color = rarityScale[rarity] || '#6b5b95';
          if (rarity === 'common') {
            wordStrong.style.color = '#9b9b9b';
          }
          
          // Rainbow effect for 'lingomon'
          if (word.toLowerCase() === 'lingomon') {
            wordStrong.style.backgroundImage = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)';
            wordStrong.style.backgroundSize = '200% auto';
            wordStrong.style.webkitBackgroundClip = 'text';
            wordStrong.style.webkitTextFillColor = 'transparent';
            wordStrong.style.animation = 'rainbow 2s linear infinite';
            
            // Add style for keyframes if not present
            if (!document.getElementById('rainbow-style')) {
              const style = document.createElement('style');
              style.id = 'rainbow-style';
              style.innerHTML = `
                @keyframes rainbow {
                  to { background-position: 200% center; }
                }
              `;
              document.head.appendChild(style);
            }
          }

          const rarityDiv = document.createElement('div');
          rarityDiv.className = 'rarity';
          rarityDiv.textContent = t(rarity.toUpperCase());
          
          if (rarity === 'god') {
             rarityDiv.classList.add('rainbow-text');
             // Override specific color if needed, but the class handles text fill
             rarityDiv.style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
          } else {
             rarityDiv.style.color = rarityScale[rarity] || '#9b8bb5';
          }

          const originDiv = document.createElement('div');
          originDiv.className = 'word-info';
          originDiv.textContent = origin.length > 150 ? origin.substring(0, 150) + '...' : origin;

          const frequencyDiv = document.createElement('div');
          frequencyDiv.className = 'frequency-info';
          frequencyDiv.style.fontSize = '11px';
          frequencyDiv.style.marginTop = '4px';

          if (info.frequency !== undefined && info.frequency !== null) {
            const freqDisplay = info.frequency >= 1
              ? info.frequency.toFixed(2)
              : info.frequency.toFixed(4);
            const sourceMap = {
              'api': t('sourceAPI'),
              'local': t('sourceLocalDB'),
              'korean-api': t('sourceKoreanAPI')
            };
            const sourceLabel = sourceMap[info.frequencySource] || t('sourceAPI');
            frequencyDiv.textContent = `${t('frequency')}: ${freqDisplay} ${t('perMillion')} (${sourceLabel})`;
            frequencyDiv.title = `Source: ${info.frequencySource || 'unknown'}`;
          } else {
            frequencyDiv.textContent = `${t('frequency')}: ${t('frequencyNA')}`;
            frequencyDiv.style.fontStyle = 'italic';
          }

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = t('deleteButton');
          deleteBtn.className = 'delete-btn';
          deleteBtn.style.position = 'absolute';
          deleteBtn.style.top = '10px';
          deleteBtn.style.right = '0px';
          deleteBtn.style.background = 'transparent';
          deleteBtn.style.border = 'none';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.fontSize = '16px';
          deleteBtn.style.color = '#ff4444';
          deleteBtn.style.fontWeight = 'bold';
          deleteBtn.style.opacity = '0.5';
          deleteBtn.style.transition = 'opacity 0.2s';
          deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
          deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.5';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteWord(word, rarity);
          };

          div.appendChild(wordStrong);
          div.appendChild(rarityDiv);
          div.appendChild(originDiv);
          div.appendChild(frequencyDiv);
          div.appendChild(deleteBtn);

          dexDiv.appendChild(div);
        });
      }

      const total = entries.length;
      const commonCount = stats.common || 0;
      const uncommonCount = stats.uncommon || 0;
      const rareCount = stats.rare || 0;
      const epicCount = stats.epic || 0;
      const legendaryCount = stats.legendary || 0;
      const mythicCount = stats.mythic || 0;

      const streakData = data.streakData || { currentStreak: 0, longestStreak: 0 };

      statsDiv.innerHTML = '';

      const statsStrong = document.createElement('strong');
      statsStrong.textContent = t('collectionStats');

      const statsP = document.createElement('p');
      statsP.style.margin = '8px 0 0 0';
      statsP.appendChild(statsStrong);
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('totalWords')}: ${total}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createElement('br'));

      // Streak display
      const streakSpan = document.createElement('span');
      streakSpan.style.fontWeight = 'bold';
      streakSpan.className = 'streak-text';
      streakSpan.style.color = streakData.currentStreak >= 7 ? '#fffa96' : streakData.currentStreak >= 3 ? '#96c7ff' : '';
      const dayText = streakData.currentStreak !== 1 ? t('days') : t('day');
      streakSpan.textContent = `${t('streak')}: ${streakData.currentStreak} ${dayText}`;
      statsP.appendChild(streakSpan);
      statsP.appendChild(document.createElement('br'));

      if (streakData.longestStreak > 0) {
        const longestDayText = streakData.longestStreak !== 1 ? t('days') : t('day');
        statsP.appendChild(document.createTextNode(`${t('longest')}: ${streakData.longestStreak} ${longestDayText}`));
        statsP.appendChild(document.createElement('br'));
      }

      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('COMMON')}: ${commonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('UNCOMMON')}: ${uncommonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('RARE')}: ${rareCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('EPIC')}: ${epicCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('LEGENDARY')}: ${legendaryCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`${t('MYTHIC')}: ${mythicCount}`));

      statsDiv.appendChild(statsP);

      // Display charts
      displayCharts(data.wordDex || {}, stats);

      // Display badges
      displayBadges(data.badges || { main: [], hidden: [] });

    } catch (err) {
      console.error('Error displaying word dex:', err);
      displayError("Error displaying words. Please try refreshing.");
    }
  });
}

function displayError(message) {
  const dexDiv = document.getElementById("dex");
  if (dexDiv) {
    dexDiv.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${escapeHtml(message)}</p>`;
  }
}

function setupSortButtons() {
  const buttons = document.querySelectorAll('.sort-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sortType = btn.getAttribute('data-sort');
      if (sortType) {
        currentSort = sortType;
        displayWordDex(sortType);
      }
    });
  });
}

function setupSearchBar() {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      displayWordDex(currentSort);
    });
  }
}

function deleteWord(word, rarity) {
  if (!confirm(t('deleteConfirm', { word }))) {
    return;
  }

  chrome.storage.local.get(['wordDex', 'achievements'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      return;
    }

    const wordDex = data.wordDex || {};
    const achievements = data.achievements || {};

    if (wordDex[word]) {
      delete wordDex[word];

      if (achievements[rarity] && achievements[rarity] > 0) {
        achievements[rarity] -= 1;
      }

      chrome.storage.local.set({ wordDex, achievements }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage save error:', chrome.runtime.lastError);
          return;
        }
        displayWordDex(currentSort);
      });
    }
  });
}

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
    sortButtons[2].textContent = t('sortRarity');
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
        displayWordDex(currentSort);
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
    displayWordDex(currentSort);
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
  
  setupSortButtons();
  setupSearchBar();
  setupTabs();
  
  initKofi();
  
  displayWordDex(currentSort);
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
    displayWordDex(currentSort);
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
