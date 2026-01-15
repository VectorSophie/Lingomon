// rarityScale is now imported from animations.js

const rarityOrder = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5
};

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

    // Refresh the display with new language
    displayWordDex(currentSort);
  });
}

// Quiz logic moved to quiz.js

// Deprecated functions (clean up in future)
function toggleQuizMode() {
}


// Quiz logic moved to quiz.js

// Deprecated functions (clean up in future)
function toggleQuizMode() {
}

// Quiz logic moved to quiz.js

// Deprecated functions (clean up in future)
function toggleQuizMode() {
}

function startQuiz(options = { size: 5 }) {
  const container = document.getElementById('quizContainer');
  // If we are already in the middle of a quiz (and not just starting from menu), don't reset unless force
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const wordDex = data.wordDex || {};
    const words = Object.entries(wordDex);

    // Select random words
    const shuffled = words.sort(() => 0.5 - Math.random());
    const quizSize = options.size || 5;
    quizData.questions = shuffled.slice(0, Math.min(quizSize, words.length));
    quizData.currentIndex = 0;
    quizData.score = 0;
    quizData.total = quizData.questions.length;
    quizData.processing = false;

    showQuestion();
  });
}

function showQuestion() {
  quizData.processing = false;
  const quizContainer = document.getElementById('quizContainer');
  if (quizData.currentIndex >= quizData.questions.length) {
    showResults();
    return;
  }

  const [word, info] = quizData.questions[quizData.currentIndex];
  const definition = info.origin || 'No definition available';

  quizContainer.innerHTML = `
    <div class="quiz-score">${t('quizQuestion')} ${quizData.currentIndex + 1} ${t('quizOf')} ${quizData.total}</div>
    <div class="quiz-question">
      <strong>${t('quizDefinition')}</strong><br>
      ${escapeHtml(definition)}
    </div>
    <div class="quiz-question">
      <strong>${t('quizFillBlank')}</strong><br>
      ${t('quizTheWordIs')} <input type="text" class="quiz-input" id="quizAnswer" placeholder="${t('quizAnswerPlaceholder')}">
    </div>
    <button class="quiz-btn" id="submitAnswer">${t('quizSubmit')}</button>
    <button class="quiz-btn" id="skipQuestion">${t('quizSkip')}</button>
  `;

  const input = document.getElementById('quizAnswer');
  const submitBtn = document.getElementById('submitAnswer');
  const skipBtn = document.getElementById('skipQuestion');

  input.focus();

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkAnswer(word);
    }
  });

  submitBtn.addEventListener('click', () => checkAnswer(word));
  skipBtn.addEventListener('click', () => {
    quizData.currentIndex++;
    showQuestion();
  });
}

function checkAnswer(correctWord) {
  if (quizData.processing) return;
  quizData.processing = true;

  const input = document.getElementById('quizAnswer');
  const submitBtn = document.getElementById('submitAnswer');
  const skipBtn = document.getElementById('skipQuestion');
  
  // Disable controls to prevent multiple submissions
  input.disabled = true;
  submitBtn.disabled = true;
  if (skipBtn) skipBtn.disabled = true;

  const answer = input.value.trim().toLowerCase();
  const isCorrect = answer === correctWord;

  if (isCorrect) {
    quizData.score++;
  }

  const quizContainer = document.getElementById('quizContainer');
  const resultDiv = document.createElement('div');
  resultDiv.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
  resultDiv.innerHTML = isCorrect
    ? t('quizCorrect', { word: correctWord })
    : t('quizIncorrect', { word: correctWord });

  quizContainer.insertBefore(resultDiv, quizContainer.firstChild);

  setTimeout(() => {
    quizData.currentIndex++;
    showQuestion();
  }, 2000);
}

