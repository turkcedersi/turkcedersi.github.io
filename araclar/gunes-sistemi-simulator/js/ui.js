/**
 * Solar System Simulator - UI Manager Module
 * Manages DOM events, 3D trackball camera mouse rotation & panning, HUD updates, control panel bindings,
 * keyboard shortcuts, modal dialogs, tooltips, and eclipse info banners.
 */

import { EPOCH_MS, SEASON_NAMES, SEASON_COLS, SEASON_EVENTS, DEG } from './data.js';
import { findNextEclipse, findPrevEclipse, seasonState, dayLengthHours, daysToNextEvent, clamp } from './physics.js';

export class UIManager {
  constructor(state, allBodies, planets, earth, earthMoon, renderer2d) {
    this.state = state;
    this.allBodies = allBodies;
    this.planets = planets;
    this.earth = earth;
    this.earthMoon = earthMoon;
    this.renderer2d = renderer2d;

    // DOM Elements
    this.hudDate = document.getElementById('hud-date');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudEclipse = document.getElementById('hud-eclipse');
    this.speedSlider = document.getElementById('speed');
    this.speedVal = document.getElementById('speed-val');
    this.dirVal = document.getElementById('dir-val');
    this.dateInput = document.getElementById('date-input');
    this.tip = document.getElementById('tooltip');
    this.infoPanel = document.getElementById('info');
    this.seasonPanel = document.getElementById('season-panel');
    this.scaleBanner = document.getElementById('scale-banner');
    this.eclipseBanner = document.getElementById('eclipse-banner');
    this.tglFollowBtn = document.getElementById('tgl-follow');
    this.tglViewBtn = document.getElementById('tgl-view');
    this.pwaInstallBtn = document.getElementById('btn-pwa-install');
    this.deferredInstallPrompt = null;
  }

