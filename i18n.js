// i18n.js - Internationalization module for Lingomon
// Supports English (en) and Korean (ko) languages

const translations = {
  en: {
    // Context Menu
    contextMenu: "Catch '%s'",

    // Main UI
    wordDex: "WordDex",
    darkMode: "Dark",
    lightMode: "Light",
    languageEN: "EN",
    languageKO: "KO",

    // Search & Controls
    searchPlaceholder: "Search words...",
    sortAlpha: "A-Z",
    sortRecent: "Recent",
    sortRarity: "Rarity",
    quiz: "Quiz",

    // Stats
    collectionStats: "Collection Stats",
    totalWords: "Total Words",
    streak: "Streak",
    longest: "Longest",
    day: "day",
    days: "days",

    // Rarities
    common: "common",
    uncommon: "uncommon",
    rare: "rare",
    epic: "epic",
    legendary: "legendary",
    mythic: "mythic",
    god: "GOD",

    // Rarity Labels (for display)
    COMMON: "COMMON",
    UNCOMMON: "UNCOMMON",
    RARE: "RARE",
    EPIC: "EPIC",
    LEGENDARY: "LEGENDARY",
    MYTHIC: "MYTHIC",
    GOD: "GOD",

    // Messages
    noWordsMessage: "No words collected yet. Right-click words on web pages to start collecting!",
    noSearchResults: "No words found matching your search.",
    deleteConfirm: "Delete \"{word}\" from your collection?",
    deleteButton: "delete",

    // Charts
    wordsCaughtLast7Days: "Words Caught (Last 7 Days)",
    rarityDistribution: "Rarity Distribution",

    // Badges
    achievements: "Achievements",
    hiddenBadges: "Hidden Badges",
    maxLevel: "Max level!",
    nextBadge: "Next:",

    // Badge Names
    firstDay: "First Day",
    "7DayStreak": "7 Day Streak",
    "10DayStreak": "10 Day Streak",
    "30DayStreak": "30 Day Streak",
    "100DayStreak": "100 Day Streak",
    "365DayStreak": "365 Day Streak",

    firstWord: "First Word",
    "5Words": "5 Words",
    "10Words": "10 Words",
    "50Words": "50 Words",
    "100Words": "100 Words",
    "500Words": "500 Words",

    firstSite: "First Site",
    "5Sites": "5 Sites",
    "10Sites": "10 Sites",
    "50Sites": "50 Sites",
    "100Sites": "100 Sites",
    "500Sites": "500 Sites",

    firstMythic: "First Mythic!",
    meta: "Meta",
    huh: "Huh???",
    commonKiller: "Common Killer",
    uncommonKiller: "Uncommon Killer",
    rareKiller: "Rare Killer",
    epicKiller: "Epic Killer",
    legendaryKiller: "Legendary Killer",
    mythicKiller: "Mythic Killer",

    // Quiz Mode
    quizStart: "Start Quiz",
    quizQuestion: "Question",
    quizOf: "of",
    quizDefinition: "Definition:",
    quizFillBlank: "Fill in the blank:",
    quizTheWordIs: "The word is:",
    quizSubmit: "Submit",
    quizSkip: "Skip",
    quizBack: "Back to WordDex",
    quizTryAgain: "Try Again",
    quizCorrect: "Correct! The word is \"{word}\".",
    quizIncorrect: "Incorrect. The correct answer is \"{word}\".",
    quizComplete: "Quiz Complete!",
    quizScore: "Your Score:",
    quizPerfect: "Perfect! You know your words!",
    quizGreat: "Great job! You know most of your words!",
    quizGood: "Good effort! Keep learning!",
    quizPractice: "Keep practicing! Review your words more often.",
    quizMinWords: "You need at least 3 words in your collection to start a quiz. Catch more words!",
    quizAnswerPlaceholder: "Type your answer...",

    // Error Messages
    wordNotFound: "Word not found in dictionary",
    apiError: "API error",
    timeout: "Request timeout. Please try again.",
    invalidWord: "Invalid word format.",
    tooShort: "Word must be at least 3 letters long.",
    onlyLetters: "Word must contain only letters (no numbers or special characters).",
    couldNotFetch: "Could not fetch definition.",
    apiKeyError: "Unregistered Authentication Key",
    systemError: "System Error",
    requestError: "Incorrect Request",
    dailyLimitExcess: "Daily API limit exceeded. Please try again tomorrow.",

    // Frequency Info
    frequency: "Frequency",
    perMillion: "per million",
    frequencyNA: "N/A (legacy word)",
    sourceAPI: "API",
    sourceLocalDB: "Local DB",
    sourceKoreanAPI: "Korean API",

    // Animation Messages
    gotIt: "Got it",
    tryAgain: "Try Again",
    newWordCaught: "New Word Caught!",
    alreadyCaught: "Already Caught! Definition Updated",
    firstCaughtOn: "First caught:",
    failedToCatch: "Failed to Catch",

    // New Features (Profile, Tabs, Battle)
    tabDex: "WordDex",
    tabQuiz: "Quiz",
    tabBattle: "Battle",
    
    // Profile
    profileRating: "Rating",
    profileWins: "Wins",
    profileLosses: "Losses",
    profileWords: "Words Collected",
    profileTeam: "Defense Team",
    profileSave: "Save Team",
    profileBack: "Back to Dex",
    profileLoginReq: "You need to login to battle!",
    profileTeamReq: "Set up your team in Profile first!",
    profileSaving: "Saving...",
    profileSaved: "Saved!",
    profileSaveFail: "Failed to save team",
    profileLoading: "Loading profile...",
    profileError: "Error loading profile. Please log in.",
    
    // Battle
    battleStart: "Battle Start!",
    battleRun: "Run Away",
    battleVS: "VS Opponent",
    battleVictory: "VICTORY!",
    battleDefeat: "DEFEAT...",
    battleFainted: "{word} fainted!",
    battleAttacks: "{attacker} hits for {damage}!",
    battleBack: "Back to Menu",
    battleArena: "Battle Arena",
    battleRandom: "Random Battle",
    battleFriendId: "Trainer ID / Name",
    battleFight: "FIGHT",
    battleFriendNotFound: "Friend not found or no team set.",
    battleSearching: "Searching for opponent...",
    battleCancel: "Cancel Search",
    battleGo: "GO",
    
    // Quiz Menu
    quizMenuTitle: "Quiz Settings",
    quizNumQuestions: "Number of Questions",
    quizStartBtn: "Start Quiz"
  },

  ko: {
    // Context Menu
    contextMenu: "'%s' 잡기",

    // Main UI
    wordDex: "단어장",
    darkMode: "다크",
    lightMode: "라이트",
    languageEN: "EN",
    languageKO: "KO",

    // Search & Controls
    searchPlaceholder: "단어 검색...",
    sortAlpha: "ABC순",
    sortRecent: "최근순",
    sortRarity: "희귀도순",
    quiz: "퀴즈",

    // Stats
    collectionStats: "통계",
    totalWords: "총 단어 수",
    streak: "연속 출석일수",
    longest: "최고 연속 출석일수",
    day: "일",
    days: "일",

    // Rarities
    common: "일반",
    uncommon: "특이",
    rare: "희귀",
    epic: "영웅",
    legendary: "전설",
    mythic: "신화",
    god: "신",

    // Rarity Labels (for display)
    COMMON: "일반",
    UNCOMMON: "특이",
    RARE: "희귀",
    EPIC: "영웅",
    LEGENDARY: "전설",
    MYTHIC: "신화",
    GOD: "신",

    // Messages
    noWordsMessage: "아직 수집한 단어가 없습니다. 웹에서 단어를 우클릭하여 수집을 시작하세요!",
    noSearchResults: "검색 결과가 없습니다.",
    deleteConfirm: "\"{word}\"을(를) 삭제하시겠습니까?",
    deleteButton: "삭제",

    // Charts
    wordsCaughtLast7Days: "최근 1주 수집 단어",
    rarityDistribution: "희귀도 분포",

    // Badges
    achievements: "업적",
    hiddenBadges: "히든 업적",
    maxLevel: "최고 레벨!",
    nextBadge: "다음:",

    // Badge Names
    firstDay: "첫 날",
    "7DayStreak": "1주 연속",
    "10DayStreak": "10일 연속",
    "30DayStreak": "1달 연속",
    "100DayStreak": "100일 연속",
    "365DayStreak": "1년 연속",

    firstWord: "첫 단어",
    "5Words": "5개 단어",
    "10Words": "10개 단어",
    "50Words": "50개 단어",
    "100Words": "100개 단어",
    "500Words": "500개 단어",

    firstSite: "첫 사이트",
    "5Sites": "5개 사이트",
    "10Sites": "10개 사이트",
    "50Sites": "50개 사이트",
    "100Sites": "100개 사이트",
    "500Sites": "500개 사이트",

    firstMythic: "첫 신화!",
    meta: "메타",
    huh: "어???",
    commonKiller: "일반 킬러",
    uncommonKiller: "특이 킬러",
    rareKiller: "희귀 킬러",
    epicKiller: "영웅 킬러",
    legendaryKiller: "전설 킬러",
    mythicKiller: "신화 킬러",

    // Quiz Mode
    quizStart: "퀴즈 시작",
    quizQuestion: "문제",
    quizOf: "/",
    quizDefinition: "정의:",
    quizFillBlank: "빈칸 채우기:",
    quizTheWordIs: "단어:",
    quizSubmit: "제출",
    quizSkip: "건너뛰기",
    quizBack: "단어장으로",
    quizTryAgain: "다시 시도",
    quizCorrect: "정답! 단어는 \"{word}\"입니다.",
    quizIncorrect: "오답. 정답은 \"{word}\"입니다.",
    quizComplete: "퀴즈 완료!",
    quizScore: "점수:",
    quizPerfect: "완벽합니다! 단어를 잘 알고 있어요!",
    quizGreat: "잘했어요! 대부분의 단어를 알고 있어요!",
    quizGood: "좋아요! 계속 학습하세요!",
    quizPractice: "계속 연습하세요! 단어를 더 자주 복습하세요.",
    quizMinWords: "퀴즈를 시작하려면 최소 3개의 단어가 필요합니다. 더 많은 단어를 수집하세요!",
    quizAnswerPlaceholder: "답을 입력하세요...",

    // Error Messages
    wordNotFound: "사전에서 단어를 찾을 수 없습니다",
    apiError: "API 오류",
    timeout: "요청 시간 초과. 다시 시도하세요.",
    invalidWord: "잘못된 단어 형식입니다.",
    tooShort: "단어는 최소 3글자 이상이어야 합니다.",
    onlyLetters: "단어는 문자만 포함해야 합니다 (숫자나 특수문자 불가).",
    couldNotFetch: "정의를 가져올 수 없습니다.",
    apiKeyError: "등록되지 않은 인증 키",
    systemError: "시스템 오류",
    requestError: "잘못된 요청",
    dailyLimitExcess: "일일 API 한도를 초과했습니다. 내일 다시 시도하세요.",

    // Frequency Info
    frequency: "빈도",
    perMillion: "백만 당",
    frequencyNA: "N/A (레거시 단어)",
    sourceAPI: "API",
    sourceLocalDB: "로컬 DB",
    sourceKoreanAPI: "한국어 API",

    // Animation Messages
    gotIt: "확인",
    tryAgain: "다시 시도",
    newWordCaught: "새로운 단어를 잡았습니다!",
    alreadyCaught: "이미 잡았습니다! 정의가 업데이트되었습니다",
    firstCaughtOn: "처음 잡은 날:",
    failedToCatch: "잡기 실패",

    // New Features (Profile, Tabs, Battle)
    tabDex: "단어장",
    tabQuiz: "퀴즈",
    tabBattle: "배틀",
    
    // Profile
    profileRating: "레이팅",
    profileWins: "승",
    profileLosses: "패",
    profileWords: "수집한 단어",
    profileTeam: "방어팀",
    profileSave: "팀 저장",
    profileBack: "단어장으로",
    profileLoginReq: "배틀을 하려면 로그인이 필요합니다!",
    profileTeamReq: "프로필에서 팀을 먼저 설정하세요!",
    profileSaving: "저장 중...",
    profileSaved: "저장됨!",
    profileSaveFail: "팀 저장 실패",
    profileLoading: "프로필 로딩 중...",
    profileError: "프로필 로딩 오류. 로그인 해주세요.",
    
    // Battle
    battleStart: "배틀 시작!",
    battleRun: "도망가기",
    battleVS: "VS 상대",
    battleVictory: "승리!",
    battleDefeat: "패배...",
    battleFainted: "{word} 기절!",
    battleAttacks: "{attacker} 공격! {damage} 데미지!",
    battleBack: "메뉴로",
    battleArena: "배틀 아레나",
    battleRandom: "랜덤 배틀",
    battleFriendId: "트레이너 ID / 이름",
    battleFight: "배틀",
    battleFriendNotFound: "친구를 찾을 수 없거나 팀이 없습니다.",
    battleSearching: "상대 찾는 중...",
    battleCancel: "검색 취소",
    battleGo: "이동",
    
    // Quiz Menu
    quizMenuTitle: "퀴즈 설정",
    quizNumQuestions: "문제 수",
    quizStartBtn: "퀴즈 시작"
  }
};

