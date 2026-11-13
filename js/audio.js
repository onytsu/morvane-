/* MORVANE — sons et musique (fichiers mp3 du dossier audio/, ou intégrés dans window.AUDIO_EMBED) */
var SND = (function () {
  'use strict';
  var ctx = null, sfxGain = null, musGain = null, buffers = {}, loading = {}, last = {}, cur = null, curName = null, wanted = null;
  var on = { sfx: true, music: true }, unlocked = false;
  var VOL = { hit: 0.35, hurt: 0.45, crit: 0.8, click: 0.9, loot: 0.9, die: 0.5, gold: 0.5, block: 0.6 };
  var SFX = ['hit', 'crit', 'hurt', 'block', 'skill_fire', 'skill_holy', 'skill_dark', 'skill_blade', 'skill_war', 'heal', 'potion', 'die', 'boss_intro', 'boss_die', 'loot', 'loot_rare', 'loot_epic', 'loot_legend', 'loot_unique', 'levelup', 'door', 'click', 'gold', 'upgrade', 'salvage', 'equip', 'buy', 'error', 'death', 'victory'];

  function init() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try {
      ctx = new AC(); sfxGain = ctx.createGain(); musGain = ctx.createGain();
      sfxGain.gain.value = 0.9; musGain.gain.value = 0.5;
      sfxGain.connect(ctx.destination); musGain.connect(ctx.destination);
    } catch (e) { ctx = null; return false; }
    return true;
  }
  function bytes(name) {
    var emb = window.AUDIO_EMBED && window.AUDIO_EMBED[name];
    if (emb) {
      var bin = atob(emb), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return Promise.resolve(arr.buffer);
    }
    return fetch('audio/' + name + '.mp3').then(function (r) { if (!r.ok) throw new Error('404'); return r.arrayBuffer(); });
  }
  function load(name) {
    if (buffers[name]) return Promise.resolve(buffers[name]);
    if (loading[name]) return loading[name];
    if (!init()) return Promise.reject();
    loading[name] = bytes(name).then(function (ab) {
      return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
    }).then(function (buf) { buffers[name] = buf; delete loading[name]; return buf; }).catch(function () { delete loading[name]; return null; });
    return loading[name];
  }
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (unlocked) return; unlocked = true;
    SFX.forEach(function (n) { load(n); });
    if (wanted) { var w = wanted; wanted = null; music(w); }
  }
  function play(name, vol) {
    if (!on.sfx || !ctx || !unlocked) return;
    var now = ctx.currentTime; if (last[name] && now - last[name] < 0.07) return; last[name] = now;
    var b = buffers[name]; if (!b) { load(name); return; }
    try {
      var s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b; g.gain.value = (vol == null ? 1 : vol) * (VOL[name] || 1);
      s.playbackRate.value = 0.94 + Math.random() * 0.12;
      s.connect(g); g.connect(sfxGain); s.start();
    } catch (e) { }
  }
  function stopCur(fade) {
    if (!cur) return; var c = cur; cur = null; curName = null;
    try { c.g.gain.cancelScheduledValues(ctx.currentTime); c.g.gain.setValueAtTime(c.g.gain.value, ctx.currentTime); c.g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade); c.s.stop(ctx.currentTime + fade + 0.05); } catch (e) { }
  }
  function music(name) {
    wanted = name;
    if (!ctx || !unlocked) return;
    if (!on.music || !name) { stopCur(0.6); return; }
    if (curName === name) return;
    load('music_' + name).then(function (buf) {
      if (!buf) { if (name !== 'combat' && wanted === name) music('combat'); return; }
      if (wanted !== name || !on.music || curName === name) return;
      for (var k in buffers) if (k.indexOf('music_') === 0 && k !== 'music_' + name) delete buffers[k]; // une seule musique en mémoire
      stopCur(0.8);
      var s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = buf; s.loop = true; s.loopStart = 0.03; s.loopEnd = Math.max(1, buf.duration - 0.06);
      g.gain.value = 0; g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
      s.connect(g); g.connect(musGain); s.start();
      cur = { s: s, g: g }; curName = name;
    });
  }
  function set(kind, v) { on[kind] = !!v; if (kind === 'music') { if (!v) stopCur(0.3); else if (wanted) music(wanted); } }
  function pause(p) { if (!ctx) return; try { if (p) ctx.suspend(); else if (unlocked) ctx.resume(); } catch (e) { } }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (evn) { window.addEventListener(evn, unlock, { passive: true }); });
  return { play: play, music: music, set: set, pause: pause, unlock: unlock };
})();
