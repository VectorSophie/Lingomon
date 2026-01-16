
class BattleSystem {
  constructor(playerTeam, enemyTeam, metadata = {}) {
    this.metadata = metadata;
    // Helper to calculate stats safely (using global or local fallback)
    const getStat = (u, type) => {
        if (typeof window.calculateStat === 'function') return window.calculateStat(u, type);
        // Fallback if not available
        return 10; 
    };

    this.pTeam = playerTeam.filter(u => u !== null);
    this.eTeam = enemyTeam.filter(u => u !== null);
    this.pIndex = 0;
    this.eIndex = 0;
    this.active = true;
    this.logs = [];
    
    // Initialize HP
    this.pTeam.forEach(u => u.maxHp = u.currentHp = getStat(u, 'hp'));
    this.eTeam.forEach(u => u.maxHp = u.currentHp = getStat(u, 'hp'));
  }
  
  start() {
    this.renderLayout();
    this.logMsg(t('battleStart'));
    setTimeout(() => this.nextTurn(), 1000);
  }
  
  renderLayout() {
    const container = document.getElementById('battleContainer');
    container.innerHTML = `
      <div class="battle-header">
        <button id="exitBattleBtn" style="background:none;border:none;cursor:pointer;">${t('battleRun')}</button>
        <span id="battleStatus">${t('battleVS')}</span>
        <button id="dlLogBtn" style="display:none; background:#eee; border:1px solid #ccc; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-left:auto;">Save Log</button>
      </div>
      <div class="battle-field">
        <div class="battle-side-enemy" id="enemySide">
           <div id="enemySprite" class="battle-word"></div>
           <div class="health-bar"><div id="enemyHp" class="health-fill" style="width:100%"></div></div>
        </div>
        
        <div class="battle-side-player" id="playerSide">
           <div id="playerSprite" class="battle-word"></div>
           <div class="health-bar"><div id="playerHp" class="health-fill" style="width:100%"></div></div>
        </div>
      </div>
      <div id="battleLog" class="battle-log"></div>
    `;
    
    document.getElementById('exitBattleBtn').onclick = () => this.endBattle(false);
    const dlBtn = document.getElementById('dlLogBtn');
    if(dlBtn) dlBtn.onclick = () => this.downloadLog();
  }
  
  updateUI() {
    if (!this.active) return;
    
    // Update Enemy
    if (this.eIndex < this.eTeam.length) {
        const enemy = this.eTeam[this.eIndex];
        const eSprite = document.getElementById('enemySprite');
        // Restore full word display
        eSprite.textContent = enemy.word;
        
        if (enemy.rarity === 'god') {
             eSprite.style.backgroundImage = rarityScale[enemy.rarity];
             eSprite.style.backgroundSize = '200% auto';
             eSprite.style.webkitBackgroundClip = 'text';
             eSprite.style.webkitTextFillColor = 'transparent';
             eSprite.style.animation = 'rainbow 2s linear infinite';
        } else {
             eSprite.style.backgroundImage = 'none';
             eSprite.style.webkitBackgroundClip = 'initial';
             eSprite.style.webkitTextFillColor = 'initial';
             eSprite.style.color = rarityScale[enemy.rarity] || '#000';
             eSprite.style.animation = 'none';
        }
        
        const ePct = (enemy.currentHp / enemy.maxHp) * 100;
        document.getElementById('enemyHp').style.width = `${Math.max(0, ePct)}%`;
    } else {
        document.getElementById('enemySprite').textContent = "";
        document.getElementById('enemyHp').style.width = `0%`;
    }
    
    // Update Player
    if (this.pIndex < this.pTeam.length) {
        const player = this.pTeam[this.pIndex];
        const pSprite = document.getElementById('playerSprite');
        // Restore full word display
        pSprite.textContent = player.word;
        
        if (player.rarity === 'god') {
             pSprite.style.backgroundImage = rarityScale[player.rarity];
             pSprite.style.backgroundSize = '200% auto';
             pSprite.style.webkitBackgroundClip = 'text';
             pSprite.style.webkitTextFillColor = 'transparent';
             pSprite.style.animation = 'rainbow 2s linear infinite';
        } else {
             pSprite.style.backgroundImage = 'none';
             pSprite.style.webkitBackgroundClip = 'initial';
             pSprite.style.webkitTextFillColor = 'initial';
             pSprite.style.color = rarityScale[player.rarity] || '#000';
             pSprite.style.animation = 'none';
        }
        
        const pPct = (player.currentHp / player.maxHp) * 100;
        document.getElementById('playerHp').style.width = `${Math.max(0, pPct)}%`;
    } else {
        document.getElementById('playerSprite').textContent = "";
        document.getElementById('playerHp').style.width = `0%`;
    }
  }
  
