/* MORVANE - decors de combat : pixel-art procedural (aucune image), un par zone, 96 x 144, opaque.
   API : Backgrounds.url(zoneId) -> data URL PNG (canvas, mis en cache)
         Backgrounds.pixels(zoneId) -> {w, h, data: Uint8ClampedArray RGBA} (fonctionne sans DOM)
         Backgrounds.W / Backgrounds.H
   Rangees 80 a 143 : sol sombre et peu contraste (les personnages s'y tiennent).
   Tout est deterministe (generateur a graine, jamais Math.random). */
var Backgrounds = (function () {
'use strict';

var W = 96, H = 144, GY = 80;
var buf = null, clipT = 0, clipB = H, seed = 1;

/* ---------- hasard deterministe et bruit ---------- */
function srand(s) { seed = s >>> 0; }
function rnd() {
  seed = (seed + 0x6D2B79F5) >>> 0; var t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rr(a, b) { return a + rnd() * (b - a); }
function ri(a, b) { return Math.floor(rr(a, b + 1)); }
function hash(x, y, s) {
  var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
function sm(t) { return t * t * (3 - 2 * t); }
function vn(x, y, s) {
  var xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
  var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbm(x, y, s) { return vn(x, y, s) * 0.5 + vn(x * 2.1, y * 2.1, s + 7) * 0.3 + vn(x * 4.3, y * 4.3, s + 13) * 0.2; }
function mix(a, b, t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function sc(c, f) { return [c[0] * f, c[1] * f, c[2] * f]; }
function cl(v, a, b) { return v < a ? a : v > b ? b : v; }

/* ---------- primitives ---------- */
function px(x, y, c, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < clipT || y >= clipB) return;
  var i = (y * W + x) * 3;
  if (a === undefined || a >= 1) { buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; }
  else { buf[i] += (c[0] - buf[i]) * a; buf[i + 1] += (c[1] - buf[i + 1]) * a; buf[i + 2] += (c[2] - buf[i + 2]) * a; }
}
function add(x, y, c, a) {
  if (x < 0 || x >= W || y < clipT || y >= clipB) return;
  var i = (y * W + x) * 3; buf[i] += c[0] * a; buf[i + 1] += c[1] * a; buf[i + 2] += c[2] * a;
}
function mul(x, y, f) {
  if (x < 0 || x >= W || y < clipT || y >= clipB) return;
  var i = (y * W + x) * 3; buf[i] *= f; buf[i + 1] *= f; buf[i + 2] *= f;
}
function rect(x, y, w, h, c, a) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) px(x + i, y + j, c, a); }
function line(x0, y0, x1, y1, c, a, w) {
  w = w || 1; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy, o = Math.floor((w - 1) / 2);
  for (;;) {
    if (w === 1) px(x0, y0, c, a); else rect(x0 - o, y0 - o, w, w, c, a);
    if (x0 === x1 && y0 === y1) break;
    var e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; }
  }
}
function inE(x, y, cx, cy, rx, ry) { var a = (x - cx) / (rx + 0.5), b = (y - cy) / (ry + 0.5); return a * a + b * b <= 1; }
function ell(cx, cy, rx, ry, c, a) {
  for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) if (inE(x, y, cx, cy, rx, ry)) px(x, y, c, a);
}
function ring(cx, cy, rx, ry, c, a) {
  for (var y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (var x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++)
      if (inE(x, y, cx, cy, rx, ry) && !(inE(x - 1, y, cx, cy, rx, ry) && inE(x + 1, y, cx, cy, rx, ry) && inE(x, y - 1, cx, cy, rx, ry) && inE(x, y + 1, cx, cy, rx, ry))) px(x, y, c, a);
}
function poly(p, c, a) {
  var n = p.length / 2, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, i, j;
  for (i = 0; i < n; i++) { minx = Math.min(minx, p[i * 2]); maxx = Math.max(maxx, p[i * 2]); miny = Math.min(miny, p[i * 2 + 1]); maxy = Math.max(maxy, p[i * 2 + 1]); }
  for (var y = Math.floor(miny); y <= maxy; y++) for (var x = Math.floor(minx); x <= maxx; x++) {
    var inside = false;
    for (i = 0, j = n - 1; i < n; j = i++) {
      var xi = p[i * 2], yi = p[i * 2 + 1], xj = p[j * 2], yj = p[j * 2 + 1];
      if (((yi > y + 0.01) !== (yj > y + 0.01)) && (x < (xj - xi) * (y + 0.01 - yi) / (yj - yi) + xi + 0.5)) inside = !inside;
    }
    if (inside) px(x, y, c, a);
  }
}
/* tube : ligne brisee d'epaisseur w0 -> w1 */
function tube(pts, w0, w1, c, a) {
  var n = pts.length - 1;
  for (var i = 0; i < n; i++) {
    var w = Math.max(1, Math.round(w0 + (w1 - w0) * (i + 0.5) / n));
    line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, a, w);
  }
}
function bez(x0, y0, cx, cy, x1, y1, c, a, w) {
  var px0 = x0, py0 = y0;
  for (var i = 1; i <= 16; i++) {
    var t = i / 16, u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    line(px0, py0, x, y, c, a, w); px0 = x; py0 = y;
  }
}
/* halo additif */
function glow(cx, cy, rx, ry, c, s) {
  for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    var dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) add(x, y, c, s * (1 - d) * (1 - d));
  }
}
/* eclairage multiplicatif */
function light(cx, cy, rx, ry, g) {
  for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    var dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) mul(x, y, 1 + g * (1 - d) * (1 - d));
  }
}
/* sol en perspective : fn(x, y, u, v, t) -> couleur ; u = x projete, v = 1/distance a l'horizon, t = 0 (loin) .. 1 (pres) */
function ground(hz, fn) {
  for (var y = GY; y < H; y++) { var d = y - hz; for (var x = 0; x < W; x++) px(x, y, fn(x, y, (x - 47.5) / d, 1 / d, (y - GY) / (H - 1 - GY))); }
}
function tile(u, v, S, A, stag) {
  var z = A * v, iz = Math.floor(z), wx = u * S + (stag ? (iz & 1) * 0.5 : 0) + 64, ix = Math.floor(wx);
  return { ix: ix, iz: iz, fx: wx - ix, fz: z - iz, ex: S * v, ez: A * v * v, wx: wx, z: z };
}
/* brume : bande horizontale de bruit */
function mist(yc, half, c, amt, s, sx) {
  for (var y = Math.max(0, yc - half); y < Math.min(H, yc + half); y++) for (var x = 0; x < W; x++) {
    var b = 1 - Math.abs(y - yc) / half, n = fbm(x / (sx || 22) + 3, y / 7, s);
    px(x, y, c, cl(amt * b * (n * 1.7 - 0.35), 0, 0.8));
  }
}
/* arbre mort recursif */
function tree(x, y, a, len, w, dep, c, al) {
  var segs = Math.max(2, Math.round(len / 4)), i;
  for (i = 0; i < segs; i++) {
    var nx = x + Math.cos(a) * len / segs, ny = y + Math.sin(a) * len / segs;
    line(x, y, nx, ny, c, al, Math.max(1, Math.round(w * (1 - 0.45 * i / segs))));
    x = nx; y = ny; a += rr(-0.3, 0.3);
  }
  if (dep > 0) {
    var n = ri(2, 3);
    for (i = 0; i < n; i++) tree(x, y, a + rr(-1.1, 1.1), len * rr(0.5, 0.72), Math.max(1, w * 0.55), dep - 1, c, al);
  }
}

