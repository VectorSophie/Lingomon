// profile.js - Handles User Profile, Auth, and Team Builder

window.rarityOrder = {
  mythic: 0,
  legendary: 1,
  epic: 2,
  rare: 3,
  uncommon: 4,
  common: 5
};

let currentUserProfile = null;
let currentTeam = [null, null, null, null, null];
let editingSlot = -1;
let supabaseClient = null;
let isAuthChecking = true;

function initSupabase() {
  if (typeof supabase !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
    try {
      supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
      console.log('Supabase client initialized');
      checkAuthState();
    } catch (e) {
      console.error('Failed to initialize Supabase:', e);
    }
  }
}

async function checkAuthState() {
  if (!supabaseClient) {
    isAuthChecking = false;
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session?.user) {
    // Fetch and cache profile immediately on startup
    const profile = await getProfile();
    if (profile) {
      currentUserProfile = profile;
      fetchTeam(profile.id); // Also pre-fetch team
    }
  }
  
  updateAuthUI(session?.user);
  isAuthChecking = false;
}

function updateAuthUI(user) {
  const container = document.querySelector('.header-container div');
  if (!container) return;

  const existingAuthBtn = document.getElementById('authBtn');
  if (existingAuthBtn) existingAuthBtn.remove();

  const authBtn = document.createElement('button');
  authBtn.id = 'authBtn';
  authBtn.style.marginLeft = '8px';
  
  if (user) {
    authBtn.className = 'dark-mode-toggle';
    authBtn.innerHTML = `
      <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}" style="width:16px;height:16px;margin-right:4px;vertical-align:middle;border-radius:50%;">
      Profile
    `;
    authBtn.title = `Logged in as ${user.email}`;
    authBtn.onclick = showProfile;
  } else {
    authBtn.className = 'google-btn';
    authBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:6px;vertical-align:middle;">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>Sign in
    `;
    authBtn.title = 'Login with Google';
    authBtn.onclick = loginWithGoogle;
  }

  container.appendChild(authBtn);
}

async function loginWithGoogle() {
  if (!supabaseClient) return;
  
  const redirectURL = chrome.identity.getRedirectURL();
  const authUrl = `${CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectURL)}`;
  
  console.log("Launching Manual WebAuthFlow:", authUrl);

  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, async (redirectUrl) => {
    console.log("WebAuthFlow callback url:", redirectUrl);
    if (chrome.runtime.lastError || !redirectUrl) {
      console.error('Auth flow failed:', chrome.runtime.lastError ? JSON.stringify(chrome.runtime.lastError) : 'No redirect URL');
      return;
    }
    
    // Parse the session from the URL
    const url = new URL(redirectUrl);
    const params = new URLSearchParams(url.hash.substring(1)); // remove #
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    
    console.log("Tokens received:", { access_token: !!access_token, refresh_token: !!refresh_token });

    if (access_token && refresh_token) {
      const { error } = await supabaseClient.auth.setSession({
        access_token,
        refresh_token
      });
      
      if (error) {
          console.error("Supabase setSession error:", error);
      } else {
          console.log("Session set successfully");
          checkAuthState();
      }
    } else {
        console.error("Missing tokens in redirect URL");
    }
  });
}

async function getProfile() {
  if (!supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') { // Not found
    // Create new profile
    const newProfile = {
      id: user.id,
      username: 'Trainer ' + user.id.slice(0, 4),
      avatar_id: 1,
      rating: 1000,
      wins: 0,
      losses: 0,
      total_words: 0
    };
    const { error: insertError } = await supabaseClient.from('profiles').insert([newProfile]);
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }
    return newProfile;
  }
  
  return data;
}

async function showProfile() {
  const mainContent = document.getElementById('mainContent');
  const quizContainer = document.getElementById('quizContainer');
  const searchBar = document.getElementById('searchBar');
  const controls = document.querySelector('.controls');
  const container = document.getElementById('profileContainer');
  const battleContainer = document.getElementById('battleContainer');
  
  if(mainContent) mainContent.style.display = 'none';
  if(quizContainer) quizContainer.style.display = 'none';
  if(searchBar) searchBar.style.display = 'none';
  if(controls) controls.style.display = 'none';
  if(battleContainer) battleContainer.style.display = 'none';
  
  container.style.display = 'block';
  container.innerHTML = `<p>${t('profileLoading')}</p>`;

  const profile = await getProfile();
  if (!profile) {
    container.innerHTML = `<p>${t('profileError')}</p><button class="back-btn">${t('profileBack')}</button>`;
    container.querySelector('.back-btn').onclick = closeProfile;
    return;
  }
  
  currentUserProfile = profile;
  
  // Sync local word count
  chrome.storage.local.get(['wordDex'], async (data) => {
    const count = Object.keys(data.wordDex || {}).length;
    if (profile && count !== profile.total_words) {
      await supabaseClient.from('profiles').update({ total_words: count }).eq('id', profile.id);
      profile.total_words = count;
    }
    renderProfileUI(profile);
  });
}

function closeProfile() {
  const container = document.getElementById('profileContainer');
  container.style.display = 'none';
  switchTab('dex'); // Use switchTab to reset view state correctly
}

function renderProfileUI(profile) {
  const container = document.getElementById('profileContainer');
  
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`;

  container.innerHTML = `
    <img src="${avatarUrl}" class="profile-avatar" alt="Avatar">
    <input type="text" class="profile-name-input" value="${escapeHtml(profile.username)}" maxlength="15" spellcheck="false">
    
    <div class="profile-stats">
      <div class="stat-item">
        <span class="stat-value">${profile.rating}</span>
        <span class="stat-label">${t('profileRating')}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" style="color:#a1ff96">${profile.wins}</span>
        <span class="stat-label">${t('profileWins')}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" style="color:#ff6969">${profile.losses}</span>
        <span class="stat-label">${t('profileLosses')}</span>
      </div>
    </div>
    
    <div class="profile-stats">
       <div class="stat-item">
        <span class="stat-value">${profile.total_words}</span>
        <span class="stat-label">${t('profileWords')}</span>
      </div>
    </div>

    <!-- Team Section -->
    <div class="team-section">
      <strong style="font-size:14px; display:block;">${t('profileTeam')}</strong>
      <span id="teamPower" style="font-size:11px; color:#666;">Power: 0</span>
      <div id="teamUI" class="team-container"></div>
      <button id="saveTeamBtn" class="save-team-btn" style="display:none;">${t('profileSave')}</button>
    </div>

    <button class="back-btn">${t('profileBack')}</button>
  `;

  // Event Listeners
  container.querySelector('.back-btn').onclick = closeProfile;
  container.querySelector('#saveTeamBtn').onclick = saveTeam;

  const nameInput = container.querySelector('.profile-name-input');
  nameInput.onchange = async (e) => {
    const newName = e.target.value.trim();
    if (newName) {
       await supabaseClient.from('profiles').update({ username: newName }).eq('id', profile.id);
    }
  };
  
  // Initialize Team
  fetchTeam(profile.id);
}