  checkWin() {
    if (this.pIndex >= this.pTeam.length) {
        this.endBattle(false);
        return true;
    }
    if (this.eIndex >= this.eTeam.length) {
        this.endBattle(true);
        return true;
    }
    return false;
  }
  
  nextTurn() {
    if (!this.active) return;
    if (this.checkWin()) return;
    
    // Simple Turn: Player always attacks first for now (Speed calc later)
    this.performAttack(this.pTeam[this.pIndex], this.eTeam[this.eIndex], true, () => {
        if (!this.active) return;
        if (this.eTeam[this.eIndex].currentHp <= 0) {
            this.logMsg(t('battleFainted', { word: this.eTeam[this.eIndex].word }));
            this.eIndex++;
            if (this.checkWin()) return;
            this.updateUI();
            setTimeout(() => this.nextTurn(), 1000); // Next round
        } else {
            // Enemy attacks back
            setTimeout(() => {
                if (!this.active) return;
                this.performAttack(this.eTeam[this.eIndex], this.pTeam[this.pIndex], false, () => {
                    if (!this.active) return;
                    if (this.pTeam[this.pIndex].currentHp <= 0) {
                        this.logMsg(t('battleFainted', { word: this.pTeam[this.pIndex].word }));
                        this.pIndex++;
                        if (this.checkWin()) return;
                    }
                    this.updateUI();
                    setTimeout(() => this.nextTurn(), 1000);
                });
            }, 1000);
        }
    });
  }
  
  performAttack(attacker, defender, isPlayer, callback) {
    const spriteId = isPlayer ? 'playerSprite' : 'enemySprite';
    const targetId = isPlayer ? 'enemySprite' : 'playerSprite';
    
    // Animate Attack
    const sprite = document.getElementById(spriteId);
    if(sprite) {
        sprite.style.transform = isPlayer ? 'translate(20px, -20px)' : 'translate(-20px, 20px)';
        setTimeout(() => sprite.style.transform = 'translate(0,0)', 200);
    }
    
    // Calc Damage
    // Use global calculateStat if available
    const getStat = (u, type) => (typeof window.calculateStat === 'function' ? window.calculateStat(u, type) : 10);
    const damage = getStat(attacker, 'atk');
    
    // Random variance 0.8 - 1.2
    const variance = (Math.random() * 0.4) + 0.8;
    const finalDamage = Math.floor(damage * variance);
    
    setTimeout(() => {
        defender.currentHp = Math.max(0, defender.currentHp - finalDamage);
        this.logMsg(t('battleAttacks', { attacker: attacker.word, damage: finalDamage }));
        this.showDamage(document.getElementById(targetId), finalDamage);
        this.updateUI();
        callback();
    }, 300);
  }
  
  showDamage(element, amount) {
    if (!element) return;
    const dmg = document.createElement('div');
    dmg.textContent = `-${amount}`;
    dmg.className = 'damage-number';
    element.appendChild(dmg);
    setTimeout(() => dmg.remove(), 800);
  }
  
  calculateRatingChange(isWin) {
    // Current stats (already incremented before this call)
    const wins = currentUserProfile.wins || 0;
    const losses = currentUserProfile.losses || 0;
    const totalGames = wins + losses;
    const userRating = (currentUserProfile && currentUserProfile.rating) !== undefined ? currentUserProfile.rating : 0;
    
    let delta = 0;
    
    // Placement Logic (First 5 Games)
    if (totalGames <= 5) {
        // Start from 0 implies we add big chunks.
        // Win: +200-300. Loss: +20-50 (Still gain a bit or lose small? Standard placement matches usually boost you to your tier).
        // Let's implement: Win = +200, Loss = -0 (or small).
        // If they win all 5, they get 1000.
        // If they win 3, they get 600.
        
        if (isWin) {
            delta = 200;
            // Bonus for beating human during placement
            if (!this.metadata.isBot) delta += 50; 
        } else {
            // Placement loss - minimal penalty to find "floor"
            delta = 20; 
        }
        return { delta, isPlacement: true };
    }
    
    // Standard Logic (Post-Placement)
    if (this.metadata.isBot) {
        // Bot Logic: +2~4 based on power diff
        const userPower = this.pTeam.reduce((acc, w) => acc + (window.calculatePower ? window.calculatePower(w) : 0), 0);
        const enemyPower = this.metadata.enemyPower || userPower;
        
        const adjustment = Math.round((enemyPower - userPower) / 300);
        delta = 3 + adjustment;
        if (delta < 2) delta = 2;
        if (delta > 4) delta = 4;
        
    } else {
        // Human Logic: +6~8 based on rating diff
        const enemyRating = this.metadata.enemyRating || 1000;
        const ratingDiff = enemyRating - userRating;
        const adjustment = Math.round(ratingDiff / 100);
        delta = 7 + adjustment;
        if (delta < 6) delta = 6;
        if (delta > 8) delta = 8;
    }
    return { delta, isPlacement: false };
  }

