/**
 * Solar System Simulator - Physics & Mechanics Module
 * Orbital mechanics, Kepler solver, 3D projection transformations, 3D fixed axial tilt vector math,
 * eclipse geometry, and seasonal solar declination calculations.
 *
 * COORDINATE SYSTEM:
 *   - X-Y plane = ecliptic plane, Z = perpendicular to ecliptic (north ecliptic pole = +Z)
 *   - Canvas convention: screen +Y = world +Y = downward
 *   - Orbital position angle = wRad + nu (longitude of perihelion + true anomaly)
 *   - lamSun = nu + wRad + PI = Sun's ecliptic longitude as seen from Earth
 *
 * EARTH AXIS:
 *   The North Pole unit vector is FIXED in inertial space.
 *   Its ecliptic projection points at angle PI/2 (the +Y direction in world coords).
 *   At the June solstice (lamSun = PI/2), Earth is at position angle -PI/2,
 *   so the Sun lies in the +Y direction from Earth → axis tilts TOWARD the Sun. ✓
 *   At the December solstice, Earth is at +PI/2, Sun in -Y → axis away from Sun. ✓
 */

import { TWO_PI, DEG, EPS, MOON_INC, MOON_NODE_PERIOD, SEASON_EVENTS } from './data.js';

export function clamp(v, mn, mx) {
  return v < mn ? mn : (v > mx ? mx : v);
}

/**
 * Solves Kepler's Equation M = E - e*sin(E) using Newton-Raphson iteration.
 */
