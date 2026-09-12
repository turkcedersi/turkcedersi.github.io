/**
 * Solar System Simulator - Main Application Entry Point
 * Initializes modules, manages time clock, 3D camera interpolation, camera tracking (follow mode), and drives the frame loop.
 */

import { SUN, PLANETS, MOONS, PROBES, CASSINI, DEFAULT_ZOOM, SPIN_CAP, DEG, INC_SCALE, ORBIT_UNIT, ORBIT_POW } from './data.js';
import { updatePositions, computeEclipseState, initSeasonMarkers, project } from './physics.js';
import { initTextures } from './textures.js';
import { Renderer2D } from './renderer2d.js';
import { UIManager } from './ui.js';

class SolarApp {
  constructor() {
    this.allBodies = [];
    this.planets = PLANETS;
    this.moons = MOONS;
    this.probes = PROBES;

    this.halley = null;
    this.jupiter = null;
    this.saturn = null;
    this.earth = null;
    this.earthMoon = null;

    this.state = {
      simDays: 0, spinT: 0, daysPerSec: 10, lastT: 0,
      timeDir: 1, travel: null,
      cam: { x: 0, y: 0, zoom: 0.45 },
      camTarget: { x: 0, y: 0 }, zoomTarget: DEFAULT_ZOOM,
      tiltCur: 0, tiltTarget: 0, viewMode: 'top',
      viewRot: 0, viewRotTarget: 0, follow: false,
      showLabels: true, showOrbits: true,
      realScale: false, seasons: false,
      focus: null, hover: null, infoBody: null,
      ecl: { solar: false, lunar: false, solarMag: 0, lunarMag: 0 },
      nextEclipse: null,
      mouse: { x: 0, y: 0, down: false, dragged: false, button: 0, shiftKey: false, downX: 0, downY: 0, lastX: 0, lastY: 0 }
    };

    this.rafId = 0;
    this.hudAcc = 0;

    // Canvas references
    this.canvas2D = document.getElementById('space');
    this.portraitCanvas = document.getElementById('portrait');
    this.seasonOrbitCanvas = document.getElementById('season-orbit');
    this.seasonEarthCanvas = document.getElementById('season-earth');
  }

  init() {
    this.initBodies();
    initTextures(this.allBodies);
    initSeasonMarkers(this.earth);

    this.renderer2D = new Renderer2D(
      this.canvas2D, this.portraitCanvas,
      this.seasonOrbitCanvas, this.seasonEarthCanvas
    );
    this.renderer2D.resize(window.innerWidth, window.innerHeight, Math.min(2, window.devicePixelRatio || 1));
    this.renderer2D.generateBelt();
    this.renderer2D.generateKuiper();
    this.renderer2D.generateTrojans();

    this.ui = new UIManager(
      this.state, this.allBodies, this.planets,
      this.earth, this.earthMoon, this.renderer2D
    );

    this.ui.bindEvents(() => this.onDblClick());

    this.ui.updateHUD();
    requestAnimationFrame((t) => this.frame(t));
  }

  initBodies() {
    for (let i = 0; i < PLANETS.length; i++) {
      const b = PLANETS[i];
      if (b.isComet) {
        const qVis = ORBIT_UNIT * Math.pow(b.qAU, ORBIT_POW);
        const QVis = ORBIT_UNIT * Math.pow(b.QAU, ORBIT_POW);
        b.aVis = (qVis + QVis) / 2;
        b.e = (QVis - qVis) / (QVis + qVis);
      } else {
        b.aVis = ORBIT_UNIT * Math.pow(b.aAU, ORBIT_POW);
      }
      b.wRad = b.w * DEG;
      b.incRad = b.inc * DEG * INC_SCALE;
      b.orbC = 'rgba(' + b.glow + ',0.20)';
      b.orbHi = 'rgba(' + b.glow + ',0.55)';
      const pts = [], n = 180, bb = b.aVis * Math.sqrt(1 - b.e * b.e);
      const cw = Math.cos(b.wRad), sw2 = Math.sin(b.wRad);
      const ci = Math.cos(b.incRad), si = Math.sin(b.incRad);
      for (let k = 0; k <= n; k++) {
        const E = k / n * (Math.PI * 2);
        const xv = b.aVis * (Math.cos(E) - b.e), yv = bb * Math.sin(E);
        const px = xv * cw - yv * sw2, py = xv * sw2 + yv * cw;
        pts.push({ x: px, y: py * ci, z: py * si });
      }
      b._path = pts;
      if (b.key === 'halley') this.halley = b;
      if (b.key === 'jupiter') this.jupiter = b;
      if (b.key === 'saturn') this.saturn = b;
      if (b.key === 'earth') this.earth = b;
    }

    for (let i = 0; i < MOONS.length; i++) {
      for (let j = 0; j < PLANETS.length; j++) {
        if (PLANETS[j].key === MOONS[i].parentKey) { MOONS[i].parent = PLANETS[j]; break; }
      }
      if (MOONS[i].key === 'moon') this.earthMoon = MOONS[i];
    }

    for (let i = 0; i < PROBES.length; i++) {
      PROBES[i].dirRad = PROBES[i].dir * DEG;
      PROBES[i].latRad = PROBES[i].lat * DEG;
    }

    this.allBodies = [SUN, ...PLANETS, ...MOONS, ...PROBES, CASSINI];
    SUN._w = { x: 0, y: 0, z: 0 };
  }

