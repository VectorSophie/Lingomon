// evolution-modal.js

function confirmEvolution(word, entry) {
    // Show Modal
    const overlay = document.createElement('div');
    overlay.className = 'evolution-overlay';
    
    // Initial content
    // Determine target color for preview
    const targetStage = (entry.evolution.stage || 0) + 1;
    // Fallback logic for colors in modal since we might not have Evolution global immediately
    // Or we assume Evolution is loaded (it is in popup.html)
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
    
    // Add styles if missing
    if (!document.getElementById('evo-styles')) {
        const style = document.createElement('style');
        style.id = 'evo-styles';
        style.innerHTML = `
            .evolution-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(5px);
                z-index: 20000;
                display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.3s;
            }
            .evolution-modal {
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                padding: 32px; border-radius: 24px;
                text-align: center; width: 340px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1) inset;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .evo-preview {
                display: flex; align-items: center; justify-content: center;
                gap: 20px; margin: 30px 0; font-size: 24px; font-weight: 800;
            }
            .evo-word {
                text-shadow: 0 0 15px rgba(255,255,255,0.3);
            }
            .evo-arrow {
                color: #888; font-size: 20px;
            }
            .evo-actions {
                display: flex; justify-content: center; gap: 12px; margin-top: 30px;
            }
            .quiz-btn {
                padding: 10px 24px; font-size: 16px; border-radius: 50px; cursor: pointer; border: none;
                background: linear-gradient(45deg, #6b5b95, #8675a9); color: white;
                box-shadow: 0 4px 15px rgba(107, 91, 149, 0.3);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .quiz-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(107, 91, 149, 0.4); }
            .quiz-btn.secondary { background: #444; color: #ccc; box-shadow: none; }
            
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes evolvePulse {
                0% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(255,215,0,0)); }
                50% { transform: scale(1.15); filter: brightness(1.5) drop-shadow(0 0 30px rgba(255,215,0,0.8)); }
                100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(255,215,0,0)); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.getElementById('btnEvolveCancel').onclick = () => overlay.remove();
    document.getElementById('btnEvolveConfirm').onclick = async () => {
        // Trigger Animation Sequence
        const modal = overlay.querySelector('.evolution-modal');
        modal.innerHTML = `
            <h2>What?</h2>
            <p>${word} is evolving!</p>
            <div class="evo-word" id="animWord" style="font-size: 32px; font-weight: 800; margin: 40px 0;">${word}</div>
        `;
        
        const animWord = document.getElementById('animWord');
        animWord.style.animation = "evolvePulse 2s infinite";
        
        // Wait for animation
        setTimeout(async () => {
            try {
                if (typeof Evolution !== 'undefined') {
                    await Evolution.performEvolution(word, entry);
                    
                    // Success Screen
                    // Play sound logic (stub)
                    // const audio = new Audio('evolution_success.mp3'); audio.play().catch(()=>{});
                    
                    const newStage = entry.evolution.stage;
                    const finalColor = Evolution.colors[newStage];
                    
                    modal.innerHTML = `
                        <h2 style="color: ${finalColor}; text-shadow: 0 0 10px ${finalColor}66;">Congratulations!</h2>
                        <p>Your ${word} evolved into...</p>
                        <div class="evo-word" style="font-size: 32px; font-weight: 800; margin: 20px 0; color: ${finalColor}; text-shadow: 0 0 20px ${finalColor}88;">
                            ${word} ${Evolution.stars[newStage] || '★'}
                        </div>
                        <p>Stats increased! Aura unlocked!</p>
                        <button id="btnEvolveDone" class="quiz-btn" style="background: ${finalColor}; color: ${newStage===1?'white':'#333'};">Awesome!</button>
                    `;
                    
                    document.getElementById('btnEvolveDone').onclick = () => {
                        overlay.remove();
                        if (typeof displayWordDex !== 'undefined') displayWordDex(currentSort);
                    };
                }
            } catch (e) {
                console.error(e);
                alert("Evolution failed: " + e.message);
                overlay.remove();
            }
        }, 3000);
    };
}

// Export global
window.confirmEvolution = confirmEvolution;
