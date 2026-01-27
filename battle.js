
// Standardized Power Calculation for Display
window.calculatePower = (u) => {
    if (!u) return 0;
    const len = u.word.length;
    const effectiveLen = Math.min(len, 20); 
    
    const rarityBonus = {
        'common': 0, 'uncommon': 5, 'rare': 10, 'epic': 20, 
        'legendary': 40, 'mythic': 80, 'god': 200
    }[u.rarity ? u.rarity.toLowerCase() : 'common'] || 0;
    
    // Power Score = Base Power
    return (effectiveLen * 2) + rarityBonus;
};

if (typeof window.COMBOS === 'undefined') {
    window.COMBOS = [
        {
            name: "The Quintuplets",
            words: ["who", "what", "where", "when", "why"],
            desc: "Resurrects first fallen unit with 1 HP (50% chance)",
            effect: (system) => {
                system.logMsg("COMBO: The Quintuplets! Resurrection active!");
                system.metadata.hasRevive = true;
            },
            color: "#FFD700" // Gold
        },
        {
            name: "Liberator",
            words: ["we", "the", "people"],
            desc: "Grants +20% Attack to all team members",
            effect: (system) => {
                 system.logMsg("COMBO: Liberator! +20% ATK to all!");
                 system.pTeam.forEach(u => {
                     u.atkModifier = (u.atkModifier || 1) * 1.2;
                 });
            },
            color: "#00BFFF" // Deep Sky Blue
        },
        {
            name: "Time Traveler",
            words: ["time", "travel", "past", "future"],
            desc: "+15% Speed to all team members",
            effect: (system) => {
                system.logMsg("COMBO: Time Traveler! +15% Speed!");
                // Speed not fully implemented in stats yet, assuming init turn order modification or similar
                // For now, let's just log it.
            },
            color: "#FF69B4" // Hot Pink
        },
        {
            name: "Nature's Wrath",
            words: ["fire", "water", "earth", "wind"],
            desc: "Deal 10% extra elemental damage on every hit",
            effect: (system) => {
                system.logMsg("COMBO: Nature's Wrath! +10% Damage!");
                 system.pTeam.forEach(u => {
                     u.atkModifier = (u.atkModifier || 1) * 1.1;
                 });
            },
            color: "#32CD32" // Lime Green
        },
        {
            name: "Binary Code",
            words: ["zero", "one", "code"],
            desc: "+10% Crit Chance for digital constructs",
            effect: (system) => {
                system.logMsg("COMBO: Binary Code! +10% Crit Chance!");
                system.pTeam.forEach(u => {
                     u.critChance = (u.critChance || 0) + 0.1;
                 });
            },
            color: "#00FF00" // Electric Green
        },
        {
            name: "Tech Stack",
            words: ["html", "css", "javascript"],
            desc: "Optimization: +20% Speed to all",
            effect: (system) => {
                system.logMsg("COMBO: Tech Stack! Systems Optimized!");
                 system.pTeam.forEach(u => {
                     // Speed not fully implemented, but let's add the modifier
                     u.speedModifier = (u.speedModifier || 1) * 1.2;
                     // Also give small evasion boost as speed proxy
                     u.evasion = (u.evasion || 0) + 0.1;
                 });
            },
            color: "#61DAFB" // Cyan
        },
        {
            name: "Bio Hazard",
            words: ["virus", "bacteria", "infection"],
            desc: "Infects enemies: -10% Attack",
            effect: (system) => {
                system.logMsg("COMBO: Bio Hazard! Enemies weakened!");
                 system.eTeam.forEach(u => {
                     u.atkModifier = (u.atkModifier || 1) * 0.9;
                 });
            },
            color: "#7FFF00" // Chartreuse
        },
        {
            name: "Jurassic Park",
            words: ["tyrannosaurus", "velociraptor", "dinosaur"],
            desc: "Primal Rage: +30% Attack",
            effect: (system) => {
                system.logMsg("COMBO: Jurassic Park! Primal Rage!");
                 system.pTeam.forEach(u => {
                     u.atkModifier = (u.atkModifier || 1) * 1.3;
                 });
            },
            color: "#A0522D" // Sienna
        },
        {
            name: "Big Bang",
            words: ["star", "galaxy", "supernova"],
            desc: "Cosmic Event: Deals 20 damage to ALL units (Friend & Foe)",
            effect: (system) => {
                system.logMsg("COMBO: BIG BANG! Cosmic damage!");
                // Damage everyone
                [...system.pTeam, ...system.eTeam].forEach(u => {
                    u.currentHp = Math.max(1, u.currentHp - 20); // Don't kill, leave at 1
                });
            },
            color: "#4B0082" // Indigo
        },
        {
            name: "H2O",
            words: ["hydrogen", "oxygen"],
            desc: "Healing Rain: Restores 30% HP to team",
            effect: (system) => {
                system.logMsg("COMBO: H2O! Healing Rain!");
                system.pTeam.forEach(u => {
                    u.currentHp = Math.min(u.maxHp, u.currentHp + Math.floor(u.maxHp * 0.3));
                });
            },
            color: "#00CED1" // Dark Turquoise
        }
    ];
}

