const EVO_COLORS = {
    1: '#FF7043',
    2: '#4FC3F7',
    3: '#FFD700',
    4: '#E1BEE7'
};

const EVO_STARS = {
    1: '★',
    2: '★★',
    3: '★★★',
    4: '✧'
};

function canEvolve(entry) {
    if (!entry || !entry.srs || !entry.evolution) return false;
    
    if (entry.evolution.canEvolve) return true;
    
    const currentStage = entry.evolution.stage || 0;
    const srsLevel = entry.srs.level || 0;
    
    if (currentStage < 1 && srsLevel >= 1) return true;
    if (currentStage < 2 && srsLevel >= 3) return true;
    if (currentStage < 3 && srsLevel >= 5) return true;
    
    return false;
}

async function getBranches(word) {
    try {
        const res = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&md=p&max=20`);
        const data = await res.json();
        
        const branches = { noun: null, verb: null, adj: null };
        const root = word.toLowerCase().substring(0, 3);

        data.forEach(item => {
            if (item.word.toLowerCase() === word.toLowerCase()) return;
            if (!item.tags) return;

            const isRelated = item.word.toLowerCase().includes(root);
            
            if (item.tags.includes('n') && !branches.noun && isRelated) branches.noun = item.word;
            if (item.tags.includes('v') && !branches.verb && isRelated) branches.verb = item.word;
            if (item.tags.includes('adj') && !branches.adj && isRelated) branches.adj = item.word;
        });

        if (!branches.noun) branches.noun = word + "ion"; 
        if (!branches.verb) branches.verb = word + "ize";
        if (!branches.adj) branches.adj = word + "ic";

        return branches;
    } catch (e) {
        console.error("Failed to fetch branches:", e);
        return { noun: word + " (Noun)", verb: word + " (Verb)", adj: word + " (Adj)" };
    }
}

async function performEvolution(word, entry, branchWord = null, branchType = null) {
    if (!canEvolve(entry)) throw new Error("This word is not ready to evolve.");
    
    const currentStage = entry.evolution.stage || 0;
    const nextStage = currentStage + 1;
    let newWord = word;
    
    if (nextStage === 3 && branchWord) {
        newWord = branchWord;
        if (!entry.tags) entry.tags = [];
        if (branchType && !entry.tags.includes(branchType)) {
            entry.tags.push(branchType);
        }
    }

    let hiddenMove = entry.evolution.hiddenMove || null;
    if (nextStage === 3 && !hiddenMove) {
        try {
            const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(newWord)}&max=5`);
            const data = await res.json();
            if (data && data.length > 0) {
                const best = data.find(w => w.word.toLowerCase() !== newWord.toLowerCase());
                if (best) hiddenMove = best.word;
            }
        } catch (e) {
            hiddenMove = "ULTRA " + newWord.toUpperCase();
        }
    }
    
    entry.evolution.stage = nextStage;
    entry.evolution.canEvolve = false; 
    if (hiddenMove) entry.evolution.hiddenMove = hiddenMove;
    if (branchType) entry.evolution.branch = branchType;
    
    return new Promise((resolve) => {
        chrome.storage.local.get(['wordDex'], (data) => {
            const dex = data.wordDex || {};
            
            if (newWord !== word) {
                delete dex[word];
                if (dex[newWord]) {
                    const existing = dex[newWord];
                    if ((existing.evolution?.stage || 0) > entry.evolution.stage) {
                        entry.evolution.stage = existing.evolution.stage;
                    }
                }
            }
            
            dex[newWord] = entry;
            
            chrome.storage.local.set({ wordDex: dex }, () => {
                resolve({ word: newWord, entry });
            });
        });
    });
}

function getFusionCandidates(familyId, dex) {
    if (!familyId) return [];
    return Object.entries(dex)
        .filter(([word, info]) => info.familyId === familyId && info.evolution?.stage === 3)
        .map(([word]) => word);
}

if (typeof window !== 'undefined') {
    window.Evolution = {
        canEvolve,
        getBranches,
        performEvolution,
        getFusionCandidates,
        colors: EVO_COLORS,
        stars: EVO_STARS
    };
}
