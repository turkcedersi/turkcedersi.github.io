/**
 * Sinek Vurma Oyunu - Ana Oyun Motoru ve Mantığı (app.js)
 */

// --- Web Audio API Ses Sentezleyicisi ---
class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSwat() {
    if (this.isMuted || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    
    // Gürültü Darbesi (Şaplak Sesi)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // Alt Frekans Darbesi (Thump)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(now);
    osc.start(now);
    noise.stop(now + 0.08);
    osc.stop(now + 0.08);
  }

  playCombo() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playBonus() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.04);
      gain.gain.setValueAtTime(0.2, now + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.04 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + index * 0.04);
      osc.stop(now + index * 0.04 + 0.1);
    });
  }

  playLevelUp() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }

  playEscape() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    [300, 250, 200, 150].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  }
}

// --- Gerçekçi SVG Çizim Yardımcısı ---
function getFlySVGString(type) {
  if (type === 'mosquito') {
    // Sivrisinek (Mosquito) SVG - İnce uzun gövde, iğne hortum, narin kanatlar, 6 bacak
    return `
      <svg class="fly-svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="mosquitoWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)" />
            <stop offset="100%" stop-color="rgba(180, 210, 230, 0.25)" />
          </linearGradient>
        </defs>
        <!-- Uzun İnce Bacaklar (Beyaz Çizgili) -->
        <path d="M 40 38 Q 20 20 8 10 M 40 48 Q 15 45 4 52 M 40 60 Q 18 78 8 92" stroke="#262626" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M 40 38 Q 20 20 8 10 M 40 48 Q 15 45 4 52 M 40 60 Q 18 78 8 92" stroke="#f5f5f5" stroke-width="1" stroke-dasharray="3,4" stroke-linecap="round" fill="none"/>
        
        <path d="M 60 38 Q 80 20 92 10 M 60 48 Q 85 45 96 52 M 60 60 Q 82 78 92 92" stroke="#262626" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M 60 38 Q 80 20 92 10 M 60 48 Q 85 45 96 52 M 60 60 Q 82 78 92 92" stroke="#f5f5f5" stroke-width="1" stroke-dasharray="3,4" stroke-linecap="round" fill="none"/>

        <!-- Sol Kanat (İnce Narin) -->
        <g class="fly-wing-left">
          <ellipse cx="32" cy="35" rx="11" ry="34" fill="url(#mosquitoWing)" stroke="#525252" stroke-width="1" transform="rotate(-30 32 35)" />
          <path d="M 32 6 Q 30 32 34 62" stroke="#737373" stroke-width="0.8" fill="none" transform="rotate(-30 32 35)"/>
        </g>
        <!-- Sağ Kanat (İnce Narin) -->
        <g class="fly-wing-right">
          <ellipse cx="68" cy="35" rx="11" ry="34" fill="url(#mosquitoWing)" stroke="#525252" stroke-width="1" transform="rotate(30 68 35)" />
          <path d="M 68 6 Q 70 32 66 62" stroke="#737373" stroke-width="0.8" fill="none" transform="rotate(30 68 35)"/>
        </g>

        <!-- İnce Karın (Abdomen - Segmentli) -->
        <ellipse cx="50" cy="70" rx="9" ry="24" fill="#3f3f46" />
        <line x1="42" y1="58" x2="58" y2="58" stroke="#a1a1aa" stroke-width="1.5"/>
        <line x1="43" y1="66" x2="57" y2="66" stroke="#a1a1aa" stroke-width="1.5"/>
        <line x1="44" y1="74" x2="56" y2="74" stroke="#a1a1aa" stroke-width="1.5"/>
        <line x1="46" y1="82" x2="54" y2="82" stroke="#a1a1aa" stroke-width="1.5"/>

        <!-- Göğüs (Thorax) -->
        <ellipse cx="50" cy="42" rx="11" ry="12" fill="#27272a" />

        <!-- Kafa & İğne Hortum (Proboscis) -->
        <circle cx="50" cy="24" r="7" fill="#18181b" />
        <!-- Sivri Kan Emici İğne -->
        <line x1="50" y1="20" x2="50" y2="2" stroke="#7f1d1d" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="50" y1="20" x2="50" y2="2" stroke="#ef4444" stroke-width="1" stroke-linecap="round"/>

        <!-- Küçük Koyu Gözler -->
        <circle cx="46" cy="23" r="3" fill="#991b1b" />
        <circle cx="54" cy="23" r="3" fill="#991b1b" />
      </svg>
    `;
  }

  if (type === 'ladybug') {
    // Uğur Böceği SVG (Kırmızı benekli)
    return `
      <svg class="fly-svg" viewBox="0 0 100 100">
        <!-- Bacaklar -->
        <path d="M 25 35 L 5 25 M 25 50 L 5 50 M 25 65 L 10 75" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
        <path d="M 75 35 L 95 25 M 75 50 L 95 50 M 75 65 L 90 75" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
        <!-- Kafası & Duyargalar -->
        <circle cx="50" cy="22" r="14" fill="#0f172a" />
        <path d="M 45 12 Q 35 2 30 5" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 55 12 Q 65 2 70 5" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Kanat/Kın (Gövde) -->
        <path d="M 50 26 C 20 26 20 85 50 92 C 80 85 80 26 50 26 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
        <!-- Orta Çizgi -->
        <line x1="50" y1="26" x2="50" y2="92" stroke="#0f172a" stroke-width="3" />
        <!-- Benekler -->
        <circle cx="36" cy="42" r="5" fill="#0f172a" />
        <circle cx="64" cy="42" r="5" fill="#0f172a" />
        <circle cx="32" cy="62" r="6" fill="#0f172a" />
        <circle cx="68" cy="62" r="6" fill="#0f172a" />
        <circle cx="42" cy="78" r="4" fill="#0f172a" />
        <circle cx="58" cy="78" r="4" fill="#0f172a" />
        <circle cx="50" cy="50" r="4" fill="#0f172a" />
      </svg>
    `;
  }

  if (type === 'golden') {
    // Altın Sinek SVG
    return `
      <svg class="fly-svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="goldBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffe066" />
            <stop offset="50%" stop-color="#d4af37" />
            <stop offset="100%" stop-color="#996515" />
          </linearGradient>
          <linearGradient id="goldWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255, 236, 179, 0.9)" />
            <stop offset="100%" stop-color="rgba(255, 215, 0, 0.45)" />
          </linearGradient>
        </defs>
        <path d="M 30 40 L 10 30 M 30 50 L 8 52 M 30 65 L 12 80" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
        <path d="M 70 40 L 90 30 M 70 50 L 92 52 M 70 65 L 88 80" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
        <g class="fly-wing-left">
          <ellipse cx="28" cy="38" rx="20" ry="32" fill="url(#goldWing)" stroke="#b45309" stroke-width="1.5" transform="rotate(-35 28 38)" />
        </g>
        <g class="fly-wing-right">
          <ellipse cx="72" cy="38" rx="20" ry="32" fill="url(#goldWing)" stroke="#b45309" stroke-width="1.5" transform="rotate(35 72 38)" />
        </g>
        <ellipse cx="50" cy="42" rx="16" ry="14" fill="url(#goldBody)" />
        <ellipse cx="50" cy="68" rx="18" ry="24" fill="url(#goldBody)" />
        <line x1="34" y1="62" x2="66" y2="62" stroke="#78350f" stroke-width="2"/>
        <line x1="36" y1="72" x2="64" y2="72" stroke="#78350f" stroke-width="2"/>
        <circle cx="50" cy="24" r="10" fill="#78350f" />
        <circle cx="43" cy="22" r="5" fill="#f59e0b" />
        <circle cx="57" cy="22" r="5" fill="#f59e0b" />
      </svg>
    `;
  }

  // Kara Sinek (Ultra-Gerçekçi Musca Domestica SVG - Varsayılan)
  return `
    <svg class="fly-svg" viewBox="0 0 100 100">
      <defs>
        <!-- Damarlı Şeffaf İridosan Kanat Gradyanı -->
        <linearGradient id="realWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.9)" />
          <stop offset="50%" stop-color="rgba(220, 235, 245, 0.6)" />
          <stop offset="100%" stop-color="rgba(180, 200, 220, 0.3)" />
        </linearGradient>

        <!-- Koyu Göğüs Çizgileri Gradyanı -->
        <linearGradient id="thoraxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="25%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#334155" />
          <stop offset="75%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>

        <!-- Kırmızımı İri Bileşik Göz Gradyanı -->
        <radialGradient id="eyeGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="60%" stop-color="#991b1b" />
          <stop offset="100%" stop-color="#450a0a" />
        </radialGradient>
      </defs>

      <!-- Eklem Detaylı 6 Bacak -->
      <path d="M 32 38 Q 18 26 8 20 M 30 50 Q 14 52 6 58 M 32 66 Q 16 78 10 88" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M 68 38 Q 82 26 92 20 M 70 50 Q 86 52 94 58 M 68 66 Q 84 78 90 88" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" fill="none"/>

      <!-- Sol Kanat (İri, Detaylı Damar Ağı) -->
      <g class="fly-wing-left">
        <path d="M 45 40 C 20 20 2 30 18 68 C 32 78 48 55 45 40 Z" fill="url(#realWingGrad)" stroke="#475569" stroke-width="1.2" transform="rotate(-25 45 40)"/>
        <!-- Ana ve Tali Kanat Damarları -->
        <path d="M 43 41 Q 25 35 15 50 M 43 41 Q 30 45 22 62 M 35 38 Q 28 55 30 70" stroke="#64748b" stroke-width="0.8" fill="none" transform="rotate(-25 45 40)"/>
      </g>

      <!-- Sağ Kanat (İri, Detaylı Damar Ağı) -->
      <g class="fly-wing-right">
        <path d="M 55 40 C 80 20 98 30 82 68 C 68 78 52 55 55 40 Z" fill="url(#realWingGrad)" stroke="#475569" stroke-width="1.2" transform="rotate(25 55 40)"/>
        <!-- Ana ve Tali Kanat Damarları -->
        <path d="M 57 41 Q 75 35 85 50 M 57 41 Q 70 45 78 62 M 65 38 Q 72 55 70 70" stroke="#64748b" stroke-width="0.8" fill="none" transform="rotate(25 55 40)"/>
      </g>

      <!-- Karın (Abdomen - Segmentli & Desenli) -->
      <ellipse cx="50" cy="70" rx="19" ry="25" fill="#1e293b" />
      <path d="M 33 60 Q 50 64 67 60 M 32 68 Q 50 72 68 68 M 34 76 Q 50 80 66 76 M 38 84 Q 50 87 62 84" stroke="#475569" stroke-width="2.5" fill="none"/>

      <!-- Göğüs (Thorax - Kara Sinek 4 Boyuna Çizgisi) -->
      <ellipse cx="50" cy="42" rx="17" ry="15" fill="url(#thoraxGrad)" />
      <!-- Kara Sinek Sırt Çizgileri -->
      <line x1="43" y1="30" x2="43" y2="54" stroke="#020617" stroke-width="2.5"/>
      <line x1="47" y1="29" x2="47" y2="55" stroke="#020617" stroke-width="2.5"/>
      <line x1="53" y1="29" x2="53" y2="55" stroke="#020617" stroke-width="2.5"/>
      <line x1="57" y1="30" x2="57" y2="54" stroke="#020617" stroke-width="2.5"/>

      <!-- Kafa ve İri Kırmızımsı Gözler (Musca Domestica) -->
      <circle cx="50" cy="24" r="10" fill="#090d16" />
      <!-- Sol İri Göz -->
      <ellipse cx="41" cy="22" rx="6.5" ry="8" fill="url(#eyeGrad)" transform="rotate(-15 41 22)"/>
      <circle cx="39" cy="20" r="2" fill="#ffffff" opacity="0.8"/>
      <!-- Sağ İri Göz -->
      <ellipse cx="59" cy="22" rx="6.5" ry="8" fill="url(#eyeGrad)" transform="rotate(15 59 22)"/>
      <circle cx="57" cy="20" r="2" fill="#ffffff" opacity="0.8"/>
    </svg>
  `;
}

