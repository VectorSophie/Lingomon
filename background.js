// Import word frequency database for fallback
importScripts('wordFrequency.js');
importScripts('i18n.js');
importScripts('config.js');
console.log('Lingomon: Frequency-based rarity system LOADED v2.0');

// Korean API Key (from config.js)
const KOREAN_API_KEY = CONFIG.KOREAN_API_KEY;

// Mutex for serializing storage operations to prevent race conditions
class Mutex {
  constructor() {
    this.queue = Promise.resolve();
  }
  dispatch(fn) {
    const next = this.queue.then(fn);
    this.queue = next.catch(e => console.error("Mutex execution error:", e));
    return next;
  }
}
const storageMutex = new Mutex();

const commonWords = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
  'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
  'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may'
]);

chrome.runtime.onInstalled.addListener(async () => {
  await updateContextMenu();
});

// Update context menu based on language
async function updateContextMenu() {
  const lang = await getCurrentLanguage();
  const title = lang === 'ko' ? "'%s' 잡기" : "Catch '%s'";

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "definitionLookup",
      title: title,
      contexts: ["selection"]
    });
  });
}

// Listen for language changes to update context menu
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.language) {
    updateContextMenu();
  }
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'deleteWord') {
    // Handle word deletion safely via Mutex
    storageMutex.dispatch(async () => {
      try {
        const data = await chrome.storage.local.get(['wordDex', 'achievements']);
        const wordDex = data.wordDex || {};
        const achievements = data.achievements || {};
        const word = message.word;
        
        // Use the actual rarity stored in DB for decrementing, if available
        const actualRarity = (wordDex[word] && wordDex[word].rarity) || message.rarity;

        if (wordDex[word]) {
          delete wordDex[word];
          
          if (achievements[actualRarity] && achievements[actualRarity] > 0) {
            achievements[actualRarity] -= 1;
          }
          
          await chrome.storage.local.set({ wordDex, achievements });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Word not found' });
        }
      } catch (err) {
        console.error('Error deleting word:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Keep channel open for async response
  }
  // ... other message handlers if needed
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

  // Retrieve context from content script
  let context = '';
  try {
    if (!isMetaCatch && tab && tab.id) {
        const response = await sendMessageToContext(false, tab.id, { type: 'getContext' });
        if (response && response.context) {
            context = response.context;
        }
    }
  } catch (e) {
    console.log('Lingomon: Could not get context:', e);
  }

  // Optimistic UI: Send loading animation immediately
  // This addresses "cold start" latency by giving immediate feedback while the background worker processes
  if (word && word.match(/^[a-zA-Z]{3,}$/)) {
    sendMessageToContext(isMetaCatch, tab.id, {
      type: 'catchAttempt',
      word: word
    }).catch(err => {
      // Just log, don't stop execution - content script might not be ready but we proceed anyway
      console.log('Lingomon: Could not send loading animation (content script may not be loaded):', err);
    });
  }

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
    // Get current language preference
    const currentLanguage = await new Promise((resolve) => {
      chrome.storage.local.get(['language'], (data) => {
        resolve(data.language || 'en');
      });
    });

    let origin, rarity, freqData;
    let types = [];

    if (word.toLowerCase() === 'lingomon') {
      console.log('Lingomon: Caught "lingomon"! Triggering Easter Egg.');
      origin = "The legendary creature of vocabulary! Catches words to grow stronger.";
      rarity = "god";
      freqData = {
        frequency: 0.000001,
        source: 'easter_egg'
      };
    } else if (currentLanguage === 'ko') {
      // Korean mode: Try Korean API first, translate to Korean if needed
      console.log(`Lingomon: Using Korean API for "${word}"`);
      try {
        const koreanData = await fetchKoreanDefinition(word);
        origin = koreanData.origin;
        rarity = koreanData.rarity;
        types = koreanData.tags || []; // Use tags from Korean API
        freqData = {
          frequency: koreanData.frequency,
          source: koreanData.frequencySource
        };
      } catch (koreanErr) {
        console.log(`Lingomon: Korean API failed for "${word}", trying translation:`, koreanErr.message);

        // Try to translate English word to Korean
        try {
          const translatedWord = await translateToKorean(word);
          console.log(`Lingomon: Translated "${word}" to "${translatedWord}"`);

        // Try Korean API again with translated word
          const koreanData = await fetchKoreanDefinition(translatedWord);
          origin = `[${word} → ${translatedWord}]\n\n${koreanData.origin}`;
          rarity = koreanData.rarity;
          types = koreanData.tags || []; // Use tags from Korean API
          freqData = {
            frequency: koreanData.frequency,
            source: koreanData.frequencySource
          };
        } catch (translationErr) {
          console.log(`Lingomon: Translation/Korean API failed, falling back to English API with translation:`, translationErr.message);
          // Fallback to English API and translate the definition
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
          const [res, freqDataResult] = await Promise.all([dictionaryPromise, frequencyPromise]);
          freqData = freqDataResult;

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
          if (partOfSpeech) types.push(partOfSpeech);
          let etymology = data[0].origin || '';

          // Translate part of speech
          const posTranslations = {
            'noun': '명사',
            'verb': '동사',
            'adjective': '형용사',
            'adverb': '부사',
            'pronoun': '대명사',
            'preposition': '전치사',
            'conjunction': '접속사',
            'interjection': '감탄사'
          };
          const koreanPOS = posTranslations[partOfSpeech.toLowerCase()] || partOfSpeech;

          // Translate definition and example
          try {
            const translatedDef = await translateToKorean(definition);
            const translatedExample = example ? await translateToKorean(example) : '';

            const defText = `(${koreanPOS}) ${translatedDef}`;
            const exampleText = translatedExample ? `\n\n예시: "${translatedExample}"` : '';

            if (etymology) {
              const translatedEtym = await translateToKorean(etymology);
              origin = `어원: ${translatedEtym}\n\n${defText}${exampleText}`;
            } else {
              origin = `${defText}${exampleText}`;
            }
          } catch (translationError) {
            console.log(`Lingomon: Failed to translate definition, using English:`, translationError.message);
            // If translation fails, use English with Korean labels
            const defText = `(${koreanPOS || partOfSpeech}) ${definition}`;
            const exampleText = example ? `\n\n예시: "${example}"` : '';

            if (etymology) {
              origin = `어원: ${etymology}\n\n${defText}${exampleText}`;
            } else {
              origin = `${defText}${exampleText}`;
            }
          }

          rarity = getWordRarity(word, freqData.frequency, freqData.source);
        }
      }
    } else {
      // English mode: Use existing English APIs
      console.log(`Lingomon: Using English APIs for "${word}"`);

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
      const [res, freqDataResult] = await Promise.all([dictionaryPromise, frequencyPromise]);
      freqData = freqDataResult;
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
      
      // Extract ALL parts of speech from all meanings
      const allTypes = new Set();
      if (data[0].meanings && Array.isArray(data[0].meanings)) {
          data[0].meanings.forEach(m => {
              if (m.partOfSpeech) allTypes.add(m.partOfSpeech.toLowerCase());
          });
      }
      types = Array.from(allTypes);

      let etymology = data[0].origin || '';

      const defText = `${partOfSpeech ? `(${partOfSpeech}) ` : ''}${definition}`;
      const exampleText = example ? `\n\nExample: "${example}"` : '';

      if (etymology) {
        origin = `${etymology}\n\n${defText}${exampleText}`;
      } else {
        origin = `${defText}${exampleText}`;
      }

      rarity = getWordRarity(word, freqData.frequency, freqData.source);
    }

    // Extract domain from tab URL
    let domain = 'unknown';
    try {
      const url = new URL(tab.url);
      domain = url.hostname;
    } catch (e) {
      console.error('Could not extract domain:', e);
    }

    // Use Mutex to prevent race conditions (Read-Modify-Write)
    await storageMutex.dispatch(async () => {
      const storageData = await chrome.storage.local.get({ 
        wordDex: {}, 
        achievements: {}, 
        streakData: {}, 
        sitesExplored: {}, 
        badges: { main: [], hidden: [] } 
      });

      const wordDex = storageData.wordDex || {};
      const achievements = storageData.achievements || {};
      const streakData = storageData.streakData || { currentStreak: 0, longestStreak: 0, lastCatchDate: null };
      const sitesExplored = storageData.sitesExplored || {};
      const isNew = !wordDex[word];
      // If catching again, preserve original firstCaught/timestamp unless it's missing
      const firstCaughtDate = isNew ? Date.now() : (wordDex[word].firstCaught || wordDex[word].timestamp || Date.now());

      wordDex[word] = {
        origin,
        rarity,
        frequency: freqData.frequency,
        frequencySource: freqData.source,
        timestamp: Date.now(),
        firstCaught: firstCaughtDate,
        caughtOn: domain,
        language: currentLanguage,
        context: context,
        tags: types // Store auto-detected tags (Part of Speech)
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

      await chrome.storage.local.set({ wordDex, achievements, streakData, sitesExplored, badges });
      
      console.log('Lingomon: Sending wordCaught message for:', word);
      sendMessageToContext(isMetaCatch, tab.id, {
        type: 'wordCaught',
        word: word,
        origin: origin,
        rarity: rarity,
        isNew: isNew,
        firstCaught: firstCaughtDate,
        frequency: freqData.frequency,
        frequencySource: freqData.source,
        tags: types // Pass tags to the frontend animation
      }).then(response => {
        console.log('Lingomon: Message sent successfully, response:', response);
      }).catch(err => {
        console.log('Lingomon: Could not send message (content script may not be loaded):', err.message);
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
      // Silently ignore if content script isn't loaded - this is expected for some pages
      console.log('Lingomon: Could not send error message (content script may not be loaded):', err.message);
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

// Translate English word to Korean using MyMemory Translation API
async function translateToKorean(englishWord) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishWord)}&langpair=en|ko`;

    const res = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Translation API HTTP error for "${englishWord}": ${res.status}`);
      throw new Error(`Translation API HTTP error: ${res.status}`);
    }

    const data = await res.json();
    console.log(`Translation API response for "${englishWord}":`, JSON.stringify(data, null, 2));

    if (!data.responseData || !data.responseData.translatedText) {
      throw new Error('No translation found');
    }

    const translation = data.responseData.translatedText;

    // Check if translation is valid (not just the same word back)
    if (translation.toLowerCase() === englishWord.toLowerCase()) {
      throw new Error('Translation returned same word');
    }

    return translation;

  } catch (err) {
    console.log(`Translation error for "${englishWord}":`, err.message);
    throw err;
  }
}

// Fetch Korean definition from Korean National Institute API
async function fetchKoreanDefinition(word) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const params = new URLSearchParams({
      key: KOREAN_API_KEY,
      q: word,
      part: 'word',
      sort: 'dict',
      start: '1',
      num: '10',
      translated: 'y',
      trans_lang: '1' // English
    });

    const url = `https://krdict.korean.go.kr/api/search?${params.toString()}`;

    const res = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Korean API HTTP error for "${word}": ${res.status}`);
      throw new Error(`Korean API HTTP error: ${res.status}`);
    }

    const text = await res.text();
    console.log(`Korean API response for "${word}":`, text);

    // Parse XML response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Check for errors
    const errorNode = xmlDoc.querySelector('error');
    if (errorNode) {
      const errorCode = errorNode.getAttribute('error_code');
      const errorMsg = errorNode.textContent;
      console.log(`Korean API error for "${word}": ${errorCode} - ${errorMsg}`);

      const errorMessages = {
        '000': '시스템 오류',
        '010': '필수 요청 변수가 없음',
        '011': '필수 요청 변수 오류',
        '020': '등록되지 않은 인증 키',
        '021': '사용할 수 없는 인증 키',
        '022': '일일 한도 초과',
        '100': '잘못된 요청 변수'
      };
      throw new Error(errorMessages[errorCode] || errorMsg || 'API 오류');
    }

    // Get items
    const items = xmlDoc.querySelectorAll('item');

    if (items.length === 0) {
      console.log(`Korean API: No results found for "${word}"`);
      throw new Error('사전에서 단어를 찾을 수 없습니다');
    }

    const item = items[0];

    // Extract data
    const wordElement = item.querySelector('word');
    const koreanWord = wordElement?.textContent || word;
    
    // Extract POS
    const posElement = item.querySelector('pos');
    const posRaw = posElement?.textContent || '';
    
    // Map Korean POS to English standard tags
    const posMap = {
        '명사': 'noun',
        '대명사': 'pronoun',
        '동사': 'verb',
        '형용사': 'adjective',
        '부사': 'adverb',
        '전치사': 'preposition', // rarely used in Kr, but mapping just in case
        '조사': 'preposition',   // close equivalent for particles
        '접속사': 'conjunction',
        '감탄사': 'interjection',
        '수사': 'noun',          // Numeral -> treat as noun-like
        '관형사': 'adjective',   // Determiner -> adjective-like
        '의존 명사': 'noun'
    };
    const mappedPos = posMap[posRaw] || '';
    const tags = mappedPos ? [mappedPos] : [];

    const senseElements = item.querySelectorAll('sense');
    const definitions = [];

    for (const sense of senseElements) {
      const translation = sense.querySelector('translation trans_word')?.textContent;
      const definition = sense.querySelector('translation trans_dfn')?.textContent;

      if (translation || definition) {
        definitions.push({
          translation: translation || '',
          definition: definition || ''
        });
      }
    }

    if (definitions.length === 0) {
      throw new Error('정의를 찾을 수 없습니다');
    }

    // Build formatted origin text
    let originParts = [];

    originParts.push(`한국어: ${koreanWord}`);

    definitions.slice(0, 3).forEach((def, idx) => {
      if (definitions.length > 1) {
        originParts.push(`\n${idx + 1}. ${def.translation || def.definition}`);
        if (def.translation && def.definition) {
          originParts.push(`   ${def.definition}`);
        }
      } else {
        if (def.translation) {
          originParts.push(`\n뜻: ${def.translation}`);
        }
        if (def.definition) {
          originParts.push(`설명: ${def.definition}`);
        }
      }
    });

    const origin = originParts.join('\n');

    // Use word frequency for rarity calculation
    const freqData = await fetchWordFrequency(word);
    const rarity = getWordRarity(word, freqData.frequency, freqData.source);

    return {
      origin,
      rarity,
      tags, // Return extracted tags
      frequency: freqData.frequency,
      frequencySource: freqData.source
    };

  } catch (err) {
    console.log(`Korean API error for "${word}":`, err.message);
    throw err;
  }
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
    { threshold: 365, rarity: 'mythic', nameKey: '365DayStreak' },
    { threshold: 100, rarity: 'legendary', nameKey: '100DayStreak' },
    { threshold: 30, rarity: 'epic', nameKey: '30DayStreak' },
    { threshold: 10, rarity: 'rare', nameKey: '10DayStreak' },
    { threshold: 7, rarity: 'uncommon', nameKey: '7DayStreak' },
    { threshold: 1, rarity: 'common', nameKey: 'firstDay' }
  ];

  const wordTiers = [
    { threshold: 500, rarity: 'mythic', nameKey: '500Words' },
    { threshold: 100, rarity: 'legendary', nameKey: '100Words' },
    { threshold: 50, rarity: 'epic', nameKey: '50Words' },
    { threshold: 10, rarity: 'rare', nameKey: '10Words' },
    { threshold: 5, rarity: 'uncommon', nameKey: '5Words' },
    { threshold: 1, rarity: 'common', nameKey: 'firstWord' }
  ];

  const siteTiers = [
    { threshold: 500, rarity: 'mythic', nameKey: '500Sites' },
    { threshold: 100, rarity: 'legendary', nameKey: '100Sites' },
    { threshold: 50, rarity: 'epic', nameKey: '50Sites' },
    { threshold: 10, rarity: 'rare', nameKey: '10Sites' },
    { threshold: 5, rarity: 'uncommon', nameKey: '5Sites' },
    { threshold: 1, rarity: 'common', nameKey: 'firstSite' }
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
    streakBadge.name = t(streakBadge.nameKey);
    streakBadge.next = nextStreakTier;
    if (nextStreakTier) {
      streakBadge.next.name = t(nextStreakTier.nameKey);
    }
    streakBadge.progress = nextStreakTier ? (currentStreak / nextStreakTier.threshold) * 100 : 100;
    badges.main.push(streakBadge);
  }

  if (wordBadge) {
    wordBadge.name = t(wordBadge.nameKey);
    wordBadge.next = nextWordTier;
    if (nextWordTier) {
      wordBadge.next.name = t(nextWordTier.nameKey);
    }
    wordBadge.progress = nextWordTier ? (totalWords / nextWordTier.threshold) * 100 : 100;
    badges.main.push(wordBadge);
  }

  if (siteBadge) {
    siteBadge.name = t(siteBadge.nameKey);
    siteBadge.next = nextSiteTier;
    if (nextSiteTier) {
      siteBadge.next.name = t(nextSiteTier.nameKey);
    }
    siteBadge.progress = nextSiteTier ? (totalSites / nextSiteTier.threshold) * 100 : 100;
    badges.main.push(siteBadge);
  }

  // Hidden badges
  // First Mythic
  if (isNew && currentRarity === 'mythic') {
    const hasFirstMythic = badges.hidden.some(b => b.type === 'firstMythic');
    if (!hasFirstMythic) {
      badges.hidden.push({ type: 'firstMythic', name: t('firstMythic'), rarity: 'mythic', unlocked: true });
    }
  }

  // Rarity Killer badges (collect 10+ of each rarity)
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  for (const rarity of rarities) {
    const count = achievements[rarity] || 0;
    if (count >= 100) {
      const existingKiller = badges.hidden.find(b => b.type === 'rarityKiller' && b.rarity === rarity);
      const killerNameKey = `${rarity}Killer`;
      if (existingKiller) {
        existingKiller.count = count;
        existingKiller.name = t(killerNameKey);
      } else {
        badges.hidden.push({
          type: 'rarityKiller',
          name: t(killerNameKey),
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
        name: t('meta'),
        rarity: 'epic',
        unlocked: true
      });
    }
  }
  
  // Huh??? badge (catch "lingomon")
  if (isNew && wordDex['lingomon']) {
    const hasHuh = badges.hidden.some(b => b.type === 'huh');
    if (!hasHuh) {
      badges.hidden.push({
        type: 'huh',
        name: t('huh'),
        rarity: 'god',
        unlocked: true
      });
    }
  }

  return badges;
}