/* ================= 1. CRYPTE DES OUBLIES ================= */
function z1() {
  srand(1101);
  var x, y, k, c, AR = [16, 48, 80], HW = 10, SP = 44;
  function inA(x, y, cx, hw) { var dx = x - cx; if (y >= SP) return Math.abs(dx) <= hw; var dy = y - SP; return dx * dx + dy * dy <= hw * hw + hw; }
  for (y = 0; y < GY; y++) for (x = 0; x < W; x++) {
    var open = -1, trim = false;
    for (k = 0; k < 3; k++) { if (inA(x, y, AR[k], HW)) open = k; else if (inA(x, y, AR[k], HW + 2)) trim = true; }
    if (open >= 0) {
      var dx = x - AR[open], m = ((x - 48 + 201) % 13 + 13) % 13 - 6, t = y / GY;
      var fo = y >= 58 ? Math.abs(m) <= 4 : (m * m + (y - 58) * (y - 58) <= 19);
      if (fo) c = mix([9, 11, 19], [34, 41, 58], Math.pow(t, 4));
      else { c = mix([20, 24, 36], [46, 54, 72], t * t); if ((y % 4) === 1) c = sc(c, 0.93); }
      if (!fo && y >= 55 && y <= 56 && Math.abs(m) >= 4) c = sc(c, 1.12);
      if ((open === 0 && dx < -HW + 3) || (open === 2 && dx > HW - 3)) c = mix([15, 17, 25], [24, 27, 38], t);
      else if (y < SP && dx * dx + (y - SP) * (y - SP) > (HW - 2) * (HW - 2)) c = sc(c, 0.6);
    } else {
      var row = Math.floor(y / 5), off = (row & 1) * 5, bx = Math.floor((x + off) / 10);
      var l = 0.82 + hash(bx, row, 1) * 0.3 + (fbm(x / 5, y / 5, 2) - 0.5) * 0.35;
      if ((y % 5) === 0 || ((x + off) % 10) === 0) l *= 0.7;
      c = [33 * l, 37 * l, 49 * l];
      if (trim) { var j = y < SP ? Math.floor(Math.atan2(y - SP, x - AR[x < 32 ? 0 : x < 64 ? 1 : 2]) * 3.2) : Math.floor(y / 4); c = sc([50, 56, 72], 0.85 + hash(j, x < 32 ? 0 : x < 64 ? 1 : 2, 5) * 0.3); }
      if (y < 30) c = sc(c, 0.42 + 0.58 * y / 30);
    }
    px(x, y, c);
  }
  clipB = GY;
  /* nervures de la voute */
  var rib = [44, 50, 66], PX = [-1, 32, 64, 97];
  for (k = 0; k < 4; k++) {
    bez(PX[k], 34, PX[k], 14, PX[k] + 16, -2, rib, 0.75); bez(PX[k], 34, PX[k], 14, PX[k] - 16, -2, rib, 0.75);
    bez(PX[k] + 1, 34, PX[k] + 1, 14, PX[k] + 17, -2, [16, 18, 26], 0.6);
  }
  /* chapiteaux, bases, niches a cranes */
  for (k = 1; k < 3; k++) {
    var cx = PX[k];
    rect(cx - 6, 43, 13, 1, [58, 65, 84]); rect(cx - 5, 44, 11, 1, [40, 45, 60]); rect(cx - 6, 45, 13, 1, [20, 22, 31]);
    rect(cx - 6, 76, 13, 1, [50, 56, 73]); rect(cx - 7, 77, 15, 3, [38, 43, 57]);
    rect(cx - 3, 50, 7, 10, [10, 11, 17]); rect(cx - 2, 49, 5, 1, [10, 11, 17]); rect(cx - 4, 60, 9, 1, [54, 60, 78]);
    line(cx - 4, 50, cx - 4, 59, [22, 25, 34]);
    var bone = [124, 122, 110], bd = [70, 70, 68];
    rect(cx - 1, 54, 3, 1, bone); rect(cx - 2, 55, 5, 3, bone); px(cx - 1, 56, [12, 12, 18]); px(cx + 1, 56, [12, 12, 18]);
    px(cx - 1, 58, bd); px(cx + 1, 58, bd); px(cx, 58, bone); px(cx - 3, 59, bd); px(cx + 2, 59, bd);
  }
  rect(0, 43, 6, 1, [58, 65, 84]); rect(91, 43, 5, 1, [58, 65, 84]); rect(0, 77, 6, 3, [38, 43, 57]); rect(91, 77, 5, 3, [38, 43, 57]);
  /* petites niches hautes (loculi) */
  for (k = 0; k < 2; k++) { var nx = k ? 62 : 28; rect(nx, 33, 6, 4, [9, 10, 16]); rect(nx + 1, 35, 2, 2, [92, 91, 84]); px(nx + 4, 36, [80, 79, 72]); rect(nx - 1, 37, 8, 1, [50, 56, 72]); }
  /* eclairage de la lanterne */
  light(48, 22, 46, 46, 1.0);
  /* toiles d'araignee */
  var web = [150, 162, 186];
  function cob(ox, s, R) {
    var sp = [[R, 3], [R * 0.85, R * 0.5], [R * 0.5, R * 0.85], [3, R]], i, f;
    for (i = 0; i < 4; i++) line(ox, 0, ox + s * sp[i][0], sp[i][1], web, 0.3);
    for (f = 0.4; f <= 1.01; f += 0.3) for (i = 0; i < 3; i++)
      bez(ox + s * sp[i][0] * f, sp[i][1] * f, ox + s * (sp[i][0] + sp[i + 1][0]) * f * 0.42, (sp[i][1] + sp[i + 1][1]) * f * 0.42, ox + s * sp[i + 1][0] * f, sp[i + 1][1] * f, web, 0.22);
  }
  cob(0, 1, 22); cob(95, -1, 17);
  line(27, 46, 34, 46, web, 0.2); line(26, 49, 30, 46, web, 0.2); line(69, 46, 64, 50, web, 0.2);
  /* lanterne suspendue */
  for (y = 0; y < 16; y++) px(48, y, (y & 1) ? [70, 76, 94] : [26, 28, 38]);
  rect(46, 16, 5, 1, [16, 17, 24]); rect(47, 15, 3, 1, [16, 17, 24]);
  rect(46, 17, 5, 6, [60, 90, 140]); rect(47, 18, 3, 4, [150, 200, 250]); rect(48, 19, 1, 3, [235, 248, 255]);
  line(46, 17, 46, 22, [16, 17, 24]); line(50, 17, 50, 22, [16, 17, 24]); rect(46, 23, 5, 1, [16, 17, 24]); px(48, 24, [16, 17, 24]);
  glow(48, 20, 20, 20, [50, 78, 130], 0.85); glow(48, 20, 7, 7, [90, 130, 190], 0.7);
  clipB = H;
  /* dalles fendues */
  ground(60, function (x, y, u, v, t) {
    var q = tile(u, v, 3.0, 190, true), l = 0.74 + hash(q.ix, q.iz, 9) * 0.4 + (fbm(q.wx * 3, q.z * 3, 11) - 0.5) * 0.4;
    var c = [28 * l, 31 * l, 41 * l];
    if (q.fx < q.ex * 1.05 || q.fz < q.ez * 1.05) c = sc(c, 0.5);
    else if (q.fz > 1 - q.ez * 1.2) c = sc(c, 1.22);
    c = mix(c, [40, 47, 63], 0.5 * Math.pow(1 - t, 3));
    return c;
  });
  clipT = GY;
  /* fissures */
  for (k = 0; k < 7; k++) {
    x = ri(6, 90); y = ri(86, 138); var n = ri(4, 11), dxx = rnd() < 0.5 ? -1 : 1;
    for (var i = 0; i < n; i++) { px(x, y, [8, 9, 13], 0.75); x += rnd() < 0.75 ? dxx : 0; y += rnd() < 0.45 ? 1 : 0; if (rnd() < 0.15) px(x, y - 1, [8, 9, 13], 0.5); }
  }
  /* ossements */
  var b1 = [104, 102, 92], b2 = [66, 66, 62];
  line(20, 121, 25, 119, b1); px(19, 121, b1); px(19, 120, b2); px(26, 119, b1); px(26, 118, b2);
  line(70, 133, 74, 134, b1); px(69, 132, b2); px(75, 135, b2);
  line(54, 96, 57, 96, b2); px(84, 104, b2); px(85, 103, b2); px(86, 104, b2);
  rect(8, 99, 3, 2, b1); px(8, 100, [14, 14, 20]); px(10, 100, [14, 14, 20]); px(9, 101, b2); px(12, 101, b2); px(13, 100, b2);
  line(38, 139, 42, 138, b2); px(60, 116, b2); px(61, 116, b2);
  glow(48, 96, 40, 14, [14, 22, 40], 0.9);
  clipT = 0;
  mist(80, 16, [66, 78, 104], 0.3, 21);
}