// --- Oyun Yöneticisi (GameEngine) ---
class GameEngine {
  constructor() {
    this.sound = new SoundFX();
    this.board = document.getElementById('game-board');
    this.scoreDisplay = document.getElementById('score-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.livesContainer = document.getElementById('lives-container');
    this.levelBanner = document.getElementById('level-banner');
    
    // Screens & Modals
    this.startModal = document.getElementById('start-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.pwaInstallBtn = document.getElementById('pwa-install-btn');

    // Stats Elements in Game Over
    this.finalScoreEl = document.getElementById('final-score');
    this.finalLevelEl = document.getElementById('final-level');
    this.finalSwatsEl = document.getElementById('final-swats');
    this.highScoreModalEl = document.getElementById('modal-high-score');
    this.newRecordBadge = document.getElementById('new-record-badge');

    // Dynamic State
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('sinek_oyunu_highscore') || '0', 10);
    this.lives = 3;
    this.level = 1;
    this.swatCount = 0;
    this.isPlaying = false;
    this.flies = [];
    this.spawnTimer = null;
    this.lastSwatTime = 0;
    this.comboCount = 0;
    this.deferredInstallPrompt = null;

    this.init();
  }

  init() {
    this.highScoreDisplay.textContent = this.highScore;
    
    // Event Listeners
    this.startBtn.addEventListener('click', () => this.startGame());
    this.restartBtn.addEventListener('click', () => this.startGame());
    this.soundToggleBtn.addEventListener('click', () => this.toggleSound());

    // Ekran Dokunma / Vurucu Efekti
    this.board.addEventListener('touchstart', (e) => this.handleBoardTouch(e), { passive: false });
    this.board.addEventListener('mousedown', (e) => this.handleBoardTouch(e));

    // PWA Kurulum Yakalama
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.pwaInstallBtn) {
        this.pwaInstallBtn.classList.remove('hidden');
      }
    });

    if (this.pwaInstallBtn) {
      this.pwaInstallBtn.addEventListener('click', () => this.installPWA());
    }

    // PWA Standalone kontrolü
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
      if (this.pwaInstallBtn) this.pwaInstallBtn.classList.add('hidden');
    }

    // Force Update / Önbellek Temizleme Butonu
    const forceUpdateBtn = document.getElementById('force-update-btn');
    if (forceUpdateBtn) {
      forceUpdateBtn.addEventListener('click', async () => {
        forceUpdateBtn.textContent = 'Güncelleniyor...';
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let reg of registrations) {
            await reg.unregister();
          }
        }
        window.location.reload(true);
      });
    }

    // Otomatik Sürüm Kontrolü (LocalStorage Silinmez, Sadece Dosya Önbelleği Sıfırlanır)
    const CURRENT_VERSION = '1.0.10';
    if (localStorage.getItem('sinek_game_version') !== CURRENT_VERSION) {
      localStorage.setItem('sinek_game_version', CURRENT_VERSION);
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => reg.unregister());
        });
      }
      setTimeout(() => window.location.reload(true), 150);
    }

    // Service Worker Kaydı & Güncelleme (Bypass HTTP Cache via ?v=10)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js?v=turkce-1').then((reg) => {
        reg.update();

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            };
          }
        };
      }).catch(err => {
        console.log('Service Worker kayıt hatası:', err);
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }

  toggleSound() {
    this.sound.isMuted = !this.sound.isMuted;
    this.soundToggleBtn.innerHTML = this.sound.isMuted ? `
      <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
    ` : `
      <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
    `;
  }

  installPWA() {
    if (!this.deferredInstallPrompt) return;
    this.deferredInstallPrompt.prompt();
    this.deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Kullanıcı PWA kurulumunu kabul etti');
      }
      this.deferredInstallPrompt = null;
      if (this.pwaInstallBtn) this.pwaInstallBtn.classList.add('hidden');
    });
  }

  startGame() {
    this.sound.init();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.swatCount = 0;
    this.comboCount = 0;
    this.isPlaying = true;
    
    // UI Güncelleme
    this.scoreDisplay.textContent = '0';
    this.updateHeartsUI();
    this.startModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.newRecordBadge.style.display = 'none';

    // Board Temizliği
    this.clearFlies();

    // Sinek Döngüsü Başlat
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.spawnTimer = setInterval(() => this.manageFlySpawns(), 1000);
  }

  updateHeartsUI() {
    const hearts = this.livesContainer.querySelectorAll('.heart-icon');
    hearts.forEach((heart, index) => {
      if (index < this.lives) {
        heart.classList.remove('lost');
      } else {
        heart.classList.add('lost');
      }
    });
  }

  clearFlies() {
    this.flies.forEach(f => f.destroy());
    this.flies = [];
    // Board üzerindeki leke dışındaki sinek öğelerini temizle
    const wrappers = this.board.querySelectorAll('.fly-wrapper');
    wrappers.forEach(w => w.remove());
  }

  manageFlySpawns() {
    if (!this.isPlaying) return;

    // Seviyeye göre maksimum aynı andaki sinek sayısı (1 - 5 arası)
    const maxFlies = Math.min(1 + Math.floor((this.level - 1) / 2), 5);
    
    // Aktif yaşayan sinekleri filtrele
    this.flies = this.flies.filter(f => f.alive);

    if (this.flies.length < maxFlies) {
      // Sinek Dağılımı: %55 Kara Sinek, %20 Uğur Böceği (%20 İhtimal), %15 Sivrisinek, %10 Altın Sinek
      const rand = Math.random();
      let type = 'normal';
      if (rand < 0.20) {
        type = 'ladybug'; // %20 Kırmızı Uğur Böceği (Can kazandırır)
      } else if (rand < 0.30) {
        type = 'golden'; // %10 Altın Sinek
      } else if (rand < 0.45) {
        type = 'mosquito'; // %15 Sivrisinek
      }
      
      const fly = new Fly(this, type);
      this.flies.push(fly);
    }
  }

  handleBoardTouch(e) {
    if (!this.isPlaying) return;
    
    // Koordinatı Al (Touch veya Mouse)
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // Sineklik (Swatter) Görsel Efekti
    this.createSwatterEffect(clientX, clientY);
  }

  createSwatterEffect(x, y) {
    const swatter = document.createElement('div');
    swatter.className = 'swatter-hit';
    swatter.style.position = 'fixed';
    swatter.style.left = `${x}px`;
    swatter.style.top = `${y}px`;
    swatter.style.zIndex = '99999';
    swatter.innerHTML = `
      <svg class="swatter-svg" viewBox="0 0 160 260">
        <defs>
          <pattern id="meshPattern" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255, 255, 255, 0.5)" stroke-width="1.2"/>
          </pattern>
          <linearGradient id="swatterBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="50%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <filter id="swatterShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="6" flood-color="rgba(0,0,0,0.5)"/>
          </filter>
        </defs>
        <!-- Sap (Handle) -->
        <path d="M 73 125 L 73 255 C 73 260 87 260 87 255 L 87 125 Z" fill="url(#handleGrad)"/>
        <!-- Izgara Çerçevesi (Head) -->
        <rect x="15" y="10" width="130" height="125" rx="16" fill="url(#swatterBody)" stroke="#7f1d1d" stroke-width="4" filter="url(#swatterShadow)"/>
        <!-- Izgara Örgüsü (Plastic Mesh Grid) -->
        <rect x="21" y="16" width="118" height="113" rx="10" fill="url(#meshPattern)"/>
        <!-- Destek Çaprazları -->
        <line x1="15" y1="10" x2="145" y2="135" stroke="#b91c1c" stroke-width="2.5"/>
        <line x1="145" y1="10" x2="15" y2="135" stroke="#b91c1c" stroke-width="2.5"/>
      </svg>
    `;
    document.body.appendChild(swatter);
    setTimeout(() => swatter.remove(), 500);
  }

  onFlySwatted(fly, x, y) {
    this.swatCount++;
    this.sound.playSwat();

    // Sinek Vurulduğunda Tam O Noktada Sineklik Darbesi Oluştur!
    this.createSwatterEffect(x, y);

    // Haptic Vibrate (Cihaz destekliyorsa)
    if (navigator.vibrate) {
      navigator.vibrate([40]);
    }

    // Combo Hesaplama (1.2 saniye içerisinde ardışık vuruş)
    const now = Date.now();
    if (now - this.lastSwatTime < 1200) {
      this.comboCount++;
      if (this.comboCount >= 2) {
        this.sound.playCombo();
      }
    } else {
      this.comboCount = 1;
    }
    this.lastSwatTime = now;

    // Puanlama Hesaplama
    let basePoints = 10;
    let popupText = '+10';
    let popupClass = '';

    if (fly.type === 'mosquito') {
      basePoints = 30;
      popupText = '+30 SİVRİSİNEK!';
      popupClass = 'gold';
      this.sound.playCombo();
    } else if (fly.type === 'golden') {
      basePoints = 50;
      popupText = '+50 ALTIN!';
      popupClass = 'gold';
      this.sound.playBonus();
    } else if (fly.type === 'ladybug') {
      basePoints = 100;
      popupText = '+100 UĞUR BÖCEĞİ!';
      popupClass = 'gold';
      this.sound.playBonus();
      
      // Uğur böceği 1 Can kazandırır! (Maksimum 3 Can)
      if (this.lives < 3) {
        this.lives++;
        this.updateHeartsUI();
        this.showPopup(x, y - 30, '+1 CAN!', 'heart');
      }
    }

    const multiplier = Math.min(this.comboCount, 4);
    const totalPoints = basePoints * multiplier;

    if (multiplier > 1) {
      popupText = `+${totalPoints}`;
      popupClass = 'combo';
    }

    this.score += totalPoints;
    this.scoreDisplay.textContent = this.score;

    // Visual Feedback (Popup, Splat, Particles)
    this.showPopup(x, y, popupText, popupClass);
    this.createSplatMark(x, y, fly.type);
    this.createParticleExplosion(x, y, fly.type);

    // Seviye Kontrolü (Her 50 puanda Seviye Atla)
    const newLevel = Math.floor(this.score / 50) + 1;
    if (newLevel > this.level) {
      this.levelUp(newLevel);
    }
  }

  onFlyEscaped(fly) {
    this.sound.playEscape();
    this.lives--;
    this.updateHeartsUI();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  showPopup(x, y, text, extraClass = '') {
    const pop = document.createElement('div');
    pop.className = `score-popup ${extraClass}`;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    pop.textContent = text;
    this.board.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
  }

  createSplatMark(x, y, type) {
    const splat = document.createElement('div');
    splat.className = 'splat-mark';
    splat.style.left = `${x}px`;
    splat.style.top = `${y}px`;
    
    const rot = Math.floor(Math.random() * 360);
    const color = type === 'ladybug' ? '#ef4444' : (type === 'golden' ? '#eab308' : (type === 'mosquito' ? '#991b1b' : '#334155'));

    splat.innerHTML = `
      <svg viewBox="0 0 100 100" style="transform: rotate(${rot}deg)">
        <path d="M 50 50 Q 30 20 20 40 Q 10 60 30 70 Q 50 80 70 75 Q 85 60 75 40 Q 60 20 50 50 Z" fill="${color}" opacity="0.7"/>
        <circle cx="50" cy="50" r="12" fill="${color}"/>
        <circle cx="35" cy="40" r="5" fill="${color}"/>
        <circle cx="65" cy="55" r="6" fill="${color}"/>
        <circle cx="45" cy="65" r="4" fill="${color}"/>
      </svg>
    `;
    this.board.appendChild(splat);
    setTimeout(() => splat.remove(), 3000);
  }

  createParticleExplosion(x, y, type) {
    const color = type === 'ladybug' ? '#ef4444' : (type === 'golden' ? '#fbbf24' : (type === 'mosquito' ? '#ef4444' : '#475569'));
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.backgroundColor = color;

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${Math.sin(angle) * distance}px`;

      p.style.setProperty('--dx', dx);
      p.style.setProperty('--dy', dy);

      this.board.appendChild(p);
      setTimeout(() => p.remove(), 400);
    }
  }

  levelUp(newLevel) {
    // Seviye arka planda otomatik artar (hız ve yoğunluk yükselir),
    // ancak kullanıcı isteği doğrultusunda hiçbir ekran yazısı ve ses çıkartılmaz.
    this.level = newLevel;
  }

  gameOver() {
    this.isPlaying = false;
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    this.clearFlies();
    this.sound.playGameOver();

    // Rekor Kontrolü
    let isNewRecord = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('sinek_oyunu_highscore', this.highScore.toString());
      this.highScoreDisplay.textContent = this.highScore;
      isNewRecord = true;
    }

    // Modal Bilgilerini Doldur
    this.finalScoreEl.textContent = this.score;
    this.finalLevelEl.textContent = this.level;
    this.finalSwatsEl.textContent = this.swatCount;
    this.highScoreModalEl.textContent = this.highScore;

    if (isNewRecord && this.score > 0) {
      this.newRecordBadge.style.display = 'inline-block';
    } else {
      this.newRecordBadge.style.display = 'none';
    }

    this.gameOverModal.classList.remove('hidden');
  }
}

// --- Sinek Nesne Sınıfı (Fly Class - Gerçekçi Organik Uçuş Fizikli) ---
class Fly {
  constructor(engine, type = 'normal') {
    this.engine = engine;
    this.type = type;
    this.alive = true;
    this.state = 'flying'; // 'flying', 'landed', 'escaping'

    this.x = 0;
    this.y = 0;
    this.element = null;
    this.landedTimer = null;
    this.landedRing = null;
    this.animFrame = null;

    this.createDOM();
    this.spawn();
  }

  createDOM() {
    this.element = document.createElement('div');
    this.element.className = `fly-wrapper flying ${this.type}-fly`;
    this.element.innerHTML = getFlySVGString(this.type);
    
    // Dokunma / Tıklama Olayları
    const handleSwat = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.alive && this.state === 'landed') {
        this.swat();
      }
    };

    this.element.addEventListener('touchstart', handleSwat, { passive: false });
    this.element.addEventListener('mousedown', handleSwat);

    this.engine.board.appendChild(this.element);
  }

  spawn() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Ekran dışındaki rastgele bir noktadan doğma (Spawn)
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { this.x = -60; this.y = Math.random() * height; }
    else if (side === 1) { this.x = width + 60; this.y = Math.random() * height; }
    else if (side === 2) { this.x = Math.random() * width; this.y = -60; }
    else { this.x = Math.random() * width; this.y = height + 60; }

    this.setPosition(this.x, this.y);

    // Rastgele konma hedefine uç
    const targetX = 60 + Math.random() * (width - 120);
    const targetY = 100 + Math.random() * (height - 200);

    this.flyTo(targetX, targetY, () => this.land());
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  flyTo(targetX, targetY, onArrival) {
    if (!this.alive) return;
    this.state = 'flying';
    this.element.classList.remove('landed');
    this.element.classList.add('flying');

    if (this.landedRing) {
      this.landedRing.remove();
      this.landedRing = null;
    }

    const startX = this.x;
    const startY = this.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.hypot(dx, dy);

    // Gerçekçi Uçuş Kavis Kontrol Noktası (Bezier Curve Arc)
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2;
    const curveOffset = (Math.random() - 0.5) * (distance * (this.type === 'mosquito' ? 0.9 : 0.65));
    const len = distance || 1;
    const cpX = midX + (-dy / len) * curveOffset;
    const cpY = midY + (dx / len) * curveOffset;

    // Seviye ve Tür Hız Faktörü
    const speedMult = 1 + (this.engine.level * 0.15);
    const baseSpeed = this.type === 'mosquito' ? 480 : (this.type === 'golden' ? 440 : 340);
    const duration = Math.max(0.4, (distance / (baseSpeed * speedMult))) * 1000;

    const startTime = performance.now();
    const svgEl = this.element.querySelector('.fly-svg');

    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    const step = (now) => {
      if (!this.alive || this.state !== 'flying') return;

      let elapsed = now - startTime;
      let t = Math.min(1, elapsed / duration);

      // İkinci Derece Bezier Eğrisi: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
      const invT = 1 - t;
      let bx = invT * invT * startX + 2 * invT * t * cpX + t * t * targetX;
      let by = invT * invT * startY + 2 * invT * t * cpY + t * t * targetY;

      // Mikron Titreşim ve Türbülans (Organik Vızıltı Salınımı)
      const buzzFreq = this.type === 'mosquito' ? 45 : 32;
      const buzzAmp = (this.type === 'mosquito' ? 7 : 4) * Math.sin(t * Math.PI);
      const buzzX = Math.sin(t * buzzFreq) * buzzAmp;
      const buzzY = Math.cos(t * buzzFreq) * buzzAmp;

      const currX = bx + buzzX;
      const currY = by + buzzY;

      // Türev Yön Vektörü B'(t) ile Gerçek Zamanlı Yön Dönüşü
      const dX = 2 * invT * (cpX - startX) + 2 * t * (targetX - cpX);
      const dY = 2 * invT * (cpY - startY) + 2 * t * (targetY - cpY);
      const angle = Math.atan2(dY, dX) * (180 / Math.PI) + 90;

      // 3D Havalanma ve İrtifa Ölçeklemesi (Uçarken yükselir, konarken iner)
      const altitudeScale = 1 + Math.sin(t * Math.PI) * 0.22;

      this.setPosition(currX, currY);
      if (svgEl) {
        svgEl.style.transform = `rotate(${angle}deg) scale(${altitudeScale})`;
      }

      if (t < 1) {
        this.animFrame = requestAnimationFrame(step);
      } else {
        this.setPosition(targetX, targetY);
        if (svgEl) svgEl.style.transform = `rotate(${angle}deg) scale(1)`;
        if (onArrival) onArrival();
      }
    };

    this.animFrame = requestAnimationFrame(step);
  }

  land() {
    if (!this.alive) return;
    this.state = 'landed';
    this.element.classList.remove('flying');
    this.element.classList.add('landed');

    // Konma Halesi (Vurulabilir İşareti)
    this.landedRing = document.createElement('div');
    this.landedRing.className = 'landed-ring';
    this.element.appendChild(this.landedRing);

    // Konma süresi (Sivrisinek ve Altın sinek daha hızlı kaçar)
    const baseDuration = this.type === 'mosquito' ? 1.2 : (this.type === 'golden' ? 1.5 : (this.type === 'ladybug' ? 2.5 : 3.0));
    const stayTime = Math.max(0.7, baseDuration - (this.engine.level * 0.2)) * 1000;

    this.landedTimer = setTimeout(() => {
      if (this.alive && this.state === 'landed') {
        this.escape();
      }
    }, stayTime);
  }

  escape() {
    if (!this.alive) return;
    this.state = 'escaping';
    if (this.landedRing) this.landedRing.remove();

    // Kaçış hedefi (Ekran dışı)
    const width = window.innerWidth;
    const height = window.innerHeight;
    const targetX = Math.random() > 0.5 ? -100 : width + 100;
    const targetY = Math.random() * height;

    this.flyTo(targetX, targetY, () => {
      this.engine.onFlyEscaped(this);
      this.destroy();
    });
  }

  swat() {
    if (!this.alive || this.state !== 'landed') return;
    this.alive = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.landedTimer) clearTimeout(this.landedTimer);
    if (this.landedRing) this.landedRing.remove();

    // Sinek Sineklik Altında Ezilir (Crush Animation)
    this.element.classList.remove('landed', 'flying');
    this.element.classList.add('crushed');

    this.engine.onFlySwatted(this, this.x, this.y);

    // Sineklik kalktıktan sonra sinek elementini kaldır (Leke kalır)
    setTimeout(() => {
      this.destroy();
    }, 450);
  }

  destroy() {
    this.alive = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.landedTimer) clearTimeout(this.landedTimer);
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

// Oyunu Başlat
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
