/**
 * Solar System Simulator - 2D Renderer Module
 * Handles high-performance 2D Canvas rendering with offscreen background caching (stars/nebulae),
 * 3D frustum & view rotation projection, probe rendering, comet particle tails, eclipse effects,
 * season panel, info portraits, and physically accurate 3D Earth axial tilt texture alignment.
 */

import { TWO_PI, ORBIT_UNIT, ORBIT_POW, REAL_K, SEASON_EVENTS, SEASON_COLS, SEASON_NAMES, EPS, DEG, MOON_INC } from './data.js';
import { project, applyCam, clamp, seasonState, orbitPointAtNu, eventNu, daysToNextEvent, dayLengthHours, moonNode, moonOffsetFromU, earthAxis3DPoints } from './physics.js';

export class Renderer2D {
  constructor(canvas, portraitCanvas, seasonOrbitCanvas, seasonEarthCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.portraitCanvas = portraitCanvas;
    this.pctx = portraitCanvas.getContext('2d');
    this.soctx = seasonOrbitCanvas.getContext('2d');
    this.sectx = seasonEarthCanvas.getContext('2d');

    // Offscreen background canvas caching (Performance Optimization)
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');

    this.lightsCv = document.createElement('canvas');
    this.lightsG = this.lightsCv.getContext('2d');

    this.stars = [];
    this.belt = [];
    this.kuiper = [];
    this.trojans = [];
    this.tailIon = [];
    this.tailDust = [];
    this.meteors = [];
    this.meteorTimer = 2;
  }

  resize(W, H, dpr) {
    this.W = W; this.H = H; this.W2 = W / 2; this.H2 = H / 2;
    this.dpr = dpr;
    this.canvas.width = W * dpr; this.canvas.height = H * dpr;
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.bgCanvas.width = W;
    this.bgCanvas.height = H;
    this.generateStars();
    this.cacheBackground();
  }

