/* MORVANE — règles du jeu (aucun affichage ici, tourne aussi dans Node pour les tests) */
(function (root) {
  'use strict';
  var D = root.DATA || require('./data.js');
  var SAVE_KEY = 'morvane_save_v1';
  var INV_MAX = 80;
  var GROW = { hp: 1.165, atk: 1.135, cend: 1.10, item: 1.07 }; // croissance par étage
  var E = {};

  // ---------- utilitaires ----------
  function rnd() { return Math.random(); }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function rf(a, b) { return a + rnd() * (b - a); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function wpick(items, wf) {
    var tot = 0, i; for (i = 0; i < items.length; i++) tot += wf(items[i]);
    var r = rnd() * tot; for (i = 0; i < items.length; i++) { r -= wf(items[i]); if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function add(dst, mods, times) { if (!mods) return dst; times = times == null ? 1 : times; for (var k in mods) dst[k] = (dst[k] || 0) + mods[k] * times; return dst; }
  E.fmt = function (n) {
    if (n == null || isNaN(n)) return '0';
    var neg = n < 0; n = Math.abs(n);
    var u = ['', 'k', 'M', 'G', 'T', 'P', 'E'], i = 0;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    var s = i === 0 ? String(Math.round(n)) : (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + u[i];
    return (neg ? '-' : '') + s;
  };
  E.hero = function (id) { return byId(D.HEROES, id); };
  E.zoneOf = function (floor) { return D.ZONES[Math.floor((floor - 1) / 10) % D.ZONES.length]; };
  E.cycleOf = function (floor) { return Math.floor((floor - 1) / 60); };
  E.zoneNum = function (floor) { return Math.floor((floor - 1) / 10) + 1; }; // numéro global de zone (1, 2, ... 7 = Crypte cycle 2)
  E.zoneLabel = function (zn) { var z = D.ZONES[(zn - 1) % 6], c = Math.floor((zn - 1) / 6); return z.name + (c ? ' — Abîme ' + c : ''); };

  // ---------- sauvegarde ----------
  var S = null; // la sauvegarde courante
  var store = null;
  try { store = root.localStorage || null; } catch (e) { store = null; }

  function newSave() {
    var s = {
      v: 1, cendres: 0, essence: 0, hero: 'chevalier', heroes: {}, inv: [], nextUid: 1, meta: {}, pacts: [], ach: {},
      stats: { kills: 0, deaths: 0, chests: 0, maxLvl: 0, leg: 0, uni: 0, best: 0, elites: 0, upgrades: 0, epic: 0, runs: 0, heroes: 1, weak: 0, parry: 0, ult: 0, arenes: 0, fusions: 0, maxHit: 0, maxCombo: 0, bossMax: 0, boss1: 0, boss2: 0, boss3: 0, boss4: 0, boss5: 0, boss6: 0, bosses: 0, items: 0 },
      settings: { sfx: true, music: true, speed: 1, auto: false, autoSalvage: -1 },
      idleAt: Date.now(), run: null, tuto: {}, codex: {}, uniq: {}, fam: null, daily: null, pityU: 0, created: Date.now()
    };
    s.heroes.chevalier = { xp: 0, lvl: 1, equip: {}, pacts: [] };
    return s;
  }
  E.load = function () {
    S = null;
    if (store) { try { var raw = store.getItem(SAVE_KEY); if (raw) S = JSON.parse(raw); } catch (e) { S = null; } }
    var fresh = !S;
    if (!S) {
      S = newSave();
      var a = E.makeItem(1, 0, { base: 'epee' }), b = E.makeItem(1, 0, { base: 'plastron' });
      a.isNew = b.isNew = false; S.inv.push(a, b);
      S.heroes.chevalier.equip = { arme: a.uid, armure: b.uid };
    }
    // champs manquants (anciennes sauvegardes)
    var ref = newSave(), k;
    for (k in ref) if (S[k] === undefined) S[k] = ref[k];
    for (k in ref.stats) if (S.stats[k] === undefined) S.stats[k] = ref.stats[k];
    for (k in ref.settings) if (S.settings[k] === undefined) S.settings[k] = ref.settings[k];
    if (S.run) { S.run.combat = null; if (S.run.phase === 'combat') E._buildCombat(S.run, true); }
    E.S = S;
    return fresh;
  };
  E.save = function () {
    if (!store || !S) return false;
    try {
      var c = S.run ? S.run.combat : null;
      if (S.run) S.run.combat = null;
      var txt = JSON.stringify(S);
      if (S.run) S.run.combat = c;
      store.setItem(SAVE_KEY, txt);
      return true;
    } catch (e) { return false; }
  };
  E.exportSave = function () {
    var c = S.run ? S.run.combat : null; if (S.run) S.run.combat = null;
    var txt = JSON.stringify(S); if (S.run) S.run.combat = c;
    return 'MORVANE1:' + (typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(txt))) : Buffer.from(txt, 'utf8').toString('base64'));
  };
  E.importSave = function (code) {
    try {
      code = String(code).trim(); if (code.indexOf('MORVANE1:') !== 0) return false;
      var b = code.slice(9);
      var txt = typeof atob !== 'undefined' ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, 'base64').toString('utf8');
      var o = JSON.parse(txt); if (!o || !o.heroes || !o.inv) return false;
      if (store) store.setItem(SAVE_KEY, JSON.stringify(o));
      E.load(); return true;
    } catch (e) { return false; }
  };
  E.reset = function () { if (store) { try { store.removeItem(SAVE_KEY); } catch (e) { } } E.load(); };
  E._setStore = function (st) { store = st; };

  // ---------- objets ----------
  function ilvlScale(l) { return Math.pow(GROW.item, l - 1); }
  E.ilvlScale = ilvlScale;
  E.makeItem = function (ilvl, rar, opts) {
    opts = opts || {};
    var uq = opts.unique ? byId(D.UNIQUES, opts.unique) : null;
    var base;
    if (uq) { base = byId(D.BASES, uq.base); rar = 5; }
    else if (opts.base) base = byId(D.BASES, opts.base);
    else {
      var slot = opts.slot || pick(D.SLOTS).id;
      base = pick(D.BASES.filter(function (b) { return b.slot === slot; }));
    }
    var it = { uid: S ? S.nextUid++ : 0, base: base.id, rar: rar, ilvl: Math.max(1, Math.round(ilvl)), up: 0, aff: [], isNew: true };
    if (uq) {
      it.uq = uq.id;
      for (var k in uq.aff) it.aff.push([k, uq.aff[k]]);
    } else {
      var n = D.RARITIES[rar].affixes, pool = D.AFFIXES.filter(function (a) { return !a.slots || a.slots.indexOf(base.slot) >= 0; });
      while (n-- > 0 && pool.length) {
        var a = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
        var q = rf(0, 1), v = a.min + (a.max - a.min) * q;
        it.aff.push([a.k, Math.round(v * 100) / 100]);
      }
      if (rar === 4) it.pw = pick(D.POWERS).id;
      if (opts.set && rar >= 2) it.set = opts.set;
    }
    return it;
  };
  E.itemBase = function (it) { return byId(D.BASES, it.base); };
  E.itemName = function (it) {
    if (it.uq) return byId(D.UNIQUES, it.uq).name;
    var b = byId(D.BASES, it.base), n = b.name;
    if (it.set) n += ' ' + byId(D.SETS, it.set).short;
    if (it.pw) n += ' « ' + byId(D.POWERS, it.pw).name + ' »';
    return n + (it.up ? ' +' + it.up : '');
  };
  var SCALED = { hp: 1, atk: 1, def: 1 };
  // Renvoie les bonus de l'objet en trois groupes pour l'affichage : base, affixes, pouvoir
  E.itemParts = function (it) {
    var b = byId(D.BASES, it.base), sc = ilvlScale(it.ilvl), rm = D.RARITIES[it.rar].mult;
    var upS = 1 + 0.1 * it.up, upP = 1 + 0.04 * it.up, k;
    var base = {}, aff = {}, pw = {};
    for (k in b.imp) base[k] = b.imp[k] * sc * rm * upS;
    if (b.imp2) for (k in b.imp2) base[k] = b.imp2[k] * (1 + 0.12 * it.rar) * upP;
    for (var i = 0; i < it.aff.length; i++) {
      k = it.aff[i][0]; var v = it.aff[i][1];
      aff[k] = (aff[k] || 0) + (SCALED[k] ? v * sc * upS : v * upP);
    }
    if (it.pw) add(pw, byId(D.POWERS, it.pw).mods);
    if (it.uq) add(pw, byId(D.UNIQUES, it.uq).mods);
    return { base: base, aff: aff, pw: pw };
  };
  E.itemMods = function (it) { var p = E.itemParts(it), m = {}; add(m, p.base); add(m, p.aff); add(m, p.pw); return m; };
  E.itemScore = function (it) {
    var m = E.itemMods(it), sc = ilvlScale(it.ilvl), s = 0;
    var W = { atk: 6, hp: 0.6, def: 3 };
    var WP = { atkP: 1.2, hpP: 0.8, defP: 0.5, spdP: 1.3, allP: 2.5, crit: 1.2, critd: 0.5, ls: 2, dodge: 1.2, regen: 8, pow: 0.5, cdr: 0.8, gf: 0.3, mf: 0.3, xp: 0.3, thorns: 0.2, block: 1 };
    for (var k in m) { if (W[k]) s += m[k] * W[k]; else if (WP[k]) s += m[k] * WP[k] * sc * 0.35; }
    if (it.pw) s += 12 * sc; if (it.uq) s += 25 * sc; if (it.set) s += 6 * sc;
    return s;
  };
  E.findItem = function (uid) { for (var i = 0; i < S.inv.length; i++) if (S.inv[i].uid === uid) return S.inv[i]; return null; };
  E.equippedBy = function (uid) { for (var h in S.heroes) { var eq = S.heroes[h].equip; for (var s in eq) if (eq[s] === uid) return h; } return null; };
  E.equip = function (uid, heroId) {
    heroId = heroId || S.hero; var it = E.findItem(uid); if (!it) return false;
    var prev = E.equippedBy(uid); if (prev) delete S.heroes[prev].equip[E.itemBase(it).slot];
    S.heroes[heroId].equip[E.itemBase(it).slot] = uid; it.isNew = false;
    if (S.run) recalc(S.run);
    return true;
  };
  E.unequip = function (slot, heroId) { delete S.heroes[heroId || S.hero].equip[slot]; if (S.run) recalc(S.run); };
  E.equipBest = function (heroId) {
    heroId = heroId || S.hero; var changed = 0;
    D.SLOTS.forEach(function (sl) {
      var cur = S.heroes[heroId].equip[sl.id], curIt = cur ? E.findItem(cur) : null, best = curIt, bs = curIt ? E.itemScore(curIt) : -1;
      S.inv.forEach(function (it) {
        if (E.itemBase(it).slot !== sl.id) return; var o = E.equippedBy(it.uid); if (o && o !== heroId) return;
        var sc = E.itemScore(it); if (sc > bs) { bs = sc; best = it; }
      });
      if (best && best !== curIt) { E.equip(best.uid, heroId); changed++; }
    });
    return changed;
  };
  E.upgradeCost = function (it) {
    return { essence: Math.ceil(3 * (it.rar + 1) * (it.up + 1) * (1 + it.ilvl / 15)), cendres: Math.ceil(8 * Math.pow(GROW.cend, it.ilvl) * (it.up + 1)) };
  };
  E.upgrade = function (uid) {
    var it = E.findItem(uid); if (!it || it.up >= 10) return false;
    var c = E.upgradeCost(it); if (S.essence < c.essence || S.cendres < c.cendres) return false;
    S.essence -= c.essence; S.cendres -= c.cendres; it.up++; it.spent = (it.spent || 0) + c.essence; S.stats.upgrades++;
    if (S.run) recalc(S.run); E.checkAch(); return true;
  };
  E.salvageValue = function (it) {
    return Math.ceil((it.rar + 1) * (it.rar + 1) * (1 + it.ilvl / 15) * (it.rar === 5 ? 3 : 1) + 0.6 * (it.spent || 0));
  };
  E.salvage = function (uid) {
    var it = E.findItem(uid); if (!it || it.lock || E.equippedBy(uid)) return 0;
    var v = E.salvageValue(it); S.essence += v; S.inv.splice(S.inv.indexOf(it), 1); return v;
  };
  E.salvageBelow = function (maxRar) {
    var tot = 0, n = 0;
    S.inv.slice().forEach(function (it) { if (it.rar <= maxRar && !it.lock && !E.equippedBy(it.uid)) { tot += E.salvage(it.uid); n++; } });
    return { n: n, essence: tot };
  };
  E.canFuse = function (it) { return !!it && it.rar <= 3 && !it.uq && !it.lock && !E.equippedBy(it.uid); };
  E.fusePreview = function (uids) {
    var its = uids.map(E.findItem);
    if (its.length !== 3 || its.some(function (i) { return !E.canFuse(i); })) return null;
    if (its[0].rar !== its[1].rar || its[0].rar !== its[2].rar || uids[0] === uids[1] || uids[0] === uids[2] || uids[1] === uids[2]) return null;
    var cnt = {}, set = null; its.forEach(function (i) { if (i.set) { cnt[i.set] = (cnt[i.set] || 0) + 1; if (cnt[i.set] >= 2) set = i.set; } });
    return { rar: its[0].rar + 1, ilvl: Math.max(its[0].ilvl, its[1].ilvl, its[2].ilvl), slot: E.itemBase(its[0]).slot, set: set };
  };
  E.fuse = function (uids) {
    var p = E.fusePreview(uids); if (!p) return null;
    uids.forEach(function (u) { var it = E.findItem(u); S.inv.splice(S.inv.indexOf(it), 1); });
    var it = E.makeItem(p.ilvl, p.rar, { slot: p.slot, set: p.set });
    S.inv.push(it); S.stats.fusions++; S.stats.items++;
    if (it.rar === 3) S.stats.epic++; if (it.rar === 4) S.stats.leg++;
    E.checkAch(); return it;
  };
  E.temperCost = function (it) {
    var target = Math.max(S.stats.best, 1); if (it.ilvl >= target) return null;
    return { target: target, essence: Math.ceil((target - it.ilvl) * (it.rar + 1) * 1.5 * (1 + target / 30)) };
  };
  E.temper = function (uid) {
    var it = E.findItem(uid); if (!it) return false; var c = E.temperCost(it);
    if (!c || S.essence < c.essence) return false;
    S.essence -= c.essence; it.spent = (it.spent || 0) + Math.round(c.essence * 0.5); it.ilvl = c.target;
    if (S.run) recalc(S.run); return true;
  };
  // Ajoute un objet au sac. Renvoie {item, salvaged:bool, essence}
  function giveItem(it) {
    S.stats.items++;
    if (it.rar === 3) S.stats.epic++; if (it.rar === 4) S.stats.leg++; if (it.rar === 5) S.stats.uni++;
    if (it.rar <= S.settings.autoSalvage) { var v = E.salvageValue(it); S.essence += v; return { item: it, salvaged: true, essence: v }; }
    S.inv.push(it);
    if (S.inv.length > INV_MAX) {
      var worst = null, ws = 1e99;
      S.inv.forEach(function (o) { if (o === it || o.lock || E.equippedBy(o.uid)) return; var sc = o.rar * 1e6 + o.ilvl; if (sc < ws) { ws = sc; worst = o; } });
      if (worst) E.salvage(worst.uid);
    }
    return { item: it, salvaged: false };
  }
  // src : 'mob' | 'elite' | 'chest' | 'boss'
  function rollRarity(src, mf) {
    var w = [55, 30, 11, 3.2, 0.45];
    var m = 1 + mf / 100;
    w[2] *= m; w[3] *= m; w[4] *= m;
    if (src === 'elite') { w[0] *= 0.4; w[2] *= 2; w[3] *= 2.5; w[4] *= 2.5; }
    if (src === 'chest') { w[0] *= 0.5; w[2] *= 1.8; w[3] *= 2; w[4] *= 2; }
    if (src === 'boss') { w[0] = 0; w[1] *= 0.5; w[2] *= 2.5; w[3] *= 4; w[4] *= 6; }
    var tot = 0, i; for (i = 0; i < w.length; i++) tot += w[i];
    var r = rnd() * tot; for (i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return 0;
  }
  function dropItem(run, src, minRar) {
    var st = run.stats, rar = rollRarity(src, st.mf || 0);
    if (minRar != null && rar < minRar) rar = minRar;
    var zs = D.SETS[(E.zoneNum(run.floor) - 1) % 6], sch = src === 'boss' ? 0.45 : src === 'mob' ? 0.22 : 0.32;
    var it = E.makeItem(run.floor + (src === 'boss' ? 2 : src === 'elite' ? 1 : 0), rar, { set: rnd() < sch ? zs.id : null });
    var g = giveItem(it); run.loot.push({ uid: it.uid, rar: it.rar }); return g;
  }

  // ---------- stats du héros ----------
  var MULT_KEYS = ['hpP', 'atkP', 'defP', 'spdP', 'allP'];
  E.pactSlots = function (heroId) { var l = S.heroes[heroId].lvl; return 1 + (l >= 4 ? 1 : 0) + (l >= 8 ? 1 : 0); };
  E.skillUnlocked = function (heroId, i) { var l = S.heroes[heroId].lvl; return i === 0 || (i === 1 && l >= 2) || (i === 2 && l >= 3); };
  E.masteryNeed = function (lvl) { return Math.round(50 * Math.pow(1.3, lvl - 1)); };
  E.heroStats = function (heroId, run) {
    var h = E.hero(heroId), hs = S.heroes[heroId];
    var perm = {}, meta = {}, rm = {}, k;
    add(perm, h.passive.mods);
    add(perm, { atkP: 3 * (hs.lvl - 1), hpP: 3 * (hs.lvl - 1) });
    for (var sl in hs.equip) { var it = E.findItem(hs.equip[sl]); if (it) add(perm, E.itemMods(it)); }
    hs.pacts.forEach(function (pid) { var p = byId(D.PACTS, pid); if (p) add(perm, p.mods); });
    if (hs.tal) D.TALENTS[heroId].forEach(function (t) { if (hs.tal[t.id]) add(perm, t.mods, hs.tal[t.id]); });
    var fam = S.fam ? byId(D.FAMILIARS, S.fam) : null; if (fam && E.famUnlocked(fam.id)) add(perm, fam.mods);
    var scn = E.setCounts(heroId); for (var sid in scn) { var sd = byId(D.SETS, sid); if (sd) for (var th in sd.bonus) if (scn[sid] >= +th) add(perm, sd.bonus[th]); }
    D.META.forEach(function (m) { var l = S.meta[m.id] || 0; if (l) add(meta, m.mods, l); });
    if (run) { add(rm, run.mods); add(rm, { atkP: 3 * (run.lvl - 1) + (run.mods.atkPerRoom || 0) * run.rooms, hpP: 3 * (run.lvl - 1) }); }
    var st = {};
    [perm, meta, rm].forEach(function (b) { for (k in b) if (MULT_KEYS.indexOf(k) < 0) st[k] = (st[k] || 0) + b[k]; });
    function mul(key) { var m = 1; [perm, meta, rm].forEach(function (b) { m *= Math.max(0.1, 1 + ((b[key] || 0) + (b.allP || 0)) / 100); }); return m; }
    st.hp = Math.max(1, Math.round((h.base.hp + (st.hp || 0)) * mul('hpP')));
    st.atk = Math.max(1, (h.base.atk + (st.atk || 0)) * mul('atkP'));
    st.def = Math.max(0, (h.base.def + (st.def || 0)) * mul('defP'));
    var sp = 1; [perm, meta, rm].forEach(function (b) { sp *= Math.max(0.2, 1 + (b.spdP || 0) / 100); });
    st.spd = h.base.spd * sp;
    st.crit = clamp(h.base.crit + (st.crit || 0), 0, 100);
    st.critd = 150 + (st.critd || 0);
    st.dodge = clamp(st.dodge || 0, 0, 60); st.block = clamp(st.block || 0, 0, 60);
    st.cdr = clamp(st.cdr || 0, 0, 60); st.ls = clamp(st.ls || 0, 0, 40);
    st.takenP = Math.max(-70, st.takenP || 0);
    ['regen', 'pow', 'gf', 'mf', 'xp', 'thorns', 'echo', 'burnHit', 'poisonHit', 'bleedHit', 'firstStrike', 'startShield', 'killHeal', 'exec', 'chain', 'frenzy', 'revive', 'boonChoices', 'potions', 'dmgP', 'healP', 'burnP', 'poisonP', 'bleedP', 'skel', 'skelP', 's1P', 's2P', 's3P', 'vulnStart', 'rerolls', 'startGold', 'idleP', 'idleH', 'startBoons', 'enemyHpP', 'startArtifact', 'enemyAtkP', 'ultP', 'parryP', 'weakP', 'eliteW', 'noRest'].forEach(function (key) { st[key] = st[key] || 0; });
    return st;
  };
  E.setCounts = function (heroId) { var o = {}, eq = S.heroes[heroId].equip; for (var sl in eq) { var it = E.findItem(eq[sl]); if (it && it.set) o[it.set] = (o[it.set] || 0) + 1; } return o; };
  E.omenOffer = function () { var p = D.OMENS.slice(), out = []; while (out.length < 3) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0].id); return out; };
  E.power = function (heroId) { // un seul chiffre « Puissance » pour le sanctuaire
    var s = E.heroStats(heroId, null);
    var dps = s.atk * s.spd * (1 + s.crit / 100 * (s.critd / 100 - 1)) * (1 + s.dmgP / 100) * (1 + s.pow / 400);
    var ehp = s.hp * (1 + s.def / (s.atk + 1) * 0.5) / (1 - s.dodge / 100) * (1 + s.ls / 20 + s.regen / 4);
    return Math.round(Math.sqrt(dps * ehp) * 2);
  };
  function recalc(run) {
    var old = run.stats ? run.stats.hp : null;
    run.stats = E.heroStats(run.hero, run);
    if (old != null && run.stats.hp > old) run.hp += run.stats.hp - old;
    run.hp = Math.min(run.hp, run.stats.hp);
    run.potionsMax = 2 + run.stats.potions;
    if (run.combat) run.combat.hero.maxhp = run.stats.hp;
  }
  E.recalc = recalc;

  // ---------- méta ----------
  E.metaCost = function (id) { var m = byId(D.META, id), l = S.meta[id] || 0; return l >= m.max ? null : Math.ceil(m.cost * Math.pow(m.grow, l)); };
  E.buyMeta = function (id) { var c = E.metaCost(id); if (c == null || S.cendres < c) return false; S.cendres -= c; S.meta[id] = (S.meta[id] || 0) + 1; return true; };
  E.famUnlocked = function (id) { var f = byId(D.FAMILIARS, id); return !!f && (S.codex[f.need[0]] || 0) >= f.need[1]; };
  E.setFam = function (id) { if (id && !E.famUnlocked(id)) return false; S.fam = S.fam === id ? null : id; if (S.run) recalc(S.run); return true; };
  E.famNew = function () { return D.FAMILIARS.some(function (f) { return E.famUnlocked(f.id) && !(S.tuto['fam_' + f.id]); }); };
  E.talentPoints = function (heroId) { var hs = S.heroes[heroId]; if (!hs) return 0; var sp = 0, k; for (k in (hs.tal || {})) sp += hs.tal[k]; return Math.max(0, hs.lvl - 1 - sp); };
  E.addTalent = function (heroId, tid) {
    var hs = S.heroes[heroId], t = byId(D.TALENTS[heroId], tid); if (!hs || !t || E.talentPoints(heroId) <= 0) return false;
    hs.tal = hs.tal || {}; if ((hs.tal[tid] || 0) >= t.max) return false;
    hs.tal[tid] = (hs.tal[tid] || 0) + 1; if (S.run) recalc(S.run); return true;
  };
  E.resetTalents = function (heroId) { var hs = S.heroes[heroId]; if (!hs) return; hs.tal = {}; if (S.run) recalc(S.run); };
  E.heroUnlocked = function (id) { return !!S.heroes[id]; };
  E.canUnlock = function (id) { var h = E.hero(id); if (!h.unlock || S.heroes[id]) return false; if (h.unlock.cost) return S.cendres >= h.unlock.cost; return false; };
  E.unlockHero = function (id, free) {
    var h = E.hero(id); if (S.heroes[id]) return false;
    if (!free) { if (!h.unlock || !h.unlock.cost || S.cendres < h.unlock.cost) return false; S.cendres -= h.unlock.cost; }
    S.heroes[id] = { xp: 0, lvl: 1, equip: {}, pacts: [] }; S.stats.heroes = Object.keys(S.heroes).length; E.checkAch(); return true;
  };
  E.togglePact = function (pid, heroId) {
    heroId = heroId || S.hero; var hs = S.heroes[heroId], i = hs.pacts.indexOf(pid);
    if (i >= 0) { hs.pacts.splice(i, 1); return true; }
    if (S.pacts.indexOf(pid) < 0 || hs.pacts.length >= E.pactSlots(heroId)) return false;
    hs.pacts.push(pid); return true;
  };
  E.checkAch = function () {
    var got = [];
    D.ACHIEVEMENTS.forEach(function (a) {
      if (S.ach[a.id]) return;
      if ((S.stats[a.c[0]] || 0) >= a.c[1]) {
        S.ach[a.id] = 1; S.cendres += a.cendres;
        if (a.pact && S.pacts.indexOf(a.pact) < 0) S.pacts.push(a.pact);
        got.push(a);
      }
    });
    D.HEROES.forEach(function (h) { if (h.unlock && h.unlock.boss && !S.heroes[h.id] && S.stats['boss' + h.unlock.boss] > 0) { E.unlockHero(h.id, true); got.push({ hero: h }); } });
    if (got.length) { E.newAch = (E.newAch || []).concat(got); }
    return got;
  };
  // Offrande du jour : une récompense par jour, qui grossit si on revient plusieurs jours de suite (jusqu'à 7)
  function dayNum() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  E.dailyInfo = function () {
    var dn = dayNum(), d = S.daily || { day: 0, streak: 0 };
    var streak = d.day === dn ? d.streak : d.day === dn - 1 ? Math.min(7, d.streak + 1) : 1;
    return { claimable: d.day !== dn, streak: streak, cendres: Math.ceil(25 * Math.pow(GROW.cend, S.stats.best) * (1 + 0.3 * (streak - 1))), essence: 4 * streak, item: streak === 7 };
  };
  E.claimDaily = function () {
    var i = E.dailyInfo(); if (!i.claimable) return null;
    S.daily = { day: dayNum(), streak: i.streak }; S.cendres += i.cendres; S.essence += i.essence;
    if (i.item) { var it = E.makeItem(Math.max(1, S.stats.best), 3, {}); S.inv.push(it); S.stats.items++; S.stats.epic++; i.got = it; }
    return i;
  };
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  E.contracts = function () {
    var key = dayKey();
    if (!S.contracts || S.contracts.day !== key) {
      var pool = D.CONTRACTS.slice(), list = [], used = {};
      while (list.length < 3 && pool.length) {
        var ct = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; if (used[ct[0]]) continue; used[ct[0]] = 1;
        var ess = list.length === 2;
        list.push({ stat: ct[0], need: ct[1], name: ct[2], base: S.stats[ct[0]] || 0, kind: ess ? 'essence' : 'cendres', amount: ess ? Math.ceil(15 * (1 + S.stats.best / 6)) : Math.ceil(50 * Math.pow(GROW.cend, S.stats.best)), claimed: false });
      }
      S.contracts = { day: key, list: list };
    }
    return S.contracts.list;
  };
  E.contractProgress = function (ct) { return Math.max(0, Math.min(ct.need, (S.stats[ct.stat] || 0) - ct.base)); };
  E.claimContract = function (i) {
    var ct = E.contracts()[i]; if (!ct || ct.claimed || E.contractProgress(ct) < ct.need) return false;
    ct.claimed = true; S[ct.kind] += ct.amount; return ct;
  };
  E.contractReady = function () { return E.contracts().some(function (ct) { return !ct.claimed && E.contractProgress(ct) >= ct.need; }); };
  E.idleInfo = function () {
    var st = E.heroStats(S.hero, null);
    var rate = S.stats.best > 0 ? 10 * Math.pow(GROW.cend, S.stats.best) * (1 + st.idleP / 100) : 0;
    var cap = 4 + st.idleH, hours = clamp((Date.now() - S.idleAt) / 3600000, 0, cap);
    return { rate: rate, cap: cap, hours: hours, amount: Math.floor(rate * hours), full: hours >= cap };
  };
  E.collectIdle = function () { var i = E.idleInfo(); if (i.amount <= 0) return 0; S.cendres += i.amount; S.idleAt = Date.now(); return i.amount; };

  // ---------- descente ----------
  E.maxStartZone = function () { return Math.min(S.stats.bossMax + 1, 60); };
  E.startRun = function (heroId, startZone, omenId) {
    heroId = heroId || S.hero; startZone = clamp(startZone || 1, 1, E.maxStartZone());
    var run = {
      hero: heroId, floor: (startZone - 1) * 10 + 1, startFloor: (startZone - 1) * 10 + 1, lvl: 1, xp: 0, gold: 0, hp: 1,
      potions: 0, potionsMax: 2, mods: {}, boons: {}, artifacts: [], rerolls: 0, revived: 0, rooms: 0, kills: 0, loot: [],
      cendres: 0, bosses: 0, ult: 0, stance: 'n', phase: 'room', doors: [], room: null, pendingBoons: 0, offer: null, result: null, combat: null, t: 0, log: []
    };
    S.run = run; S.hero = heroId; S.stats.runs++;
    var om = omenId ? byId(D.OMENS, omenId) : null; if (om) { add(run.mods, om.mods); run.omen = om.id; }
    recalc(run);
    run.hp = run.stats.hp; run.potions = run.potionsMax; run.gold = run.stats.startGold; run.rerolls = run.stats.rerolls;
    var free = run.stats.startBoons + (startZone - 1) * 3;
    if (startZone > 1) run.lvl = 1 + (startZone - 1) * 3;
    for (var i = 0; i < free; i++) { var o = offerBoons(run, 1, 0); if (o.length) applyBoon(run, o[0]); }
    if (run.stats.startArtifact) giveArtifact(run);
    recalc(run); run.hp = run.stats.hp; run.potions = run.potionsMax; run.rerolls = run.stats.rerolls;
    enterRoom(run, 'combat');
    E.checkAch(); E.save();
    return run;
  };
  function boonPool(run) { return D.BOONS.concat(E.hero(run.hero).boons.map(function (b) { b.max = b.max || 3; b.icon = b.icon || '⭐'; b.cls = true; return b; })); }
  E.boonById = function (id) { var b = byId(D.BOONS, id); if (b) return b; for (var i = 0; i < D.HEROES.length; i++) { b = byId(D.HEROES[i].boons, id); if (b) { b.icon = b.icon || '⭐'; return b; } } return null; };
  function offerBoons(run, n, bonus) {
    var pool = boonPool(run).filter(function (b) { return (run.boons[b.id] || 0) < (b.max || 3); });
    var w = [60, 27 + bonus * 10, 10 + bonus * 8, 2.5 + bonus * 3], out = [];
    while (out.length < n && pool.length) {
      var b = wpick(pool, function (x) { return w[x.rar] * (x.cls ? 1.6 : 1); });
      pool.splice(pool.indexOf(b), 1); out.push(b.id);
    }
    return out;
  }
  function applyBoon(run, id) { var b = E.boonById(id); if (!b) return; run.boons[id] = (run.boons[id] || 0) + 1; add(run.mods, b.mods); recalc(run); if (b.mods.potions) run.potions = Math.min(run.potionsMax, run.potions + b.mods.potions); }
  function giveArtifact(run, id) {
    var pool = D.ARTIFACTS.filter(function (a) { return run.artifacts.indexOf(a.id) < 0; });
    if (!pool.length) { run.gold += 80; return null; }
    var a = id ? byId(D.ARTIFACTS, id) : pick(pool);
    run.artifacts.push(a.id); add(run.mods, a.mods); recalc(run);
    if (a.mods.potions) run.potions = Math.min(run.potionsMax, run.potions + a.mods.potions);
    return a;
  }
  E.makeOffer = function (run, bonus) { run.offer = offerBoons(run, 3 + run.stats.boonChoices, bonus || 0); return run.offer; };
  E.chooseBoon = function (i) {
    var run = S.run; if (!run || !run.offer || run.pendingBoons <= 0) return false;
    applyBoon(run, run.offer[i]); run.pendingBoons--; run.offer = null;
    if (run.pendingBoons > 0) E.makeOffer(run);
    E.save(); return true;
  };
  E.rerollBoons = function () { var run = S.run; if (!run || run.rerolls <= 0 || !run.offer) return false; run.rerolls--; E.makeOffer(run); return true; };
  E.xpNeed = function (lvl) { return 14 + 3.5 * lvl; };
  function gainXp(run, amount) {
    amount = amount * (1 + run.stats.xp / 100); run.xp += amount; var ups = 0;
    while (run.xp >= E.xpNeed(run.lvl)) { run.xp -= E.xpNeed(run.lvl); run.lvl++; ups++; run.pendingBoons++; }
    if (ups) { recalc(run); heal(run, run.stats.hp * 0.15 * ups, true); if (run.lvl > S.stats.maxLvl) S.stats.maxLvl = run.lvl; }
    return ups;
  }
  function heal(run, amount, raw) {
    if (amount <= 0) return 0; if (!raw) amount *= Math.max(0.1, 1 + run.stats.healP / 100);
    var before = run.hp; run.hp = Math.min(run.stats.hp, run.hp + amount);
    var over = amount - (run.hp - before);
    if (over > 0 && run.hero === 'pretresse' && run.combat) { var c = run.combat; c.hero.shield = Math.min(run.stats.hp * 0.4, c.hero.shield + over * 0.5); c.hero.shieldT = 8; }
    return run.hp - before;
  }

  function genDoors(run) {
    var next = run.floor + 1, pos = ((next - 1) % 10) + 1;
    if (pos === 10) return ['boss'];
    var w = { combat: 50, elite: (next - run.startFloor) < 2 ? 0 : 13 * (run.stats.eliteW ? 3 : 1), tresor: 6, marchand: run.gold >= 40 ? 10 : 4, repos: run.stats.noRest ? 0 : run.hp < run.stats.hp * 0.6 ? 14 : 7, autel: 6, event: 10, mercenaire: (run.ally || next - run.startFloor < 3) ? 0 : 6, arene: next - run.startFloor < 4 ? 0 : 5 };
    if (run.lastRoom && w[run.lastRoom] && run.lastRoom !== 'combat') w[run.lastRoom] *= 0.25;
    var types = Object.keys(w).filter(function (k) { return w[k] > 0; }), n = rnd() < 0.35 ? 3 : 2, out = [];
    while (out.length < n) { var t = wpick(types, function (k) { return w[k]; }); if (out.indexOf(t) < 0) out.push(t); }
    if (out.indexOf('combat') < 0 && out.indexOf('elite') < 0 && out.indexOf('arene') < 0) out[0] = 'combat';
    if (pos === 9 && out.indexOf('repos') < 0 && out.indexOf('marchand') < 0) out[out.length - 1] = rnd() < 0.6 && !run.stats.noRest ? 'repos' : 'marchand';
    return out;
  }
  function enemyGroup(run, type) {
    var z = E.zoneOf(run.floor), pos = ((run.floor - 1) % 10) + 1;
    if (type === 'boss') return [z.boss];
    if (type === 'mimic') return ['mimique'];
    if (type === 'elite') return rnd() < 0.5 ? [z.elite, pick(z.mobs)] : [z.elite];
    if (run.floor <= 2) return [z.mobs[run.floor - 1]];
    // un monstre peut porter un préfixe (vampirique, géant...) : plus dur, mais rapporte plus
    function fixed(k) { return run.floor >= 4 && rnd() < Math.min(0.4, 0.14 + run.floor * 0.004) ? { k: k, fix: pick(D.MOBFIX).id } : k; }
    if (type === 'combat' && run.floor >= 4 && run.room) {
      var rv = rnd();
      if (rv < 0.09) { run.room.variant = 'horde'; var hg = []; for (var hi = 0; hi < 5; hi++) hg.push({ k: pick(z.mobs), hp: 0.42, atk: 0.7 }); return hg; }
      if (rv < 0.17) { run.room.variant = 'champion'; return [{ k: pick(z.mobs), hp: 2.4, atk: 1.25, fix: 'geant', fix2: pick(D.MOBFIX.filter(function (f) { return f.id !== 'geant'; })).id, champ: 1 }]; }
      if (rv < 0.205) { run.room.variant = 'porteur'; return [{ k: 'rat', hp: 3.2, atk: 0.3, flee: 12, gold: 1 }, pick(z.mobs)]; }
    }
    var n = rnd() < (pos >= 6 ? 0.45 : 0.2) ? 3 : 2, g = [];
    if (run.floor === 3) n = 2;
    for (var i = 0; i < n; i++) g.push(fixed(pick(z.mobs)));
    return g;
  }
  function enterRoom(run, type) {
    run.room = { type: type }; run.result = null; run.lastRoom = type;
    var r = run.room, z = E.zoneOf(run.floor), pm = 1 + 0.12 * (E.zoneNum(run.floor) - 1);
    if (type === 'combat' || type === 'elite' || type === 'boss' || type === 'arene') {
      if (type === 'arene') { r.waves = 3; r.wave = 1; }
      r.group = enemyGroup(run, type === 'arene' ? 'wave' : type);
      if ((type === 'combat' || type === 'elite') && run.floor >= 3 && rnd() < 0.3) r.cond = pick(D.CONDS).id;
      run.hpEntry = run.hp; run.phase = 'combat'; E._buildCombat(run); return;
    }
    run.phase = 'room';
    if (type === 'tresor') {
      if (rnd() < 0.12) { r.mimic = true; }
    } else if (type === 'marchand') {
      var art = pick(D.ARTIFACTS.filter(function (a) { return run.artifacts.indexOf(a.id) < 0; }));
      var it = E.makeItem(run.floor + 1, Math.max(2, rollRarity('chest', run.stats.mf)), { set: rnd() < 0.3 ? D.SETS[(E.zoneNum(run.floor) - 1) % 6].id : null });
      r.stock = [
        { kind: 'potion', name: 'Fiole de soin', icon: '🧪', desc: '+1 fiole', price: Math.round(35 * pm) },
        { kind: 'heal', name: 'Bandages', icon: '🩹', desc: 'Soigne 40 % PV', price: Math.round(30 * pm) },
        { kind: 'boon', name: 'Aubaine', icon: '🌒', desc: 'Choisis une aubaine', price: Math.round(70 * pm) }
      ];
      if (art) r.stock.push({ kind: 'artifact', id: art.id, name: art.name, icon: art.icon, desc: art.desc, price: Math.round(130 * pm) });
      r.stock.push({ kind: 'item', item: it, name: E.itemName(it), icon: E.itemBase(it).icon, desc: D.RARITIES[it.rar].name, price: Math.round((40 + 35 * it.rar) * pm) });
    } else if (type === 'autel') {
      var a = D.ALTARS.slice(), o1 = a.splice(Math.floor(rnd() * a.length), 1)[0], o2 = a.splice(Math.floor(rnd() * a.length), 1)[0];
      r.altars = [D.ALTARS.indexOf(o1), D.ALTARS.indexOf(o2)];
    } else if (type === 'event') {
      r.event = pick(D.EVENTS).id;
    } else if (type === 'mercenaire') {
      var hl = D.HEROES.filter(function (x) { return x.id !== run.hero; }).map(function (x) { return x.id; });
      r.mercs = [hl.splice(Math.floor(rnd() * hl.length), 1)[0], hl.splice(Math.floor(rnd() * hl.length), 1)[0]]; r.price = Math.round(45 * pm);
    }
  }
  E.chooseDoor = function (i) {
    var run = S.run; if (!run || run.phase !== 'doors' || run.pendingBoons > 0) return false;
    var t = run.doors[i]; if (!t) return false;
    run.floor++; enterRoom(run, t); E.save(); return true;
  };
  function toDoors(run) {
    run.rooms++;
    if (run.floor > S.stats.best) S.stats.best = run.floor;
    recalc(run);
    run.doors = genDoors(run); run.phase = 'doors'; if (run.pendingBoons > 0 && !run.offer) E.makeOffer(run);
    E.checkAch(); E.save();
  }
  E.continueRun = function () { var run = S.run; if (run && run.phase === 'victory') { toDoors(run); return true; } return false; };

  // Actions des salles sans combat. Renvoie un texte de résultat (ou false).
  E.roomAction = function (action, arg) {
    var run = S.run; if (!run || run.phase !== 'room') return false; var r = run.room, txt = '';
    if (r.type === 'tresor') {
      if (r.mimic) { r.group = enemyGroup(run, 'mimic'); r.wasMimic = true; run.hpEntry = run.hp; run.phase = 'combat'; E._buildCombat(run); return 'mimic'; }
      var res = { items: [], gold: Math.round(ri(30, 60) * (1 + run.stats.gf / 100)), cendres: 0, xp: 0, chest: true };
      res.items.push(dropItem(run, 'chest')); if (rnd() < 0.1) res.items.push(dropItem(run, 'chest'));
      run.gold += res.gold; S.stats.chests++; run.result = res; run.phase = 'victory'; E.checkAch(); E.save(); return 'chest';
    }
    if (r.type === 'marchand') {
      if (action === 'leave') { toDoors(run); return 'leave'; }
      var s = r.stock[arg]; if (!s || s.sold || run.gold < s.price) return false;
      if (s.kind === 'potion') { if (run.potions >= run.potionsMax) return false; run.potions++; }
      else if (s.kind === 'heal') { if (run.hp >= run.stats.hp) return false; heal(run, run.stats.hp * 0.4); }
      else if (s.kind === 'boon') { run.pendingBoons++; E.makeOffer(run, 1); }
      else if (s.kind === 'artifact') giveArtifact(run, s.id);
      else if (s.kind === 'item') { s.item.uid = S.nextUid++; giveItem(s.item); run.loot.push({ uid: s.item.uid, rar: s.item.rar }); }
      run.gold -= s.price; if (s.kind !== 'heal' && s.kind !== 'potion') s.sold = true; E.save(); return 'buy';
    }
    if (r.type === 'mercenaire') {
      if (action === 'hire') { if (run.gold < r.price || !r.mercs[arg]) return false; run.gold -= r.price; run.ally = r.mercs[arg]; txt = E.hero(run.ally).name + ' te rejoint jusqu’au prochain boss.'; }
      else txt = 'Tu continues seul.';
      toDoors(run); return txt;
    }
    if (r.type === 'repos') {
      if (action === 'heal') { heal(run, run.stats.hp * 0.45); txt = 'Tu te reposes près du feu. +45 % PV.'; }
      else if (action === 'sharpen') { add(run.mods, { atkP: 8, hpP: 8 }); recalc(run); txt = 'Tu affûtes ta lame et resserres tes sangles. +8 % attaque et PV.'; }
      else if (action === 'potion') { run.potions = Math.min(run.potionsMax, run.potions + 1); heal(run, run.stats.hp * 0.15); txt = 'Tu distilles une fiole. +1 fiole, +15 % PV.'; }
      else return false;
      toDoors(run); return txt;
    }
    if (r.type === 'autel') {
      if (action === 'take') { var al = D.ALTARS[r.altars[arg]]; add(run.mods, al.mods); recalc(run); txt = al.name + ' acceptée.'; }
      else txt = "Tu laisses l'autel à sa soif.";
      toDoors(run); return txt;
    }
    if (r.type === 'event') {
      var ev = byId(D.EVENTS, r.event), o = ev.opts[arg]; if (!o) return false;
      if (o.need && o.need.gold && run.gold < o.need.gold) return false;
      var fx = o.fx; txt = o.r;
      if (fx.gold) run.gold = Math.max(0, run.gold + fx.gold);
      if (fx.healPct) heal(run, run.stats.hp * fx.healPct / 100);
      if (fx.hpPct) run.hp = Math.max(1, run.hp + run.stats.hp * fx.hpPct / 100);
      if (fx.maxHpP) { add(run.mods, { hpP: fx.maxHpP }); recalc(run); }
      if (fx.atkP) { add(run.mods, { atkP: fx.atkP }); recalc(run); }
      if (fx.curse) { var cm = {}; cm[fx.curse] = fx.curseV; add(run.mods, cm); recalc(run); }
      if (fx.boon) { run.pendingBoons += fx.boon; }
      if (fx.artifact) { var ar = giveArtifact(run); if (ar) txt += ' (' + ar.name + ')'; }
      if (fx.item != null) { var g = dropItem(run, 'chest', fx.item); txt += ' (' + E.itemName(g.item) + ')'; r.gotItem = g.item.uid; }
      if (fx.cendres) { var cg = Math.ceil(15 * Math.pow(GROW.cend, run.floor)); S.cendres += cg; run.cendres += cg; txt += ' +' + E.fmt(cg) + ' Cendres.'; }
      if (fx.gamble) {
        var stake = Math.floor(run.gold / 2);
        if (rnd() < 0.5) { run.gold += stake; txt = 'Double six ! Tu gagnes ' + stake + ' or.'; } else { run.gold -= stake; txt = 'Les dés roulent... et tu perds ' + stake + ' or.'; }
      }
      if (fx.ambush) {
        if (rnd() < 0.5) { r.type = 'combat'; r.group = enemyGroup(run, 'elite'); r.ambush = true; r.forceElite = true; run.hpEntry = run.hp; run.phase = 'combat'; E._buildCombat(run); return 'Quelque chose t’attendait en bas !'; }
        var g2 = dropItem(run, 'chest', 2); txt = 'Tu trouves un objet oublié : ' + E.itemName(g2.item) + '.'; r.gotItem = g2.item.uid;
      }
      toDoors(run); return txt;
    }
    return false;
  };

  // ---------- combat ----------
  function mkEnemy(run, spec, hpMul) {
    var sp = typeof spec === 'string' ? { k: spec } : spec, key = sp.k, b = D.ENEMIES[key], F = run.floor;
    var hs = Math.pow(GROW.hp, F - 1), as = Math.pow(GROW.atk, F - 1);
    var ab = b.ab, name = b.name, hm = (hpMul || 1) * (sp.hp || 1), am = sp.atk || 1, im = 1, defK = 0;
    [sp.fix, sp.fix2].forEach(function (fid) {
      var f = fid ? byId(D.MOBFIX, fid) : null; if (!f) return;
      if (f.ab) { var nab = {}, k; for (k in ab) nab[k] = ab[k]; for (k in f.ab) nab[k] = Math.max(nab[k] || 0, f.ab[k]); ab = nab; }
      hm *= f.hp || 1; am *= f.atk || 1; im *= f.int || 1; defK += f.def || 0; name += ' ' + f.name;
    });
    if (sp.gold) name = "Porteur d'or";
    var hp = b.hp * hs * hm * (1 + (run.stats.enemyHpP || 0) / 100), atk = b.atk * as * am * (1 + (run.stats.enemyAtkP || 0) / 100);
    return {
      key: key, name: name, hp: hp, maxhp: hp, atk: atk, def: b.def * as + defK * atk, int: b.int * im, t: b.int * im * rf(0.5, 1), ab: ab,
      fix: sp.fix || null, fix2: sp.fix2 || null, champ: !!sp.champ, big: sp.fix === 'geant' || sp.fix2 === 'geant', flee: sp.flee || 0, gold: !!sp.gold,
      elite: !!b.elite, boss: !!b.boss, st: {}, charge: null, chargeCd: ab.charge ? ab.charge * rf(0.6, 0.9) : 0,
      healT: 6, summonT: 10, shieldT: 5, shield: 0, enraged: false, dead: false, id: 0
    };
  }
  E._buildCombat = function (run, restore) {
    if (restore) run.hp = run.hpEntry || run.hp;
    var r = run.room, st = run.stats, n = r.group.length;
    var c = {
      t: 0, over: false, win: false, boss: r.type === 'boss', cond: r.cond || null, events: [], target: 0, nextId: 1, weak: null, weakT: 4 + rnd() * 3, drops: [], gold: 0, cendres: 0, xp: 0, kills: 0,
      hero: { maxhp: st.hp, shield: st.startShield ? st.hp * st.startShield / 100 : 0, shieldT: st.startShield ? 999 : 0, atkT: 0.6, cds: [1.5, 3, 5], st: {}, buffs: {}, parryT: 0, parryCd: 0, invuln: 0, frenzy: 0, hits: 0, first: true, skel: run.hero === 'necro' ? 1 : 0, skelT: 1, nextCrit: false },
      enemies: []
    };
    r.group.forEach(function (k) { var e = mkEnemy(run, k, n >= 3 ? 0.8 : 1); e.id = c.nextId++; if (st.vulnStart) e.st.vuln = st.vulnStart; c.enemies.push(e); });
    run.combat = c;
    c.events.push({ k: r.type === 'boss' ? 'boss' : 'start' });
  };
  function ev(c, o) { if (c.events.length < 200) c.events.push(o); }
  function alive(c) { return c.enemies.filter(function (e) { return !e.dead; }); }
  function target(c) {
    var e = c.enemies[c.target]; if (e && !e.dead) return e;
    for (var i = 0; i < c.enemies.length; i++) if (!c.enemies[i].dead) { c.target = i; return c.enemies[i]; }
    return null;
  }
  E.setTarget = function (i) { var c = S.run && S.run.combat; if (c && c.enemies[i] && !c.enemies[i].dead) c.target = i; };
  function heroHeal(run, c, amount, raw) { var h = heal(run, amount, raw); if (h >= 1) ev(c, { k: 'heal', v: h }); return h; }

  // Le héros inflige des dégâts. o : {skill:1|2|3, crit:force, noCrit, dot, flat (dégâts déjà calculés), auto}
  function hit(run, c, e, mult, o) {
    o = o || {}; if (!e || e.dead) return 0;
    var st = run.stats, h = c.hero;
    var edg = (e.ab.dodge || 0) + (c.cond === 'tenebres' ? 20 : 0);
    if (o.auto && edg && !e.st.stun && rnd() * 100 < edg) { ev(c, { k: 'miss', id: e.id }); return 0; }
    var dmg = o.flat != null ? o.flat : st.atk * mult, crit = false;
    if (o.skill) dmg *= (1 + st.pow / 100) * (1 + (st['s' + o.skill + 'P'] || 0) / 100);
    if (!o.dot) {
      if (o.crit || (!o.noCrit && rnd() * 100 < st.crit)) { crit = true; dmg *= st.critd / 100; }
      if (h.first) { h.first = false; if (st.firstStrike) dmg *= 1 + st.firstStrike / 100; }
      if (st.exec && e.hp / e.maxhp < 0.3) dmg *= 1 + st.exec / 100;
    }
    dmg *= 1 + st.dmgP / 100;
    if (run.hero === 'berserker') dmg *= 1 + (1 - run.hp / st.hp);
    if (h.st.weak > 0) dmg *= 0.75;
    if (e.st.vuln > 0) dmg *= 1.25;
    if (run.stance === 'a') dmg *= 1.25; else if (run.stance === 'd') dmg *= 0.8;
    if (o.ult) dmg *= 1 + st.pow / 100;
    if (c.cond === 'sang') dmg *= 1.4;
    if (!o.dot && e.def > 0) dmg *= (2 * st.atk) / (2 * st.atk + e.def);
    if (e.shield > 0) { var ab = Math.min(e.shield, dmg); e.shield -= ab; dmg -= ab; if (dmg <= 0) { ev(c, { k: 'dmg', id: e.id, v: 0, sh: 1 }); return 0; } }
    e.hp -= dmg; run.dmg = (run.dmg || 0) + dmg; if (!o.dot && dmg > (run.maxHit || 0)) run.maxHit = dmg;
    ev(c, { k: 'dmg', id: e.id, v: dmg, crit: crit, dot: o.dot || null, skill: !!o.skill });
    var ls = st.ls + (h.buffs.ls ? h.buffs.ls.v : 0);
    if (ls > 0 && !o.dot) heroHeal(run, c, dmg * ls / 100);
    if (o.drain) heroHeal(run, c, dmg);
    if (crit && run.hero === 'assassin') applyDot(run, e, 'poison');
    if (!e.enraged && e.ab.enrage && e.hp > 0 && e.hp / e.maxhp < 0.3) { e.enraged = true; ev(c, { k: 'enrage', id: e.id }); }
    if (e.hp <= 0) kill(run, c, e);
    return dmg;
  }
  function applyDot(run, e, kind) {
    var st = run.stats;
    if (kind === 'burn') e.st.burn = { t: 3, dps: Math.max(e.st.burn ? e.st.burn.dps : 0, st.atk * 0.25 * (1 + st.burnP / 100)) };
    if (kind === 'poison') { var p = e.st.poison || { n: 0 }; p.n = Math.min(8, p.n + 1); p.t = 5; p.dps = st.atk * 0.08 * (1 + st.poisonP / 100) * p.n; e.st.poison = p; }
    if (kind === 'bleed') e.st.bleed = { t: 4, dps: Math.max(e.st.bleed ? e.st.bleed.dps : 0, st.atk * 0.22 * (1 + st.bleedP / 100)) };
  }
  function kill(run, c, e) {
    if (e.dead) return; e.dead = true; e.hp = 0; e.charge = null;
    var st = run.stats, F = run.floor, g = 1 + st.gf / 100;
    var cm = e.boss ? 30 : e.elite ? 6 : 1;
    if (e.summoned) cm *= 0.4;
    if (e.fix) cm *= 1.6; if (e.champ) cm *= 3; if (e.gold) cm *= 8;
    var cend = Math.ceil(cm * Math.pow(GROW.cend, F - 1) * g), gold = Math.round((e.boss ? 60 : e.elite ? 25 : ri(4, 8)) * g * (e.summoned ? 0.4 : 1));
    if (e.gold) gold *= 12; else if (e.champ) gold *= 3;
    if (c.cond === 'or') { cend *= 2; gold *= 2; }
    ug(run, 5); c.cendres += cend; c.gold += gold; c.kills++; run.kills++; S.stats.kills++;
    c.xp += (e.boss ? 30 : e.elite ? 16 : 6.5) * (e.summoned ? 0.4 : 1) * (e.champ ? 2.5 : e.fix ? 1.5 : 1);
    if (e.elite) S.stats.elites++;
    S.codex[e.key] = (S.codex[e.key] || 0) + 1;
    ev(c, { k: 'die', id: e.id, boss: e.boss });
    if (st.killHeal) heroHeal(run, c, st.hp * st.killHeal / 100);
    if (run.hero === 'necro') c.hero.skel = Math.min(3 + st.skel, c.hero.skel + 1);
    if (e.ab.explode) { ev(c, { k: 'explode', id: e.id }); hurt(run, c, null, e.atk * e.ab.explode / 100, {}); }
    // butin
    if (!e.summoned) {
      if (e.boss) {
        var zn = ((E.zoneNum(F) - 1) % 6) + 1, z = D.ZONES[zn - 1], first = E.zoneNum(F) > S.stats.bossMax;
        var uChance = Math.min(0.2, (0.035 + S.pityU * 0.012) * (1 + st.mf / 300));
        if (rnd() < uChance) { var u = E.makeItem(F + 2, 5, { unique: pick(z.uniques) }); S.uniq[u.uq] = 1; c.drops.push(giveItem(u)); run.loot.push({ uid: u.uid, rar: 5 }); S.pityU = 0; } else S.pityU++;
        c.drops.push(dropItem(run, 'boss', first ? 3 : 2)); if (rnd() < 0.3) c.drops.push(dropItem(run, 'boss'));
      } else if (e.elite) { if (rnd() < 0.65) c.drops.push(dropItem(run, 'elite')); if (st.eliteW) c.drops.push(dropItem(run, 'elite')); }
      else if (e.champ) { c.drops.push(dropItem(run, 'elite')); }
      else if (e.gold) c.drops.push(dropItem(run, 'chest', 2));
      else if (rnd() < (e.fix ? 0.11 : 0.04)) c.drops.push(dropItem(run, 'mob'));
    }
    if (!alive(c).length) endOrWave(run, c);
  }
  function endOrWave(run, c) { var rr = run.room; if (rr.waves && (rr.wave || 1) < rr.waves) { if (!c.nextWave) { rr.wave = (rr.wave || 1) + 1; c.nextWave = 1.3; } } else { c.over = true; c.win = true; } }
  // Le héros subit des dégâts. e peut être null (explosion, poison).
  function hurt(run, c, e, raw, o) {
    o = o || {}; var st = run.stats, h = c.hero;
    if (c.over && !c.win) return 0;
    var pm = 1;
    if (h.invuln > 0 && !o.dot) { ev(c, { k: 'hurt', v: 0, sh: 1 }); return 0; }
    if (h.parryT > 0 && e && !o.dot) {
      if (o.big) { S.stats.parry++; ev(c, { k: 'parry', perfect: 1 }); stun(c, e, 2); hit(run, c, e, 3 * (1 + st.parryP / 100), {}); ug(run, 25); return 0; }
      pm = 0.3; ev(c, { k: 'parry' }); hit(run, c, e, 0.8 * (1 + st.parryP / 100), { noCrit: true, dot: 'thorns' });
    }
    if (!o.dot) {
      var dg = st.dodge + (h.buffs.dodge ? h.buffs.dodge.v : 0);
      if (rnd() * 100 < dg) { ev(c, { k: 'dodge' }); return 0; }
    }
    var dmg = raw * (c.cond === 'sang' && !o.dot ? 1.4 : 1), blocked = false;
    if (!o.dot) {
      if (e && e.st.weak > 0) dmg *= 0.75;
      if (rnd() * 100 < st.block) { dmg *= 0.5; blocked = true; }
      dmg *= (2 * raw) / (2 * raw + st.def);
    }
    dmg *= Math.max(0.3, 1 + st.takenP / 100) * pm * (run.stance === 'a' ? 1.2 : run.stance === 'd' ? 0.75 : 1);
    if (h.shield > 0) { var ab = Math.min(h.shield, dmg); h.shield -= ab; dmg -= ab; if (ab > 0 && dmg <= 0) { ev(c, { k: 'hurt', v: 0, sh: 1 }); dmg = 0; } }
    if (dmg > 0 && !o.dot) ug(run, 3);
    if (dmg > 0) { run.hp -= dmg; ev(c, { k: 'hurt', v: dmg, block: blocked, dot: o.dot, big: o.big }); }
    if (e && !o.dot) {
      var th = st.thorns + (h.buffs.thorns ? 100 : 0);
      if (th > 0 && !e.dead) hit(run, c, e, th / 100, { noCrit: true, dot: 'thorns' });
      if (e.ab.leech && dmg > 0 && !e.dead) e.hp = Math.min(e.maxhp, e.hp + dmg * e.ab.leech / 100 * 3);
      if (e.ab.poison && rnd() * 100 < e.ab.poison) { var p = h.st.poison || { n: 0 }; p.n = Math.min(6, p.n + 1); p.t = 5; p.dps = e.atk * 0.07 * p.n; h.st.poison = p; }
      if (e.ab.burn && rnd() * 100 < e.ab.burn) h.st.burn = { t: 3, dps: e.atk * 0.22 };
      if (e.ab.bleed && rnd() * 100 < e.ab.bleed) h.st.bleed = { t: 4, dps: e.atk * 0.18 };
      if (e.ab.weak && rnd() * 100 < e.ab.weak) h.st.weak = 4;
    }
    if (run.hp <= 0 && h.buffs.undying) run.hp = 1;
    if (run.hp <= 0) {
      if (run.revived < st.revive) { run.revived++; run.hp = st.hp * 0.4; h.st = {}; ev(c, { k: 'revive' }); }
      else { run.hp = 0; c.over = true; c.win = false; }
    }
    return dmg;
  }
  function stun(c, e, t) { if (!e || e.dead) return; e.st.stun = Math.max(e.st.stun || 0, e.boss ? t * 0.6 : t); if (e.charge) { e.charge = null; e.chargeCd = e.ab.charge; ev(c, { k: 'interrupt', id: e.id }); } }
  function heroAttack(run, c) {
    var st = run.stats, h = c.hero, e = target(c); if (!e) return;
    h.hits++; ug(run, 2.5);
    var forced = h.nextCrit; h.nextCrit = false;
    var d = hit(run, c, e, forced ? 2 : 1, { auto: true, crit: forced });
    ev(c, { k: 'swing' });
    if (d > 0 && !e.dead) {
      if (st.burnHit && rnd() * 100 < st.burnHit) applyDot(run, e, 'burn');
      if (st.poisonHit && rnd() * 100 < st.poisonHit) applyDot(run, e, 'poison');
      if (st.bleedHit && rnd() * 100 < st.bleedHit) applyDot(run, e, 'bleed');
      if (e.ab.thorns) hurt(run, c, null, e.atk * e.ab.thorns / 100, { dot: 'thorns' });
    }
    if (st.echo && rnd() * 100 < st.echo) { var e2 = target(c); if (e2) { hit(run, c, e2, 1, { auto: true }); ev(c, { k: 'echo' }); } }
    if (st.chain && h.hits % 4 === 0) { alive(c).forEach(function (x) { hit(run, c, x, st.chain / 100, { noCrit: true, dot: 'chain' }); }); ev(c, { k: 'chain' }); }
    if (st.frenzy && h.frenzy < 10) h.frenzy++;
  }
  E.skillCd = function (run, i) { var sk = E.hero(run.hero).skills[i]; return sk.cd * (1 - run.stats.cdr / 100); };
  E.useSkill = function (i) {
    var run = S.run, c = run && run.combat; if (!c || c.over) return false;
    var h = c.hero, st = run.stats; if (h.cds[i] > 0 || !E.skillUnlocked(run.hero, i)) return false;
    var sk = E.hero(run.hero).skills[i], e = target(c); if (!e) return false;
    var others = alive(c).filter(function (x) { return x !== e; }), all = alive(c);
    h.cds[i] = E.skillCd(run, i); ug(run, 5);
    ev(c, { k: 'skill', i: i, id: sk.id, sfx: sk.sfx, name: sk.name });
    switch (sk.id) {
      case 'k1': hit(run, c, e, 1.8, { skill: 1 }); stun(c, e, 1.5); break;
      case 'k2': hit(run, c, e, 3.5, { skill: 2 }); heroHeal(run, c, st.hp * 0.10); break;
      case 'k3': h.shield = Math.max(h.shield, st.hp * 0.30 * (1 + st.pow / 200)); h.shieldT = 6; h.buffs.thorns = { t: 6, v: 1 }; break;
      case 'p1': hit(run, c, e, 2.2, { skill: 1 }); applyDot(run, e, 'burn'); others.forEach(function (x) { hit(run, c, x, 0.9, { skill: 1 }); applyDot(run, x, 'burn'); }); break;
      case 'p2': all.forEach(function (x) { hit(run, c, x, 1.7, { skill: 2 }); applyDot(run, x, 'burn'); }); break;
      case 'p3': hit(run, c, e, e.st.burn ? 6.4 : 4.0, { skill: 3 }); h.buffs.spd = { t: 5, v: 50 }; break;
      case 'a1': for (var n = 0; n < 3; n++) { var tg = target(c); if (tg) hit(run, c, tg, 0.85, { skill: 1 }); } break;
      case 'a2': h.buffs.dodge = { t: 3, v: 60 }; h.nextCrit = true; break;
      case 'a3': var low = e.hp / e.maxhp < 0.35; hit(run, c, e, low ? 7.5 : 3.0, { skill: 3 }); if (e.dead) h.cds[i] = 0.5; break;
      case 'n1': hit(run, c, e, 2.0, { skill: 1 }); h.skel = Math.min(3 + st.skel, h.skel + 1); break;
      case 'n2': hit(run, c, e, 1.9, { skill: 2, drain: true }); break;
      case 'n3': h.skel = 3 + st.skel; h.buffs.skelF = { t: 5, v: 3 }; break;
      case 'b1': hit(run, c, e, 2.0, { skill: 1 }); if (!e.dead) applyDot(run, e, 'bleed'); break;
      case 'b2': run.hp = Math.max(1, run.hp - run.hp * 0.10); h.buffs.spd = { t: 6, v: 60 }; h.buffs.ls = { t: 6, v: 15 }; break;
      case 'b3': var cnt = all.length; all.forEach(function (x) { hit(run, c, x, 2.2, { skill: 3 }); }); heroHeal(run, c, st.hp * 0.05 * cnt); break;
      case 's1': hit(run, c, e, 1.9, { skill: 1 }); if (!e.dead) e.st.weak = 4; break;
      case 's2': heroHeal(run, c, st.hp * 0.25 * (1 + st.pow / 200)); delete h.st.poison; delete h.st.burn; delete h.st.bleed; delete h.st.weak; break;
      case 's3': all.forEach(function (x) { hit(run, c, x, 0, { skill: 3, flat: st.hp * 0.30, noCrit: true }); stun(c, x, 1); }); break;
    }
    if (c.over) finish(run, c);
    return true;
  };
  function ug(run, n) { run.ult = Math.min(100, (run.ult || 0) + n * (1 + (run.stats.ultP || 0) / 100) * (run.combat && run.combat.cond === 'silence' ? 2 : 1)); }
  E.PARRY_CD = 5;
  // Parade : pendant 1 s les coups sont réduits de 70 % et renvoyés. Une attaque chargée parée est annulée.
  E.parry = function () {
    var run = S.run, c = run && run.combat; if (!c || c.over || c.hero.parryCd > 0) return false;
    c.hero.parryT = 1.0; c.hero.parryCd = E.PARRY_CD; ev(c, { k: 'parryOn' }); return true;
  };
  E.setStance = function (s) { var run = S.run; if (!run) return null; run.stance = s || (run.stance === 'a' ? 'd' : run.stance === 'd' ? 'n' : 'a'); return run.stance; };
  E.hitWeak = function (i) {
    var run = S.run, c = run && run.combat; if (!c || c.over || !c.weak) return false;
    var e = c.enemies[i]; if (!e || e.dead || e.id !== c.weak.id) return false;
    c.weak = null; c.weakT = rf(5, 9); S.stats.weak++; ev(c, { k: 'weakhit', id: e.id });
    hit(run, c, e, 2.5 * (1 + run.stats.weakP / 100), { crit: true }); if (!e.dead) e.st.vuln = Math.max(e.st.vuln || 0, 3); ug(run, 12);
    if (c.over) finish(run, c);
    return true;
  };
  E.useUlt = function () {
    var run = S.run, c = run && run.combat; if (!c || c.over || (run.ult || 0) < 100) return false;
    var h = c.hero, st = run.stats, u = E.hero(run.hero).ult, all = alive(c), n, tg;
    run.ult = 0; S.stats.ult++; ev(c, { k: 'ult', name: u.name, sfx: u.sfx });
    switch (run.hero) {
      case 'chevalier': h.invuln = 4; all.forEach(function (x) { hit(run, c, x, 4, { ult: 1 }); }); break;
      case 'pyro': for (n = 0; n < 6; n++) { var al = alive(c); if (!al.length) break; tg = pick(al); hit(run, c, tg, 1.6, { ult: 1 }); } alive(c).forEach(function (x) { applyDot(run, x, 'burn'); }); break;
      case 'assassin': for (n = 0; n < 8; n++) { var al2 = alive(c); if (!al2.length) break; hit(run, c, pick(al2), 0.9, { ult: 1, crit: true }); } break;
      case 'necro': var tot = 0; all.forEach(function (x) { tot += hit(run, c, x, 4, { ult: 1 }); }); heroHeal(run, c, tot * 0.5); h.skel = Math.min(3 + st.skel, h.skel + 2); break;
      case 'berserker': h.buffs.spd = { t: 6, v: 100 }; h.buffs.ls = { t: 6, v: 20 }; h.buffs.undying = { t: 4, v: 1 }; break;
      case 'pretresse': heroHeal(run, c, st.hp, true); h.shield = Math.max(h.shield, st.hp * 0.3); h.shieldT = 8; delete h.st.poison; delete h.st.burn; delete h.st.bleed; all.forEach(function (x) { stun(c, x, 2); }); break;
    }
    if (c.over) finish(run, c);
    return true;
  };
  E.usePotion = function () {
    var run = S.run, c = run && run.combat; if (!run || run.potions <= 0 || run.hp >= run.stats.hp) return false;
    if (c && c.over) return false;
    run.potions--; var h = heal(run, run.stats.hp * 0.35);
    if (c) { ev(c, { k: 'potion' }); ev(c, { k: 'heal', v: h }); }
    return true;
  };
  function autoPlay(run, c) {
    var h = c.hero, hero = E.hero(run.hero), frac = run.hp / run.stats.hp;
    var charging = c.enemies.some(function (e) { return !e.dead && e.charge; });
    if (h.parryCd <= 0 && c.enemies.some(function (e) { return !e.dead && e.charge && e.charge.t < 0.6; })) E.parry();
    if ((run.ult || 0) >= 100 && (frac < 0.6 || alive(c).length > 1 || c.boss || c.t > 4)) { if (E.useUlt()) return; }
    for (var i = 0; i < 3; i++) {
      if (h.cds[i] > 0 || !E.skillUnlocked(run.hero, i)) continue;
      var id = hero.skills[i].id;
      if (id === 'k1' && !charging && c.enemies.some(function (e) { return !e.dead && e.ab.charge && e.chargeCd < 3; })) continue; // garde le bouclier pour interrompre
      if (id === 'k1' && charging) { var ce = c.enemies.filter(function (e) { return !e.dead && e.charge; })[0]; c.target = c.enemies.indexOf(ce); }
      if ((id === 's2' || id === 'k3') && frac > 0.7) continue;
      if (id === 'b2' && frac < 0.25) continue;
      if (id === 'a3') { var t = target(c); if (t && t.hp / t.maxhp > 0.35 && !t.boss && alive(c).length > 1) continue; }
      if (E.useSkill(i)) return;
    }
    if (frac < 0.35 && run.potions > 0) E.usePotion();
  }
  E.tick = function (dt) {
    var run = S.run, c = run && run.combat; if (!c || c.over) return;
    var st = run.stats, h = c.hero, i, e;
    c.t += dt; run.t += dt;
    if (c.cond === 'brume') { run.hp = Math.max(1, run.hp - st.hp * 0.01 * dt); c.enemies.forEach(function (x) { if (!x.dead) x.hp = Math.max(1, x.hp - x.maxhp * 0.02 * dt); }); }
    if (c.cond === 'beni') heal(run, st.hp * 0.02 * dt);
    if (c.nextWave > 0) {
      c.nextWave -= dt;
      if (c.nextWave <= 0) { c.nextWave = 0; ev(c, { k: 'wave', n: run.room.wave, of: run.room.waves }); enemyGroup(run, 'wave').forEach(function (k) { var m = mkEnemy(run, k, 0.9); m.id = c.nextId++; c.enemies.push(m); ev(c, { k: 'summon', id: m.id, quiet: 1 }); }); }
    }
    // héros : effets
    if (st.regen) heal(run, st.hp * st.regen / 100 * dt);
    for (var bk in h.buffs) { h.buffs[bk].t -= dt; if (h.buffs[bk].t <= 0) delete h.buffs[bk]; }
    if (h.shieldT > 0 && h.shieldT < 900) { h.shieldT -= dt; if (h.shieldT <= 0) h.shield = 0; }
    ['poison', 'burn', 'bleed'].forEach(function (k) {
      var s = h.st[k]; if (!s) return; s.t -= dt; s.acc = (s.acc || 0) + s.dps * dt;
      if (s.acc >= 1 && (s.tick = (s.tick || 0) + dt) >= 0.5) { hurt(run, c, null, s.acc, { dot: k }); s.acc = 0; s.tick = 0; }
      if (s.t <= 0) delete h.st[k];
    });
    if (h.st.weak > 0) h.st.weak -= dt;
    if (c.over) return finish(run, c);
    for (i = 0; i < 3; i++) if (h.cds[i] > 0) h.cds[i] -= dt * (c.cond === 'silence' ? 0.5 : 1);
    if (h.parryT > 0) h.parryT -= dt; if (h.parryCd > 0) h.parryCd -= dt; if (h.invuln > 0) h.invuln -= dt;
    if (c.weak) { c.weak.t -= dt; var we = null; c.enemies.forEach(function (x) { if (x.id === c.weak.id) we = x; }); if (c.weak.t <= 0 || !we || we.dead) { c.weak = null; c.weakT = rf(5, 9); } }
    else { c.weakT -= dt * (c.cond === 'tenebres' ? 2 : 1); if (c.weakT <= 0) { var al0 = alive(c); if (al0.length) { c.weak = { id: pick(al0).id, t: 2.6 }; ev(c, { k: 'weak', id: c.weak.id }); } } }
    if (S.settings.auto) autoPlay(run, c);
    if (c.over) return finish(run, c);
    // héros : attaque
    var spd = (c.cond === 'hate' ? 1.3 : 1) * st.spd * (1 + (h.buffs.spd ? h.buffs.spd.v : 0) / 100) * (1 + st.frenzy * h.frenzy / 100);
    h.atkT -= dt * spd;
    var guard = 0;
    while (h.atkT <= 0 && !c.over && guard++ < 5) { h.atkT += 1; heroAttack(run, c); }
    if (h.skel > 0 && !c.over) {
      h.skelT -= dt * (h.buffs.skelF ? 3 : 1);
      if (h.skelT <= 0) { h.skelT += 1; var te = target(c); if (te) { hit(run, c, te, 0.35 * h.skel * (1 + st.skelP / 100), { noCrit: true, dot: 'skel' }); ev(c, { k: 'skel' }); } }
    }
    if (run.ally && !c.over) { h.allyT = (h.allyT == null ? 1 : h.allyT) - dt; if (h.allyT <= 0) { h.allyT += 1.3; allyAct(run, c); } }
    // ennemis
    for (i = 0; i < c.enemies.length && !c.over; i++) {
      e = c.enemies[i]; if (e.dead) continue;
      if (e.flee > 0) { e.flee -= dt; if (e.flee <= 0) { e.flee = 0; e.dead = true; e.fled = true; e.hp = 0; ev(c, { k: 'flee', id: e.id }); if (!alive(c).length) endOrWave(run, c); continue; } }
      ['burn', 'poison', 'bleed'].forEach(function (k) {
        var s = e.st[k]; if (!s || e.dead) return; s.t -= dt; s.acc = (s.acc || 0) + s.dps * dt; s.tick = (s.tick || 0) + dt;
        if (s.tick >= 0.5) { hit(run, c, e, 0, { flat: s.acc, dot: k, noCrit: true }); s.acc = 0; s.tick = 0; }
        if (s.t <= 0) delete e.st[k];
      });
      if (e.dead) continue;
      if (e.st.weak > 0) e.st.weak -= dt; if (e.st.vuln > 0) e.st.vuln -= dt;
      if (e.st.stun > 0) { e.st.stun -= dt; continue; }
      var sp = (e.enraged ? 1.4 : 1) * (c.cond === 'hate' ? 1.3 : 1);
      var limit = c.boss ? 70 : 40, fury = c.t > limit ? 1 + (c.t - limit) * 0.05 : 1;
      if (fury > 1 && !c.fury) { c.fury = true; ev(c, { k: 'fury' }); }
      if (e.ab.heal) { e.healT -= dt; if (e.healT <= 0) { e.healT = 6; var low = alive(c).sort(function (a, b) { return a.hp / a.maxhp - b.hp / b.maxhp; })[0]; if (low && low.hp < low.maxhp) { low.hp = Math.min(low.maxhp, low.hp + low.maxhp * e.ab.heal / 100); ev(c, { k: 'eheal', id: low.id }); } } }
      if (e.ab.shield) { e.shieldT -= dt; if (e.shieldT <= 0) { e.shieldT = 10; e.shield = e.maxhp * e.ab.shield / 100; ev(c, { k: 'eshield', id: e.id }); } }
      if (e.ab.summon) { e.summonT -= dt; if (e.summonT <= 0) { e.summonT = 13; if (alive(c).length < 3) { var m = mkEnemy(run, e.ab.summon, 0.55); m.id = c.nextId++; m.summoned = true; c.enemies.push(m); ev(c, { k: 'summon', id: m.id }); } } }
      if (e.charge) {
        e.charge.t -= dt;
        if (e.charge.t <= 0) { e.charge = null; e.chargeCd = e.ab.charge; ev(c, { k: 'eatk', id: e.id, big: 1 }); hurt(run, c, e, e.atk * 2.6 * fury * (e.enraged ? 1.25 : 1), { big: 1 }); e.t = e.int; }
        continue;
      }
      if (e.ab.charge) { e.chargeCd -= dt; if (e.chargeCd <= 0) { var ct = e.boss ? 2.4 : 2.0; e.charge = { t: ct, total: ct }; ev(c, { k: 'charge', id: e.id }); continue; } }
      e.t -= dt * sp;
      if (e.t <= 0) { e.t += e.int; ev(c, { k: 'eatk', id: e.id }); hurt(run, c, e, e.atk * fury * (e.enraged ? 1.25 : 1), {}); }
    }
    if (c.over) finish(run, c);
  };
  // Le mercenaire agit toutes les 1,3 s
  function allyAct(run, c) {
    var st = run.stats, h = c.hero, e = target(c); if (!e) return;
    ev(c, { k: 'ally' });
    switch (run.ally) {
      case 'chevalier': hit(run, c, e, 0.5, { noCrit: true, dot: 'ally' }); h.shield = Math.min(st.hp * 0.2, h.shield + st.hp * 0.025); h.shieldT = Math.max(h.shieldT, 4); break;
      case 'pyro': alive(c).forEach(function (x) { hit(run, c, x, 0.3, { noCrit: true, dot: 'ally' }); if (!x.dead) applyDot(run, x, 'burn'); }); break;
      case 'assassin': hit(run, c, e, rnd() < 0.4 ? 1.7 : 0.85, { noCrit: true, dot: 'ally' }); break;
      case 'necro': var d = hit(run, c, e, 0.45, { noCrit: true, dot: 'ally' }); heroHeal(run, c, Math.min(d, st.hp * 0.015)); break;
      case 'berserker': hit(run, c, e, 0.8, { noCrit: true, dot: 'ally' }); break;
      case 'pretresse': hit(run, c, e, 0.25, { noCrit: true, dot: 'ally' }); heroHeal(run, c, st.hp * 0.018); break;
    }
  }
  function finish(run, c) {
    if (c.done) return; c.done = true;
    if (!c.win) { ev(c, { k: 'dead' }); run.phase = 'dead'; return; }
    var r = run.room, res = { items: c.drops, gold: c.gold, cendres: c.cendres, xp: c.xp, type: r.type };
    run.gold += c.gold; run.cendres += c.cendres; S.cendres += c.cendres;
    if (c.cond === 'defi') { res.defi = c.t <= 20; if (res.defi) { res.items.push(dropItem(run, 'chest', 2)); run.gold += 40; res.gold += 40; } }
    if (r.type === 'arene') { res.artifact = giveArtifact(run); run.pendingBoons++; res.items.push(dropItem(run, 'chest', 2)); res.arene = true; S.stats.arenes++; }
    if (r.variant) res.variant = r.variant;
    if (r.type === 'elite' || r.forceElite) { res.artifact = giveArtifact(run); }
    if (r.wasMimic) { res.items.push(dropItem(run, 'chest', 2)); S.stats.chests++; }
    if (r.type === 'boss') {
      var zn = E.zoneNum(run.floor), zi = ((zn - 1) % 6) + 1;
      S.stats['boss' + zi]++; S.stats.bosses++; run.bosses++;
      if (zn > S.stats.bossMax) { S.stats.bossMax = zn; res.firstKill = true; }
      res.artifact = giveArtifact(run); run.potions = Math.min(run.potionsMax, run.potions + 1);
      heal(run, run.stats.hp * 0.3, true); res.boss = true; if (zn === 6 && res.firstKill) res.ending = true; if (run.ally) { res.allyLeft = run.ally; run.ally = null; }
    }
    heal(run, run.stats.hp * 0.08, true);
    res.lvlUps = gainXp(run, c.xp);
    run.result = res; run.phase = 'victory';
    ev(c, { k: 'win', boss: r.type === 'boss' });
    E.checkAch(); E.save();
  }
  // Fin de descente (mort ou abandon). Renvoie le résumé.
  E.endRun = function (abandon) {
    var run = S.run; if (!run) return null;
    var hs = S.heroes[run.hero], h = E.hero(run.hero);
    var reached = run.floor, bestBefore = run.bestBefore;
    if (!abandon) S.stats.deaths++;
    if (run.phase !== 'dead' && run.floor > S.stats.best) S.stats.best = run.floor;
    if ((run.maxHit || 0) > (S.stats.maxHit || 0)) S.stats.maxHit = run.maxHit;
    var mxp = Math.round(run.rooms * 8 + run.bosses * 40 + run.kills), ups = 0;
    hs.xp += mxp;
    while (hs.xp >= E.masteryNeed(hs.lvl)) { hs.xp -= E.masteryNeed(hs.lvl); hs.lvl++; ups++; }
    var bonus = Math.ceil(run.cendres * 0.25 + 5 * (run.rooms));
    S.cendres += bonus;
    var sum = { hero: run.hero, floor: reached, rooms: run.rooms, kills: run.kills, cendres: run.cendres + bonus, bonus: bonus, loot: run.loot, lvl: run.lvl, mxp: mxp, heroLvl: hs.lvl, heroUps: ups, abandon: !!abandon, time: run.t, bosses: run.bosses, dmg: run.dmg || 0, maxHit: run.maxHit || 0, record: reached >= S.stats.best && reached > (S.stats.prevBest || 0) };
    S.stats.prevBest = Math.max(S.stats.prevBest || 0, S.stats.best);
    S.run = null; E.checkAch(); E.save();
    return sum;
  };

  E.GROW = GROW; E.INV_MAX = INV_MAX; E.D = D; E.byId = byId;
  root.ENGINE = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