/* ================= 2. BOIS DES PENDUS ================= */
function z2() {
  srand(2202);
  var x, y, k, c;
  for (y = 0; y < GY + 4; y++) for (x = 0; x < W; x++) {
    var t = y / GY, n = fbm(x / 26, y / 9, 3);
    c = mix([8, 13, 14], [50, 74, 58], Math.pow(t, 1.35)); c = sc(c, 0.85 + n * 0.3); px(x, y, c);
  }
  /* lune pale derriere le brouillard */
  glow(64, 23, 36, 30, [30, 46, 30], 1.0);
  ell(64, 23, 8, 8, [150, 172, 132]); ell(62, 21, 2, 1.5, [128, 150, 114]); ell(67, 26, 1.5, 1.5, [128, 150, 114]); px(61, 26, [128, 150, 114]); px(66, 19, [132, 154, 118]);
  for (y = 13; y < 34; y++) for (x = 50; x < 80; x++) { var f = fbm(x / 9, y / 2.5, 17); if (f > 0.52) px(x, y, [44, 64, 50], cl((f - 0.52) * 4, 0, 0.75)); }
  /* arbres lointains, puis moyens */
  clipB = GY + 2;
  var far = [36, 54, 44], mid = [22, 33, 28];
  var fx = [12, 24, 37, 49, 58, 71, 83];
  for (k = 0; k < fx.length; k++) tree(fx[k] + ri(-2, 2), 82, -Math.PI / 2 + rr(-0.12, 0.12), rr(26, 40), 2, 2, far, 0.9);
  mist(66, 20, [44, 64, 50], 0.5, 31);
  tree(30, 83, -Math.PI / 2 + 0.06, 40, 3, 3, mid, 1); tree(73, 83, -Math.PI / 2 - 0.1, 34, 3, 3, mid, 1);
  /* pendu lointain */
  tube([[45, 83], [46, 62], [44, 46], [46, 34]], 3, 2, mid); tube([[45, 46], [51, 42], [57, 43]], 2, 1, mid); tube([[46, 36], [41, 28], [38, 27]], 1, 1, mid); tube([[46, 34], [49, 26]], 1, 1, mid);
  line(55, 43, 55, 48, [36, 44, 34]); rect(54, 49, 3, 2, mid); rect(54, 51, 3, 5, [24, 34, 29]); px(54, 56, mid); px(56, 57, mid); px(56, 56, mid);
  mist(74, 14, [52, 76, 58], 0.55, 41);
  clipB = H;
  /* sol : terre, feuilles mortes */
  ground(58, function (x, y, u, v, t) {
    var z = 190 * v, n = fbm(u * 7 + 20, z * 2.2, 5), n2 = fbm(u * 22, z * 7, 6);
    var l = 0.62 + n * 0.55 + (n2 - 0.5) * 0.3, c = [19 * l, 24 * l, 16 * l];
    return mix(c, [48, 70, 55], 0.8 * Math.pow(1 - t, 2.2));
  });
  /* grands arbres proches */
  var nr = [8, 11, 10], hi = [30, 44, 34];
  function big(tr, br, s) {
    var i, j;
    tube(tr, 10, 4, nr);
    for (i = 0; i < tr.length - 1; i++) { line(tr[i][0] + s * 3, tr[i][1], tr[i + 1][0] + s * 3, tr[i + 1][1], hi, 0.8); if (i % 2) line(tr[i][0], tr[i][1] + 2, tr[i + 1][0] + s, tr[i + 1][1] - 2, [16, 22, 18], 0.8); }
    for (i = 0; i < br.length; i++) {
      tube(br[i], 3, 1, nr);
      for (j = 1; j < br[i].length; j++) { var p = br[i][j]; tree(p[0], p[1], -Math.PI / 2 + rr(-0.9, 0.9), rr(4, 8), 1, 1, nr, 1); }
    }
  }
  big([[3, 104], [6, 84], [4, 62], [8, 42], [5, 24], [9, 8], [7, -2]], [[[7, 32], [17, 24], [28, 21], [39, 15]], [[8, 12], [19, 6], [33, 8]], [[6, 54], [14, 49], [19, 51]]], 1);
  big([[93, 106], [90, 84], [93, 64], [88, 44], [91, 26], [87, 10], [89, -2]], [[[89, 36], [79, 30], [68, 31], [59, 37]], [[88, 16], [78, 9], [66, 11]], [[91, 58], [84, 53]]], -1);
  /* noeuds coulants */
  var rope = [78, 72, 50], rd = [50, 46, 32];
  function noose(x, y0, y1) { for (var y = y0; y <= y1; y++) px(x, y, (y & 1) ? rope : rd); px(x, y1 + 1, rope); ring(x, y1 + 4, 1.6, 2.4, rope); }
  noose(28, 22, 36); noose(68, 32, 43); noose(19, 7, 13);
  line(77, 10, 77, 17, rd); px(77, 18, rope); px(76, 19, rd);
  /* racines */
  clipT = GY;
  function root(p) { var q = p.map(function (a) { return [a[0], a[1] - 1]; }); tube(q, 2, 1, [36, 44, 32], 0.7); tube(p, 2, 1, [10, 13, 10]); }
  root([[6, 98], [18, 103], [30, 101], [43, 107]]); root([[3, 112], [15, 119], [27, 129], [34, 131]]); root([[8, 104], [14, 110], [24, 112]]);
  root([[90, 100], [78, 105], [64, 103], [55, 109]]); root([[93, 116], [81, 123], [71, 135]]); root([[88, 106], [80, 113]]);
  ell(4, 106, 8, 5, nr); ell(93, 108, 8, 5, nr);
  var lf = [[58, 48, 24], [42, 50, 26], [60, 40, 22], [34, 40, 24]];
  for (k = 0; k < 90; k++) { x = ri(0, 95); y = GY + 4 + Math.floor(Math.pow(rnd(), 0.7) * 58); c = lf[ri(0, 3)]; px(x, y, c, 0.85); if (rnd() < 0.35) px(x + 1, y, sc(c, 0.7), 0.85); }
  for (k = 0; k < 14; k++) { x = ri(2, 93); y = ri(90, 140); px(x, y, [12, 16, 12]); px(x - 1, y - 1, [12, 16, 12]); px(x + 1, y - 1, [14, 19, 14]); px(x, y - 2, [30, 40, 28], 0.6); }
  clipT = 0;
  mist(84, 10, [50, 72, 56], 0.4, 51);
}