  endBattle(win) {
    this.active = false;
    const result = win ? t('battleVictory') : t('battleDefeat');
    this.logMsg(`--- ${result} ---`);
    
    const statusEl = document.getElementById('battleStatus');
    if(statusEl) statusEl.textContent = result;
    
    if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
        // Update Stats
        if (win) currentUserProfile.wins++; else currentUserProfile.losses++;
        
        // Calculate Rating
        const { delta, isPlacement } = this.calculateRatingChange(win);
        
        // Handle undefined rating (first time user)
        if (typeof currentUserProfile.rating === 'undefined') currentUserProfile.rating = 0;
        
        const currentRating = currentUserProfile.rating;
        // Determine sign based on win/loss. 
        // Note: In placement, we return positive delta even for loss (participation/calibration)? 
        // No, standard ELO loses points on loss. But user wants "determine spot".
        // Let's assume placement loss is negative or zero. 
        // In calculateRatingChange, I returned positive delta for loss (20).
        // Let's apply it as subtraction if loss.
        
        const change = win ? delta : -delta;
        let newRating = currentRating + change;
        if (newRating < 0) newRating = 0;
        
        currentUserProfile.rating = newRating;
        
        const sign = change >= 0 ? '+' : '';
        
        if (isPlacement) {
             const gamesLeft = 5 - (currentUserProfile.wins + currentUserProfile.losses);
             const progress = gamesLeft > 0 ? `(${gamesLeft} placements left)` : `(Placement Complete!)`;
             this.logMsg(`Placement: ${newRating} (${sign}${change}) ${progress}`);
        } else {
             this.logMsg(`Rating: ${newRating} (${sign}${change})`);
        }
        
        if(typeof supabaseClient !== 'undefined') {
            const updates = { 
                wins: currentUserProfile.wins, 
                losses: currentUserProfile.losses,
                rating: newRating
            };
            supabaseClient.from('profiles').update(updates).eq('id', currentUserProfile.id).then();
        }
    }
    
    const exitBtn = document.getElementById('exitBattleBtn');
    if(exitBtn) {
        exitBtn.textContent = t('battleBack');
        exitBtn.onclick = () => {
             // Return to menu instead of closing completely
             renderBattleMenu();
        };
    }
    
