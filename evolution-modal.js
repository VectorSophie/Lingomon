function confirmEvolution(word, entry) {
    const overlay = document.createElement('div');
    overlay.className = 'evolution-overlay';
    
    const currentStage = entry.evolution.stage || 0;
    const targetStage = currentStage + 1;
    const targetColor = (typeof Evolution !== 'undefined' && Evolution.colors) ? Evolution.colors[targetStage] : '#FFD700';
    
    overlay.innerHTML = `
        <div class="evolution-modal">
            <h2 style="color: ${targetColor}; text-shadow: 0 0 10px ${targetColor}66;">Evolution Available!</h2>
            <div class="evo-preview">
                <div class="evo-word">${word}</div>
                <div class="evo-arrow">➜</div>
                <div class="evo-word" style="color:${targetColor}; text-shadow: 0 0 15px ${targetColor}88;">
                    ${word} ${'★'.repeat(targetStage)}
                </div>
            </div>
            <p>Your mastery of this word has unlocked its hidden potential!</p>
            <div class="evo-actions">
                <button id="btnEvolveCancel" class="quiz-btn secondary">Cancel</button>
                <button id="btnEvolveConfirm" class="quiz-btn" style="background: ${targetColor}; color: ${targetStage===1 ? 'white':'#333'};">Evolve!</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('btnEvolveCancel').onclick = () => overlay.remove();
    
    document.getElementById('btnEvolveConfirm').onclick = async () => {
        const modal = overlay.querySelector('.evolution-modal');
        
        if (targetStage === 3) {
            modal.innerHTML = `<h2>${t('chooseBranch')}</h2><p>Select your word's specialized form:</p><div class="branch-options" id="branchOptions">Loading branches...</div>`;
            
            try {
                const branches = await Evolution.getBranches(word);
                const optionsDiv = document.getElementById('branchOptions');
                optionsDiv.innerHTML = '';
                
                const types = [
                    { key: 'noun', label: t('branchNoun'), word: branches.noun },
                    { key: 'verb', label: t('branchVerb'), word: branches.verb },
                    { key: 'adj', label: t('branchAdj'), word: branches.adj }
                ];
                
                types.forEach(t => {
                    const btn = document.createElement('button');
                    btn.className = 'branch-btn';
                    btn.innerHTML = `<span class="branch-type">${t.label}</span><span class="branch-word">${t.word}</span>`;
                    btn.onclick = () => startEvolutionAnimation(word, entry, t.word, t.key, overlay);
                    optionsDiv.appendChild(btn);
                });
                
            } catch (e) {
                console.error(e);
                startEvolutionAnimation(word, entry, null, null, overlay);
            }
        } else {
            startEvolutionAnimation(word, entry, null, null, overlay);
        }
    };
}

async function startEvolutionAnimation(word, entry, branchWord, branchType, overlay) {
    const modal = overlay.querySelector('.evolution-modal');
    modal.innerHTML = `
        <h2>What?</h2>
        <p>${word} is evolving!</p>
        <div class="evo-word" id="animWord" style="font-size: 32px; font-weight: 800; margin: 40px 0;">${word}</div>
    `;
    
    const animWord = document.getElementById('animWord');
    animWord.style.animation = "evolvePulse 2s infinite";
    
    setTimeout(async () => {
        try {
            const result = await Evolution.performEvolution(word, entry, branchWord, branchType);
            const newWord = result.word;
            const newEntry = result.entry;
            
            const finalStage = newEntry.evolution.stage;
            const finalColor = Evolution.colors[finalStage];
            
            modal.innerHTML = `
                <h2 style="color: ${finalColor}; text-shadow: 0 0 10px ${finalColor}66;">Congratulations!</h2>
                <p>Your ${word} evolved into...</p>
                <div class="evo-word" style="font-size: 32px; font-weight: 800; margin: 20px 0; color: ${finalColor}; text-shadow: 0 0 20px ${finalColor}88;">
                    ${newWord} ${Evolution.stars[finalStage] || '★'}
                </div>
                <p>Stats increased! Aura unlocked!</p>
                <button id="btnEvolveDone" class="quiz-btn" style="background: ${finalColor}; color: ${finalStage===1?'white':'#333'};">Awesome!</button>
            `;
            
            document.getElementById('btnEvolveDone').onclick = () => {
                overlay.remove();
                if (typeof displayWordDex !== 'undefined') displayWordDex(currentSort);
            };
        } catch (e) {
            console.error(e);
            alert("Evolution failed: " + e.message);
            overlay.remove();
        }
    }, 3000);
}

window.confirmEvolution = confirmEvolution;