class BattleSystem {
  constructor(playerTeam, enemyTeam, metadata = {}) {
    this.metadata = metadata;
    // Helper to calculate stats safely (using global or local fallback)
    const getStat = (u, type) => {
        let val = 10;
        
        // Logarithmic scaling for length to prevent exponential runaway for long words
        // Base stat = (Length * 2) + RarityBonus
        // RarityBonus: Common=0, Uncommon=5, Rare=10, Epic=20, Legendary=40, Mythic=80, God=200
        const len = u.word.length;
        // Cap length contribution at 20 chars (40 points) to stop pneumono... from dominating
        const effectiveLen = Math.min(len, 20); 
        
        const rarityBonus = {
            'common': 0, 'uncommon': 5, 'rare': 10, 'epic': 20, 
            'legendary': 40, 'mythic': 80, 'god': 200
        }[u.rarity.toLowerCase()] || 0;
        
        let basePower = (effectiveLen * 2) + rarityBonus;
        
        // HP is higher base
        if (type === 'hp') val = basePower * 5;
        // ATK is lower base
        if (type === 'atk') val = basePower;
        
        // Apply modifiers (Combos)
        if (type === 'atk' && u.atkModifier) val = Math.floor(val * u.atkModifier);
        if (type === 'hp' && u.hpModifier) val = Math.floor(val * u.hpModifier);
        
        return Math.floor(val);
    };
    this.getStat = getStat;

    this.pTeam = playerTeam.filter(u => u !== null);
    this.eTeam = enemyTeam.filter(u => u !== null);
    
    // Normalize tags/types
    const normalize = (team) => {
        team.forEach(u => {
            if (!u.tags) u.tags = [];
            if (typeof u.tags === 'string') u.tags = [u.tags];
        });
    };
    normalize(this.pTeam);
    normalize(this.eTeam);

    this.pIndex = 0;
    this.eIndex = 0;
    this.active = true;
    this.logs = [];
    
    // Initialize HP
    this.pTeam.forEach(u => u.maxHp = u.currentHp = getStat(u, 'hp'));
    this.eTeam.forEach(u => u.maxHp = u.currentHp = getStat(u, 'hp'));
    
    // Check Combos & Synergies
    this.checkCombos();
    this.checkTypeSynergies();
  }
  
