
class BattleSystem {
  constructor(playerTeam, enemyTeam) {
    this.pTeam = playerTeam.filter(u => u !== null);
    this.eTeam = enemyTeam.filter(u => u !== null);
    this.pIndex = 0;
    this.eIndex = 0;
    this.active = true;
    
    // Initialize HP
    this.pTeam.forEach(u => u.maxHp = u.currentHp = calculateStat(u, 'hp'));
    this.eTeam.forEach(u => u.maxHp = u.currentHp = calculateStat(u, 'hp'));
  }
  
  start() {
    this.renderLayout();
    this.logMsg(t('battleStart'));
    setTimeout(() => this.nextTurn(), 1000);
  }
  
  renderLayout() {
    const container = document.getElementById('battleContainer');
    // ... (rest of layout rendering logic needs to be verified if it uses external helpers)
    // Assuming standard layout generation
    container.innerHTML = `
      <div class="battle-arena">
        <div class="battle-header">
           <div id="battleStatus" style="font-weight:bold;">${t('battleVS')}</div>
        </div>
        
        <div class="sprites-area">
           <div class="sprite-container">
             <div id="enemySprite" class="battle-sprite enemy"></div>
             <div id="enemyHpBar" class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div>
             <div id="enemyName"></div>
           </div>
           
           <div class="sprite-container">
             <div id="playerSprite" class="battle-sprite player"></div>
             <div id="playerHpBar" class="hp-bar-bg"><div class="hp-bar-fill" style="width:100%"></div></div>
             <div id="playerName"></div>
           </div>
        </div>
        
        <div class="battle-log" id="battleLog"></div>
        
        <div class="battle-controls">
           <button id="exitBattleBtn">${t('battleRun')}</button>
        </div>
      </div>
    `;
    
    document.getElementById('exitBattleBtn').onclick = () => this.endBattle(false);
  }
  
  updateUI() {
    if (!this.active) return;
    
    // Update Enemy
    if (this.eIndex < this.eTeam.length) {
        const enemy = this.eTeam[this.eIndex];
        const ePct = (enemy.currentHp / enemy.maxHp) * 100;
        document.getElementById('enemyName').textContent = `${enemy.word} (Lvl.${calculateStat(enemy, 'atk')})`;
        document.getElementById('enemyName').style.color = rarityScale[enemy.rarity] || '#000';
        document.querySelector('#enemyHpBar .hp-bar-fill').style.width = `${Math.max(0, ePct)}%`;
        
        const eSprite = document.getElementById('enemySprite');
        eSprite.textContent = enemy.word[0].toUpperCase();
        eSprite.style.borderColor = rarityScale[enemy.rarity] || '#000';
    }
    
    // Update Player
    if (this.pIndex < this.pTeam.length) {
        const player = this.pTeam[this.pIndex];
        const pPct = (player.currentHp / player.maxHp) * 100;
        document.getElementById('playerName').textContent = `${player.word}`;
        document.getElementById('playerName').style.color = rarityScale[player.rarity] || '#000';
        document.querySelector('#playerHpBar .hp-bar-fill').style.width = `${Math.max(0, pPct)}%`;
        
        const pSprite = document.getElementById('playerSprite');
        pSprite.textContent = player.word[0].toUpperCase();
        pSprite.style.borderColor = rarityScale[player.rarity] || '#000';
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
    const damage = calculateStat(attacker, 'atk');
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
  
  endBattle(win) {
    this.active = false;
    const result = win ? t('battleVictory') : t('battleDefeat');
    this.logMsg(`--- ${result} ---`);
    const statusEl = document.getElementById('battleStatus');
    if(statusEl) statusEl.textContent = result;
    
    if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
        // Simple client-side update for immediate feedback
        if (win) currentUserProfile.wins++; else currentUserProfile.losses++;
        
        if(typeof supabaseClient !== 'undefined') {
            const updates = win ? { wins: currentUserProfile.wins } : { losses: currentUserProfile.losses };
            supabaseClient.from('profiles').update(updates).eq('id', currentUserProfile.id).then();
        }
    }
    
    const exitBtn = document.getElementById('exitBattleBtn');
    if(exitBtn) exitBtn.textContent = t('battleBack');
  }
  
  logMsg(msg) {
    const logEl = document.getElementById('battleLog');
    if(logEl) {
        logEl.innerHTML += `<div>${msg}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
  }
}

function calculateStat(wordData, type) {
  if (!wordData) return 0;
  const len = wordData.word.length;
  const rarity = wordData.rarity;
  
  // Base multipliers
  const rarityMult = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3, mythic: 5, god: 10 };
  const rVal = rarityMult[rarity] || 1;

  switch(type) {
    case 'hp': return Math.floor(len * 10 * rVal); // Long = Tanky
    case 'atk': return Math.floor((rVal * 20)); // Rarity = Damage
    case 'speed': return Math.floor(100 / len); // Short = Fast
    default: return 0;
  }
}

function calculatePower(wordData) {
  if(!wordData) return 0;
  return calculateStat(wordData, 'hp') + calculateStat(wordData, 'atk') + calculateStat(wordData, 'speed');
}

let battleSystem = null;

function startBattle() {
  chrome.storage.local.get(['wordDex'], (data) => {
    // Player Team
    const pTeam = currentTeam.filter(u => u !== null);
    if (pTeam.length === 0) {
        alert(t('profileTeamReq'));
        switchTab('dex'); // Assuming switchTab is global
        // We'll handle switchTab dependency by ensuring it's available or failing gracefully
        // Ideally switchTab is in popup.js which is loaded later, but we need to call it.
        // Since functions are hoisted, if popup.js is loaded, it should work.
        // Wait, popup.js is loaded *after*? 
        // If startBattle is called FROM popup.js, then switchTab exists.
        return;
    }
    
    // Generate Enemy Team (Random)
    const allWords = Object.values(data.wordDex || {});
    if (allWords.length === 0) return;
    
    const eTeam = [];
    const teamSize = pTeam.length;
    for(let i=0; i<teamSize; i++) {
        const rnd = allWords[Math.floor(Math.random() * allWords.length)];
        // Clone to avoid modifying storage
        eTeam.push({ ...rnd }); 
    }
    
    battleSystem = new BattleSystem(pTeam, eTeam);
    battleSystem.start();
  });
}
