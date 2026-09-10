// ==========================================================================
// MAARİF INTERACTIVE TEXTBOOK APPLICATION LOGIC
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  
  // --- APPLICATION STATE ---
  const state = {
    currentGrade: null,
    currentBook: null,
    currentView: "grades", // "grades", "books", "reader"
    currentPage: 12,       // Bir Kelime Seyyahı starts on page 12
    maxPages: 176,         // 0 to 176 index (177 pages total)
    zoom: 1.0,
    zoomMin: 0.5,
    zoomMax: 2.0,
    zoomStep: 0.15,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isPinching: false,
    pinchStartDist: 0,
    pinchStartZoom: 1.0,
    bookData: {},           // Loaded dynamically from assets/data/book_data.json
    revealedAnswers: {}     // Track in-page revealed answers: { "bookId_pNum_activityId": true }
  };

  // --- WHITEBOARD & PEN STATE ---
  const whiteboardState = {
    isActive: false,       // Drawing mode active
    tool: "pen",           // "pen" or "eraser"
    width: 5,              // stroke width in canvas pixels
    color: "#dc2626",      // default red classroom pen
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    menuOpen: false,
    drawings: {}           // Cached page drawings: { "bookId_pageNum": dataURL }
  };

  // --- DOM ELEMENTS ---
  const views = {
    grades: document.getElementById("view-grades"),
    books: document.getElementById("view-books"),
    reader: document.getElementById("view-reader")
  };

  const loadingOverlay = document.getElementById("loading-overlay");
  const toast = document.getElementById("toast");

  // Navigation Links
  const gradeCards = document.querySelectorAll(".grade-card");
  const bookCards = document.querySelectorAll(".book-card");
  const btnBackToGrades = document.getElementById("btn-back-to-grades");
  const btnBackToBooks = document.getElementById("btn-back-to-books");

  // Tools Modal Elements
  const toolsModal = document.getElementById("tools-modal");
  const btnOpenToolsCard = document.getElementById("btn-open-tools-card");
  const btnSidebarTools = document.getElementById("btn-sidebar-tools");
  const btnCloseToolsModal = document.getElementById("btn-close-tools-modal");

  // Whiteboard / Pen Elements
  const wbMenu = document.getElementById("wb-menu");
  const wbMenuClose = document.getElementById("wb-menu-close");
  const wbBtnMain = document.getElementById("wb-btn-main");
  const wbBtnExit = document.getElementById("wb-btn-exit");
  const wbActiveIndicator = document.getElementById("wb-active-indicator");
  const wbToolPen = document.getElementById("wb-tool-pen");
  const wbToolEraser = document.getElementById("wb-tool-eraser");
  const wbWidthBtns = document.querySelectorAll(".wb-width-btn");
  const wbColorBtns = document.querySelectorAll(".wb-color-btn");
  const wbBtnClear = document.getElementById("wb-btn-clear");
  const drawingCanvas = document.getElementById("drawing-canvas");
  const canvasCtx = drawingCanvas ? drawingCanvas.getContext("2d") : null;

  // Reader Controls
  const btnPrevPage = document.getElementById("btn-prev-page");
  const btnNextPage = document.getElementById("btn-next-page");
  const inputPage = document.getElementById("input-page");
  const pageImage = document.getElementById("page-image");
  const hotspotsOverlay = document.getElementById("hotspots-overlay");
  const qrLinksLayer = document.getElementById("qr-links-layer");
  const inpageAnswersLayer = document.getElementById("inpage-answers-layer");
  const outcomesList = document.getElementById("outcomes-list");
  const sidebarBookTitle = document.getElementById("sidebar-book-title");
  const sidebarDateBadge = document.getElementById("sidebar-date-badge");
  const sidebarDateText = document.getElementById("sidebar-date-text");
  
  // Zoom Controls
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const zoomValueText = document.getElementById("zoom-value");
  
  // Viewport Panning Elements
  const readerViewport = document.getElementById("reader-viewport");
  const bookContainer = document.getElementById("book-container");
  const pageWrapper = document.getElementById("page-wrapper");

  // Grade book group elements
  const bookGradeGroups = document.querySelectorAll(".book-grade-group");
  const booksViewTitle = document.getElementById("books-view-title");

  // --- INITIALIZATION ---
  initApp();

  async function initApp() {
    showLoading(true);
    try {
      // Fetch the textbook hotspots & answers data
      const response = await fetch("assets/data/book_data.json");
      if (!response.ok) {
        throw new Error("Veri dosyası yüklenemedi.");
      }
      state.bookData = await response.json();
      console.log("Book data successfully loaded:", state.bookData);
    } catch (error) {
      console.error("Initialization error:", error);
      showToast("Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
    } finally {
      showLoading(false);
    }

    setupEventListeners();
    updateView();
  }

  // --- EVENT LISTENERS setup ---
  function setupEventListeners() {
    
    // Grade Selection
    gradeCards.forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("tools-card")) return;
        const grade = card.dataset.grade;
        if (card.classList.contains("locked")) {
          showToast("Yakında eklenecektir.");
          return;
        }
        state.currentGrade = parseInt(grade);
        state.currentView = "books";
        updateView();
      });
    });

    function openToolsModal() {
      if (toolsModal) {
        toolsModal.classList.remove("hidden");
        toolsModal.classList.add("active");
      }
    }

    function closeToolsModal() {
      if (toolsModal) {
        toolsModal.classList.add("hidden");
        toolsModal.classList.remove("active");
      }
    }

    // Tools Modal Handlers
    if (btnOpenToolsCard) {
      btnOpenToolsCard.addEventListener("click", (e) => {
        e.stopPropagation();
        openToolsModal();
      });
    }

    if (btnSidebarTools) {
      btnSidebarTools.addEventListener("click", (e) => {
        e.stopPropagation();
        openToolsModal();
      });
    }

    if (btnCloseToolsModal) {
      btnCloseToolsModal.addEventListener("click", (e) => {
        e.stopPropagation();
        closeToolsModal();
      });
    }

    if (toolsModal) {
      toolsModal.addEventListener("click", (e) => {
        if (e.target === toolsModal) {
          closeToolsModal();
        }
      });
    }

    // Escape Key Handler for Modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeToolsModal();
        if (wbMenu && !wbMenu.classList.contains("hidden")) {
          wbMenu.classList.add("hidden");
          whiteboardState.menuOpen = false;
        }
      }
    });

    // Back to Grades
    btnBackToGrades.addEventListener("click", () => {
      saveCurrentPageDrawing();
      setPenActive(false);
      state.currentGrade = null;
      state.currentView = "grades";
      updateView();
    });

    // Book Selection
    bookCards.forEach(card => {
      card.addEventListener("click", () => {
        const book = card.dataset.book;
        if (card.classList.contains("locked")) {
          showToast("Yakında eklenecektir.");
          return;
        }
        state.currentBook = parseInt(book);
        state.currentView = "reader";
        
        // Set maxPages and start page based on selected book
        if (state.currentBook === 1) {
          state.maxPages = 176;
          state.currentPage = 12;
        } else if (state.currentBook === 2) {
          state.maxPages = 161;
          state.currentPage = 12;
        } else if (state.currentBook === 3) {
          state.maxPages = 182;
          state.currentPage = 12;
        } else if (state.currentBook === 4) {
          state.maxPages = 160;
          state.currentPage = 12;
        } else if (state.currentBook === 5) {
          state.maxPages = 176;
          state.currentPage = 11;
        } else if (state.currentBook === 6) {
          state.maxPages = 170;
          state.currentPage = 11;
        }

        // Auto-jump to date-matched text for Grade 7
        let autoJumpText = null;
        if (state.currentBook === 5 || state.currentBook === 6) {
          const jumpInfo = getAutoJumpPageForDate(state.currentBook);
          if (jumpInfo && jumpInfo.page) {
            state.currentPage = jumpInfo.page;
            autoJumpText = jumpInfo.title;
          }
        }
        
        if (sidebarBookTitle) {
          let bookNum = state.currentBook;
          if (state.currentBook === 3 || state.currentBook === 5) bookNum = 1;
          else if (state.currentBook === 4 || state.currentBook === 6) bookNum = 2;
          sidebarBookTitle.textContent = `${state.currentGrade}. Sınıf Türkçe (${bookNum}. Kitap)`;
        }
        
        updateView();
        loadPage(state.currentPage);
        if (autoJumpText) {
          showToast(`📅 Çalışma takvimine göre "${autoJumpText}" metni açıldı.`);
        }
      });
    });

    // Back to Books
    btnBackToBooks.addEventListener("click", () => {
      saveCurrentPageDrawing();
      setPenActive(false);
      state.currentBook = null;
      state.currentView = "books";
      if (sidebarDateBadge) sidebarDateBadge.classList.add("hidden");
      const outcomesGroup = document.querySelector(".outcomes-group");
      if (outcomesGroup) outcomesGroup.classList.add("hidden");
      updateView();
    });

    // Page Navigation Buttons
    btnPrevPage.addEventListener("click", () => {
      if (state.currentPage > 0) {
        loadPage(state.currentPage - 1);
      } else {
        showToast("Zaten ilk sayfadasınız.");
      }
    });

    btnNextPage.addEventListener("click", () => {
      if (state.currentPage < state.maxPages) {
        loadPage(state.currentPage + 1);
      } else {
        showToast("Zaten son sayfadasınız.");
      }
    });

    // Page Number Input Jump (Sayfa Geçişi)
    inputPage.addEventListener("change", (e) => {
      let enteredNum = parseInt(e.target.value);
      if (isNaN(enteredNum)) {
        inputPage.value = getPageDisplayNumber(state.currentBook, state.currentPage);
        return;
      }
      
      const maxDisplay = getPageDisplayNumber(state.currentBook, state.maxPages);
      if (enteredNum < 0) enteredNum = 0;
      if (enteredNum > maxDisplay) enteredNum = maxDisplay;
      
      const targetInternal = getInternalPageNumber(state.currentBook, enteredNum);
      loadPage(targetInternal);
    });

    // Zoom Controls
    btnZoomIn.addEventListener("click", () => {
      if (state.zoom < state.zoomMax) {
        setZoom(state.zoom + state.zoomStep);
      }
    });

    btnZoomOut.addEventListener("click", () => {
      if (state.zoom > state.zoomMin) {
        setZoom(state.zoom - state.zoomStep);
      }
    });

    // Setup Whiteboard and Smart Pen
    setupWhiteboard();

    // Panning & Dragging Viewport Controls
    bookContainer.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);

    // Touch support for mobile dragging & pinch-to-zoom
    bookContainer.addEventListener("touchstart", dragStartTouch, { passive: false });
    window.addEventListener("touchmove", dragMoveTouch, { passive: false });
    window.addEventListener("touchend", dragEndTouch);
    window.addEventListener("touchcancel", dragEndTouch);

    window.addEventListener("resize", updatePageCssVariables);
  }

  // --- VIEW ROUTING CONTROL ---
  function updateView() {
    // Hide all views first
    Object.values(views).forEach(view => {
      view.classList.remove("active");
    });

    // Show current view
    views[state.currentView].classList.add("active");

    // If showing books view, show correct grade group and title
    if (state.currentView === "books") {
      bookGradeGroups.forEach(group => {
        const grade = group.dataset.grade;
        if (grade == state.currentGrade) {
          group.classList.remove("hidden");
        } else {
          group.classList.add("hidden");
        }
      });
      if (booksViewTitle) {
        booksViewTitle.textContent = `${state.currentGrade}. Sınıf Türkçe Ders Kitapları`;
      }
    }
  }

  // --- PAGE NUMBER MAPPING HELPERS (SAYFA GEÇİŞİ) ---
  // 7. Sınıf (Kitap 5 ve 6) fiziksel kitaplarında İçindekiler 7. sayfadadır (6. sayfa boştur).
  // Görsel dosyaları 0-indeksli/kayık olduğundan arayüzde (Sayfa Geçişi) basılı sayfa numarasını gösterip yönlendiriyoruz.
  function getPageDisplayNumber(bookId, internalPage) {
    if ((bookId === 5 || bookId === 6) && internalPage >= 6) {
      return internalPage + 1;
    }
    return internalPage;
  }

  function getInternalPageNumber(bookId, displayNumber) {
    if ((bookId === 5 || bookId === 6) && displayNumber >= 7) {
      return displayNumber - 1;
    }
    return displayNumber;
  }

  function updatePageIndicator() {
    if (!inputPage) return;
    const maxDisplay = getPageDisplayNumber(state.currentBook, state.maxPages);
    inputPage.max = maxDisplay;
    const indicatorSpan = inputPage.parentElement ? inputPage.parentElement.querySelector("span") : null;
    if (indicatorSpan) {
      indicatorSpan.textContent = `/ ${maxDisplay}`;
    }
  }

  // --- PAGE LOADING & RENDERING ---
  function loadPage(pageNumber) {
    saveCurrentPageDrawing();

    state.currentPage = pageNumber;
    inputPage.value = getPageDisplayNumber(state.currentBook, pageNumber);
    updatePageIndicator();
    
    showLoading(true);
    
    // Set page image source based on current book
    const imgPath = `assets/pages/book${state.currentBook}/page_${pageNumber}.png`;
    pageImage.src = imgPath;
    
    pageImage.onload = async () => {
      try {
        if (pageImage.decode) {
          await pageImage.decode();
        }
      } catch (_) {}
      
      showLoading(false);
      resetZoomAndPan();
      initDrawingCanvasSize();
      restorePageDrawing(state.currentBook, pageNumber);
      renderHotspots(pageNumber);
      renderQrLinks(pageNumber);
      renderInPageAnswers(pageNumber);
      renderPageOutcomes(pageNumber);
      updateSidebarDateBadge(pageNumber);
    };

    pageImage.onerror = () => {
      showLoading(false);
      showToast(`Sayfa ${pageNumber} yüklenemedi. Asset dosyası eksik olabilir.`);
      initDrawingCanvasSize();
      restorePageDrawing(state.currentBook, pageNumber);
      renderHotspots(pageNumber); // clear previous hotspots anyway
      renderQrLinks(pageNumber);
      renderInPageAnswers(pageNumber);
      renderPageOutcomes(pageNumber);
      updateSidebarDateBadge(pageNumber);
    };
  }

  // --- RENDERING HOTSPOTS ---
  function renderHotspots(pageNumber) {
    // Clear existing hotspots (inline buttons are removed in this version)
    hotspotsOverlay.innerHTML = "";
  }

  // --- RENDERING QR CODE HOTSPOT LINKS ---
  function renderQrLinks(pageNumber) {
    if (!qrLinksLayer) return;
    qrLinksLayer.innerHTML = "";

    const qrKey = `book${state.currentBook}_qr_links`;
    const pageKey = pageNumber.toString();
    const pageLinks = state.bookData[qrKey] ? state.bookData[qrKey][pageKey] : null;

    if (!pageLinks || !Array.isArray(pageLinks) || pageLinks.length === 0) return;

    pageLinks.forEach(link => {
      const a = document.createElement("a");
      a.className = "qr-hotspot-link";
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.left = `${link.left}%`;
      a.style.top = `${link.top}%`;
      a.style.width = `${link.width}%`;
      a.style.height = `${link.height}%`;
      
      // Stop event propagation to avoid triggering pan/drag when clicking the QR link
      a.addEventListener("click", (e) => {
        if (whiteboardState.isActive) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
      });
      a.addEventListener("mousedown", (e) => {
        if (!whiteboardState.isActive) {
          e.stopPropagation();
        }
      });
      a.addEventListener("touchstart", (e) => {
        if (!whiteboardState.isActive) {
          e.stopPropagation();
        }
      }, { passive: true });

      qrLinksLayer.appendChild(a);
    });
  }

  // --- MAGIC SPARKLE BURST PARTICLES ---
  function triggerSparkleBurst(leftPercent, topPercent) {
    if (!inpageAnswersLayer) return;

    const count = 7;
    const colors = ["#00f5d4", "#38bdf8", "#7dd3fc", "#a7f3d0", "#ffffff", "#00f5d4", "#38bdf8"];
    
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "magic-particle";
      
      const angle = (i * (360 / count) + (Math.random() * 24 - 12)) * (Math.PI / 180);
      const distance = 24 + Math.random() * 22; // 24px - 46px
      const tx = Math.round(Math.cos(angle) * distance);
      const ty = Math.round(Math.sin(angle) * distance);
      const rot = Math.round(Math.random() * 180 - 90);
      const size = Math.round(6 + Math.random() * 5); // 6px - 11px

      p.style.setProperty("--tx", `${tx}px`);
      p.style.setProperty("--ty", `${ty}px`);
      p.style.setProperty("--rot", `${rot}deg`);
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${leftPercent}%`;
      p.style.top = `${topPercent}%`;
      p.style.margin = "10px 0 0 10px"; // Center relative to 30px button
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = `0 0 6px ${colors[i % colors.length]}`;
      
      // 4-point sparkle star
      p.style.clipPath = "polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)";

      inpageAnswersLayer.appendChild(p);
      setTimeout(() => {
        if (p.parentNode) p.remove();
      }, 700);
    }
  }

  // --- RENDERING IN-PAGE HANDWRITTEN ANSWERS ---
  function renderInPageAnswers(pageNumber) {
    if (!inpageAnswersLayer) return;
    inpageAnswersLayer.innerHTML = "";
    // Render in-page answers for active book

    const answersKey = `book${state.currentBook}_inpage_answers`;
    const pageAnswers = state.bookData[answersKey] ? state.bookData[answersKey][pageNumber.toString()] : null;

    if (!pageAnswers || !Array.isArray(pageAnswers)) return;

    pageAnswers.forEach(activity => {
      const storageKey = `book${state.currentBook}_p${pageNumber}_${activity.id}`;
      const isRevealed = !!state.revealedAnswers[storageKey];

      // 1. Render Activity Toggle Button (Magic Wand with Sparkles)
      if (activity.button) {
        const btn = document.createElement("button");
        btn.className = `activity-ans-btn ${isRevealed ? "active" : ""}`;
        btn.style.left = `${activity.button.left}%`;
        btn.style.top = `${activity.button.top}%`;
        btn.innerHTML = `
          <svg class="magic-wand-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="wand-shaft" d="M4.5 19.5L13 11" stroke-width="2.2" stroke-linecap="round"/>
            <path class="wand-tip" d="M13 11L15.5 8.5" stroke-width="2.4" stroke-linecap="round"/>
            <path class="wand-sparkle-main" d="M18 2C18 3.8 19.2 5 21 5C19.2 5 18 6.2 18 8C18 6.2 16.8 5 15 5C16.8 5 18 3.8 18 2Z"/>
            <path class="wand-sparkle-sub" d="M10 3C10 4.2 10.8 5 12 5C10.8 5 10 5.8 10 7C10 5.8 9.2 5 8 5C9.2 5 10 4.2 10 3Z"/>
            <circle class="wand-sparkle-dot" cx="19" cy="11" r="0.9"/>
          </svg>
        `;
        btn.title = isRevealed ? "Cevapları Gizle" : "Cevapları Göster";
        btn.setAttribute("type", "button");
        btn.setAttribute("aria-label", isRevealed ? "Cevapları Gizle" : "Cevapları Göster");

        // 2. Render Activity Answer Items
        const itemEls = [];
        if (activity.items && Array.isArray(activity.items)) {
          activity.items.forEach(item => {
            const itemEl = document.createElement("div");
            let typeClass = "inpage-ans-lines";
            if (item.type === "badge") typeClass = "inpage-ans-badge";
            else if (item.type === "box") typeClass = "inpage-ans-box";
            else if (item.type === "mark") typeClass = "inpage-ans-mark";
            else if (item.type === "blank") typeClass = "inpage-ans-blank";
            else if (item.type === "underline") typeClass = "inpage-ans-underline";

            itemEl.className = `inpage-ans-item ${typeClass} ${isRevealed ? "visible" : ""}`;
            itemEl.style.left = `${item.left}%`;
            itemEl.style.top = `${item.top}%`;
            itemEl.style.width = `${item.width}%`;
            if (item.height) {
              itemEl.style.height = `${item.height}%`;
            }
            itemEl.textContent = item.text;
            inpageAnswersLayer.appendChild(itemEl);
            itemEls.push(itemEl);
          });
        }

        // Toggle action
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const nextState = !state.revealedAnswers[storageKey];
          state.revealedAnswers[storageKey] = nextState;

          // Wand tap gesture animation
          btn.classList.add("tap-anim");
          setTimeout(() => btn.classList.remove("tap-anim"), 380);

          if (nextState) {
            btn.classList.add("active");
            btn.title = "Cevapları Gizle";
            btn.setAttribute("aria-label", "Cevapları Gizle");
            itemEls.forEach(el => el.classList.add("visible"));
            triggerSparkleBurst(activity.button.left, activity.button.top);
          } else {
            btn.classList.remove("active");
            btn.title = "Cevapları Göster";
            btn.setAttribute("aria-label", "Cevapları Göster");
            itemEls.forEach(el => el.classList.remove("visible"));
          }
        });

        inpageAnswersLayer.appendChild(btn);
      }
    });
  }

  // --- RENDERING PAGE-BASED OUTCOMES ---
  function renderPageOutcomes(pageNumber) {
    if (!outcomesList) return;
    outcomesList.innerHTML = "";
    const outcomesGroup = document.querySelector(".outcomes-group");
    const outcomesKey = `book${state.currentBook}_outcomes`;
    
    // Kitap için öğrenme çıktıları veri havuzu tanımlı değilse bölümü tamamen gizle
    if (!state.bookData || !state.bookData[outcomesKey]) {
      if (outcomesGroup) outcomesGroup.classList.add("hidden");
      return;
    }
    
    const pageKey = pageNumber.toString();
    const pageOutcomes = state.bookData[outcomesKey] ? state.bookData[outcomesKey][pageKey] : null;
    
    // Sayfada tanımlı öğrenme çıktısı yoksa bölümü tamamen gizle
    if (!pageOutcomes || pageOutcomes.length === 0) {
      if (outcomesGroup) outcomesGroup.classList.add("hidden");
      return;
    }
    
    // Sayfada öğrenme çıktıları varsa bölümü görünür yap
    if (outcomesGroup) outcomesGroup.classList.remove("hidden");
    
    pageOutcomes.forEach(outcome => {
      const match = outcome.match(/^([A-Z\.\d\-]+)\s+(.+)$/i);
      const item = document.createElement("div");
      item.className = "outcome-item";
      
      if (match) {
        const code = match[1];
        const desc = match[2];
        item.innerHTML = `<span class="outcome-code">${code}</span><span class="outcome-desc">${desc}</span>`;
      } else {
        item.innerHTML = `<span class="outcome-desc">${outcome}</span>`;
      }
      
      outcomesList.appendChild(item);
    });
  }

  // --- 7. SINIF DERS İŞLENİŞ TAKVİMİ & AKILLI TARİH YÖNLENDİRME ---
  const GRADE7_SCHEDULE = {
    5: [ // 7. Sınıf 1. Kitap
      { title: "Martı Jonathan Livingston", dateText: "14 - 22 Eylül", sm: 9, sd: 14, em: 9, ed: 22, startPage: 11, endPage: 28, openPage: 11 },
      { title: "Gençliğin Kıymeti", dateText: "23 Eylül - 01 Ekim", sm: 9, sd: 23, em: 10, ed: 1, startPage: 29, endPage: 40, openPage: 29 },
      { title: "Sen Sor O Yanıtlasın - Sporda ve Yaşamda Hedefe Odaklan", dateText: "02 - 09 Ekim", sm: 10, sd: 2, em: 10, ed: 9, startPage: 41, endPage: 49, openPage: 41 },
      { title: "Adını Göklere Yazdıran Çocuk", dateText: "12 - 20 Ekim", sm: 10, sd: 12, em: 10, ed: 20, startPage: 50, endPage: 74, openPage: 50 },
      { title: "Bayrağımız Altında", dateText: "26 Ekim - 04 Kasım", sm: 10, sd: 26, em: 11, ed: 4, startPage: 75, endPage: 83, openPage: 75 },
      { title: "Mustafa 1881-1920 Tarihe Atılan İmza", dateText: "05 - 13 Kasım", sm: 11, sd: 5, em: 11, ed: 13, startPage: 84, endPage: 93, openPage: 84 },
      { title: "Milli Mücadele Sergisi Kahraman Çocuklar", dateText: "23 Kasım - 01 Aralık", sm: 11, sd: 23, em: 12, ed: 1, startPage: 94, endPage: 100, openPage: 94 },
      { title: "Mustafa Kemal'in Kağnısı", dateText: "02 - 09 Aralık", sm: 12, sd: 2, em: 12, ed: 9, startPage: 101, endPage: 120, openPage: 101 },
      { title: "Eskici", dateText: "14 - 22 Aralık", sm: 12, sd: 14, em: 12, ed: 22, startPage: 121, endPage: 132, openPage: 121 },
      { title: "Ya Hayır Söyle…", dateText: "22 - 31 Aralık", sm: 12, sd: 22, em: 12, ed: 31, startPage: 133, endPage: 142, openPage: 133 },
      { title: "Dijital Tayfa - Komik mi Şimdi?", dateText: "04 - 12 Ocak", sm: 1, sd: 4, em: 1, ed: 12, startPage: 143, endPage: 154, openPage: 143 },
      { title: "Öğüt", dateText: "13 - 20 Ocak", sm: 1, sd: 13, em: 1, ed: 20, startPage: 155, endPage: 176, openPage: 155 }
    ],
    6: [ // 7. Sınıf 2. Kitap
      { title: "Anadolu'da Kilim Demek", dateText: "08 - 16 Şubat", sm: 2, sd: 8, em: 2, ed: 16, startPage: 11, endPage: 22, openPage: 11 },
      { title: "Geleneksel Türk Tiyatrosu", dateText: "17 - 24 Şubat", sm: 2, sd: 17, em: 2, ed: 24, startPage: 23, endPage: 36, openPage: 23 },
      { title: "Ebru: Türk Kâğıt Süsleme Sanatı", dateText: "25 Şubat - 05 Mart", sm: 2, sd: 25, em: 3, ed: 5, startPage: 37, endPage: 45, openPage: 37 },
      { title: "Süleymaniye", dateText: "15 - 23 Mart", sm: 3, sd: 15, em: 3, ed: 23, startPage: 46, endPage: 66, openPage: 46 },
      { title: "Çocuklar Soruyor İlber Hoca Cevaplıyor Gazi Mustafa Kemal Atatürk", dateText: "26 Mart - 05 Nisan", sm: 3, sd: 26, em: 4, ed: 5, startPage: 67, endPage: 77, openPage: 67 },
      { title: "Kitap", dateText: "06 - 14 Nisan", sm: 4, sd: 6, em: 4, ed: 14, startPage: 78, endPage: 88, openPage: 78 },
      { title: "Küçük Şeylerin Hikâyesi: Kütüphaneler", dateText: "15 - 26 Nisan", sm: 4, sd: 15, em: 4, ed: 26, startPage: 89, endPage: 98, openPage: 89 },
      { title: "Kitaplarla Kurulan Dostluk", dateText: "27 Nisan - 05 Mayıs", sm: 4, sd: 27, em: 5, ed: 5, startPage: 99, endPage: 116, openPage: 99 },
      { title: "Kutadgu Bilig", dateText: "10 - 21 Mayıs", sm: 5, sd: 10, em: 5, ed: 21, startPage: 117, endPage: 128, openPage: 117 },
      { title: "Siyah İnci", dateText: "24 Mayıs - 01 Haziran", sm: 5, sd: 24, em: 6, ed: 1, startPage: 129, endPage: 137, openPage: 129 },
      { title: "Çocuk Hakları Sözleşmesi", dateText: "02 - 09 Haziran", sm: 6, sd: 2, em: 6, ed: 9, startPage: 138, endPage: 146, openPage: 138 },
      { title: "Üç Soru", dateText: "10 - 16 Haziran", sm: 6, sd: 10, em: 6, ed: 16, startPage: 147, endPage: 170, openPage: 147 }
    ]
  };

  function getSchoolYearDay(month, day) {
    const offsets = { 9: 0, 10: 30, 11: 61, 12: 91, 1: 122, 2: 153, 3: 182, 4: 213, 5: 243, 6: 274, 7: 304, 8: 335 };
    return (offsets[month] !== undefined ? offsets[month] : 0) + day;
  }

  function getAutoJumpPageForDate(bookId) {
    const list = GRADE7_SCHEDULE[bookId];
    if (!list) return null;

    const now = new Date();
    const curMonth = now.getMonth() + 1; // 1-12
    const curDay = now.getDate();
    const todaySY = getSchoolYearDay(curMonth, curDay);

    // 1. Birebir aralık eşleşmesi
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sDay = getSchoolYearDay(item.sm, item.sd);
      const eDay = getSchoolYearDay(item.em, item.ed);
      if (todaySY >= sDay && todaySY <= eDay) {
        return { page: item.openPage, title: item.title, dateText: item.dateText };
      }
    }

    // 2. Hafta sonu / tatil / boşluk günlerinde sıradaki ilk işlenecek metin
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const sDay = getSchoolYearDay(item.sm, item.sd);
      if (todaySY < sDay) {
        return { page: item.openPage, title: item.title, dateText: item.dateText };
      }
    }

    // 3. Yaz tatili veya dönem dışı günlerde ilk metin
    return { page: list[0].openPage, title: list[0].title, dateText: list[0].dateText };
  }

  function updateSidebarDateBadge(pageNumber) {
    if (!sidebarDateBadge || !sidebarDateText) return;

    // Yalnızca 7. sınıf (Kitap 5 ve Kitap 6) için aktiftir
    if (state.currentBook !== 5 && state.currentBook !== 6) {
      sidebarDateBadge.classList.add("hidden");
      return;
    }

    // Kapak ve içindekiler gibi ön sayfalarda (0-10) gizlenir
    if (pageNumber < 11) {
      sidebarDateBadge.classList.add("hidden");
      return;
    }

    const list = GRADE7_SCHEDULE[state.currentBook];
    if (!list) {
      sidebarDateBadge.classList.add("hidden");
      return;
    }

    // Sayfa numarasını kapsayan metni bul
    let matchedItem = null;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (pageNumber >= item.startPage && pageNumber <= item.endPage) {
        matchedItem = item;
        break;
      }
    }

    if (matchedItem) {
      sidebarDateText.textContent = matchedItem.dateText;
      sidebarDateBadge.title = `MEB İşleniş Takvimi: ${matchedItem.title} (${matchedItem.dateText})`;
      sidebarDateBadge.classList.remove("hidden");
    } else {
      sidebarDateBadge.classList.add("hidden");
    }
  }

  // --- ZOOM & PAN LOGIC ---
  function setZoom(val) {
    state.zoom = Math.round(val * 100) / 100;
    zoomValueText.textContent = `${Math.round(state.zoom * 100)}%`;
    applyZoomAndPan();
  }

  function applyZoomAndPan() {
    const scaleFactor = state.zoom * 2.25;
    pageWrapper.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${scaleFactor})`;
  }

  function resetZoomAndPan() {
    state.zoom = 1.0;
    state.pan.x = 0;
    state.pan.y = 0;
    zoomValueText.textContent = "100%";
    applyZoomAndPan();
  }

  // Mouse Dragging Panning
  function dragStart(e) {
    if (whiteboardState.isActive) return;
    state.isDragging = true;
    state.dragStart.x = e.clientX - state.pan.x;
    state.dragStart.y = e.clientY - state.pan.y;
    bookContainer.style.cursor = "grabbing";
  }

  function dragMove(e) {
    if (whiteboardState.isActive || !state.isDragging) return;
    state.pan.x = e.clientX - state.dragStart.x;
    state.pan.y = e.clientY - state.dragStart.y;
    
    // Bounds check to avoid panning out of view
    const scaleFactor = state.zoom * 2.25;
    const boundX = (scaleFactor - 1) * pageImage.clientWidth * 0.5;
    const boundY = (scaleFactor - 1) * pageImage.clientHeight * 0.5;
    
    state.pan.x = Math.max(-boundX, Math.min(boundX, state.pan.x));
    state.pan.y = Math.max(-boundY, Math.min(boundY, state.pan.y));
    
    applyZoomAndPan();
  }

  function dragEnd() {
    state.isDragging = false;
    if (!whiteboardState.isActive) {
      bookContainer.style.cursor = "grab";
    }
  }

  // Touch Support Panning & Two-Finger Pinch Zoom (Akıllı Tahta İki Parmak Yakınlaştırma)
  function dragStartTouch(e) {
    if (whiteboardState.isActive) return;
    if (e.touches.length === 2) {
      state.isDragging = false;
      state.isPinching = true;
      state.pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      state.pinchStartZoom = state.zoom;
    } else if (e.touches.length === 1) {
      state.isPinching = false;
      state.isDragging = true;
      const touch = e.touches[0];
      state.dragStart.x = touch.clientX - state.pan.x;
      state.dragStart.y = touch.clientY - state.pan.y;
    }
  }

  function dragMoveTouch(e) {
    if (whiteboardState.isActive) return;
    
    // Two-finger pinch to zoom on book page only (sidebar remains fixed)
    if (e.touches.length === 2 && state.isPinching) {
      if (e.cancelable) e.preventDefault(); // Stop entire browser page from zooming
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (state.pinchStartDist > 0) {
        const factor = currentDist / state.pinchStartDist;
        const targetZoom = Math.min(state.zoomMax, Math.max(state.zoomMin, state.pinchStartZoom * factor));
        setZoom(targetZoom);
      }
      return;
    }

    if (!state.isDragging || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault(); // Prevent page scrolling during drag
    const touch = e.touches[0];
    state.pan.x = touch.clientX - state.dragStart.x;
    state.pan.y = touch.clientY - state.dragStart.y;
    
    const scaleFactor = state.zoom * 2.25;
    const boundX = (scaleFactor - 1) * pageImage.clientWidth * 0.5;
    const boundY = (scaleFactor - 1) * pageImage.clientHeight * 0.5;
    
    state.pan.x = Math.max(-boundX, Math.min(boundX, state.pan.x));
    state.pan.y = Math.max(-boundY, Math.min(boundY, state.pan.y));
    
    applyZoomAndPan();
  }

  function dragEndTouch(e) {
    if (e.touches.length < 2) {
      state.isPinching = false;
    }
    if (e.touches.length === 0) {
      state.isDragging = false;
      if (!whiteboardState.isActive) {
        bookContainer.style.cursor = "grab";
      }
    }
  }

  // --- WHITEBOARD & SMART PEN SYSTEM ---
  function setupWhiteboard() {
    if (!drawingCanvas || !canvasCtx) return;

    // Toggle menu or activate on FAB click
    if (wbBtnMain) {
      wbBtnMain.addEventListener("click", () => {
        whiteboardState.menuOpen = !whiteboardState.menuOpen;
        if (whiteboardState.menuOpen) {
          wbMenu.classList.remove("hidden");
          if (!whiteboardState.isActive) {
            setPenActive(true);
          }
        } else {
          wbMenu.classList.add("hidden");
        }
      });
    }

    // Exit / Leave pen mode
    if (wbBtnExit) {
      wbBtnExit.addEventListener("click", () => {
        setPenActive(false);
        showToast("Kalem bırakıldı. Sayfa gezinme modu aktif.");
      });
    }

    // Close menu button
    if (wbMenuClose) {
      wbMenuClose.addEventListener("click", () => {
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    }

    if (wbToolPen) {
      wbToolPen.addEventListener("click", () => {
        whiteboardState.tool = "pen";
        wbToolPen.classList.add("active");
        if (wbToolEraser) wbToolEraser.classList.remove("active");
        document.body.classList.remove("drawing-tool-eraser");
        updateActiveIndicator();
        updateWhiteboardCursor();
        setPenActive(true);
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    }

    if (wbToolEraser) {
      wbToolEraser.addEventListener("click", () => {
        whiteboardState.tool = "eraser";
        wbToolEraser.classList.add("active");
        if (wbToolPen) wbToolPen.classList.remove("active");
        document.body.classList.add("drawing-tool-eraser");
        updateActiveIndicator();
        updateWhiteboardCursor();
        setPenActive(true);
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    }

    // Width buttons
    wbWidthBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        wbWidthBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        whiteboardState.width = parseInt(btn.dataset.width) || 5;
        setPenActive(true);
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    });

    // Color buttons
    wbColorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        wbColorBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        whiteboardState.color = btn.dataset.color || "#dc2626";
        whiteboardState.tool = "pen";
        if (wbToolPen) wbToolPen.classList.add("active");
        if (wbToolEraser) wbToolEraser.classList.remove("active");
        document.body.classList.remove("drawing-tool-eraser");
        updateActiveIndicator();
        updateWhiteboardCursor();
        setPenActive(true);
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    });

    // Clear drawings on current page
    if (wbBtnClear) {
      wbBtnClear.addEventListener("click", () => {
        canvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        const key = `${state.currentBook}_${state.currentPage}`;
        delete whiteboardState.drawings[key];
        showToast("Bu sayfadaki çizimler temizlendi.");
        wbMenu.classList.add("hidden");
        whiteboardState.menuOpen = false;
      });
    }

    // Pointer Events on Canvas for drawing
    drawingCanvas.addEventListener("pointerdown", onPointerDown);
    drawingCanvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function getPenCursor(color = "#dc2626") {
    const encodedColor = encodeURIComponent(color);
    const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M2 28 L6 20 L20 6 L23 3 L26 6 L24 10 L10 24 Z' fill='none' stroke='%23ffffff' stroke-width='3.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3Cpath d='M20 6 L23 3 L26 6 L24 10 Z' fill='%2394a3b8' stroke='%230f172a' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M6 20 L20 6 L24 10 L10 24 Z' fill='${encodedColor}' stroke='%230f172a' stroke-width='1.8' stroke-linejoin='round'/%3E%3Cline x1='8' y1='19' x2='21' y2='6' stroke='%23ffffff' stroke-opacity='0.35' stroke-width='1.2' stroke-linecap='round'/%3E%3Cline x1='21' y1='8' x2='13' y2='16' stroke='%23f8fafc' stroke-width='2.2' stroke-linecap='round'/%3E%3Cline x1='21' y1='8' x2='13' y2='16' stroke='%230f172a' stroke-width='0.8' stroke-linecap='round'/%3E%3Cpath d='M2 28 L6 20 L10 24 Z' fill='%23e2e8f0' stroke='%230f172a' stroke-width='1.8' stroke-linejoin='round'/%3E%3Cline x1='6' y1='20' x2='10' y2='24' stroke='%23f59e0b' stroke-width='1.8' stroke-linecap='round'/%3E%3Ccircle cx='2.5' cy='27.5' r='1.2' fill='${encodedColor}'/%3E%3C/svg%3E`;
    return `url("data:image/svg+xml,${svg}") 2 28, default`;
  }

  function updateWhiteboardCursor() {
    if (!whiteboardState.isActive) {
      if (drawingCanvas) drawingCanvas.style.removeProperty("cursor");
      if (bookContainer) bookContainer.style.removeProperty("cursor");
      return;
    }
    if (whiteboardState.tool === "eraser") {
      if (drawingCanvas) drawingCanvas.style.removeProperty("cursor");
      if (bookContainer) bookContainer.style.removeProperty("cursor");
    } else {
      const cursorVal = getPenCursor(whiteboardState.color || "#dc2626");
      if (drawingCanvas) drawingCanvas.style.setProperty("cursor", cursorVal, "important");
      if (bookContainer) bookContainer.style.setProperty("cursor", cursorVal, "important");
    }
  }

  function setPenActive(active) {
    whiteboardState.isActive = active;
    if (active) {
      document.body.classList.add("drawing-mode-active");
      if (whiteboardState.tool === "eraser") {
        document.body.classList.add("drawing-tool-eraser");
      } else {
        document.body.classList.remove("drawing-tool-eraser");
      }
      if (wbBtnExit) wbBtnExit.classList.remove("hidden");
      if (wbBtnMain) wbBtnMain.classList.add("active-pen");
      updateActiveIndicator();
      updateWhiteboardCursor();
    } else {
      document.body.classList.remove("drawing-mode-active");
      document.body.classList.remove("drawing-tool-eraser");
      if (wbBtnExit) wbBtnExit.classList.add("hidden");
      if (wbBtnMain) wbBtnMain.classList.remove("active-pen");
      if (wbMenu) wbMenu.classList.add("hidden");
      whiteboardState.menuOpen = false;
      saveCurrentPageDrawing();
      updateWhiteboardCursor();
    }
  }

  function updateActiveIndicator() {
    if (!wbActiveIndicator) return;
    if (whiteboardState.tool === "eraser") {
      wbActiveIndicator.style.background = "#ffffff";
    } else {
      wbActiveIndicator.style.background = whiteboardState.color;
    }
  }

  function getCanvasCoords(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(e) {
    if (!whiteboardState.isActive) return;
    e.preventDefault();
    whiteboardState.isDrawing = true;
    try {
      drawingCanvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    const { x, y } = getCanvasCoords(e);
    whiteboardState.lastX = x;
    whiteboardState.lastY = y;

    // Draw single dot on tap/click
    canvasCtx.beginPath();
    if (whiteboardState.tool === "eraser") {
      canvasCtx.globalCompositeOperation = "destination-out";
      canvasCtx.arc(x, y, whiteboardState.width * 2.5, 0, Math.PI * 2);
      canvasCtx.fill();
    } else {
      canvasCtx.globalCompositeOperation = "source-over";
      canvasCtx.fillStyle = whiteboardState.color;
      canvasCtx.arc(x, y, whiteboardState.width / 2, 0, Math.PI * 2);
      canvasCtx.fill();
    }
  }

  function onPointerMove(e) {
    if (!whiteboardState.isDrawing || !whiteboardState.isActive) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);

    canvasCtx.beginPath();
    canvasCtx.moveTo(whiteboardState.lastX, whiteboardState.lastY);
    canvasCtx.lineTo(x, y);
    canvasCtx.lineCap = "round";
    canvasCtx.lineJoin = "round";

    if (whiteboardState.tool === "eraser") {
      canvasCtx.globalCompositeOperation = "destination-out";
      canvasCtx.lineWidth = whiteboardState.width * 5; // Wide eraser for convenience
    } else {
      canvasCtx.globalCompositeOperation = "source-over";
      canvasCtx.strokeStyle = whiteboardState.color;
      canvasCtx.lineWidth = whiteboardState.width;
    }
    canvasCtx.stroke();

    whiteboardState.lastX = x;
    whiteboardState.lastY = y;
  }

  function onPointerUp(e) {
    if (whiteboardState.isDrawing) {
      whiteboardState.isDrawing = false;
      try {
        if (drawingCanvas) drawingCanvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
      saveCurrentPageDrawing();
    }
  }

  function initDrawingCanvasSize() {
    if (!drawingCanvas || !pageImage) return;
    const w = pageImage.naturalWidth || pageImage.clientWidth || 1200;
    const h = pageImage.naturalHeight || pageImage.clientHeight || 1600;
    drawingCanvas.width = w;
    drawingCanvas.height = h;
    updatePageCssVariables();
  }

  function updatePageCssVariables() {
    if (!pageWrapper || !pageImage) return;
    const h = pageImage.clientHeight || (window.innerHeight * 0.92);
    const w = pageImage.clientWidth || (h * 0.72);
    pageWrapper.style.setProperty('--page-h', h + 'px');
    pageWrapper.style.setProperty('--page-w', w + 'px');
  }

  function saveCurrentPageDrawing() {
    if (!state.currentBook || state.currentPage === null || !drawingCanvas) return;
    const key = `${state.currentBook}_${state.currentPage}`;
    try {
      whiteboardState.drawings[key] = drawingCanvas.toDataURL("image/png");
    } catch (_) {}
  }

  function restorePageDrawing(bookId, pageNumber) {
    if (!drawingCanvas || !canvasCtx) return;
    canvasCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    const key = `${bookId}_${pageNumber}`;
    const saved = whiteboardState.drawings[key];
    if (saved) {
      const img = new Image();
      img.onload = () => {
        canvasCtx.drawImage(img, 0, 0);
      };
      img.src = saved;
    }
  }

  // --- HELPERS (LOADING & TOASTS) ---
  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.remove("hidden");
    } else {
      loadingOverlay.classList.add("hidden");
    }
  }

  let toastTimeout;
  function showToast(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.remove("hidden");
    
    toastTimeout = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
  }

});