  onDblClick() {
    this.state.focus = null;
    this.ui.closeInfo();
    this.state.camTarget.x = 0; this.state.camTarget.y = 0;
    this.state.zoomTarget = DEFAULT_ZOOM;
  }

  updateCamera(dt) {
    if (this.state.focus) {
      const q = project(this.state.focus._w, this.state.tiltCur, this.state.viewRot);
      this.state.camTarget.x = q.x; this.state.camTarget.y = q.y;
    }
    const k = 1 - Math.exp(-dt * 7);
    this.state.cam.x += (this.state.camTarget.x - this.state.cam.x) * k;
    this.state.cam.y += (this.state.camTarget.y - this.state.cam.y) * k;
    this.state.cam.zoom += (this.state.zoomTarget - this.state.cam.zoom) * (1 - Math.exp(-dt * 6));
  }

  frame(tms) {
    this.rafId = requestAnimationFrame((t) => this.frame(t));
    try {
      const t = tms / 1000;
      const dt = Math.min(0.05, this.state.lastT ? (t - this.state.lastT) : 0.016);
      this.state.lastT = t;

      let dtDays;
      if (this.state.travel) {
        this.state.travel.t += dt;
        const p = Math.min(1, this.state.travel.t / this.state.travel.dur);
        const ez = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        this.state.simDays = this.state.travel.from + (this.state.travel.to - this.state.travel.from) * ez;
        dtDays = 0;
        if (p >= 1) this.state.travel = null;
      } else {
        dtDays = this.state.daysPerSec * this.state.timeDir * dt;
        this.state.simDays += dtDays;
      }

      this.state.spinT += Math.min(this.state.daysPerSec, SPIN_CAP) * dt * this.state.timeDir;
      updatePositions(this.allBodies, this.state.simDays, this.saturn, this.earth, this.earthMoon);
      this.state.ecl = computeEclipseState(this.state.simDays, this.earth, this.earthMoon);
      this.renderer2D.updateTail(this.halley, dtDays);

      this.state.tiltCur += (this.state.tiltTarget - this.state.tiltCur) * (1 - Math.exp(-dt * 6));

      // Camera Follow (TAKİP) view rotation vs manual 3D view rotation
      if (this.state.follow && this.state.focus && !this.state.focus.isSun && this.state.focus._w) {
        this.state.viewRotTarget = -Math.atan2(this.state.focus._w.y, this.state.focus._w.x) - Math.PI / 2;
        let dr = this.state.viewRotTarget - this.state.viewRot;
        while (dr > Math.PI) dr -= Math.PI * 2;
        while (dr < -Math.PI) dr += Math.PI * 2;
        this.state.viewRot += dr * (1 - Math.exp(-dt * 3));
      }

      this.updateCamera(dt);
      this.renderer2D.updateMeteors(dt);

      this.renderer2D.render(t, this.state, this.allBodies, this.planets, this.moons, SUN, this.earth, this.earthMoon);
      this.renderer2D.drawPortrait(this.state.infoBody, this.state, t);
      this.renderer2D.drawSeasonPanel(this.earth, this.state);

      this.hudAcc += dt;
      if (this.hudAcc > 0.12) {
        this.hudAcc = 0;
        this.ui.updateHUD();
      }
    } catch (err) {
      console.error('Render Loop Error:', err);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new SolarApp();
  app.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker kaydı başarısız:', err);
    });
  }
});
