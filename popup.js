const rarityScale = {
  common: '#ebebeb',
  uncommon: '#a1ff96',
  rare: '#96c7ff',
  epic: '#b996ff',
  legendary: '#fffa96',
  mythic: '#ff6969'
};

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
        dexDiv.innerHTML = '<p style="color: gray; text-align: center; padding: 20px;">No words found matching your search.</p>';
      } else if (entries.length === 0) {
        dexDiv.innerHTML = '<p style="color: gray; text-align: center; padding: 20px;">No words collected yet. Right-click words on web pages to start collecting!</p>';
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

          const rarityDiv = document.createElement('div');
          rarityDiv.className = 'rarity';
          rarityDiv.textContent = rarity.toUpperCase();
          rarityDiv.style.color = rarityScale[rarity] || '#9b8bb5';

          const originDiv = document.createElement('div');
          originDiv.className = 'word-info';
          originDiv.textContent = origin.length > 150 ? origin.substring(0, 150) + '...' : origin;

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'delete';
          deleteBtn.className = 'delete-btn';
          deleteBtn.style.position = 'absolute';
          deleteBtn.style.top = '10px';
          deleteBtn.style.right = '0px';
          deleteBtn.style.background = 'transparent';
          deleteBtn.style.border = 'none';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.fontSize = '16px';
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
      statsStrong.textContent = 'Collection Stats';

      const statsP = document.createElement('p');
      statsP.style.margin = '8px 0 0 0';
      statsP.appendChild(statsStrong);
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Total Words: ${total}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createElement('br'));

      // Streak display
      const streakSpan = document.createElement('span');
      streakSpan.style.fontWeight = 'bold';
      streakSpan.style.color = streakData.currentStreak >= 7 ? '#fffa96' : streakData.currentStreak >= 3 ? '#96c7ff' : '#000000';
      streakSpan.textContent = `Streak: ${streakData.currentStreak} day${streakData.currentStreak !== 1 ? 's' : ''}`;
      statsP.appendChild(streakSpan);
      statsP.appendChild(document.createElement('br'));

      if (streakData.longestStreak > 0) {
        statsP.appendChild(document.createTextNode(`Longest: ${streakData.longestStreak} day${streakData.longestStreak !== 1 ? 's' : ''}`));
        statsP.appendChild(document.createElement('br'));
      }

      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Common: ${commonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Uncommon: ${uncommonCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Rare: ${rareCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Epic: ${epicCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Legendary: ${legendaryCount}`));
      statsP.appendChild(document.createElement('br'));
      statsP.appendChild(document.createTextNode(`Mythic: ${mythicCount}`));

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
  graphTitle.textContent = 'Words Caught (Last 7 Days)';
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
  pieTitle.textContent = 'Rarity Distribution';
  pieTitle.style.display = 'block';
  pieTitle.style.marginBottom = '8px';
  pieDiv.appendChild(pieTitle);

  const total = Object.values(achievements).reduce((sum, count) => sum + count, 0);
  if (total > 0) {
    const rarityColors = {
      common: '#ebebeb',
      uncommon: '#a1ff96',
      rare: '#96c7ff',
      epic: '#b996ff',
      legendary: '#fffa96',
      mythic: '#ff6969'
    };

    let currentPercent = 0;
    const pieSegments = document.createElement('div');
    pieSegments.style.display = 'flex';
    pieSegments.style.height = '20px';
    pieSegments.style.borderRadius = '10px';
    pieSegments.style.overflow = 'hidden';
    pieSegments.style.marginBottom = '8px';

    Object.entries(achievements).forEach(([rarity, count]) => {
      if (count > 0) {
        const percent = (count / total) * 100;
        const segment = document.createElement('div');
        segment.style.width = `${percent}%`;
        segment.style.background = rarityColors[rarity] || '#cccccc';
        segment.title = `${rarity}: ${count} (${percent.toFixed(1)}%)`;
        pieSegments.appendChild(segment);
      }
    });

    pieDiv.appendChild(pieSegments);

    // Legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '8px';
    legend.style.fontSize = '11px';

    Object.entries(achievements).forEach(([rarity, count]) => {
      if (count > 0) {
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
        text.textContent = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${percent}%`;
        item.appendChild(text);

        legend.appendChild(item);
      }
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
    mainTitle.textContent = 'Achievements';
    mainSection.appendChild(mainTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.main.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';
      hexagon.title = badge.name + (badge.next ? ` - Next: ${badge.next.name}` : ' - Max level!');

      const color = rarityScale[badge.rarity] || '#cccccc';
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badge.name;
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
    hiddenTitle.textContent = 'Hidden Badges';
    hiddenSection.appendChild(hiddenTitle);

    const container = document.createElement('div');
    container.className = 'badge-container';

    badges.hidden.forEach(badge => {
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.textAlign = 'center';

      const hexagon = document.createElement('div');
      hexagon.className = 'badge-hexagon';
      hexagon.title = badge.name + (badge.count ? ` (${badge.count})` : '');

      const color = rarityScale[badge.rarity] || '#cccccc';
      hexagon.style.setProperty('--badge-color', color);
      hexagon.style.background = color;

      const content = document.createElement('div');
      content.className = 'badge-content';
      content.textContent = badge.name;
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
      currentSort = sortType;
      displayWordDex(sortType);
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
  if (!confirm(`Delete "${word}" from your collection?`)) {
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

function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  chrome.storage.local.get(['darkMode'], (data) => {
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
      toggle.textContent = 'Light';
    }
  });

  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    toggle.textContent = isDark ? 'Light' : 'Dark';
    chrome.storage.local.set({ darkMode: isDark });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupDarkMode();
    setupSortButtons();
    setupSearchBar();
    displayWordDex(currentSort);
    initKofi();
  });
} else {
  setupDarkMode();
  setupSortButtons();
  setupSearchBar();
  displayWordDex(currentSort);
  initKofi();
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
