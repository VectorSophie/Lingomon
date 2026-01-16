// rarityScale is now imported from animations.js
// rarityOrder is now imported from profile.js

let currentSort = 'alpha';
let wordData = null;
let searchQuery = '';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

function displayCharts(wordDex, achievements) {
  const statsDiv = document.getElementById('stats');
  if (!statsDiv) return;

  // Words caught per day graph (last 7 days)
  const wordsPerDay = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    wordsPerDay[dateStr] = 0;
  }

  // Count words per day
  Object.values(wordDex).forEach(word => {
    if (word.firstCaught) {
      const wordDate = new Date(word.firstCaught);
      wordDate.setHours(0, 0, 0, 0);
      const dateStr = wordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (wordsPerDay.hasOwnProperty(dateStr)) {
        wordsPerDay[dateStr]++;
      }
    }
  });

  // Create graph
  const graphDiv = document.createElement('div');
  graphDiv.style.marginTop = '16px';
  graphDiv.style.paddingTop = '16px';
  graphDiv.style.borderTop = '1px solid #e0e0e0';

  const graphTitle = document.createElement('strong');
  graphTitle.textContent = t('wordsCaughtLast7Days');
  graphTitle.style.display = 'block';
  graphTitle.style.marginBottom = '8px';
  graphDiv.appendChild(graphTitle);

  const maxCount = Math.max(...Object.values(wordsPerDay), 1);

  Object.entries(wordsPerDay).forEach(([date, count]) => {
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.alignItems = 'center';
    barContainer.style.marginBottom = '4px';

    const label = document.createElement('span');
    label.textContent = date;
    label.style.fontSize = '11px';
    label.style.width = '60px';
    label.style.flexShrink = '0';
    barContainer.appendChild(label);

    const barBg = document.createElement('div');
    barBg.style.flex = '1';
    barBg.style.height = '16px';
    barBg.style.background = '#e0e0e0';
    barBg.style.borderRadius = '3px';
    barBg.style.overflow = 'hidden';
    barBg.style.marginRight = '8px';

    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = `${(count / maxCount) * 100}%`;
    bar.style.background = 'linear-gradient(90deg, #96c7ff, #b996ff)';
    bar.style.transition = 'width 0.3s ease';
    barBg.appendChild(bar);

    barContainer.appendChild(barBg);

    const countLabel = document.createElement('span');
    countLabel.textContent = count;
    countLabel.style.fontSize = '11px';
    countLabel.style.width = '20px';
    countLabel.style.textAlign = 'right';
    barContainer.appendChild(countLabel);

    graphDiv.appendChild(barContainer);
  });

  statsDiv.appendChild(graphDiv);

  // Rarity distribution pie chart
  const pieDiv = document.createElement('div');
  pieDiv.style.marginTop = '16px';
  pieDiv.style.paddingTop = '16px';
  pieDiv.style.borderTop = '1px solid #e0e0e0';

  const pieTitle = document.createElement('strong');
  pieTitle.textContent = t('rarityDistribution');
  pieTitle.style.display = 'block';
  pieTitle.style.marginBottom = '8px';
  pieDiv.appendChild(pieTitle);

    // Sort by count (percentage) in descending order, exclude 'god' from stats
    const sortedAchievements = Object.entries(achievements)
      .filter(([rarity, count]) => count > 0 && rarity !== 'god')
      .sort((a, b) => b[1] - a[1]);

    const total = sortedAchievements.reduce((sum, [_, count]) => sum + count, 0);

    if (total > 0) {
      const rarityColors = {
        common: '#ebebeb',
        uncommon: '#a1ff96',
        rare: '#96c7ff',
        epic: '#b996ff',
        legendary: '#fffa96',
        mythic: '#ff6969'
      };

      const pieSegments = document.createElement('div');
      pieSegments.style.display = 'flex';
      pieSegments.style.height = '20px';
      pieSegments.style.borderRadius = '10px';
      pieSegments.style.overflow = 'hidden';
      pieSegments.style.marginBottom = '8px';

      sortedAchievements.forEach(([rarity, count]) => {
        const percent = (count / total) * 100;
        const segment = document.createElement('div');
        segment.style.width = `${percent}%`;
        segment.style.background = rarityColors[rarity] || '#cccccc';
        segment.title = `${rarity}: ${count} (${percent.toFixed(1)}%)`;
        pieSegments.appendChild(segment);
      });

      pieDiv.appendChild(pieSegments);

    // Legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '8px';
    legend.style.fontSize = '11px';

    sortedAchievements.forEach(([rarity, count]) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '4px';

      const box = document.createElement('div');
      box.style.width = '12px';
      box.style.height = '12px';
      box.style.background = rarityColors[rarity] || '#cccccc';
      box.style.borderRadius = '2px';
      item.appendChild(box);

      const text = document.createElement('span');
      const percent = ((count / total) * 100).toFixed(1);
      text.textContent = `${t(rarity.toUpperCase())}: ${percent}%`;
      item.appendChild(text);

      legend.appendChild(item);
    });

    pieDiv.appendChild(legend);
  }

  statsDiv.appendChild(pieDiv);
}

