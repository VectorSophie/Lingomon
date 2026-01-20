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
    authBtn.onclick = () => switchTab('profile'); // Use global switchTab
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

async function showProfile(isOverlay = true) {
  // If called directly (legacy or overlay mode), we might want to manually hide things,
  // but if called via switchTab, switchTab already hides things.
  // However, switchTab calls showProfile.
  // Let's rely on switchTab to handle visibility of other containers.
  // We just ensure profileContainer is visible.
  
  const container = document.getElementById('profileContainer');
  // Just in case we are in overlay mode or direct call:
  // But strictly, switchTab handles hiding.
  // We should NOT hide everything here if we assume switchTab did it.
  // But for safety, let's keep it or refactor.
  
  // Refactor: Rely on switchTab logic primarily.
  // If we want to force "Tab Mode", we assume container visibility is handled.
  // But let's check if we need to fetch data.
  
  // NOTE: switchTab logic in popup.js sets display='none' for others.
  // So here we just set display='block'.
  container.style.display = 'block';
  
  // Show loading only if empty? Or always refresh?
  if (!container.innerHTML.includes('profile-avatar')) {
      container.innerHTML = `<p>${t('profileLoading')}</p>`;
  }

  const profile = await getProfile();
  if (!profile) {
    container.innerHTML = `<p>${t('profileError')}</p>`; // Removed back button since it's a tab now
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
  switchTab('dex'); 
}

function renderProfileUI(profile) {
  const container = document.getElementById('profileContainer');
  
  // Tab State
  let activeTab = 'overview'; // 'overview' or 'friends'

  const render = () => {
      const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.avatar_seed || profile.id}`;
      
      container.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <button class="profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}" id="tabOverview">${t('profileOverview')}</button>
            <button class="profile-tab-btn ${activeTab === 'friends' ? 'active' : ''}" id="tabFriends">${t('profileFriends')}</button>
        </div>

        <!-- Overview Tab -->
        <div id="viewOverview" style="display:${activeTab === 'overview' ? 'block' : 'none'}">
            <img src="${avatarUrl}" class="profile-avatar" alt="Avatar">
            <div style="margin-top:-10px; margin-bottom:10px;">
                <span style="font-size:10px; color:#666; background:#f0f0f0; padding:2px 8px; border-radius:10px; border:1px solid #e0e0e0;">${profile.title || t('Rookie Trainer')}</span>
                <button id="btnCustomize" style="font-size:10px; background:none; border:none; cursor:pointer; text-decoration:underline; color:#666; margin-left:4px;">${t('editProfile')}</button>
            </div>
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
        </div>

        <!-- Friends Tab -->
        <div id="viewFriends" style="display:${activeTab === 'friends' ? 'block' : 'none'}">
            <div class="friend-add-row">
                <input type="text" id="friendSearchInput" placeholder="${t('friendPlaceholder')}" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button id="addFriendBtn" style="padding:8px 12px; background:#000; color:#fff; border:none; border-radius:4px; cursor:pointer;">${t('friendAdd')}</button>
            </div>
            <div id="friendList" class="friend-list">
                <p style="color:#666; font-size:12px; margin-top:20px;">${t('profileLoading')}</p>
            </div>
        </div>

        <button class="back-btn">${t('profileBack')}</button>
      `;

      // Event Listeners
      container.querySelector('.back-btn').onclick = closeProfile;
      
      // Tabs
      container.querySelector('#tabOverview').onclick = () => { activeTab = 'overview'; render(); };
      container.querySelector('#tabFriends').onclick = () => { activeTab = 'friends'; render(); fetchFriends(); };

      if (activeTab === 'overview') {
          container.querySelector('#btnCustomize').onclick = openCustomize;
          container.querySelector('#saveTeamBtn').onclick = saveTeam;
          const nameInput = container.querySelector('.profile-name-input');
          nameInput.onchange = async (e) => {
            const newName = e.target.value.trim();
            if (newName) {
               await supabaseClient.from('profiles').update({ username: newName }).eq('id', profile.id);
            }
          };
          fetchTeam(profile.id);
      } else {
          container.querySelector('#addFriendBtn').onclick = () => addFriend();
      }
  };

  render();
}

