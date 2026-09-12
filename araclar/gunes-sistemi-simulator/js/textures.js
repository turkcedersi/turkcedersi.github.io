/**
 * Solar System Simulator - Procedural Texture Generator
 * Generates dynamic offscreen canvas textures for planets, moons, clouds, and city lights.
 */

import { TWO_PI } from './data.js';

export function makeTex(w, h, painter) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  painter(c.getContext('2d'), w, h);
  return c;
}

export function wEllipse(g, w, h, x, y, rx, ry, rot) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot || 0, 0, TWO_PI);
  g.fill();
  if (x < rx) {
    g.beginPath();
    g.ellipse(x + w, y, rx, ry, rot || 0, 0, TWO_PI);
    g.fill();
  }
  if (x > w - rx) {
    g.beginPath();
    g.ellipse(x - w, y, rx, ry, rot || 0, 0, TWO_PI);
    g.fill();
  }
}

export function degBlob(g, w, h, lon, lat, dlon, dlat, color) {
  const x = (lon + 180) / 360 * w, y = (90 - lat) / 180 * h;
  g.fillStyle = color;
  wEllipse(g, w, h, x, y, Math.max(1, dlon / 360 * w), Math.max(1, dlat / 180 * h), lon * 0.031);
}

export function landmass(g, w, h, lon, lat, dlon, dlat, palette, n) {
  for (let i = 0; i < (n || 14); i++) {
    const a = Math.random() * TWO_PI, rr = Math.sqrt(Math.random());
    degBlob(g, w, h, lon + Math.cos(a) * dlon * 0.6 * rr, lat + Math.sin(a) * dlat * 0.6 * rr,
      dlon * (0.28 + Math.random() * 0.4), dlat * (0.28 + Math.random() * 0.4),
      palette[(Math.random() * palette.length) | 0]);
  }
  degBlob(g, w, h, lon, lat, dlon * 0.55, dlat * 0.55, palette[0]);
}

export function craters(g, w, h, n, dark, light, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = h * 0.06 + Math.random() * h * 0.88, r = rmin + Math.random() * (rmax - rmin);
    g.globalAlpha = 0.45 + Math.random() * 0.4;
    g.fillStyle = dark;
    wEllipse(g, w, h, x, y, r, r * 0.9, 0);
    g.globalAlpha = 0.3;
    g.strokeStyle = light;
    g.lineWidth = Math.max(0.6, r * 0.28);
    g.beginPath();
    g.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
  }
  g.globalAlpha = 1;
}

export function hBands(g, w, h, rows, cols, alpha) {
  for (let i = 0; i < rows.length; i++) {
    const y0 = rows[i] * h, bh = h * (0.045 + ((i * 53) % 40) / 600);
    g.globalAlpha = alpha;
    g.fillStyle = cols[i % cols.length];
    g.beginPath();
    g.moveTo(0, y0);
    for (let x = 0; x <= w; x += 12) g.lineTo(x, y0 + Math.sin(x * 0.05 + i * 2.1) * h * 0.012);
    for (let x2 = w; x2 >= 0; x2 -= 12) g.lineTo(x2, y0 + bh + Math.sin(x2 * 0.043 + i * 3.3) * h * 0.012);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;
}

export function speckle(g, w, h, n, colors, maxA) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    g.globalAlpha = Math.random() * maxA;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random(), 1 + Math.random());
  }
  g.globalAlpha = 1;
}

export function paintMercuryTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#8f887c'); bg.addColorStop(0.5, '#a89f92'); bg.addColorStop(1, '#7a7266');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 900, ['#6a6258', '#c0b8aa'], 0.25);
  craters(g, w, h, 110, '#5c564c', '#d8d0c2', 1.5, 7);
  g.globalAlpha = 0.35; g.fillStyle = '#6e675c';
  wEllipse(g, w, h, w * 0.3, h * 0.45, w * 0.06, h * 0.1, 0);
  g.globalAlpha = 0.3; g.strokeStyle = '#c8c0b2'; g.lineWidth = 2;
  g.beginPath(); g.arc(w * 0.3, h * 0.45, w * 0.06, 0, TWO_PI); g.stroke();
  g.globalAlpha = 1;
}