// Team Logic
function calculateStat(wordData, type) {
  if (!wordData) return 0;
  const len = wordData.word.length;
  const rarity = wordData.rarity;
  
  // Base multipliers
  const rarityMult = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3, mythic: 5, god: 10 };
  const rVal = rarityMult[rarity] || 1;

  switch(type) {
    case 'hp': return Math.floor(len * 10 * rVal); 
    case 'atk': return Math.floor((rVal * 20)); 
    case 'speed': return Math.floor(100 / len); 
    default: return 0;
  }
}

function calculatePower(wordData) {
  if(!wordData) return 0;
  return calculateStat(wordData, 'hp') + calculateStat(wordData, 'atk') + calculateStat(wordData, 'speed');
}

async function fetchTeam(userId) {
  if (!supabaseClient) return;
  const { data } = await supabaseClient
    .from('battle_teams')
    .select('team_data')
    .eq('user_id', userId)
    .single();
  
  if (data && data.team_data && Array.isArray(data.team_data)) {
    currentTeam = data.team_data;
    while(currentTeam.length < 5) currentTeam.push(null);
  } else {
    currentTeam = [null, null, null, null, null];
  }
  renderTeamUI();
}

function renderTeamUI() {
  const container = document.getElementById('teamUI');
  if (!container) return;
  
  container.innerHTML = '';
  let power = 0;
  
  currentTeam.forEach((wordData, idx) => {
    const slot = document.createElement('div');
    slot.className = `team-slot ${wordData ? 'filled' : ''}`;
    slot.onclick = () => openTeamSelector(idx);
    
    if (wordData) {
      const p = calculatePower(wordData);
      power += p;
      
      if (wordData.rarity === 'god') {
        slot.style.borderWidth = '2px';
        slot.style.borderStyle = 'solid';
        slot.style.borderImage = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1';
        slot.innerHTML = `
          <div class="slot-word" style="background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">${wordData.word}</div>
          <div class="slot-stats-preview">P:${p}</div>
        `;
      } else {
        slot.style.borderColor = rarityScale[wordData.rarity] || '#ccc';
        slot.innerHTML = `
          <div class="slot-word">${wordData.word}</div>
          <div class="slot-stats-preview">P:${p}</div>
        `;
      }
    } else {
      slot.textContent = '+';
    }
    container.appendChild(slot);
  });
  
  const powerLabel = document.getElementById('teamPower');
  if(powerLabel) powerLabel.textContent = `${t('profileTeam') || 'Team'} Power: ${power}`;
  
  document.getElementById('saveTeamBtn').style.display = 'block';
}