async function fetchFriends() {
    const list = document.getElementById('friendList');
    if (!list || !supabaseClient || !currentUserProfile) return;
    
    // Fetch friendships where user is sender OR receiver
    const { data, error } = await supabaseClient
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${currentUserProfile.id},friend_id.eq.${currentUserProfile.id}`);
        
    if (error) {
        list.innerHTML = `<p style="color:red">Error fetching friends</p>`;
        return;
    }
    
    list.innerHTML = '';
    
    if (data.length === 0) {
        list.innerHTML = `<p style="color:#999; font-style:italic; margin-top:20px;">No friends yet. Add someone!</p>`;
        return;
    }
    
    // Separate requests and friends
    const friends = [];
    const requests = []; // Received
    const pending = []; // Sent
    
    // We need to fetch profile details for the *other* person
    const otherIds = data.map(f => f.user_id === currentUserProfile.id ? f.friend_id : f.user_id);
    
    const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, username, rating')
        .in('id', otherIds);
        
    const profileMap = {};
    if (profiles) profiles.forEach(p => profileMap[p.id] = p);
    
    data.forEach(f => {
        const isSender = f.user_id === currentUserProfile.id;
        const otherId = isSender ? f.friend_id : f.user_id;
        const otherProfile = profileMap[otherId] || { username: 'Unknown', id: otherId };
        
        if (f.status === 'accepted') {
            friends.push({ ...f, other: otherProfile });
        } else if (f.status === 'pending') {
            if (isSender) pending.push({ ...f, other: otherProfile });
            else requests.push({ ...f, other: otherProfile });
        }
    });
    
    // Render Requests
    if (requests.length > 0) {
        const reqHeader = document.createElement('div');
        reqHeader.innerHTML = `<strong>${t('friendRequests')}</strong>`;
        reqHeader.style.marginBottom = '8px';
        reqHeader.style.textAlign = 'left';
        list.appendChild(reqHeader);
        
        requests.forEach(req => {
            const el = document.createElement('div');
            el.className = 'friend-item request';
            el.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${req.other.id}" style="width:24px; height:24px; border-radius:50%;">
                    <span>${escapeHtml(req.other.username)}</span>
                </div>
                <div>
                    <button class="accept-btn">✔</button>
                    <button class="reject-btn">✕</button>
                </div>
            `;
            el.querySelector('.accept-btn').onclick = () => respondFriend(req.id, true);
            el.querySelector('.reject-btn').onclick = () => respondFriend(req.id, false);
            list.appendChild(el);
        });
        
        list.appendChild(document.createElement('hr'));
    }
    
    // Render Friends
    friends.forEach(f => {
        const el = document.createElement('div');
        el.className = 'friend-item';
        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${f.other.id}" style="width:32px; height:32px; border-radius:50%; border:1px solid #ccc;">
                <div style="text-align:left;">
                    <div style="font-weight:bold; font-size:12px;">${escapeHtml(f.other.username)}</div>
                    <div style="font-size:10px; color:#666;">${t('profileRating')}: ${f.other.rating || 0}</div>
                </div>
            </div>
            <button class="challenge-btn">⚔️ ${t('battleChallenge')}</button>
        `;
        el.querySelector('.challenge-btn').onclick = () => {
            closeProfile();
            startFriendBattle(f.other.id);
        };
        list.appendChild(el);
    });
    
    // Render Pending
    if (pending.length > 0) {
        const penHeader = document.createElement('div');
        penHeader.innerHTML = `<br><strong>${t('friendPending')}</strong>`;
        penHeader.style.fontSize = '11px';
        penHeader.style.color = '#999';
        penHeader.style.textAlign = 'left';
        list.appendChild(penHeader);
        
        pending.forEach(p => {
            const el = document.createElement('div');
            el.className = 'friend-item pending';
            el.innerHTML = `
                <span style="color:#999;">${escapeHtml(p.other.username)}</span>
                <span style="font-size:10px; color:#999;">${t('friendWaiting')}</span>
            `;
            list.appendChild(el);
        });
    }
}

async function addFriend() {
    const input = document.getElementById('friendSearchInput');
    const username = input.value.trim();
    if (!username) return;
    
    // Find user by username
    const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .limit(1);
        
    if (!users || users.length === 0) {
        alert(t('friendNotFound'));
        return;
    }
    
    const targetId = users[0].id;
    if (targetId === currentUserProfile.id) {
        alert(t('friendSelf'));
        return;
    }
    
    // Check existing
    const { data: existing } = await supabaseClient
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserProfile.id},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${currentUserProfile.id})`);
        
    if (existing && existing.length > 0) {
        alert(t('friendExists'));
        return;
    }
    
    // Insert
    const { error: insertError } = await supabaseClient
        .from('friendships')
        .insert({ user_id: currentUserProfile.id, friend_id: targetId, status: 'pending' });
        
    if (insertError) {
        alert(t('requestError'));
        console.error(insertError);
    } else {
        alert(t('requestSent'));
        input.value = '';
        fetchFriends();
    }
}

