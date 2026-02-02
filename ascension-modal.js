const AscensionModal = {
    confirmFusion: async function(word, entry) {
        const overlay = document.createElement('div');
        overlay.className = 'evolution-overlay'; 
        overlay.style.zIndex = '30000'; 
        
        chrome.storage.local.get(['wordDex'], async (data) => {
            const dex = data.wordDex || {};
            const candidates = (typeof Evolution !== 'undefined') 
                ? Evolution.getFusionCandidates(entry.familyId, dex) 
                : [];
            
            overlay.innerHTML = `
                <div class="evolution-modal">
                    <h2 style="color: #E1BEE7; text-shadow: 0 0 10px rgba(225,190,231,0.4);">${t('fusionAvailable')}</h2>
                    <p style="color: #ccc;">${t('fusionConfirm', { count: candidates.length, family: entry.familyId })}</p>
                    <div class="fusion-list" style="margin: 20px 0; font-size: 13px; color: #888; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 12px; border: 1px dashed #444;">
                        ${candidates.join(', ')}
                    </div>
                    <div class="evo-actions">
                        <button id="btnFusionCancel" class="quiz-btn secondary">Cancel</button>
                        <button id="btnFusionConfirm" class="quiz-btn" style="background: #E1BEE7; color: #333;">⚡ FUSE! ⚡</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            document.getElementById('btnFusionCancel').onclick = () => overlay.remove();
            document.getElementById('btnFusionConfirm').onclick = () => this.startFusionAnimation(entry.familyId, candidates, overlay);
        });
    },

    startFusionAnimation: async function(familyId, candidates, overlay) {
        const modal = overlay.querySelector('.evolution-modal');
        modal.innerHTML = `
            <h2 style="color: #E1BEE7;">FUSING...</h2>
            <div class="evo-preview" style="flex-direction: column; gap: 15px; padding: 20px 0;">
                <div class="fusion-ring" style="width: 100px; height: 100px; border: 4px dashed #E1BEE7; border-radius: 50%; animation: rotate 2s linear infinite; display: flex; align-items: center; justify-content: center; font-size: 32px;">✨</div>
                <div class="evo-word" id="animWord" style="font-size: 28px; font-weight: 900; letter-spacing: 2px;">${familyId.toUpperCase()}</div>
            </div>
        `;
        
        const animWord = document.getElementById('animWord');
        animWord.style.animation = "evolvePulse 1s infinite";
        
        setTimeout(async () => {
            try {
                const res = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(familyId)}&max=50`);
                const data = await res.json();
                const mythics = data.filter(w => w.word.length > 8).sort((a,b) => b.score - a.score);
                const resultWord = mythics.length > 0 ? mythics[0].word : "ULTRA " + familyId.toUpperCase();
                
                chrome.storage.local.get(['wordDex'], (data) => {
                    const dex = data.wordDex || {};
                    candidates.forEach(c => delete dex[c]);
                    
                    dex[resultWord] = {
                        origin: `The Ascended Form of the ${familyId} family.`,
                        rarity: 'god',
                        frequency: 0.000001,
                        source: 'fusion',
                        tags: ['fusion', 'ascended'],
                        srs: { level: 5, streak: 10, nextReview: Date.now() + 30*24*60*60*1000, lastReviewed: Date.now() },
                        evolution: { stage: 4, canEvolve: false },
                        familyId: familyId
                    };
                    
                    chrome.storage.local.set({ wordDex: dex }, () => {
                        const successWordElem = document.createElement('div');
                        successWordElem.className = 'evo-word';
                        successWordElem.style.fontSize = '36px';
                        successWordElem.style.fontWeight = '900';
                        successWordElem.style.margin = '20px 0';
                        successWordElem.textContent = `${resultWord} ✧`;
                        
                        successWordElem.style.backgroundImage = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)';
                        successWordElem.style.backgroundSize = '200% auto';
                        successWordElem.style.webkitBackgroundClip = 'text';
                        successWordElem.style.webkitTextFillColor = 'transparent';
                        successWordElem.style.animation = 'rainbow 2s linear infinite';

                        modal.innerHTML = `
                            <h2 style="color: #E1BEE7; margin-bottom: 0;">SUMMONED!</h2>
                            <p style="color: #aaa; margin-bottom: 15px;">The word has ascended!</p>
                            <div id="successWordContainer"></div>
                            <button id="btnEvolveDone" class="quiz-btn" style="background: #E1BEE7; color: #333; margin-top: 10px;">Incredible!</button>
                        `;
                        
                        document.getElementById('successWordContainer').appendChild(successWordElem);

                        document.getElementById('btnEvolveDone').onclick = () => {
                            overlay.remove();
                            if (typeof displayWordDex !== 'undefined') displayWordDex(currentSort);
                        };
                    });
                });
            } catch (e) {
                console.error(e);
                overlay.remove();
            }
        }, 4000);
    }
};

window.AscensionModal = AscensionModal;
window.confirmFusion = AscensionModal.confirmFusion.bind(AscensionModal);
