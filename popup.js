const rarityScale = {
  common: '#a0e7e5',
  uncommon: '#b4f8c8',
  rare: '#fce38a',
  legendary: '#f38181'
};

chrome.storage.local.get(["wordDex", "achievements"], (data) => {
  const dex = data.wordDex || {};
  const stats = data.achievements || {};
  const dexDiv = document.getElementById("dex");
  const entries = Object.entries(dex).sort((a, b) => a[0].localeCompare(b[0]));

  entries.forEach(([word, info]) => {
    const div = document.createElement("div");
    div.className = "word-entry";
    div.innerHTML = `
      <strong style="color:${rarityScale[info.rarity]}">${word}</strong>
      <div class="rarity">${info.rarity.toUpperCase()}</div>
      <div>${info.origin}</div>`;
    dexDiv.appendChild(div);
  });

  document.getElementById("stats").innerHTML = `
    <p><strong>Achievements</strong><br>
    Common: ${stats.common || 0}<br>
    Uncommon: ${stats.uncommon || 0}<br>
    Rare: ${stats.rare || 0}<br>
    Legendary: ${stats.legendary || 0}</p>`;
});
