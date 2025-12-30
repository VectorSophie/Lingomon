// Import word frequency database for fallback
importScripts('wordFrequency.js');
console.log('Lingomon: Frequency-based rarity system LOADED v2.0');

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

// Helper function to send messages to either tabs or runtime (for extension pages)
async function sendMessageToContext(isMetaCatch, tabId, message) {
  if (isMetaCatch) {
    // For extension pages (popup), use runtime messaging
    console.log('Lingomon: Sending message via runtime (catching from popup)');
    return chrome.runtime.sendMessage(message);
  } else if (tabId) {
    // For regular web pages, use tab messaging
    return chrome.tabs.sendMessage(tabId, message);
  } else {
    console.warn('Lingomon: No valid tab ID');
    return Promise.reject(new Error('No valid message target'));
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "definitionLookup") return;

  // Check if catching from extension pages (Meta badge)
  // Extension popups might not have a valid tab.id, so check URL first
  const isMetaCatch = tab && tab.url && (tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'));

  // For extension pages, tab.id might be invalid, but we still want to process
  // For regular pages, validate the tab
  if (!isMetaCatch && (!tab || !tab.id || tab.id < 0)) {
    console.log('Lingomon: Invalid tab context, ignoring');
    return;
  }

  const word = info.selectionText.trim().toLowerCase().replace(/[-'']/g, '');
  if (!word.match(/^[a-zA-Z]{3,}$/)) {
    let errorMessage = "Invalid word format.";
    if (word.length < 3) {
      errorMessage = "Word must be at least 3 letters long.";
    } else if (!word.match(/^[a-zA-Z]+$/)) {
      errorMessage = "Word must contain only letters (no numbers or special characters).";
    }

    sendMessageToContext(isMetaCatch, tab.id, {
      type: 'wordFailed',
      word: word,
      error: errorMessage
    }).catch(err => {
      console.log('Lingomon: Could not send validation error message:', err);
    });
    return;
  }

  try {
    // Launch both API calls in parallel for speed
    const dictionaryPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return res;
    })();

    const frequencyPromise = fetchWordFrequency(word);

    // Wait for both (or fail gracefully)
    const [res, freqData] = await Promise.all([dictionaryPromise, frequencyPromise]);
    console.log(`Lingomon: Fetched frequency for "${word}":`, freqData);

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
    const example = defObj.example || '';
    const partOfSpeech = firstMeaning.partOfSpeech || '';

    let etymology = data[0].origin || '';

    let origin;
    const defText = `${partOfSpeech ? `(${partOfSpeech}) ` : ''}${definition}`;
    const exampleText = example ? `\n\nExample: "${example}"` : '';

    if (etymology) {
      origin = `${etymology}\n\n${defText}${exampleText}`;
    } else {
      origin = `${defText}${exampleText}`;
    }

    const rarity = getWordRarity(word, freqData.frequency, freqData.source);

    // Extract domain from tab URL
    let domain = 'unknown';
    try {
      const url = new URL(tab.url);
      domain = url.hostname;
    } catch (e) {
      console.error('Could not extract domain:', e);
    }

    chrome.storage.local.get({ wordDex: {}, achievements: {}, streakData: {}, sitesExplored: {}, badges: { main: [], hidden: [] } }, (storageData) => {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        return;
      }

      const wordDex = storageData.wordDex || {};
      const achievements = storageData.achievements || {};
      const streakData = storageData.streakData || { currentStreak: 0, longestStreak: 0, lastCatchDate: null };
      const sitesExplored = storageData.sitesExplored || {};
      const isNew = !wordDex[word];
      const firstCaughtDate = isNew ? Date.now() : (wordDex[word].firstCaught || wordDex[word].timestamp || Date.now());

      wordDex[word] = {
        origin,
        rarity,
        frequency: freqData.frequency,
        frequencySource: freqData.source,
        timestamp: Date.now(),
        firstCaught: firstCaughtDate,
        caughtOn: domain
      };

      // Track unique sites
      if (!sitesExplored[domain]) {
        sitesExplored[domain] = {
          firstVisit: Date.now(),
          wordCount: 0
        };
      }
      sitesExplored[domain].wordCount += 1;
      sitesExplored[domain].lastVisit = Date.now();

      if (isNew) {
        achievements[rarity] = (achievements[rarity] || 0) + 1;
      }

      // Update streak
      const today = new Date().toDateString();
      const lastCatch = streakData.lastCatchDate;

      if (lastCatch !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastCatch === yesterdayStr) {
          // Consecutive day
          streakData.currentStreak += 1;
        } else if (lastCatch === null || lastCatch === undefined) {
          // First catch ever
          streakData.currentStreak = 1;
        } else {
          // Streak broken
          streakData.currentStreak = 1;
        }

        streakData.lastCatchDate = today;

        if (streakData.currentStreak > (streakData.longestStreak || 0)) {
          streakData.longestStreak = streakData.currentStreak;
        }
      }

      // Update badges
      const existingBadges = storageData.badges || { main: [], hidden: [] };
      const badges = updateBadges(wordDex, achievements, streakData, sitesExplored, rarity, isNew, existingBadges, isMetaCatch);

      chrome.storage.local.set({ wordDex, achievements, streakData, sitesExplored, badges }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage save error:', chrome.runtime.lastError);
          return;
        }

        console.log('Lingomon: Sending wordCaught message for:', word);
        sendMessageToContext(isMetaCatch, tab.id, {
          type: 'wordCaught',
          word: word,
          origin: origin,
          rarity: rarity,
          isNew: isNew,
          firstCaught: firstCaughtDate
        }).then(response => {
          console.log('Lingomon: Message sent successfully, response:', response);
        }).catch(err => {
          console.log('Lingomon: Could not send message:', err);
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
    sendMessageToContext(isMetaCatch, tab.id, {
      type: 'wordFailed',
      word: word,
      error: errorMessage
    }).then(response => {
      console.log('Lingomon: Error message sent successfully, response:', response);
    }).catch(err => {
      console.log('Lingomon: Could not send error message:', err);
    });
  }
});