async function respondFriend(friendshipId, accept) {
    if (accept) {
        await supabaseClient.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    } else {
        await supabaseClient.from('friendships').delete().eq('id', friendshipId);
    }
    fetchFriends();
}

// Customization
const UNLOCKABLES = {
    titles: [
        { id: 'Rookie Trainer', req: 'Default' },
        { id: 'Word Collector', req: 'Collect 10 words', check: (p, a, s) => p.total_words >= 10 },
        { id: 'Mythic Hunter', req: 'Catch a Mythic', check: (p, a, s) => a.mythic > 0 },
        { id: 'Streak Master', req: '7 Day Streak', check: (p, a, s) => s.longestStreak >= 7 },
        { id: 'Battler', req: 'Win 5 Battles', check: (p, a, s) => p.wins >= 5 },
        { id: 'Legendary Hero', req: 'Catch 5 Legendaries', check: (p, a, s) => a.legendary >= 5 }
    ],
    avatars: [
        { id: 'default', req: 'Default' },
        { id: 'pixel', req: 'Collect 50 words', check: (p, a, s) => p.total_words >= 50 },
        { id: 'bot', req: 'Win 10 Battles', check: (p, a, s) => p.wins >= 10 },
        { id: 'smile', req: 'Catch an Epic', check: (p, a, s) => a.epic > 0 }
    ]
};

function openCustomize() {
    const modal = document.getElementById('customizeModal');
    const titleList = document.getElementById('titleList');
    const avatarList = document.getElementById('avatarList');
    modal.style.display = 'flex';
    
    // Update Modal Title if needed
    modal.querySelector('h3').textContent = t('editProfile');
    modal.querySelectorAll('h4')[0].textContent = t('custTitle');
    modal.querySelectorAll('h4')[1].textContent = t('custAvatar');
    
    chrome.storage.local.get(['achievements', 'streakData'], (data) => {
        const achievements = data.achievements || {};
        const streakData = data.streakData || {};
        const profile = currentUserProfile;
        
        titleList.innerHTML = '';
        UNLOCKABLES.titles.forEach(item => {
            const unlocked = !item.check || item.check(profile, achievements, streakData);
            const el = document.createElement('div');
            el.className = `title-option ${unlocked ? '' : 'locked-item'} ${profile.title === item.id ? 'selected' : ''}`;
            el.textContent = item.id;
            el.title = item.req;
            if (unlocked) {
                el.onclick = () => {
                    profile.title = item.id;
                    updateProfileCosmetics();
                    openCustomize();
                };
            }
            titleList.appendChild(el);
        });
        
        avatarList.innerHTML = '';
        UNLOCKABLES.avatars.forEach(item => {
            const unlocked = !item.check || item.check(profile, achievements, streakData);
            const seed = item.id === 'default' ? profile.id : `${profile.id}_${item.id}`;
            const el = document.createElement('img');
            el.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
            el.className = `avatar-option ${unlocked ? '' : 'locked-item'} ${profile.avatar_seed === seed ? 'selected' : ''}`;
            el.title = item.req;
            
            if (unlocked) {
                el.onclick = () => {
                    profile.avatar_seed = seed;
                    updateProfileCosmetics();
                    openCustomize();
                };
            }
            avatarList.appendChild(el);
        });
    });
    
    document.getElementById('closeCustomize').onclick = () => {
        modal.style.display = 'none';
        showProfile();
    };
}