function showResults() {
  const quizContainer = document.getElementById('quizContainer');
  const percentage = Math.round((quizData.score / quizData.total) * 100);

  let message = '';
  if (percentage === 100) {
    message = t('quizPerfect');
  } else if (percentage >= 80) {
    message = t('quizGreat');
  } else if (percentage >= 60) {
    message = t('quizGood');
  } else {
    message = t('quizPractice');
  }

  quizContainer.innerHTML = `
    <div class="quiz-score">${t('quizComplete')}</div>
    <div class="quiz-result ${percentage >= 60 ? 'correct' : 'incorrect'}">
      <strong>${t('quizScore')} ${quizData.score} / ${quizData.total} (${percentage}%)</strong><br><br>
      ${message}
    </div>
  `;

  const tryAgainBtn = document.createElement('button');
  tryAgainBtn.className = 'quiz-btn';
  tryAgainBtn.textContent = t('quizTryAgain');
  tryAgainBtn.addEventListener('click', startQuiz);

  const backBtn = document.createElement('button');
  backBtn.className = 'quiz-btn';
  backBtn.textContent = t('quizBack');
  backBtn.addEventListener('click', renderQuizMenu);

  quizContainer.appendChild(tryAgainBtn);
  quizContainer.appendChild(backBtn);
}

let supabaseClient = null;

function initSupabase() {
  if (typeof supabase !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
    try {
      supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
      console.log('Supabase client initialized');
      checkAuthState();
    } catch (e) {
      console.error('Failed to initialize Supabase:', e);
    }
  }
}

async function checkAuthState() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateAuthUI(session?.user);
}