// Current language state (will be loaded from storage)
let currentLanguage = 'en';

// Get current language from storage
async function getCurrentLanguage() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['language'], (data) => {
        currentLanguage = data.language || 'en';
        resolve(currentLanguage);
      });
    } else {
      resolve(currentLanguage);
    }
  });
}

// Set language and save to storage
async function setLanguage(lang) {
  if (!translations[lang]) {
    console.error(`Language "${lang}" not supported`);
    return false;
  }

  currentLanguage = lang;

  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ language: lang }, () => {
        resolve(true);
      });
    } else {
      resolve(true);
    }
  });
}

// Translate a key to current language
function t(key, replacements = {}) {
  const translation = translations[currentLanguage][key] || translations['en'][key] || key;

  // Replace placeholders like {word}
  let result = translation;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(`{${placeholder}}`, value);
  }

  return result;
}

// Synchronous version of translate (uses current language state)
// Use this when you need immediate translation without async
function tSync(key, replacements = {}) {
  return t(key, replacements);
}

// Initialize language on script load
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['language'], (data) => {
    currentLanguage = data.language || 'en';
    console.log('Lingomon i18n: Language loaded:', currentLanguage);
  });

  // Listen for language changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.language) {
      currentLanguage = changes.language.newValue || 'en';
      console.log('Lingomon i18n: Language changed to:', currentLanguage);
    }
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getCurrentLanguage, setLanguage, t, tSync };
}