async function updateProfileCosmetics() {
    if (!currentUserProfile || !supabaseClient) return;
    await supabaseClient.from('profiles').update({
        title: currentUserProfile.title,
        avatar_seed: currentUserProfile.avatar_seed
    }).eq('id', currentUserProfile.id);
}

// Team Logic
const TEAM_CAPACITY = 5;

const COST_TABLE = {
  mythic: 3,
  legendary: 3,
  epic: 2,
  rare: 2,
  uncommon: 1,
  common: 1,
  god: 3
};

function getWordCost(rarity) {
    return COST_TABLE[rarity] || 1;
}

function calculateTeamCost(team) {
    return team.reduce((acc, member) => {
        if (!member) return acc;
        return acc + getWordCost(member.rarity);
    }, 0);
}

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

const VALID_TYPES = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];

function getTagsDisplay(wordData) {
    if (!wordData.tags || !Array.isArray(wordData.tags)) return '';
    return wordData.tags
        .filter(tag => VALID_TYPES.includes(tag.toLowerCase()))
        .map(tag => {
            const lower = tag.toLowerCase();
            if (lower === 'noun') return t('type_n');
            if (lower === 'verb') return t('type_v');
            if (lower === 'adjective') return t('type_adj');
            if (lower === 'adverb') return t('type_adv');
            if (lower === 'pronoun') return t('type_p');
            if (lower === 'preposition') return t('type_pre');
            if (lower === 'conjunction') return t('type_conj');
            if (lower === 'interjection') return t('type_interj');
            return tag;
        })
        .join(',');
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
    
    // Enrich with local Dex data to get tags
    chrome.storage.local.get(['wordDex'], (localData) => {
        const dex = localData.wordDex || {};
        currentTeam = currentTeam.map(member => {
            if (!member) return null;
            // If the team member has no tags, try to find them in local dex
            if (!member.tags && dex[member.word]) {
                return { ...member, tags: dex[member.word].tags };
            }
            return member;
        });
        renderTeamUI();
    });
  } else {
    currentTeam = [null, null, null, null, null];
    renderTeamUI();
  }
}