/* ================= 3. MARAIS DE LA PESTE ================= */
function z3() {
  srand(3303);
  var x, y, k, c, WL = 75;
  for (y = 0; y < GY; y++) for (x = 0; x < W; x++) {
    var t = y / WL, n = fbm(x / 30, y / 7, 3);
    c = mix([11, 13, 8], [62, 66, 34], Math.pow(cl(t, 0, 1), 1.7)); c = sc(c, 0.82 + n * 0.36); px(x, y, c);
  }
  clipB = WL + 1;
  /* lisiere lointaine */
  var far = [46, 50, 27];
  for (x = 0; x < W; x++) { var hgt = 4 + fbm(x / 9, 0, 7) * 9 + hash(x, 0, 8) * 2; rect(x, WL - Math.round(hgt), 1, Math.round(hgt) + 1, far, 0.85); }
  var ft = [8, 19, 33, 47, 86];
  for (k = 0; k < ft.length; k++) tree(ft[k], WL - 4, -Math.PI / 2 + rr(-0.2, 0.2), rr(14, 22), 1, 2, far, 0.85);
  /* gibet lointain */
  var gb = [36, 40, 21];
  line(23, 50, 22, WL, gb, 1, 2); line(23, 50, 31, 49, gb); line(24, 54, 27, 50, gb); line(30, 50, 30, 54, [60, 60, 34]); ring(30, 56.5, 1, 1.6, [60, 60, 34]);
  /* hutte a demi engloutie, penchee */
  var hu = [32, 35, 19], hd = [22, 24, 13];
  line(60, 66, 59, WL, hd); line(66, 68, 66, WL, hd); line(73, 70, 74, WL, hd);
  poly([58, 58, 74, 62, 74, 71, 58, 67], hu); poly([55, 58, 65, 49, 78, 62, 76, 63, 57, 59], hd);
  line(65, 49, 78, 62, [50, 54, 28], 0.8); px(62, 58, hd); px(62, 57, hd); px(63, 56, hd);
  rect(67, 64, 2, 2, [176, 170, 76]); px(61, 63, hd); px(61, 64, hd);
  glow(68, 65, 6, 6, [80, 76, 24], 0.8);
  clipB = GY;
  /* eau : reflets */
  for (y = WL + 1; y < GY; y++) for (x = 0; x < W; x++) {
    c = sc([44, 48, 25], 0.75 + hash(x >> 2, y, 12) * 0.3); if (x > 56 && x < 77) c = sc(c, 0.62); if (x > 66 && x < 69) c = mix(c, [120, 114, 50], 0.4); px(x, y, c);
  }
  mist(68, 14, [82, 90, 46], 0.5, 13);
  /* feux follets */
  function wisp(x, y, r) { glow(x, y, r, r, [70, 82, 30], 1.0); glow(x, y, 3, 3, [110, 120, 50], 0.9); px(x, y, [236, 240, 170]); px(x, y - 1, [170, 180, 96]); px(x, y + 1, [150, 160, 80], 0.6); }
  wisp(27, 37, 10); wisp(78, 29, 9); wisp(49, 53, 6);
  clipB = H;
  /* boue et flaques */
  ground(58, function (x, y, u, v, t) {
    var z = 190 * v, n = fbm(u * 3 + 11, z * 1.3, 5), p = fbm(u * 2.6 + 40, z * 0.9, 21), l = 0.7 + n * 0.42 + (hash(x, y, 4) - 0.5) * 0.14;
    var c = [25 * l, 24 * l, 13 * l];
    if (p > 0.6) { c = mix([34, 38, 21], [44, 48, 26], (p - 0.6) * 6); if (p < 0.615) c = [14, 14, 8]; else if (hash(x >> 2, y, 33) > 0.9) c = [58, 62, 34]; }
    else if (p > 0.575) c = sc(c, 0.8);
    return mix(c, [58, 62, 32], 0.7 * Math.pow(1 - t, 2.6));
  });
  /* pieux pourris penches */
  var po = [13, 14, 8], ph = [50, 52, 27];
  function post(x0, y0, x1, y1, w) { line(x0, y0, x1, y1, po, 1, w); line(x0 - (w > 1 ? 1 : 0), y0, x1 - (w > 1 ? 1 : 0), y1, ph, 0.45); px(x0, y0 - 1, po); px(x0 + 1, y0 - 2, po); }
  post(39, 48, 36, 85, 3); post(45, 62, 46, 84, 2); post(85, 42, 80, 89, 3); post(12, 56, 15, 87, 3);
  line(37, 60, 45, 66, [40, 40, 22], 0.8); line(37, 61, 45, 67, po, 0.8); line(81, 60, 76, 63, po); px(75, 64, po);
  /* roseaux */
  function reeds(x0, x1, yb, hmin, hmax, n, c, al) {
    for (var i = 0; i < n; i++) {
      var x = ri(x0, x1), h = ri(hmin, hmax), lean = rr(-0.18, 0.18), yy;
      for (yy = 0; yy < h; yy++) px(x + lean * yy, yb - yy, c, al);
      if (rnd() < 0.5) rect(Math.round(x + lean * h), yb - h - 1, 1, 3, [58, 48, 24], al); else px(x + lean * h + (lean > 0 ? 1 : -1), yb - h + 1, c, al);
    }
  }
  reeds(48, 60, 79, 3, 7, 6, [34, 37, 20], 0.9); reeds(88, 95, 80, 4, 9, 4, [34, 37, 20], 0.9);
  reeds(0, 9, 104, 22, 44, 9, [20, 22, 11], 1); reeds(88, 95, 110, 20, 40, 8, [20, 22, 11], 1);
  reeds(0, 6, 140, 14, 26, 5, [14, 15, 8], 1); reeds(90, 95, 142, 12, 24, 5, [14, 15, 8], 1);
  clipT = GY;
  for (k = 0; k < 26; k++) { x = ri(2, 93); y = ri(88, 141); px(x, y, [13, 13, 7]); px(x + 1, y, [13, 13, 7]); px(x, y - 1, [40, 40, 22], 0.6); }
  glow(27, 100, 14, 5, [20, 24, 8], 0.8); glow(78, 96, 12, 4, [18, 22, 8], 0.8);
  clipT = 0;
  mist(82, 9, [84, 92, 46], 0.4, 23);
}