async function saveTeam() {
  if (!currentUserProfile || !supabaseClient) return;
  
  const saveBtn = document.getElementById('saveTeamBtn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = t('profileSaving');
  saveBtn.disabled = true;

  const power = currentTeam.reduce((acc, w) => acc + calculatePower(w), 0);
  
  const { error } = await supabaseClient
    .from('battle_teams')
    .upsert({ 
      user_id: currentUserProfile.id,
      team_data: currentTeam,
      team_power: power,
      updated_at: new Date()
    });
    
  if (error) {
    console.error('Save failed:', error);
    alert(t('profileSaveFail'));
  } else {
    saveBtn.textContent = t('profileSaved');
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  }
}

function openTeamSelector(idx) {
  editingSlot = idx;
  const modal = document.getElementById('teamSelectorModal');
  const searchInput = document.getElementById('miniSearch');
  modal.style.display = 'flex';
  searchInput.value = '';
  searchInput.focus();
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const dex = data.wordDex || {};
    renderMiniDex(dex);
    
    searchInput.oninput = (e) => {
      renderMiniDex(dex, e.target.value);
    };
  });
  
  const closeModal = document.getElementById('closeModal');
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  }
}

function renderMiniDex(dex, filter = '') {
  const list = document.getElementById('miniDexList');
  list.innerHTML = '';
  
  const entries = Object.entries(dex).filter(([word, info]) => {
    if (!filter) return true;
    return word.toLowerCase().includes(filter.toLowerCase());
  });
  
  entries.sort((a, b) => {
    const rA = rarityOrder[a[1].rarity] ?? 5;
    const rB = rarityOrder[b[1].rarity] ?? 5;
    return rA - rB;
  });
  
  const removeOpt = document.createElement('div');
  removeOpt.className = 'mini-entry';
  removeOpt.style.color = '#ff4444';
  removeOpt.innerHTML = `<span>(Empty Slot)</span>`;
  removeOpt.onclick = () => {
    currentTeam[editingSlot] = null;
    renderTeamUI();
    document.getElementById('teamSelectorModal').style.display = 'none';
  };
  list.appendChild(removeOpt);

  entries.forEach(([word, info]) => {
    const isUsed = currentTeam.some((member, idx) => 
      member && member.word === word && idx !== editingSlot
    );

    const item = document.createElement('div');
    item.className = 'mini-entry';
    if (isUsed) {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
      item.title = 'Already in team';
      item.style.background = '#eee'; 
    }

    const color = rarityScale[info.rarity] || '#000';
    const dummyWord = { word: word, rarity: info.rarity };
    const power = calculatePower(dummyWord);
    
    let rarityIndicator = `<span style="font-size:10px; color:${color}; font-weight:bold;">${info.rarity.toUpperCase().slice(0,1)}</span>`;
    
    if (info.rarity === 'god') {
        rarityIndicator = `<span style="font-size:10px; background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight:900;">G</span>`;
    }
    
    item.innerHTML = `
      <span>${word}</span>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:10px; color:#666">P:${power}</span>
        ${rarityIndicator}
      </div>
    `;
    
    item.onclick = () => {
      if (isUsed) return;
      currentTeam[editingSlot] = { word: word, rarity: info.rarity };
      renderTeamUI();
      document.getElementById('teamSelectorModal').style.display = 'none';
    };
    list.appendChild(item);
  });
}
