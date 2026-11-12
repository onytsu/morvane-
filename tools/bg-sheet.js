/* Planche de controle des decors de combat.
   Usage : node tools/bg-sheet.js
   Ecrit tools/bg-preview.png (6 decors a 4x, sprites de test a 5x par-dessus),
   tools/bg-zone-1..6.png (un par zone) et tools/bg-raw.png (decors seuls, sans sprites).
   Affiche la luminance moyenne de chaque decor. Aucun paquet npm. */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');
var Backgrounds = require('../js/backgrounds.js');
var Sprites = require('../js/sprites.js');

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
function image(w, h) { var d = new Uint8ClampedArray(w * h * 4); for (var i = 3; i < d.length; i += 4) d[i] = 255; return { w: w, h: h, data: d }; }
function blitBg(img, p, ox, oy, s) {
  for (var y = 0; y < p.h * s; y++) for (var x = 0; x < p.w * s; x++) {
    var k = ((y / s | 0) * p.w + (x / s | 0)) * 4, q = ((oy + y) * img.w + ox + x) * 4;
    img.data[q] = p.data[k]; img.data[q + 1] = p.data[k + 1]; img.data[q + 2] = p.data[k + 2]; img.data[q + 3] = 255;
  }
}
function blitSprite(img, id, ox, oy, s) {
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
function copy(dst, src, ox, oy) { for (var y = 0; y < src.h; y++) dst.data.set(src.data.subarray(y * src.w * 4, (y + 1) * src.w * 4), ((oy + y) * dst.w + ox) * 4); }

var MON = [null, ['squelette', 'goule'], ['loup', 'pendu'], ['crapaud', 'noye'], ['cultiste', 'gargouille'], ['diablotin', 'golem'], ['ombre', 'chevalier_creux']];
var NAMES = [null, 'Crypte des Oublies', 'Bois des Pendus', 'Marais de la Peste', 'Cathedrale Profanee', 'Forges Infernales', 'Trone du Roi Creux'];
var S = 4, SW = Backgrounds.W * S, SH = Backgrounds.H * S, PAD = 8, here = __dirname;

function scene(z, withSprites) {
  var img = image(SW, SH), p = Backgrounds.pixels(z);
  blitBg(img, p, 0, 0, S);
  if (withSprites) {
    var f1 = Math.round(SH * 0.75), f2 = Math.round(SH * 0.67);   /* pieds a 25 % et 33 % du bas */
    function put(id, x, feet) { var s = Sprites.size(id); blitSprite(img, id, x, feet - s.h * 5, 5); }
    put(MON[z][0], 160, f2); put('chevalier', 18, f1); put(MON[z][1], 252, f1);
  }
  return img;
}
function lum(p, y0, y1) {
  var s = 0, n = 0, mx = 0;
  for (var y = y0; y < y1; y++) for (var x = 0; x < p.w; x++) { var k = (y * p.w + x) * 4, L = 0.2126 * p.data[k] + 0.7152 * p.data[k + 1] + 0.0722 * p.data[k + 2]; s += L; n++; if (L > mx) mx = L; }
  return { avg: s / n / 255 * 100, max: mx / 255 * 100 };
}

var sheet = image(PAD + 3 * (SW + PAD), PAD + 2 * (SH + PAD)), raw = image(PAD + 6 * (SW / 2 + PAD), PAD * 2 + SH / 2), bad = [];
for (var z = 1; z <= 6; z++) {
  var p = Backgrounds.pixels(z), ok = p.w === 96 && p.h === 144 && p.data.length === 96 * 144 * 4;
  for (var i = 3; i < p.data.length; i += 4) if (p.data[i] !== 255) ok = false;
  if (!ok) bad.push(z);
  var sc = scene(z, true);
  fs.writeFileSync(path.join(here, 'bg-zone-' + z + '.png'), png(sc.w, sc.h, sc.data));
  copy(sheet, sc, PAD + ((z - 1) % 3) * (SW + PAD), PAD + Math.floor((z - 1) / 3) * (SH + PAD));
  var half = image(SW / 2, SH / 2); blitBg(half, p, 0, 0, 2); copy(raw, half, PAD + (z - 1) * (SW / 2 + PAD), PAD);
  var a = lum(p, 0, 144), g = lum(p, 80, 144), b = lum(p, 0, 80), m = lum(p, 60, 100);
  console.log('zone ' + z + ' ' + (NAMES[z] + '                    ').slice(0, 20) + ' moyenne ' + a.avg.toFixed(1) + ' %   sol ' + g.avg.toFixed(1) + ' % (max ' + g.max.toFixed(0) + ' %)   fond ' + b.avg.toFixed(1) + ' %   bande 60-100 ' + m.avg.toFixed(1) + ' %');
}
fs.writeFileSync(path.join(here, 'bg-preview.png'), png(sheet.w, sheet.h, sheet.data));
fs.writeFileSync(path.join(here, 'bg-raw.png'), png(raw.w, raw.h, raw.data));
console.log('bg-preview.png ' + sheet.w + 'x' + sheet.h + ', bg-raw.png, bg-zone-1..6.png');
console.log(bad.length ? 'PROBLEME zones ' + bad.join(',') : 'pixels(1..6) : 96x144 opaques OK' + ', url sans DOM -> ' + Backgrounds.url(3).slice(0, 22) + ', zone inconnue -> ' + (Backgrounds.pixels(99) === Backgrounds.pixels(1)));