/* ================= 4. CATHEDRALE PROFANEE ================= */
function z4() {
  srand(4404);
  var x, y, k, c, CX = 48, HWN = 13, SP = 30, SILL = 62;
  function inW(x, y, hw, sill) {
    var dx = x - CX; if (Math.abs(dx) > hw) return false; if (y >= SP) return y <= sill;
    var dy = y - SP, a = dx + hw, b = dx - hw; return a * a + dy * dy <= 4 * hw * hw && b * b + dy * dy <= 4 * hw * hw;
  }
  var cols = [[132, 44, 38], [44, 72, 128], [156, 122, 50], [48, 104, 66], [112, 50, 110]];
  for (y = 0; y < GY; y++) for (x = 0; x < W; x++) {
    if (inW(x, y, HWN, SILL)) {
      var dx = x - CX, col = Math.floor((dx + 13) / 4.5), row = Math.floor(y / 6), h = hash(col, row, 41);
      var lead = (y % 6) === 0 || dx === -9 || dx === 0 || dx === 9;
      var dr = Math.sqrt(dx * dx + (y - 20) * (y - 20));
      if (dx === -5 || dx === 5 || (dr > 5.2 && dr < 6.6) || (y === SILL)) c = [50, 43, 38];
      else if (dr <= 5.2) c = (Math.abs(dx) === Math.abs(y - 20) || dx === 0 || y === 20) ? [12, 10, 12] : sc(cols[2], 0.75 + hash(x >> 1, y >> 1, 3) * 0.3);
      else if (lead) c = [12, 10, 12];
      else if (h < 0.5) { c = sc([50, 56, 74], 0.8 + fbm(x / 6, y / 6, 9) * 0.5); var sh = hash(col, row, 78); if ((sh < 0.5 && (x + y * 2 + col) % 7 < 2) || hash(x, y, 77) < 0.07) c = [26, 23, 30]; }
      else if (h < 0.76) c = sc([25, 23, 30], 0.85 + hash(x, y, 5) * 0.3);
      else c = sc(cols[Math.floor(hash(col, row, 43) * 5)], 0.5 + hash(col, row, 44) * 0.25 + hash(x, y, 6) * 0.1);
    } else {
      var r2 = Math.floor(y / 6), off = (r2 & 1) * 6, bx = Math.floor((x + off) / 12);
      var l = 0.8 + hash(bx, r2, 1) * 0.3 + (fbm(x / 5, y / 5, 2) - 0.5) * 0.35;
      if ((y % 6) === 0 || ((x + off) % 12) === 0) l *= 0.72;
      c = [36 * l, 31 * l, 29 * l];
      if (inW(x, y, HWN + 2, SILL + 2)) c = sc([58, 50, 43], 0.85 + hash(Math.floor(y / 4), x < CX ? 0 : 1, 5) * 0.3);
      c = sc(c, 0.5 + 0.5 * Math.pow(y / GY, 0.8));
    }
    px(x, y, c);
  }
  clipB = GY;
  rect(CX - 16, SILL + 3, 33, 1, [20, 17, 17]);
  light(CX, 36, 44, 52, 0.55);
  /* colonnes lointaines et nervures */
  function column(x0, w, capY, base, cc, dir, hazeTop) {
    for (var y = 0; y < base; y++) for (var i = 0; i < w; i++) {
      var s = i / (w - 1), l = 0.62 + 0.45 * Math.sin(s * Math.PI) + (dir > 0 ? s : 1 - s) * 0.4;
      if (w > 6 && (i % 3) === 1) l *= 0.86;
      l *= 0.55 + 0.45 * y / base; if ((y % 9) === 8) l *= 0.8;
      px(x0 + i, y, sc(cc, l));
    }
    var cw = w > 6 ? 2 : 1;
    rect(x0 - cw, capY, w + cw * 2, 2, sc(cc, 1.25)); rect(x0 - cw + 1, capY + 2, w + cw * 2 - 2, 2, sc(cc, 0.95)); rect(x0 - cw, capY + 4, w + cw * 2, 1, sc(cc, 0.5));
    rect(x0 - cw + 1, base - 5, w + cw * 2 - 2, 2, sc(cc, 1.1)); rect(x0 - cw, base - 3, w + cw * 2, 3, sc(cc, 0.85)); rect(x0 - cw, base - 3, w + cw * 2, 1, sc(cc, 1.3));
  }
  var rib = [50, 43, 38];
  bez(26, 26, 28, 8, 48, 0, rib, 0.7); bez(70, 26, 68, 8, 48, 0, rib, 0.7); bez(26, 26, 22, 10, 10, 2, rib, 0.6); bez(70, 26, 74, 10, 86, 2, rib, 0.6);
  column(24, 5, 26, GY, [52, 46, 46], 1); column(67, 5, 26, GY, [52, 46, 46], -1);
  clipB = H;
  /* damier use */
  ground(60, function (x, y, u, v, t) {
    var q = tile(u, v, 3.4, 200, false), odd = (q.ix + q.iz) & 1, n = fbm(q.wx * 4, q.z * 4, 11);
    var l = (odd ? 1.0 : 0.6) * (0.78 + n * 0.4 + hash(q.ix, q.iz, 9) * 0.14), c = [33 * l, 28 * l, 26 * l];
    if (q.fx < q.ex || q.fz < q.ez) c = sc(c, 0.62);
    if (n > 0.66 && odd) c = sc(c, 0.7);
    return mix(c, [46, 40, 36], 0.4 * Math.pow(1 - t, 3));
  });
  /* rai de lumiere */
  for (y = 14; y < 134; y++) for (x = 0; x < W; x++) {
    var sx = x + (y - 36) * 0.5, e = Math.min(sx - 35, 61 - sx);
    if (e <= 0) continue;
    var I = cl(e / 5, 0, 1) * (0.5 + vn(sx / 2.2, 0, 61) * 0.7) * cl(1.05 - (y - 20) / 125, 0, 1) * (y < 34 ? (y - 14) / 20 : 1);
    add(x, y, [70, 55, 26], I * (y >= GY ? 0.4 : 0.62));
  }
  glow(22, 104, 22, 9, [38, 30, 12], 0.9);
  /* colonnes proches */
  column(5, 12, 18, 87, [44, 38, 36], 1); column(79, 12, 18, 87, [44, 38, 36], -1);
  bez(11, 18, 12, 6, 24, -2, [36, 31, 29], 1, 2); bez(85, 18, 84, 6, 72, -2, [36, 31, 29], 1, 2);
  /* candelabre renverse et cierges */
  var gd = [112, 88, 44], gk = [60, 46, 24];
  line(40, 87, 55, 84, gk); line(40, 86, 55, 83, gd); ell(39, 86, 1, 2.5, gd); px(39, 86, gk);
  line(55, 81, 55, 86, gd); line(56, 80, 58, 80, gd); line(56, 86, 58, 87, gd); px(47, 85, [150, 120, 60]);
  var wax = [150, 142, 114];
  function candle(x, y, h) { rect(x, y - h + 1, 1, h, wax); px(x, y - h, [255, 226, 140]); px(x, y - h - 1, [240, 150, 60], 0.8); glow(x, y - h, 8, 8, [84, 56, 18], 0.9); }
  line(59, 88, 61, 88, wax, 0.8); line(60, 80, 62, 79, wax, 0.8);
  candle(63, 85, 3); candle(36, 90, 2); candle(66, 91, 4);
  px(44, 92, [84, 78, 62]); px(70, 86, [84, 78, 62]); px(30, 96, [60, 54, 46]); px(52, 100, [60, 54, 46]);
  mist(76, 12, [70, 60, 44], 0.22, 71);
}