  generateStars() {
    this.stars.length = 0;
    const n = Math.round(clamp(this.W * this.H / 6000, 240, 420));
    const cols = ['#ffffff', '#cfe0ff', '#ffe9c9', '#aac4ff', '#f6d7ff'];
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * this.W, y: Math.random() * this.H,
        r: 0.4 + Math.pow(Math.random(), 2) * 1.5,
        a: 0.2 + Math.random() * 0.65,
        tw: Math.random() < 0.38,
        sp: 0.6 + Math.random() * 2.6, ph: Math.random() * TWO_PI,
        d: 0.3 + Math.random() * 0.7,
        c: cols[(Math.random() * cols.length) | 0]
      });
    }
  }

  generateBelt() {
    this.belt.length = 0;
    for (let i = 0; i < 520; i++) {
      const aAU = 2.15 + Math.random() * 1.15;
      this.belt.push({
        a: ORBIT_UNIT * Math.pow(aAU, ORBIT_POW) * (0.97 + Math.random() * 0.06),
        th: Math.random() * TWO_PI, w: TWO_PI / (365.25 * Math.pow(aAU, 1.5)),
        s: 0.6 + Math.random() * 1.1, al: 0.15 + Math.random() * 0.4, z: (Math.random() - 0.5) * 6
      });
    }
  }

  generateKuiper() {
    this.kuiper.length = 0;
    for (let i = 0; i < 380; i++) {
      const aAU = (Math.random() < 0.3) ? (39.4 + (Math.random() - 0.5) * 2) : (32 + Math.random() * 16);
      this.kuiper.push({
        a: ORBIT_UNIT * Math.pow(aAU, ORBIT_POW) * (0.98 + Math.random() * 0.04),
        th: Math.random() * TWO_PI, w: TWO_PI / (365.25 * Math.pow(aAU, 1.5)),
        s: 0.6 + Math.random() * 1.2, al: 0.10 + Math.random() * 0.22, z: (Math.random() - 0.5) * 26
      });
    }
  }

  generateTrojans() {
    this.trojans.length = 0;
    for (let g = 0; g < 2; g++) {
      const base = (g === 0 ? 1 : -1) * 60 * DEG;
      for (let i = 0; i < 110; i++) {
        const spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * 14 * DEG;
        this.trojans.push({
          off: base + spread, dr: (Math.random() - 0.5) * 0.09, z: (Math.random() - 0.5) * 5,
          s: 0.6 + Math.random() * 1.0, al: 0.18 + Math.random() * 0.32
        });
      }
    }
  }

  cacheBackground() {
    const bg = this.bgCtx;
    const W = this.W, H = this.H, W2 = this.W2, H2 = this.H2;

    const bgGrad = bg.createRadialGradient(W2, H2, 0, W2, H2, Math.max(W, H) * 0.75);
    bgGrad.addColorStop(0, '#081124'); bgGrad.addColorStop(0.55, '#040814'); bgGrad.addColorStop(1, '#01030a');
    bg.fillStyle = bgGrad; bg.fillRect(0, 0, W, H);

    const R = Math.max(W, H);
    const defs = [[0.22, 0.30, 'rgba(64,42,120,0.10)', 0.50], [0.78, 0.68, 'rgba(28,70,130,0.10)', 0.45], [0.55, 0.15, 'rgba(120,50,90,0.06)', 0.35]];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i], x = d[0] * W, y = d[1] * H;
      const gr = bg.createRadialGradient(x, y, 0, x, y, R * d[3]);
      gr.addColorStop(0, d[2]); gr.addColorStop(1, 'rgba(0,0,0,0)');
      bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
    }
  }

  drawStars(g, t, state) {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      let x = (s.x - state.cam.x * 0.03 * s.d + state.viewRot * 30 * s.d) % this.W; if (x < 0) x += this.W;
      let y = (s.y - state.cam.y * 0.03 * s.d + state.tiltCur * 15 * s.d) % this.H; if (y < 0) y += this.H;
      g.globalAlpha = s.tw ? Math.max(0.05, s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph))) : s.a;
      g.fillStyle = s.c;
      g.beginPath(); g.arc(x, y, s.r, 0, TWO_PI); g.fill();
    }
    g.globalAlpha = 1;
  }

  drawSun(g, x, y, r, t, realScale) {
    const coronaM = realScale ? 1.8 : 5.4, innerM = realScale ? 1.35 : 2.2;
    const pulse = 1 + 0.055 * Math.sin(t * 1.6) + 0.03 * Math.sin(t * 2.9 + 1.3);

    let gr = g.createRadialGradient(x, y, r * 0.3, x, y, r * coronaM * pulse);
    gr.addColorStop(0, 'rgba(255,196,88,0.32)'); gr.addColorStop(0.35, 'rgba(255,150,50,0.12)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * coronaM * pulse, 0, TWO_PI); g.fill();

    gr = g.createRadialGradient(x, y, r * 0.2, x, y, r * innerM * pulse);
    gr.addColorStop(0, 'rgba(255,232,150,0.75)'); gr.addColorStop(0.5, 'rgba(255,180,70,0.28)'); gr.addColorStop(1, 'rgba(255,160,50,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * innerM * pulse, 0, TWO_PI); g.fill();

    gr = g.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x, y, r);
    gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.35, '#ffe88a'); gr.addColorStop(0.72, '#ffb63e'); gr.addColorStop(1, '#f4761b');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TWO_PI); g.fill();

    g.save(); g.beginPath(); g.arc(x, y, r, 0, TWO_PI); g.clip();
    g.translate(x, y); g.rotate(-t * 0.11);
    g.strokeStyle = 'rgba(255,140,40,0.18)'; g.lineWidth = r * 0.12;
    for (let j = 0; j < 5; j++) {
      g.beginPath(); g.arc(0, 0, r * (0.55 + 0.1 * j), j * 1.3, j * 1.3 + 1.1 + 0.3 * Math.sin(t * 0.8 + j)); g.stroke();
    }
    g.restore();
  }

  drawProbe(g, s, b, t) {
    const x = s.x, y = s.y, r = Math.max(3.2, s.r);
    g.strokeStyle = 'rgba(' + b.glow + ',0.5)'; g.lineWidth = 1;
    g.setLineDash([3, 3]); g.lineDashOffset = -t * 10;
    g.beginPath(); g.arc(x, y, r + 5 + Math.sin(t * 2) * 1.2, 0, TWO_PI); g.stroke();
    g.setLineDash([]);
    g.fillStyle = 'rgb(' + b.glow + ')';
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.7, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.7, y); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.arc(x, y, Math.max(1, r * 0.28), 0, TWO_PI); g.fill();
  }

  cometActivity(rAU) { return clamp((11 - rAU) / 9, 0, 1); }

  updateTail(halley, dtDays) {
    if (!halley || !halley._w) return;
    const act = this.cometActivity(halley._rAU || 99);
    halley._act = act;
    this.agePool(this.tailIon, dtDays);
    this.agePool(this.tailDust, dtDays);
    if (dtDays <= 0 || act <= 0.02) return;
    const p = halley._w, r = Math.max(1, Math.hypot(p.x, p.y));
    const ax = -p.x / r, ay = -p.y / r;
    const pv = halley._prevW || p;
    let vx = (p.x - pv.x) / dtDays, vy = (p.y - pv.y) / dtDays;
    const vm = Math.max(0.001, Math.hypot(vx, vy)); vx /= vm; vy /= vm;
    halley._prevW = { x: p.x, y: p.y, z: p.z };

    this.emitParticles(this.tailIon, 22 * act * dtDays, 200, () => {
      const sp = (2.8 + Math.random() * 2.2) * (0.6 + 0.6 * act), a = Math.random() * TWO_PI, j = Math.random() * 0.22;
      return {
        x: p.x, y: p.y, z: p.z, vx: ax * sp + Math.cos(a) * j * sp, vy: ay * sp + Math.sin(a) * j * sp, vz: (Math.random() - 0.5) * 0.3,
        age: 0, life: 18 + Math.random() * 14, s: 0.7 + Math.random() * 0.9
      };
    });

    this.emitParticles(this.tailDust, 14 * act * dtDays, 220, () => {
      const sp = (1.1 + Math.random() * 1.1) * (0.6 + 0.6 * act), a = Math.random() * TWO_PI, j = Math.random() * 0.35;
      const dx = ax * 0.55 - vx * 0.5, dy = ay * 0.55 - vy * 0.5, dm = Math.max(0.001, Math.hypot(dx, dy));
      return {
        x: p.x, y: p.y, z: p.z, vx: dx / dm * sp + Math.cos(a) * j * sp, vy: dy / dm * sp + Math.sin(a) * j * sp, vz: (Math.random() - 0.5) * 0.2,
        age: 0, life: 35 + Math.random() * 30, s: 0.8 + Math.random() * 1.1
      };
    });
  }

  emitParticles(pool, rate, max, factory) {
    const n = Math.floor(rate) + (Math.random() < (rate % 1) ? 1 : 0);
    for (let i = 0; i < n && pool.length < max; i++) pool.push(factory());
  }

  agePool(pool, dt) {
    const adt = Math.abs(dt);
    for (let i = pool.length - 1; i >= 0; i--) {
      const pt = pool[i]; pt.age += adt;
      if (pt.age >= pt.life) { pool.splice(i, 1); continue; }
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
    }
  }

  drawTail(g, state) {
    this.drawPool(g, this.tailIon, '140,190,255', state);
    this.drawPool(g, this.tailDust, '255,225,180', state);
  }

  drawPool(g, pool, rgb, state) {
    const z = state.cam.zoom, sz = Math.min(z, 2.5);
    const rotC = Math.cos(0), rotS = Math.sin(0);
    
    for (let i = 0; i < pool.length; i++) {
      const pt = pool[i];
      const q = project(pt, state.tiltCur, state.viewRot);
      const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      if (s.x < -10 || s.x > this.W + 10 || s.y < -10 || s.y > this.H + 10) continue;
      
      const f = 1 - pt.age / pt.life;
      // Twinkle effect: fluctuate opacity rapidly based on age and particle index
      const twinkle = 0.45 + 0.55 * Math.sin(pt.age * 12 + i * 7.3);
      g.globalAlpha = f * f * 0.65 * twinkle;
      
      const size = Math.max(1.0, pt.s * sz);
      
      // Sparkle and Glow style variations
      if (i % 4 === 0) {
        // Glowing ice crystal: draw a bright white core with a colored shadow glow
        g.shadowColor = 'rgba(' + rgb + ', 0.9)';
        g.shadowBlur = 6;
        g.fillStyle = '#ffffff'; // White hot core
        g.beginPath();
        g.arc(s.x, s.y, size * 0.85, 0, TWO_PI);
        g.fill();
        g.shadowBlur = 0; // Reset shadow immediately
      } else if (i % 6 === 1) {
        // Star glint: draw a tiny 4-pointed star cross flare
        g.strokeStyle = 'rgba(' + rgb + ', 0.9)';
        g.lineWidth = 1.0;
        g.beginPath();
        g.moveTo(s.x - size * 2.2, s.y);
        g.lineTo(s.x + size * 2.2, s.y);
        g.moveTo(s.x, s.y - size * 2.2);
        g.lineTo(s.x, s.y + size * 2.2);
        g.stroke();
      } else {
        // Standard dust particle
        g.fillStyle = 'rgba(' + rgb + ', 0.85)';
        g.fillRect(s.x - size / 2, s.y - size / 2, size, size);
      }
    }
    g.globalAlpha = 1;
  }

  drawCometBody(g, s, act) {
    const x = s.x, y = s.y;
    const cr = Math.max(3, s.r * (2 + 6 * act));
    const gr = g.createRadialGradient(x, y, 0, x, y, cr * 2.2);
    gr.addColorStop(0, 'rgba(190,255,230,' + (0.25 + 0.5 * act) + ')');
    gr.addColorStop(0.4, 'rgba(120,220,200,' + (0.12 + 0.25 * act) + ')');
    gr.addColorStop(1, 'rgba(80,180,220,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, cr * 2.2, 0, TWO_PI); g.fill();
    g.fillStyle = '#cfd8d6';
    g.beginPath(); g.arc(x, y, Math.max(1.2, s.r * 0.8), 0, TWO_PI); g.fill();
  }

  updateMeteors(dt) {
    this.meteorTimer -= dt;
    if (this.meteorTimer <= 0) {
      this.meteorTimer = 2.5 + Math.random() * 7;
      let ang = Math.PI * 0.15 + Math.random() * Math.PI * 0.45;
      if (Math.random() < 0.5) ang = Math.PI - ang;
      const sp = 500 + Math.random() * 500;
      this.meteors.push({
        x: Math.random() * this.W, y: -20 + Math.random() * this.H * 0.4,
        vx: Math.cos(ang) * sp, vy: Math.abs(Math.sin(ang)) * sp,
        t: 0, life: 0.5 + Math.random() * 0.7, len: 70 + Math.random() * 90
      });
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.t += dt;
      if (m.t > m.life || m.x < -200 || m.x > this.W + 200 || m.y > this.H + 200) this.meteors.splice(i, 1);
    }
  }

  drawMeteors(g) {
    g.lineCap = 'round';
    for (let i = 0; i < this.meteors.length; i++) {
      const m = this.meteors[i];
      const f = 1 - m.t / m.life;
      const vm = Math.max(1, Math.hypot(m.vx, m.vy));
      const ux = m.vx / vm, uy = m.vy / vm;
      const tx = m.x - ux * m.len, ty = m.y - uy * m.len;
      const gr = g.createLinearGradient(m.x, m.y, tx, ty);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.85 * f) + ')');
      gr.addColorStop(0.25, 'rgba(190,215,255,' + (0.45 * f) + ')');
      gr.addColorStop(1, 'rgba(130,170,255,0)');
      g.strokeStyle = gr; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(tx, ty); g.stroke();
      g.fillStyle = 'rgba(255,255,255,' + (0.9 * f) + ')';
      g.beginPath(); g.arc(m.x, m.y, 1.6, 0, TWO_PI); g.fill();
    }
  }

  shadeSphereLocal(g, x, y, r, sunAng) {
    const lx = x + Math.cos(sunAng) * r * 0.35, ly = y + Math.sin(sunAng) * r * 0.35;
    let gr = g.createRadialGradient(lx, ly, r * 0.1, x, y, r * 1.02);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.72, 'rgba(4,7,16,0.10)');
    gr.addColorStop(1, 'rgba(2,4,12,0.55)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    const gx = Math.cos(sunAng), gy = Math.sin(sunAng);
    gr = g.createLinearGradient(x + gx * r, y + gy * r, x - gx * r, y - gy * r);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.55, 'rgba(3,5,14,0.04)');
    gr.addColorStop(0.8, 'rgba(2,3,10,0.42)');
    gr.addColorStop(1, 'rgba(1,2,8,0.78)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  drawCityLightsLocal(g, b, x, y, r, sunAng, spinTurns) {
    const size = Math.ceil(r * 2) + 2;
    if (this.lightsCv.width !== size || this.lightsCv.height !== size) {
      this.lightsCv.width = size; this.lightsCv.height = size;
    }
    const lg = this.lightsG;
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, size, size);
    lg.save();
    lg.beginPath(); lg.arc(size / 2, size / 2, r, 0, TWO_PI); lg.clip();
    const tex = b.texLights, dw = tex.width * (2 * r / tex.height);
    const u = spinTurns - Math.floor(spinTurns), px = (size / 2 - r) - u * dw;
    lg.drawImage(tex, px, size / 2 - r, dw, 2 * r);
    lg.drawImage(tex, px + dw, size / 2 - r, dw, 2 * r);
    lg.globalCompositeOperation = 'destination-in';
    const gx = Math.cos(sunAng), gy = Math.sin(sunAng);
    const gr = lg.createLinearGradient(size / 2 + gx * r, size / 2 + gy * r, size / 2 - gx * r, size / 2 - gy * r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.52, 'rgba(0,0,0,0)');
    gr.addColorStop(0.66, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.85, 'rgba(0,0,0,1)');
    lg.fillStyle = gr; lg.fillRect(0, 0, size, size);
    lg.restore();
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(this.lightsCv, x - size / 2, y - size / 2);
  }

  drawTexturedSphere(g, b, x, y, r, sunAng, spinTurns, tiltAng = 0) {
    g.save();
    g.translate(x, y);
    if (tiltAng) g.rotate(tiltAng);
    g.beginPath(); g.arc(0, 0, r, 0, TWO_PI); g.clip();

    const tex = b.tex, dw = tex.width * (2 * r / tex.height);
    const u = spinTurns - Math.floor(spinTurns), px = -r - u * dw;
    g.drawImage(tex, px, -r, dw, 2 * r);
    g.drawImage(tex, px + dw, -r, dw, 2 * r);

    if (b.texClouds && r > 6) {
      let u2 = spinTurns * 1.18 + 0.37; u2 = u2 - Math.floor(u2);
      const px2 = -r - u2 * dw;
      g.globalAlpha = 0.85;
      g.drawImage(b.texClouds, px2, -r, dw, 2 * r);
      g.drawImage(b.texClouds, px2 + dw, -r, dw, 2 * r);
      g.globalAlpha = 1;
    }

    const localSunAng = sunAng - tiltAng;
    this.shadeSphereLocal(g, 0, 0, r, localSunAng);
    if (b.texLights && r > 9) this.drawCityLightsLocal(g, b, 0, 0, r, localSunAng, spinTurns);
    g.restore();

    if (b.atm && r > 3) {
      const gr = g.createRadialGradient(x, y, r * 0.8, x, y, r * 1.15);
      gr.addColorStop(0, 'rgba(' + b.atm + ',0)');
      gr.addColorStop(0.72, 'rgba(' + b.atm + ',0.16)');
      gr.addColorStop(1, 'rgba(' + b.atm + ',0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r * 1.15, 0, TWO_PI); g.fill();
    }
  }

  drawRings(g, b, x, y, r, part) {
    g.save();
    g.translate(x, y); g.rotate(b.ringAng);
    g.beginPath();
    if (part === 'back') g.rect(-r * 3.2, -r * 3.2, r * 6.4, r * 3.2);
    else g.rect(-r * 3.2, 0, r * 6.4, r * 3.2);
    g.clip();
    const dim = (part === 'back') ? 0.7 : 1;
    for (let i = 0; i < b.rings.length; i++) {
      const rg = b.rings[i];
      g.globalAlpha = rg.a * dim; g.fillStyle = rg.c;
      g.beginPath();
      g.ellipse(0, 0, r * rg.o, r * rg.o * b.ringSq, 0, 0, TWO_PI);
      g.ellipse(0, 0, r * rg.i, r * rg.i * b.ringSq, 0, 0, TWO_PI);
      g.fill('evenodd');
    }
    g.globalAlpha = 0.25 * dim; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = Math.max(0.5, r * 0.03);
    g.beginPath(); g.ellipse(0, 0, r * b.rings[0].i, r * b.rings[0].i * b.ringSq, 0, 0, TWO_PI); g.stroke();
    g.globalAlpha = 1;
    g.restore();
  }

  drawPlanetBody(g, b, s, spinTurns, state) {
    const x = s.x, y = s.y, r = s.r, sunAng = s.sunAng;
    const glowColor = b.glow || '180,180,180';

    let tiltAng = 0;
    if (b.key === 'earth') {
      const projAxis = earthAxis3DPoints(b._w, 1, state ? state.tiltCur : 0, state ? state.viewRot : 0);
      tiltAng = projAxis.tiltAng;
    } else if (b.ringAng) {
      tiltAng = b.ringAng;
    }

    const gr = g.createRadialGradient(x, y, r * 0.4, x, y, r * 2.7 + 3);
    gr.addColorStop(0, 'rgba(' + glowColor + ',0.40)'); gr.addColorStop(1, 'rgba(' + glowColor + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.7 + 3, 0, TWO_PI); g.fill();

    if (b.rings) this.drawRings(g, b, x, y, r, 'back');

    if (b.tex && r > 2.5) {
      this.drawTexturedSphere(g, b, x, y, r, sunAng, spinTurns, tiltAng);
    } else {
      g.save(); g.beginPath(); g.arc(x, y, Math.max(r, 0.8), 0, TWO_PI); g.clip();
      const lx = x + Math.cos(sunAng) * r * 0.42, ly = y + Math.sin(sunAng) * r * 0.42;
      const gr2 = g.createRadialGradient(lx, ly, Math.max(r * 0.08, 0.1), x, y, Math.max(r, 0.8));
      const cols = b.cols || ['#cccccc', '#888888', '#444444'];
      gr2.addColorStop(0, cols[0]); gr2.addColorStop(0.55, cols[1]); gr2.addColorStop(1, cols[2]);
      g.fillStyle = gr2; g.fillRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2);
      this.shadeSphereLocal(g, x, y, r, sunAng);
      g.restore();
    }

    if (b.rings) this.drawRings(g, b, x, y, r, 'front');
    if (b.dim) { g.fillStyle = 'rgba(10,14,26,0.30)'; g.beginPath(); g.arc(x, y, r, 0, TWO_PI); g.fill(); }
  }

  drawOrbits(g, planets, state, rotC, rotS) {
    for (let i = 0; i < planets.length; i++) {
      const b = planets[i];
      if (state.seasonMode && b.key !== 'earth' && !b.isSun) continue;
      const hi = (state.focus === b);
      g.strokeStyle = hi ? b.orbHi : b.orbC;
      g.lineWidth = hi ? 1.5 : 1;
      g.beginPath();
      for (let k = 0; k < b._path.length; k++) {
        const q = project(b._path[k], state.tiltCur, state.viewRot);
        const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
        if (k === 0) g.moveTo(s.x, s.y); else g.lineTo(s.x, s.y);
      }
      g.stroke();
    }
  }

  drawMoonOrbits(g, moons, state, rotC, rotS) {
    if (!state.showOrbits || state.seasonMode) return;
    const flat = Math.cos(state.tiltCur);
    for (let i = 0; i < moons.length; i++) {
      const m = moons[i]; if (!m._visible) continue;
      const ps = m.parent._s;
      g.strokeStyle = 'rgba(' + m.glow + ',0.22)'; g.lineWidth = 0.8;
      if (m.key === 'moon') {
        const pw = m.parent._w;
        const Om = moonNode(state.simDays);
        g.beginPath();
        for (let k = 0; k <= 48; k++) {
          const u = k / 48 * TWO_PI;
          const off = moonOffsetFromU(u, Om, m.aVis);
          const q = project({ x: pw.x + off.x, y: pw.y + off.y, z: pw.z + off.z }, state.tiltCur, state.viewRot);
          const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
          if (k === 0) g.moveTo(s.x, s.y); else g.lineTo(s.x, s.y);
        }
        g.stroke();
      } else {
        g.beginPath();
        g.ellipse(ps.x, ps.y, m.aVis * state.cam.zoom, m.aVis * state.cam.zoom * flat, 0, 0, TWO_PI);
        g.stroke();
      }
    }
  }

  drawEclipseEffects(g, sunS, earth, earthMoon, ecl) {
    if (ecl.solar && earth._s && earth._s.r > 6) {
      const es = earth._s;
      const sunAngE = Math.atan2(sunS.y - es.y, sunS.x - es.x);
      const shx = es.x + Math.cos(sunAngE) * es.r * 0.62;
      const shy = es.y + Math.sin(sunAngE) * es.r * 0.62;
      const shr = Math.max(1.5, es.r * 0.16 * (0.4 + 0.6 * clamp(ecl.solarMag, 0, 1)));
      const sg = g.createRadialGradient(shx, shy, 0, shx, shy, shr * 2);
      sg.addColorStop(0, 'rgba(0,0,5,0.85)');
      sg.addColorStop(0.5, 'rgba(0,0,5,0.5)');
      sg.addColorStop(1, 'rgba(0,0,5,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(shx, shy, shr * 2, 0, TWO_PI); g.fill();
    }
    if (ecl.lunar && earthMoon._s) {
      const ms = earthMoon._s;
      const a = clamp(ecl.lunarMag, 0, 1) * 0.8;
      const rr = Math.max(ms.r, 1);
      const rg = g.createRadialGradient(ms.x, ms.y, 0, ms.x, ms.y, rr);
      rg.addColorStop(0, 'rgba(190,60,25,' + a + ')');
      rg.addColorStop(0.7, 'rgba(140,35,15,' + (a * 0.9) + ')');
      rg.addColorStop(1, 'rgba(80,15,8,' + (a * 0.8) + ')');
      g.fillStyle = rg;
      g.beginPath(); g.arc(ms.x, ms.y, rr, 0, TWO_PI); g.fill();
    }
  }

  drawSeasonMain(g, earth, sunS, state) {
    const ss = seasonState(state.simDays, earth);
    const nuNext = eventNu(SEASON_EVENTS[(ss.idx + 1) % 4].lam, earth);
    let dnu = (nuNext - ss.nu) % TWO_PI; if (dnu < 0) dnu += TWO_PI;
    g.strokeStyle = SEASON_COLS[ss.idx]; g.globalAlpha = 0.55; g.lineWidth = 2.5;
    g.beginPath();
    const rotC = Math.cos(0), rotS = Math.sin(0);
    for (let i = 0; i <= 40; i++) {
      const p = orbitPointAtNu(ss.nu + dnu * i / 40, earth);
      const q = project(p, state.tiltCur, state.viewRot);
      const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      if (i === 0) g.moveTo(s.x, s.y); else g.lineTo(s.x, s.y);
    }
    g.stroke(); g.globalAlpha = 1;

    g.font = '9px ui-monospace,Menlo,Consolas,monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) {
      const ev = SEASON_EVENTS[i];
      const q = project(ev.pos, state.tiltCur, state.viewRot);
      const s2 = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      if (s2.x < -30 || s2.x > this.W + 30 || s2.y < -30 || s2.y > this.H + 30) continue;
      g.fillStyle = SEASON_COLS[i];
      g.save(); g.translate(s2.x, s2.y); g.rotate(Math.PI / 4);
      g.fillRect(-3.2, -3.2, 6.4, 6.4); g.restore();
      const dx = s2.x - sunS.x, dy = s2.y - sunS.y, dl = Math.max(1, Math.hypot(dx, dy));
      g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 4;
      g.fillText(ev.name, s2.x + dx / dl * 27, s2.y + dy / dl * 27);
      g.shadowBlur = 0;
    }

    const es = earth._s;
    if (es && earth._w) {
      // 3D FORESHORTENED AXIS: uses raw (dx, dy) which naturally shorten from the top
      // and lengthen from the side — matching real 3D perspective projection.
      const projAxis = earthAxis3DPoints(earth._w, 1, state.tiltCur, state.viewRot);
      const sCenter = applyCam(projAxis.qCenter.x, projAxis.qCenter.y, state.cam, 1, 0, this.W2, this.H2, 0);

      // Scale raw projected direction by desired max screen length.
      // projAxis.dx/dy have magnitude ~sin(EPS)≈0.40 from top and ~1.0 from side.
      // Multiplying by R maps: top → 0.40*R (short stub), side → 1.0*R (full length).
      const R = Math.max(es.r * 1.25, es.r + 2);
      const sNorth = { x: sCenter.x + projAxis.dx * R, y: sCenter.y + projAxis.dy * R };
      const sSouth = { x: sCenter.x - projAxis.dx * R, y: sCenter.y - projAxis.dy * R };

      g.strokeStyle = 'rgba(230,240,255,0.95)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(sSouth.x, sSouth.y); g.lineTo(sNorth.x, sNorth.y); g.stroke();
      g.fillStyle = '#e6f0ff';
      g.beginPath(); g.arc(sNorth.x, sNorth.y, 2, 0, TWO_PI); g.fill();

      g.fillStyle = '#e6f0ff';
      g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 4;
      g.fillText('K', sNorth.x + projAxis.ax * 8, sNorth.y + projAxis.ay * 8);
      g.shadowBlur = 0;
    }
  }

  render(t, state, allBodies, planets, moons, sun, earth, earthMoon) {
    const g = this.ctx;
    g.drawImage(this.bgCanvas, 0, 0);

    this.drawStars(g, t, state);
    const rotC = Math.cos(0), rotS = Math.sin(0);
    if (state.showOrbits) this.drawOrbits(g, planets, state, rotC, rotS);

    const tiltN = state.tiltCur / (Math.PI / 2);
    const list = [];

    for (let i = 0; i < allBodies.length; i++) {
      const b = allBodies[i];
      if (b.isMoon) {
        const ps = b.parent && b.parent._s;
        b._visible = !!(ps && ps.r > 16);
        if (!b._visible) { b._s = null; continue; }
      }
      const q = project(b._w, state.tiltCur, state.viewRot);
      const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      const ds = clamp(1 - tiltN * q.depth * 0.00022, 0.72, 1.32);
      let rr;
      if (b.isProbe) rr = 4;
      else if (state.realScale && b.trueR) rr = Math.max(b.trueR * REAL_K * state.cam.zoom, b.isSun ? 4 : 0.4);
      else rr = Math.max(b.r * state.cam.zoom * ds, b.isSun ? 7 : 1.8);
      b._s = { x: s.x, y: s.y, r: rr, depth: q.depth };
      list.push(b);
    }

    list.sort((a, b2) => b2._s.depth - a._s.depth);
    const sunS = sun._s;

    this.drawMoonOrbits(g, moons, state, rotC, rotS);
    if (!state.seasonMode) {
      const alMul = clamp(state.cam.zoom * 0.9, 0.35, 1);
      this.drawBand(g, this.belt, '#b8a894', alMul, state, rotC, rotS);
      this.drawBand(g, this.kuiper, '#a8c0d8', alMul * 0.9, state, rotC, rotS);
      this.drawTrojans(g, planets, state, rotC, rotS);

      // Draw Halley Comet Tail
      const halley = planets.find(p => p.key === 'halley');
      if (halley) this.drawTail(g, state);
    }

    for (let k = 0; k < list.length; k++) {
      const bb = list[k], s = bb._s;
      if (state.seasonMode && bb.key !== 'earth' && !bb.isSun) continue;
      const m = bb.isSun ? s.r * 6 : (bb.isProbe ? 30 : s.r * 3 + 20);
      if (s.x < -m || s.x > this.W + m || s.y < -m || s.y > this.H + m) continue;
      if (bb.isSun) {
        this.drawSun(g, s.x, s.y, s.r, t, state.realScale);
      } else if (bb.isProbe) {
        this.drawProbe(g, s, bb, t);
      } else if (bb.isComet) {
        this.drawCometBody(g, s, bb._act || 0);
      } else {
        const sunAng = Math.atan2(sunS.y - s.y, sunS.x - s.x);
        this.drawPlanetBody(g, bb, { x: s.x, y: s.y, r: s.r, sunAng: sunAng }, state.spinT / bb.rot, state);
      }
    }

    this.drawEclipseEffects(g, sunS, earth, earthMoon, state.ecl);
    if (state.seasons) this.drawSeasonMain(g, earth, sunS, state);
    this.drawMeteors(g);
    if (state.focus && state.focus._s) this.drawReticle(g, state.focus._s, t);
    if (state.showLabels) this.drawLabels(g, allBodies, state);
  }

  drawTrojans(g, planets, state, rotC, rotS) {
    const jupiter = planets.find(p => p.key === 'jupiter');
    if (!jupiter || !jupiter._w) return;
    const th = Math.atan2(jupiter._w.y, jupiter._w.x);
    const rJ = Math.hypot(jupiter._w.x, jupiter._w.y);
    const alMul = clamp(state.cam.zoom * 0.9, 0.35, 1);
    g.fillStyle = '#c8b898';
    for (let i = 0; i < this.trojans.length; i++) {
      const t = this.trojans[i], ang = th + t.off, rr = rJ * (1 + t.dr);
      const q = project({ x: Math.cos(ang) * rr, y: Math.sin(ang) * rr, z: t.z }, state.tiltCur, state.viewRot);
      const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      if (s.x < -4 || s.x > this.W + 4 || s.y < -4 || s.y > this.H + 4) continue;
      g.globalAlpha = t.al * alMul;
      g.fillRect(s.x, s.y, t.s, t.s);
    }
    g.globalAlpha = 1;
  }

  drawBand(g, arr, color, alMul, state, rotC, rotS) {
    g.fillStyle = color;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      const ang = a.th + a.w * state.simDays;
      const q = project({ x: Math.cos(ang) * a.a, y: Math.sin(ang) * a.a, z: a.z }, state.tiltCur, state.viewRot);
      const s = applyCam(q.x, q.y, state.cam, rotC, rotS, this.W2, this.H2, 0);
      if (s.x < -4 || s.x > this.W + 4 || s.y < -4 || s.y > this.H + 4) continue;
      g.globalAlpha = a.al * alMul;
      g.fillRect(s.x, s.y, a.s, a.s);
    }
    g.globalAlpha = 1;
  }

  drawReticle(g, s, t) {
    g.save();
    g.strokeStyle = 'rgba(140,200,255,0.65)'; g.lineWidth = 1;
    g.setLineDash([5, 5]); g.lineDashOffset = -t * 20;
    g.beginPath(); g.arc(s.x, s.y, s.r + 9 + 2 * Math.sin(t * 2.4), 0, TWO_PI); g.stroke();
    g.restore();
  }

  drawLabels(g, allBodies, state) {
    g.font = '10px ui-monospace,Menlo,Consolas,monospace';
    g.textAlign = 'center'; g.textBaseline = 'bottom';
    for (let i = 0; i < allBodies.length; i++) {
      const b = allBodies[i], s = b._s; if (!s) continue;
      if (state.seasonMode && b.key !== 'earth' && !b.isSun) continue;
      if (b.isMoon && (!b._visible || b.parent._s.r < 26)) continue;
      if (s.x < -40 || s.x > this.W + 40 || s.y < -40 || s.y > this.H + 40) continue;
      const ly = s.y - s.r - 13;
      g.strokeStyle = 'rgba(190,210,255,0.35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(s.x, s.y - s.r - 3); g.lineTo(s.x, ly + 3); g.stroke();
      g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 4;
      g.fillStyle = 'rgba(215,228,255,0.92)';
      g.fillText(b.name.toUpperCase(), s.x, ly);
      g.shadowBlur = 0;
    }
  }

  drawPortrait(b, state, t) {
    if (!b || !document.getElementById('info').classList.contains('open')) return;
    // Skip procedural canvas drawing if a real photo is successfully loaded and visible
    const photoEl = document.getElementById('i-photo');
    if (photoEl && photoEl.style.display !== 'none' && photoEl.naturalWidth > 0) return;
    const g = this.pctx;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, 140, 140);
    if (b.isProbe) {
      this.drawProbePortrait(g, b);
      return;
    }
    if (b.isComet) {
      this.drawCometPortrait(g);
      return;
    }
    if (b.isSun) {
      this.drawSun(g, 70, 70, 32, t, false);
    } else {
      const r = b.rings ? 26 : 38;
      this.drawPlanetBody(g, b, { x: 70, y: 70, r: r, sunAng: -2.3 }, state.spinT / b.rot, state);
    }
  }

  drawProbePortrait(g, b) {
    g.save(); g.translate(70, 72);
    g.strokeStyle = 'rgb(' + b.glow + ')'; g.lineWidth = 2; g.fillStyle = 'rgb(' + b.glow + ')';
    g.beginPath(); g.ellipse(-14, -10, 26, 26, 0, Math.PI * 0.75, Math.PI * 1.45); g.stroke();
    g.beginPath(); g.moveTo(-14, -10); g.lineTo(8, 2); g.stroke();
    g.fillRect(4, -4, 26, 14);
    g.beginPath(); g.moveTo(30, 3); g.lineTo(46, 3); g.stroke();
    g.fillRect(44, 0, 6, 6);
    g.beginPath(); g.moveTo(17, -4); g.lineTo(17, -22); g.stroke();
    g.beginPath(); g.arc(17, -24, 3, 0, TWO_PI); g.fill();
    g.globalAlpha = 0.25;
    g.beginPath(); g.arc(0, 0, 52, 0, TWO_PI); g.stroke();
    g.globalAlpha = 1;
    g.restore();
  }

  drawCometPortrait(g) {
    let gr = g.createLinearGradient(48, 88, 118, 28);
    gr.addColorStop(0, 'rgba(150,220,255,0.5)'); gr.addColorStop(1, 'rgba(150,220,255,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(48, 88); g.lineTo(122, 18); g.lineTo(96, 60); g.closePath(); g.fill();
    gr = g.createLinearGradient(48, 88, 110, 52);
    gr.addColorStop(0, 'rgba(255,230,180,0.4)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(48, 88); g.lineTo(116, 56); g.lineTo(88, 82); g.closePath(); g.fill();
    gr = g.createRadialGradient(48, 88, 0, 48, 88, 16);
    gr.addColorStop(0, 'rgba(200,255,235,0.9)'); gr.addColorStop(1, 'rgba(120,220,200,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(48, 88, 16, 0, TWO_PI); g.fill();
    g.fillStyle = '#dfe8e4'; g.beginPath(); g.arc(48, 88, 4, 0, TWO_PI); g.fill();
  }

  drawSeasonPanel(earth, state) {
    if (!state.seasons) return;
    const ss = seasonState(state.simDays, earth);

    // Left Orbit Diagram
    const g = this.soctx;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, 140, 150);
    const cx = 70, cy = 75, R = 40;
    g.strokeStyle = 'rgba(160,190,255,0.25)'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, R, 0, TWO_PI); g.stroke();

    // Draw colored season arcs with CORRECTED angles
    // Drawing angle = event.lam - PI maps ecliptic longitude to circle position
    for (let i = 0; i < 4; i++) {
      let a0 = SEASON_EVENTS[i].lam - Math.PI;
      let a1 = SEASON_EVENTS[(i + 1) % 4].lam - Math.PI;
      if (a1 <= a0) a1 += TWO_PI; // handle wrap-around for the last arc (Kış)
      g.strokeStyle = SEASON_COLS[i];
      g.globalAlpha = (i === ss.idx) ? 0.85 : 0.22;
      g.lineWidth = (i === ss.idx) ? 3.5 : 2.5;
      g.beginPath(); g.arc(cx, cy, R, a0, a1); g.stroke();
    }
    g.globalAlpha = 1;

    // Draw Solstice & Equinox Month Labels at CORRECTED positions
    g.font = '8px ui-monospace,Menlo,Consolas,monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const labels = ['21 MART', '21 HAZİRAN', '23 EYLÜL', '21 ARALIK'];
    for (let i = 0; i < 4; i++) {
      const drawAng = SEASON_EVENTS[i].lam - Math.PI;
      const lx = cx + Math.cos(drawAng) * (R + 14);
      const ly = cy + Math.sin(drawAng) * (R + 14);
      g.fillStyle = SEASON_COLS[i]; // direct color mapping: event i → color i
      g.fillText(labels[i], lx, ly);
    }

    // Sun at center
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, 7);
    sg.addColorStop(0, '#fff3c0'); sg.addColorStop(0.6, '#ffc24a'); sg.addColorStop(1, 'rgba(255,150,40,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, 7, 0, TWO_PI); g.fill();

    // Earth dot position on orbit
    const lamE = ss.lamSun - Math.PI;
    const ex = cx + Math.cos(lamE) * R, ey = cy + Math.sin(lamE) * R;
    g.strokeStyle = 'rgba(140,200,255,0.5)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
    g.fillStyle = '#5aa9ff';
    g.beginPath(); g.arc(ex, ey, 3.5, 0, TWO_PI); g.fill();

    // Right Earth Tilt & Rays
    const g2 = this.sectx;
    g2.setTransform(2, 0, 0, 2, 0, 0);
    g2.clearRect(0, 0, 130, 150);
    const ex2 = 65, ey2 = 75, r2 = 32;

    // Tilt angle based on declination: positive dec → tilt left toward sun
    // In the panel, sun rays come from the LEFT. So:
    //   Summer (dec > 0): N pole tilts LEFT (toward sun) → negative phi
    //   Winter (dec < 0): N pole tilts RIGHT (away from sun) → positive phi
    const phi = -ss.dec; // simplified: tilt angle = negative declination
    const sunAngLocal = Math.PI; // sun is always on the left in this diagram

    g2.strokeStyle = 'rgba(255,210,110,0.7)'; g2.lineWidth = 1.2;
    const rayYs = [ey2 - 16, ey2, ey2 + 16];
    for (let i = 0; i < 3; i++) {
      const ry = rayYs[i];
      g2.beginPath(); g2.moveTo(10, ry); g2.lineTo(ex2 - r2 - 5, ry); g2.stroke();
      g2.beginPath(); g2.moveTo(ex2 - r2 - 5, ry); g2.lineTo(ex2 - r2 - 10, ry - 2.5);
      g2.moveTo(ex2 - r2 - 5, ry); g2.lineTo(ex2 - r2 - 10, ry + 2.5); g2.stroke();
    }

    g2.save();
    g2.translate(ex2, ey2);
    g2.rotate(phi);
    this.drawTexturedSphere(g2, earth, 0, 0, r2, sunAngLocal - phi, 0.52);

    const latLine = (latDeg, color, dash) => {
      const y = -r2 * Math.sin(latDeg * DEG), hw = r2 * Math.cos(latDeg * DEG);
      g2.strokeStyle = color; g2.lineWidth = 1; g2.setLineDash(dash);
      g2.beginPath(); g2.moveTo(-hw, y); g2.lineTo(hw, y); g2.stroke(); g2.setLineDash([]);
    };
    latLine(0, 'rgba(255,255,255,0.55)', []);
    latLine(23.44, 'rgba(255,210,110,0.7)', [3, 3]);
    latLine(-23.44, 'rgba(255,210,110,0.7)', [3, 3]);

    g2.strokeStyle = 'rgba(230,240,255,0.9)'; g2.lineWidth = 1.4;
    g2.beginPath(); g2.moveTo(0, -r2 * 1.25); g2.lineTo(0, r2 * 1.25); g2.stroke();
    g2.fillStyle = '#e6f0ff'; g2.beginPath(); g2.arc(0, -r2 * 1.25, 1.8, 0, TWO_PI); g2.fill();
    g2.restore();
  }
}
