/* MORVANE - sprites : pixel-art procedural (aucune image), genere en code puis mis en cache.
   API : Sprites.url(id) / has(id) / size(id) / pixels(id) / ids
   Heros tournes vers la DROITE, monstres vers la GAUCHE (dessines vers la droite puis retournes). */
var Sprites = (function () {
'use strict';

/* ---------- palette commune ---------- */
var OUT = '#0a070d', DK = '#120c12';
var B1 = '#e6dfc8', B2 = '#b9b094', B3 = '#7d755f';                 // os
var S1 = '#9aa0ae', S2 = '#646a79', S3 = '#434756', S4 = '#2b2e3a'; // acier
var BL = '#cfd6e6';                                                 // lame
var F1 = '#ffe27a', F2 = '#ff8a2a', F3 = '#d8401c';                 // braise
var N1 = '#c8ffc0', N2 = '#4fe07a', N3 = '#1f8a4a';                 // ame verte
var V1 = '#e6b8ff', V2 = '#a04cff', V3 = '#5a1fa8', V4 = '#2a1244'; // vide
var A1 = '#f0cf6a', A2 = '#b88a2c', A3 = '#6e4e18';                 // or
var W1 = '#7a5a3c', W2 = '#553a26', W3 = '#35231a';                 // bois
var RD = '#c81e2c', RP = '#a08a5a';

/* ---------- tampon de dessin courant ---------- */
var cw = 0, ch = 0, col = null, base = null, flat = null, glow = null;

function begin(w, h) {
  cw = w; ch = h; col = new Array(w * h); base = new Array(w * h); flat = new Uint8Array(w * h); glow = [];
  for (var i = 0; i < w * h; i++) { col[i] = null; base[i] = null; }
}
function set(x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= cw || y >= ch) return;
  var i = y * cw + x;
  if (c.charAt(0) === '!') { c = c.slice(1); col[i] = c; base[i] = c; flat[i] = 1; }
  else { col[i] = c; base[i] = c; flat[i] = 0; }
}
/* rectangle */
function R(x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) set(x + i, y + j, c); }
/* ellipse pleine (centre, rayons) */
function inE(x, y, cx, cy, rx, ry) { var a = (x - cx) / (rx + 0.5), b = (y - cy) / (ry + 0.5); return a * a + b * b <= 1; }
function E(cx, cy, rx, ry, c) {
  for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++)
      if (inE(x, y, cx, cy, rx, ry)) set(x, y, c);
}
/* anneau (contour d'ellipse) */
function O(cx, cy, rx, ry, c) {
  for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++)
      if (inE(x, y, cx, cy, rx, ry) && !(inE(x - 1, y, cx, cy, rx, ry) && inE(x + 1, y, cx, cy, rx, ry) && inE(x, y - 1, cx, cy, rx, ry) && inE(x, y + 1, cx, cy, rx, ry))) set(x, y, c);
}
/* ligne (epaisseur w) */
function L(x0, y0, x1, y1, c, w) {
  w = w || 1; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy, o = Math.floor((w - 1) / 2);
  for (;;) {
    if (w === 1) set(x0, y0, c); else R(x0 - o, y0 - o, w, w, c);
    if (x0 === x1 && y0 === y1) break;
    var e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; }
  }
}
/* polygone plein, sommets inclus : P(couleur, [x,y, x,y, ...]) */
function P(c, p) {
  var n = p.length / 2, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, i, j;
  for (i = 0; i < n; i++) { minx = Math.min(minx, p[i * 2]); maxx = Math.max(maxx, p[i * 2]); miny = Math.min(miny, p[i * 2 + 1]); maxy = Math.max(maxy, p[i * 2 + 1]); }
  for (var y = miny; y <= maxy; y++) for (var x = minx; x <= maxx; x++) {
    var inside = false;
    for (i = 0, j = n - 1; i < n; j = i++) {
      var xi = p[i * 2], yi = p[i * 2 + 1], xj = p[j * 2], yj = p[j * 2 + 1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) set(x, y, c);
  }
  for (i = 0, j = n - 1; i < n; j = i++) L(p[j * 2], p[j * 2 + 1], p[i * 2], p[i * 2 + 1], c);
}
/* tube : disques le long d'une ligne brisee, rayon r0 -> r1 */
function T(pts, r0, r1, c) {
  var tot = 0, i, segs = [];
  for (i = 0; i < pts.length - 1; i++) { var d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(d); tot += d; }
  var done = 0;
  for (i = 0; i < segs.length; i++) {
    for (var s = 0; s <= segs[i]; s += 0.5) {
      var t = segs[i] ? s / segs[i] : 0, k = tot ? (done + s) / tot : 0, r = r0 + (r1 - r0) * k;
      E(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, r - 0.5, r - 0.5, c);
    }
    done += segs[i];
  }
}
/* points de detail (sans ombrage) : D(couleur, x,y, x,y, ...) */
function D(c) {
  for (var k = 1; k < arguments.length; k += 2) {
    var x = Math.round(arguments[k]), y = Math.round(arguments[k + 1]);
    if (x < 0 || y < 0 || x >= cw || y >= ch) continue;
    var i = y * cw + x; col[i] = c; flat[i] = 1; if (base[i] === null) base[i] = c;
  }
}
/* lueurs posees apres le contour (alpha accepte : #rrggbbaa) */
function G(c) { for (var k = 1; k < arguments.length; k += 2) glow.push([Math.round(arguments[k]), Math.round(arguments[k + 1]), c]); }
function GE(cx, cy, rx, ry, c) {
  for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++)
      if (inE(x, y, cx, cy, rx, ry)) glow.push([x, y, c]);
}
/* gomme */
function X(x, y, w, h) {
  w = w || 1; h = h || 1;
  for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
    var px = x + i, py = y + j; if (px < 0 || py < 0 || px >= cw || py >= ch) continue;
    var k = py * cw + px; col[k] = null; base[k] = null; flat[k] = 0;
  }
}

