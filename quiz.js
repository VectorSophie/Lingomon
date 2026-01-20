
let quizMode = false;
let quizData = {
  questions: [],
  currentIndex: 0,
  score: 0,
  total: 5,
  processing: false
};

function setupQuizButton() {
  const quizBtn = document.getElementById('quizBtn');
  if (quizBtn) {
    quizBtn.addEventListener('click', () => {
      toggleQuizMode();
    });
  }
}

function toggleQuizMode() {
  // Deprecated by Tab System
  // Keeping logic for reuse if needed
}

function renderQuizMenu() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = '<p>Loading...</p>';
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const wordDex = data.wordDex || {};
    // Filter out GOD rarity words for quiz
    const filteredWords = Object.keys(wordDex).filter(word => wordDex[word].rarity !== 'god');
    const totalWords = filteredWords.length;

    if (totalWords < 3) {
       container.innerHTML = `<p style="padding:20px;text-align:center;">${t('quizMinWords')}</p>`;
       return;
    }

    container.innerHTML = `
      <div class="quiz-menu" style="text-align:center; padding:10px;">
        <h3 style="margin-bottom:20px;">${t('quizMenuTitle')}</h3>
        
        <div style="margin-bottom: 24px; text-align:left; background:#f9f9f9; padding:16px; border-radius:8px; border:1px solid #eee;">
          <label class="quiz-setting-label" style="font-weight:bold; font-size:12px; display:block; margin-bottom:8px;">${t('quizNumQuestions')}</label>
          <div style="display:flex; align-items:center; gap:12px;">
            <input type="range" id="quizSize" min="3" max="${Math.min(20, totalWords)}" value="5" style="flex:1">
            <span id="quizSizeVal" class="quiz-setting-label" style="font-weight:bold; width:24px;">5</span>
          </div>
        </div>

        <button id="btnStartCustomQuiz" class="quiz-start-btn" style="font-size:16px;">${t('quizStartBtn')}</button>
      </div>
    `;

    const range = document.getElementById('quizSize');
    
    // Validate range values
    const maxVal = Math.min(20, totalWords);
    range.max = maxVal;
    range.value = Math.min(5, maxVal); // Ensure initial value is within bounds
    
    // Update display immediately
    const valDisplay = document.getElementById('quizSizeVal');
    valDisplay.textContent = range.value;
    
    range.oninput = () => valDisplay.textContent = range.value;

    document.getElementById('btnStartCustomQuiz').onclick = () => {
      startQuiz({ size: parseInt(range.value) });
    };
  });
}

function startQuiz(options = { size: 5 }) {
  const container = document.getElementById('quizContainer');
  // If we are already in the middle of a quiz (and not just starting from menu), don't reset unless force
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const wordDex = data.wordDex || {};
    
    // Exclude GOD rarity words
    const words = Object.entries(wordDex).filter(([word, info]) => info.rarity !== 'god');

    // Select random words
    const shuffled = words.sort(() => 0.5 - Math.random());
    const quizSize = options.size || 5;
    quizData.questions = shuffled.slice(0, Math.min(quizSize, words.length));
    quizData.currentIndex = 0;
    quizData.score = 0;
    quizData.total = quizData.questions.length;
    quizData.processing = false;

    showQuestion();
  });
}

function showQuestion() {
  quizData.processing = false;
  const quizContainer = document.getElementById('quizContainer');
  if (quizData.currentIndex >= quizData.questions.length) {
    showResults();
    return;
  }

  const [word, info] = quizData.questions[quizData.currentIndex];
  const definition = info.origin || 'No definition available';

  quizContainer.innerHTML = `
    <div class="quiz-score">${t('quizQuestion')} ${quizData.currentIndex + 1} ${t('quizOf')} ${quizData.total}</div>
    <div class="quiz-question">
      <strong>${t('quizDefinition')}</strong><br>
      ${escapeHtml(definition)}
    </div>
    <div class="quiz-question">
      <strong>${t('quizFillBlank')}</strong><br>
      ${t('quizTheWordIs')} <input type="text" class="quiz-input" id="quizAnswer" placeholder="${t('quizAnswerPlaceholder')}">
    </div>
    <button class="quiz-btn" id="submitAnswer">${t('quizSubmit')}</button>
    <button class="quiz-btn" id="skipQuestion">${t('quizSkip')}</button>
  `;
  
  const input = document.getElementById('quizAnswer');
  input.focus();
  
  // Submit on Enter
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer(word.toLowerCase());
  });

  document.getElementById('submitAnswer').onclick = () => checkAnswer(word.toLowerCase());
  document.getElementById('skipQuestion').onclick = () => {
    if(quizData.processing) return;
    checkAnswer(null); // incorrect
  };
}

function checkAnswer(correctWord) {
  if (quizData.processing) return;
  quizData.processing = true;

  const input = document.getElementById('quizAnswer');
  const submitBtn = document.getElementById('submitAnswer');
  const skipBtn = document.getElementById('skipQuestion');
  
  // Disable controls to prevent multiple submissions
  if(input) input.disabled = true;
  if(submitBtn) submitBtn.disabled = true;
  if(skipBtn) skipBtn.disabled = true;

  const answer = input ? input.value.trim().toLowerCase() : '';
  const isCorrect = correctWord && answer === correctWord;

  if (isCorrect) {
    quizData.score++;
  }

  const quizContainer = document.getElementById('quizContainer');
  const resultDiv = document.createElement('div');
  resultDiv.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
  resultDiv.innerHTML = isCorrect
    ? t('quizCorrect', { word: correctWord })
    : t('quizIncorrect', { word: correctWord || '...' });

  if(quizContainer.firstChild) {
      quizContainer.insertBefore(resultDiv, quizContainer.firstChild);
  } else {
      quizContainer.appendChild(resultDiv);
  }

  setTimeout(() => {
    quizData.currentIndex++;
    showQuestion();
  }, 2000);
}

function showResults() {
  const quizContainer = document.getElementById('quizContainer');
  const percentage = Math.round((quizData.score / quizData.total) * 100);

  let message = '';
  if (percentage === 100) {
    message = t('quizPerfect');
  } else if (percentage >= 80) {
    message = t('quizGreat');
  } else if (percentage >= 60) {
    message = t('quizGood');
  } else {
    message = t('quizPractice');
  }

  quizContainer.innerHTML = `
    <div class="quiz-score">${t('quizComplete')}</div>
    <div class="quiz-result ${percentage >= 60 ? 'correct' : 'incorrect'}">
      <strong>${t('quizScore')} ${quizData.score} / ${quizData.total} (${percentage}%)</strong><br><br>
      ${message}
    </div>
  `;

  const tryAgainBtn = document.createElement('button');
  tryAgainBtn.className = 'quiz-btn';
  tryAgainBtn.textContent = t('quizTryAgain');
  tryAgainBtn.onclick = () => renderQuizMenu();
  
  const backBtn = document.createElement('button');
  backBtn.className = 'quiz-btn secondary';
  backBtn.textContent = t('quizBack');
  backBtn.style.marginTop = '8px';
  backBtn.onclick = () => {
    switchTab('dex'); // Assuming switchTab is global
  };

  quizContainer.appendChild(tryAgainBtn);
  quizContainer.appendChild(backBtn);
}
