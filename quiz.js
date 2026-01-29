
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

        <button id="btnStartCustomQuiz" class="quiz-start-btn" style="font-size:16px; margin-bottom:12px;">${t('quizStartBtn')}</button>
        <button id="btnStartTraining" class="quiz-start-btn" style="font-size:16px; background: #333; color: white; border: 1px solid #666;">${t('dailyTraining')}</button>
      </div>
    `;

    const range = document.getElementById('quizSize');
    
    // Check if training is already done today
    chrome.storage.local.get(['lastTrainingDate'], (res) => {
        const lastDate = res.lastTrainingDate;
        const today = new Date().toDateString();
        
        const trainingBtn = document.getElementById('btnStartTraining');
        if (lastDate === today) {
            trainingBtn.disabled = true;
            trainingBtn.textContent = `${t('dailyTraining')} (Done)`;
            trainingBtn.style.opacity = '0.5';
            trainingBtn.style.cursor = 'not-allowed';
            trainingBtn.style.background = '#ccc';
            trainingBtn.style.color = '#666';
        }
    });
    
    // Validate range values
    const maxVal = Math.min(20, totalWords);
    range.max = maxVal;
    range.value = Math.min(5, maxVal); // Ensure initial value is within bounds
    
    // Update display immediately
    const valDisplay = document.getElementById('quizSizeVal');
    valDisplay.textContent = range.value;
    
    range.oninput = () => valDisplay.textContent = range.value;

    document.getElementById('btnStartCustomQuiz').onclick = () => {
      startQuiz({ size: parseInt(range.value), mode: 'random' });
    };
    
    document.getElementById('btnStartTraining').onclick = () => {
        startQuiz({ size: 10, mode: 'training' });
    };
  });
}

function startQuiz(options = { size: 5, mode: 'random' }) {
  const container = document.getElementById('quizContainer');
  // If we are already in the middle of a quiz (and not just starting from menu), don't reset unless force
  
  // Store mode for later use in results
  quizData.mode = options.mode;
  
  chrome.storage.local.get(['wordDex'], (data) => {
    const wordDex = data.wordDex || {};
    
    // Exclude GOD rarity words
    const words = Object.entries(wordDex).filter(([word, info]) => info.rarity !== 'god');
    
    let selectedWords = [];
    
    if (options.mode === 'training') {
        // SRS Filter: Due for review
        const now = Date.now();
        const dueWords = words.filter(([word, info]) => {
            if (!info.srs) return true; // Treat new/migrated words as due
            return now >= info.srs.nextReview;
        });
        
        if (dueWords.length === 0) {
            // Smart Fallback: Review words that are coming up soon, or lowest SRS level
            // For now, simple fallback to random but show toast?
            // Actually, let's grab words with lowest SRS levels
            selectedWords = words.sort((a, b) => {
                const srsA = a[1].srs ? a[1].srs.level : 0;
                const srsB = b[1].srs ? b[1].srs.level : 0;
                return srsA - srsB;
            }).slice(0, 10);
            
            // alert("No words strictly due! Reviewing your weakest words."); // UX improvement needed later
        } else {
            selectedWords = dueWords.sort((a,b) => {
                 // Sort by how overdue they are (descending)
                 return (b[1].srs ? b[1].srs.nextReview : 0) - (a[1].srs ? a[1].srs.nextReview : 0);
            }).slice(0, Math.min(10, dueWords.length));
        }
    } else {
        // Select random words
        const shuffled = words.sort(() => 0.5 - Math.random());
        const quizSize = options.size || 5;
        selectedWords = shuffled.slice(0, Math.min(quizSize, words.length));
    }

    quizData.questions = selectedWords.map(([word, info]) => {
        // Default Question: Definition -> Word
        let type = 'definition';
        let questionText = info.origin || 'No definition available';
        let answer = word.toLowerCase();
        let label = t('quizDefinition');
        let hint = t('quizFillBlank');


        // Specialized Questions
        if (info.tags) {
            if (info.tags.includes('chem') && info.origin.includes('Symbol:')) {
                // Chemical Element: Symbol -> Name
                const symbolMatch = info.origin.match(/Symbol: (\w+)/);
                if (symbolMatch) {
                    type = 'symbol';
                    questionText = `${t('quizSymbolQuestion')} ${symbolMatch[1]}?`;
                    label = t('quizChemistry');
                    hint = t('quizElementName');
                }
            } else if (info.tags.includes('astro') && info.origin.includes('Type: Planet')) {
                // Planet: Fact -> Name
                type = 'astro';
                label = t('quizAstronomy');
            }
        }
        
        return {
            word: word,
            type: type,
            question: questionText,
            answer: answer,
            label: label,
            hint: hint
        };
    });

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

  const q = quizData.questions[quizData.currentIndex];

  quizContainer.innerHTML = `
    <div class="quiz-score">${t('quizQuestion')} ${quizData.currentIndex + 1} ${t('quizOf')} ${quizData.total}</div>
    <div class="quiz-question">
      <strong>${q.label}</strong><br>
      ${escapeHtml(q.question)}
    </div>
    <div class="quiz-question">
      <strong>${q.hint}</strong><br>
      ${t('quizTheWordIs')} <input type="text" class="quiz-input" id="quizAnswer" placeholder="${t('quizAnswerPlaceholder')}">
    </div>
    <button class="quiz-btn" id="submitAnswer">${t('quizSubmit')}</button>
    <button class="quiz-btn" id="skipQuestion">${t('quizSkip')}</button>
  `;
  
  const input = document.getElementById('quizAnswer');
  input.focus();
  
  // Submit on Enter
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer(q.answer);
  });

  document.getElementById('submitAnswer').onclick = () => checkAnswer(q.answer);
  document.getElementById('skipQuestion').onclick = () => {
    if(quizData.processing) return;
    checkAnswer(null); // incorrect
  };
}

// Simple Mutex Implementation to prevent race conditions during Async SRS updates
const QuizMutex = {
    _locked: false,
    _queue: [],
    
    // Acquire lock
    acquire: function() {
        return new Promise(resolve => {
            if (!this._locked) {
                this._locked = true;
                resolve();
            } else {
                this._queue.push(resolve);
            }
        });
    },
    
    // Release lock
    release: function() {
        if (this._queue.length > 0) {
            const next = this._queue.shift();
            next(); // Grant lock to next in line
        } else {
            this._locked = false;
        }
    },
    
    // Run an async task with lock protection
    dispatch: async function(task) {
        await this.acquire();
        try {
            await task();
        } finally {
            this.release();
        }
    }
};

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
  
  // SRS Update
  const currentQ = quizData.questions[quizData.currentIndex];
  
  if (currentQ.word) {
      // Async update SRS with Mutex Protection
      QuizMutex.dispatch(async () => {
          return new Promise((resolve) => {
              chrome.storage.local.get(['wordDex'], (data) => {
                  const dex = data.wordDex || {};
                  const entry = dex[currentQ.word];
                  if (entry) {
                     // Init SRS if missing (double safety)
                     if (!entry.srs) entry.srs = { level: 0, streak: 0, nextReview: 0 };
                     
                     if (typeof SRS !== 'undefined') {
                         const newSrs = SRS.calculateSRS(entry.srs, isCorrect);
                         entry.srs = newSrs;
                         
                         // Evolution Trigger Logic (3 Stages)
                         if (newSrs.level >= 1 && (!entry.evolution || entry.evolution.stage < 1)) {
                             // Eligible for Evo 1 (Bronze)
                             if (!entry.evolution) entry.evolution = { stage: 0 };
                             entry.evolution.canEvolve = true;
                         }
                         if (newSrs.level >= 3 && (!entry.evolution || entry.evolution.stage < 2)) {
                             // Eligible for Evo 2 (Silver)
                             entry.evolution.canEvolve = true;
                         }
                         if (newSrs.level >= 5 && (!entry.evolution || entry.evolution.stage < 3)) {
                             // Eligible for Evo 3 (Gold)
                             entry.evolution.canEvolve = true;
                         }
                         
                         chrome.storage.local.set({ wordDex: dex }, () => {
                             resolve(); // Release mutex after write complete
                         });
                     } else {
                         resolve();
                     }
                  } else {
                      resolve();
                  }
              });
          });
      });
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

  // Mark Daily Training as Done ONLY if completed
  if (quizData.mode === 'training') {
      chrome.storage.local.set({ lastTrainingDate: new Date().toDateString() });
  }

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