  checkTypeSynergies() {
      // Extended Type Synergies for various parts of speech
      const counts = {};
      
      this.pTeam.forEach(u => {
          u.tags.forEach(t => {
              const lower = t.toLowerCase();
              counts[lower] = (counts[lower] || 0) + 1;
          });
      });
      
      const applySynergy = (type, name, desc, effect) => {
          if (counts[type] >= 3) {
              this.logMsg(`TYPE SYNERGY: ${name}! ${desc}`);
              effect(this.pTeam);
          }
      };

      // Noun: +20% HP
      applySynergy('noun', 'Noun Wall', '+20% HP', (team) => {
          team.forEach(u => {
              const boost = Math.floor(u.maxHp * 0.2);
              u.maxHp += boost;
              u.currentHp += boost;
          });
      });

      // Verb: +15% ATK
      applySynergy('verb', 'Verb Action', '+15% ATK', (team) => {
          team.forEach(u => {
              u.atkModifier = (u.atkModifier || 1) * 1.15;
          });
      });

      // Adjective: +20% Crit Chance
      applySynergy('adjective', 'Descriptive', '+20% Crit Chance', (team) => {
          team.forEach(u => {
              u.critChance = (u.critChance || 0) + 0.2;
          });
      });
      
      // Adverb: +10% Speed (Initiative/Evasion proxy) -> +10% Evasion
      applySynergy('adverb', 'Swiftly', '+10% Evasion', (team) => {
          team.forEach(u => {
              u.evasion = (u.evasion || 0) + 0.1;
          });
      });
      
      // Pronoun: +10% HP & +10% ATK (Balanced)
      applySynergy('pronoun', 'Identity', '+10% HP & ATK', (team) => {
          team.forEach(u => {
              const hpBoost = Math.floor(u.maxHp * 0.1);
              u.maxHp += hpBoost;
              u.currentHp += hpBoost;
              u.atkModifier = (u.atkModifier || 1) * 1.1;
          });
      });
      
      // Preposition: Start with shield (Temporary HP) -> +15% Temp HP
      applySynergy('preposition', 'Positional', '+15% Shield', (team) => {
          team.forEach(u => {
              u.currentHp += Math.floor(u.maxHp * 0.15); // Overheal mechanic
              // Note: maxHp stays same, so it's a shield that doesn't heal back up
          });
      });
      
      // Simplest: +15% Defense (Damage Reduction)
      applySynergy('conjunction', 'Connector', '-15% Damage Taken', (team) => {
          team.forEach(u => {
              u.dmgReduction = (u.dmgReduction || 0) + 0.15;
          });
      });
      
      // Interjection: Burst! First hit deals +50% damage
      applySynergy('interjection', 'Exclamation!', 'First Strike +50% DMG', (team) => {
          team.forEach(u => {
              u.firstStrikeBonus = 0.5;
          });
      });

      // Tech: Overclock (+10% Crit & Evasion)
      applySynergy('tech', 'Overclock', '+10% Crit & Evasion', (team) => {
          team.forEach(u => {
              u.critChance = (u.critChance || 0) + 0.1;
              u.evasion = (u.evasion || 0) + 0.1;
          });
      });

      // Bio: Adaptation (+20% HP)
      applySynergy('bio', 'Adaptation', '+20% HP', (team) => {
          team.forEach(u => {
              const boost = Math.floor(u.maxHp * 0.2);
              u.maxHp += boost;
              u.currentHp += boost;
          });
      });

      // Chem: Volatile (+15% Attack, -10% HP)
      applySynergy('chem', 'Volatile', '+15% ATK / -10% HP', (team) => {
          team.forEach(u => {
              u.atkModifier = (u.atkModifier || 1) * 1.15;
              u.currentHp = Math.floor(u.currentHp * 0.9);
          });
      });

      // Astro: Stardust (+10% HP, +10% Speed)
      applySynergy('astro', 'Stardust', '+10% HP & Speed', (team) => {
          team.forEach(u => {
               const boost = Math.floor(u.maxHp * 0.1);
               u.maxHp += boost;
               u.currentHp += boost;
               // Speed proxy
               u.evasion = (u.evasion || 0) + 0.05;
          });
      });
  }
  
  checkCombos() {
      const pWords = this.pTeam.map(u => u.word.toLowerCase());
      // Access safe global combos or empty array
      const combos = window.COMBOS || [];
      combos.forEach(combo => {
          // Check if all combo words exist in player team
          const hasAll = combo.words.every(w => pWords.includes(w));
          if (hasAll) {
              if(combo.effect) combo.effect(this);
          }
      });
  }
  
  start() {
    this.renderLayout();
    
    // Intro Animation Sequence
    this.playIntroSequence(() => {
        this.logMsg(t('battleStart'));
        setTimeout(() => this.nextTurn(), 1000);
    });
  }
  