    const dlBtn = document.getElementById('dlLogBtn');
    if(dlBtn) dlBtn.style.display = 'block';
  }
  
  downloadLog() {
    if (!this.logs || this.logs.length === 0) return;
    const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingomon-battle-${new Date().toISOString().replace(/[:.]/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  logMsg(msg) {
    this.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    const logEl = document.getElementById('battleLog');
    if(logEl) {
        logEl.innerHTML += `<div>${msg}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

let battleSystem = null;

// Entry point for the "Battle" tab
function startBattle() {
  renderBattleMenu();
}

function renderBattleMenu() {
    // Switch to Battle UI container
    if (document.getElementById('mainContent')) document.getElementById('mainContent').style.display = 'none';
    if (document.getElementById('searchBar')) document.getElementById('searchBar').style.display = 'none';
    if (document.querySelector('.controls')) document.querySelector('.controls').style.display = 'none';
    if (document.getElementById('battleContainer')) document.getElementById('battleContainer').style.display = 'flex';
    
    const container = document.getElementById('battleContainer');
    
    // Check requirements
    if (typeof currentUserProfile === 'undefined' || !currentUserProfile) { 
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p>${t('profileLoginReq')}</p>
                <button class="quiz-btn" onclick="switchTab('dex')">${t('battleBack')}</button>
            </div>
        `;
        return; 
    }
    
    const pTeam = currentTeam.filter(w => w);
    if (pTeam.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p>${t('profileTeamReq')}</p>
                <button class="quiz-btn" onclick="switchTab('dex')">${t('battleBack')}</button>
            </div>
        `;
        return;
    }

    // Render Menu
    container.innerHTML = `
        <div style="text-align:center; width:100%;">
            <h3 style="margin-bottom:20px;">${t('battleArena')}</h3>
            
            <div style="display:flex; gap:10px; margin-bottom:12px; height:42px;">
                <!-- Random Battle Button -->
                <button id="btnRandomBattle" style="flex:1; background:#000; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">
                    ${t('battleRandom')}
                </button>
                
                <!-- Friend Battle (Input + Go) -->
                <div style="flex:1; display:flex;">
                    <input type="text" id="friendIdInput" placeholder="${t('battleFriendId')}" style="flex:1; border:2px solid #000; border-right:none; border-radius:8px 0 0 8px; padding:0 8px; outline:none; font-size:11px; min-width:0;">
                    <button id="btnFriendBattle" style="width:40px; background:#000; color:#fff; border:none; border-radius:0 8px 8px 0; cursor:pointer; font-weight:bold; font-size:11px;">
                        ${t('battleGo')}
                    </button>
                </div>
            </div>

             <button id="btnBackToDex" class="quiz-btn secondary" style="margin-top:20px; background:transparent; color:#666; border:1px solid #ccc;">${t('battleBack')}</button>
        </div>
    `;
    
    document.getElementById('btnRandomBattle').onclick = startRandomSearch;
    document.getElementById('btnFriendBattle').onclick = () => {
        const friendId = document.getElementById('friendIdInput').value.trim();
        if(friendId) startFriendBattle(friendId);
    };
    document.getElementById('btnBackToDex').onclick = () => switchTab('dex');
}

async function startRandomSearch() {
    const container = document.getElementById('battleContainer');
    container.innerHTML = `
        <div style="text-align:center; padding:40px;">
            <div class="loader" style="margin:0 auto 20px;"></div>
            <p>${t('battleSearching')}</p>
            <p id="searchTimer" style="font-size:12px; color:#666;">0s</p>
            <button id="cancelSearch" class="quiz-btn secondary" style="margin-top:20px;">${t('battleCancel')}</button>
        </div>
    `;
    
    // Add loader style if missing
    if (!document.getElementById('loader-style')) {
        const style = document.createElement('style');
        style.id = 'loader-style';
        style.innerHTML = `
            .loader {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
    
    let isSearching = true;
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById('searchTimer');
        if(timerEl) timerEl.textContent = `${seconds}s`;
        
        // Timeout check (20s)
        if (seconds >= 10) {
            clearInterval(timerInterval);
            if (isSearching) {
                isSearching = false;
                startBotBattle();
            }
        }
    }, 1000);
    
    document.getElementById('cancelSearch').onclick = () => {
        isSearching = false;
        clearInterval(timerInterval);
        renderBattleMenu();
    };
    
    // Search Logic (Attempts at 0s, 5s, 10s, 15s)
    const userPower = currentTeam.reduce((acc, w) => acc + (window.calculatePower ? window.calculatePower(w) : 0), 0);
    
    const searchAttempts = [
        { range: 100, delay: 0 },
        { range: 300, delay: 5000 },
        { range: 500, delay: 10000 },
        { range: 10000, delay: 15000 } // Basically any
    ];
    
    for (const attempt of searchAttempts) {
        if (!isSearching) return;
        
        // Wait for delay if needed (first one is 0)
        if (attempt.delay > seconds * 1000) {
             // We are running this loop faster than the timer, but we should actually sleep?
             // Since JS is single threaded, let's just schedule timeouts.
             // Better: Run one recursive function.
        }
    }
    
    // Recursive search function
    const performSearch = async (attemptIdx) => {
        if (!isSearching) return;
        if (attemptIdx >= searchAttempts.length) return; // Wait for timeout
        
        const attempt = searchAttempts[attemptIdx];
        
        console.log(`Searching for opponent... Range: +/- ${attempt.range}`);
        
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const minPower = Math.max(0, userPower - attempt.range);
            const maxPower = userPower + attempt.range;
            
            const { data, error } = await supabaseClient
                .from('battle_teams')
                .select('*')
                .neq('user_id', currentUserProfile.id)
                .gte('team_power', minPower)
                .lte('team_power', maxPower)
                .limit(5); // Fetch a few to pick random
            
            if (data && data.length > 0) {
                clearInterval(timerInterval);
                isSearching = false;
                const randomOpponent = data[Math.floor(Math.random() * data.length)];
                console.log("Found opponent:", randomOpponent);
                
                // Fetch opponent rating
                let opponentRating = 1000;
                try {
                    const { data: oppProfile } = await supabaseClient
                        .from('profiles')
                        .select('rating')
                        .eq('id', randomOpponent.user_id)
                        .single();
                    if (oppProfile) opponentRating = oppProfile.rating || 1000;
                } catch(e) { console.error("Error fetching opponent rating", e); }

                initiateBattle(randomOpponent.team_data, {
                    isBot: false,
                    enemyRating: opponentRating,
                    enemyPower: randomOpponent.team_power
                });
                return;
            }
        }
        
        // Schedule next attempt
        if (attemptIdx + 1 < searchAttempts.length) {
            const nextDelay = searchAttempts[attemptIdx + 1].delay - searchAttempts[attemptIdx].delay;
            setTimeout(() => performSearch(attemptIdx + 1), nextDelay);
        }
    };
    
    // Start search sequence
    performSearch(0);
}

async function startFriendBattle(friendId) {
     if (typeof supabaseClient === 'undefined' || !supabaseClient) {
         alert("Online features unavailable");
         return;
     }
     
     const btn = document.getElementById('btnFriendBattle');
     btn.textContent = "...";
     btn.disabled = true;
     
     // Note: we are searching by user_id which is a UUID.
     // Users see "Trainer ABCD" usually.
     // If the input is the UUID, it works. If it's the username, we need to query profiles first.
     // For now, assume ID (UUID) or we can try to find by username if we had that column indexed/unique.
     // The profile.js generates "Trainer 1234".
     
     // Let's try to find by exact ID first.
     let { data, error } = await supabaseClient
        .from('battle_teams')
        .select('*')
        .eq('user_id', friendId)
        .single();
        
     if (!data) {
         // Try by username in profiles, then get team
         const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', friendId)
            .single();
            
         if (profileData) {
             const { data: teamData } = await supabaseClient
                .from('battle_teams')
                .select('*')
                .eq('user_id', profileData.id)
                .single();
             data = teamData;
         }
     }
     
     btn.textContent = t('battleFight');
     btn.disabled = false;
     
     if (data && data.team_data) {
          // Fetch opponent rating for friend battle
          let opponentRating = 1000;
          try {
               const { data: oppProfile } = await supabaseClient
                   .from('profiles')
                   .select('rating')
                   .eq('id', data.user_id)
                   .single();
               if (oppProfile) opponentRating = oppProfile.rating || 1000;
          } catch(e) {}

         initiateBattle(data.team_data, {
             isBot: false,
             enemyRating: opponentRating,
             enemyPower: data.team_power || 0
         });
     } else {
         alert(t('battleFriendNotFound'));
     }
}

function startBotBattle() {
    // Generate Bot Team
    const userPower = currentTeam.reduce((acc, w) => acc + (window.calculatePower ? window.calculatePower(w) : 0), 0);
    const targetPower = userPower; // Aim for equal
    
    chrome.storage.local.get(['wordDex'], (data) => {
        const allWords = Object.entries(data.wordDex || {})
            .map(([word, info]) => ({ word, ...info }))
            .filter(w => w.rarity !== 'god');
        // Fallback words if local dex is empty
        const fallbackWords = [
            {word: "Bot", rarity: "common"}, {word: "AI", rarity: "uncommon"}, {word: "Luck", rarity: "rare"},
            {word: "Code", rarity: "epic"}, {word: "Bug", rarity: "legendary"}
        ];
        const source = allWords.length > 10 ? allWords : fallbackWords;
        
        const botTeam = [];
        let currentBotPower = 0;
        
        // Simple generation: Pick 5 random words
        for (let i=0; i<5; i++) {
            const rnd = source[Math.floor(Math.random() * source.length)];
            // Clone
            const member = { ...rnd };
            
            // Artificial Balancing? 
            // For now, pure random from source is "luck can behold"
            // But let's try to assign a random rarity if it's too weak?
            // Actually, just picking random words from the user's dex (which likely has variety) 
            // or the fallback list is good enough for "random AI bot".
            // To make it "around the same strength", we can adjust the last member?
            
            botTeam.push(member);
        }
        
        // Ensure "luck can behold" - maybe 10% chance for a GOD rarity bot?
        // God tier disabled for battles
        /*
        if (Math.random() < 0.1) {
            botTeam[0] = { word: "DEUS MACHINA", rarity: "god" };
        }
        */
        
        initiateBattle(botTeam, { 
            isBot: true, 
            enemyPower: botTeam.reduce((acc, w) => acc + (window.calculatePower ? window.calculatePower(w) : 0), 0)
        });
    });
}

function initiateBattle(enemyTeamData, metadata = {}) {
    const pTeam = currentTeam.filter(w => w && w.rarity !== 'god');
    battleSystem = new BattleSystem(pTeam, enemyTeamData, metadata);
    battleSystem.start();
}

function closeBattle() {
  document.getElementById('battleContainer').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('searchBar').style.display = 'block';
  document.querySelector('.controls').style.display = 'flex';
}
