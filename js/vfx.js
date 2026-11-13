/* MORVANE — effets lumineux : éclats, ondes de choc, traits, colonnes de lumière, projectiles.
   Dessiné en haute définition sur un calque posé sur l'arène, en mode « lumière » (les couleurs s'additionnent).
   Purement décoratif : rien ici ne change le jeu. */
var VFX = (function () {
  'use strict';
  var layers = [], raf = 0, last = 0, MAX = 420, glowCache = {};
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  function R(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var PAL = {
    hit: ['#ffffff', '#dfe6ff', '#9fb4ff'], crit: ['#ffe27a', '#ffb02e', '#ffffff', '#ff7a1a'], blood: ['#ff5b6b', '#ff2a45', '#c2283a'],
    fire: ['#ffb347', '#ff6a1f', '#ffe9a8', '#ff3b1f'], holy: ['#fff4c4', '#ffd87a', '#ffffff'], dark: ['#b48cff', '#7a4de0', '#e0ccff', '#5a2bd0'],
    blade: ['#e9f4ff', '#9cc6ee', '#ffffff'], war: ['#ffd27a', '#ff8a3c', '#ffffff'], heal: ['#7dffa0', '#c9ffd8', '#3fe07a'], gold: ['#ffd27a', '#fff1c4', '#e8a53a'],
    ice: ['#bfe3ff', '#ffffff', '#7fb8ff'], poison: ['#9dff6a', '#5fdc3a', '#d4ffb0'], death: ['#8a7aa0', '#c9bfe0', '#4a3f5c'], ult: ['#ffe9b8', '#ffd23c', '#ffffff', '#ff9a2e'],
    fury: ['#ff5a3c', '#ffb347', '#ff2a2a'], curse: ['#c9ff8a', '#7ddc5a', '#eaffd0']
  };
  function pal(k) { return PAL[k] || PAL.hit; }

  // Petit disque lumineux, dessiné une fois par couleur puis réutilisé
  function glow(color) {
    var g = glowCache[color]; if (g) return g;
    g = document.createElement('canvas'); g.width = g.height = 64;
    var x = g.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, color); gr.addColorStop(0.55, color + '55'); gr.addColorStop(1, color + '00');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    glowCache[color] = g; return g;
  }

  function attach(el) {
    if (!el || reduce) return null;
    var cv = document.createElement('canvas'); cv.className = 'vfx'; el.appendChild(cv);
    var ctx = cv.getContext('2d'); if (!ctx) return null;
    var L = { el: el, cv: cv, ctx: ctx, p: [], w: 0, h: 0, dpr: 1, t: 0 };
    size(L); layers.push(L);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    return L;
  }
  function size(L) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = L.el.clientWidth, h = L.el.clientHeight;
    if (w !== L.w || h !== L.h || dpr !== L.dpr) { L.w = w; L.h = h; L.dpr = dpr; L.cv.width = Math.max(1, Math.round(w * dpr)); L.cv.height = Math.max(1, Math.round(h * dpr)); }
  }
  function add(L, o) { if (!L || L.p.length >= MAX) return null; o.max = o.life; L.p.push(o); return o; }

  // ---------- briques de base ----------
  function sparks(L, x, y, kind, n, o) {
    if (!L) return; o = o || {}; var cols = pal(kind), sp = o.speed || 220, dir = o.dir, spread = o.spread == null ? Math.PI * 2 : o.spread;
    for (var i = 0; i < n; i++) {
      var a = dir == null ? R(0, Math.PI * 2) : dir + R(-spread / 2, spread / 2), v = R(sp * 0.25, sp);
      add(L, { t: 'p', x: x + R(-4, 4), y: y + R(-4, 4), vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), g: o.g == null ? 420 : o.g, drag: o.drag == null ? 2.6 : o.drag, life: R(0.25, o.life || 0.7), s: R(o.size ? o.size * 0.5 : 5, o.size || 13), c: pick(cols), streak: o.streak !== false });
    }
  }
  function ring(L, x, y, kind, r, life, lw) { add(L, { t: 'ring', x: x, y: y, r: r || 70, life: life || 0.35, c: pal(kind)[0], lw: lw || 5 }); }
  function flash(L, x, y, kind, r, life) { add(L, { t: 'flash', x: x, y: y, r: r || 80, life: life || 0.18, c: pal(kind)[0] }); }
  // Croissant de lame : arc qui se déploie
  function slash(L, x, y, kind, len, ang) { add(L, { t: 'arc', x: x, y: y, r: len || 46, a: ang == null ? R(-0.9, 0.9) : ang, life: 0.2, c: pal(kind)[0], c2: pal(kind)[1], dirn: Math.random() < 0.5 ? 1 : -1 }); }
  function line(L, x1, y1, x2, y2, kind, w, life, jag) {
    var pts = [[x1, y1]], n = jag ? 7 : 1, dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d;
    for (var i = 1; i < n; i++) { var k = i / n, off = R(-jag, jag); pts.push([x1 + dx * k + nx * off, y1 + dy * k + ny * off]); }
    pts.push([x2, y2]);
    add(L, { t: 'line', pts: pts, life: life || 0.22, c: pal(kind)[0], c2: pal(kind)[1], w: w || 6 });
  }
  function pillar(L, x, y, kind, w, life) { add(L, { t: 'pillar', x: x, y: y, w: w || 46, life: life || 0.55, c: pal(kind)[0] }); }
  // Projectile lumineux avec traînée ; done() est appelé à l'arrivée
  function proj(L, x1, y1, x2, y2, kind, dur, done, arc) {
    if (!L) { if (done) done(); return; }
    if (!add(L, { t: 'proj', x1: x1, y1: y1, x2: x2, y2: y2, x: x1, y: y1, life: dur || 0.16, kind: kind, c: pal(kind)[0], arc: arc || 0, done: done, s: 20 }) && done) done();
  }

  // ---------- effets composés ----------
  function impact(L, x, y, crit, kind) {
    if (!L) return; var k = kind || (crit ? 'crit' : 'hit');
    flash(L, x, y, k, crit ? 74 : 40, 0.14); slash(L, x, y, k, crit ? 70 : 44);
    sparks(L, x, y, k, crit ? 16 : 7, { speed: crit ? 380 : 240 });
    if (crit) { ring(L, x, y, k, 78, 0.3, 5); slash(L, x, y, k, 62); }
  }
  // Sort lancé par le héros. kind : fire | holy | dark | blade | war. tg : liste de points {x, y}
  function cast(L, kind, hx, hy, tg, big) {
    if (!L) return; var i, t;
    ring(L, hx, hy, kind, big ? 150 : 84, big ? 0.5 : 0.34, big ? 8 : 5); sparks(L, hx, hy, kind, big ? 34 : 14, { speed: 260, g: -60, up: 80, life: 0.9 });
    for (i = 0; i < tg.length; i++) {
      t = tg[i];
      if (kind === 'fire') { (function (t) { proj(L, hx + 20, hy - 10, t.x, t.y, 'fire', 0.22, function () { flash(L, t.x, t.y, 'fire', 110, 0.25); ring(L, t.x, t.y, 'fire', 96, 0.38, 7); sparks(L, t.x, t.y, 'fire', 26, { speed: 330, g: -120, up: 60, life: 0.95 }); }, 36); })(t); }
      else if (kind === 'holy') { pillar(L, t.x, t.y, 'holy', big ? 78 : 54, 0.6); sparks(L, t.x, t.y, 'holy', 18, { speed: 200, g: -260, life: 1 }); ring(L, t.x, t.y + 22, 'holy', 70, 0.4, 4); }
      else if (kind === 'dark') { line(L, hx + 14, hy - 6, t.x, t.y, 'dark', 9, 0.3, 16); line(L, hx + 14, hy - 6, t.x, t.y, 'dark', 4, 0.36, 26); flash(L, t.x, t.y, 'dark', 90, 0.26); sparks(L, t.x, t.y, 'dark', 18, { speed: 240, g: -80, life: 0.9 }); }
      else if (kind === 'blade') { slash(L, t.x, t.y, 'blade', 86, -0.7); slash(L, t.x, t.y, 'blade', 86, 0.7); slash(L, t.x, t.y, 'blade', 64, 0); sparks(L, t.x, t.y, 'blade', 14, { speed: 420 }); }
      else { flash(L, t.x, t.y, 'war', 96, 0.2); ring(L, t.x, t.y, 'war', 110, 0.36, 9); ring(L, t.x, t.y, 'war', 64, 0.28, 5); sparks(L, t.x, t.y + 16, 'war', 20, { speed: 360, dir: -Math.PI / 2, spread: Math.PI * 0.9 }); }
    }
  }
  function death(L, x, y, boss) {
    if (!L) return;
    flash(L, x, y, 'death', boss ? 220 : 90, boss ? 0.5 : 0.22); ring(L, x, y, 'hit', boss ? 240 : 90, boss ? 0.7 : 0.4, boss ? 10 : 5);
    sparks(L, x, y, 'death', boss ? 60 : 16, { speed: boss ? 460 : 240, g: -140, life: boss ? 1.4 : 0.9, size: boss ? 18 : 12 });
    if (boss) { ring(L, x, y, 'crit', 170, 0.5, 6); sparks(L, x, y, 'crit', 40, { speed: 520, life: 1.2 }); pillar(L, x, y, 'holy', 120, 0.9); }
  }
  // Des lueurs quittent (x, y) et filent vers (tx, ty)
  function absorb(L, x, y, tx, ty, kind, n) {
    if (!L) return; var cols = pal(kind);
    for (var i = 0; i < n; i++) add(L, { t: 'fly', x: x + R(-8, 8), y: y + R(-8, 8), vx: R(-160, 160), vy: R(-220, -40), tx: tx, ty: ty, wait: R(0.08, 0.28), sp: 200, life: 1.6, s: R(9, 15), c: pick(cols) });
  }

  // ---------- boucle ----------
  function step(L, dt) {
    for (var i = L.p.length - 1; i >= 0; i--) {
      var p = L.p[i]; p.life -= dt;
      if (p.life <= 0) { L.p.splice(i, 1); if (p.t === 'proj' && p.done) p.done(); continue; }
      if (p.t === 'p') {
        p.vy += p.g * dt; var dr = 1 - Math.min(0.9, p.drag * dt); p.vx *= dr; p.vy *= dr; p.px = p.x; p.py = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
      } else if (p.t === 'fly') {
        if (p.wait > 0) { p.wait -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; }
        else { var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1; p.sp += 2600 * dt; p.px = p.x; p.py = p.y; p.x += dx / d * Math.min(d, p.sp * dt); p.y += dy / d * Math.min(d, p.sp * dt); if (d < 10) { L.p.splice(i, 1); continue; } }
      } else if (p.t === 'proj') {
        var k = 1 - p.life / p.max; p.px = p.x; p.py = p.y; p.x = p.x1 + (p.x2 - p.x1) * k; p.y = p.y1 + (p.y2 - p.y1) * k - Math.sin(k * Math.PI) * p.arc;
        if (Math.random() < 0.9) add(L, { t: 'p', x: p.x, y: p.y, vx: R(-30, 30), vy: R(-30, 30), g: 0, drag: 3, life: R(0.15, 0.35), s: R(6, 12), c: pick(pal(p.kind)), streak: false });
      }
    }
  }
  function draw(L) {
    var ctx = L.ctx, i, p, k, a, g, s;
    ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); ctx.clearRect(0, 0, L.w, L.h);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (i = 0; i < L.p.length; i++) {
      p = L.p[i]; k = Math.max(0, p.life / p.max);
      if (p.t === 'p' || p.t === 'fly' || p.t === 'proj') {
        s = p.t === 'proj' ? p.s * 2.4 : p.s * (0.4 + 0.6 * k) * 2; ctx.globalAlpha = p.t === 'proj' ? 1 : Math.min(1, k * 1.6);
        if (p.streak !== false && p.px != null) { ctx.strokeStyle = p.c; ctx.lineWidth = Math.max(1, s * 0.16); ctx.beginPath(); ctx.moveTo(p.px - (p.x - p.px) * 1.5, p.py - (p.y - p.py) * 1.5); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        ctx.drawImage(glow(p.c), p.x - s / 2, p.y - s / 2, s, s);
      } else if (p.t === 'ring') {
        a = 1 - k; ctx.globalAlpha = k * 0.9; ctx.strokeStyle = p.c; ctx.lineWidth = p.lw * (0.3 + k);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * (0.15 + 0.85 * Math.sqrt(a)), p.r * (0.15 + 0.85 * Math.sqrt(a)) * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (p.t === 'flash') {
        ctx.globalAlpha = k; s = p.r * 2 * (0.7 + 0.3 * (1 - k)); ctx.drawImage(glow(p.c), p.x - s / 2, p.y - s / 2, s, s);
      } else if (p.t === 'arc') {
        a = 1 - k; var sweep = 1.9 * Math.min(1, a * 2.4), st = p.a - 0.95 * p.dirn;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(st); ctx.scale(1, 0.55);
        ctx.globalAlpha = Math.min(1, k * 2.2); ctx.strokeStyle = p.c2; ctx.lineWidth = 11 * k + 2; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, sweep * p.dirn, p.dirn < 0); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, sweep * p.dirn, p.dirn < 0); ctx.stroke();
        ctx.restore();
      } else if (p.t === 'line') {
        ctx.globalAlpha = k; ctx.lineJoin = 'round';
        ctx.strokeStyle = p.c2; ctx.lineWidth = p.w * 2.2 * k + 1; ctx.beginPath(); p.pts.forEach(function (q, j) { if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = p.w * 0.7 * k + 0.5; ctx.beginPath(); p.pts.forEach(function (q, j) { if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
      } else if (p.t === 'pillar') {
        a = Math.sin(Math.min(1, (1 - k) * 3) * Math.PI / 2) * k; var w = p.w * (0.5 + 0.5 * k);
        g = ctx.createLinearGradient(p.x - w, 0, p.x + w, 0); g.addColorStop(0, p.c + '00'); g.addColorStop(0.35, p.c + 'aa'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.65, p.c + 'aa'); g.addColorStop(1, p.c + '00');
        ctx.globalAlpha = Math.min(1, a * 1.6); ctx.fillStyle = g; ctx.fillRect(p.x - w, -10, w * 2, p.y + 40);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    for (var i = layers.length - 1; i >= 0; i--) {
      var L = layers[i];
      if (!document.body.contains(L.cv)) { layers.splice(i, 1); continue; }
      if (document.hidden) continue;
      size(L);
      if (L.p.length || L.dirty) { step(L, dt); draw(L); L.dirty = L.p.length > 0; }
    }
    raf = layers.length ? requestAnimationFrame(loop) : 0;
  }
  return { attach: attach, sparks: sparks, ring: ring, flash: flash, slash: slash, line: line, pillar: pillar, proj: proj, impact: impact, cast: cast, death: death, absorb: absorb };
})();