export function solveKepler(M, e) {
  M = M % TWO_PI; if (M < 0) M += TWO_PI;
  let E = M;
  for (let i = 0; i < 15; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

/**
 * Calculates true 3D position vector for a planet body at simDays.
 * Position angle = wRad + nu (single rotation by longitude of perihelion).
 */
export function bodyPosition(b, simDays) {
  if (b.isSun) return { x: 0, y: 0, z: 0 };

  if (b.isProbe) {
    const tYr = simDays / 365.25;
    const rAU = b.r0 + b.v * tYr;
    b._rAU = rAU;
    const scale = b.scaleFac || 18;
    const rVis = rAU * scale;
    const cw = Math.cos(b.dirRad), sw = Math.sin(b.dirRad);
    const cl = Math.cos(b.latRad), sl = Math.sin(b.latRad);
    return { x: rVis * cw * cl, y: rVis * sw * cl, z: rVis * sl };
  }

  const nDays = b.period;
  const n = TWO_PI / nDays;
  const M = b.M0 * DEG + n * simDays;

  // Use the visual b.e (0.63) for position calculation to match drawn orbit line
  const E = solveKepler(M, b.e);
  const cosE = Math.cos(E), sinE = Math.sin(E);
  const nu = Math.atan2(Math.sqrt(1 - b.e * b.e) * sinE, cosE - b.e);

  const rVis = b.aVis * (1 - b.e * cosE);

  // Calculate real distance (AU) for the info card using real orbital elements
  if (b.isComet) {
    const realE = (b.QAU - b.qAU) / (b.QAU + b.qAU);
    const realA = (b.qAU + b.QAU) / 2;
    const realE_Kepler = solveKepler(M, realE);
    b._rAU = realA * (1 - realE * Math.cos(realE_Kepler));
  } else {
    b._rAU = b.aAU * (1 - b.e * cosE);
  }

  const theta = b.wRad + nu;
  const ci = Math.cos(b.incRad);
  const si = Math.sin(b.incRad);

  const x = rVis * Math.cos(theta);
  const y = rVis * Math.sin(theta) * ci;
  const z = rVis * Math.sin(theta) * si;

  return { x: x, y: y, z: z };
}

/**
 * Calculates Moon 3D node precession angle (retrograde).
 */
export function moonNode(simDays) {
  return -TWO_PI * simDays / MOON_NODE_PERIOD;
}

/**
 * Calculates Moon 3D offset vector from Earth.
 */
export function moonOffsetFromU(u, Om, aVis) {
  const inc = MOON_INC * DEG;
  const sinI = Math.sin(inc), cosI = Math.cos(inc);
  const sinU = Math.sin(u), cosU = Math.cos(u);
  const sinOm = Math.sin(Om), cosOm = Math.cos(Om);

  const x = aVis * (cosOm * cosU - sinOm * sinU * cosI);
  const y = aVis * (sinOm * cosU + cosOm * sinU * cosI);
  const z = aVis * (sinU * sinI);
  return { x: x, y: y, z: z };
}

/**
 * Updates positions for all bodies.
 */
export function updatePositions(allBodies, simDays, saturn, earth, earthMoon) {
  for (let i = 0; i < allBodies.length; i++) {
    const b = allBodies[i];
    if (b.isSun) {
      b._w = { x: 0, y: 0, z: 0 };
    } else if (b.isMoon) {
      if (b.key === 'moon') {
        const Om = moonNode(simDays);
        const u = (b.M0 ? b.M0 * DEG : 0) + (simDays / b.period) * TWO_PI;
        const off = moonOffsetFromU(u, Om, b.aVis);
        const pw = earth._w;
        b._w = { x: pw.x + off.x, y: pw.y + off.y, z: pw.z + off.z };
        b._off = off;
      } else {
        const u = (simDays / b.period) * TWO_PI;
        const pw = b.parent._w;
        b._w = {
          x: pw.x + Math.cos(u) * b.aVis,
          y: pw.y + Math.sin(u) * b.aVis,
          z: pw.z
        };
      }
    } else {
      b._w = bodyPosition(b, simDays);
    }
  }

  if (saturn) {
    const CassiniSpeed = 0.08;
    const casAngle = simDays * CassiniSpeed;
    const casR = saturn.r * 1.85;
    const cassini = allBodies.find(b => b.key === 'cassini');
    if (cassini && saturn._w) {
      cassini._w = {
        x: saturn._w.x + Math.cos(casAngle) * casR,
        y: saturn._w.y + Math.sin(casAngle) * casR * saturn.ringSq,
        z: saturn._w.z + Math.sin(casAngle) * 2
      };
    }
  }
}

/**
 * 3D Projection transformation including camera pitch (tilt) and yaw (viewRot).
 */
export function project3D(p, tilt, viewRot = 0) {
  const rotC = Math.cos(viewRot), rotS = Math.sin(viewRot);
  const rx = p.x * rotC - p.y * rotS;
  const ry = p.x * rotS + p.y * rotC;
  const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
  return {
    x: rx,
    y: ry * cosT - p.z * sinT,
    depth: ry * sinT + p.z * cosT
  };
}

export function project(p, tilt, viewRot = 0) {
  return project3D(p, tilt, viewRot);
}

export function applyCam(x, y, cam, rotC, rotS, W2, H2, viewRot) {
  const dx = x - cam.x, dy = y - cam.y;
  return {
    x: W2 + dx * cam.zoom,
    y: H2 + dy * cam.zoom
  };
}

/**
 * Earth's 3D North Pole unit vector in inertial ecliptic space.
 */
const EARTH_AXIS_UNIT_3D = {
  x: 0,
  y: Math.sin(EPS),    // +Y: ecliptic projection toward angle PI/2
  z: Math.cos(EPS)      // +Z: mostly vertical (pointing toward north ecliptic pole)
};

/**
 * Calculates 3D Earth axial tilt projected screen points and texture tilt angle.
 */
export function earthAxis3DPoints(earthWorldPos, L, tilt, viewRot) {
  const pCenter = earthWorldPos || { x: 0, y: 0, z: 0 };
  const pNorth = {
    x: pCenter.x + L * EARTH_AXIS_UNIT_3D.x,
    y: pCenter.y + L * EARTH_AXIS_UNIT_3D.y,
    z: pCenter.z + L * EARTH_AXIS_UNIT_3D.z
  };
  const pSouth = {
    x: pCenter.x - L * EARTH_AXIS_UNIT_3D.x,
    y: pCenter.y - L * EARTH_AXIS_UNIT_3D.y,
    z: pCenter.z - L * EARTH_AXIS_UNIT_3D.z
  };

  const qCenter = project3D(pCenter, tilt, viewRot);
  const qNorth = project3D(pNorth, tilt, viewRot);
  const qSouth = project3D(pSouth, tilt, viewRot);

  const dx = qNorth.x - qCenter.x;
  const dy = qNorth.y - qCenter.y;
  const len = Math.hypot(dx, dy) || 0.001;

  const nx = dx / len;
  const ny = dy / len;

  const tiltAng = Math.atan2(dy, dx) + Math.PI / 2;

  return {
    qCenter, qNorth, qSouth,
    dx: dx,
    dy: dy,
    len: len,
    ax: nx,
    ay: ny,
    tiltAng: tiltAng
  };
}

/**
 * Pure mathematical eclipse geometry calculation from the original project (ilk sürüm).
 * Calculates exact angular separation and disk sizes for Sun, Moon, and Earth shadow.
 */
export function eclipseGeometry(days, earth, earthMoon) {
  const eM0 = (earth && earth.M0 !== undefined ? earth.M0 : 357.53) * DEG;
  const ePer = earth ? earth.period : 365.25;
  const eE = earth ? earth.e : 0.0167;
  const eAU = earth ? earth.aAU : 1.0;
  const eVis = earth ? earth.aVis : 100;
  const eW = earth && earth.wRad !== undefined ? earth.wRad : 102.94 * DEG;
  const eInc = earth && earth.incRad !== undefined ? earth.incRad : 0;

  const M = (eM0 + TWO_PI * days / ePer) % TWO_PI;
  const E = solveKepler(M, eE);
  const xv = eVis * (Math.cos(E) - eE);
  const yv = eVis * Math.sqrt(1 - eE * eE) * Math.sin(E);
  const cw = Math.cos(eW), sw = Math.sin(eW);
  const px = xv * cw - yv * sw, py = xv * sw + yv * cw;
  const ci = Math.cos(eInc), si = Math.sin(eInc);
  const ep = { x: px, y: py * ci, z: py * si };

  const rAU = eAU * (1 - eE * Math.cos(E));
  const eN = Math.max(1e-9, Math.hypot(ep.x, ep.y, ep.z));
  const sx = -ep.x / eN, sy = -ep.y / eN, sz = -ep.z / eN;

  const mM0 = (earthMoon && earthMoon.M0 !== undefined ? earthMoon.M0 : 0) * DEG;
  const mPer = earthMoon ? earthMoon.period : 27.32;
  const u = (mM0 + TWO_PI * days / mPer) % TWO_PI;
  const Om = -TWO_PI * days / MOON_NODE_PERIOD;

  const mInc = MOON_INC * DEG;
  const mci = Math.cos(mInc), msi = Math.sin(mInc);
  const mco = Math.cos(Om), mso = Math.sin(Om);
  const mcu = Math.cos(u), msu = Math.sin(u);
  const mo = {
    x: mco * mcu - mso * msu * mci,
    y: mso * mcu + mco * msu * mci,
    z: msu * msi
  };

  const mN = Math.max(1e-9, Math.hypot(mo.x, mo.y, mo.z));
  const ux = mo.x / mN, uy = mo.y / mN, uz = mo.z / mN;

  const dotS = ux * sx + uy * sy + uz * sz;
  const sepSolar = Math.acos(clamp(dotS, -1, 1));
  const sepLunar = Math.acos(clamp(-dotS, -1, 1));

  const rkm = rAU * 1.496e8;
  const sunAngR = Math.asin(696000 / rkm);
  const moonAngR = Math.asin(1737 / 384400);
  const umbraKm = 6371 - 384400 * (696000 - 6371) / rkm;
  const umbraAngR = Math.asin(Math.max(0, umbraKm) / 384400);

  return { sepSolar, sepLunar, sunAngR, moonAngR, umbraAngR };
}

/**
 * Computes live solar and lunar eclipse geometry.
 */
export function computeEclipseState(simDays, earth, earthMoon) {
  const g = eclipseGeometry(simDays, earth, earthMoon);
  const solarTh = g.sunAngR + g.moonAngR;
  const lunarTh = g.umbraAngR + g.moonAngR;
  const solar = g.sepSolar < solarTh;
  const lunar = g.sepLunar < lunarTh;
  return {
    solar: solar,
    lunar: lunar,
    solarMag: solar ? clamp((solarTh - g.sepSolar) / (2 * g.sunAngR), 0, 1.3) : 0,
    lunarMag: lunar ? clamp((lunarTh - g.sepLunar) / (2 * g.moonAngR), 0, 1.3) : 0
  };
}

/**
 * Finds the next solar or lunar eclipse peak date (from original project).
 */
export function findNextEclipse(fromDays, earth, earthMoon) {
  let t = fromDays, end = fromDays + 1400, step = 0.02;
  while (t < end) {
    const g = eclipseGeometry(t, earth, earthMoon);
    const inSolar = g.sepSolar < g.sunAngR + g.moonAngR;
    const inLunar = g.sepLunar < g.umbraAngR + g.moonAngR;
    if (inSolar || inLunar) {
      const type = inSolar ? 'solar' : 'lunar';
      const lo = t - step, hi = t + 1.5;
      let bestT = t, bestSep = Infinity, bestG = g;
      for (let ft = lo; ft <= hi; ft += 0.004) {
        const fg = eclipseGeometry(ft, earth, earthMoon);
        const s = (type === 'solar') ? fg.sepSolar : fg.sepLunar;
        if (s < bestSep) { bestSep = s; bestT = ft; bestG = fg; }
      }
      if (bestT >= fromDays - 0.3) {
        const mag = (type === 'solar')
          ? (bestG.sunAngR + bestG.moonAngR - bestSep) / (2 * bestG.sunAngR)
          : (bestG.umbraAngR + bestG.moonAngR - bestSep) / (2 * bestG.moonAngR);
        return { type: type, peakDay: bestT, mag: mag };
      }
      t = hi; continue;
    }
    t += step;
  }
  return null;
}

/**
 * Finds the previous solar or lunar eclipse peak date.
 */
export function findPrevEclipse(fromDays, earth, earthMoon) {
  let t = fromDays, end = fromDays - 1400, step = 0.02;
  while (t > end) {
    const g = eclipseGeometry(t, earth, earthMoon);
    const inSolar = g.sepSolar < g.sunAngR + g.moonAngR;
    const inLunar = g.sepLunar < g.umbraAngR + g.moonAngR;
    if (inSolar || inLunar) {
      const type = inSolar ? 'solar' : 'lunar';
      const lo = t + step, hi = t - 1.5;
      let bestT = t, bestSep = Infinity, bestG = g;
      for (let ft = lo; ft >= hi; ft -= 0.004) {
        const fg = eclipseGeometry(ft, earth, earthMoon);
        const s = (type === 'solar') ? fg.sepSolar : fg.sepLunar;
        if (s < bestSep) { bestSep = s; bestT = ft; bestG = fg; }
      }
      if (bestT <= fromDays + 0.3) {
        const mag = (type === 'solar')
          ? (bestG.sunAngR + bestG.moonAngR - bestSep) / (2 * bestG.sunAngR)
          : (bestG.umbraAngR + bestG.moonAngR - bestSep) / (2 * bestG.moonAngR);
        return { type: type, peakDay: bestT, mag: mag };
      }
      t = hi; continue;
    }
    t -= step;
  }
  return null;
}

/**
 * Seasonal Math Calculations.
 */
export function seasonState(simDays, earth) {
  const nDays = earth ? earth.period : 365.256;
  const M = (earth ? earth.M0 * DEG : 0) + (TWO_PI / nDays) * simDays;
  const E = solveKepler(M, earth ? earth.e : 0.0167);
  const nu = Math.atan2(Math.sqrt(1 - 0.0167 * 0.0167) * Math.sin(E), Math.cos(E) - 0.0167);
  const w = earth ? earth.wRad : 1.796;
  let lamSun = (nu + w + Math.PI) % TWO_PI;
  if (lamSun < 0) lamSun += TWO_PI;
  const sinDec = Math.sin(EPS) * Math.sin(lamSun);
  const dec = Math.asin(sinDec);

  let idx;
  if (lamSun < Math.PI / 2) idx = 0;          // İlkbahar: [0°, 90°)
  else if (lamSun < Math.PI) idx = 1;          // Yaz: [90°, 180°)
  else if (lamSun < 3 * Math.PI / 2) idx = 2;  // Sonbahar: [180°, 270°)
  else idx = 3;                                 // Kış: [270°, 360°)

  return { lamSun, dec, idx, nu, M };
}

export function orbitPointAtNu(nu, earth) {
  const e = earth ? earth.e : 0.0167;
  const aVis = earth ? earth.aVis : 140;
  const r = aVis * (1 - e * e) / (1 + e * Math.cos(nu));
  const w = earth ? earth.wRad : 1.796;
  const u = w + nu;
  return { x: r * Math.cos(u), y: r * Math.sin(u), z: 0 };
}

export function eventNu(lamTarget, earth) {
  const w = earth ? earth.wRad : 1.796;
  let nu = (lamTarget - Math.PI - w) % TWO_PI;
  if (nu < 0) nu += TWO_PI;
  return nu;
}

export function daysToNextEvent(simDays, lamTarget, earth) {
  const ss = seasonState(simDays, earth);
  let dlam = (lamTarget - ss.lamSun) % TWO_PI;
  if (dlam < 0) dlam += TWO_PI;
  const nDays = earth ? earth.period : 365.25;
  return (dlam / TWO_PI) * nDays;
}

export function dayLengthHours(latDeg, decRad) {
  const phi = latDeg * DEG;
  const tanP = Math.tan(phi), tanD = Math.tan(decRad);
  const cosH = -tanP * tanD;
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  const H0 = Math.acos(cosH);
  return (2 * H0 / Math.PI) * 12;
}

export function initSeasonMarkers(earth) {
  for (let i = 0; i < SEASON_EVENTS.length; i++) {
    const ev = SEASON_EVENTS[i];
    const nu = eventNu(ev.lam, earth);
    ev.pos = orbitPointAtNu(nu, earth);
  }
}