/* ================= 5. FORGES INFERNALES ================= */
function z5() {
  srand(5505);
  var x, y, k, c;
  for (y = 0; y < GY; y++) for (x = 0; x < W; x++) {
    var t = y / GY, n = fbm(x / 14, y / 10, 3), row = Math.floor(y / 8), off = (row & 1) * 8, l = 0.85 + hash(Math.floor((x + off) / 16), row, 2) * 0.25;
    c = mix([22, 13, 13], [50, 23, 15], Math.pow(t, 1.5)); c = sc(c, (0.75 + n * 0.5) * l);
    if ((y % 8) === 0 || ((x + off) % 16) === 0) c = sc(c, 0.74);
    px(x, y, c);
  }
  clipB = GY;
  /* fourneau lointain */
  var fu = [30, 16, 14], fd = [20, 11, 11];
  poly([27, 79, 33, 38, 63, 38, 69, 79], fu); rect(40, 0, 16, 38, fd);
  for (y = 4; y < 38; y += 9) { rect(39, y, 18, 2, [36, 20, 16]); px(41, y, [70, 34, 22]); px(47, y, [70, 34, 22]); px(54, y, [70, 34, 22]); }
  rect(31, 38, 34, 2, [44, 24, 18]); rect(32, 40, 32, 1, fd);
  for (y = 42; y < 79; y++) { px(33 - Math.round((y - 38) * 0.146) + 1, y, [40, 22, 17]); }
  var FX = 48, FS = 57, FB = 68, FH = 7;
  for (y = 46; y <= FB; y++) for (x = FX - FH - 2; x <= FX + FH + 2; x++) {
    var dx = x - FX, dy = y - FS, inn = y >= FS ? Math.abs(dx) <= FH : dx * dx + dy * dy <= FH * FH + FH;
    var out = y >= FS ? Math.abs(dx) <= FH + 2 : dx * dx + dy * dy <= (FH + 2) * (FH + 2) + FH;
    if (inn) {
      var hot = cl(1 - Math.sqrt(dx * dx * 0.9 + (y - FB) * (y - FB) * 0.6) / 11, 0, 1);
      c = mix([150, 44, 14], [250, 190, 84], hot); c = sc(c, 0.8 + hash(x, y, 9) * 0.25);
      if (Math.abs(dx) === 2 || Math.abs(dx) === 6) c = [26, 12, 10]; if (y === 61) c = sc(c, 0.3);
      px(x, y, c);
    } else if (out) px(x, y, [52, 26, 18]);
  }
  glow(48, 60, 34, 30, [120, 38, 8], 0.75);
  /* chaines lointaines */
  function chain(x, y0, y1, s, c, hi) {
    var y = y0, f = 0;
    while (y < y1) {
      if (f) { rect(x - (s > 1 ? 1 : 0), y - 1, s > 1 ? 2 : 1, s * 2 + 3, c); px(x - (s > 1 ? 1 : 0), y, hi); }
      else { var cy = y + s + 0.5; ring(x, cy, s, s + 1.5, c); if (s > 1) ring(x, cy, s - 0.6, s + 0.9, c); px(x - s, cy, hi); px(x - s, cy - 1, hi); px(x - s + 1, cy - s, hi); }
      y += f ? s * 2 : s * 2 + 2; f = 1 - f;
    }
    return y;
  }
  chain(25, -2, 30, 1, [50, 28, 22], [76, 40, 28]); chain(72, -2, 46, 1, [50, 28, 22], [76, 40, 28]); chain(64, -2, 20, 1, [42, 24, 20], [64, 34, 24]);
  rect(71, 46, 3, 4, [50, 28, 22]); px(71, 50, [50, 28, 22]); px(72, 51, [50, 28, 22]); px(73, 50, [50, 28, 22]);
  /* canal de lave */
  for (x = 0; x < W; x++) {
    var lv = fbm(x / 5, 0, 31), hotx = cl(1 - Math.abs(x - 48) / 60, 0.25, 1);
    px(x, 73, [22, 11, 10]);
    px(x, 74, mix([100, 30, 11], [176, 76, 24], lv * hotx * 1.4)); px(x, 75, mix([130, 42, 13], [204, 108, 34], lv * hotx * 1.3)); px(x, 76, mix([90, 26, 10], [150, 54, 18], lv));
    if (hash(x >> 1, 3, 32) > 0.72) { px(x, 74, [40, 16, 11]); if (hash(x, 4, 32) > 0.5) px(x, 75, [58, 22, 12]); }
    rect(x, 77, 1, 3, sc([20, 11, 10], 0.8 + hash(x >> 2, 9, 5) * 0.4));
  }
  line(48, 68, 48, 74, [226, 130, 44]); line(47, 69, 47, 74, [170, 62, 18]); line(49, 69, 49, 74, [170, 62, 18]);
  glow(48, 75, 60, 9, [86, 26, 6], 0.7);
  /* enclumes en silhouette */
  function anvil(ox, oy, s, c, hi) {
    poly([ox, oy + 2 * s, ox + 4 * s, oy, ox + 16 * s, oy, ox + 16 * s, oy + 3 * s, ox + 12 * s, oy + 4 * s, ox + 11 * s, oy + 8 * s, ox + 14 * s, oy + 10 * s, ox + 14 * s, oy + 13 * s, ox + 3 * s, oy + 13 * s, ox + 3 * s, oy + 10 * s, ox + 6 * s, oy + 8 * s, ox + 6 * s, oy + 4 * s], c);
    line(ox + 4 * s, oy, ox + 16 * s, oy, hi); line(ox + 16 * s, oy, ox + 16 * s, oy + 3 * s, hi, 0.7);
  }
  anvil(13, 64, 1, [11, 8, 9], [96, 44, 22]); rect(13, 77, 16, 3, [11, 8, 9]);
  anvil(73, 70, 0.6, [15, 9, 10], [80, 36, 18]);
  line(31, 79, 35, 66, [11, 8, 9]); rect(33, 64, 5, 3, [11, 8, 9]); px(33, 64, [80, 36, 18]);
  /* poutre et piliers */
  rect(0, 0, W, 5, [12, 8, 9]); rect(0, 5, W, 1, [34, 18, 14]); for (x = 3; x < W; x += 8) px(x, 2, [44, 24, 18]);
  clipB = H;
  /* grille de fer */
  ground(58, function (x, y, u, v, t) {
    var q = tile(u, v, 5.2, 330, false), n = fbm(q.wx * 2.5, q.z * 2.5, 11), l = 0.72 + n * 0.45 + hash(q.ix, q.iz, 9) * 0.16;
    var c = [24 * l, 19 * l, 19 * l];
    var gx = q.fx < Math.max(q.ex * 1.0, 0.12), gz = q.fz < Math.max(q.ez * 1.0, 0.12);
    if (gx || gz) {
      var e = Math.pow(fbm(x / 13 + 5, y / 9, 17), 3) * 3.2 + Math.pow(1 - t, 3) * 0.3;
      c = mix([8, 5, 6], [140, 50, 15], cl(e - 0.08, 0, 0.5));
    } else if (q.fx > 0.88 || q.fz > 1 - q.ez * 1.2) c = sc(c, 1.3);
    else if (hash(x, y, 14) > 0.93) c = sc(c, 1.25);
    return mix(c, [62, 24, 13], 0.6 * Math.pow(1 - t, 3));
  });
  /* grosses chaines proches */
  var cn = [15, 11, 12], ch = [84, 40, 22];
  var e1 = chain(10, -3, 40, 3, cn, ch); rect(9, e1 - 1, 3, 5, cn); ring(10, e1 + 7, 3.4, 3.4, cn); ring(10, e1 + 7, 2.6, 2.6, cn); rect(12, e1 + 3, 3, 3, [40, 19, 14]);
  var e2 = chain(86, -1, 26, 3, cn, ch); rect(85, e2 - 1, 3, 3, cn); poly([82, e2 + 2, 91, e2 + 2, 89, e2 + 9, 84, e2 + 9], cn); line(82, e2 + 2, 84, e2 + 9, ch, 0.7);
  /* etincelles */
  var spk = [[38, 34], [57, 28], [44, 22], [61, 44], [33, 47], [52, 12], [22, 40], [70, 34]];
  for (k = 0; k < spk.length; k++) px(spk[k][0], spk[k][1], k % 3 ? [226, 110, 40] : [255, 200, 110], 0.85);
  mist(72, 14, [70, 26, 12], 0.3, 81);
  for (y = 6; y < 40; y++) for (x = 0; x < W; x++) { var sm2 = fbm(x / 12, y / 6, 91); if (sm2 > 0.55) px(x, y, [10, 7, 8], cl((sm2 - 0.55) * 2.2, 0, 0.5)); }
}