function updateAuthUI(user) {
  const container = document.querySelector('.header-container div');
  if (!container) return;

  const existingAuthBtn = document.getElementById('authBtn');
  if (existingAuthBtn) existingAuthBtn.remove();

  const authBtn = document.createElement('button');
  authBtn.id = 'authBtn';
  authBtn.className = 'dark-mode-toggle';
  authBtn.style.marginLeft = '8px';
  
  if (user) {
    authBtn.className = 'dark-mode-toggle';
    authBtn.innerHTML = `
      <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}" style="width:16px;height:16px;margin-right:4px;vertical-align:middle;border-radius:50%;">
      Profile
    `;
    authBtn.title = `Logged in as ${user.email}`;
    authBtn.onclick = showProfile;
  } else {
    authBtn.className = 'google-btn';
    authBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:6px;vertical-align:middle;">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>Sign in
    `;
    authBtn.title = 'Login with Google';
    authBtn.onclick = loginWithGoogle;
  }

  container.appendChild(authBtn);
}

async function loginWithGoogle() {
  if (!supabaseClient) return;
  
  const redirectURL = chrome.identity.getRedirectURL();
  const authUrl = `${CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectURL)}`;
  
  console.log("Launching Manual WebAuthFlow:", authUrl);

  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, async (redirectUrl) => {
    console.log("WebAuthFlow callback url:", redirectUrl);
    if (chrome.runtime.lastError || !redirectUrl) {
      console.error('Auth flow failed:', chrome.runtime.lastError ? JSON.stringify(chrome.runtime.lastError) : 'No redirect URL');
      return;
    }
    
    // Parse the session from the URL
    // Supabase returns the session params in the hash
    const url = new URL(redirectUrl);
    const params = new URLSearchParams(url.hash.substring(1)); // remove #
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    
    console.log("Tokens received:", { access_token: !!access_token, refresh_token: !!refresh_token });

    if (access_token && refresh_token) {
      const { error } = await supabaseClient.auth.setSession({
        access_token,
        refresh_token
      });
      
      if (error) {
          console.error("Supabase setSession error:", error);
      } else {
          console.log("Session set successfully");
          checkAuthState();
      }
    } else {
        console.error("Missing tokens in redirect URL");
    }
  });
}

let currentUserProfile = null;

async function getProfile() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') { // Not found
    // Create new profile
    const newProfile = {
      id: user.id,
      username: 'Trainer ' + user.id.slice(0, 4),
      avatar_id: 1,
      rating: 1000,
      wins: 0,
      losses: 0,
      total_words: 0
    };
    const { error: insertError } = await supabaseClient.from('profiles').insert([newProfile]);
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }
    return newProfile;
  }
  
  return data;
}

async function showProfile() {
  const mainContent = document.getElementById('mainContent');
  const quizContainer = document.getElementById('quizContainer');
  const searchBar = document.getElementById('searchBar');
  const controls = document.querySelector('.controls');
  const container = document.getElementById('profileContainer');
  
  mainContent.style.display = 'none';
  quizContainer.style.display = 'none';
  searchBar.style.display = 'none';
  controls.style.display = 'none';
  
  container.style.display = 'block';
  container.innerHTML = '<p>Loading profile...</p>';

  const profile = await getProfile();
  if (!profile) {
    container.innerHTML = '<p>Error loading profile. Please log in.</p><button class="back-btn">Back</button>';
    container.querySelector('.back-btn').onclick = closeProfile;
    return;
  }
  
  currentUserProfile = profile;
  
  // Sync local word count
  chrome.storage.local.get(['wordDex'], async (data) => {
    const count = Object.keys(data.wordDex || {}).length;
    if (profile && count !== profile.total_words) {
      await supabaseClient.from('profiles').update({ total_words: count }).eq('id', profile.id);
      profile.total_words = count;
    }
    renderProfileUI(profile);
  });
}

function closeProfile() {
  const container = document.getElementById('profileContainer');
  container.style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('searchBar').style.display = 'block';
  document.querySelector('.controls').style.display = 'flex';
}

// Battle logic moved to battle.js
// Quiz logic moved to quiz.js

function calculatePower(wordData) {
  if(!wordData) return 0;
  return calculateStat(wordData, 'hp') + calculateStat(wordData, 'atk') + calculateStat(wordData, 'speed');
}

async function fetchTeam(userId) {
  if (!supabaseClient) return;
  const { data } = await supabaseClient
    .from('battle_teams')
    .select('team_data')
    .eq('user_id', userId)
    .single();
  
  if (data && data.team_data && Array.isArray(data.team_data)) {
    currentTeam = data.team_data;
    // Ensure length is 5
    while(currentTeam.length < 5) currentTeam.push(null);
  } else {
    currentTeam = [null, null, null, null, null];
  }
  renderTeamUI();
}

function renderTeamUI() {
  const container = document.getElementById('teamUI');
  if (!container) return;
  
  container.innerHTML = '';
  let power = 0;
  
  currentTeam.forEach((wordData, idx) => {
    const slot = document.createElement('div');
    slot.className = `team-slot ${wordData ? 'filled' : ''}`;
    slot.onclick = () => openTeamSelector(idx);
    
    if (wordData) {
      const p = calculatePower(wordData);
      power += p;
      
      if (wordData.rarity === 'god') {
        slot.style.borderWidth = '2px';
        slot.style.borderStyle = 'solid';
        slot.style.borderImage = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1';
        slot.innerHTML = `
          <div class="slot-word" style="background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">${wordData.word}</div>
          <div class="slot-stats-preview">P:${p}</div>
        `;
      } else {
        slot.style.borderColor = rarityScale[wordData.rarity] || '#ccc';
        slot.innerHTML = `
          <div class="slot-word">${wordData.word}</div>
          <div class="slot-stats-preview">P:${p}</div>
        `;
      }
    } else {
      slot.textContent = '+';
    }
    container.appendChild(slot);
  });
  
  const powerLabel = document.getElementById('teamPower');
  if(powerLabel) powerLabel.textContent = `Power: ${power}`;
  
  document.getElementById('saveTeamBtn').style.display = 'block';
}

async function saveTeam() {
  if (!currentUserProfile || !supabaseClient) return;
  
  const saveBtn = document.getElementById('saveTeamBtn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  const power = currentTeam.reduce((acc, w) => acc + calculatePower(w), 0);
  
  const { error } = await supabaseClient
    .from('battle_teams')
    .upsert({ 
      user_id: currentUserProfile.id,
      team_data: currentTeam,
      team_power: power,
      updated_at: new Date()
    });
    
  if (error) {
    console.error('Save failed:', error);
    alert(t('profileSaveFail'));
  } else {
    saveBtn.textContent = t('profileSaved');
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  }
}

function openTeamSelector(idx) {
  editingSlot = idx;
  const modal = document.getElementById('teamSelectorModal');
  const searchInput = document.getElementById('miniSearch');
  modal.style.display = 'flex';
  searchInput.value = '';
  searchInput.focus();
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const dex = data.wordDex || {};
    renderMiniDex(dex);
    
    searchInput.oninput = (e) => {
      renderMiniDex(dex, e.target.value);
    };
  });
  
  const closeModal = document.getElementById('closeModal');
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  }
}

function renderMiniDex(dex, filter = '') {
  const list = document.getElementById('miniDexList');
  list.innerHTML = '';
  
  // Convert to array and sort by rarity then alpha
  const entries = Object.entries(dex).filter(([word, info]) => {
    if (!filter) return true;
    return word.toLowerCase().includes(filter.toLowerCase());
  });
  
  // Sort: Rarity Desc
  entries.sort((a, b) => {
    const rA = rarityOrder[a[1].rarity] ?? 5;
    const rB = rarityOrder[b[1].rarity] ?? 5;
    return rA - rB;
  });
  
  // Add "Remove" option
  const removeOpt = document.createElement('div');
  removeOpt.className = 'mini-entry';
  removeOpt.style.color = '#ff4444';
  removeOpt.innerHTML = `<span>(Empty Slot)</span>`;
  removeOpt.onclick = () => {
    currentTeam[editingSlot] = null;
    renderTeamUI();
    document.getElementById('teamSelectorModal').style.display = 'none';
  };
  list.appendChild(removeOpt);

  entries.forEach(([word, info]) => {
    // Check if word is already in team (ignore current slot)
    const isUsed = currentTeam.some((member, idx) => 
      member && member.word === word && idx !== editingSlot
    );

    const item = document.createElement('div');
    item.className = 'mini-entry';
    if (isUsed) {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
      item.title = 'Already in team';
      item.style.background = '#eee'; // Visual cue
    }

    const color = rarityScale[info.rarity] || '#000';
    
    // Tiny stat preview
    const dummyWord = { word: word, rarity: info.rarity };
    const power = calculatePower(dummyWord);
    
    item.innerHTML = `
      <span>${word}</span>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:10px; color:#666">P:${power}</span>
        <span style="font-size:10px; color:${color}; font-weight:bold;">${info.rarity.toUpperCase().slice(0,1)}</span>
      </div>
    `;
    
    item.onclick = () => {
      if (isUsed) return;
      currentTeam[editingSlot] = { word: word, rarity: info.rarity };
      renderTeamUI();
      document.getElementById('teamSelectorModal').style.display = 'none';
    };
    list.appendChild(item);
  });
}

// --- Battle System ---
// Moved to battle.js

// Moved to battle.js
async function startBattle() {
  if (!currentUserProfile) { 
      alert(t('profileLoginReq')); 
      return; 
  }
  
  if (currentTeam.filter(w => w).length === 0) {
      alert(t('profileTeamReq'));
      return;
  }
  
  // Find opponent
  // NOTE: In real app, use a random sort RPC. 
  // Here we just fetch first 10 and pick random to save cost.
  let enemyTeamData = [];
  
  if (supabaseClient) {
      const { data } = await supabaseClient
        .from('battle_teams')
        .select('*')
        .neq('user_id', currentUserProfile.id)
        .limit(10);
        
      if (data && data.length > 0) {
          const randomOpponent = data[Math.floor(Math.random() * data.length)];
          enemyTeamData = randomOpponent.team_data;
          console.log("Battling user:", randomOpponent.user_id);
      }
  }
  
  // Fallback Bot
  if (enemyTeamData.length === 0) {
      enemyTeamData = [
          {word: "Bug", rarity: "common"}, 
          {word: "Glitch", rarity: "rare"},
          {word: "Error", rarity: "uncommon"}
      ];
  }
  
  // Switch UI
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('searchBar').style.display = 'none';
  document.querySelector('.controls').style.display = 'none';
  document.getElementById('battleContainer').style.display = 'flex';
  
  // battleSystem is defined in battle.js
  battleSystem = new BattleSystem(currentTeam, enemyTeamData);
  battleSystem.start();
}

async function startBattle() {
  if (!currentUserProfile) { 
      alert(t('profileLoginReq')); 
      return; 
  }
  
  if (currentTeam.filter(w => w).length === 0) {
      alert(t('profileTeamReq'));
      return;
  }
  
  // Find opponent
  // NOTE: In real app, use a random sort RPC. 
  // Here we just fetch first 10 and pick random to save cost.
  let enemyTeamData = [];
  
  if (supabaseClient) {
      const { data } = await supabaseClient
        .from('battle_teams')
        .select('*')
        .neq('user_id', currentUserProfile.id)
        .limit(10);
        
      if (data && data.length > 0) {
          const randomOpponent = data[Math.floor(Math.random() * data.length)];
          enemyTeamData = randomOpponent.team_data;
          console.log("Battling user:", randomOpponent.user_id);
      }
  }
  
  // Fallback Bot
  if (enemyTeamData.length === 0) {
      enemyTeamData = [
          {word: "Bug", rarity: "common"}, 
          {word: "Glitch", rarity: "rare"},
          {word: "Error", rarity: "uncommon"}
      ];
  }
  
  // Switch UI
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('searchBar').style.display = 'none';
  document.querySelector('.controls').style.display = 'none';
  document.getElementById('battleContainer').style.display = 'flex';
  
  battleSystem = new BattleSystem(currentTeam, enemyTeamData);
  battleSystem.start();
}

function closeBattle() {
  document.getElementById('battleContainer').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('searchBar').style.display = 'block';
  document.querySelector('.controls').style.display = 'flex';
}

function renderProfileUI(profile) {
  const container = document.getElementById('profileContainer');
  
  // Avatar URL (using a free placeholder service for now based on ID)
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`;

  container.innerHTML = `
    <img src="${avatarUrl}" class="profile-avatar" alt="Avatar">
    <input type="text" class="profile-name-input" value="${escapeHtml(profile.username)}" maxlength="15" spellcheck="false">
    
    <div class="profile-stats">
      <div class="stat-item">
        <span class="stat-value">${profile.rating}</span>
        <span class="stat-label">${t('profileRating')}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" style="color:#a1ff96">${profile.wins}</span>
        <span class="stat-label">${t('profileWins')}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" style="color:#ff6969">${profile.losses}</span>
        <span class="stat-label">${t('profileLosses')}</span>
      </div>
    </div>
    
    <div class="profile-stats">
       <div class="stat-item">
        <span class="stat-value">${profile.total_words}</span>
        <span class="stat-label">${t('profileWords')}</span>
      </div>
    </div>

    <!-- Team Section -->
    <div class="team-section">
      <strong style="font-size:14px; display:block;">${t('profileTeam')}</strong>
      <span id="teamPower" style="font-size:11px; color:#666;">Power: 0</span>
      <div id="teamUI" class="team-container"></div>
      <button id="saveTeamBtn" class="save-team-btn" style="display:none;">${t('profileSave')}</button>
    </div>

    <button class="back-btn">${t('profileBack')}</button>
  `;

  // Event Listeners
  container.querySelector('.back-btn').onclick = closeProfile;
  container.querySelector('#saveTeamBtn').onclick = saveTeam;

  const nameInput = container.querySelector('.profile-name-input');
  nameInput.onchange = async (e) => {
    const newName = e.target.value.trim();
    if (newName) {
       await supabaseClient.from('profiles').update({ username: newName }).eq('id', profile.id);
    }
  };
  
  // Initialize Team
  fetchTeam(profile.id);
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
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('battleContainer').style.display = 'none';
  document.getElementById('profileContainer').style.display = 'none';
  
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
    // Check login before showing battle container
    if (!currentUserProfile) {
        alert("Please login to access Battle Arena");
        switchTab('dex'); // Go back
        return;
    }
    
    document.getElementById('battleContainer').style.display = 'flex';
    // If not currently battling, start one
    if (!battleSystem || !battleSystem.active) {
       startBattle();
    }
  }
}

async function initializePopup() {
  await setupLanguageToggle(); // Wait for language to load first
  await setupDarkMode(); // Then setup dark mode with correct language
  initSupabase(); // Initialize Supabase
  setupSortButtons();
  setupSearchBar();
  setupTabs();
  
  // Default to Dex
  switchTab('dex');
  
  initKofi();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
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