function getWordRarity(word, frequency = null, source = null) {
  // Use frequency-based rarity if available (NEW WORDS)
  if (frequency !== null) {
    const rarity = mapFrequencyToRarity(frequency);
    console.log(`Rarity for "${word}": ${rarity} (freq=${frequency}, source=${source})`);
    return rarity;
  }

  // LEGACY PATH: Keep existing logic for backward compatibility
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

// Maps frequency per million to rarity tier
function mapFrequencyToRarity(frequency) {
  if (frequency >= 100) return 'common';      // Very frequent
  if (frequency >= 25) return 'uncommon';     // Moderately frequent
  if (frequency >= 5) return 'rare';          // Less frequent
  if (frequency >= 1) return 'epic';          // Infrequent
  if (frequency >= 0.1) return 'legendary';   // Very rare
  return 'mythic';                             // Extremely rare or unknown
}

// Fetches word frequency from Datamuse API
async function fetchWordFrequency(word) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=1`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Datamuse API error for "${word}": ${res.status}`);
      return getFallbackFrequency(word);
    }

    const data = await res.json();

    // Extract frequency from tags array: ["f:123.45"]
    if (Array.isArray(data) && data.length > 0 && data[0].tags) {
      for (const tag of data[0].tags) {
        if (tag.startsWith('f:')) {
          const frequency = parseFloat(tag.substring(2));
          if (!isNaN(frequency) && frequency >= 0) {
            console.log(`Datamuse: "${word}" frequency = ${frequency}`);
            return { frequency, source: 'api' };
          }
        }
      }
    }

    // No frequency data found in API response
    console.log(`Datamuse: No frequency data for "${word}", using fallback`);
    return getFallbackFrequency(word);

  } catch (err) {
    console.log(`Datamuse error for "${word}":`, err.message);
    return getFallbackFrequency(word);
  }
}

// Fallback to local frequency database
function getFallbackFrequency(word) {
  const lowerWord = word.toLowerCase();

  // Check local database
  if (wordFrequencyMap && wordFrequencyMap[lowerWord]) {
    const frequency = wordFrequencyMap[lowerWord];
    console.log(`Local DB: "${word}" frequency = ${frequency}`);
    return { frequency, source: 'local' };
  }

  // Word not in database - treat as very rare
  console.log(`Unknown word: "${word}", treating as mythic`);
  return { frequency: null, source: 'unknown' };
}

