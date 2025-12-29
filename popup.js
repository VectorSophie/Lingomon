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
  chrome.storage.local.get(["wordDex", "achievements"], (data) => {
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
      entries = sortEntries(entries, sortType);

      if (entries.length === 0) {
        dexDiv.innerHTML = '<p style="color: gray; text-align: center; padding: 20px;">No words collected yet. Right-click words on web pages to start collecting!</p>';
      } else {
        entries.forEach(([word, info]) => {
          if (!info || typeof info !== 'object') {
            console.warn(`Invalid data for word: ${word}`);
            return;
          }

          const div = document.createElement("div");
          div.className = "word-entry";

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

          div.appendChild(wordStrong);
          div.appendChild(rarityDiv);
          div.appendChild(originDiv);

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
      currentSort = sortType;
      displayWordDex(sortType);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupSortButtons();
    displayWordDex(currentSort);
    initKofi();
  });
} else {
  setupSortButtons();
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