export function paintVenusTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#d8b878'); bg.addColorStop(0.3, '#f0dca8'); bg.addColorStop(0.55, '#e8cf90'); bg.addColorStop(1, '#c8a060');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let x = -h; x < w + h; x += w / 14) {
    g.strokeStyle = 'rgba(255,244,214,0.28)'; g.lineWidth = h * 0.05;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h * 0.55, h * 0.5); g.lineTo(x, h); g.stroke();
    g.strokeStyle = 'rgba(190,140,80,0.18)'; g.lineWidth = h * 0.035;
    g.beginPath(); g.moveTo(x + w / 28, 0); g.lineTo(x + w / 28 + h * 0.55, h * 0.5); g.lineTo(x + w / 28, h); g.stroke();
  }
  speckle(g, w, h, 300, ['#fff4d0', '#c89858'], 0.12);
}

export function paintEarthTex(g, w, h) {
  const og = g.createLinearGradient(0, 0, 0, h);
  og.addColorStop(0, '#0a2f60'); og.addColorStop(0.22, '#124a8a'); og.addColorStop(0.5, '#1a62ac');
  og.addColorStop(0.78, '#124a8a'); og.addColorStop(1, '#0a2f60');
  g.fillStyle = og; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 500, ['#2a78c0', '#0d3a72'], 0.2);
  const greens = ['#2e7d3f', '#3c8a4a', '#55955c', '#6a9e62', '#4a8a50'];
  const land = [
    [-102, 46, 26, 16], [-152, 64, 14, 8], [-100, 28, 9, 7], [-88, 15, 7, 5],
    [-60, -6, 14, 16], [-66, -28, 8, 14], [-42, 74, 12, 7], [2, 50, 12, 6],
    [26, 56, 18, 9], [42, 62, 14, 7], [20, 10, 16, 14], [24, 0, 13, 10],
    [26, -16, 11, 10], [82, 48, 34, 14], [108, 36, 20, 10], [78, 22, 7, 8],
    [95, 14, 8, 6], [140, 62, 18, 8], [134, -25, 13, 9], [172, -42, 5, 6]
  ];
  for (let i = 0; i < land.length; i++) { const d = land[i]; landmass(g, w, h, d[0], d[1], d[2], d[3], greens); }
  const deserts = ['#c2a060', '#b89050', '#d0b070'];
  landmass(g, w, h, 17, 23, 16, 5, deserts, 8);
  landmass(g, w, h, 50, 24, 10, 5, deserts, 6);
  landmass(g, w, h, 134, -23, 10, 6, deserts, 6);
  landmass(g, w, h, -42, 74, 10, 6, ['#e8f0f5', '#dfe8ee'], 6);
  g.fillStyle = 'rgba(238,246,255,0.95)';
  g.fillRect(0, 0, w, h * 0.04);
  for (let j = 0; j < w; j += 10) wEllipse(g, w, h, j, h * 0.04, 8, 2 + Math.random() * 4, 0);
  g.fillRect(0, h * 0.945, w, h * 0.055);
  for (let j = 0; j < w; j += 10) wEllipse(g, w, h, j, h * 0.945, 9, 2 + Math.random() * 5, 0);
  speckle(g, w, h, 1500, ['#1a5030', '#78a878', '#0d3a72'], 0.15);
}

export function paintCloudsTex(g, w, h) {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w, y = h * 0.1 + Math.random() * h * 0.8;
    g.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.random() * 0.4) + ')';
    wEllipse(g, w, h, x, y, 10 + Math.random() * 45, 2 + Math.random() * 6, (Math.random() - 0.5) * 0.35);
  }
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5;
  for (let k = 0; k < 6; k++) {
    const cx = Math.random() * w, cy = h * 0.18 + Math.random() * h * 0.64;
    g.beginPath();
    for (let a = 0; a < 4.5; a += 0.25) {
      const rr = 1.5 + a * 2.6;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.7;
      if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
  }
}