  playIntroSequence(onComplete) {
      const container = document.getElementById('battleContainer');
      
      const playerSeed = (currentUserProfile && currentUserProfile.avatar_seed) ? currentUserProfile.avatar_seed : (currentUserProfile?.id || 'player');
      const enemySeed = this.metadata.enemySeed || this.metadata.enemyId || 'bot';

      // Create Intro Overlay
      const intro = document.createElement('div');
      intro.className = 'battle-intro-overlay';
      intro.innerHTML = `
        <div class="intro-content">
            <div class="intro-text">${t('battleFoeAppeared') || 'A new challenger approaches!'}</div>
            <div class="intro-cards">
                <div class="intro-card player slide-in-left">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${playerSeed}" class="intro-avatar">
                    <div class="intro-name">${escapeHtml(currentUserProfile?.username || 'You')}</div>
                    <div class="intro-power">Power: ${this.pTeam.reduce((a,b) => a + (window.calculatePower ? window.calculatePower(b):0), 0)}</div>
                </div>
                <div class="intro-vs">VS</div>
                <div class="intro-card enemy slide-in-right">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${enemySeed}" class="intro-avatar">
                    <div class="intro-name">${escapeHtml(this.metadata.enemyName || (this.metadata.isBot ? 'Wild Bot' : 'Opponent'))}</div>
                    <div class="intro-power">Power: ${this.metadata.enemyPower || '?'}</div>
                </div>
            </div>
        </div>
      `;
      container.appendChild(intro);
      
      // Animation timing
      setTimeout(() => {
          intro.classList.add('fade-out');
          setTimeout(() => {
              intro.remove();
              onComplete();
          }, 800); // Wait for fade out
      }, 2500); // Display duration
  }
  
  renderLayout() {
    const container = document.getElementById('battleContainer');
    const playerSeed = (currentUserProfile && currentUserProfile.avatar_seed) ? currentUserProfile.avatar_seed : (currentUserProfile?.id || 'player');
    const enemySeed = this.metadata.enemySeed || this.metadata.enemyId || 'bot';
    
    container.innerHTML = `
      <div class="battle-header">
        <button id="exitBattleBtn" style="background:none;border:none;cursor:pointer;">${t('battleRun')}</button>
        <span id="battleStatus">${t('battleVS')}</span>
        <button id="dlLogBtn" style="display:none; background:#eee; border:1px solid #ccc; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-left:auto;">Save Log</button>
      </div>
      <div class="battle-field">
        <div class="battle-profile-icon enemy" id="enemyProfileIcon">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${enemySeed}">
        </div>
        <div class="battle-profile-icon player" id="playerProfileIcon">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${playerSeed}">
        </div>
        
        <!-- Emote Button -->
        <button id="emoteBtn" class="emote-fab">💬</button>
        <div id="emoteMenu" class="emote-menu" style="display:none;">
            <button class="emote-opt">👋</button>
            <button class="emote-opt">😂</button>
            <button class="emote-opt">😡</button>
            <button class="emote-opt">😱</button>
            <button class="emote-opt">😎</button>
            <button class="emote-opt">🏳️</button>
        </div>
      
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
      <div id="endBattleControls" style="display:none; justify-content:center; margin-top:8px;">
          <button id="ggBtn" class="gg-btn">GG</button>
      </div>
    `;
    
    document.getElementById('exitBattleBtn').onclick = () => this.endBattle(false);
    const dlBtn = document.getElementById('dlLogBtn');
    if(dlBtn) dlBtn.onclick = () => this.downloadLog();
    
    document.getElementById('playerProfileIcon').onclick = () => this.showMiniProfile(true);
    document.getElementById('enemyProfileIcon').onclick = () => this.showMiniProfile(false);
    
    // Emote Logic
    const emoteBtn = document.getElementById('emoteBtn');
    const emoteMenu = document.getElementById('emoteMenu');
    emoteBtn.onclick = (e) => {
        e.stopPropagation();
        emoteMenu.style.display = emoteMenu.style.display === 'none' ? 'flex' : 'none';
    };
    
    document.querySelectorAll('.emote-opt').forEach(btn => {
        btn.onclick = () => {
            this.showEmote(true, btn.textContent);
            emoteMenu.style.display = 'none';
        };
    });
    
    // GG Button Logic
    document.getElementById('ggBtn').onclick = () => {
        this.logMsg(`${currentUserProfile?.username || 'Player'} says: Good Game!`);
        document.getElementById('ggBtn').disabled = true;
        document.getElementById('ggBtn').textContent = "Sent!";
        this.showEmote(true, "🤝");
        // TODO: Send to server if online
    };
  }
  