/* ================= 6. TRONE DU ROI CREUX ================= */
function z6() {
  srand(6606);
  var x, y, k, c, SX = 48, SY = 26;
  for (y = 0; y < GY; y++) for (x = 0; x < W; x++) {
    var t = y / GY, n = fbm(x / 20 + y / 40, y / 12, 3);
    c = mix([9, 5, 18], [50, 27, 92], Math.pow(t, 1.7)); c = sc(c, 0.7 + n * 0.6);
    var neb = fbm(x / 16 - y / 30, y / 9, 19); if (neb > 0.55) c = mix(c, [40, 20, 70], (neb - 0.55) * 0.9);
    px(x, y, c);
  }
  clipB = GY;
  /* soleil noir fendu */
  glow(SX, SY, 38, 34, [44, 22, 100], 0.9);
  for (y = SY - 16; y <= SY + 16; y++) for (x = SX - 16; x <= SX + 16; x++) {
    var dx = x - SX, dy = y - SY, d = Math.sqrt(dx * dx + dy * dy), an = Math.atan2(dy, dx), fl = vn(an * 2.2 + 9, 0, 71);
    if (d <= 10.3) px(x, y, [4, 2, 9]);
    else if (d <= 11.5) px(x, y, mix([110, 74, 210], [196, 164, 255], fl));
    else if (d <= 12.6 + fl * 3.4) px(x, y, [104, 66, 200], cl(0.75 - (d - 11.5) * 0.2, 0.1, 1));
  }
  var crk = [176, 140, 255], crd = [96, 60, 190];
  function crack(x, y, a, n, dim) { for (var i = 0; i < n; i++) { px(x, y, i > n * 0.6 || dim ? crd : crk, i > n * 0.8 ? 0.6 : 1); a += rr(-0.6, 0.6); x += Math.cos(a) * 1.2; y += Math.sin(a) * 1.2; } }
  crack(SX - 1, SY + 1, -2.2, 13); crack(SX - 1, SY + 1, 0.5, 15); crack(SX - 1, SY + 1, 2.1, 9, true); crack(SX + 2, SY - 2, -0.7, 8, true); crack(SX - 4, SY - 3, 3.3, 7, true);
  px(SX - 1, SY + 1, [236, 220, 255]);
  var sh = [[31, 17], [66, 19], [62, 40], [35, 38], [70, 9], [27, 30]];
  for (k = 0; k < sh.length; k++) { px(sh[k][0], sh[k][1], [10, 6, 20]); px(sh[k][0] + 1, sh[k][1], [10, 6, 20]); px(sh[k][0], sh[k][1] - 1, [86, 56, 170]); }
  /* colonnes brisees, flottantes */
  function col6(x0, w, segs, cc, dir, rim) {
    for (var s = 0; s < segs.length; s++) {
      var g = segs[s], i, y;
      for (i = 0; i < w; i++) {
        var ya = g[0] + (g[3] & 1 ? Math.round(hash(i >> 1, s, x0) * 3 + (g[4] || 0) * i) : 0), yb = g[1] - (g[3] & 2 ? Math.round(hash(i >> 1, s + 9, x0) * 3 + (g[4] || 0) * (w - i)) : 0);
        for (y = ya; y < yb; y++) {
          var f = i / (w - 1), l = 0.6 + 0.5 * Math.sin(f * Math.PI); if (w > 6 && (i % 3) === 1) l *= 0.8; if ((y % 11) === 10) l *= 0.75;
          c = sc(cc, l); if ((dir > 0 && i === w - 1) || (dir < 0 && i === 0)) c = rim; else if ((dir > 0 && i === w - 2) || (dir < 0 && i === 1)) c = mix(c, rim, 0.35);
          px(x0 + g[2] + i, y, c);
        }
        if (g[3] & 1) px(x0 + g[2] + i, ya, mix(cc, rim, 0.6));
      }
      if (g[5]) { rect(x0 + g[2] - 2, g[0], w + 4, 2, sc(cc, 1.25)); rect(x0 + g[2] - 1, g[0] + 2, w + 2, 2, cc); rect(x0 + g[2] - 2, g[0] + 4, w + 4, 1, sc(cc, 0.5)); }
      if (g[6]) { rect(x0 + g[2] - 1, g[1] - 4, w + 2, 1, sc(cc, 1.3)); rect(x0 + g[2] - 2, g[1] - 3, w + 4, 3, cc); }
    }
  }
  var fc = [50, 36, 86], frim = [96, 70, 168];
  col6(26, 6, [[58, 80, 0, 1, 0.5, 0, 1], [38, 53, 1, 3, 0.3]], fc, 1, frim);
  col6(64, 6, [[50, 80, 0, 1, 0, 0, 1], [28, 44, -1, 3, 0.3]], fc, -1, frim);
  /* estrade */
  rect(22, 74, 52, 2, [36, 26, 64]); rect(22, 76, 52, 4, [20, 15, 36]); rect(28, 70, 40, 1, [40, 29, 72]); rect(28, 71, 40, 3, [23, 17, 42]);
  rect(22, 74, 52, 1, [44, 32, 80]);
  clipB = H;
  /* pierre noire polie, reflets */
  ground(58, function (x, y, u, v, t) {
    var q = tile(u, v, 2.4, 150, false), n = fbm(q.wx * 2, q.z * 2, 11), l = 0.7 + n * 0.5 + hash(q.ix, q.iz, 9) * 0.2;
    var c = [21 * l, 16 * l, 36 * l];
    if (q.fx < q.ex || q.fz < q.ez) c = sc(c, 0.55); else if (q.fx < q.ex * 2 || q.fz > 1 - q.ez) c = sc(c, 1.3);
    var w = 9 + t * 16, r = cl(1 - Math.abs(x - 48 + (hash(0, y, 5) - 0.5) * 3) / w, 0, 1) * Math.pow(1 - t, 1.3) * (0.6 + hash(1, y, 6) * 0.6);
    c[0] += 30 * r; c[1] += 16 * r; c[2] += 66 * r;
    return mix(c, [44, 26, 80], 0.5 * Math.pow(1 - t, 3));
  });
  rect(0, GY, W, 1, [50, 36, 96]);
  /* colonnes proches */
  var nc = [27, 20, 46], nrim = [100, 72, 180];
  clipT = 0;
  col6(4, 11, [[52, 88, 0, 1, 0.3, 0, 1], [28, 47, 2, 3, 0.2]], nc, 1, nrim);
  col6(81, 11, [[62, 88, 0, 1, 0, 0, 1], [34, 56, -2, 3, 0.2]], nc, -1, nrim);
  /* debris flottants */
  var db = [[19, 47, 2], [22, 26, 1], [76, 57, 2], [74, 32, 1], [20, 54, 1], [60, 48, 1], [36, 58, 1], [78, 50, 1]];
  for (k = 0; k < db.length; k++) { rect(db[k][0], db[k][1], db[k][2], db[k][2], nc); px(db[k][0] + (db[k][0] < 48 ? db[k][2] - 1 : 0), db[k][1], nrim, 0.8); }
  /* reflets des colonnes proches */
  clipT = GY + 8;
  for (y = 89; y < 122; y++) { var a = 0.5 * (1 - (y - 89) / 33); for (x = 3; x < 16; x++) px(x + Math.round((hash(2, y, 7) - 0.5) * 2), y, [6, 4, 12], a); for (x = 80; x < 93; x++) px(x + Math.round((hash(3, y, 7) - 0.5) * 2), y, [6, 4, 12], a); }
  clipT = 0; clipB = GY;
  /* linteaux brises et bannieres en lambeaux */
  poly([13, 7, 40, 4, 41, 8, 14, 12], nc); line(13, 7, 40, 4, nrim, 0.6); px(41, 6, nc); px(42, 7, nc);
  poly([58, 9, 86, 13, 85, 18, 58, 14], nc); line(58, 14, 85, 18, nrim, 0.35); px(57, 11, nc);
  function banner(x0, y0, w, h, slope, sd) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var end = h - 3 - hash(i >> 1, sd, 5) * 9 - slope * i; if (j > end) continue;
      if (fbm(i / 2.5, j / 3.5, sd) > 0.74 && j > 5) continue;
      var l = 0.75 + 0.3 * Math.sin(i * 1.5 + j * 0.12), c = [48 * l, 17 * l, 50 * l];
      if (i === 0 || i === w - 1) c = [70, 48, 112]; if (j < 2) c = [30, 20, 48];
      px(x0 + i + Math.round(Math.sin(j / 6 + sd) * 0.8), y0 + j + Math.round(i * (sd === 3 ? -0.11 : 0.14)), c);
    }
  }
  banner(20, 9, 10, 36, 0, 3); ring(25, 22, 2.5, 2.5, [116, 84, 190]); px(25, 22, [116, 84, 190]); line(25, 27, 25, 31, [90, 62, 150]);
  banner(66, 12, 9, 30, 1.6, 4); ring(70, 23, 2, 2, [104, 76, 172]);
  clipB = H;
  glow(SX, 84, 30, 10, [22, 12, 50], 0.8);
  mist(78, 10, [40, 24, 76], 0.3, 61);
}

