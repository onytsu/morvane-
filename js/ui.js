/* MORVANE — interface : outils communs + sanctuaire */
var UI = (function () {
  'use strict';
  var E = ENGINE, D = DATA;
  var st = { tab: 'hero', view: null, filter: 'all', zone: null, screen: 'splash' };
  var ACT = {};
  function $(s) { return document.querySelector(s); }
  function S() { return E.S; }
  function spr(id, cls) {
    if (typeof Sprites === 'undefined') return '<span class="emo">👤</span>';
    return '<img class="px ' + (cls || '') + '" src="' + Sprites.url(id) + '" alt="" draggable="false">';
  }
  function fmtMod(k, v) {
    var m = D.MODS[k]; if (!m || !v) return null;
    var a = Math.abs(v), num;
    if (m.fmt === 'flat') num = (a < 20 && Math.round(a * 10) % 10 ? a.toFixed(1) : E.fmt(a));
    else num = (Math.round(a * 10) % 10 ? a.toFixed(1) : Math.round(a)) + ' %';
    return [k === 'cdr' ? 'Vitesse de recharge' : m.n, (v >= 0 ? '+' : '−') + num];
  }
  function modLines(mods, cls) {
    var h = ''; for (var k in mods) { var f = fmtMod(k, mods[k]); if (f) h += '<div class="modline ' + (cls || '') + '"><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; }
    return h;
  }
  function toast(msg, long) {
    var t = document.createElement('div'); t.className = 'toast' + (long ? ' long' : ''); t.innerHTML = msg; $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').removeChild($('#toasts').firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, long ? 6000 : 3200);
  }
  function flash(color) { var f = $('#flash'); f.style.background = color; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  function modal(html, centered) { var m = $('#modal'); m.innerHTML = '<div class="sheet' + (centered ? ' mid' : '') + '">' + html + '</div>'; m.className = 'on' + (centered ? ' centered' : ''); }
  function closeModal() { var m = $('#modal'); m.className = ''; m.innerHTML = ''; }
  function overlay(html) { var o = $('#overlay'); if (html == null) { o.className = ''; o.innerHTML = ''; return; } o.innerHTML = '<div class="sheet">' + html + '</div>'; o.className = 'on'; }
  function flushAch() {
    var q = E.newAch || []; E.newAch = [];
    q.forEach(function (a) {
      if (a.hero) { toast('🔓 Nouveau héros : <b>' + a.hero.name + '</b>, ' + a.hero.title, true); SND.play('levelup'); }
      else {
        var p = a.pact ? E.byId(D.PACTS, a.pact) : null;
        toast('🏆 <b>' + a.name + '</b> — +' + E.fmt(a.cendres) + ' 🔥' + (p ? '<br>Pacte débloqué : ' + p.icon + ' ' + p.name : ''), true);
      }
    });
  }
  function setHtml(id, n) {
    var s = E.byId(D.SETS, id); if (!s) return '';
    var h = '<div class="setbox"><b>' + s.icon + ' ' + s.name + '</b> <span class="tiny">' + n + '/6 portés</span>';
    [2, 4, 6].forEach(function (t) { var parts = []; for (var k in s.bonus[t]) { var f = fmtMod(k, s.bonus[t][k]); if (f) parts.push(f[1] + ' ' + f[0]); } h += '<div class="sb' + (n >= t ? ' on' : '') + '"><i>' + t + '</i><span>' + parts.join(' · ') + '</span></div>'; });
    return h + '<div class="tiny dim">Set de la zone : ' + D.ZONES[s.zone - 1].name + '</div></div>';
  }
  // Choix du présage avant de descendre
  function askOmen(heroId, zone) {
    var offer = E.omenOffer();
    var h = '<h2>🔮 Choisis un présage</h2><div class="tiny dim center" style="margin:-6px 0 10px">Il change les règles de cette descente.</div>';
    offer.forEach(function (id, i) { var o = E.byId(D.OMENS, id); h += '<button class="choice b2" style="animation-delay:' + (i * 0.07) + 's" data-act="omen" data-id="' + id + '" data-h="' + heroId + '" data-z="' + zone + '"><div class="ic">' + o.icon + '</div><div class="grow"><b>' + o.name + '</b><div class="d">' + o.desc + '</div></div></button>'; });
    h += '<div class="btns"><button class="btn" data-act="omen" data-id="" data-h="' + heroId + '" data-z="' + zone + '">Descendre sans présage</button></div>';
    modal(h);
  }
  ACT.omen = function (d) { closeModal(); SND.play('door'); S().hero = d.h; E.startRun(d.h, +d.z || 1, d.id || null); UI.run.show(); };
  function itemTile(it, extra) {
    var b = E.itemBase(it), eq = E.equippedBy(it.uid);
    return '<button class="item r' + it.rar + '" data-act="item" data-uid="' + it.uid + '">' + b.icon +
      '<span class="lv">' + it.ilvl + '</span>' + (it.up ? '<span class="up">+' + it.up + '</span>' : '') +
      (eq ? '<span class="eq">' + (eq === S().hero ? '✅' : '👤') + '</span>' : '') + (it.isNew ? '<span class="nw"></span>' : '') + (it.set ? '<span class="sm">◆</span>' : '') + (it.lock ? '<span class="eq" style="right:auto;left:2px;bottom:auto;top:1px">🔒</span>' : '') + (extra || '') + '</button>';
  }

  // ---------- accueil ----------
  function splash() {
    st.screen = 'splash';
    $('#screen').innerHTML = '<div class="splash">' + spr('logo') + '<h1>MORVANE</h1><div class="dim" style="font-family:var(--serif);letter-spacing:.2em">LES CENDRES DU ROI CREUX</div>' +
      '<button class="btn primary big" data-act="enter" style="max-width:300px;margin-top:18px">' + (S().stats.runs ? 'CONTINUER' : 'COMMENCER') + '</button>' +
      '<div class="tiny dim" style="margin-top:10px">Sauvegarde automatique · jouable hors-ligne</div></div>';
  }
  ACT.enter = function () {
    SND.unlock(); SND.play('door');
    if (!S().stats.runs && !S().run) {
      modal('<h2>La descente</h2><p class="center">Le Roi Creux a éteint le monde. Six royaumes pourrissent sous la terre de Morvane.</p><p class="center">Descends. Meurs. <b>Garde ton butin.</b> Reviens plus fort.</p><p class="center dim small">Ton héros attaque tout seul.<br>Toi, tu déclenches ses <b>pouvoirs</b> au bon moment.</p><div class="btns"><button class="btn primary big" data-act="firstRun">DESCENDRE</button></div>', true);
      return;
    }
    if (S().run) { UI.run.show(); return; }
    hub();
  };
  ACT.firstRun = function () { closeModal(); E.startRun('chevalier', 1); UI.run.show(); };

  // ---------- sanctuaire ----------
  function hub(tab) {
    if (tab) st.tab = tab; st.screen = 'hub';
    if (!st.view || !E.hero(st.view)) st.view = S().hero;
    overlay(null);
    SND.music('hub');
    var idle = E.idleInfo(), newItems = S().inv.some(function (i) { return i.isNew; });
    var metaOk = D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; });
    var tabs = [['hero', '🏰', 'Héros', idle.full], ['sac', '🎒', 'Sac', newItems], ['autel', '⚱️', 'Autel', metaOk], ['pactes', '📜', 'Pactes', pactFree()], ['faits', '🏆', 'Hauts faits', false]];
    var body = { hero: tabHero, sac: tabSac, autel: tabAutel, pactes: tabPactes, faits: tabFaits }[st.tab]();
    $('#screen').innerHTML = '<div class="topbar"><span class="title grow">MORVANE</span><span class="cur ash">🔥 ' + E.fmt(S().cendres) + '</span><span class="cur ess">💠 ' + E.fmt(S().essence) + '</span><button class="icon-btn" data-act="settings">⚙️</button></div>' +
      '<div class="content" id="content">' + body + '</div><div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (st.tab === t[0] ? ' on' : '') + '" data-act="tab" data-tab="' + t[0] + '"><span class="ti">' + t[1] + '</span>' + t[2] + (t[3] ? '<i class="dot"></i>' : '') + '</button>'; }).join('') + '</div>';
    flushAch();
  }
  function pactFree() { var hs = S().heroes[S().hero]; return S().pacts.length > hs.pacts.length && hs.pacts.length < E.pactSlots(S().hero); }
  function keepScroll(fn) { var c = $('#content'), y = c ? c.scrollTop : 0; fn(); c = $('#content'); if (c) c.scrollTop = y; }
  ACT.tab = function (d) { SND.play('click'); hub(d.tab); };

  function tabHero() {
    var h = E.hero(st.view), un = E.heroUnlocked(h.id), hs = S().heroes[h.id], html = '';
    html += '<div class="roster">' + D.HEROES.map(function (x) { var u = E.heroUnlocked(x.id); return '<button class="rh' + (x.id === h.id ? ' on' : '') + (u ? '' : ' lk') + '" data-act="heroPick" data-id="' + x.id + '">' + spr(x.id) + (u ? '' : '<span>🔒</span>') + '</button>'; }).join('') + '</div>';
    html += '<div class="hero-stage"><div class="floorglow"></div><div class="name"><b>' + h.name + '</b><div class="small gold">' + h.title + '</div></div>' + spr(h.id, 'spr');
    html += '<button class="nav l" data-act="heroNav" data-d="-1">‹</button><button class="nav r" data-act="heroNav" data-d="1">›</button>';
    if (un) {
      html += '<div class="mast">Maîtrise <b class="gold">' + hs.lvl + '</b><div class="bar" style="width:90px"><i style="width:' + Math.min(100, hs.xp / E.masteryNeed(hs.lvl) * 100) + '%"></i></div></div><div class="pwr">⚡ ' + E.fmt(E.power(h.id)) + '</div>';
    } else {
      var how = h.unlock.cost ? '<button class="btn goldb' + (S().cendres >= h.unlock.cost ? '' : ' off') + '" data-act="unlock" data-id="' + h.id + '">Recruter — 🔥 ' + E.fmt(h.unlock.cost) + '</button>' : '<div class="gold">Vaincs ' + D.ENEMIES[D.ZONES[h.unlock.boss - 1].boss].name + '<br><span class="dim small">(boss de la zone ' + h.unlock.boss + ')</span></div>';
      html += '<div class="lock"><div style="font-size:30px">🔒</div><b>' + h.name + ' — ' + h.role + '</b>' + how + '</div>';
    }
    html += '</div>';
    if (un) {
      var s = E.heroStats(h.id, null);
      html += '<button class="stats" data-act="allStats" style="width:100%"><div class="stat"><b>' + E.fmt(s.hp) + '</b><span>PV</span></div><div class="stat"><b>' + E.fmt(s.atk) + '</b><span>Attaque</span></div><div class="stat"><b>' + E.fmt(s.def) + '</b><span>Armure</span></div><div class="stat"><b>' + s.spd.toFixed(2) + '</b><span>Coups/s</span></div><div class="stat"><b>' + Math.round(s.crit) + '%</b><span>Critique</span></div></button>';
      html += '<div class="equip">' + D.SLOTS.map(function (sl) {
        var it = hs.equip[sl.id] ? E.findItem(hs.equip[sl.id]) : null;
        return it ? itemTile(it) : '<button class="slot empty" data-act="slotEmpty" data-slot="' + sl.id + '">' + sl.icon + '</button>';
      }).join('') + '</div>';
      var idle = E.idleInfo();
      if (S().run) html += '<button class="btn primary big" data-act="resume">REPRENDRE — étage ' + S().run.floor + '</button>';
      else {
        var mz = E.maxStartZone(); if (st.zone == null || st.zone > mz) st.zone = mz;
        if (mz > 1) html += '<div class="zone-pick"><button class="icon-btn" data-act="zone" data-d="-1">‹</button><div class="zn"><b>' + E.zoneLabel(st.zone) + '</b><div class="tiny dim">Départ étage ' + ((st.zone - 1) * 10 + 1) + (st.zone > 1 ? ' · ' + ((st.zone - 1) * 3) + ' aubaines offertes' : '') + '</div></div><button class="icon-btn" data-act="zone" data-d="1">›</button></div>';
        html += '<button class="btn primary big" data-act="descend">⚔️ DESCENDRE</button>';
      }
      html += '<div class="tiny dim center" style="margin:6px 0 10px">Record : étage ' + S().stats.best + '</div>';
      var scn = E.setCounts(h.id), sk = Object.keys(scn); if (sk.length) html += '<div class="card"><b>Sets portés</b>' + sk.map(function (id) { return setHtml(id, scn[id]); }).join('') + '</div>';
      if (S().stats.best > 0) html += '<div class="card idle"><div style="font-size:26px">⚱️</div><div class="grow"><b>Ossuaire</b><div class="small dim">Les morts travaillent pour toi : ' + E.fmt(idle.rate) + ' 🔥/h (réserve ' + idle.cap + ' h)</div><div class="bar" style="margin-top:4px"><i style="width:' + (idle.hours / idle.cap * 100) + '%;background:var(--ash)"></i></div></div><button class="btn goldb sm' + (idle.amount > 0 ? '' : ' off') + '" data-act="idle">+' + E.fmt(idle.amount) + ' 🔥</button></div>';
      html += '<div class="card"><div class="small gold">' + h.role + '</div><div class="small dim" style="margin-bottom:6px">' + h.desc + '</div><div class="skills-list"><div class="sk"><div class="ic">🌟</div><div><b>' + h.passive.name + '</b> <span class="tiny dim">passif</span><div class="small dim">' + h.passive.desc + '</div></div></div>' +
        '<div class="sk"><div class="ic">' + h.ult.icon + '</div><div><b>' + h.ult.name + '</b> <span class="tiny gold">ultime</span><div class="small dim">' + h.ult.desc + '</div></div></div>' +
        h.skills.map(function (k, i) { var ok = E.skillUnlocked(h.id, i); return '<div class="sk' + (ok ? '' : ' locked') + '"><div class="ic">' + (ok ? k.icon : '🔒') + '</div><div><b>' + k.name + '</b> <span class="tiny dim">' + (ok ? k.cd + ' s' : 'Maîtrise ' + (i + 1)) + '</span><div class="small dim">' + k.desc + '</div></div></div>'; }).join('') + '</div></div>';
    } else html += '<div class="card"><div class="small gold">' + h.role + '</div><div class="small dim">' + h.desc + '</div><div class="small" style="margin-top:6px">🌟 <b>' + h.passive.name + '</b> — ' + h.passive.desc + '</div></div>';
    return html;
  }
  ACT.heroPick = function (d) {
    st.view = d.id; if (E.heroUnlocked(d.id) && !S().run) { S().hero = d.id; E.save(); }
    SND.play('click'); hub();
  };
  ACT.heroNav = function (d) {
    var i = D.HEROES.indexOf(E.hero(st.view)); i = (i + (+d.d) + D.HEROES.length) % D.HEROES.length; st.view = D.HEROES[i].id;
    if (E.heroUnlocked(st.view) && !S().run) { S().hero = st.view; E.save(); }
    SND.play('click'); hub();
  };
  ACT.unlock = function (d) { if (E.unlockHero(d.id)) { SND.play('levelup'); flash('#d9a441'); if (!S().run) S().hero = d.id; E.save(); hub(); } else SND.play('error'); };
  ACT.zone = function (d) { st.zone = Math.max(1, Math.min(E.maxStartZone(), st.zone + (+d.d))); SND.play('click'); keepScroll(hub); };
  ACT.idle = function () { var a = E.collectIdle(); if (a > 0) { SND.play('gold'); toast('+' + E.fmt(a) + ' 🔥 Cendres récoltées'); E.save(); keepScroll(hub); } };
  ACT.descend = function () {
    if (!E.heroUnlocked(st.view)) return; S().hero = st.view;
    askOmen(st.view, st.zone || 1);
  };
  ACT.resume = function () { UI.run.show(); };
  ACT.slotEmpty = function (d) { st.filter = d.slot; hub('sac'); };
  ACT.allStats = function () {
    var s = E.heroStats(st.view, S().run && S().run.hero === st.view ? S().run : null), h = '';
    h += '<div class="modline"><span>PV</span><b>' + E.fmt(s.hp) + '</b></div><div class="modline"><span>Attaque</span><b>' + E.fmt(s.atk) + '</b></div><div class="modline"><span>Armure</span><b>' + E.fmt(s.def) + '</b></div><div class="modline"><span>Coups par seconde</span><b>' + s.spd.toFixed(2) + '</b></div><div class="modline"><span>Chance de critique</span><b>' + Math.round(s.crit) + ' %</b></div><div class="modline"><span>Dégâts critiques</span><b>' + Math.round(s.critd) + ' %</b></div>';
    var skip = { hp: 1, atk: 1, def: 1, spd: 1, crit: 1, critd: 1 }, o = {};
    for (var k in s) if (!skip[k] && s[k] && D.MODS[k]) o[k] = s[k];
    modal('<h2>Statistiques</h2>' + h + modLines(o) + '<div class="btns"><button class="btn" data-act="close">Fermer</button></div>');
  };

  // ---------- sac ----------
  function tabSac() {
    var inv = S().inv.slice(), hs = S().heroes[S().hero];
    var f = st.filter;
    if (f === 'set') inv = inv.filter(function (i) { return !!i.set; });
    else if (f !== 'all') inv = inv.filter(function (i) { return E.itemBase(i).slot === f; });
    inv.sort(function (a, b) { return (b.rar - a.rar) || (E.itemScore(b) - E.itemScore(a)); });
    var h = '<div class="filters"><button class="chip' + (f === 'all' ? ' on' : '') + '" data-act="filter" data-f="all">Tout (' + S().inv.length + '/' + E.INV_MAX + ')</button><button class="chip' + (f === 'set' ? ' on' : '') + '" data-act="filter" data-f="set" style="color:#6dffb0">◆ Sets</button>' + D.SLOTS.map(function (s) { return '<button class="chip' + (f === s.id ? ' on' : '') + '" data-act="filter" data-f="' + s.id + '">' + s.icon + ' ' + s.name + '</button>'; }).join('') + '</div>';
    h += '<div class="row" style="margin-bottom:10px"><button class="btn sm goldb grow" data-act="equipBest">⚡ Équiper le meilleur</button><button class="btn sm grow" data-act="salvageMenu">♻️ Recycler...</button></div>';
    if (!inv.length) h += '<div class="center dim" style="padding:30px">Rien ici. Descends en chercher.</div>';
    h += '<div class="inv-grid">' + inv.map(function (it) {
      var cur = hs.equip[E.itemBase(it).slot], curIt = cur ? E.findItem(cur) : null;
      var better = cur !== it.uid && !E.equippedBy(it.uid) && (!curIt || E.itemScore(it) > E.itemScore(curIt) * 1.02);
      return itemTile(it, better ? '<span class="arrow" style="left:auto;right:3px;top:' + (it.up ? '11' : '0') + 'px">▲</span>' : '');
    }).join('') + '</div>';
    h += '<div class="tiny dim center" style="margin-top:12px">Couleurs : <span class="c0">Normal</span> · <span class="c1">Commun</span> · <span class="c2">Rare</span> · <span class="c3">Épique</span> · <span class="c4">Légendaire</span> · <span class="c5">Unique</span></div>';
    return h;
  }
  ACT.filter = function (d) { st.filter = d.f; SND.play('click'); hub(); };
  ACT.equipBest = function () { var n = E.equipBest(S().hero); S().inv.forEach(function (i) { i.isNew = false; }); if (n) { SND.play('equip'); toast('⚡ ' + n + ' objet' + (n > 1 ? 's' : '') + ' équipé' + (n > 1 ? 's' : '')); } else toast('Tu portes déjà le meilleur.'); E.save(); keepScroll(hub); };
  ACT.salvageMenu = function () {
    var a = S().settings.autoSalvage, h = '<h2>Recycler</h2><p class="small dim center">Recycler détruit des objets et donne de l’<span class="ess">💠 Essence</span> pour améliorer les autres. Les objets équipés ou verrouillés 🔒 sont protégés.</p>';
    [0, 1, 2, 3].forEach(function (r) {
      var n = S().inv.filter(function (i) { return i.rar <= r && !i.lock && !E.equippedBy(i.uid); }).length;
      h += '<button class="btn wide" style="margin-bottom:6px" data-act="salvageBelow" data-r="' + r + '">Tout jusqu’à <b class="c' + r + '">&nbsp;' + D.RARITIES[r].name + '</b>&nbsp;(' + n + ')</button>';
    });
    h += '<h3 style="margin-top:10px">Recyclage automatique du butin</h3><div class="filters" style="margin-top:6px">' + [-1, 0, 1, 2].map(function (r) { return '<button class="chip' + (a === r ? ' on' : '') + '" data-act="autoSalv" data-r="' + r + '">' + (r < 0 ? 'Jamais' : '≤ ' + D.RARITIES[r].name) + '</button>'; }).join('') + '</div><div class="btns"><button class="btn" data-act="close">Fermer</button></div>';
    modal(h);
  };
  ACT.salvageBelow = function (d) { var r = E.salvageBelow(+d.r); if (r.n) { SND.play('salvage'); toast('♻️ ' + r.n + ' objets → +' + E.fmt(r.essence) + ' 💠'); } E.save(); closeModal(); refresh(); };
  ACT.autoSalv = function (d) { S().settings.autoSalvage = +d.r; E.save(); ACT.salvageMenu(); };

  function itemSheet(it, ctx) {
    var b = E.itemBase(it), p = E.itemParts(it), rar = D.RARITIES[it.rar], uq = it.uq ? E.byId(D.UNIQUES, it.uq) : null;
    var slot = E.byId(D.SLOTS, b.slot), eqBy = E.equippedBy(it.uid), hs = S().heroes[S().hero];
    var h = '<div class="item-head"><div class="item r' + it.rar + '">' + b.icon + '</div><div class="grow"><h3 class="c' + it.rar + '" style="font-size:17px">' + E.itemName(it) + '</h3><div class="small"><b class="c' + it.rar + '">' + rar.name + '</b> · ' + slot.name + ' · niveau ' + it.ilvl + (it.up ? ' · <span class="gold">+' + it.up + '</span>' : '') + '</div>' + (eqBy ? '<div class="tiny good">Équipé par ' + E.hero(eqBy).name + '</div>' : '') + '</div></div>';
    h += '<div class="' + (uq ? 'uq' : '') + '">' + modLines(p.base) + (Object.keys(p.aff).length ? '<div style="border-top:1px solid #ffffff12;margin:4px 0"></div>' + modLines(p.aff) : '') + modLines(p.pw, 'pw') + '</div>';
    if (uq) h += '<div class="lore">« ' + uq.lore + ' »</div>';
    if (it.set) h += setHtml(it.set, E.setCounts(S().hero)[it.set] || 0);
    var cur = hs.equip[b.slot], curIt = cur && cur !== it.uid ? E.findItem(cur) : null;
    if (curIt) { var diff = Math.round((E.itemScore(it) / E.itemScore(curIt) - 1) * 100); h += '<div class="small" style="margin-top:6px">Comparé à <b class="c' + curIt.rar + '">' + E.itemName(curIt) + '</b> : <b class="' + (diff >= 0 ? 'good' : 'bad') + '">' + (diff >= 0 ? '▲ +' : '▼ ') + diff + ' %</b></div>'; }
    if (ctx === 'view') return h + '<div class="btns"><button class="btn" data-act="close">Fermer</button></div>';
    var uc = it.up < 10 ? E.upgradeCost(it) : null, tc = E.temperCost(it);
    h += '<div class="btns">';
    h += eqBy === S().hero ? '<button class="btn" data-act="unequip" data-slot="' + b.slot + '">Retirer</button>' : '<button class="btn primary" data-act="equip" data-uid="' + it.uid + '">Équiper</button>';
    h += '<button class="btn" data-act="lock" data-uid="' + it.uid + '">' + (it.lock ? '🔓 Déverrouiller' : '🔒 Verrouiller') + '</button></div><div class="btns">';
    if (uc) h += '<button class="btn goldb' + (S().essence >= uc.essence && S().cendres >= uc.cendres ? '' : ' off') + '" data-act="upgrade" data-uid="' + it.uid + '">⚒️ Améliorer +' + (it.up + 1) + '<br><span class="tiny">💠 ' + E.fmt(uc.essence) + ' · 🔥 ' + E.fmt(uc.cendres) + '</span></button>';
    else h += '<button class="btn off">Amélioration max</button>';
    if (tc) h += '<button class="btn' + (S().essence >= tc.essence ? '' : ' off') + '" data-act="temper" data-uid="' + it.uid + '">🔥 Retremper niv. ' + tc.target + '<br><span class="tiny">💠 ' + E.fmt(tc.essence) + '</span></button>';
    h += '</div><div class="btns">';
    if (!eqBy && !it.lock) h += '<button class="btn" data-act="salvage" data-uid="' + it.uid + '">♻️ Recycler (+' + E.fmt(E.salvageValue(it)) + ' 💠)</button>';
    h += '<button class="btn" data-act="close">Fermer</button></div>';
    return h;
  }
  function refresh() { if (st.screen === 'hub') keepScroll(hub); else if (UI.run) UI.run.refresh(); }
  ACT.item = function (d) { var it = E.findItem(+d.uid); if (!it) return; it.isNew = false; SND.play('click'); modal(itemSheet(it, S().run && st.screen === 'run' ? 'run' : 'hub')); };
  ACT.equip = function (d) { E.equip(+d.uid, S().hero); SND.play('equip'); E.save(); closeModal(); refresh(); };
  ACT.unequip = function (d) { E.unequip(d.slot, S().hero); SND.play('click'); E.save(); closeModal(); refresh(); };
  ACT.lock = function (d) { var it = E.findItem(+d.uid); it.lock = !it.lock; E.save(); modal(itemSheet(it)); refresh(); };
  ACT.upgrade = function (d) { if (E.upgrade(+d.uid)) { SND.play('upgrade'); flash('#d9a44155'); E.save(); modal(itemSheet(E.findItem(+d.uid))); refresh(); flushAch(); } else SND.play('error'); };
  ACT.temper = function (d) { if (E.temper(+d.uid)) { SND.play('upgrade'); flash('#ff8a3c55'); E.save(); modal(itemSheet(E.findItem(+d.uid))); refresh(); } else SND.play('error'); };
  ACT.salvage = function (d) { var v = E.salvage(+d.uid); if (v) { SND.play('salvage'); toast('+' + E.fmt(v) + ' 💠 Essence'); E.save(); closeModal(); refresh(); } };
  ACT.close = function () { closeModal(); };

  // ---------- autel ----------
  function tabAutel() {
    var h = '<div class="card small dim">Brûle tes <span class="ash">🔥 Cendres</span> ici. Ces bonus sont <b style="color:var(--text)">permanents</b> et valent pour tous tes héros.</div>';
    D.META.forEach(function (m) {
      var l = S().meta[m.id] || 0, c = E.metaCost(m.id), ok = c != null && S().cendres >= c;
      h += '<div class="li"><div class="ic">' + m.icon + '</div><div class="grow"><b>' + m.name + '</b> <span class="tiny gold">niv. ' + l + (m.max < 900 ? '/' + m.max : '') + '</span><div class="small dim">' + m.desc + ' par niveau</div></div>' +
        (c == null ? '<span class="gold small">MAX</span>' : '<button class="btn sm ' + (ok ? 'goldb' : 'off') + '" data-act="meta" data-id="' + m.id + '">🔥 ' + E.fmt(c) + '</button>') + '</div>';
    });
    return h;
  }
  ACT.meta = function (d) { if (E.buyMeta(d.id)) { SND.play('upgrade'); E.save(); keepScroll(hub); } else SND.play('error'); };

  // ---------- pactes ----------
  function tabPactes() {
    var hero = E.hero(S().hero), hs = S().heroes[S().hero], slots = E.pactSlots(S().hero);
    var h = '<div class="card small"><b>' + hero.name + '</b> porte <b class="gold">' + hs.pacts.length + '/' + slots + '</b> pacte' + (slots > 1 ? 's' : '') + '. <span class="dim">Un emplacement de plus à Maîtrise 4 et 8. Les pactes se gagnent avec les Hauts faits.</span></div>';
    D.PACTS.forEach(function (p) {
      var own = S().pacts.indexOf(p.id) >= 0, on = hs.pacts.indexOf(p.id) >= 0;
      h += '<button class="li' + (on ? ' on' : '') + (own ? '' : ' locked') + '" style="width:100%;text-align:left" data-act="pact" data-id="' + p.id + '"><div class="ic">' + (own ? p.icon : '🔒') + '</div><div class="grow"><b>' + p.name + '</b><div class="small dim">' + p.desc + '</div>' + (own ? '' : '<div class="tiny gold">' + p.how + '</div>') + '</div>' + (on ? '<span class="gold">✔</span>' : '') + '</button>';
    });
    return h;
  }
  ACT.pact = function (d) {
    if (S().run) { toast('Impossible pendant une descente.'); return; }
    if (S().pacts.indexOf(d.id) < 0) { SND.play('error'); return; }
    if (E.togglePact(d.id, S().hero)) { SND.play('equip'); E.save(); keepScroll(hub); } else { SND.play('error'); toast('Tous les emplacements sont pris. Retire un pacte d’abord.'); }
  };

  // ---------- hauts faits ----------
  function tabFaits() {
    var s = S().stats, done = Object.keys(S().ach).length;
    var h = '<div class="card"><div class="sumgrid" style="margin:0"><div class="stat"><b>' + s.best + '</b><span>Étage record</span></div><div class="stat"><b>' + E.fmt(s.kills) + '</b><span>Ennemis tués</span></div><div class="stat"><b>' + s.runs + '</b><span>Descentes</span></div><div class="stat"><b>' + s.bosses + '</b><span>Boss vaincus</span></div><div class="stat"><b class="c4">' + s.leg + '</b><span>Légendaires</span></div><div class="stat"><b class="c5">' + s.uni + '</b><span>Uniques</span></div></div></div><h3 style="margin:4px 0 8px">Hauts faits ' + done + '/' + D.ACHIEVEMENTS.length + '</h3>';
    D.ACHIEVEMENTS.slice().sort(function (a, b) { return (S().ach[a.id] ? 1 : 0) - (S().ach[b.id] ? 1 : 0); }).forEach(function (a) {
      var ok = S().ach[a.id], v = Math.min(s[a.c[0]] || 0, a.c[1]), p = a.pact ? E.byId(D.PACTS, a.pact) : null;
      h += '<div class="li' + (ok ? ' done' : '') + '"><div class="ic">' + (ok ? '🏆' : '▫️') + '</div><div class="grow"><b>' + a.name + '</b><div class="small dim">' + a.desc + (ok ? '' : ' — ' + E.fmt(v) + '/' + E.fmt(a.c[1])) + '</div>' + (ok ? '' : '<div class="bar" style="margin-top:3px"><i style="width:' + (v / a.c[1] * 100) + '%"></i></div>') + '</div><div class="small" style="text-align:right"><span class="ash">🔥 ' + E.fmt(a.cendres) + '</span>' + (p ? '<br><span class="tiny gold">' + p.icon + ' Pacte</span>' : '') + '</div></div>';
    });
    return h;
  }

  // ---------- réglages ----------
  ACT.settings = function () {
    var s = S().settings;
    modal('<h2>Réglages</h2><div class="btns"><button class="btn" data-act="setSfx">' + (s.sfx ? '🔊 Sons : oui' : '🔇 Sons : non') + '</button><button class="btn" data-act="setMusic">' + (s.music ? '🎵 Musique : oui' : '🎵 Musique : non') + '</button></div>' +
      '<div class="card small dim" style="margin-top:12px">💾 La partie se sauvegarde toute seule sur cet appareil, à chaque salle. Pour la mettre à l’abri ou la passer sur un autre appareil, copie le code ci-dessous.</div>' +
      '<div class="btns"><button class="btn" data-act="export">📤 Copier ma sauvegarde</button><button class="btn" data-act="importAsk">📥 Coller une sauvegarde</button></div>' +
      (S().run ? '<div class="btns"><button class="btn" data-act="abandonAsk">🏳️ Abandonner la descente</button></div>' : '') +
      '<div class="btns"><button class="btn" data-act="resetAsk" style="color:var(--blood)">Tout effacer</button><button class="btn primary" data-act="close">Fermer</button></div><div class="tiny dim center" style="margin-top:8px">Morvane v1.0</div>');
  };
  ACT.setSfx = function () { var s = S().settings; s.sfx = !s.sfx; SND.set('sfx', s.sfx); E.save(); ACT.settings(); };
  ACT.setMusic = function () { var s = S().settings; s.music = !s.music; SND.set('music', s.music); E.save(); ACT.settings(); };
  ACT.export = function () {
    var code = E.exportSave();
    modal('<h2>Ma sauvegarde</h2><p class="small dim center">Copie ce texte et garde-le (notes, mail à toi-même...).</p><textarea id="savetxt" readonly style="width:100%;height:120px;background:#0b090e;color:#bbb;border:1px solid var(--line);border-radius:8px;font-size:10px;-webkit-user-select:text;user-select:text">' + code + '</textarea><div class="btns"><button class="btn goldb" data-act="copy">Copier</button><button class="btn" data-act="close">Fermer</button></div>');
  };
  ACT.copy = function () { var t = $('#savetxt'); t.select(); t.setSelectionRange(0, 999999); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(function () { toast('Copié ✔'); }, function () { if (ok) toast('Copié ✔'); }); else if (ok) toast('Copié ✔'); };
  ACT.importAsk = function () { modal('<h2>Coller une sauvegarde</h2><p class="small bad center">Attention : cela remplace la partie actuelle.</p><textarea id="savetxt" placeholder="MORVANE1:..." style="width:100%;height:120px;background:#0b090e;color:#ddd;border:1px solid var(--line);border-radius:8px;font-size:11px;-webkit-user-select:text;user-select:text"></textarea><div class="btns"><button class="btn primary" data-act="import">Charger</button><button class="btn" data-act="close">Annuler</button></div>'); };
  ACT.import = function () { if (E.importSave($('#savetxt').value)) { closeModal(); toast('Sauvegarde chargée ✔'); st.view = S().hero; applySettings(); if (S().run) UI.run.show(); else hub('hero'); } else { SND.play('error'); toast('Code invalide.'); } };
  ACT.resetAsk = function () { modal('<h2 class="bad">Tout effacer ?</h2><p class="center">Héros, objets, progression : tout sera perdu pour toujours.</p><div class="btns"><button class="btn" data-act="resetDo" style="color:var(--blood)">Oui, tout effacer</button><button class="btn primary" data-act="close">Non !</button></div>', true); };
  ACT.resetDo = function () { if (UI.run) UI.run.stop(); E.reset(); closeModal(); st.view = null; st.zone = null; splash(); };
  ACT.abandonAsk = function () { modal('<h2>Abandonner ?</h2><p class="center">Tu rentres au sanctuaire. Tu gardes tes objets et tes Cendres.</p><div class="btns"><button class="btn" data-act="abandonDo">Rentrer</button><button class="btn primary" data-act="close">Continuer</button></div>', true); };
  ACT.abandonDo = function () { closeModal(); UI.run.end(true); };
  function applySettings() { SND.set('sfx', S().settings.sfx); SND.set('music', S().settings.music); }

  // ---------- démarrage ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) { if (e.target.id === 'modal') closeModal(); return; }
    if (t.disabled || t.classList.contains('off')) { SND.play('error'); return; }
    var fn = ACT[t.dataset.act]; if (fn) fn(t.dataset, t);
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { E.save(); SND.pause(true); if (UI.run) UI.run.pause(true); } else { SND.pause(false); if (UI.run) UI.run.pause(false); }
  });
  window.addEventListener('pagehide', function () { E.save(); });
  function boot() { E.load(); applySettings(); st.view = S().hero; splash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);

  return { ACT: ACT, $: $, S: S, spr: spr, toast: toast, flash: flash, modal: modal, closeModal: closeModal, overlay: overlay, hub: hub, itemTile: itemTile, itemSheet: itemSheet, askOmen: askOmen, setHtml: setHtml, modLines: modLines, flushAch: flushAch, st: st, fmtMod: fmtMod };
})();