  showEmote(isPlayer, emoji) {
      const parent = isPlayer ? document.getElementById('playerSide') : document.getElementById('enemySide');
      if(!parent) return;
      
      const bubble = document.createElement('div');
      bubble.className = 'emote-bubble';
      bubble.textContent = emoji;
      
      // Position relative to side
      bubble.style.position = 'absolute';
      bubble.style.top = '-40px';
      bubble.style.left = isPlayer ? '20px' : 'auto';
      bubble.style.right = isPlayer ? 'auto' : '20px';
      
      parent.appendChild(bubble);
      
      setTimeout(() => {
          bubble.style.opacity = '0';
          bubble.style.transform = 'translateY(-20px)';
          setTimeout(() => bubble.remove(), 500);
      }, 2000);
  }
  
  showMiniProfile(isPlayer) {
      // Remove existing mini modals
      const existing = document.querySelectorAll('.mini-profile-modal');
      existing.forEach(e => e.remove());
      
      const container = document.getElementById('battleContainer');
      const modal = document.createElement('div');
      modal.className = 'mini-profile-modal visible';
      
      let name, rating, wins, losses, id;
      
      if (isPlayer) {
          name = currentUserProfile ? currentUserProfile.username : 'You';
          rating = currentUserProfile ? currentUserProfile.rating : 0;
          wins = currentUserProfile ? currentUserProfile.wins : 0;
          losses = currentUserProfile ? currentUserProfile.losses : 0;
          id = currentUserProfile ? currentUserProfile.id : 'unknown';
          
          modal.style.bottom = '60px';
          modal.style.left = '10px';
      } else {
          name = this.metadata.enemyName || (this.metadata.isBot ? 'Wild Bot' : 'Opponent');
          rating = this.metadata.enemyRating || 1000;
          // We might not have wins/losses for enemy in metadata, unless fetched
          wins = '?';
          losses = '?';
          
          modal.style.top = '60px';
          modal.style.right = '10px';
      }
      
      modal.innerHTML = `
        <h4>${escapeHtml(name)}</h4>
        <p>Rating: <strong>${rating}</strong></p>
        ${isPlayer ? `<p style="font-size:10px">W: ${wins} / L: ${losses}</p>` : ''}
        ${this.metadata.isBot && !isPlayer ? '<p style="font-size:10px; font-style:italic;">AI Trainer</p>' : ''}
        <button style="margin-top:8px; width:100%; border:1px solid #ddd; background:#f9f9f9; cursor:pointer;">Close</button>
      `;
      
      modal.querySelector('button').onclick = () => modal.remove();
      
      // Auto close on outside click?
      // Simple timeout for now
      setTimeout(() => {
          if(modal.parentNode) modal.remove();
      }, 5000);
      
      container.appendChild(modal);
  }
  
  updateUI() {
    if (!this.active) return;
    
    const VALID_TYPES = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];

