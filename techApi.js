// Technical Dictionary using Context7 Semantic Search
// Uses CONFIG.TECH_API_KEY for intelligent lookup

const TECHNICAL_DATA = {
  // IT / Tech Terms (Static Fallback / High Priority Overrides)
  "algorithm": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A set of rules to be followed in calculations." },
  "api": { rarity: "common", tags: ["tech", "noun"], origin: "Application Programming Interface." },
  "bug": { rarity: "common", tags: ["tech", "noun"], origin: "An error, flaw or fault in the design, development, or operation of computer software." },
  // ... (We can keep the static list as a cache/fallback)
};

const TechAPI = {
  // Common English words to ignore to save quota
  // Even if Context7 finds something, these are almost always false positives in a casual context
  commonWords: new Set([
      'the', 'and', 'for', 'with', 'table', 'date', 'string', 'value', 'type', 'list', 'map', 'set', 'get', 'run', 'play', 'call', 'find', 'make', 'do', 'go', 'try', 'catch', 'if', 'else', 'while', 'for', 'break', 'continue', 'switch', 'case', 'default', 'return', 'throw', 'new', 'this', 'super', 'class', 'extends', 'implements', 'interface', 'package', 'import', 'export', 'public', 'private', 'protected', 'static', 'final', 'void', 'null', 'true', 'false'
  ]),

  lookup: async function(word) {
    const lower = word.toLowerCase();
    
    // 1. Check Local Static Data
    if (TECHNICAL_DATA[lower]) {
      return {
        frequency: 0.5,
        source: 'tech_api_local',
        ...TECHNICAL_DATA[lower]
      };
    }

    // 2. Context7 API Lookup ONLY
    if (!this.commonWords.has(lower) && word.length > 2) {
      if (typeof CONFIG === 'undefined' || !CONFIG.TECH_API_KEY) {
          console.warn("Lingomon: Missing CONFIG.TECH_API_KEY for TechAPI.");
          return null;
      }

      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for AI
          
          // Context7 API Endpoint (Library Search / RAG)
          const url = `https://context7.com/api/v2/libs/search?query=${encodeURIComponent(word)}`;
          
          const res = await fetch(url, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${CONFIG.TECH_API_KEY}`
              },
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (res.ok) {
              const data = await res.json();
              if (data.results && data.results.length > 0) {
                  // Find the most relevant match
                  const match = data.results[0];
                  
                  // STRICTER Validation: 
                  // 1. Title match: The library name must match the word closely
                  if (match.title.toLowerCase() !== lower) {
                      // Allow strict substring match if the word is long enough (e.g., 'reactjs' -> 'react')
                      // But for 'make' -> 'GNU Make', we need to be careful.
                      // If the match title contains the word, it MIGHT be okay, but 'make' is dangerous.
                      
                      // Filter out common words that happen to be libraries (e.g. 'Request', 'Express', 'Got')
                      // Unless the user explicitly caught "Request" (capitalized)?
                      // For now, let's enforce EXACT match for short words (< 5 chars)
                      if (word.length < 5 && match.title.toLowerCase() !== lower) return null;
                  }
                  
                  // 2. Description Check
                  // Ensure it's software related (should be given the API, but good to check)
                  
                  // Rarity Logic based on "stars"
                  let rarity = 'common';
                  const stars = match.stars || 0;
                  
                  if (stars < 1000) rarity = 'mythic';
                  else if (stars < 5000) rarity = 'legendary';
                  else if (stars < 20000) rarity = 'epic';
                  else if (stars < 50000) rarity = 'rare';
                  else if (stars < 100000) rarity = 'uncommon';
                  else rarity = 'common'; 
                  
                  return {
                      origin: `${match.description}\n(Source: ${match.title})`,
                      rarity: rarity,
                      tags: ["tech", "noun"],
                      frequency: 0.1,
                      source: 'context7_api',
                      data: match
                  };
              }
          }

      } catch (e) {
          console.log("Tech API error:", e);
      }
    }
    
    return null;
  }
};

// Export
if (typeof self !== 'undefined') self.TechAPI = TechAPI;
if (typeof window !== 'undefined') window.TechAPI = TechAPI;