/* ---------- couleurs ---------- */
var hexCache = {};
function rgb(c) {
  var v = hexCache[c]; if (v) return v;
  var n = parseInt(c.slice(1, 7), 16);
  v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, c.length >= 9 ? parseInt(c.slice(7, 9), 16) : 255];
  hexCache[c] = v; return v;
}

/* ---------- finition : retournement, ombrage, contour, lueurs ---------- */
function finish(o) {
  var w = cw, h = ch, x, y, i, t;
  if (o.flip) {
    for (y = 0; y < h; y++) for (x = 0; x < (w >> 1); x++) {
      var a = y * w + x, b = y * w + (w - 1 - x);
      t = col[a]; col[a] = col[b]; col[b] = t;
      t = base[a]; base[a] = base[b]; base[b] = t;
      t = flat[a]; flat[a] = flat[b]; flat[b] = t;
    }
    for (i = 0; i < glow.length; i++) glow[i][0] = w - 1 - glow[i][0];
  }
  var data = new Uint8ClampedArray(w * h * 4), rim = rgb(o.rim || OUT);
  function diff(xx, yy, b) { if (xx < 0 || yy < 0 || xx >= w || yy >= h) return 1; var q = base[yy * w + xx]; return (q === null || q !== b) ? 1 : 0; }
  function full(xx, yy) { return xx >= 0 && yy >= 0 && xx < w && yy < h && col[yy * w + xx] !== null; }
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    i = y * w + x; var k = i * 4;
    if (col[i] !== null) {
      var c = rgb(col[i]), r = c[0], g = c[1], bl = c[2];
      if (!flat[i]) {
        var b0 = base[i], sc = diff(x, y - 1, b0) + diff(x - 1, y, b0) - diff(x, y + 1, b0) - diff(x + 1, y, b0);
        if (sc > 0) { r += (255 - r) * 0.2; g += (255 - g) * 0.2; bl += (255 - bl) * 0.2; }
        else if (sc < 0) { r *= 0.68; g *= 0.68; bl *= 0.7; }
      }
      data[k] = r; data[k + 1] = g; data[k + 2] = bl; data[k + 3] = 255;
    } else if (full(x - 1, y) || full(x + 1, y) || full(x, y - 1) || full(x, y + 1)) {
      data[k] = rim[0]; data[k + 1] = rim[1]; data[k + 2] = rim[2]; data[k + 3] = 255;
    }
  }
  for (i = 0; i < glow.length; i++) {
    x = glow[i][0]; y = glow[i][1]; if (x < 0 || y < 0 || x >= w || y >= h) continue;
    var gc = rgb(glow[i][2]), q = (y * w + x) * 4, al = gc[3] / 255, da = data[q + 3] / 255;
    if (da === 0) { data[q] = gc[0]; data[q + 1] = gc[1]; data[q + 2] = gc[2]; data[q + 3] = gc[3]; }
    else {
      var oa = al + da * (1 - al);
      data[q] = (gc[0] * al + data[q] * da * (1 - al)) / oa; data[q + 1] = (gc[1] * al + data[q + 1] * da * (1 - al)) / oa;
      data[q + 2] = (gc[2] * al + data[q + 2] * da * (1 - al)) / oa; data[q + 3] = oa * 255;
    }
  }
  return { w: w, h: h, data: data };
}

