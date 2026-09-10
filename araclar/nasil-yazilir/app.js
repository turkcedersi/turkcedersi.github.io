document.addEventListener('DOMContentLoaded', () => {
  // Ensure wordsData is available globally
  if (!window.wordsData || window.wordsData.length === 0) {
    console.error('Kelimeler veritabanı yüklenemedi!');
    return;
  }

  const dataset = window.wordsData;
  const totalQuestions = dataset.length;

  // App State
  let state = {
    currentIndex: 0,
    answers: {} // format: { slideNumber: { answered: true, selectedIndex: X, correct: true/false } }
  };

  // LocalStorage Key
  const STORAGE_KEY = 'nasilYazilir_progress_v1';

  // DOM Elements
  const quizCard = document.getElementById('quiz-card');
  const questionIndexLabel = document.getElementById('question-index-label');
  const choiceCountBadge = document.getElementById('choice-count-badge');
  const questionStatusBadge = document.getElementById('question-status-badge');
  const choicesContainer = document.getElementById('choices-container');
  const hintContainer = document.getElementById('hint-container');
  const hintText = document.getElementById('hint-text');
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  const sidebarPanel = document.getElementById('sidebar-panel');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  
  const progressPercent = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');
  
  const statTotal = document.getElementById('stat-total');
  const statCorrect = document.getElementById('stat-correct');
  const statIncorrect = document.getElementById('stat-incorrect');
  
  const questionSelect = document.getElementById('question-select');
  const jumpInput = document.getElementById('jump-input');
  const jumpBtn = document.getElementById('jump-btn');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const searchResults = document.getElementById('search-results');

  // Turkish Lowercase/Uppercase helper for search
  function cleanTurkishText(text) {
    if (!text) return '';
    return text
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/Ş/g, 'ş')
      .replace(/Ç/g, 'ç')
      .replace(/Ğ/g, 'ğ')
      .replace(/Ö/g, 'ö')
      .replace(/Ü/g, 'ü')
      .toLowerCase()
      .trim();
  }

  // Save progress to LocalStorage
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('İlerleme kaydedilemedi (localStorage limitli veya kapalı olabilir):', e);
    }
  }

  // Load progress from LocalStorage
  function loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loaded = JSON.parse(stored);
        if (loaded && typeof loaded === 'object') {
          if (typeof loaded.currentIndex === 'number' && loaded.currentIndex >= 0 && loaded.currentIndex < totalQuestions) {
            state.currentIndex = loaded.currentIndex;
          }
          if (loaded.answers && typeof loaded.answers === 'object') {
            state.answers = loaded.answers;
          }
        }
      }
    } catch (e) {
      console.warn('İlerleme yüklenemedi:', e);
    }
  }

  // Initialize App
  function init() {
    loadProgress();
    
    if (jumpInput) {
      jumpInput.max = totalQuestions;
    }
    
    // Populate dropdown selection
    populateDropdown();
    
    // Render current question slide
    renderSlide(state.currentIndex);
    
    // Update stats counters & progress bar
    updateStatsAndProgress();
    
    // Attach Event Listeners
    setupEventListeners();
  }

  // Setup DOM Event Listeners
  function setupEventListeners() {
    // Nav Button Clicks
    prevBtn.addEventListener('click', () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderSlide(state.currentIndex);
        saveProgress();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (state.currentIndex < totalQuestions - 1) {
        state.currentIndex++;
        renderSlide(state.currentIndex);
        saveProgress();
      }
    });

    // Mobile Sidebar Toggles
    toggleSidebarBtn.addEventListener('click', () => {
      sidebarPanel.classList.add('active');
      document.body.classList.add('sidebar-open');
    });

    const closeSidebar = () => {
      sidebarPanel.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    };
    
    closeSidebarBtn.addEventListener('click', closeSidebar);
    
    // Close sidebar on tapping background overlay
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('sidebar-open') && 
          !sidebarPanel.contains(e.target) && 
          !toggleSidebarBtn.contains(e.target)) {
        closeSidebar();
      }
    });

    // Question Dropdown Selection
    questionSelect.addEventListener('change', (e) => {
      const index = parseInt(e.target.value);
      state.currentIndex = index;
      renderSlide(index);
      saveProgress();
      
      // On mobile, close sidebar drawer on navigation selection
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });

    // Numeric Keyboard Jump Box
    const handleJump = () => {
      const val = parseInt(jumpInput.value);
      if (val >= 1 && val <= totalQuestions) {
        state.currentIndex = val - 1;
        renderSlide(state.currentIndex);
        saveProgress();
        jumpInput.value = '';
        
        // On mobile, close sidebar drawer
        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      } else {
        alert(`Lütfen 1 ile ${totalQuestions} arasında geçerli bir soru numarası girin.`);
      }
    };

    jumpBtn.addEventListener('click', handleJump);
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleJump();
      }
    });

    // Search input handlers
    searchInput.addEventListener('input', (e) => {
      const query = cleanTurkishText(e.target.value);
      if (query.length > 0) {
        clearSearchBtn.style.display = 'flex';
        performSearch(query);
      } else {
        clearSearchBtn.style.display = 'none';
        searchResults.style.display = 'none';
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchResults.style.display = 'none';
      searchInput.focus();
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        searchResults.style.display = 'none';
      }
    });
  }

  // Generate prefix and label string for dropdown select options
  function getOptionLabel(idx) {
    const q = dataset[idx];
    const ans = state.answers[q.slide];
    let prefix = '[ ] ';
    if (ans) {
      prefix = ans.correct ? '[✓] ' : '[✗] ';
    }
    // Form a display string showing options
    const choicesStr = q.choices.slice(0, 2).join(' / ');
    return `${prefix}Soru ${idx + 1}: ${choicesStr}`;
  }

  // Populate options dropdown
  function populateDropdown() {
    questionSelect.innerHTML = '';
    
    dataset.forEach((q, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = getOptionLabel(idx);
      questionSelect.appendChild(option);
    });
  }

  // Update specific select option status (e.g. after answering)
  function updateSelectOptionStatus(idx) {
    const option = questionSelect.options[idx];
    if (option) {
      option.textContent = getOptionLabel(idx);
    }
  }

  // Render the current active question slide
  function renderSlide(index) {
    const q = dataset[index];
    const slideNum = q.slide;
    const isAnswered = !!state.answers[slideNum];
    const answerInfo = state.answers[slideNum];
    
    // Update Question Info Labels
    questionIndexLabel.textContent = `Soru ${index + 1} / ${totalQuestions}`;
    choiceCountBadge.textContent = `${q.choices.length} Seçenek`;
    
    // Update Dropdown current selection value
    questionSelect.value = index;

    // Update Status Badge
    questionStatusBadge.className = 'badge badge-status';
    if (!isAnswered) {
      questionStatusBadge.textContent = 'Yanıtlanmadı';
    } else if (answerInfo.correct) {
      questionStatusBadge.textContent = 'Doğru';
      questionStatusBadge.classList.add('correct');
    } else {
      questionStatusBadge.textContent = 'Yanlış';
      questionStatusBadge.classList.add('incorrect');
    }
    
    // Clear choices container
    choicesContainer.innerHTML = '';
    
    // Render Choices Buttons
    q.choices.forEach((choice, choiceIdx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      
      // If already answered, color code them immediately
      if (isAnswered) {
        btn.disabled = true;
        if (choiceIdx === q.correct_index) {
          btn.classList.add('correct');
        } else if (choiceIdx === answerInfo.selectedIndex) {
          btn.classList.add('incorrect');
        } else {
          btn.classList.add('faded');
        }
      } else {
        // Unanswered - Add click handler
        btn.addEventListener('click', () => {
          handleChoiceSelection(index, choiceIdx);
        });
      }
      
      choicesContainer.appendChild(btn);
    });

    // Handle Hint Presentation
    if (q.hint) {
      hintText.textContent = q.hint;
      hintContainer.style.display = 'block';
    } else {
      hintContainer.style.display = 'none';
    }

    // Handle Navigation Buttons Disabled States
    prevBtn.disabled = (index === 0);
    nextBtn.disabled = !isAnswered || (index === totalQuestions - 1);
  }

  // Handle choice selection
  function handleChoiceSelection(questionIdx, selectedChoiceIdx) {
    const q = dataset[questionIdx];
    const slideNum = q.slide;
    const isCorrect = (selectedChoiceIdx === q.correct_index);

    // Save Answer State
    state.answers[slideNum] = {
      answered: true,
      selectedIndex: selectedChoiceIdx,
      correct: isCorrect
    };

    saveProgress();

    // Trigger Visual Feedback on Buttons
    const buttons = choicesContainer.querySelectorAll('.choice-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correct_index) {
        btn.classList.add('correct');
      } else if (idx === selectedChoiceIdx) {
        btn.classList.add('incorrect');
      } else {
        btn.classList.add('faded');
      }
    });

    // Update Status Badge
    questionStatusBadge.className = 'badge badge-status';
    if (isCorrect) {
      questionStatusBadge.textContent = 'Doğru';
      questionStatusBadge.classList.add('correct');
    } else {
      questionStatusBadge.textContent = 'Yanlış';
      questionStatusBadge.classList.add('incorrect');
    }

    // Enable Next Button
    if (questionIdx < totalQuestions - 1) {
      nextBtn.disabled = false;
    }

    // Update dropdown item suffix
    updateSelectOptionStatus(questionIdx);

    // Update Overall Stats Panel
    updateStatsAndProgress();
  }

  // Update Stats and Progress bar
  function updateStatsAndProgress() {
    let completedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    dataset.forEach(q => {
      const ans = state.answers[q.slide];
      if (ans) {
        completedCount++;
        if (ans.correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    // Update text counters
    statTotal.textContent = completedCount;
    statCorrect.textContent = correctCount;
    statIncorrect.textContent = incorrectCount;

    // Update progress bar
    const percentage = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;
    progressPercent.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
  }

  // Perform Search and populate autocomplete dropdown
  function performSearch(query) {
    searchResults.innerHTML = '';
    
    if (!query) {
      searchResults.style.display = 'none';
      return;
    }

    const matches = [];
    
    dataset.forEach((q, idx) => {
      // Check if query is in any of the choices
      const matchesChoice = q.choices.some(choice => 
        cleanTurkishText(choice).includes(query)
      );
      
      // Also check if query matches the hint
      const matchesHint = q.hint && cleanTurkishText(q.hint).includes(query);

      if (matchesChoice || matchesHint) {
        matches.push({
          index: idx,
          slide: q.slide,
          choices: q.choices,
          correct: q.correct
        });
      }
    });

    if (matches.length === 0) {
      const noRes = document.createElement('div');
      noRes.className = 'no-results';
      noRes.textContent = 'Eşleşen sözcük bulunamadı.';
      searchResults.appendChild(noRes);
    } else {
      // Limit to 10 results for clean listing
      matches.slice(0, 10).forEach(match => {
        const item = document.createElement('div');
        item.className = 'search-item';
        
        const displaySpelling = match.choices.join(' / ');
        
        item.innerHTML = `
          <span>${displaySpelling}</span>
          <span class="search-item-index">Soru ${match.index + 1}</span>
        `;
        
        item.addEventListener('click', () => {
          // Jump to slide
          state.currentIndex = match.index;
          renderSlide(state.currentIndex);
          saveProgress();
          
          // Clear and hide search
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          searchResults.style.display = 'none';
        });
        
        searchResults.appendChild(item);
      });
    }

    searchResults.style.display = 'block';
  }

  // Run app
  init();
});
