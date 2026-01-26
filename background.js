// Import word frequency database for fallback
importScripts('wordFrequency.js');
importScripts('techApi.js');
importScripts('bioApi.js');
importScripts('chemApi.js');
importScripts('astroApi.js');
importScripts('i18n.js');

try {
  importScripts('config.js');
} catch (e) {
  console.warn('Lingomon: config.js not found or invalid. Using default configuration.');
  if (typeof CONFIG === 'undefined') {
    self.CONFIG = {
      KOREAN_API_KEY: '', // User needs to set this
      SUPABASE_URL: '',
      SUPABASE_KEY: '',
      ASTRO_API_KEY: ''
    };
  }
}

console.log('Lingomon: Frequency-based rarity system LOADED v2.0');

// Korean API Key (from config.js)
const KOREAN_API_KEY = (typeof CONFIG !== 'undefined') ? CONFIG.KOREAN_API_KEY : '';

// Mutex for serializing storage operations to prevent race conditions
class Mutex {
  constructor() {
    this.queue = Promise.resolve();
  }
  dispatch(fn) {
    const next = this.queue.then(fn);
    this.queue = next.catch(e => {
        // Safe logging
        try {
            console.error("Mutex execution error:", e);
        } catch (logErr) {
            console.log("Mutex error (logging failed)");
        }
    });
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

// Centralized Easter Eggs
const EASTER_EGGS = {
  "lingomon": { 
      origin: "The legendary creature of vocabulary! Catches words to grow stronger.", 
      rarity: "god", 
      frequency: 0.000001 
  },
  "yisang": { rarity: "epic", tags: ["noun", "literary", "project_moon"], origin: "Did you call?" },
  "faust": { rarity: "common", tags: ["noun", "literary", "project_moon"], origin: "Faust knows all." },
  "donquixote": { rarity: "common", tags: ["noun", "literary", "project_moon"], origin: "MANAGER ESQUIREEEEEE" },
  "ryoshu": { rarity: "epic", tags: ["noun", "literary", "project_moon"], origin: "S.T.F.U" },
  "meursault": { rarity: "rare", tags: ["noun", "literary", "project_moon"], origin: "The sun was too bright." },
  "honglu": { rarity: "epic", tags: ["noun", "literary", "project_moon"], origin: "uwahh~" },
  "heathcliff": { rarity: "uncommon", tags: ["noun", "literary", "project_moon"], origin: "▢▢▢▢▢▢▢▢▢!!!"},
  "ishmael": { rarity: "uncommon", tags: ["noun", "literary", "project_moon"], origin: "THE FAULT LIES WITH YOU, ISHMAEL." },
  "rodya": { rarity: "uncommon", tags: ["noun", "literary", "project_moon"], origin: "Honestly quite incredible" },
  "dante": { rarity: "common", tags: ["noun", "literary", "project_moon"], origin: "🕐🕚🕡🕣🕤" },
  "sinclair": { rarity: "rare", tags: ["noun", "literary", "project_moon"], origin: "Go german boy gooo" },
  "outis": { rarity: "rare", tags: ["noun", "literary", "project_moon"], origin: "The Odyssey didnt have a purpose." },
  "gregor": { rarity: "uncommon", tags: ["noun", "literary", "project_moon"], origin: "Suddenly, one day..." }
};

// Helper: Resolve specialized data with correct priority
// Bio -> Chem -> Astro -> Tech (Fallback)
async function resolveSpecializedData(word) {
    let data = null;

    // 1. Check Bio API (Async)
    if (typeof BioAPI !== 'undefined') {
        try {
            data = await BioAPI.lookup(word);
            if (data) return data;
        } catch (e) {
            console.log('BioAPI lookup failed:', e);
        }
    }

    // 2. Check Astro API (Async)
    // Swapped priority: Astro > Chem to prioritize Planets/Stars over Elements/Compounds for ambiguous words like "Mercury" or "Sun"
    if (typeof AstroAPI !== 'undefined') {
        try {
            data = await AstroAPI.lookup(word);
            if (data) return data;
        } catch (e) {
             console.log('AstroAPI lookup failed:', e);
        }
    }

    // 3. Check Chem API (Async)
    if (typeof ChemAPI !== 'undefined') {
        try {
            data = await ChemAPI.lookup(word);
            if (data) return data;
        } catch (e) {
            console.log('ChemAPI lookup failed:', e);
        }
    }

    // 4. Check Tech API (Async now)
    if (typeof TechAPI !== 'undefined') {
        try {
            data = await TechAPI.lookup(word);
            if (data) return data;
        } catch(e) {
            console.log('TechAPI lookup failed:', e);
        }
    }

    return null;
}

// Helper: Save word to storage and notify
async function saveWordToStorage(word, data, tab, isMetaCatch) {
    const { origin, rarity, frequency, source, tags, context, language } = data;
    
    // Extract domain from tab URL
    let domain = 'unknown';
    try {
      if (tab && tab.url) {
        const url = new URL(tab.url);
        domain = url.hostname;
      }
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

      // Rarity Consistency Logic
      const rarityRank = { 'common': 1, 'uncommon': 2, 'rare': 3, 'epic': 4, 'legendary': 5, 'mythic': 6, 'god': 7 };
      let finalRarity = rarity;
      
      if (!isNew && wordDex[word].rarity) {
          const oldRarity = wordDex[word].rarity;
          const oldRank = rarityRank[oldRarity] || 0;
          const newRank = rarityRank[rarity] || 0;
          
          // If new calculation failed to find special status (lower rank), keep old
          if (newRank < oldRank) {
              console.log(`Lingomon: Preserving rarity for "${word}" (${oldRarity}) vs new (${rarity})`);
              finalRarity = oldRarity;
          }
      }

      wordDex[word] = {
        origin,
        rarity: finalRarity,
        frequency: frequency,
        frequencySource: source,
        timestamp: Date.now(),
        firstCaught: firstCaughtDate,
        caughtOn: domain,
        language: language || 'en',
        context: context || '',
        tags: tags || [] // Store auto-detected tags
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
        achievements[finalRarity] = (achievements[finalRarity] || 0) + 1;
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
      const badges = updateBadges(wordDex, achievements, streakData, sitesExplored, finalRarity, isNew, existingBadges, isMetaCatch);

      await chrome.storage.local.set({ wordDex, achievements, streakData, sitesExplored, badges });
      
      console.log('Lingomon: Sending wordCaught message for:', word);
      sendMessageToContext(isMetaCatch, tab.id, {
        type: 'wordCaught',
        word: word,
        origin: origin,
        rarity: finalRarity,
        isNew: isNew,
        firstCaught: firstCaughtDate,
        frequency: frequency,
        frequencySource: source,
        tags: tags
      }).then(response => {
        console.log('Lingomon: Message sent successfully, response:', response);
      }).catch(err => {
        console.log('Lingomon: Could not send message (content script may not be loaded):', err.message);
      });
    });
}

// Migration: Scan and tag existing words with new types (Tech, Chem, Astro, Bio)
// Runs once on update to v1.8.1
chrome.runtime.onInstalled.addListener(async (details) => {
  await updateContextMenu();
  
  if (details.reason === 'update' || details.reason === 'install') {
      console.log('Lingomon: Running migration for v1.8.1 specialized tags...');
      storageMutex.dispatch(async () => {
          const data = await chrome.storage.local.get(['wordDex', 'badges']);
          const wordDex = data.wordDex || {};
          let badges = data.badges || { main: [], hidden: [] };
          let changed = false;
          
          // --- BADGE CLEANUP (Remove legacy 'catherine' badge if present) ---
          if (badges.hidden) {
              const beforeCount = badges.hidden.length;
              badges.hidden = badges.hidden.filter(b => b.type !== 'catherine');
              if (badges.hidden.length !== beforeCount) {
                  console.log("Migration: Removed legacy 'catherine' badge.");
                  changed = true;
              }
          }
          
          for (const word of Object.keys(wordDex)) {
              const entry = wordDex[word];
              if (!entry.tags) entry.tags = [];
              
              // Skip if already tagged with special type
              // Exception: Re-check Project Moon characters to update rarity
              const isPM = entry.tags.includes('project_moon');
              
              if (!isPM && entry.tags.some(t => ['tech', 'chem', 'astro', 'bio'].includes(t))) continue;
              
              // Use unified resolver
              const match = await resolveSpecializedData(word);
              
              if (match) {
                  let entryChanged = false;
                  
                  // Update tags
                  if (match.tags && match.tags.length > 0) {
                      const tagSet = new Set([...entry.tags, ...match.tags]);
                      const newTags = Array.from(tagSet);
                      if (newTags.length !== entry.tags.length) {
                          entry.tags = newTags;
                          entryChanged = true;
                          console.log(`Migrated "${word}": Added tags [${match.tags.join(', ')}]`);
                      }
                  }
                  
                  // Update Rarity for Project Moon characters (if changed in TechAPI)
                  if (match.tags && match.tags.includes('project_moon')) {
                      if (entry.rarity !== match.rarity) {
                          console.log(`Migrated "${word}": Rarity updated ${entry.rarity} -> ${match.rarity}`);
                          entry.rarity = match.rarity;
                          entryChanged = true;
                      }
                  }
                  
                  if (entryChanged) changed = true;
              }
          }
          
          if (changed) {
              await chrome.storage.local.set({ wordDex, badges });
              console.log('Lingomon: Migration complete. WordDex and Badges updated.');
          } else {
              console.log('Lingomon: No migration needed.');
          }
      });
  }
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
        
        console.log(`Background: Deleting word "${word}". Exists in Dex: ${!!wordDex[word]}`);
        
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
  const isMetaCatch = tab && tab.url && (tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'));

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
  if (word && word.match(/^[a-zA-Z]{3,}$/)) {
    sendMessageToContext(isMetaCatch, tab.id, {
      type: 'catchAttempt',
      word: word
    }).catch(err => {
      console.log('Lingomon: Could not send loading animation:', err);
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
    }).catch(err => console.log('Lingomon: Could not send validation error:', err));
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
    
    // Unified Specialized Data Lookup (Priority: Bio -> Chem -> Astro -> Tech)
    let techData = await resolveSpecializedData(word);

    if (techData) {
        console.log(`Lingomon: Found specialized term "${word}"`, techData);
        if (techData.tags) types.push(...techData.tags);
        
        // Priority Override: If specialized API provides an origin, use it!
        // This ensures "Python" is defined as a language (Tech), not a snake (Dict).
        if (techData.origin) {
            console.log("Lingomon: Using specialized definition from", techData.source);
            origin = techData.origin;
            rarity = techData.rarity;
            // Use specialized frequency/source if available, otherwise we might fetch it later?
            // Usually specialized data includes its own "frequency" (or fixed value)
            if (techData.frequency) {
                freqData = { frequency: techData.frequency, source: techData.source };
            }
        }
    }

    if (origin) {
        // Already found (Specialized Data with Origin)
        if (!freqData) freqData = { frequency: 0.1, source: 'specialized' }; // Fallback safety
    } else if (EASTER_EGGS[word.toLowerCase()]) {
      const egg = EASTER_EGGS[word.toLowerCase()];
      console.log(`Lingomon: Caught Easter Egg "${word}"!`);
      origin = egg.origin;
      rarity = egg.rarity;
      if (egg.tags) types.push(...egg.tags);
      freqData = { frequency: egg.frequency || 0.000001, source: 'easter_egg' };
    } else if (currentLanguage === 'ko') {
      // Korean Mode
      console.log(`Lingomon: Using Korean API for "${word}"`);
      try {
        const koreanData = await fetchKoreanDefinition(word);
        origin = koreanData.origin;
        rarity = koreanData.rarity;
        types = koreanData.tags || [];
        freqData = {
          frequency: koreanData.frequency,
          source: koreanData.frequencySource
        };
      } catch (koreanErr) {
        console.log(`Lingomon: Korean API failed, trying translation:`, koreanErr.message);
        
        // Try translate English -> Korean
        try {
          const translatedWord = await translateToKorean(word);
          const koreanData = await fetchKoreanDefinition(translatedWord);
          origin = `[${word} → ${translatedWord}]\n\n${koreanData.origin}`;
          rarity = koreanData.rarity;
          types = koreanData.tags || [];
          freqData = { frequency: koreanData.frequency, source: koreanData.frequencySource };
        } catch (translationErr) {
           console.log(`Lingomon: Translation failed, using English API with translation fallback:`, translationErr.message);
           // Fallback to English API + Translation
           const dictionaryData = await fetchDictionaryData(word);
           freqData = await fetchWordFrequency(word);
           
           const processed = await processEnglishDefinitionForKorean(dictionaryData, freqData, word, types);
           origin = processed.origin;
           rarity = processed.rarity;
           types = processed.types;
        }
      }
    } else {
      // English Mode
      console.log(`Lingomon: Using English APIs for "${word}"`);

      // Parallel Fetch
      const [res, freqDataResult] = await Promise.all([
          fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`),
          fetchWordFrequency(word)
      ]);
      freqData = freqDataResult;

      // Tech Override for Frequency/Source if available
      if (techData && (freqData.source === 'unknown' || freqData.source === 'local')) {
           freqData = { frequency: techData.frequency, source: techData.source };
      }

      if (!res.ok) throw new Error(res.status === 404 ? 'Word not found in dictionary' : `API error: ${res.status}`);
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('No definition found');
      
      const meanings = data[0].meanings || [];
      if (meanings.length === 0) throw new Error('No meanings available');
      
      const firstMeaning = meanings[0];
      const defObj = firstMeaning.definitions?.[0];
      if (!defObj) throw new Error('No definitions available');

      // Extract types
      const allTypes = new Set(types);
      meanings.forEach(m => {
          if (m.partOfSpeech) allTypes.add(m.partOfSpeech.toLowerCase());
      });
      types = Array.from(allTypes);

      const definition = defObj.definition;
      const example = defObj.example ? `\n\nExample: "${defObj.example}"` : '';
      const partOfSpeech = firstMeaning.partOfSpeech ? `(${firstMeaning.partOfSpeech}) ` : '';
      const etymology = data[0].origin ? `${data[0].origin}\n\n` : '';

      origin = `${etymology}${partOfSpeech}${definition}${example}`;
      
      // Calculate rarity
      rarity = getWordRarity(word, freqData.frequency, freqData.source);
      if (techData && techData.rarity) {
          rarity = techData.rarity;
      }
    }

    // Save Word
    const saveData = {
        origin,
        rarity,
        frequency: freqData.frequency,
        source: freqData.source,
        tags: types,
        context,
        language: currentLanguage
    };
    
    await saveWordToStorage(word, saveData, tab, isMetaCatch);

  } catch (err) {
    // FALLBACK: If Dictionary API fails, check if we have Specialized Data
    // This allows saving "Tech/Bio" words even if the general dictionary is down/missing them
    if (!origin) {
        const fallbackData = await resolveSpecializedData(word);

        if (fallbackData) {
             console.log(`Lingomon: API failed, falling back to Specialized Data for "${word}"`);
             
             const saveData = {
                origin: fallbackData.origin || "No definition found.",
                rarity: fallbackData.rarity,
                frequency: fallbackData.frequency,
                source: fallbackData.source,
                tags: fallbackData.tags || [],
                context,
                language: 'en' // Default to en for tech terms
            };
            
            await saveWordToStorage(word, saveData, tab, isMetaCatch);
            return;
        }
    }

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
    }).catch(e => console.log(e));
  }
});

// Helper for complex English -> Korean processing
async function processEnglishDefinitionForKorean(data, freqData, word, types) {
    // ... Simplified logic for the catch block translation fallback ...
    // Since I refactored the main block, I need to ensure this logic is preserved or inline it.
    // Given the complexity, I'll inline it back in the main block or define it here if reused.
    // But wait, the original code had this logic inline. 
    // To save space and time, I'll inline a simplified version in the main block above? 
    // Actually, I wrote `processEnglishDefinitionForKorean` call in the code above, so I MUST define it.
    
    if (!data[0] || !data[0].meanings) throw new Error('Invalid dictionary data');
    
    const firstMeaning = data[0].meanings[0];
    const defObj = firstMeaning.definitions[0];
    const definition = defObj.definition;
    const example = defObj.example;
    const partOfSpeech = firstMeaning.partOfSpeech;
    
    if (partOfSpeech) types.push(partOfSpeech);
    
    const posTranslations = {
        'noun': '명사', 'verb': '동사', 'adjective': '형용사', 'adverb': '부사',
        'pronoun': '대명사', 'preposition': '전치사', 'conjunction': '접속사', 'interjection': '감탄사'
    };
    const koreanPOS = posTranslations[partOfSpeech.toLowerCase()] || partOfSpeech;

    let origin = '';
    try {
        const translatedDef = await translateToKorean(definition);
        const translatedExample = example ? await translateToKorean(example) : '';
        const etymology = data[0].origin ? await translateToKorean(data[0].origin) : '';
        
        origin = `${etymology ? `어원: ${etymology}\n\n` : ''}(${koreanPOS}) ${translatedDef}${translatedExample ? `\n\n예시: "${translatedExample}"` : ''}`;
    } catch (e) {
        origin = `${data[0].origin ? `어원: ${data[0].origin}\n\n` : ''}(${koreanPOS}) ${definition}${example ? `\n\nExample: "${example}"` : ''}`;
    }

    const rarity = getWordRarity(word, freqData.frequency, freqData.source);
    return { origin, rarity, types };
}

// Separate helper for fetch dictionary to clean up main flow
async function fetchDictionaryData(word) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(res.status);
    return res.json();
}

function getWordRarity(word, frequency = null, source = null) {
  if (frequency !== null) {
    const rarity = mapFrequencyToRarity(frequency);
    console.log(`Rarity for "${word}": ${rarity} (freq=${frequency}, source=${source})`);
    return rarity;
  }

  const lowerWord = word.toLowerCase();
  const wordLength = word.length;

  if (commonWords.has(lowerWord)) return 'common';

  if (wordLength <= 5) {
    return Math.random() < 0.85 ? 'common' : 'uncommon';
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

function mapFrequencyToRarity(frequency) {
  if (frequency >= 100) return 'common';
  if (frequency >= 25) return 'uncommon';
  if (frequency >= 5) return 'rare';
  if (frequency >= 1) return 'epic';
  if (frequency >= 0.1) return 'legendary';
  return 'mythic';
}

async function fetchWordFrequency(word) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=1`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Datamuse API error for "${word}": ${res.status}`);
      return getFallbackFrequency(word);
    }

    const data = await res.json();
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
    console.log(`Datamuse: No frequency data for "${word}", using fallback`);
    return getFallbackFrequency(word);
  } catch (err) {
    console.log(`Datamuse error for "${word}":`, err.message);
    return getFallbackFrequency(word);
  }
}

function getFallbackFrequency(word) {
  const lowerWord = word.toLowerCase();
  if (typeof wordFrequencyMap !== 'undefined' && wordFrequencyMap[lowerWord]) {
    const frequency = wordFrequencyMap[lowerWord];
    console.log(`Local DB: "${word}" frequency = ${frequency}`);
    return { frequency, source: 'local' };
  }
  console.log(`Unknown word: "${word}", treating as mythic`);
  return { frequency: null, source: 'unknown' };
}

async function translateToKorean(englishWord) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishWord)}&langpair=en|ko`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Translation API HTTP error: ${res.status}`);
    const data = await res.json();
    if (!data.responseData || !data.responseData.translatedText) throw new Error('No translation found');
    const translation = data.responseData.translatedText;
    if (translation.toLowerCase() === englishWord.toLowerCase()) throw new Error('Translation returned same word');
    return translation;
  } catch (err) {
    console.log(`Translation error for "${englishWord}":`, err.message);
    throw err;
  }
}

async function fetchKoreanDefinition(word) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({
      key: KOREAN_API_KEY, q: word, part: 'word', sort: 'dict', start: '1', num: '10', translated: 'y', trans_lang: '1'
    });
    const url = `https://krdict.korean.go.kr/api/search?${params.toString()}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Korean API HTTP error: ${res.status}`);
    const text = await res.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const errorNode = xmlDoc.querySelector('error');
    if (errorNode) {
      const errorCode = errorNode.getAttribute('error_code');
      throw new Error(`API 오류: ${errorCode}`);
    }

    const items = xmlDoc.querySelectorAll('item');
    if (items.length === 0) throw new Error('사전에서 단어를 찾을 수 없습니다');

    const item = items[0];
    const koreanWord = item.querySelector('word')?.textContent || word;
    const posRaw = item.querySelector('pos')?.textContent || '';
    const posMap = { '명사': 'noun', '대명사': 'pronoun', '동사': 'verb', '형용사': 'adjective', '부사': 'adverb', '전치사': 'preposition', '조사': 'preposition', '접속사': 'conjunction', '감탄사': 'interjection', '수사': 'noun', '관형사': 'adjective', '의존 명사': 'noun' };
    const mappedPos = posMap[posRaw] || '';
    const tags = mappedPos ? [mappedPos] : [];

    const definitions = [];
    item.querySelectorAll('sense').forEach(sense => {
        const trans = sense.querySelector('translation trans_word')?.textContent;
        const def = sense.querySelector('translation trans_dfn')?.textContent;
        if (trans || def) definitions.push({ translation: trans || '', definition: def || '' });
    });

    if (definitions.length === 0) throw new Error('정의를 찾을 수 없습니다');

    let originParts = [`한국어: ${koreanWord}`];
    definitions.slice(0, 3).forEach((def, idx) => {
        if (definitions.length > 1) {
            originParts.push(`\n${idx + 1}. ${def.translation || def.definition}`);
            if (def.translation && def.definition) originParts.push(`   ${def.definition}`);
        } else {
            if (def.translation) originParts.push(`\n뜻: ${def.translation}`);
            if (def.definition) originParts.push(`설명: ${def.definition}`);
        }
    });

    const freqData = await fetchWordFrequency(word);
    return {
      origin: originParts.join('\n'),
      rarity: getWordRarity(word, freqData.frequency, freqData.source),
      tags,
      frequency: freqData.frequency,
      frequencySource: freqData.source
    };
  } catch (err) {
    console.log(`Korean API error for "${word}":`, err.message);
    throw err;
  }
}

function updateBadges(wordDex, achievements, streakData, sitesExplored, currentRarity, isNew, existingBadges, isMetaCatch) {
  const badges = { main: [], hidden: existingBadges.hidden || [] };
  const totalWords = Object.keys(wordDex).length;
  const totalSites = Object.keys(sitesExplored).length;
  const currentStreak = streakData.currentStreak || 0;

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

  let streakBadge = null, nextStreakTier = null;
  for (let i = 0; i < streakTiers.length; i++) {
    if (currentStreak >= streakTiers[i].threshold) {
      streakBadge = { ...streakTiers[i], type: 'streak', current: currentStreak };
      nextStreakTier = i > 0 ? streakTiers[i - 1] : null;
      break;
    }
  }

  let wordBadge = null, nextWordTier = null;
  for (let i = 0; i < wordTiers.length; i++) {
    if (totalWords >= wordTiers[i].threshold) {
      wordBadge = { ...wordTiers[i], type: 'words', current: totalWords };
      nextWordTier = i > 0 ? wordTiers[i - 1] : null;
      break;
    }
  }

  let siteBadge = null, nextSiteTier = null;
  for (let i = 0; i < siteTiers.length; i++) {
    if (totalSites >= siteTiers[i].threshold) {
      siteBadge = { ...siteTiers[i], type: 'sites', current: totalSites };
      nextSiteTier = i > 0 ? siteTiers[i - 1] : null;
      break;
    }
  }

  if (streakBadge) {
    streakBadge.name = streakBadge.nameKey; // Simple fallback
    streakBadge.next = nextStreakTier;
    if (nextStreakTier) streakBadge.next.name = nextStreakTier.nameKey;
    streakBadge.progress = nextStreakTier ? (currentStreak / nextStreakTier.threshold) * 100 : 100;
    badges.main.push(streakBadge);
  }

  if (wordBadge) {
    wordBadge.name = wordBadge.nameKey;
    wordBadge.next = nextWordTier;
    if (nextWordTier) wordBadge.next.name = nextWordTier.nameKey;
    wordBadge.progress = nextWordTier ? (totalWords / nextWordTier.threshold) * 100 : 100;
    badges.main.push(wordBadge);
  }

  if (siteBadge) {
    siteBadge.name = siteBadge.nameKey;
    siteBadge.next = nextSiteTier;
    if (nextSiteTier) siteBadge.next.name = nextSiteTier.nameKey;
    siteBadge.progress = nextSiteTier ? (totalSites / nextSiteTier.threshold) * 100 : 100;
    badges.main.push(siteBadge);
  }

  if (isNew && currentRarity === 'mythic') {
    if (!badges.hidden.some(b => b.type === 'firstMythic')) {
      badges.hidden.push({ type: 'firstMythic', name: 'firstMythic', rarity: 'mythic', unlocked: true });
    }
  }

  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  for (const rarity of rarities) {
    const count = achievements[rarity] || 0;
    if (count >= 100) {
      const existingKiller = badges.hidden.find(b => b.type === 'rarityKiller' && b.rarity === rarity);
      if (existingKiller) {
        existingKiller.count = count;
      } else {
        badges.hidden.push({ type: 'rarityKiller', name: `${rarity}Killer`, rarity: rarity, count: count, unlocked: true });
      }
    }
  }

  if (isMetaCatch && !badges.hidden.some(b => b.type === 'meta')) {
    badges.hidden.push({ type: 'meta', name: 'meta', rarity: 'epic', unlocked: true });
  }
  
  if (isNew && wordDex['lingomon'] && !badges.hidden.some(b => b.type === 'huh')) {
    badges.hidden.push({ type: 'huh', name: 'huh', rarity: 'god', unlocked: true });
  }
  
  // Catherine...? Badge - REMOVED (Merged into Limbus Company collection)
  /*
  if (isNew && wordDex['heathcliff'] && !badges.hidden.some(b => b.type === 'catherine')) {
      badges.hidden.push({ type: 'catherine', name: 'Catherine...?', rarity: 'epic', unlocked: true });
  }
  */

  // Limbus Company Badge (Collect all 13 Project Moon Sinners)
  const pmCharacters = [
      'yisang', 'faust', 'donquixote', 'ryoshu', 'meursault', 'honglu', 
      'heathcliff', 'ishmael', 'rodya', 'dante', 'sinclair', 'outis', 'gregor'
  ];
  const caughtPM = pmCharacters.filter(char => wordDex[char]);
  
  if (caughtPM.length === pmCharacters.length) {
      const hasLimbus = badges.hidden.some(b => b.type === 'limbusCompany');
      if (!hasLimbus) {
          badges.hidden.push({
              type: 'limbusCompany',
              name: 'Limbus Company', // Will be translated via i18n
              rarity: 'legendary',
              unlocked: true
          });
      }
  }

  return badges;
}