/* ---------- registre ---------- */
var defs = {}, ids = [], pxCache = {}, urlCache = {};
function def(id, w, h, o, fn) { defs[id] = { w: w, h: h, o: o || {}, fn: fn }; if (id.charAt(0) !== '_') ids.push(id); }
function hero(id, fn, o) { def(id, 24, 24, o, fn); }
function mon(id, fn, o) { o = o || {}; o.flip = true; def(id, 24, 24, o, fn); }
function elite(id, fn, o) { o = o || {}; o.flip = true; def(id, 32, 32, o, fn); }
function boss(id, fn, o) { o = o || {}; o.flip = true; def(id, 48, 48, o, fn); }

/* ================= HEROS (24x24, vers la droite) ================= */
hero('chevalier', function () {
  var cape = '#7a2230';
  P(cape, [8, 8, 5, 12, 3, 20, 5, 19, 6, 21, 8, 19, 9, 21, 11, 10]);
  D('#4c121c', 5, 15, 7, 17, 6, 13);
  L(6, 12, 4, 2, BL); D('#ffffff', 4, 2, 5, 5); L(4, 12, 8, 12, A2); D(A3, 6, 13, 6, 14);
  R(9, 16, 3, 5, S3); R(13, 16, 3, 5, S3); R(9, 21, 4, 2, S4); R(13, 21, 4, 2, S4);
  D(S1, 10, 17, 14, 17);
  R(8, 9, 8, 7, S2); R(8, 15, 8, 1, W2); D(A2, 11, 15);
  D(S3, 10, 11, 11, 12, 13, 10); D(S1, 9, 10);
  E(8.5, 9, 1.5, 1.5, S1);
  R(9, 2, 6, 6, S2); R(9, 2, 6, 1, S1); R(11, 4, 4, 2, '!#0e0b12'); D(F2, 13, 4); D(S2, 12, 5, 14, 5);
  D(S3, 10, 6, 10, 7); D(cape, 10, 1, 9, 1, 8, 2, 11, 0);
  P(S3, [14, 9, 20, 9, 20, 17, 17, 21, 14, 17]);
  R(16, 11, 2, 7, cape); R(15, 13, 4, 2, cape); D(S1, 14, 9, 20, 9, 15, 10); D(S4, 19, 15, 18, 12);
});
hero('pyro', function () {
  var rb = '#3d3843', hd = '#4d4754';
  P(rb, [9, 8, 14, 8, 16, 14, 17, 22, 6, 22, 7, 14]);
  X(8, 22); X(12, 22); X(15, 22); X(11, 21);
  D('#2a2630', 10, 16, 10, 18,