function displayBadges(badges) {
  const badgesDiv = document.getElementById('badges');
  if (!badgesDiv) return;

  badgesDiv.innerHTML = '';

  if (badges.main && badges.main.length > 0) {
    const mainSection = document.createElement('div');
    mainSection.className = 'badge-section';

    const mainTitle = document.createElement('strong');
    mainTitle.textContent = t('achievements');
    mainSection.appendChild(mainTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.main.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';
      const badgeName = badge.nameKey ? t(badge.nameKey) : badge.name;
      const nextName = badge.next ? (badge.next.nameKey ? t(badge.next.nameKey) : badge.next.name) : null;
      hexagon.title = badgeName + (nextName ? ` - ${t('nextBadge')} ${nextName}` : ` - ${t('maxLevel')}`);

      const color = rarityScale[badge.rarity] || '#cccccc';
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badgeName;
      hexagon.appendChild(content);

      badgeWrapper.appendChild(hexagon);

      if (badge.next) {
        const progress = document.createElement('div');
        progress.className = 'badge-progress';
        progress.textContent = `${badge.current} / ${badge.next.threshold}`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = Math.min(badge.progress, 100) + '%';
        progressFill.style.background = color;

        progressBar.appendChild(progressFill);
        badgeWrapper.appendChild(progress);
        badgeWrapper.appendChild(progressBar);
      }

      container.appendChild(badgeWrapper);
    });

    mainSection.appendChild(container);
    badgesDiv.appendChild(mainSection);
  }

  if (badges.hidden && badges.hidden.length > 0) {
    const hiddenSection = document.createElement('div');
    hiddenSection.className = 'badge-section';

    const hiddenTitle = document.createElement('strong');
    hiddenTitle.textContent = t('hiddenBadges');
    hiddenSection.appendChild(hiddenTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.hidden.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';

      // Translate hidden badge names
      let badgeName = badge.name;
      if (badge.type === 'firstMythic') {
        badgeName = t('firstMythic');
      } else if (badge.type === 'meta') {
        badgeName = t('meta');
      } else if (badge.type === 'huh') {
        badgeName = t('huh');
      } else if (badge.type === 'rarityKiller') {
        const killerKey = `${badge.rarity}Killer`;
        badgeName = t(killerKey);
      }

      hexagon.title = badgeName + (badge.count ? ` (${badge.count})` : '');

      // Meta badge gets special black color, Huh??? badge gets rainbow
      let color = rarityScale[badge.rarity] || '#cccccc';
      if (badge.type === 'meta') {
        color = '#000000';
      } else if (badge.type === 'huh') {
        color = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
      }
      
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      if (badge.type === 'huh') {
        hexagon.style.backgroundSize = '400% 400%';
        hexagon.style.animation = 'gradient-shift 3s ease infinite';
      }

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badgeName;
      hexagon.appendChild(content);

      badgeWrapper.appendChild(hexagon);
      container.appendChild(badgeWrapper);
    });

    hiddenSection.appendChild(container);
    badgesDiv.appendChild(hiddenSection);
  }
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
