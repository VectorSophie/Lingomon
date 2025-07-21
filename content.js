const rarityScale = {
  common: '#a0e7e5',
  uncommon: '#b4f8c8',
  rare: '#fce38a',
  legendary: '#f38181'
};

function getWordRarity(freqRank) {
  if (freqRank < 500) return 'common';
  if (freqRank < 2000) return 'uncommon';
  if (freqRank < 10000) return 'rare';
  return 'legendary';
}

function saveToWordDex(word, origin, rarity) {
  chrome.storage.local.get({ wordDex: {}, achievements: {} }, (data) => {
    const wordDex = data.wordDex;
    const achievements = data.achievements;

    const isNew = !wordDex[word];
    wordDex[word] = { origin, rarity, timestamp: Date.now() };

    // Update achievements
    if (isNew) {
      achievements[rarity] = (achievements[rarity] || 0) + 1;
    }

    chrome.storage.local.set({ wordDex, achievements });
  });
}

document.body.addEventListener("mouseover", async (e) => {
  if (!e.target || !e.target.innerText || !e.target.innerText.trim().match(/^[a-zA-Z]{3,}$/)) return;

  const word = e.target.innerText.trim();
  if (!word.match(/^[a-zA-Z]{3,}$/)) return;

  const popup = document.createElement("div");
  popup.style.position = "absolute";
  popup.style.background = "#fffaf3";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "8px";
  popup.style.padding = "10px";
  popup.style.fontSize = "14px";
  popup.style.fontFamily = "Georgia, serif";
  popup.style.boxShadow = "2px 2px 8px rgba(0,0,0,0.1)";
  popup.style.maxWidth = "280px";
  popup.style.zIndex = 9999;
  popup.innerText = "Loading etymology...";
  document.body.appendChild(popup);

  const { clientX: x, clientY: y } = e;
  popup.style.left = `${x + 10}px`;
  popup.style.top = `${y + 10}px`;

  try {
    const res = await fetch(`https://api.etymologyapi.dev/v1/word/${word.toLowerCase()}`);
    const data = await res.json();

    if (data.origin) {
      const rarity = getWordRarity(data.frequency_rank || 10000);
      saveToWordDex(word, data.origin, rarity);

      popup.innerHTML = `
        <strong style="color:${rarityScale[rarity]}; font-size: 16px;">${word}</strong><br>
        <em style="color:gray;">${rarity.toUpperCase()}</em><br>
        <div style="margin-top:6px">${data.origin}</div>`;
    } else {
      popup.innerText = "No etymology found.";
    }
  } catch (err) {
    popup.innerText = "Error fetching data.";
  }

  e.target.addEventListener("mouseleave", () => {
    popup.remove();
  }, { once: true });
});