    // Update Enemy
    if (this.eIndex < this.eTeam.length) {
        const enemy = this.eTeam[this.eIndex];
        const eSprite = document.getElementById('enemySprite');
        // Restore full word display (Tags hidden)
        eSprite.innerHTML = `${enemy.word}`;
        
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
        // Restore full word display (Tags hidden)
        pSprite.innerHTML = `${player.word}`;
        
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
                    
                    const playerUnit = this.pTeam[this.pIndex];
                    if (playerUnit.currentHp <= 0) {
                        // Check Revive Combo
                        if (this.metadata.hasRevive && Math.random() < 0.5) {
                            this.logMsg(` ${playerUnit.word} resurrected by Quintuplet power!`);
                            playerUnit.currentHp = 1;
                            // Disable revive after use? Or keep it? "If one dies" usually implies per unit or once.
                            // Let's keep it simple: 50% chance always.
                        }
                    }

                    if (playerUnit.currentHp <= 0) {
                        this.logMsg(t('battleFainted', { word: playerUnit.word }));
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
    // Use instance getStat which includes modifiers
    let damage = this.getStat(attacker, 'atk');
    let extraMsg = '';
    
    // First Strike Bonus (Interjection)
    if (attacker.firstStrikeBonus && !attacker.hasAttacked) {
        damage = Math.floor(damage * (1 + attacker.firstStrikeBonus));
        attacker.hasAttacked = true;
        extraMsg += ' (BURST!)';
    }
    
    // Critical Hit Check (Adjective Synergy)
    if (attacker.critChance && Math.random() < attacker.critChance) {
        damage = Math.floor(damage * 1.5);
        extraMsg += ' (CRITICAL!)';
    }
    
    // Evasion Check (Adverb)
    if (defender.evasion && Math.random() < defender.evasion) {
        this.logMsg(t('battleAttacks', { attacker: attacker.word, damage: 0 }) + " (MISSED!)");
        callback();
        return;
    }
    
    // Damage Reduction (Conjunction)
    if (defender.dmgReduction) {
        damage = Math.floor(damage * (1 - defender.dmgReduction));
    }
    
    // Random variance 0.8 - 1.2
    const variance = (Math.random() * 0.4) + 0.8;
    const finalDamage = Math.floor(damage * variance);
    
    setTimeout(() => {
        defender.currentHp = Math.max(0, defender.currentHp - finalDamage);
        this.logMsg(t('battleAttacks', { attacker: attacker.word, damage: finalDamage }) + extraMsg);
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
            
            // Record History
            supabaseClient.from('battle_history').insert({
                user_id: currentUserProfile.id,
                opponent_id: this.metadata.isBot ? null : this.metadata.enemyId,
                opponent_name: this.metadata.enemyName || (this.metadata.isBot ? 'Wild Bot' : 'Opponent'),
                opponent_avatar: this.metadata.enemySeed || this.metadata.enemyId || 'bot',
                result: win ? 'win' : 'loss',
                rating_change: change,
                player_team: this.pTeam.map(u => ({ word: u.word, rarity: u.rarity })),
                opponent_team: this.eTeam.map(u => ({ word: u.word, rarity: u.rarity }))
            }).then(({error}) => {
                if(error) console.error("History insert error:", error);
            });
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
    
    const endControls = document.getElementById('endBattleControls');
    if(endControls) endControls.style.display = 'flex';
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
                <button class="quiz-btn" id="btnBackLogin">${t('battleBack')}</button>
            </div>
        `;
        document.getElementById('btnBackLogin').onclick = () => switchTab('dex');
        return; 
    }
    
    const pTeam = currentTeam.filter(w => w);
    if (pTeam.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p>${t('profileTeamReq')}</p>
                <button class="quiz-btn" id="btnBackTeam">${t('battleBack')}</button>
            </div>
        `;
        document.getElementById('btnBackTeam').onclick = () => switchTab('dex');
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
                let opponentName = 'Unknown';
                let opponentSeed = randomOpponent.user_id;

                try {
                    const { data: oppProfile } = await supabaseClient
                        .from('profiles')
                        .select('rating, username, avatar_seed') // Fetch username too
                        .eq('id', randomOpponent.user_id)
                        .single();
                    if (oppProfile) {
                        opponentRating = oppProfile.rating || 1000;
                        opponentName = oppProfile.username || 'Unknown';
                        opponentSeed = oppProfile.avatar_seed || randomOpponent.user_id;
                    }
                } catch(e) { console.error("Error fetching opponent rating", e); }

                initiateBattle(randomOpponent.team_data, {
                    isBot: false,
                    enemyRating: opponentRating,
                    enemyPower: randomOpponent.team_power,
                    enemyId: randomOpponent.user_id, // For ID
                    enemySeed: opponentSeed, // For Avatar
                    enemyName: opponentName
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
          let opponentName = 'Friend';
          let opponentSeed = data.user_id;

          try {
               const { data: oppProfile } = await supabaseClient
                   .from('profiles')
                   .select('rating, username, avatar_seed')
                   .eq('id', data.user_id)
                   .single();
               if (oppProfile) {
                   opponentRating = oppProfile.rating || 1000;
                   opponentName = oppProfile.username || 'Friend';
                   opponentSeed = oppProfile.avatar_seed || data.user_id;
               }
          } catch(e) {}

         initiateBattle(data.team_data, {
             isBot: false,
             enemyRating: opponentRating,
             enemyPower: data.team_power || 0,
             enemyId: data.user_id,
             enemySeed: opponentSeed,
             enemyName: opponentName
         });
     } else {
         alert(t('battleFriendNotFound'));
     }
}

function startBotBattle() {
    // Bot Team Generation with Deployment Point (DP) System
    // DP Cap: 5
    // Costs: Common/Uncommon = 1, Rare/Epic = 2, Legendary/Mythic/God = 3
    
    const BOT_DP_CAP = 7; // Cost Cap
    const BOT_TEAM_SIZE = 5; // Unit Cap
    
    const COST_TABLE = {
        common: 1, uncommon: 1,
        rare: 2, epic: 2,
        legendary: 3, mythic: 3, god: 3
    };

    // Expanded Bot Word Pool
    const botWordPool = [
        // Common (Cost 1)
        {word: "The", rarity: "common"}, {word: "Time", rarity: "common"}, {word: "Way", rarity: "common"},
        {word: "Water", rarity: "common"}, {word: "Sound", rarity: "common"}, {word: "People", rarity: "common"},
        {word: "Light", rarity: "common"}, {word: "Run", rarity: "common"}, {word: "Play", rarity: "common"},
        {word: "Code", rarity: "common"}, {word: "Data", rarity: "common"}, {word: "User", rarity: "common"},
        // Uncommon (Cost 1)
        {word: "System", rarity: "uncommon"}, {word: "Theory", rarity: "uncommon"}, {word: "Method", rarity: "uncommon"},
        {word: "Action", rarity: "uncommon"}, {word: "Public", rarity: "uncommon"}, {word: "Human", rarity: "uncommon"},
        {word: "Nature", rarity: "uncommon"}, {word: "Design", rarity: "uncommon"}, {word: "Energy", rarity: "uncommon"},
        // Rare (Cost 2)
        {word: "Matrix", rarity: "rare"}, {word: "Vector", rarity: "rare"}, {word: "Quantum", rarity: "rare"},
        {word: "Neural", rarity: "rare"}, {word: "Syntax", rarity: "rare"}, {word: "Cipher", rarity: "rare"},
        {word: "Galaxy", rarity: "rare"}, {word: "Void", rarity: "rare"}, {word: "Abyss", rarity: "rare"},
        // Epic (Cost 2)
        {word: "Chaos", rarity: "epic"}, {word: "Aether", rarity: "epic"}, {word: "Nexus", rarity: "epic"},
        {word: "Omen", rarity: "epic"}, {word: "Vortex", rarity: "epic"}, {word: "Flux", rarity: "epic"},
        {word: "Glitch", rarity: "epic"}, {word: "Error", rarity: "epic"}, {word: "Null", rarity: "epic"},
        // Legendary (Cost 3)
        {word: "Paradox", rarity: "legendary"}, {word: "Enigma", rarity: "legendary"}, {word: "Mirage", rarity: "legendary"},
        {word: "Oracle", rarity: "legendary"}, {word: "Cosmos", rarity: "legendary"}, {word: "Zenith", rarity: "legendary"},
        // Mythic (Cost 3)
        {word: "Entropy", rarity: "mythic"}, {word: "Singularity", rarity: "mythic"}, {word: "Infinity", rarity: "mythic"},
        {word: "Eternity", rarity: "mythic"}, {word: "Oblivion", rarity: "mythic"}, {word: "Genesis", rarity: "mythic"}
    ];

    const botTeam = [];
    let currentCost = 0;
    
    // Shuffle pool
    const shuffled = [...botWordPool].sort(() => 0.5 - Math.random());
    
    // Greedy fill: Try to add high value units first, or just random?
    // Random is better for variety.
    
    for (const candidate of shuffled) {
        if (botTeam.length >= BOT_TEAM_SIZE) break;
        
        const cost = COST_TABLE[candidate.rarity] || 1;
        
        if (currentCost + cost <= BOT_DP_CAP) {
            // Add clone of word
            botTeam.push({ ...candidate });
            currentCost += cost;
        }
    }
    
    // If team is very small (e.g. 1 mythic), try to fill remaining slots with cheap units if possible
    // (Our loop above already tries every word in the shuffled list, so if there were Commons available that fit, they would be added.
    // Assuming the pool has enough Commons, this should fill up reasonably well.)

    initiateBattle(botTeam, { 
        isBot: true, 
        enemyPower: botTeam.reduce((acc, w) => acc + (window.calculatePower ? window.calculatePower(w) : 0), 0),
        enemyId: 'bot_' + Math.random(), // Random seed for bot avatar
        enemyName: 'Wild Bot'
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
