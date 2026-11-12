/* Planche de controle des sprites + icones de l'application.
   Usage : node tools/sprite-sheet.js
   Ecrit tools/sprites-preview.png (tout), tools/sprites-preview-1..4.png (par groupe),
   icons/icon-192.png et icons/icon-512.png. Aucun paquet npm : encodeur PNG maison (zlib de Node). */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');
var Sprites = require('../js/sprites.js');

/* ---------- encodeur PNG (RGBA 8 bits) ---------- */
var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(buf) { var c = 0xFFFFFFFF; for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  var td = Buffer.concat([Buffer.from(type, 'ascii'), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  var raw = Buffer.alloc((w * 4 + 1) * h);
  for (var y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- image ---------- */
function image(w, h, bg) { var d = new Uint8ClampedArray(w * h * 4); for (var i = 0; i < w * h; i++) { d[i * 4] = bg[0]; d[i * 4 + 1] = bg[1]; d[i * 4 + 2] = bg[2]; d[i * 4 + 3] = 255; } return { w: w, h: h, data: d }; }
function blit(img, id, ox, oy, s) {
  var p = Sprites.pixels(id);
  for (var y = 0; y < p.h; y++) for (var x = 0; x < p.w; x++) {
    var k = (y * p.w + x) * 4, a = p.data[k + 3] / 255; if (!a) continue;
    for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) {
      var X = ox + x * s + i, Y = oy + y * s + j; if (X < 0 || Y < 0 || X >= img.w || Y >= img.h) continue;
      var q = (Y * img.w + X) * 4;
      img.data[q] = p.data[k] * a + img.data[q] * (1 - a); img.data[q + 1] = p.data[k + 1] * a + img.data[q + 1] * (1 - a); img.data[q + 2] = p.data[k + 2] * a + img.data[q + 2] * (1 - a);
    }
  }
}

/* ---------- planches ---------- */
var ROWS = [
  ['chevalier', 'pyro', 'assassin', 'necro', 'berserker', 'pretresse', 'serviteur'],
  ['squelette', 'goule', 'rat', 'spectre', 'loup', 'araignee', 'corbeau', 'pendu'],
  ['sangsue', 'crapaud', 'noye', 'essaim', 'cultiste', 'gargouille', 'flagellant', 'ange'],
  ['diablotin', 'golem', 'cerbere', 'forgeron', 'ombre', 'oeil', 'devoreur', 'chevalier_creux'],
  ['mimique', 'logo', 'tombe', '_inconnu_'],
  ['chevalier_os', 'dryade', 'sorciere', 'inquisiteur', 'bourreau', 'heraut'],
  ['fossoyeur', 'mere_ronces', 'leviathan'],
  ['eveque', 'seigneur_braises', 'roi_creux']
];
var BG = [0x14, 0x10, 0x1a], PAD = 14;
function sheet(rows, S, file) {
  var W = 0, H = PAD, hs = [];
  rows.forEach(function (r) { var w = PAD, h = 0; r.forEach(function (id) { var s = Sprites.size(id); w += s.w * S + PAD; h = Math.max(h, s.h * S); }); W = Math.max(W, w); hs.push(h); H += h + PAD; });
  var img = image(W, H, BG), y = PAD;
  rows.forEach(function (r, ri) { var x = PAD; r.forEach(function (id) { var s = Sprites.size(id); blit(img, id, x, y + hs[ri] - s.h * S, S); x += s.w * S + PAD; }); y += hs[ri] + PAD; });
  fs.writeFileSync(file, png(img.w, img.h, img.data));
  console.log(path.basename(file) + ' ' + W + 'x' + H);
}
var S = +(process.argv[2] || 5), only = process.argv[3];
var here = __dirname;
if (only) { sheet([only.split(',')], S, path.join(here, 'sprites-zoom.png')); }
else {
  sheet(ROWS, 5, path.join(here, 'sprites-preview.png'));
  sheet(ROWS.slice(0, 2), 5, path.join(here, 'sprites-preview-1.png'));
  sheet(ROWS.slice(2, 5), 5, path.join(here, 'sprites-preview-2.png'));
  sheet(ROWS.slice(5, 6), 5, path.join(here, 'sprites-preview-3.png'));
  sheet(ROWS.slice(6, 8), 5, path.join(here, 'sprites-preview-4.png'));

  /* ---------- icones ---------- */
  var iconDir = path.join(here, '..', 'icons');
  if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir);
  [192, 512].forEach(function (n) {
    var s = Sprites.size('logo'), sc = Math.max(1, Math.floor(n * 0.7 / Math.max(s.w, s.h)));
    var img = image(n, n, [0x0d, 0x0b, 0x10]);
    blit(img, 'logo', Math.round((n - s.w * sc) / 2), Math.round((n - s.h * sc) / 2), sc);
    fs.writeFileSync(path.join(iconDir, 'icon-' + n + '.png'), png(n, n, img.data));
    console.log('icon-' + n + '.png (logo x' + sc + ')');
  });

  /* ---------- verifications ---------- */
  var want = [].concat.apply([], ROWS).filter(function (i) { return i.charAt(0) !== '_'; }), bad = [];
  want.forEach(function (id) {
    if (!Sprites.has(id)) { bad.push(id + ' (absent)'); return; }
    var p = Sprites.pixels(id), s = Sprites.size(id), n = 0;
    for (var i = 3; i < p.data.length; i += 4) if (p.data[i]) n++;
    if (p.w !== s.w || p.h !== s.h || p.data.length !== p.w * p.h * 4 || n < 20) bad.push(id + ' (pixels)');
  });
  console.log(Sprites.ids.length + ' ids, ' + (bad.length ? 'PROBLEMES : ' + bad.join(', ') : 'tous OK') + ', url sans DOM -> ' + (typeof Sprites.url('logo')));
}