  bindEvents(onDblClick) {
    const canvas = this.renderer2d.canvas;

    // Prevent context menu on right click for mouse drag panning in 3D mode
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', () => { this.state.hover = null; this.hideTip(); });
    canvas.addEventListener('dblclick', onDblClick);

    // Multi-Touch Gestures for Mobile & Tablet
    let touchState = {
      active: false,
      count: 0,
      dragged: false,
      startX: 0, startY: 0,
      lastX: 0, lastY: 0,
      initialDist: 0,
      initialZoom: 1,
      lastMidX: 0, lastMidY: 0,
      lastTapTime: 0
    };

    canvas.addEventListener('touchstart', (e) => {
      const touches = e.touches;
      touchState.count = touches.length;

      if (touches.length === 1) {
        touchState.active = true;
        touchState.dragged = false;
        touchState.startX = touchState.lastX = touches[0].clientX;
        touchState.startY = touchState.lastY = touches[0].clientY;
      } else if (touches.length === 2) {
        touchState.active = true;
        touchState.dragged = true;
        const t1 = touches[0], t2 = touches[1];
        touchState.initialDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchState.initialZoom = this.state.zoomTarget;
        touchState.lastMidX = (t1.clientX + t2.clientX) / 2;
        touchState.lastMidY = (t1.clientY + t2.clientY) / 2;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const touches = e.touches;

      if (touches.length === 1 && touchState.active) {
        const cx = touches[0].clientX, cy = touches[0].clientY;
        const dx = cx - touchState.lastX, dy = cy - touchState.lastY;

        if (!touchState.dragged && Math.hypot(cx - touchState.startX, cy - touchState.startY) > 6) {
          touchState.dragged = true;
        }

        if (touchState.dragged) {
          // 1-finger drag: Rotate view (pitch & yaw) in all modes per user decision
          this.state.viewRot -= dx * 0.005;
          this.state.tiltTarget = clamp(this.state.tiltTarget - dy * 0.003, 0.02, Math.PI / 2 - 0.01);
        }

        touchState.lastX = cx;
        touchState.lastY = cy;
        this.hideTip();
      } else if (touches.length === 2 && touchState.active) {
        touchState.dragged = true;
        const t1 = touches[0], t2 = touches[1];
        const currDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const currMidX = (t1.clientX + t2.clientX) / 2;
        const currMidY = (t1.clientY + t2.clientY) / 2;

        // 2-finger Pan (view-relative camera translation)
        const mdx = currMidX - touchState.lastMidX;
        const mdy = currMidY - touchState.lastMidY;
        this.panCamera(mdx, mdy);
        touchState.lastMidX = currMidX;
        touchState.lastMidY = currMidY;

        // 2-finger Pinch Zoom
        if (touchState.initialDist > 10) {
          const scale = currDist / touchState.initialDist;
          this.state.zoomTarget = clamp(touchState.initialZoom * scale, 0.2, 20);
        }
        this.hideTip();
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (touchState.count === 1 && !touchState.dragged) {
        const now = Date.now();
        if (now - touchState.lastTapTime < 300) {
          onDblClick();
          touchState.lastTapTime = 0;
        } else {
          touchState.lastTapTime = now;
          this.handleClick(touchState.startX, touchState.startY);
        }
      }
      if (e.touches.length === 0) {
        touchState.active = false;
        touchState.count = 0;
      } else if (e.touches.length === 1) {
        touchState.count = 1;
        touchState.dragged = true;
        touchState.lastX = e.touches[0].clientX;
        touchState.lastY = e.touches[0].clientY;
      }
    });

    canvas.addEventListener('touchcancel', () => {
      touchState.active = false;
      touchState.count = 0;
    });

    window.addEventListener('resize', () => this.onResize());

    document.addEventListener('fullscreenchange', () => this.onFSChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFSChange());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state.daysPerSec > 0) {
          this.state.prevSpeed = this.state.daysPerSec;
          this.state.daysPerSec = 0;
        } else {
          this.state.daysPerSec = this.state.prevSpeed || 10;
        }
        this.speedSlider.value = this.state.daysPerSec;
        this.speedVal.textContent = this.state.daysPerSec + ' gün/sn';
      } else if (e.code === 'KeyR') {
        onDblClick();
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        this.state.zoomTarget = Math.max(this.state.zoomTarget / 1.4, 0.2);
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        this.state.zoomTarget = Math.min(this.state.zoomTarget * 1.4, 20);
      } else if (e.code === 'Escape') {
        this.state.focus = null; this.closeInfo();
        this.setSeasons(false);
      }
    });

    // Controls
    this.speedSlider.addEventListener('input', () => {
      this.state.daysPerSec = +this.speedSlider.value;
      this.speedVal.textContent = this.speedSlider.value + ' gün/sn';
    });

    document.getElementById('tgl-dir').addEventListener('click', (e) => {
      this.state.timeDir *= -1;
      e.currentTarget.textContent = this.state.timeDir > 0 ? '▶▶' : '◀◀';
      e.currentTarget.classList.toggle('on', this.state.timeDir < 0);
      this.dirVal.textContent = this.state.timeDir > 0 ? 'İLERİ ▶▶' : 'GERİ ◀◀';
    });

    document.getElementById('jump-date').addEventListener('click', () => {
      const v = this.dateInput.value; if (!v) return;
      const target = (Date.parse(v + 'T12:00:00Z') - EPOCH_MS) / 86400000;
      if (isNaN(target)) return;
      this.state.travel = { from: this.state.simDays, to: target, t: 0, dur: 1.4 };
    });

    const prevEclipseBtn = document.getElementById('prev-eclipse');
    if (prevEclipseBtn) {
      prevEclipseBtn.addEventListener('click', () => {
        const ecl = findPrevEclipse(this.state.simDays - 0.05, this.earth, this.earthMoon);
        if (ecl) {
          this.state.nextEclipse = ecl;
          this.state.travel = { from: this.state.simDays, to: ecl.peakDay, t: 0, dur: 1.4 };
        }
      });
    }

    document.getElementById('jump-eclipse').addEventListener('click', () => {
      this.state.nextEclipse = findNextEclipse(this.state.simDays + 0.05, this.earth, this.earthMoon);
      if (this.state.nextEclipse) {
        this.state.travel = { from: this.state.simDays, to: this.state.nextEclipse.peakDay, t: 0, dur: 1.4 };
      }
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
      this.state.zoomTarget = Math.min(this.state.zoomTarget * 1.4, 20);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.state.zoomTarget = Math.max(this.state.zoomTarget / 1.4, 0.2);
    });

    document.getElementById('reset-view').addEventListener('click', onDblClick);

    document.getElementById('tgl-labels').addEventListener('click', (e) => {
      this.state.showLabels = !this.state.showLabels;
      e.currentTarget.classList.toggle('on', this.state.showLabels);
    });

    document.getElementById('tgl-orbits').addEventListener('click', (e) => {
      this.state.showOrbits = !this.state.showOrbits;
      e.currentTarget.classList.toggle('on', this.state.showOrbits);
    });

    this.tglViewBtn.addEventListener('click', (e) => {
      const labels = { 'top': 'GÖRÜNÜM: ÜSTTEN', 'persp': 'GÖRÜNÜM: PERSPEKTİF', 'side': 'GÖRÜNÜM: YAN' };
      const targets = { 'top': 0, 'persp': 55 * Math.PI / 180, 'side': Math.PI / 2 - 0.02 };
      const order = ['top', 'persp', 'side'];
      const next = order[(order.indexOf(this.state.viewMode) + 1) % 3];
      this.state.viewMode = next;
      this.state.tiltTarget = targets[next];
      e.currentTarget.textContent = labels[next];
      e.currentTarget.classList.toggle('on', next !== 'top');
    });

    document.getElementById('tgl-scale').addEventListener('click', (e) => {
      this.state.realScale = !this.state.realScale;
      e.currentTarget.classList.toggle('on', this.state.realScale);
      this.scaleBanner.classList.toggle('show', this.state.realScale);
    });

    document.getElementById('tgl-fs').addEventListener('click', () => this.toggleFS());

    document.getElementById('tgl-seasons').addEventListener('click', () => {
      this.setSeasons(!this.state.seasons);
    });

    this.tglFollowBtn.addEventListener('click', () => {
      this.state.follow = !this.state.follow;
      if (this.state.follow && (!this.state.focus || this.state.focus.isSun)) {
        this.state.focus = this.earth;
        this.openInfo(this.earth);
      }
      this.updateFollowBtnText();
    });

    document.getElementById('info-close').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.state.focus = null;
      this.closeInfo();
    });

    document.getElementById('season-close').addEventListener('click', () => {
      this.setSeasons(false);
    });

    document.getElementById('controls-toggle').addEventListener('click', (e) => {
      const ctrls = document.getElementById('controls');
      const isHidden = ctrls.classList.toggle('hidden');
      e.currentTarget.classList.toggle('collapsed', isHidden);
      e.currentTarget.textContent = isHidden ? '▶' : '◀';
    });

    // PWA Install Prompt Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.pwaInstallBtn) {
        this.pwaInstallBtn.style.display = 'block';
      }
    });

    if (this.pwaInstallBtn) {
      this.pwaInstallBtn.addEventListener('click', async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const { outcome } = await this.deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            this.pwaInstallBtn.style.display = 'none';
          }
          this.deferredInstallPrompt = null;
        }
      });
    }

    window.addEventListener('appinstalled', () => {
      if (this.pwaInstallBtn) {
        this.pwaInstallBtn.style.display = 'none';
      }
    });

    try { this.dateInput.value = new Date().toISOString().slice(0, 10); } catch (e) { }
  }

  updateFollowBtnText() {
    if (!this.state.follow) {
      this.tglFollowBtn.textContent = '🎥 TAKİP: KAPALI';
      this.tglFollowBtn.classList.remove('on');
    } else {
      const name = (this.state.focus && !this.state.focus.isSun) ? this.state.focus.name.toUpperCase() : 'DÜNYA';
      this.tglFollowBtn.textContent = '🎥 TAKİP: ' + name;
      this.tglFollowBtn.classList.add('on');
    }
  }

  onResize() {
    this.renderer2d.resize(window.innerWidth, window.innerHeight, Math.min(2, window.devicePixelRatio || 1));
  }

  onWheel(e) {
    e.preventDefault();
    const nz = Math.max(0.2, Math.min(20, this.state.zoomTarget * Math.exp(-e.deltaY * 0.0012)));
    const W2 = window.innerWidth / 2, H2 = window.innerHeight / 2;
    const wx = this.state.cam.x + (e.clientX - W2) / this.state.cam.zoom;
    const wy = this.state.cam.y + (e.clientY - H2) / this.state.cam.zoom;
    this.state.zoomTarget = nz;
    this.state.camTarget.x = wx - (e.clientX - W2) / nz;
    this.state.camTarget.y = wy - (e.clientY - H2) / nz;
  }

  onPointerDown(e) {
    if (e.pointerType === 'touch') return;
    this.renderer2d.canvas.setPointerCapture(e.pointerId);
    this.state.mouse.down = true; this.state.mouse.dragged = false;
    this.state.mouse.button = e.button; // 0: Left, 2: Right
    this.state.mouse.shiftKey = e.shiftKey;
    this.state.mouse.downX = this.state.mouse.lastX = e.clientX;
    this.state.mouse.downY = this.state.mouse.lastY = e.clientY;
    this.renderer2d.canvas.classList.add('dragging');
  }

  panCamera(dx, dy) {
    this.state.focus = null;
    if (this.state.follow) this.updateFollowBtnText();

    const zoom = this.state.cam.zoom;
    const rot = -this.state.viewRot;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    const dwx = (dx * cosR - dy * sinR) / zoom;
    const dwy = (dx * sinR + dy * cosR) / zoom;

    this.state.camTarget.x -= dwx;
    this.state.camTarget.y -= dwy;
  }

  onPointerMove(e) {
    if (e.pointerType === 'touch') return;
    this.state.mouse.x = e.clientX; this.state.mouse.y = e.clientY;
    if (this.state.mouse.down) {
      const dx = e.clientX - this.state.mouse.lastX, dy = e.clientY - this.state.mouse.lastY;
      if (!this.state.mouse.dragged && Math.hypot(e.clientX - this.state.mouse.downX, e.clientY - this.state.mouse.downY) > 4) {
        this.state.mouse.dragged = true;
      }
      if (this.state.mouse.dragged) {
        const isRightClickOrShift = (this.state.mouse.button === 2 || e.shiftKey);
        const is3DMode = (this.state.viewMode === 'persp' || this.state.viewMode === 'side');

        if (is3DMode && !isRightClickOrShift) {
          // 3D Disk Trackball Rotation (Yaw & Pitch inverted for "grabbing and turning the disk" intuition)
          this.state.viewRot -= dx * 0.005;
          this.state.tiltTarget = clamp(this.state.tiltTarget - dy * 0.003, 0.02, Math.PI / 2 - 0.01);
        } else {
          // View-relative Camera Panning
          this.panCamera(dx, dy);
        }
      }
      this.state.mouse.lastX = e.clientX; this.state.mouse.lastY = e.clientY;
      this.hideTip();
    } else {
      const b = this.pickBody(e.clientX, e.clientY);
      this.state.hover = b;
      this.renderer2d.canvas.classList.toggle('hoverable', !!b);
      if (b) this.showTip(b, e.clientX, e.clientY); else this.hideTip();
    }
  }

  onPointerUp(e) {
    if (e.pointerType === 'touch') return;
    this.renderer2d.canvas.classList.remove('dragging');
    if (this.state.mouse.down && !this.state.mouse.dragged && e.button === 0) {
      this.handleClick(this.state.mouse.x, this.state.mouse.y);
    }
    this.state.mouse.down = false;
  }

  pickBody(mx, my) {
    let best = null, bd = Infinity;
    for (let i = 0; i < this.allBodies.length; i++) {
      const b = this.allBodies[i], s = b._s; if (!s) continue;
      if (b.isMoon && !b._visible) continue;
      const rr = Math.max(s.r, b.isSun ? s.r : (b.isProbe ? 10 : 8)) + 4;
      const d = Math.hypot(mx - s.x, my - s.y);
      if (d < rr && d < bd) { best = b; bd = d; }
    }
    return best;
  }

  handleClick(mx, my) {
    const b = this.pickBody(mx, my);
    if (b) {
      this.state.focus = b;
      if (!b.isProbe) this.state.zoomTarget = Math.max(0.2, Math.min(20, Math.max(this.state.zoomTarget, 70 / b.r)));
      this.openInfo(b);
      if (this.state.follow) this.updateFollowBtnText();
    } else {
      this.state.focus = null; this.closeInfo();
      if (this.state.follow) this.updateFollowBtnText();
    }
  }

  showTip(b, mx, my) {
    const dist = b.isSun ? 'YILDIZ · SİSTEM MERKEZİ' :
      b.isMoon ? ('UYDU · ' + b.parent.name.toUpperCase()) :
        b.isProbe ? (b._rAU.toFixed(1) + ' AU · ' + b.v + ' AB/yıl hızla uzaklaşıyor') :
          (b._rAU.toFixed(2) + ' AU GÜNEŞ’E');
    this.tip.innerHTML = '<b>' + b.name + '</b><span>' + dist + '</span>';
    this.tip.style.opacity = 1;
    const r = this.tip.getBoundingClientRect();
    let tx = mx + 14, ty = my + 14;
    if (tx + r.width > window.innerWidth - 8) tx = mx - r.width - 14;
    if (ty + r.height > window.innerHeight - 8) ty = my - r.height - 14;
    this.tip.style.left = tx + 'px'; this.tip.style.top = ty + 'px';
  }

  hideTip() { this.tip.style.opacity = 0; }

  openInfo(b) {
    this.state.infoBody = b;
    document.getElementById('i-name').textContent = b.name;
    document.getElementById('i-type').textContent = b.type;
    document.getElementById('i-diam').textContent = b.info.diam;
    document.getElementById('i-mass').textContent = b.info.mass;
    document.getElementById('i-dist').textContent = b.info.dist;
    document.getElementById('i-per').textContent = b.info.per;
    document.getElementById('i-moons').textContent = b.info.moons;
    document.getElementById('i-fact').textContent = b.info.fact;

    const photoEl = document.getElementById('i-photo');
    const portraitCv = document.getElementById('portrait');
    if (photoEl) {
      const urls = b.photoUrls || (b.photoUrl ? [b.photoUrl] : []);
      if (urls.length > 0) {
        // Fallback chain: try each URL in sequence
        let urlIdx = 0;
        const tryNextUrl = () => {
          if (urlIdx >= urls.length) {
            // All URLs failed → fall back to procedural canvas
            photoEl.style.display = 'none';
            photoEl.removeAttribute('src');
            if (portraitCv) portraitCv.style.display = 'block';
            return;
          }
          photoEl.src = urls[urlIdx];
          urlIdx++;
        };
        photoEl.style.display = 'block';
        photoEl.style.opacity = '1';
        if (portraitCv) portraitCv.style.display = 'none';
        photoEl.onload = () => {
          // Photo loaded successfully — keep it displayed
          photoEl.style.display = 'block';
          photoEl.style.opacity = '1';
          if (portraitCv) portraitCv.style.display = 'none';
        };
        photoEl.onerror = () => {
          tryNextUrl(); // try next fallback URL
        };
        urlIdx = 0;
        tryNextUrl();
      } else {
        photoEl.style.display = 'none';
        photoEl.removeAttribute('src');
        if (portraitCv) portraitCv.style.display = 'block';
      }
    }

    document.getElementById('live-row').style.display = b.isSun ? 'none' : '';
    this.infoPanel.classList.add('open');
    document.body.classList.add('info-open');
  }

  closeInfo() {
    this.state.infoBody = null;
    this.infoPanel.classList.remove('open');
    document.body.classList.remove('info-open');
  }

  setSeasons(on) {
    this.state.seasons = on;
    this.state.seasonMode = on;
    this.seasonPanel.classList.toggle('show', on);
    document.getElementById('tgl-seasons').classList.toggle('on', on);
    if (on) this.updateSeasonReadouts();
  }

  updateSeasonReadouts() {
    if (!this.state.seasons || !this.earth) return;
    const ss = seasonState(this.state.simDays, this.earth);
    const badgeEl = document.getElementById('season-title-badge');
    if (badgeEl) {
      badgeEl.textContent = '🌍 ' + SEASON_NAMES[ss.idx];
      badgeEl.style.color = SEASON_COLS[ss.idx];
    }
  }

  toggleFS() {
    const el = document.documentElement;
    const isOn = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isOn) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }

  onFSChange() {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const fsBtn = document.getElementById('tgl-fs');
    fsBtn.textContent = on ? 'PENCERE' : 'TAM EKRAN';
    fsBtn.classList.toggle('on', on);
  }

  updateHUD() {
    const d = new Date(EPOCH_MS + this.state.simDays * 86400000);
    this.hudDate.textContent = d.toISOString().slice(0, 10) + '  ·  ' + (this.state.simDays >= 0 ? '+' : '') + (this.state.simDays / 365.25).toFixed(2) + ' yıl';
    if (this.state.travel) this.hudSpeed.textContent = '⏩ ZAMAN SIÇRAMASI...';
    else this.hudSpeed.textContent = (this.state.daysPerSec === 0) ? 'DURAKLATILDI' :
      ((this.state.timeDir < 0 ? '◀◀ ' : '') + this.state.daysPerSec.toFixed(1) + ' gün/sn ≈ ' +
        Math.round(this.state.daysPerSec * 86400).toLocaleString('tr-TR') + '× gerçek' + (this.state.timeDir < 0 ? ' (geriye)' : ''));

    if (this.state.infoBody && !this.state.infoBody.isSun) {
      document.getElementById('i-live').textContent = (this.state.infoBody._rAU != null) ? this.state.infoBody._rAU.toFixed(3) + ' AU' : '—';
    }

    if (this.state.seasons) {
      this.updateSeasonReadouts();
    }

    // Eclipse Banner Updates
    if (this.state.ecl.solar) {
      const sm = this.state.ecl.solarMag;
      this.eclipseBanner.textContent = '🌑 ' + (sm >= 1 ? 'TAM' : 'PARÇALI') + ' GÜNEŞ TUTULMASI — Ay’ın gölgesi Dünya’da (büyüklük %' + Math.round(Math.min(sm, 1.05) * 100) + ')';
      this.eclipseBanner.className = 'panel show';
    } else if (this.state.ecl.lunar) {
      const lm = this.state.ecl.lunarMag;
      this.eclipseBanner.textContent = '🔴 ' + (lm >= 1 ? 'TAM' : 'PARÇALI') + ' AY TUTULMASI — Ay, Dünya’nın gölgesinde (%' + Math.round(Math.min(lm, 1.05) * 100) + ')';
      this.eclipseBanner.className = 'panel show lunar';
    } else {
      this.eclipseBanner.className = 'panel';
    }

    if (!this.state.nextEclipse || this.state.simDays > this.state.nextEclipse.peakDay + 0.5) {
      this.state.nextEclipse = findNextEclipse(this.state.simDays + 0.05, this.earth, this.earthMoon);
    }

    if (this.state.nextEclipse) {
      const ne = this.state.nextEclipse;
      const ed = new Date(EPOCH_MS + ne.peakDay * 86400000);
      const daysLeft = Math.max(0, Math.round(ne.peakDay - this.state.simDays));
      this.hudEclipse.textContent = (ne.type === 'solar' ? 'Güneş' : 'Ay') + ' · ' + ed.toISOString().slice(0, 10) + ' · ' + daysLeft + ' gün';
    }
  }
}