export function paintLightsTex(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cities = [[-74, 40], [-87, 41], [-118, 34], [-122, 37], [-95, 29], [-99, 19], [-80, 43], [-3, 40], [2, 48], [13, 52],
  [37, 55], [24, 60], [12, 45], [23, 37], [31, 30], [28, -26], [36, -1], [32, 39], [44, 33], [51, 25], [72, 19], [77, 28],
  [90, 23], [103, 1], [106, -6], [114, 22], [121, 31], [127, 37], [139, 35], [151, -33], [174, -36], [-46, -23], [-58, -34],
  [-70, -33], [-75, 6], [3, 6], [18, 4], [36, 33], [35, 31], [121, 14]];
  g.fillStyle = '#ffd882';
  for (let i = 0; i < cities.length; i++) {
    const p = [(cities[i][0] + 180) / 360 * w, (90 - cities[i][1]) / 180 * h];
    for (let k = 0; k < 9; k++) {
      g.globalAlpha = 0.4 + Math.random() * 0.6;
      g.fillRect(p[0] + (Math.random() - 0.5) * 9, p[1] + (Math.random() - 0.5) * 6, 1.3, 1.3);
    }
  }
  g.globalAlpha = 1;
}

export function paintMarsTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#98482a'); bg.addColorStop(0.45, '#d07840'); bg.addColorStop(0.55, '#c87038'); bg.addColorStop(1, '#8a4026');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const darks = ['#7a3820', '#6a3018', '#8a4828'];
  landmass(g, w, h, 70, 12, 30, 13, darks, 12);
  landmass(g, w, h, 180, -8, 26, 10, darks, 10);
  landmass(g, w, h, -60, 18, 20, 9, darks, 9);
  landmass(g, w, h, 30, 25, 22, 8, ['#e8a060', '#d89050'], 8);
  g.strokeStyle = 'rgba(80,35,18,0.55)'; g.lineWidth = h * 0.012; g.lineCap = 'round';
  const vmx = (-70 + 180) / 360 * w, vmy = (90 + 8) / 180 * h;
  g.beginPath(); g.moveTo(vmx - w * 0.06, vmy);
  g.quadraticCurveTo(vmx, vmy - h * 0.02, vmx + w * 0.07, vmy + h * 0.01); g.stroke();
  g.fillStyle = 'rgba(255,252,246,0.95)';
  g.fillRect(0, 0, w, h * 0.035);
  for (let j = 0; j < w; j += 9) wEllipse(g, w, h, j, h * 0.035, 7, 2 + Math.random() * 3, 0);
  g.fillRect(0, h * 0.955, w, h * 0.045);
  for (let j = 0; j < w; j += 9) wEllipse(g, w, h, j, h * 0.955, 8, 2 + Math.random() * 3.5, 0);
  craters(g, w, h, 40, '#6a3018', '#e8b080', 1, 3.5);
  speckle(g, w, h, 1200, ['#8a4020', '#e89058'], 0.18);
}

export function paintJupiterTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#a88858'); bg.addColorStop(0.5, '#dcc8a4'); bg.addColorStop(1, '#987848');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  hBands(g, w, h, [0.06, 0.14, 0.22, 0.30, 0.40, 0.48, 0.56, 0.66, 0.76, 0.86],
    ['#c8a878', '#f0e4c8', '#a87848', '#e8d8b8', '#b8885a', '#f0e4c8', '#986838', '#e0c8a0', '#c09060', '#b89060'], 0.85);
  for (let k = 0; k < 200; k++) {
    const yk = Math.random() * h, x0 = Math.random() * w;
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,242,214,0.16)' : 'rgba(110,72,36,0.16)';
    g.lineWidth = 1 + Math.random() * 2.2;
    g.beginPath(); g.moveTo(x0, yk);
    for (let s2 = 1; s2 <= 5; s2++) g.lineTo(x0 + s2 * w * 0.012, yk + Math.sin(s2 * 0.9 + k) * h * 0.012);
    g.stroke();
  }
  const sx = w * 0.70, sy = h * 0.63;
  g.save(); g.translate(sx, sy);
  const rg = g.createRadialGradient(0, 0, 1, 0, 0, w * 0.052);
  rg.addColorStop(0, '#e87850'); rg.addColorStop(0.55, '#c85838'); rg.addColorStop(1, 'rgba(170,75,48,0)');
  g.fillStyle = rg;
  g.beginPath(); g.ellipse(0, 0, w * 0.052, h * 0.058, 0, 0, TWO_PI); g.fill();
  g.strokeStyle = 'rgba(245,190,150,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, 0, w * 0.036, h * 0.04, 0, 0, TWO_PI); g.stroke();
  g.fillStyle = 'rgba(255,225,195,0.75)';
  g.beginPath(); g.ellipse(0, 0, w * 0.013, h * 0.015, 0, 0, TWO_PI); g.fill();
  g.restore();
  g.fillStyle = 'rgba(250,246,232,0.85)';
  wEllipse(g, w, h, w * 0.30, h * 0.71, w * 0.012, h * 0.015, 0);
  wEllipse(g, w, h, w * 0.36, h * 0.73, w * 0.009, h * 0.011, 0);
  wEllipse(g, w, h, w * 0.52, h * 0.30, w * 0.010, h * 0.012, 0);
  g.fillStyle = 'rgba(140,110,80,0.55)'; g.fillRect(0, 0, w, h * 0.045); g.fillRect(0, h * 0.955, w, h * 0.045);
  speckle(g, w, h, 800, ['#f0e0c0', '#8a6030'], 0.12);
}

