// evolution.js - Evolution System Logic

const EVO_COLORS = {
    1: '#FF7043', // Vibrant Bronze (Amber/Red-Orange)
    2: '#4FC3F7', // Vibrant Silver (Platinum/Cyan-Blue)
    3: '#FFD700'  // Vibrant Gold (Pure Yellow)
};

const EVO_STARS = {
    1: '★',
    2: '★★',
    3: '★★★'
};

/**
 * Checks if a word is eligible for evolution.
 * @param {Object} entry - Word entry object from wordDex
 * @returns {boolean}
 */
function canEvolve(entry) {
    if (!entry || !entry.srs || !entry.evolution) return false;
    
    // Check if evolution is pending
    if (entry.evolution.canEvolve) return true;
    
    // Safety check in case SRS leveled up but flag wasn't set
    const currentStage = entry.evolution.stage || 0;
    const srsLevel = entry.srs.level || 0;
    
    if (currentStage < 1 && srsLevel >= 1) return true; // Bronze
    if (currentStage < 2 && srsLevel >= 3) return true; // Silver
    if (currentStage < 3 && srsLevel >= 5) return true; // Gold
    
    return false;
}

/**
 * Performs the evolution logic.
 * @param {string} word - The word being evolved
 * @param {Object} entry - The word entry object
 * @returns {Promise<Object>} - Returns the updated entry
 */
async function performEvolution(word, entry) {
    if (!canEvolve(entry)) throw new Error("This word is not ready to evolve.");
    
    const nextStage = (entry.evolution.stage || 0) + 1;
    
    // Fetch Hidden Move (Synonym) for Evo 3 (Gold)
    let hiddenMove = entry.evolution.hiddenMove || null;
    
    if (nextStage === 3 && !hiddenMove) {
        try {
            // Use Datamuse to find a strong synonym
            const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=5`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const best = data.find(w => w.word.toLowerCase() !== word.toLowerCase());
                if (best) hiddenMove = best.word;
            }
        } catch (e) {
            console.warn("Failed to fetch synonym for evolution:", e);
            hiddenMove = "SUPER " + word.toUpperCase(); // Fallback
        }
    }
    
    // Update State
    entry.evolution.stage = nextStage;
    entry.evolution.canEvolve = false; // Reset trigger
    if (hiddenMove) entry.evolution.hiddenMove = hiddenMove;
    
    // Save to Storage
    return new Promise((resolve) => {
        chrome.storage.local.get(['wordDex'], (data) => {
            const dex = data.wordDex || {};
            dex[word] = entry;
            
            // Check for Mastery Rank Updates (Passive Global Calculation happens elsewhere, but we trigger save)
            chrome.storage.local.set({ wordDex: dex }, () => {
                resolve(entry);
            });
        });
    });
}

// Export
if (typeof window !== 'undefined') {
    window.Evolution = {
        canEvolve,
        performEvolution,
        colors: EVO_COLORS,
        stars: EVO_STARS
    };
}
