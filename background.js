chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "definitionLookup",
    title: "Show Definition of '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "definitionLookup") return;

  const word = info.selectionText.trim();
  if (!word.match(/^[a-zA-Z]{3,}$/)) return;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No definition found');
    }

    const firstMeaning = data[0].meanings[0];
    if (!firstMeaning || !firstMeaning.definitions || firstMeaning.definitions.length === 0) {
      throw new Error('Incomplete data');
    }

    const defObj = firstMeaning.definitions[0];
    const definition = defObj.definition || 'No definition found.';
    const partOfSpeech = firstMeaning.partOfSpeech || '';
    const origin = `${partOfSpeech ? `(${partOfSpeech}) ` : ''}${definition}`;

    // Random rarity since no frequency data
    const rarity = getWordRarityRandom();

    chrome.notifications.create({
      type: "basic",
      iconUrl: "f.png",
      title: `Definition of '${word}'`,
      message: origin.slice(0, 250),
    });

    chrome.storage.local.get({ wordDex: {}, achievements: {} }, (data) => {
      const wordDex = data.wordDex;
      const achievements = data.achievements;
      const isNew = !wordDex[word];
      wordDex[word] = { definition, partOfSpeech, rarity, timestamp: Date.now() };
      if (isNew) achievements[rarity] = (achievements[rarity] || 0) + 1;
      chrome.storage.local.set({ wordDex, achievements });
    });

  } catch (err) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "f.ico",
      title: "Definition Error",
      message: err.message || "Could not fetch definition.",
    });
  }
});

function getWordRarityRandom() {
  const rand = Math.random();
  if (rand < 0.5) return 'common';
  if (rand < 0.8) return 'uncommon';
  if (rand < 0.95) return 'rare';
  return 'legendary';
}