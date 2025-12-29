const commonWords = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
  'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may'
]);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "definitionLookup",
    title: "Catch '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "definitionLookup") return;

  const word = info.selectionText.trim();
  if (!word.match(/^[a-zA-Z]{3,}$/)) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Word not found in dictionary');
      }
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No definition found');
    }

    if (!data[0] || !data[0].meanings || !Array.isArray(data[0].meanings) || data[0].meanings.length === 0) {
      throw new Error('No meanings available');
    }

    const firstMeaning = data[0].meanings[0];
    if (!firstMeaning.definitions || !Array.isArray(firstMeaning.definitions) || firstMeaning.definitions.length === 0) {
      throw new Error('No definitions available');
    }

    const defObj = firstMeaning.definitions[0];
    const definition = defObj.definition || 'No definition found.';
    const partOfSpeech = firstMeaning.partOfSpeech || '';

    let etymology = data[0].origin || '';

    let origin;
    if (etymology) {
      origin = `${etymology}\n\n${partOfSpeech ? `(${partOfSpeech}) ` : ''}${definition}`;
    } else {
      origin = `${partOfSpeech ? `(${partOfSpeech}) ` : ''}${definition}`;
    }

    const rarity = getWordRarity(word);

    chrome.storage.local.get({ wordDex: {}, achievements: {} }, (storageData) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }

      const wordDex = storageData.wordDex || {};
      const achievements = storageData.achievements || {};
      const isNew = !wordDex[word];

      wordDex[word] = { origin, rarity, timestamp: Date.now() };

      if (isNew) {
        achievements[rarity] = (achievements[rarity] || 0) + 1;
      }

      chrome.storage.local.set({ wordDex, achievements }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage save error:', chrome.runtime.lastError);
          return;
        }

        console.log('Lingomon: Sending wordCaught message for:', word);
        chrome.tabs.sendMessage(tab.id, {
          type: 'wordCaught',
          word: word,
          origin: origin,
          rarity: rarity,
          isNew: isNew
        }).then(response => {
          console.log('Lingomon: Message sent successfully, response:', response);
        }).catch(err => {
          console.log('Lingomon: Could not send message to tab:', err);
        });
      });
    });

  } catch (err) {
    let errorMessage = "Could not fetch definition.";

    if (err.name === 'AbortError') {
      errorMessage = "Request timeout. Please try again.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    console.log('Lingomon: Sending wordFailed message for:', word);
    chrome.tabs.sendMessage(tab.id, {
      type: 'wordFailed',
      word: word,
      error: errorMessage
    }).then(response => {
      console.log('Lingomon: Error message sent successfully, response:', response);
    }).catch(err => {
      console.log('Lingomon: Could not send error message to tab:', err);
    });
  }
});

function getWordRarity(word) {
  const lowerWord = word.toLowerCase();
  const wordLength = word.length;

  if (commonWords.has(lowerWord)) {
    return 'common';
  }

  if (wordLength <= 5) {
    const rand = Math.random();
    if (rand < 0.85) return 'common';
    return 'uncommon';
  }

  if (wordLength <= 7) {
    const rand = Math.random();
    if (rand < 0.65) return 'common';
    if (rand < 0.88) return 'uncommon';
    if (rand < 0.98) return 'rare';
    return 'epic';
  }

  if (wordLength <= 10) {
    const rand = Math.random();
    if (rand < 0.30) return 'common';
    if (rand < 0.55) return 'uncommon';
    if (rand < 0.78) return 'rare';
    if (rand < 0.93) return 'epic';
    if (rand < 0.99) return 'legendary';
    return 'mythic';
  }

  if (wordLength <= 13) {
    const rand = Math.random();
    if (rand < 0.10) return 'uncommon';
    if (rand < 0.35) return 'rare';
    if (rand < 0.65) return 'epic';
    if (rand < 0.90) return 'legendary';
    return 'mythic';
  }

  const rand = Math.random();
  if (rand < 0.20) return 'epic';
  if (rand < 0.60) return 'legendary';
  return 'mythic';
}