function renderTeamUI() {
  const container = document.getElementById('teamUI');
  if (!container) return;
  
  container.innerHTML = '';
  let power = 0;
  let totalCost = calculateTeamCost(currentTeam);
  
  // Render Slots
  currentTeam.forEach((wordData, idx) => {
    const slot = document.createElement('div');
    slot.className = `team-slot ${wordData ? 'filled' : ''}`;
    slot.onclick = () => openTeamSelector(idx);
    
    // Visualize cost consumption (simple method: opacity or size?)
    // Let's just show cost number corner
    
    if (wordData) {
      const p = calculatePower(wordData);
      power += p;
      const cost = getWordCost(wordData.rarity);
      
      // ... existing rendering code ...
      if (wordData.rarity === 'god') {
        slot.style.borderWidth = '2px';
        slot.style.borderStyle = 'solid';
        slot.style.borderImage = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1';
        slot.innerHTML = `
          <div class="slot-word" style="background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">${wordData.word}</div>
          <div class="slot-tags" style="font-size:7px; color:#666; margin-top:-2px;">${getTagsDisplay(wordData)}</div>
          <div class="slot-stats-preview">P:${p}</div>
          <div class="slot-cost-badge">${cost}</div>
        `;
      } else {
        slot.style.borderColor = rarityScale[wordData.rarity] || '#ccc';
        slot.innerHTML = `
          <div class="slot-word">${wordData.word}</div>
          <div class="slot-tags" style="font-size:7px; color:#666; margin-top:-2px;">${getTagsDisplay(wordData)}</div>
          <div class="slot-stats-preview">P:${p}</div>
          <div class="slot-cost-badge">${cost}</div>
        `;
      }
    } else {
      slot.textContent = '+';
    }
    container.appendChild(slot);
  });
  
  // Update Header Info
  const powerLabel = document.getElementById('teamPower');
  if(powerLabel) {
      const costColor = totalCost > TEAM_CAPACITY ? 'red' : (totalCost === TEAM_CAPACITY ? 'orange' : '#666');
      powerLabel.innerHTML = `Power: ${power} <span style="margin-left:8px; color:${costColor}; font-weight:bold;">Slots: ${totalCost}/${TEAM_CAPACITY}</span>`;
  }
  
  // Validation for Save
  const saveBtn = document.getElementById('saveTeamBtn');
  if (totalCost > TEAM_CAPACITY) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Over Capacity!";
      saveBtn.style.background = "#ff4444";
  } else {
      saveBtn.disabled = false;
      saveBtn.textContent = t('profileSave'); // or restore original text
      saveBtn.style.background = "#000";
  }
  
  saveBtn.style.display = 'block';
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
  
  // Calculate current cost EXCLUDING the slot being edited
  const currentCost = currentTeam.reduce((acc, member, idx) => {
      if (!member || idx === editingSlot) return acc;
      return acc + getWordCost(member.rarity);
  }, 0);
  
  const remainingCap = TEAM_CAPACITY - currentCost;
  
  const header = document.createElement('div');
  header.style.padding = '8px';
  header.style.fontSize = '12px';
  header.style.color = '#666';
  header.style.background = '#f9f9f9';
  header.style.marginBottom = '8px';
  header.innerHTML = `Available Slots: <strong>${remainingCap}</strong>`;
  list.appendChild(header);

  const entries = Object.entries(dex).filter(([word, info]) => {
    if (info.rarity === 'god') return false; // Keep god banned for now or check? user said god=3
    // If we want to allow God: 
    // if (info.rarity === 'god') return true; 
    
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
    
    const cost = getWordCost(info.rarity);
    const canAfford = cost <= remainingCap;

    const item = document.createElement('div');
    item.className = 'mini-entry';
    
    if (isUsed) {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
      item.title = 'Already in team';
      item.style.background = '#eee'; 
    } else if (!canAfford) {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
      item.title = `Cost ${cost} exceeds remaining capacity (${remainingCap})`;
      // item.style.background = '#ffebee';
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
        <span style="font-size:10px; background:#eee; padding:2px 4px; border-radius:4px;" title="Cost">${cost}</span>
        ${rarityIndicator}
      </div>
      <div style="font-size:9px; color:#888; width:100%; margin-top:2px;">${getTagsDisplay(dummyWord)}</div>
    `;
    
    item.onclick = () => {
      if (isUsed) return;
      if (!canAfford) {
          alert(`This word costs ${cost} slots, but you only have ${remainingCap} left.`);
          return;
      }
      currentTeam[editingSlot] = { 
          word: word, 
          rarity: info.rarity,
          tags: info.tags // Store tags in team
      };
      renderTeamUI();
      document.getElementById('teamSelectorModal').style.display = 'none';
    };
    list.appendChild(item);
  });
}