export function paintSaturnTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#c8a870'); bg.addColorStop(0.35, '#ecdcb4'); bg.addColorStop(0.6, '#e0c898'); bg.addColorStop(1, '#b89458');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  hBands(g, w, h, [0.10, 0.20, 0.30, 0.42, 0.52, 0.62, 0.72, 0.82],
    ['#d8c090', '#f0e4c4', '#c8a870', '#e8d4a8', '#d0b480', '#f0e0b8', '#c0a068', '#dcc494'], 0.6);
  for (let k = 0; k < 120; k++) {
    const yk = Math.random() * h, x0 = Math.random() * w;
    g.strokeStyle = 'rgba(255,240,205,0.12)'; g.lineWidth = 1 + Math.random() * 2;
    g.beginPath(); g.moveTo(x0, yk);
    for (let s2 = 1; s2 <= 4; s2++) g.lineTo(x0 + s2 * w * 0.015, yk + Math.sin(s2 + k) * h * 0.008);
    g.stroke();
  }
  g.fillStyle = 'rgba(170,140,95,0.5)'; g.fillRect(0, 0, w, h * 0.05); g.fillRect(0, h * 0.95, w, h * 0.05);
  speckle(g, w, h, 500, ['#f5ead0', '#a08048'], 0.10);
}

export function paintUranusTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#9fd4da'); bg.addColorStop(0.4, '#b8e4e8'); bg.addColorStop(0.75, '#8cc8d2'); bg.addColorStop(1, '#78b8c4');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  hBands(g, w, h, [0.25, 0.45, 0.65, 0.80], ['#c8ecef', '#a8dce2', '#bfe8ea', '#98d2da'], 0.35);
  g.fillStyle = 'rgba(225,248,250,0.35)';
  g.fillRect(0, 0, w, h * 0.16);
  speckle(g, w, h, 200, ['#d8f2f4', '#78b8c4'], 0.08);
}

export function paintNeptuneTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2848b0'); bg.addColorStop(0.45, '#3f6ce0'); bg.addColorStop(0.75, '#2c4cc0'); bg.addColorStop(1, '#1b2f8c');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  hBands(g, w, h, [0.18, 0.38, 0.58, 0.75], ['#4a78e8', '#2c4cb8', '#5a88f0', '#3058cc'], 0.5);
  g.fillStyle = 'rgba(16,26,80,0.8)';
  wEllipse(g, w, h, w * 0.42, h * 0.42, w * 0.035, h * 0.045, 0.2);
  g.strokeStyle = 'rgba(140,180,255,0.35)'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(w * 0.42, h * 0.42, w * 0.042, h * 0.052, 0.2, 0, TWO_PI); g.stroke();
  g.strokeStyle = 'rgba(235,244,255,0.7)'; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(w * 0.55, h * 0.30);
  g.quadraticCurveTo(w * 0.62, h * 0.28, w * 0.70, h * 0.30); g.stroke();
  g.beginPath(); g.moveTo(w * 0.20, h * 0.62);
  g.quadraticCurveTo(w * 0.27, h * 0.60, w * 0.33, h * 0.62); g.stroke();
  speckle(g, w, h, 300, ['#5a88f0', '#182868'], 0.12);
}

