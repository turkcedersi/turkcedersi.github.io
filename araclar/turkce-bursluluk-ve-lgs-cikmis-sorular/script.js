// Bursluluk Sınavı Türkçe Soru Pratiği - Frontend Logic

document.addEventListener("DOMContentLoaded", () => {
    // State Variables
    let database = null;
    let currentGrade = null;
    let currentYear = null;
    let currentQuestionIndex = 0;
    
    // Arrays for active session
    let questionNumbers = []; // list of string numbers, e.g. ["1", "2", ...]
    let answers = {}; // e.g. {"1": "A", "2": "C", ...}
    
    // User progress state (loaded/saved to localStorage)
    let userState = {}; 

    // Zoom and Pan variables
    let scale = 1.0;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // DOM Elements - Screens
    const landingScreen = document.getElementById("landing-screen");
    const quizScreen = document.getElementById("quiz-screen");
    const gradeSelectionArea = document.getElementById("grade-selection-area");
    const yearSelectionArea = document.getElementById("year-selection-area");

    // DOM Elements - Navigation / Headers
    const btnBackToGrades = document.getElementById("btn-back-to-grades");
    const selectedGradeLabel = document.getElementById("selected-grade-label");
    const yearsContainer = document.getElementById("years-container");
    
    const btnBackToMenu = document.getElementById("btn-back-to-menu");
    const badgeGrade = document.getElementById("badge-grade");
    const badgeYear = document.getElementById("badge-year");
    const trackerProgress = document.getElementById("tracker-progress");
    const progressFill = document.getElementById("progress-fill");
    const questionDropdown = document.getElementById("question-dropdown");
    const quickNavGrid = document.getElementById("quick-nav-grid");

    // DOM Elements - Option Buttons
    const optionButtons = document.querySelectorAll(".option-btn");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");

    // DOM Elements - Viewer
    const currentQuestionNum = document.getElementById("current-question-num");
    const questionImage = document.getElementById("question-image");
    const viewportContainer = document.getElementById("viewport-container");
    const zoomableWrapper = document.getElementById("zoomable-wrapper");

    // DOM Elements - Viewer Toolbar
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnZoomReset = document.getElementById("btn-zoom-reset");
    const btnFullscreen = document.getElementById("btn-fullscreen");

    // Load database on start
    fetch("assets/data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("data.json dosyası yüklenemedi!");
            }
            return response.json();
        })
        .then(data => {
            database = data;
            loadUserState();
            initLandingPage();
            lucide.createIcons();
        })
        .catch(error => {
            console.error("Yükleme hatası:", error);
            showToast("Hata", "Sınav veritabanı yüklenemedi. Lütfen sayfayı yenileyin.", "error", 5000);
        });

    // Load Progress State from localStorage
    function loadUserState() {
        const stored = localStorage.getItem("bursluluk_turkce_state");
        if (stored) {
            try {
                userState = JSON.parse(stored);
            } catch (e) {
                userState = {};
            }
        }
    }

    // Save Progress State
    function saveUserState() {
        localStorage.setItem("bursluluk_turkce_state", JSON.stringify(userState));
    }

    // Initialize Landing Page (Grade selection)
    function initLandingPage() {
        const gradeCards = document.querySelectorAll(".grade-card");
        gradeCards.forEach(card => {
            card.addEventListener("click", () => {
                const grade = card.getAttribute("data-grade");
                showYearSelection(grade);
            });
        });

        btnBackToGrades.addEventListener("click", () => {
            if (currentGrade === "8_lgs") {
                showYearSelection("8");
            } else {
                yearSelectionArea.classList.add("hidden");
                gradeSelectionArea.classList.remove("hidden");
            }
        });

        btnBackToMenu.addEventListener("click", () => {
            // Smooth exit from quiz to menu
            quizScreen.classList.remove("active");
            landingScreen.classList.add("active");
            yearSelectionArea.classList.add("hidden");
            gradeSelectionArea.classList.remove("hidden");
        });
    }

    // Show Year Selection Screen for selected grade
    function showYearSelection(grade) {
        currentGrade = grade;
        selectedGradeLabel.textContent = grade;
        
        // Clear previous cards
        yearsContainer.innerHTML = "";
        
        const gradeData = database.grades[grade];
        if (!gradeData || !gradeData.years) {
            showToast("Bilgi", "Seçilen sınıfa ait sınav verisi bulunamadı.", "error");
            return;
        }

        // Get sorted list of years
        const sortedYears = Object.keys(gradeData.years).sort((a, b) => b - a); // descending order
        
        sortedYears.forEach(year => {
            const yearCard = document.createElement("button");
            yearCard.className = "year-card";
            
            // Calculate solved progress for this grade and year
            const yearData = gradeData.years[year];
            const numQ = yearData.num_questions;
            let solvedCount = 0;
            
            for (let q = 1; q <= numQ; q++) {
                const stateKey = `${currentGrade}_${year}_${q}`;
                if (userState[stateKey] && userState[stateKey].correct) {
                    solvedCount++;
                }
            }

            yearCard.innerHTML = `
                <span>${year}</span>
                <span class="year-sub">${numQ} Soru ${solvedCount > 0 ? `(${solvedCount}/${numQ} Çözüldü)` : ''}</span>
            `;

            yearCard.addEventListener("click", () => {
                startQuiz(grade, year);
            });

            yearsContainer.appendChild(yearCard);
        });

        // Add special LGS card for Grade 8
        if (grade === "8" || grade === 8) {
            const lgsCard = document.createElement("button");
            lgsCard.className = "year-card lgs-card";
            lgsCard.innerHTML = `
                <span>LGS</span>
                <span class="year-sub">Sözel Türkçe Soruları</span>
            `;
            lgsCard.addEventListener("click", () => {
                showLgsYearSelection();
            });
            yearsContainer.appendChild(lgsCard);
        }

        // Toggle sections with simple animation
        gradeSelectionArea.classList.add("hidden");
        yearSelectionArea.classList.remove("hidden");
    }

    // Show LGS Year Selection Screen under Grade 8
    function showLgsYearSelection() {
        currentGrade = "8_lgs";
        selectedGradeLabel.textContent = "8. Sınıf LGS";
        
        // Clear previous cards
        yearsContainer.innerHTML = "";
        
        const gradeData = database.grades["8_lgs"];
        if (!gradeData || !gradeData.years) {
            showToast("Bilgi", "LGS sınav verisi bulunamadı.", "error");
            return;
        }

        // Get sorted list of years
        const sortedYears = Object.keys(gradeData.years).sort((a, b) => b - a); // descending order
        
        sortedYears.forEach(year => {
            const yearCard = document.createElement("button");
            yearCard.className = "year-card";
            
            // Calculate solved progress
            const yearData = gradeData.years[year];
            const numQ = yearData.num_questions;
            let solvedCount = 0;
            
            for (let q = 1; q <= numQ; q++) {
                const stateKey = `8_lgs_${year}_${q}`;
                if (userState[stateKey] && userState[stateKey].correct) {
                    solvedCount++;
                }
            }

            yearCard.innerHTML = `
                <span>${year}</span>
                <span class="year-sub">${numQ} Soru ${solvedCount > 0 ? `(${solvedCount}/${numQ} Çözüldü)` : ''}</span>
            `;

            yearCard.addEventListener("click", () => {
                startQuiz("8_lgs", year);
            });

            yearsContainer.appendChild(yearCard);
        });
    }

    // Start Quiz Screen
    function startQuiz(grade, year) {
        currentGrade = grade;
        currentYear = year;
        currentQuestionIndex = 0;

        const gradeData = database.grades[grade];
        const yearData = gradeData.years[year];

        answers = yearData.answers;
        // Collect question numbers as strings sorted numerically
        questionNumbers = Object.keys(yearData.questions).sort((a, b) => parseInt(a) - parseInt(b));

        // Update Headers & Info
        if (grade === "8_lgs") {
            badgeGrade.textContent = "8. Sınıf LGS";
        } else {
            badgeGrade.textContent = `${grade}. Sınıf`;
        }
        badgeYear.textContent = year;

        // Populate Dropdown
        questionDropdown.innerHTML = "";
        questionNumbers.forEach((qNum, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = `Soru ${qNum}`;
            questionDropdown.appendChild(opt);
        });

        // Event for dropdown selection change
        questionDropdown.onchange = (e) => {
            loadQuestion(parseInt(e.target.value));
        };

        // Populate Navigation Grid
        buildQuickNavGrid();

        // Load first question
        loadQuestion(0);

        // Switch Screen
        landingScreen.classList.remove("active");
        quizScreen.classList.add("active");
        
        // Reset full view zoom
        resetZoom();
    }

    // Build Quick Nav Grid (bottom navigation buttons)
    function buildQuickNavGrid() {
        if (!quickNavGrid) return;
        quickNavGrid.innerHTML = "";
        questionNumbers.forEach((qNum, idx) => {
            const navBtn = document.createElement("button");
            navBtn.className = "quick-nav-btn";
            navBtn.textContent = qNum;

            // Apply answered styling
            const stateKey = `${currentGrade}_${currentYear}_${qNum}`;
            if (userState[stateKey]) {
                if (userState[stateKey].correct) {
                    navBtn.classList.add("correct");
                } else {
                    navBtn.classList.add("incorrect");
                }
            }

            navBtn.addEventListener("click", () => {
                loadQuestion(idx);
            });
            quickNavGrid.appendChild(navBtn);
        });
    }

    // Load specific question details
    function loadQuestion(index) {
        if (index < 0 || index >= questionNumbers.length) return;
        currentQuestionIndex = index;
        const qNum = questionNumbers[index];

        // Update active index styling in quick nav
        if (quickNavGrid) {
            const navBtns = quickNavGrid.querySelectorAll(".quick-nav-btn");
            navBtns.forEach((btn, idx) => {
                if (idx === index) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        }

        // Update dropdown state
        questionDropdown.value = index;

        // Load Image
        const gradeData = database.grades[currentGrade];
        const yearData = gradeData.years[currentYear];
        const qData = yearData.questions[qNum];
        
        // Setup image source and loading status
        questionImage.style.opacity = "0.3";
        questionImage.src = qData.image_path;
        questionImage.onload = () => {
            questionImage.style.opacity = "1";
        };

        // Update Title
        currentQuestionNum.textContent = qNum;

        // Reset option buttons
        resetOptionButtons();

        // Check if question has already been answered in this session/localStorage
        const stateKey = `${currentGrade}_${currentYear}_${qNum}`;
        if (userState[stateKey]) {
            const selectedOpt = userState[stateKey].selected;
            const correctOpt = answers[qNum];

            optionButtons.forEach(btn => {
                const optLetter = btn.getAttribute("data-option");
                if (optLetter === selectedOpt) {
                    btn.classList.add(userState[stateKey].correct ? "correct" : "incorrect");
                }
                // Highlight the correct one anyway if they previously got it right/wrong
                if (optLetter === correctOpt && userState[stateKey].correct) {
                    btn.classList.add("correct");
                }
            });
        }

        // Update Progress Bar
        updateProgressBar();

        // Reset Zoom View
        resetZoom();

        // Control buttons disable logic
        btnPrev.disabled = index === 0;
        btnNext.disabled = index === questionNumbers.length - 1;
    }

    // Reset Option Button States
    function resetOptionButtons() {
        optionButtons.forEach(btn => {
            btn.className = "option-btn"; // Strip out correct/incorrect/selected classes
        });
    }

    // Update Progress Indicators
    function updateProgressBar() {
        const gradeData = database.grades[currentGrade];
        const yearData = gradeData.years[currentYear];
        const numQ = yearData.num_questions;
        
        let correctCount = 0;
        for (let q = 1; q <= numQ; q++) {
            const stateKey = `${currentGrade}_${currentYear}_${q}`;
            if (userState[stateKey] && userState[stateKey].correct) {
                correctCount++;
            }
        }

        trackerProgress.textContent = `${correctCount}/${numQ}`;
        const percent = (correctCount / numQ) * 100;
        progressFill.style.width = `${percent}%`;
    }

    // Option Buttons Click Handler
    optionButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const selectedOpt = btn.getAttribute("data-option");
            const qNum = questionNumbers[currentQuestionIndex];
            const correctOpt = answers[qNum];
            const stateKey = `${currentGrade}_${currentYear}_${qNum}`;

            // Reset current visual options
            resetOptionButtons();

            const isCorrect = selectedOpt === correctOpt;

            if (isCorrect) {
                btn.classList.add("correct");
                showToast("Tebrikler!", "Doğru seçeneği buldunuz. Harika!", "success");
                
                // Save state as correct
                userState[stateKey] = {
                    selected: selectedOpt,
                    correct: true
                };
                
                // Set quick nav status
                if (quickNavGrid) {
                    const activeNavBtn = quickNavGrid.children[currentQuestionIndex];
                    if (activeNavBtn) {
                        activeNavBtn.classList.remove("incorrect");
                        activeNavBtn.classList.add("correct");
                    }
                }
            } else {
                btn.classList.add("incorrect");
                showToast("Yanlış Cevap", "Bu şık doğru değil, tekrar deneyebilirsin.", "error");

                // Save state as incorrect (but allows changing)
                userState[stateKey] = {
                    selected: selectedOpt,
                    correct: false
                };

                if (quickNavGrid) {
                    const activeNavBtn = quickNavGrid.children[currentQuestionIndex];
                    if (activeNavBtn) {
                        activeNavBtn.classList.remove("correct");
                        activeNavBtn.classList.add("incorrect");
                    }
                }
            }

            saveUserState();
            updateProgressBar();
        });
    });

    // Quiz navigation controls
    btnPrev.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
            loadQuestion(currentQuestionIndex - 1);
        }
    });

    btnNext.addEventListener("click", () => {
        if (currentQuestionIndex < questionNumbers.length - 1) {
            loadQuestion(currentQuestionIndex + 1);
        }
    });

    // ZOOM AND PAN LOGIC
    function updateTransform() {
        zoomableWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1.0;
        panX = 0;
        panY = 0;
        updateTransform();
    }

    // Toolbar Buttons Events
    btnZoomIn.addEventListener("click", () => {
        scale = Math.min(5.0, scale + 0.25);
        updateTransform();
    });

    btnZoomOut.addEventListener("click", () => {
        scale = Math.max(0.5, scale - 0.25);
        updateTransform();
    });

    btnZoomReset.addEventListener("click", resetZoom);

    // Fullscreen Toggler
    btnFullscreen.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            viewportContainer.requestFullscreen()
                .then(() => {
                    btnFullscreen.innerHTML = `<i data-lucide="minimize"></i>`;
                    lucide.createIcons();
                })
                .catch(err => {
                    console.error("Fullscreen error:", err);
                });
        } else {
            document.exitFullscreen()
                .then(() => {
                    btnFullscreen.innerHTML = `<i data-lucide="expand"></i>`;
                    lucide.createIcons();
                });
        }
    });

    // Sync fullscreen icon change when exiting fullscreen via ESC key
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            btnFullscreen.innerHTML = `<i data-lucide="expand"></i>`;
            lucide.createIcons();
        }
    });

    // Viewport Dragging / Panning
    viewportContainer.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return; // Only left click drag
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        viewportContainer.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            viewportContainer.style.cursor = "grab";
        }
    });

    // Zooming with Mouse Wheel
    viewportContainer.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomSpeed = 0.08;
        
        // Calculate new scale
        const oldScale = scale;
        if (e.deltaY < 0) {
            scale = Math.min(5.0, scale + zoomSpeed);
        } else {
            scale = Math.max(0.5, scale - zoomSpeed);
        }

        // Adjust pans to zoom into the mouse cursor position (nice visual touch)
        const rect = viewportContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        panX = mouseX - (mouseX - panX) * (scale / oldScale);
        panY = mouseY - (mouseY - panY) * (scale / oldScale);

        updateTransform();
    }, { passive: false });

    // Double click viewport to reset zoom
    viewportContainer.addEventListener("dblclick", resetZoom);

    // Touch Support for Mobile Zoom/Pan
    let lastTouchX = 0;
    let lastTouchY = 0;
    let initialPinchDistance = 0;
    let initialScale = 1.0;

    viewportContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            isDragging = false;
            initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
            initialScale = scale;
        }
    }, { passive: true });

    viewportContainer.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length === 1) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            panX += currentX - lastTouchX;
            panY += currentY - lastTouchY;
            
            lastTouchX = currentX;
            lastTouchY = currentY;
            updateTransform();
        } else if (e.touches.length === 2) {
            const distance = getTouchDistance(e.touches[0], e.touches[1]);
            if (initialPinchDistance > 0) {
                const ratio = distance / initialPinchDistance;
                scale = Math.min(5.0, Math.max(0.5, initialScale * ratio));
                updateTransform();
            }
        }
    }, { passive: true });

    viewportContainer.addEventListener("touchend", () => {
        isDragging = false;
        initialPinchDistance = 0;
    });

    function getTouchDistance(t1, t2) {
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    // TOAST NOTIFICATIONS FUNCTION
    function showToast(title, msg, type = "success", duration = 3000) {
        const container = document.getElementById("toast-container");
        
        // Remove previous toast of the same type if it exists to avoid piling up
        const activeToasts = container.querySelectorAll(".toast");
        activeToasts.forEach(t => t.remove());

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        `;

        container.appendChild(toast);

        // Auto remove toast
        setTimeout(() => {
            toast.classList.add("exit");
            toast.addEventListener("animationend", () => {
                toast.remove();
            });
        }, duration);
    }
});
