document.addEventListener("DOMContentLoaded", () => {
    /* ==========================================================================
       STATE MANAGEMENT
       ========================================================================== */
    const state = {
        currentScreen: "home-screen",
        userProgress: {
            completedRules: new Set(), // Set of completed rule IDs (e.g. "nokta_r1")
            completedMarks: new Set(), // Set of completed punctuation mark IDs (e.g. "nokta")
            solvedParagraphs: new Set() // Set of paragraph IDs (1 to 100) completed in General Activity
        },
        activeMark: null,
        activeStepIndex: 0,
        activeQuestionIndex: 0,
        activeParagraphIndex: 0,
        activeBlankIndex: null,
        
        // Caches details about blanks in the currently loaded paragraph
        currentParagraphBlanks: [] // Array of { index, correctSymbol, element }
    };

    // The universe of 13 symbols to display in the General Activity tray
    const universeSymbols = [".", ",", ":", ";", "?", "!", '"', "'", "...", "(", ")", "/", "-", "—"];

    /* ==========================================================================
       DOM ELEMENTS
       ========================================================================== */
    // Screens
    const screens = {
        home: document.getElementById("home-screen"),
        detail: document.getElementById("detail-screen"),
        ga: document.getElementById("general-activity-screen")
    };

    // Header Dynamic Navigation elements
    const headerNavDetail = document.getElementById("header-nav-detail");
    const headerNavGa = document.getElementById("header-nav-ga");

    // Home Screen elements
    const cardsContainer = document.getElementById("punctuation-cards-container");
    const btnGeneralActivity = document.getElementById("btn-general-activity");
    const globalProgressText = document.getElementById("global-progress-text");
    const gaHeroProgress = document.getElementById("general-activity-progress");

    // Detail/Slider Screen elements
    const btnBackToHome = document.getElementById("btn-back-to-home");
    const detailSymbolIcon = document.getElementById("detail-symbol-icon");
    const detailMarkName = document.getElementById("detail-mark-name");
    const currentStepBadge = document.getElementById("current-step-badge");
    const btnPrevRule = document.getElementById("btn-prev-rule");
    const btnNextRule = document.getElementById("btn-next-rule");
    const stepDotsContainer = document.getElementById("step-dots-container");
    const ruleTitle = document.getElementById("rule-title");
    const ruleDefinition = document.getElementById("rule-definition");
    const ruleExamplesList = document.getElementById("rule-examples-list");
    const quizQuestionText = document.getElementById("quiz-question-text");
    const quizOptionsContainer = document.getElementById("quiz-options-container");
    const quizFeedbackArea = document.getElementById("quiz-feedback-area");
    const feedbackTitle = document.getElementById("feedback-title");
    const feedbackExplanation = document.getElementById("feedback-explanation");
    const btnNextStep = document.getElementById("btn-next-step");

    // General Activity elements
    const btnGaBackToHome = document.getElementById("btn-ga-back-to-home");
    const btnPrevQuestion = document.getElementById("btn-prev-question");
    const btnNextQuestion = document.getElementById("btn-next-question");
    const btnNextQuestionFooter = document.getElementById("btn-next-question-footer");
    const gaQuestionSelect = document.getElementById("ga-question-select");
    const gaQuestionInput = document.getElementById("ga-question-input");
    const gaProgressNumber = document.getElementById("ga-progress-number");
    const gaParagraphImageContainer = document.getElementById("ga-paragraph-image-container");
    const gaParagraphImage = document.getElementById("ga-paragraph-image");
    const gaParagraphSource = document.getElementById("ga-paragraph-source");
    const universeSymbolsContainer = document.getElementById("universe-symbols-container");

    /* ==========================================================================
       INITIALIZATION
       ========================================================================== */
    function init() {
        renderPunctuationGrid();
        updateGlobalProgress();
        setupEventListeners();
        populateGaDropdown();
        renderUniverseSymbols();
    }

    /* ==========================================================================
       NAVIGATION & SCREEN MANAGEMENT
       ========================================================================== */
    function showScreen(screenId) {
        // Remove active class from all screens
        Object.values(screens).forEach(screen => {
            screen.classList.remove("active");
        });
        
        // Add active class to target screen
        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add("active");
        state.currentScreen = screenId;

        // Toggle dynamic header navigation
        if (screenId === "home-screen") {
            headerNavDetail.classList.add("hidden");
            headerNavGa.classList.add("hidden");
        } else if (screenId === "detail-screen") {
            headerNavDetail.classList.remove("hidden");
            headerNavGa.classList.add("hidden");
        } else if (screenId === "general-activity-screen") {
            headerNavDetail.classList.add("hidden");
            headerNavGa.classList.remove("hidden");
        }

        // Reset scroll position
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // If going back home, refresh cards to update progress bars
        if (screenId === "home-screen") {
            renderPunctuationGrid();
            updateGlobalProgress();
        }
    }

    /* ==========================================================================
       GLOBAL PROGRESS
       ========================================================================== */
    function updateGlobalProgress() {
        // Count total rules across all punctuation marks
        let totalRules = 0;
        punctuationData.forEach(mark => {
            totalRules += mark.rules.length;
        });

        const completedRulesCount = state.userProgress.completedRules.size;
        const percent = totalRules > 0 ? Math.round((completedRulesCount / totalRules) * 100) : 0;
        
        globalProgressText.textContent = `${percent}%`;
        gaHeroProgress.textContent = `Soru: ${state.userProgress.solvedParagraphs.size} / ${generalActivityData.length}`;
    }

    /* ==========================================================================
       HOME SCREEN: RENDER CARDS
       ========================================================================== */
    function renderPunctuationGrid() {
        cardsContainer.innerHTML = "";

        punctuationData.forEach(mark => {
            const totalRules = mark.rules.length;
            const completedCount = mark.rules.filter(rule => state.userProgress.completedRules.has(rule.id)).length;
            const progressPercent = totalRules > 0 ? Math.round((completedCount / totalRules) * 100) : 0;
            const isCompleted = progressPercent === 100;

            const card = document.createElement("div");
            card.className = `punctuation-card glass-card ${isCompleted ? 'completed' : ''}`;
            
            // Set dynamic glow color variables on card element
            card.style.setProperty("--accent-color", mark.color);
            card.style.borderColor = isCompleted ? mark.color : `${mark.color}33`; // 20% opacity border
            card.style.boxShadow = `0 8px 32px 0 rgba(0, 0, 0, 0.25), 0 0 15px -5px ${mark.color}15`;

            // Hover shadow effect binding via JS for smooth dynamics
            card.addEventListener("mouseenter", () => {
                card.style.borderColor = mark.color;
                card.style.boxShadow = `0 12px 40px 0 rgba(0, 0, 0, 0.35), 0 0 25px 0px ${mark.color}44`;
            });
            card.addEventListener("mouseleave", () => {
                card.style.borderColor = isCompleted ? mark.color : `${mark.color}33`;
                card.style.boxShadow = `0 8px 32px 0 rgba(0, 0, 0, 0.25), 0 0 15px -5px ${mark.color}15`;
            });

            card.innerHTML = `
                <span class="card-symbol" style="color: ${mark.color}; text-shadow: 0 0 12px ${mark.color}55">${mark.symbol}</span>
                <span class="card-name">${mark.name}</span>
                ${isCompleted ? '<span class="card-check">✓</span>' : ''}
            `;

            card.addEventListener("click", () => {
                loadMarkDetail(mark.id);
            });

            cardsContainer.appendChild(card);
        });
    }

    /* ==========================================================================
       DETAIL/SLIDER SCREEN: LOGIC
       ========================================================================== */
    function loadMarkDetail(markId) {
        const mark = punctuationData.find(m => m.id === markId);
        if (!mark) return;

        state.activeMark = mark;
        state.activeStepIndex = 0;
        state.activeQuestionIndex = 0;

        detailSymbolIcon.textContent = mark.symbol;
        detailSymbolIcon.style.color = mark.color;
        detailSymbolIcon.style.textShadow = `0 0 15px ${mark.color}77`;
        detailMarkName.textContent = mark.name;

        // Render Dots
        stepDotsContainer.innerHTML = "";
        mark.rules.forEach((rule, idx) => {
            const dot = document.createElement("div");
            dot.className = `step-dot ${idx === 0 ? 'active' : ''}`;
            stepDotsContainer.appendChild(dot);
        });

        loadCurrentRuleStep();
        showScreen("detail-screen");
    }

    function loadCurrentRuleStep() {
        const mark = state.activeMark;
        const rule = mark.rules[state.activeStepIndex];
        const currentQuestion = rule.questions[state.activeQuestionIndex];

        // Update step indicators
        currentStepBadge.textContent = `Kural ${state.activeStepIndex + 1} / ${mark.rules.length}`;
        btnPrevRule.disabled = (state.activeStepIndex === 0);
        btnNextRule.disabled = (state.activeStepIndex === mark.rules.length - 1);
        const dots = stepDotsContainer.querySelectorAll(".step-dot");
        dots.forEach((dot, idx) => {
            if (idx === state.activeStepIndex) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });

        // Set rule text and details
        ruleTitle.textContent = rule.title;
        ruleDefinition.textContent = rule.ruleText;
        
        // Highlight active mark color on rule container border
        const ruleBox = document.querySelector(".rule-box p");
        ruleBox.style.borderLeftColor = mark.color;

        // Render 5 examples
        ruleExamplesList.innerHTML = "";
        rule.examples.forEach(exText => {
            const li = document.createElement("li");
            li.textContent = exText;
            ruleExamplesList.appendChild(li);
        });

        // Setup Quiz Question
        const quizBadge = document.querySelector(".quiz-badge");
        if (quizBadge) {
            quizBadge.textContent = `PRATİK SORUSU (${state.activeQuestionIndex + 1}/6)`;
        }
        quizQuestionText.textContent = currentQuestion.text;
        
        // Render 4 Options
        quizOptionsContainer.innerHTML = "";
        quizFeedbackArea.classList.add("hidden");
        btnNextStep.disabled = true;
        
        // Update Next Step Button Label
        btnNextStep.innerHTML = state.activeQuestionIndex < 5 
            ? 'Sonraki Soru <span class="arrow">→</span>' 
            : (state.activeStepIndex < mark.rules.length - 1 
                ? 'Sonraki Kural <span class="arrow">→</span>' 
                : 'Öğrenmeyi Bitir <span class="arrow">→</span>');

        const alphabet = ["A", "B", "C", "D"];
        currentQuestion.options.forEach((optText, index) => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerHTML = `
                <span class="option-prefix">${alphabet[index]}</span>
                <span class="option-text">${optText}</span>
            `;
            
            btn.addEventListener("click", () => {
                handleOptionSelect(index, currentQuestion.correctIndex, currentQuestion.explanation, rule.id);
            });

            quizOptionsContainer.appendChild(btn);
        });
    }

    function handleOptionSelect(selectedIndex, correctIndex, explanation, ruleId) {
        const buttons = quizOptionsContainer.querySelectorAll(".option-btn");
        const selectedBtn = buttons[selectedIndex];

        if (selectedIndex === correctIndex) {
            // Correct Answer
            selectedBtn.classList.add("correct");
            
            // Disable all buttons
            buttons.forEach(btn => btn.disabled = true);
            
            // Show Feedback
            feedbackTitle.textContent = "Tebrikler! Doğru Cevap.";
            feedbackExplanation.textContent = explanation;
            quizFeedbackArea.className = "feedback-area correct";
            
            // If it is the last question of the rule, mark the rule as completed
            if (state.activeQuestionIndex === 5) {
                state.userProgress.completedRules.add(ruleId);
                
                // Check if all rules for this mark are completed
                const allMarkRules = state.activeMark.rules;
                const completedAll = allMarkRules.every(r => state.userProgress.completedRules.has(r.id));
                if (completedAll) {
                    state.userProgress.completedMarks.add(state.activeMark.id);
                }
            }

            // Enable next step button
            btnNextStep.disabled = false;
        } else {
            // Incorrect Answer
            selectedBtn.classList.add("incorrect");
            selectedBtn.disabled = true;

            // Show Feedback
            feedbackTitle.textContent = "Tekrar Dene!";
            feedbackExplanation.textContent = "Seçtiğin kural bu cümle için uygun görünmüyor. Diğer seçenekleri değerlendirebilirsin.";
            quizFeedbackArea.className = "feedback-area incorrect";
        }
    }

    function handleNextStep() {
        const mark = state.activeMark;
        if (state.activeQuestionIndex < 5) {
            // Go to next question for the current rule
            state.activeQuestionIndex++;
            loadCurrentRuleStep();
        } else {
            // Completed all 6 questions for this rule. Proceed to next rule step.
            if (state.activeStepIndex < mark.rules.length - 1) {
                state.activeStepIndex++;
                state.activeQuestionIndex = 0;
                loadCurrentRuleStep();
            } else {
                // Completed all rules for this mark!
                alert(`Tebrikler! ${mark.name} konusundaki tüm kuralları başarıyla tamamladın!`);
                showScreen("home-screen");
            }
        }
    }

    /* ==========================================================================
       GENERAL ACTIVITY (100 LITERARY PARAGRAPHS): LOGIC
       ========================================================================== */
    function populateGaDropdown() {
        gaQuestionSelect.innerHTML = "";
        for (let i = 1; i <= generalActivityData.length; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = `Soru ${i}`;
            gaQuestionSelect.appendChild(opt);
        }
    }

    function renderUniverseSymbols(customSymbols) {
        universeSymbolsContainer.innerHTML = "";
        
        if (!customSymbols) {
            const prompt = document.createElement("p");
            prompt.className = "select-blank-prompt";
            prompt.textContent = "Seçenekleri görmek için metindeki bir boşluğa tıklayın.";
            universeSymbolsContainer.appendChild(prompt);
            return;
        }

        customSymbols.forEach(symbol => {
            const btn = document.createElement("button");
            btn.className = "universe-symbol-btn animate-fade-in";
            btn.textContent = symbol;
            
            btn.addEventListener("click", () => {
                handleUniverseSymbolClick(symbol);
            });

            universeSymbolsContainer.appendChild(btn);
        });
    }

    function renderSuccessMessage() {
        universeSymbolsContainer.innerHTML = "";
        const prompt = document.createElement("p");
        prompt.className = "select-blank-prompt success-prompt animate-fade-in";
        prompt.innerHTML = '🎉 <span style="font-weight: 600; color: #10B981;">Harika!</span> Tüm noktalama işaretlerini doğru yerleştirdiniz.';
        universeSymbolsContainer.appendChild(prompt);
    }

    function loadParagraph(qIndex) {
        state.activeParagraphIndex = qIndex;
        const paragraph = generalActivityData[qIndex];
        if (!paragraph) return;

        // Reset UI status
        state.activeBlankIndex = null;
        state.currentParagraphBlanks = [];

        // Update nav bar controls
        gaQuestionSelect.value = qIndex + 1;
        gaQuestionInput.value = qIndex + 1;
        gaProgressNumber.textContent = `Soru ${qIndex + 1} / ${generalActivityData.length}`;
        gaParagraphSource.textContent = paragraph.source;

        // Remove any existing overlay blank boxes from container
        const existingBoxes = gaParagraphImageContainer.querySelectorAll(".image-blank-box");
        existingBoxes.forEach(box => box.remove());

        // Set image source
        gaParagraphImage.src = paragraph.imagePath;

        // Create the absolute overlay boxes
        paragraph.blanks.forEach((blankData, idx) => {
            const blankEl = document.createElement("span");
            blankEl.className = "image-blank-box";
            blankEl.style.left = `${blankData.x}%`;
            blankEl.style.top = `${blankData.y}%`;
            blankEl.style.width = `${blankData.w}%`;
            blankEl.style.height = `${blankData.h}%`;
            blankEl.setAttribute("data-blank-index", idx);

            // Record blank answer details
            state.currentParagraphBlanks.push({
                index: idx,
                correctSymbol: blankData.correctSymbol,
                element: blankEl,
                solved: false,
                userAnswer: null
            });

            // Add overlay box to container
            gaParagraphImageContainer.appendChild(blankEl);
        });

        // Automatically activate the first blank box
        if (state.currentParagraphBlanks.length > 0) {
            setActiveBlank(0);
        } else {
            renderUniverseSymbols();
        }
    }

    function setActiveBlank(index) {
        // Clear previous active states
        state.currentParagraphBlanks.forEach(b => {
            if (b.element) {
                b.element.classList.remove("active");
            }
        });

        // Set active blank index
        const blank = state.currentParagraphBlanks[index];
        if (blank && !blank.solved) {
            state.activeBlankIndex = index;
            blank.element.classList.add("active");
            
            // Choose 4 options (correct + 3 random)
            const correct = blank.correctSymbol;
            const otherSymbols = universeSymbols.filter(s => s !== correct);
            const shuffledOthers = [...otherSymbols].sort(() => 0.5 - Math.random());
            const selectedOthers = shuffledOthers.slice(0, 3);
            const options = [correct, ...selectedOthers];
            const shuffledOptions = options.sort(() => 0.5 - Math.random());
            
            renderUniverseSymbols(shuffledOptions);
        }
    }

    function handleUniverseSymbolClick(symbol) {
        if (state.activeBlankIndex === null) {
            alert("Etkinlik tamamlandı! Sıradaki soruya geçebilirsiniz.");
            return;
        }

        const blank = state.currentParagraphBlanks[state.activeBlankIndex];
        if (!blank || blank.solved) return;

        // Check answer
        if (symbol === blank.correctSymbol) {
            // Correct Answer
            blank.solved = true;
            blank.userAnswer = symbol;
            
            // Animate placement
            blank.element.textContent = symbol;
            blank.element.className = "image-blank-box correct";
            
            // Clear current active selection
            state.activeBlankIndex = null;
            
            // Check if all blanks solved in this paragraph
            const allSolved = state.currentParagraphBlanks.every(b => b.solved);
            if (allSolved) {
                state.userProgress.solvedParagraphs.add(generalActivityData[state.activeParagraphIndex].id);
                updateGlobalProgress();
                renderSuccessMessage();
            } else {
                // Automatically transition to the next blank
                const nextIdx = blank.index + 1;
                if (nextIdx < state.currentParagraphBlanks.length) {
                    setActiveBlank(nextIdx);
                } else {
                    renderUniverseSymbols();
                }
            }
        } else {
            // Incorrect Answer: Red outline and shake, keep box contents blank/white
            blank.element.classList.add("incorrect", "shake");
            
            const targetEl = blank.element;
            setTimeout(() => {
                if (!blank.solved) {
                    targetEl.classList.remove("incorrect", "shake");
                }
            }, 800);
        }
    }

    function navigateQuestion(direction) {
        let newIndex = state.activeParagraphIndex + direction;
        if (newIndex >= 0 && newIndex < generalActivityData.length) {
            loadParagraph(newIndex);
        }
    }

    /* ==========================================================================
       EVENT LISTENERS
       ========================================================================== */
    function setupEventListeners() {
        // Screen Navigation
        btnGeneralActivity.addEventListener("click", () => {
            loadParagraph(0);
            showScreen("general-activity-screen");
        });

        btnBackToHome.addEventListener("click", () => {
            showScreen("home-screen");
        });

        btnGaBackToHome.addEventListener("click", () => {
            showScreen("home-screen");
        });

        // Rule navigation buttons
        btnPrevRule.addEventListener("click", () => {
            if (state.activeStepIndex > 0) {
                state.activeStepIndex--;
                state.activeQuestionIndex = 0;
                loadCurrentRuleStep();
            }
        });

        btnNextRule.addEventListener("click", () => {
            if (state.activeStepIndex < state.activeMark.rules.length - 1) {
                state.activeStepIndex++;
                state.activeQuestionIndex = 0;
                loadCurrentRuleStep();
            }
        });

        // Detail screen quiz navigation
        btnNextStep.addEventListener("click", () => {
            handleNextStep();
        });

        // General Activity navigation
        btnPrevQuestion.addEventListener("click", () => {
            navigateQuestion(-1);
        });

        btnNextQuestion.addEventListener("click", () => {
            navigateQuestion(1);
        });

        btnNextQuestionFooter.addEventListener("click", () => {
            navigateQuestion(1);
        });

        gaQuestionSelect.addEventListener("change", (e) => {
            const index = parseInt(e.target.value) - 1;
            loadParagraph(index);
        });

        gaQuestionInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                let val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= generalActivityData.length) {
                    loadParagraph(val - 1);
                    gaQuestionInput.blur();
                } else {
                    alert(`Lütfen 1 ile ${generalActivityData.length} arasında geçerli bir soru numarası girin.`);
                    gaQuestionInput.value = state.activeParagraphIndex + 1;
                }
            }
        });

        // Keyboard navigation shortcuts
        document.addEventListener("keydown", (e) => {
            if (state.currentScreen === "general-activity-screen") {
                // Ignore shortcuts if user is typing in the question number input
                if (document.activeElement === gaQuestionInput) return;

                if (e.key === "ArrowLeft") {
                    navigateQuestion(-1);
                } else if (e.key === "ArrowRight") {
                    navigateQuestion(1);
                }
            }
        });
    }

    /* ==========================================================================
       START APP
       ========================================================================== */
    init();
});