export function paintPlutoTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#b08c60'); bg.addColorStop(0.5, '#d8bc90'); bg.addColorStop(1, '#98744c');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(78,56,42,0.75)';
  wEllipse(g, w, h, w * 0.15, h * 0.55, w * 0.11, h * 0.09, 0.15);
  wEllipse(g, w, h, w * 0.90, h * 0.50, w * 0.09, h * 0.08, -0.1);
  g.fillStyle = '#efe0c6';
  wEllipse(g, w, h, w * 0.50, h * 0.52, w * 0.055, h * 0.085, -0.25);
  wEllipse(g, w, h, w * 0.56, h * 0.56, w * 0.05, h * 0.075, 0.3);
  g.fillStyle = 'rgba(255,245,225,0.5)';
  wEllipse(g, w, h, w * 0.53, h * 0.54, w * 0.03, h * 0.05, 0);
  g.fillStyle = 'rgba(240,230,210,0.4)';
  g.fillRect(0, 0, w, h * 0.08);
  speckle(g, w, h, 700, ['#8a6844', '#e8d0a8'], 0.16);
}

export function paintMoonTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#9a9aa2'); bg.addColorStop(0.5, '#b8b8c0'); bg.addColorStop(1, '#8a8a92');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const mares = ['#6e6e78', '#787882', '#64646e'];
  landmass(g, w, h, -20, 25, 22, 14, mares, 10);
  landmass(g, w, h, 10, 10, 16, 10, mares, 8);
  landmass(g, w, h, 30, -5, 10, 8, mares, 6);
  craters(g, w, h, 130, '#5c5c66', '#dcdce2', 1.2, 6);
  speckle(g, w, h, 800, ['#7a7a84', '#d0d0d8'], 0.18);
}

export function paintIoTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#d8c060'); bg.addColorStop(0.5, '#f0e088'); bg.addColorStop(1, '#c8a848');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const spots = ['#c87830', '#a85a20', '#e89848', '#8a4a18'];
  for (let i = 0; i < 26; i++) {
    g.fillStyle = spots[(Math.random() * spots.length) | 0];
    g.globalAlpha = 0.5 + Math.random() * 0.4;
    wEllipse(g, w, h, Math.random() * w, h * 0.1 + Math.random() * h * 0.8, 3 + Math.random() * 10, 2 + Math.random() * 7, Math.random());
  }
  g.globalAlpha = 0.5; g.fillStyle = '#f8f0d0';
  for (let i = 0; i < 12; i++) wEllipse(g, w, h, Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 3 + Math.random() * 5, 0);
  g.globalAlpha = 1;
  craters(g, w, h, 30, '#7a4a18', '#f8e8a0', 1, 3);
}

export function paintEuropaTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#d8d2c6'); bg.addColorStop(0.5, '#efe9dd'); bg.addColorStop(1, '#c8c2b6');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.lineWidth = 1.4;
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = Math.random() < 0.6 ? 'rgba(150,100,70,0.45)' : 'rgba(190,150,120,0.35)';
    const x0 = Math.random() * w, y0 = Math.random() * h;
    g.beginPath(); g.moveTo(x0, y0);
    const x1 = x0 + (Math.random() - 0.5) * w * 0.5, y1 = y0 + (Math.random() - 0.5) * h * 0.5;
    g.quadraticCurveTo((x0 + x1) / 2 + (Math.random() - 0.5) * 40, (y0 + y1) / 2 + (Math.random() - 0.5) * 40, x1, y1);
    g.stroke();
  }
  speckle(g, w, h, 400, ['#b8a890', '#f5efe5'], 0.15);
}

export function paintGanymedeTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#8a8070'); bg.addColorStop(0.5, '#a89c88'); bg.addColorStop(1, '#7a7060');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  landmass(g, w, h, -30, 20, 30, 18, ['#c8bca8', '#b8ac98', '#d0c4b0'], 12);
  landmass(g, w, h, 60, -15, 26, 16, ['#c8bca8', '#b8ac98'], 10);
  landmass(g, w, h, 140, 30, 24, 14, ['#6a6050', '#5e5446'], 9);
  craters(g, w, h, 90, '#54493c', '#e0d4c0', 1, 4.5);
  g.fillStyle = 'rgba(230,225,215,0.3)'; g.fillRect(0, 0, w, h * 0.07); g.fillRect(0, h * 0.93, w, h * 0.07);
}