/* ---------- finition : vignette, plafond de luminosite du sol, tramage ---------- */
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
var ZONES = [null,
  { fn: z1, gain: 1, cap: 60 }, { fn: z2, gain: 1, cap: 58 }, { fn: z3, gain: 1, cap: 60 },
  { fn: z4, gain: 1, cap: 64 }, { fn: z5, gain: 1.22, cap: 60 }, { fn: z6, gain: 1.18, cap: 62 }];
function render(id) {
  var z = ZONES[id], x, y, i, k;
  buf = new Float32Array(W * H * 3); clipT = 0; clipB = H;
  z.fn();
  clipT = 0; clipB = H;
  var data = new Uint8ClampedArray(W * H * 4), Q = 5;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
    i = (y * W + x) * 3;
    var ex = (x - 47.5) / 48, vg = 1 - 0.3 * ex * ex * ex * ex - 0.12 * ex * ex;
    if (y < 14) vg *= 0.78 + 0.22 * y / 14;
    if (y > 112) vg *= 1 - 0.3 * (y - 112) / 31;
    var r = buf[i] * vg * z.gain, g = buf[i + 1] * vg * z.gain, b = buf[i + 2] * vg * z.gain;
    if (y >= GY) {
      var L = 0.2126 * r + 0.7152 * g + 0.0722 * b, cap = z.cap * (y < GY + 6 ? 1.5 - 0.5 * (y - GY) / 6 : 1);
      if (L > cap) { var f = (cap + (L - cap) * 0.3) / L; r *= f; g *= f; b *= f; }
    }
    var th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; k = (y * W + x) * 4;
    data[k] = Math.floor(r / Q + th) * Q; data[k + 1] = Math.floor(g / Q + th) * Q; data[k + 2] = Math.floor(b / Q + th) * Q; data[k + 3] = 255;
  }
  buf = null;
  return { w: W, h: H, data: data };
}

/* ---------- API ---------- */
var pxCache = {}, urlCache = {};
var EMPTY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
function norm(id) { id = +id; return (id >= 1 && id <= 6 && Math.floor(id) === id) ? id : 1; }
function pixels(id) { id = norm(id); if (!pxCache[id]) pxCache[id] = render(id); return pxCache[id]; }
function url(id) {
  id = norm(id);
  if (urlCache[id]) return urlCache[id];
  try {
    if (typeof document === 'undefined' || !document.createElement) return EMPTY;
    var p = pixels(id), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'), im = ctx.createImageData(W, H); im.data.set(p.data); ctx.putImageData(im, 0, 0);
    urlCache[id] = cv.toDataURL('image/png');
    return urlCache[id];
  } catch (e) { return EMPTY; }
}
return { W: W, H: H, url: url, pixels: pixels };
})();
if (typeof module !== 'undefined') module.exports = Backgrounds;