function updateBadges(wordDex, achievements, streakData, sitesExplored, currentRarity, isNew, existingBadges, isMetaCatch) {
  const badges = {
    main: [],
    hidden: existingBadges.hidden || []
  };

  const totalWords = Object.keys(wordDex).length;
  const totalSites = Object.keys(sitesExplored).length;
  const currentStreak = streakData.currentStreak || 0;

  // Badge tier thresholds and their rarities
  const streakTiers = [
    { threshold: 365, rarity: 'mythic', name: '365 Day Streak' },
    { threshold: 100, rarity: 'legendary', name: '100 Day Streak' },
    { threshold: 30, rarity: 'epic', name: '30 Day Streak' },
    { threshold: 10, rarity: 'rare', name: '10 Day Streak' },
    { threshold: 7, rarity: 'uncommon', name: '7 Day Streak' },
    { threshold: 1, rarity: 'common', name: 'First Day' }
  ];

  const wordTiers = [
    { threshold: 500, rarity: 'mythic', name: '500 Words' },
    { threshold: 100, rarity: 'legendary', name: '100 Words' },
    { threshold: 50, rarity: 'epic', name: '50 Words' },
    { threshold: 10, rarity: 'rare', name: '10 Words' },
    { threshold: 5, rarity: 'uncommon', name: '5 Words' },
    { threshold: 1, rarity: 'common', name: 'First Word' }
  ];

  const siteTiers = [
    { threshold: 500, rarity: 'mythic', name: '500 Sites' },
    { threshold: 100, rarity: 'legendary', name: '100 Sites' },
    { threshold: 50, rarity: 'epic', name: '50 Sites' },
    { threshold: 10, rarity: 'rare', name: '10 Sites' },
    { threshold: 5, rarity: 'uncommon', name: '5 Sites' },
    { threshold: 1, rarity: 'common', name: 'First Site' }
  ];

  // Find current tier and next tier for streak
  let streakBadge = null;
  let nextStreakTier = null;
  for (let i = 0; i < streakTiers.length; i++) {
    if (currentStreak >= streakTiers[i].threshold) {
      streakBadge = { ...streakTiers[i], type: 'streak', current: currentStreak };
      nextStreakTier = i > 0 ? streakTiers[i - 1] : null;
      break;
    }
  }

  // Find current tier and next tier for words
  let wordBadge = null;
  let nextWordTier = null;
  for (let i = 0; i < wordTiers.length; i++) {
    if (totalWords >= wordTiers[i].threshold) {
      wordBadge = { ...wordTiers[i], type: 'words', current: totalWords };
      nextWordTier = i > 0 ? wordTiers[i - 1] : null;
      break;
    }
  }

  // Find current tier and next tier for sites
  let siteBadge = null;
  let nextSiteTier = null;
  for (let i = 0; i < siteTiers.length; i++) {
    if (totalSites >= siteTiers[i].threshold) {
      siteBadge = { ...siteTiers[i], type: 'sites', current: totalSites };
      nextSiteTier = i > 0 ? siteTiers[i - 1] : null;
      break;
    }
  }

  if (streakBadge) {
    streakBadge.next = nextStreakTier;
    streakBadge.progress = nextStreakTier ? (currentStreak / nextStreakTier.threshold) * 100 : 100;
    badges.main.push(streakBadge);
  }

  if (wordBadge) {
    wordBadge.next = nextWordTier;
    wordBadge.progress = nextWordTier ? (totalWords / nextWordTier.threshold) * 100 : 100;
    badges.main.push(wordBadge);
  }

  if (siteBadge) {
    siteBadge.next = nextSiteTier;
    siteBadge.progress = nextSiteTier ? (totalSites / nextSiteTier.threshold) * 100 : 100;
    badges.main.push(siteBadge);
  }

  // Hidden badges
  // First Mythic
  if (isNew && currentRarity === 'mythic') {
    const hasFirstMythic = badges.hidden.some(b => b.type === 'firstMythic');
    if (!hasFirstMythic) {
      badges.hidden.push({ type: 'firstMythic', name: 'First Mythic!', rarity: 'mythic', unlocked: true });
    }
  }

  // Rarity Killer badges (collect 10+ of each rarity)
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  for (const rarity of rarities) {
    const count = achievements[rarity] || 0;
    if (count >= 100) {
      const existingKiller = badges.hidden.find(b => b.type === 'rarityKiller' && b.rarity === rarity);
      if (existingKiller) {
        existingKiller.count = count;
      } else {
        badges.hidden.push({
          type: 'rarityKiller',
          name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Killer`,
          rarity: rarity,
          count: count,
          unlocked: true
        });
      }
    }
  }

  // Meta badge (catch word from extension page)
  if (isMetaCatch) {
    const hasMeta = badges.hidden.some(b => b.type === 'meta');
    if (!hasMeta) {
      badges.hidden.push({
        type: 'meta',
        name: 'Meta',
        rarity: 'epic',
        unlocked: true
      });
    }
  }

  return badges;
}