export function paintCallistoTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#5e564c'); bg.addColorStop(0.5, '#787064'); bg.addColorStop(1, '#544c42');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  craters(g, w, h, 220, '#403a30', '#c8c0b0', 1, 5);
  g.strokeStyle = 'rgba(200,192,176,0.4)';
  for (let i = 1; i <= 4; i++) {
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(w * 0.62, h * 0.42, i * w * 0.02, 0, TWO_PI); g.stroke();
  }
  speckle(g, w, h, 900, ['#48423a', '#a89c8c'], 0.2);
}

export function paintTitanTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#d8a050'); bg.addColorStop(0.4, '#e8b868'); bg.addColorStop(0.7, '#d09848'); bg.addColorStop(1, '#b88038');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,80,30,0.45)';
  g.fillRect(0, 0, w, h * 0.14);
  g.fillStyle = 'rgba(90,60,20,0.6)';
  wEllipse(g, w, h, w * 0.3, h * 0.09, w * 0.05, h * 0.03, 0);
  wEllipse(g, w, h, w * 0.7, h * 0.11, w * 0.04, h * 0.025, 0);
  hBands(g, w, h, [0.35, 0.55, 0.75], ['#e8c078', '#c89040', '#dcb060'], 0.3);
  speckle(g, w, h, 300, ['#f0d090', '#a07030'], 0.1);
}

export function paintTritonTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#d8cfc8'); bg.addColorStop(0.5, '#ece4de'); bg.addColorStop(1, '#c0b6ae');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(230,180,170,0.5)';
  g.fillRect(0, h * 0.78, w, h * 0.22);
  g.strokeStyle = 'rgba(110,95,90,0.35)'; g.lineWidth = 1.2;
  for (let i = 0; i < 30; i++) {
    const x0 = Math.random() * w, y0 = h * 0.2 + Math.random() * h * 0.6;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 20 + Math.random() * 40, y0 + (Math.random() - 0.5) * 8); g.stroke();
  }
  speckle(g, w, h, 400, ['#b0a49c', '#f5efe8'], 0.15);
}

export function paintCeresTex(g, w, h) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#7a746a'); bg.addColorStop(0.5, '#948e82'); bg.addColorStop(1, '#6a645a');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  craters(g, w, h, 120, '#565046', '#b8b2a4', 1.2, 6);
  g.fillStyle = 'rgba(255,255,250,0.95)';
  wEllipse(g, w, h, w * 0.42, h * 0.46, 3, 2.4, 0);
  wEllipse(g, w, h, w * 0.45, h * 0.50, 2, 1.6, 0);
  g.fillStyle = 'rgba(255,255,250,0.25)';
  wEllipse(g, w, h, w * 0.43, h * 0.48, 8, 6, 0);
  speckle(g, w, h, 600, ['#5e584e', '#a8a296'], 0.2);
}

export function initTextures(allBodies) {
  const T = {
    mercury: [256, 128, paintMercuryTex], venus: [384, 192, paintVenusTex],
    earth: [512, 256, paintEarthTex], mars: [384, 192, paintMarsTex],
    jupiter: [512, 256, paintJupiterTex], saturn: [512, 256, paintSaturnTex],
    uranus: [384, 192, paintUranusTex], neptune: [384, 192, paintNeptuneTex],
    pluto: [384, 192, paintPlutoTex], ceres: [256, 128, paintCeresTex],
    moon: [256, 128, paintMoonTex], io: [256, 128, paintIoTex], europa: [256, 128, paintEuropaTex],
    ganymede: [256, 128, paintGanymedeTex], callisto: [256, 128, paintCallistoTex],
    titan: [256, 128, paintTitanTex], triton: [256, 128, paintTritonTex]
  };

  for (let i = 0; i < allBodies.length; i++) {
    const b = allBodies[i];
    const t = T[b.key];
    if (t) b.tex = makeTex(t[0], t[1], t[2]);
    if (b.key === 'earth') {
      b.texClouds = makeTex(512, 256, paintCloudsTex);
      b.texLights = makeTex(512, 256, paintLightsTex);
    }
  }
}
