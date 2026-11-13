/* MORVANE — petits effets visuels : particules d'ambiance, étincelles, âmes, feu de camp.
   Dessiné en gros pixels sur un calque transparent posé par-dessus un élément. Purement décoratif. */
var FX = (function () {
  'use strict';
  var SC = 3, MAXP = 170, layers = [], raf = 0, last = 0;
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  function R(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Ambiances : rate = particules par seconde, make = crée une particule (w, h en pixels du calque)
  var AMB = {
    dust: { rate: 5, make: function (w, h) { return { x: R(0, w), y: R(0, h), vx: R(-2, 2), vy: R(-1.5, 1), life: R(4, 7), c: pick(['#9fb4d8', '#c8d6ee', '#6f83a8']), s: 1, a: 0.5, tw: 1 }; } },
    leaves: { rate: 3, make: function (w, h) { return { x: R(-10, w), y: -2, vx: R(3, 9), vy: R(8, 16), life: R(6, 10), c: pick(['#6b5a2e', '#4c6b3a', '#7a4a2a', '#8a7a3a']), s: pick([1, 2]), a: 0.85, sway: R(1, 3) }; } },
    fireflies: { rate: 2.5, make: function (w, h) { return { x: R(0, w), y: R(h * 0.15, h * 0.8), vx: R(-4, 4), vy: R(-3, 3), life: R(3, 6), c: pick(['#d9e86a', '#f3ff9a', '#a8c84a']), s: 1, a: 1, tw: 3, wander: 1 }; } },
    gold: { rate: 5, make: function (w, h) { return { x: R(w * 0.2, w * 0.8), y: R(0, h * 0.5), vx: R(-2, -0.5), vy: R(2, 5), life: R(4, 7), c: pick(['#e8c877', '#fff1c4', '#c9a55a']), s: 1, a: 0.6, tw: 1.5 }; } },
    embers: { rate: 7, make: function (w, h) { return { x: R(0, w), y: h + 1, vx: R(-3, 3), vy: R(-36, -14), life: R(3.5, 7.5), c: pick(['#ff8a3c', '#ffd27a', '#ff5a1f', '#ffb347']), s: pick([1, 1, 2]), a: 0.95, tw: 4, sway: R(0.5, 2) }; } },
    void: { rate: 5, make: function (w, h) { return { x: R(0, w), y: R(h * 0.3, h), vx: R(-1.5, 1.5), vy: R(-9, -3), life: R(3, 6), c: pick(['#b48cff', '#e0ccff', '#7a4de0']), s: 1, a: 0.8, tw: 2.5 }; } },
    ash: { rate: 6, make: function (w, h) { return { x: R(0, w), y: -2, vx: R(-3, 3), vy: R(5, 12), life: R(8, 13), c: pick(['#8a8590', '#5e5a66', '#b0aab8']), s: 1, a: 0.55, sway: R(1, 2.5) }; } }
  };
  var BURST = {
    hit: ['#ffffff', '#e6e6f0', '#bfc6d8'], crit: ['#ffd23c', '#fff1a8', '#ff9a2e', '#ffffff'], blood: ['#ff5b6b', '#c2283a', '#8f1826'],
    heal: ['#6cf08a', '#b8ffc8', '#3fbf62'], gold: ['#d9a441', '#ffe9b8', '#ffd27a'], death: ['#3b3442', '#6a6076', '#1c1722', '#9a90a8'],
    star: ['#ffffff', '#fff1a8', '#bfe3ff'], ice: ['#bfe3ff', '#ffffff', '#7fb8ff'], burn: ['#ff8a3c', '#ffd27a', '#ff5a1f'],
    poison: ['#7ddc5a', '#b6ff8a', '#3f9a2e'], bleed: ['#c2283a', '#ff5b6b'], thorns: ['#9bd27a', '#e6e6f0'], chain: ['#bfe3ff', '#ffffff', '#8fa8ff'], skel: ['#e8e2d0', '#bdb49a']
  };
  function size(L) {
    var w = Math.max(1, Math.ceil(L.el.clientWidth / SC)), h = Math.max(1, Math.ceil(L.el.clientHeight / SC));
    if (w !== L.w || h !== L.h) { L.w = w; L.h = h; L.cv.width = w; L.cv.height = h; }
  }
  function attach(el, opt) {
    opt = opt || {}; if (!el || reduce) return null;
    var cv = document.createElement('canvas'); cv.className = 'fx'; el.appendChild(cv);
    var L = { el: el, cv: cv, ctx: cv.getContext('2d'), p: [], amb: AMB[opt.ambient] || null, fire: opt.fire || null, acc: 0, facc: 0, w: 0, h: 0, t: 0 };
    if (!L.ctx) return null;
    size(L); layers.push(L);
    if (opt.warm) { for (var t = 0; t < opt.warm; t += 0.05) step(L, 0.05); }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    return L;
  }
  function add(L, p) { if (L.p.length < MAXP) { p.max = p.life; L.p.push(p); } }
  function step(L, dt) {
    var i, p, w = L.w, h = L.h; L.t += dt;
    if (L.amb) { L.acc += L.amb.rate * dt * (w * h / 22000 + 0.5); while (L.acc >= 1) { L.acc--; add(L, L.amb.make(w, h)); } }
    if (L.fire) {
      L.facc += 55 * dt; var fx = L.fire.x * w, fy = L.fire.y * h;
      while (L.facc >= 1) { L.facc--; add(L, { x: fx + R(-4, 4), y: fy + R(-1, 1), vx: R(-3, 3), vy: R(-26, -12), life: R(0.35, 0.8), s: pick([1, 2, 2]), a: 1, fire: 1 }); }
    }
    for (i = L.p.length - 1; i >= 0; i--) {
      p = L.p[i]; p.life -= dt;
      if (p.life <= 0 || p.y > h + 6 || p.y < -8 || p.x < -14 || p.x > w + 14) { L.p.splice(i, 1); continue; }
      if (p.fly) { // vole vers une cible en accélérant
        var dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1; p.sp += 260 * dt;
        if (p.wait > 0) { p.wait -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; }
        else { p.x += dx / d * p.sp * dt; p.y += dy / d * p.sp * dt; if (d < 4) { L.p.splice(i, 1); continue; } }
        continue;
      }
      if (p.g) p.vy += p.g * dt;
      if (p.sway) p.x += Math.sin(L.t * p.sway + p.max * 9) * 6 * dt;
      if (p.wander) { p.vx += R(-14, 14) * dt; p.vy += R(-14, 14) * dt; p.vx *= 0.98; p.vy *= 0.98; }
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  function draw(L) {
    var ctx = L.ctx, i, p, k, a;
    ctx.clearRect(0, 0, L.w, L.h);
    if (L.fire) { // bûches
      var fx = Math.round(L.fire.x * L.w), fy = Math.round(L.fire.y * L.h);
      ctx.globalAlpha = 1; ctx.fillStyle = '#2a1a12'; ctx.fillRect(fx - 6, fy + 1, 12, 2); ctx.fillStyle = '#3d2618'; ctx.fillRect(fx - 5, fy, 4, 2); ctx.fillRect(fx + 1, fy, 5, 2);
      ctx.fillStyle = '#ff8a3c'; ctx.fillRect(fx - 2, fy, 1, 1); ctx.fillRect(fx + 2, fy + 1, 1, 1);
    }
    for (i = 0; i < L.p.length; i++) {
      p = L.p[i]; k = p.life / p.max;
      a = (p.a == null ? 1 : p.a) * Math.min(1, k * 3) * Math.min(1, (1 - k) * 8 + 0.2);
      if (p.tw) a *= 0.55 + 0.45 * Math.sin(L.t * p.tw * 3 + p.max * 20);
      if (p.fire) { ctx.fillStyle = k > 0.7 ? '#fff1a8' : k > 0.45 ? '#ffb347' : k > 0.2 ? '#ff6a1f' : '#8f2a12'; a = Math.min(1, k * 2.5); }
      else ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      var s = p.fire && k < 0.3 ? 1 : p.s;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    for (var i = layers.length - 1; i >= 0; i--) {
      var L = layers[i];
      if (!document.body.contains(L.cv)) { layers.splice(i, 1); continue; }
      if (document.hidden) continue;
      size(L); step(L, dt); draw(L);
    }
    raf = layers.length ? requestAnimationFrame(loop) : 0;
  }
  // Gerbe de particules. x, y en pixels CSS dans l'élément.
  function burst(L, x, y, kind, n) {
    if (!L) return; var cols = BURST[kind] || BURST.hit; x /= SC; y /= SC;
    var up = kind === 'heal', slow = kind === 'death';
    for (var i = 0; i < n; i++) {
      var ang = R(0, Math.PI * 2), sp = R(18, slow ? 45 : 85);
      add(L, { x: x + R(-3, 3), y: y + R(-3, 3), vx: Math.cos(ang) * sp * (up ? 0.3 : 1), vy: up ? R(-40, -15) : Math.sin(ang) * sp - 12, g: up ? 0 : slow ? -20 : 150, drag: 2.2, life: R(0.3, slow ? 1.1 : 0.65), c: pick(cols), s: pick([1, 1, 2]), a: 1 });
    }
  }
  // Des orbes partent de (x, y), s'éparpillent puis filent vers (tx, ty).
  function fly(L, x, y, tx, ty, kind, n) {
    if (!L) return; var cols = BURST[kind] || BURST.gold; x /= SC; y /= SC; tx /= SC; ty /= SC;
    for (var i = 0; i < n; i++) add(L, { x: x, y: y, vx: R(-40, 40), vy: R(-45, 10), tx: tx, ty: ty, sp: 30, wait: R(0.15, 0.45), fly: 1, life: 3, c: pick(cols), s: 2, a: 1, tw: 5 });
  }
  return { attach: attach, burst: burst, fly: fly };
})();
