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
  // ---------- fiches d'explication : pouvoir, ennemi, lexique, nouveautés ----------
  function tagsHtml(k) { return '<span class="tgs">' + (k.tags || []).map(function (t) { return '<i class="tgc">' + t + '</i>'; }).join('') + '</span>'; }
  function inRun() { return st.screen === 'run' && !!S().run; }
  function backBtn() { return inRun() ? '<button class="btn" data-act="help">‹ Aide</button>' : ''; }
  function skillSheet(heroId, i) {
    var h = E.hero(heroId), k = h.skills[i], own = E.heroUnlocked(heroId), run = S().run && S().run.hero === heroId ? S().run : null;
    var ok = own && E.skillUnlocked(heroId, i), cd = run ? E.skillCd(run, i) : k.cd * (1 - (own ? E.heroStats(heroId, null).cdr : 0) / 100);
    var nums = own ? E.skillNumbers(heroId, i, run) : [];
    var html = '<div class="skhead"><div class="ic">' + k.icon + '</div><div class="grow"><b>' + k.name + '</b><div class="tiny dim">Pouvoir ' + (i + 1) + ' de ' + h.name + ' · 🎲 ' + D.NEEDS[k.need].txt + ' · recharge ' + E.turns(cd) + ' tours</div>' + tagsHtml(k) + '</div></div>';
    if (!ok) html += '<div class="card small gold">🔒 Se débloque à Maîtrise ' + (i + 1) + ' : joue ' + h.name + ' pour la monter.</div>';
    html += '<p style="margin:10px 2px">' + k.desc + '</p>';
    html += '<div class="li on"><div class="ic"><span class="needb">' + D.NEEDS[k.need].label + '</span></div><div class="grow"><b>Emplacement de dé</b><div class="small dim">Se lance en y glissant <b>' + D.NEEDS[k.need].txt + '</b>, sans coûter d’action. ' + (k.flat ? 'La valeur du dé ne change rien : sers-toi d’un petit dé.' : 'La valeur du dé règle sa puissance : 5 = 100 %, 6 = 110 %, 1 = 60 %.') + '</div></div></div>';
    if (nums.length) html += '<div class="card nums"><div class="tiny gold" style="letter-spacing:.08em">AVEC TES STATS ACTUELLES</div>' + nums.map(function (n) { return '<div><b>' + n + '</b></div>'; }).join('') + '<div class="tiny dim">Avant l’armure de l’ennemi et les coups critiques.</div></div>';
    html += '<div class="li"><div class="ic">💡</div><div class="grow"><b>Quand l’utiliser</b><div class="small dim">' + k.tip + '</div></div></div>';
    html += '<h3 class="gold" style="margin:10px 0 2px">✨ Éveils de ce pouvoir</h3><div class="tiny dim" style="margin-bottom:6px">Tous les 4 niveaux d’une descente, tu fais évoluer un pouvoir. Il garde son effet et gagne celui de l’éveil.</div>';
    k.evos.forEach(function (v) {
      var got = run && run.evos.indexOf(v.id) >= 0;
      html += '<div class="li' + (got ? ' on' : '') + '"><div class="ic">' + (got ? '✨' : '▫️') + '</div><div class="grow"><b>' + v.name + '</b>' + (got ? ' <span class="tiny gold">actif</span>' : '') + '<div class="small dim">' + v.desc + '</div></div></div>';
    });
    return html + '<div class="btns">' + backBtn() + '<button class="btn primary" data-act="close">Fermer</button></div>';
  }
  ACT.skillInfo = function (d) { SND.play('click'); modal(skillSheet(d.h, +d.i)); };
  // Fiche d'un ennemi. e = l'ennemi en combat (facultatif) : on montre alors ses PV, son préfixe, etc.
  function abIcons(ab) { var s = '', n = 0; for (var k in ab) if (D.AB_INFO[k] && n++ < 4) s += D.AB_INFO[k][0]; return s; }
  function foeSheet(key, e) {
    var b = D.ENEMIES[key]; if (!b) return '';
    var ab = e ? e.ab : b.ab, zone = null, n = S().codex[key] || 0, lines = '', k;
    D.ZONES.forEach(function (z) { if (!zone && (z.boss === key || z.elites.indexOf(key) >= 0 || z.mobs.indexOf(key) >= 0)) zone = z; });
    var html = '<div class="skhead"><div class="ic foe">' + spr(key) + '</div><div class="grow"><b>' + (e ? e.name : b.name) + '</b><div class="tiny dim">' + (b.boss ? 'Boss' : b.elite ? 'Élite' : 'Monstre') + (zone ? ' · ' + zone.name : '') + (n ? ' · tué ' + E.fmt(n) + ' fois' : '') + '</div>' +
      (e ? '<div class="tiny">❤️ ' + E.fmt(Math.ceil(e.hp)) + ' / ' + E.fmt(e.maxhp) + ' PV · frappe ' + E.fmt(e.atk) + ' ' + (e.int <= 1.05 ? '2 fois par tour' : e.int < 1.9 ? '1 à 2 fois par tour' : e.int <= 2.1 ? '1 fois par tour' : 'presque à chaque tour') + (e.def >= 1 ? ' · armure ' + E.fmt(e.def) : '') + '</div>' : '') + '</div></div>';
    if (e) [e.fix, e.fix2].forEach(function (fid) { var f = fid ? E.byId(D.MOBFIX, fid) : null; if (f && f.desc) lines += '<div class="li"><div class="ic">✴️</div><div class="grow"><b style="color:#ffd87a">' + f.name.charAt(0).toUpperCase() + f.name.slice(1) + '</b><div class="small dim">' + f.desc + '</div></div></div>'; });
    for (k in ab) if (D.AB_INFO[k]) lines += '<div class="li"><div class="ic">' + D.AB_INFO[k][0] + '</div><div class="grow"><b>' + D.AB_INFO[k][1] + '</b><div class="small dim">' + D.AB_INFO[k][2](ab[k]) + '</div></div></div>';
    if (b.boss && zone) lines += '<div class="li on"><div class="ic">☠️</div><div class="grow"><b>Spécialité</b><div class="small dim">' + zone.mech + '</div></div></div>';
    if (e && e.gold) lines += '<div class="li on"><div class="ic">💰</div><div class="grow"><b>Porteur d’or</b><div class="small dim">Il s’enfuit au bout de 6 tours. Tue-le avant : il est plein d’or.</div></div></div>';
    html += lines || '<p class="center dim small" style="margin:12px 0">Aucune capacité spéciale. Il frappe, c’est tout.</p>';
    if (e && e.fix && !e.champ) html += '<div class="tiny dim center">Les monstres au nom doré sont plus durs, mais rapportent plus.</div>';
    return html + '<div class="btns">' + backBtn() + '<button class="btn primary" data-act="close">Fermer</button></div>';
  }
  ACT.foeInfo = function (d) { if (!(S().codex[d.k] > 0)) { toast('Tue-le une fois pour découvrir sa fiche.'); return; } SND.play('click'); modal(foeSheet(d.k, null)); };
  ACT.lexique = function () {
    SND.play('click');
    modal('<h2>📖 Lexique</h2><div class="tiny dim center" style="margin:-6px 0 10px">Tous les mots du jeu, en clair.</div>' +
      D.GLOSS.map(function (g) { return '<div class="li"><div class="ic">' + g[0] + '</div><div class="grow"><b>' + g[1] + '</b><div class="small dim">' + g[2] + '</div></div></div>'; }).join('') +
      '<div class="btns">' + backBtn() + '<button class="btn primary" data-act="close">Fermer</button></div>');
  };
  ACT.news = function () {
    SND.play('click');
    modal('<div class="center tiny gold" style="letter-spacing:.3em">VERSION ' + D.VERSION + '</div><h2 style="margin:4px 0 10px">Quoi de neuf ?</h2>' +
      D.NEWS.map(function (g) { return '<div class="li"><div class="ic">' + g[0] + '</div><div class="grow"><b>' + g[1] + '</b><div class="small dim">' + g[2] + '</div></div></div>'; }).join('') +
      '<div class="btns"><button class="btn primary big" data-act="close">COMPRIS</button></div>');
  };
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
    $('#screen').innerHTML = '<div class="splash" style="background-image:url(' + Backgrounds.url('title') + ')">' + spr('logo') + '<h1>MORVANE</h1><div class="dim" style="font-family:var(--serif);letter-spacing:.2em">LES CENDRES DU ROI CREUX</div>' +
      '<button class="btn primary big" data-act="enter" style="max-width:300px;margin-top:18px">' + (S().stats.runs ? 'CONTINUER' : 'COMMENCER') + '</button>' +
      '<div class="tiny dim" style="margin-top:10px">Sauvegarde automatique · jouable hors-ligne</div>' +
      '<button class="verb" data-act="news">Version ' + D.VERSION + ' · voir les nouveautés ›</button></div>';
    if (typeof FX !== 'undefined') FX.attach($('.splash'), { ambient: 'embers', warm: 3 });
  }
  ACT.enter = function () {
    SND.unlock(); SND.play('door');
    if (!S().stats.runs && !S().run) {
      modal('<h2>La descente</h2><p class="center">Le Roi Creux a éteint le monde. Six royaumes pourrissent sous la terre de Morvane.</p><p class="center">Descends. Meurs. <b>Garde ton butin.</b> Reviens plus fort.</p><p class="center dim small">Le combat se joue au tour par tour.<br>Un petit tutoriel te guidera au premier combat.</p><div class="btns"><button class="btn primary big" data-act="firstRun">DESCENDRE</button></div>', true);
      return;
    }
    if (S().run) { UI.run.show(); return; }
    hub();
  };
  ACT.firstRun = function () { closeModal(); UI.story.play('pro', function () { E.startRun('chevalier', 1); UI.run.show(); }, { card: true }); };

  // ---------- sanctuaire ----------
  function hub(tab) {
    if (tab) st.tab = tab; st.screen = 'hub';
    if (!st.view || !E.hero(st.view)) st.view = S().hero;
    overlay(null);
    SND.music('hub');
    var idle = E.idleInfo(), newItems = S().inv.some(function (i) { return i.isNew; });
    var metaOk = D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; });
    var tabs = [['hero', '🔥', 'Camp', idle.full || E.contractReady() || E.talentPoints(S().hero) > 0 || E.dailyInfo().claimable || UI.story.fresh()], ['sac', '🎒', 'Sac', newItems], ['autel', '⚱️', 'Autel', metaOk], ['pactes', '📜', 'Pactes', pactFree() || E.famNew()], ['faits', '🏆', 'Hauts faits', false]];
    var body = { hero: tabHero, sac: tabSac, autel: tabAutel, pactes: tabPactes, faits: tabFaits }[st.tab]();
    $('#screen').innerHTML = '<div class="topbar"><span class="title grow">MORVANE</span><span class="cur ash">🔥 ' + E.fmt(S().cendres) + '</span><span class="cur ess">💠 ' + E.fmt(S().essence) + '</span><button class="icon-btn" data-act="settings">⚙️</button></div>' +
      '<div class="content" id="content">' + body + '</div><div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (st.tab === t[0] ? ' on' : '') + '" data-act="tab" data-tab="' + t[0] + '"><span class="ti">' + t[1] + '</span>' + t[2] + (t[3] ? '<i class="dot"></i>' : '') + '</button>'; }).join('') + '</div>';
    if (st.tab === 'hero' && typeof FX !== 'undefined') FX.attach($('.camp-scene'), { ambient: 'embers', fire: { x: 0.66, y: 0.86, s: 2.6 }, warm: 2 });
    $('#content').classList.toggle('camp', st.tab === 'hero');
    flushAch();
    if (S().stats.boss6 > 0 && !S().run && UI.story.seen()['c6.end']) UI.story.play('epi', null, { card: true });
    var vk = 'v' + D.VERSION, seenV = S().tuto[vk]; S().tuto[vk] = 1;
    if (S().tuto.hub && !seenV) { E.save(); ACT.news(); }
    if (!S().tuto.hub) { S().tuto.hub = 1; E.save(); }
    if (st.tab === 'hero' && UI.guide && !$('#modal').classList.contains('on')) UI.guide.camp();
  }
  function pactFree() { var hs = S().heroes[S().hero]; return S().pacts.length > hs.pacts.length && hs.pacts.length < E.pactSlots(S().hero); }
  function keepScroll(fn) { var c = $('#content'), y = c ? c.scrollTop : 0; fn(); c = $('#content'); if (c) c.scrollTop = y; }
  ACT.tab = function (d) { SND.play('click'); hub(d.tab); };

  // ---------- le camp : le héros au coin du feu ----------
  function tabHero() {
    var h = E.hero(st.view), un = E.heroUnlocked(h.id), hs = S().heroes[h.id], html = '';
    var aura = -1; if (un) { for (var asl in hs.equip) { var ait = E.findItem(hs.equip[asl]); if (ait && ait.rar > aura) aura = ait.rar; } }
    var sprH = spr(h.id, 'spr'); if (aura >= 2) sprH = sprH.replace('<img', '<img style="--aura:' + D.RARITIES[aura].color + '"');
    var idle = E.idleInfo(), dl = E.dailyInfo();
    html += '<div class="camp-scene' + (un ? '' : ' locked') + '" style="background-image:url(' + Backgrounds.url('camp') + ')"><div class="camp-sky"></div><div class="camp-glow"></div>';
    html += '<button class="camp-name" data-act="roster"><b>' + h.name + '</b><span>' + h.title + '</span></button>';
    html += '<button class="camp-hero" data-act="heroSheet">' + sprH + spr('p_buche', 'log') + '</button>' + (un ? famHtml('famh') : '');
    html += '<button class="nav l" data-act="heroNav" data-d="-1">‹</button><button class="nav r" data-act="heroNav" data-d="1">›</button>';
    if (un) {
      html += '<div class="camp-chips"><span>Maîtrise <b>' + hs.lvl + '</b></span><span>Puissance <b>' + E.fmt(E.power(h.id)) + '</b></span></div>';
      var gifts = '';
      if (dl.claimable) gifts += '<button class="gift" data-act="daily">' + spr('i_gift', 'ic') + '<span>Offrande</span></button>';
      if (S().stats.best > 0 && idle.amount > 0) gifts += '<button class="gift" data-act="idle">' + spr('i_urn', 'ic') + '<span>+' + E.fmt(idle.amount) + '</span></button>';
      if (gifts) html += '<div class="camp-gifts">' + gifts + '</div>';
    } else {
      var how = h.unlock.cost ? '<button class="btn goldb' + (S().cendres >= h.unlock.cost ? '' : ' off') + '" data-act="unlock" data-id="' + h.id + '">Recruter — 🔥 ' + E.fmt(h.unlock.cost) + '</button>' : '<div class="gold small">Vaincs ' + D.ENEMIES[D.ZONES[h.unlock.boss - 1].boss].name + '<br><span class="dim">(boss de la zone ' + h.unlock.boss + ')</span></div>';
      html += '<div class="lock"><div style="font-size:26px">🔒</div><b>' + h.role + '</b>' + how + '</div>';
    }
    html += '</div>';
    if (!un) return html + '<div class="card"><div class="small gold">' + h.role + '</div><div class="small dim">' + h.desc + '</div><div class="small" style="margin-top:6px">' + h.passive.icon + ' <b>' + h.passive.name + '</b> — ' + h.passive.desc + '</div></div>';
    if (S().run) html += '<button class="btn primary big camp-go" data-act="resume">REPRENDRE · ÉTAGE ' + S().run.floor + '</button>';
    else {
      var mz = E.maxStartZone(); if (st.zone == null || st.zone > mz) st.zone = mz;
      if (mz > 1) html += '<div class="zone-pick"><button class="icon-btn" data-act="zone" data-d="-1">‹</button><div class="zn"><b>' + E.zoneLabel(st.zone) + '</b><div class="tiny dim">Départ étage ' + ((st.zone - 1) * 10 + 1) + (st.zone > 1 ? ' · ' + ((st.zone - 1) * 3) + ' aubaines offertes' : '') + '</div></div><button class="icon-btn" data-act="zone" data-d="1">›</button></div>';
      html += '<button class="btn primary big camp-go" data-act="descend">DESCENDRE</button>';
    }
    html += '<div class="tiny dim center" style="margin:6px 0 12px">Record : étage ' + S().stats.best + '</div>';
    var tpts = E.talentPoints(h.id), gl = E.gloryInfo();
    var q = [['talents', 'i_star', 'Talents', tpts ? tpts + ' point' + (tpts > 1 ? 's' : '') : 'Maîtrise ' + hs.lvl, tpts > 0], ['quests', 'i_scroll', 'Quêtes', 'contrats du jour', E.contractReady() || idle.full], ['chron', 'i_book', 'Histoire', 'la Chronique', UI.story.fresh()], ['glory', 'i_medal', 'Gloire', 'palier ' + gl.lvl, false]];
    html += '<div class="camp-quick">' + q.map(function (x) { return '<button class="qk" data-act="' + x[0] + '">' + spr(x[1], 'ic') + '<b>' + x[2] + '</b><span>' + x[3] + '</span>' + (x[4] ? '<i class="dot"></i>' : '') + '</button>'; }).join('') + '</div>';
    return html;
  }
  // Fiche du héros : stats, équipement, pouvoirs
  ACT.heroSheet = function () {
    var h = E.hero(st.view); if (!E.heroUnlocked(h.id)) return; SND.play('click');
    var hs = S().heroes[h.id], s = E.heroStats(h.id, null), html = '<h2>' + h.name + '</h2><div class="tiny gold center" style="margin:-6px 0 10px">' + h.title + ' · ' + h.role + '</div>';
    html += '<button class="stats" data-act="allStats" style="width:100%"><div class="stat"><b>' + E.fmt(s.hp) + '</b><span>PV</span></div><div class="stat"><b>' + E.fmt(s.atk) + '</b><span>Attaque</span></div><div class="stat"><b>' + E.fmt(s.def) + '</b><span>Armure</span></div><div class="stat"><b>' + Math.round(s.crit) + '%</b><span>Critique</span></div></button>';
    html += '<div class="equip">' + D.SLOTS.map(function (sl) { var it = hs.equip[sl.id] ? E.findItem(hs.equip[sl.id]) : null; return it ? itemTile(it) : '<button class="slot empty" data-act="slotEmpty" data-slot="' + sl.id + '">' + sl.icon + '</button>'; }).join('') + '</div>';
    var scn = E.setCounts(h.id), sk = Object.keys(scn); if (sk.length) html += '<div class="card"><b>Sets portés</b>' + sk.map(function (id) { return setHtml(id, scn[id]); }).join('') + '</div>';
    html += '<div class="small dim" style="margin:4px 2px 8px">' + h.desc + '</div><div class="skills-list"><div class="sk"><div class="ic">' + h.passive.icon + '</div><div><b>' + h.passive.name + '</b> <span class="tiny dim">passif</span><div class="small dim">' + h.passive.desc + '</div></div></div>' +
      '<div class="sk"><div class="ic">' + h.ult.icon + '</div><div><b>' + h.ult.name + '</b> <span class="tiny gold">ultime</span><div class="small dim">' + h.ult.desc + '</div></div></div>' +
      h.skills.map(function (k, i) { var ok = E.skillUnlocked(h.id, i); return '<button class="sk tap' + (ok ? '' : ' locked') + '" data-act="skillInfo" data-h="' + h.id + '" data-i="' + i + '"><div class="ic">' + (ok ? k.icon : '🔒') + '</div><div class="grow"><b>' + k.name + '</b> <span class="tiny dim">' + (ok ? '' : 'Maîtrise ' + (i + 1)) + '</span>' + tagsHtml(k) + '<div class="small dim">' + k.desc + '</div></div><span class="dim">›</span></button>'; }).join('') + '</div>';
    html += '<div class="btns"><button class="btn sm" data-act="lexique">📖 Lexique</button><button class="btn primary" data-act="close">Fermer</button></div>';
    modal(html);
  };
  ACT.roster = function () {
    SND.play('click');
    modal('<h2>Choisis ton héros</h2><div class="roster-big">' + D.HEROES.map(function (x) { var u = E.heroUnlocked(x.id); return '<button class="rhb' + (x.id === st.view ? ' on' : '') + (u ? '' : ' lk') + '" data-act="heroPick" data-id="' + x.id + '">' + spr(x.id) + '<b>' + x.name + '</b><span>' + (u ? x.role : '🔒') + '</span></button>'; }).join('') + '</div><div class="btns"><button class="btn" data-act="close">Fermer</button></div>');
  };
  ACT.quests = function () {
    var idle = E.idleInfo(), h = '<h2>📜 Quêtes du jour</h2><div class="tiny dim center" style="margin:-6px 0 10px">Nouvelles chaque jour</div>';
    h += E.contracts().map(function (ct, i) {
      var v = E.contractProgress(ct), ok = v >= ct.need, rw = (ct.kind === 'essence' ? '💠 ' : '🔥 ') + E.fmt(ct.amount);
      return '<div class="ctr' + (ct.claimed ? ' done' : '') + '"><div class="grow"><div class="small">' + ct.name + ' <span class="dim">' + v + '/' + ct.need + '</span></div><div class="bar" style="margin-top:3px"><i style="width:' + (v / ct.need * 100) + '%;background:' + (ok ? 'var(--ok)' : 'var(--gold)') + '"></i></div></div>' +
        (ct.claimed ? '<span class="small good">✔ reçu</span>' : '<button class="btn sm ' + (ok ? 'goldb' : 'off') + '" data-act="contract" data-i="' + i + '">' + rw + '</button>') + '</div>';
    }).join('');
    if (S().stats.best > 0) h += '<div class="card idle" style="margin-top:12px"><div style="font-size:26px">⚱️</div><div class="grow"><b>Ossuaire</b><div class="small dim">Les morts travaillent pour toi : ' + E.fmt(idle.rate) + ' 🔥/h (réserve ' + idle.cap + ' h)</div><div class="bar" style="margin-top:4px"><i style="width:' + (idle.hours / idle.cap * 100) + '%;background:var(--ash)"></i></div></div><button class="btn goldb sm' + (idle.amount > 0 ? '' : ' off') + '" data-act="idle">+' + E.fmt(idle.amount) + ' 🔥</button></div>';
    h += '<div class="btns"><button class="btn primary" data-act="close">Fermer</button></div>';
    modal(h);
  };
  ACT.glory = function () {
    SND.play('click'); var gl = E.gloryInfo();
    modal('<h2>🏅 Gloire</h2><div class="card glory"><div class="row"><b>Palier ' + gl.lvl + '</b><span class="grow"></span><span class="tiny dim">' + gl.pts + ' / ' + gl.need + '</span></div><div class="bar" style="margin:6px 0 4px"><i style="width:' + Math.min(100, gl.pts / gl.need * 100) + '%"></i></div><div class="tiny dim">Chaque descente la remplit selon ton score. Prochaine récompense : <span style="color:var(--text)">' + gl.next + '</span></div></div><div class="center small dim">Record : étage ' + S().stats.best + (S().stats.bestScore ? ' · meilleur score ' + S().stats.bestScore : '') + '</div><div class="btns"><button class="btn primary" data-act="close">Fermer</button></div>');
  };
  ACT.heroPick = function (d) {
    closeModal(); st.view = d.id; if (E.heroUnlocked(d.id) && !S().run) { S().hero = d.id; E.save(); }
    SND.play('click'); hub();
  };
  ACT.heroNav = function (d) {
    var i = D.HEROES.indexOf(E.hero(st.view)); i = (i + (+d.d) + D.HEROES.length) % D.HEROES.length; st.view = D.HEROES[i].id;
    if (E.heroUnlocked(st.view) && !S().run) { S().hero = st.view; E.save(); }
    SND.play('click'); hub();
  };
  ACT.unlock = function (d) { if (E.unlockHero(d.id)) { SND.play('levelup'); flash('#d9a441'); if (!S().run) S().hero = d.id; E.save(); hub(); } else SND.play('error'); };
  ACT.zone = function (d) { st.zone = Math.max(1, Math.min(E.maxStartZone(), st.zone + (+d.d))); SND.play('click'); keepScroll(hub); };
  // ---------- talents ----------
  function renderTalents() {
    var id = S().hero, hero = E.hero(id), hs = S().heroes[id], pts = E.talentPoints(id), tal = hs.tal || {};
    var h = '<h2>🌟 Talents de ' + hero.name + '</h2><div class="center small" style="margin:-6px 0 10px">' + (pts ? '<b class="gold">' + pts + ' point' + (pts > 1 ? 's' : '') + ' à placer</b>' : '<span class="dim">Aucun point. Chaque niveau de Maîtrise en donne un.</span>') + '</div>';
    D.TALENTS[id].forEach(function (t) {
      var r = tal[t.id] || 0, parts = [], tot = [];
      for (var k in t.mods) { var f = fmtMod(k, t.mods[k]); if (f && /^s[123]P$/.test(k)) f[0] = 'dégâts de ' + hero.skills[+k.charAt(1) - 1].name; if (f) parts.push(f[1] + ' ' + f[0]); var g = fmtMod(k, t.mods[k] * r); if (g && r) tot.push(g[1]); }
      var pips = ''; for (var i = 0; i < t.max; i++) pips += '<i class="' + (i < r ? 'on' : '') + '"></i>';
      h += '<div class="li' + (r ? ' on' : '') + '"><div class="ic">' + t.icon + '</div><div class="grow"><b>' + t.name + '</b> <span class="tiny gold">' + (r ? 'total ' + tot.join(' ') : '') + '</span><div class="small dim">' + parts.join(' · ') + ' par rang</div><div class="pips" style="margin-top:4px">' + pips + '</div></div>' +
        (r >= t.max ? '<span class="gold small">MAX</span>' : '<button class="btn sm ' + (pts ? 'goldb' : 'off') + '" data-act="talentAdd" data-id="' + t.id + '">＋</button>') + '</div>';
    });
    h += '<div class="btns"><button class="btn" data-act="talentReset">↺ Tout reprendre</button><button class="btn primary" data-act="talentClose">Fermer</button></div><div class="tiny dim center" style="margin-top:6px">Reprendre ses points est gratuit : essaie plusieurs styles.</div>';
    modal(h);
  }
  ACT.talents = function () { SND.play('click'); renderTalents(); };
  ACT.talentAdd = function (d) { if (E.addTalent(S().hero, d.id)) { SND.play('upgrade'); E.save(); renderTalents(); } else SND.play('error'); };
  ACT.talentReset = function () { if (S().run) { toast('Impossible pendant une descente.'); return; } E.resetTalents(S().hero); SND.play('salvage'); E.save(); renderTalents(); };
  ACT.talentClose = function () { closeModal(); refresh(); };
  function famHtml(cls) {
    var f = S().fam ? E.byId(D.FAMILIARS, S().fam) : null; if (!f || !E.famUnlocked(f.id)) return '';
    return '<div class="' + cls + (f.noflip ? '' : ' flip') + '">' + spr(f.spr) + '</div>';
  }
  function vib(p) { try { if (S().settings.vib !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
  ACT.daily = function () {
    var i = E.claimDaily(); if (!i) return;
    SND.play('gold'); SND.play('levelup', 0.6); flash('#d9a44166'); vib(30);
    toast('🎁 Offrande du jour ' + i.streak + '/7 : +' + E.fmt(i.cendres) + ' 🔥 · +' + i.essence + ' 💠' + (i.got ? '<br><b class="c3">+ ' + E.itemName(i.got) + ' (Épique)</b>' : i.streak < 7 ? '<br><span class="dim">Reviens demain : la récompense grossit.</span>' : ''), true);
    E.save(); keepScroll(hub);
  };
  ACT.fam = function (d) {
    if (S().run) { toast('Impossible pendant une descente.'); return; }
    if (!E.famUnlocked(d.id)) { SND.play('error'); return; }
    E.setFam(d.id); SND.play('equip'); E.save(); keepScroll(hub);
  };
  ACT.setVib = function () { var s = S().settings; s.vib = s.vib === false; if (s.vib) vib(40); E.save(); ACT.settings(); };
  ACT.contract = function (d) { var ct = E.claimContract(+d.i); if (ct) { SND.play('gold'); SND.play('levelup', 0.5); flash('#d9a44155'); toast('📜 Contrat rempli : +' + E.fmt(ct.amount) + (ct.kind === 'essence' ? ' 💠' : ' 🔥')); E.save(); keepScroll(hub); if ($('#modal.on .ctr')) ACT.quests(); } else SND.play('error'); };
  ACT.idle = function () { var a = E.collectIdle(); if (a > 0) { SND.play('gold'); toast('+' + E.fmt(a) + ' 🔥 Cendres récoltées'); E.save(); keepScroll(hub); if ($('#modal.on .ctr')) ACT.quests(); } };
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
    h += '<div class="row" style="margin-bottom:10px"><button class="btn sm goldb grow" data-act="equipBest">⚡ Équiper le meilleur</button><button class="btn sm grow" data-act="salvageMenu">♻️ Recycler...</button><button class="btn sm grow" data-act="fuseMenu">⚗️ Fusionner</button></div>';
    if (!inv.length) h += '<div class="center dim" style="padding:30px">Rien ici. Descends en chercher.</div>';
    h += '<div class="inv-grid">' + inv.map(function (it) {
      var cur = hs.equip[E.itemBase(it).slot], curIt = cur ? E.findItem(cur) : null;
      var better = cur !== it.uid && !E.equippedBy(it.uid) && (!curIt || E.itemScore(it) > E.itemScore(curIt) * 1.02);
      return itemTile(it, better ? '<span class="arrow" style="left:auto;right:3px;top:' + (it.up ? '11' : '0') + 'px">▲</span>' : '');
    }).join('') + '</div>';
    h += '<div class="tiny dim center" style="margin-top:12px">Couleurs : <span class="c0">Normal</span> · <span class="c1">Commun</span> · <span class="c2">Rare</span> · <span class="c3">Épique</span> · <span class="c4">Légendaire</span> · <span class="c5">Unique</span></div>';
    return h;
  }
  // ---------- fusion : 3 objets de même rareté -> 1 objet de la rareté au-dessus ----------
  function renderFuse() {
    var sel = st.fuse || (st.fuse = []), first = sel.length ? E.findItem(sel[0]) : null, pv = sel.length === 3 ? E.fusePreview(sel) : null;
    var pool = S().inv.filter(E.canFuse).sort(function (a, b) { return (a.rar - b.rar) || (a.ilvl - b.ilvl); });
    var h = '<h2>⚗️ Fusion</h2><p class="small dim center" style="margin-top:-4px">Choisis <b style="color:var(--text)">3 objets de la même couleur</b>. Ils fondent en <b style="color:var(--text)">1 objet de la couleur au-dessus</b>, du type du premier choisi et au niveau du meilleur des trois. Deux pièces d’un même set donnent une pièce de ce set.</p>';
    h += '<div class="fslots">' + [0, 1, 2].map(function (i) { var it = sel[i] != null ? E.findItem(sel[i]) : null; return it ? '<button class="item r' + it.rar + '" data-act="fusePick" data-uid="' + it.uid + '">' + E.itemBase(it).icon + '<span class="lv">' + it.ilvl + '</span></button>' : '<div class="slot empty">＋</div>'; }).join('') +
      '<div class="farrow">➜</div>' + (pv ? '<div class="item r' + pv.rar + '">' + E.byId(D.SLOTS, pv.slot).icon + '<span class="lv">' + pv.ilvl + '</span></div>' : '<div class="slot empty">?</div>') + '</div>';
    h += '<div class="center small" style="min-height:20px;margin-bottom:8px">' + (pv ? 'Résultat : <b class="c' + pv.rar + '">' + D.RARITIES[pv.rar].name + '</b> · ' + E.byId(D.SLOTS, pv.slot).name + ' niveau ' + pv.ilvl + (pv.set ? ' · <span style="color:#6dffb0">◆ ' + E.byId(D.SETS, pv.set).name + '</span>' : '') : first ? 'Encore ' + (3 - sel.length) + ' objet' + (3 - sel.length > 1 ? 's' : '') + ' <b class="c' + first.rar + '">' + D.RARITIES[first.rar].name + '</b>' : '<span class="dim">Les objets équipés, verrouillés, légendaires et uniques ne se fusionnent pas.</span>') + '</div>';
    if (!pool.length) h += '<div class="center dim" style="padding:16px">Aucun objet à fusionner pour l’instant.</div>';
    h += '<div class="inv-grid">' + pool.map(function (it) {
      var on = sel.indexOf(it.uid) >= 0, no = !on && (sel.length >= 3 || (first && first.rar !== it.rar));
      return '<button class="item r' + it.rar + (on ? ' sel' : '') + '"' + (no ? ' style="opacity:.25"' : '') + ' data-act="fusePick" data-uid="' + it.uid + '">' + E.itemBase(it).icon + '<span class="lv">' + it.ilvl + '</span>' + (it.set ? '<span class="sm">◆</span>' : '') + (on ? '<span class="eq">✔️</span>' : '') + '</button>';
    }).join('') + '</div>';
    h += '<div class="btns"><button class="btn" data-act="fuseClose">Fermer</button><button class="btn goldb' + (pv ? '' : ' off') + '" data-act="fuseDo">⚗️ Fusionner</button></div>';
    modal(h);
  }
  ACT.fuseMenu = function () { st.fuse = []; SND.play('click'); renderFuse(); };
  ACT.fuseClose = function () { st.fuse = []; closeModal(); refresh(); };
  ACT.fusePick = function (d) {
    var uid = +d.uid, sel = st.fuse || (st.fuse = []), i = sel.indexOf(uid), it = E.findItem(uid);
    if (i >= 0) sel.splice(i, 1);
    else { var first = sel.length ? E.findItem(sel[0]) : null; if (sel.length >= 3 || !E.canFuse(it) || (first && first.rar !== it.rar)) { SND.play('error'); return; } sel.push(uid); }
    SND.play('click'); renderFuse();
  };
  ACT.fuseDo = function () {
    var it = E.fuse(st.fuse || []); if (!it) { SND.play('error'); return; }
    st.fuse = []; E.save(); SND.play('upgrade'); SND.play(D.RARITIES[it.rar].sfx); flash(D.RARITIES[it.rar].color + '99');
    modal('<h2>⚗️ Fusion réussie</h2>' + itemSheet(it, 'view').replace('<div class="btns"><button class="btn" data-act="close">Fermer</button></div>', '') + '<div class="btns"><button class="btn" data-act="fuseClose">Fermer</button><button class="btn primary" data-act="equip" data-uid="' + it.uid + '">Équiper</button><button class="btn goldb" data-act="fuseMenu">Encore</button></div>');
    flushAch();
  };
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
      h += '<button class="li' + (on ? ' on' : '') + (own ? '' : ' locked') + '" style="width:100%;text-align:left" data-act="pact" data-id="' + p.id + '"><div class="ic">' + (own ? p.icon : spr('i_lock', 'ski')) + '</div><div class="grow"><b>' + p.name + '</b><div class="small dim">' + p.desc + '</div>' + (own ? '' : '<div class="tiny gold">' + p.how + '</div>') + '</div>' + (on ? '<span class="gold">✔</span>' : '') + '</button>';
    });
    h += '<h3 style="margin:14px 0 4px">🐾 Familiers</h3><div class="small dim" style="margin-bottom:8px">Tue assez de monstres d’une espèce pour en apprivoiser un. Un seul t’accompagne à la fois, pour tous tes héros.</div>';
    D.FAMILIARS.forEach(function (f) {
      var ok = E.famUnlocked(f.id), on = S().fam === f.id, n = Math.min(S().codex[f.need[0]] || 0, f.need[1]);
      if (ok) S().tuto['fam_' + f.id] = 1;
      h += '<button class="li' + (on ? ' on' : '') + (ok ? '' : ' locked') + '" style="width:100%;text-align:left" data-act="fam" data-id="' + f.id + '"><div class="ic famic' + (ok ? '' : ' no') + '">' + spr(f.spr) + '</div><div class="grow"><b>' + (ok ? f.name : '???') + '</b><div class="small dim">' + f.desc + '</div>' +
        (ok ? '' : '<div class="tiny gold">' + D.ENEMIES[f.need[0]].name + ' : ' + n + '/' + f.need[1] + ' tués</div><div class="bar" style="margin-top:3px"><i style="width:' + (n / f.need[1] * 100) + '%"></i></div>') + '</div>' + (on ? '<span class="gold">✔</span>' : '') + '</button>';
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
    var h = '<div class="card"><div class="sumgrid" style="margin:0"><div class="stat"><b>' + s.best + '</b><span>Étage record</span></div><div class="stat"><b>' + E.fmt(s.kills) + '</b><span>Ennemis tués</span></div><div class="stat"><b>' + s.runs + '</b><span>Descentes</span></div><div class="stat"><b>' + s.bosses + '</b><span>Boss vaincus</span></div><div class="stat"><b class="c4">' + s.leg + '</b><span>Légendaires</span></div><div class="stat"><b class="c5">' + s.uni + '</b><span>Uniques</span></div><div class="stat"><b>' + E.fmt(s.maxHit || 0) + '</b><span>Plus gros coup</span></div><div class="stat"><b>x' + (s.maxCombo || 0) + '</b><span>Meilleur combo</span></div><div class="stat"><b>' + (s.fusions || 0) + '</b><span>Fusions</span></div></div></div><h3 style="margin:4px 0 8px">Hauts faits ' + done + '/' + D.ACHIEVEMENTS.length + '</h3>';
    D.ACHIEVEMENTS.slice().sort(function (a, b) { return (S().ach[a.id] ? 1 : 0) - (S().ach[b.id] ? 1 : 0); }).forEach(function (a) {
      var ok = S().ach[a.id], v = Math.min(s[a.c[0]] || 0, a.c[1]), p = a.pact ? E.byId(D.PACTS, a.pact) : null;
      h += '<div class="li' + (ok ? ' done' : '') + '"><div class="ic">' + (ok ? '🏆' : '▫️') + '</div><div class="grow"><b>' + a.name + '</b><div class="small dim">' + a.desc + (ok ? '' : ' — ' + E.fmt(v) + '/' + E.fmt(a.c[1])) + '</div>' + (ok ? '' : '<div class="bar" style="margin-top:3px"><i style="width:' + (v / a.c[1] * 100) + '%"></i></div>') + '</div><div class="small" style="text-align:right"><span class="ash">🔥 ' + E.fmt(a.cendres) + '</span>' + (p ? '<br><span class="tiny gold">' + p.icon + ' Pacte</span>' : '') + '</div></div>';
    });
    // bestiaire
    var keys = Object.keys(D.ENEMIES), seen = keys.filter(function (k) { return S().codex[k] > 0; }).length;
    h += '<h3 style="margin:14px 0 4px">📖 Bestiaire ' + seen + '/' + keys.length + '</h3><div class="tiny dim" style="margin-bottom:8px">Touche un monstre déjà tué pour voir ce qu’il sait faire.</div><div class="codex">' + keys.map(function (k) {
      var n = S().codex[k] || 0, e = D.ENEMIES[k];
      return '<div data-act="foeInfo" data-k="' + k + '" class="cdx' + (n ? '' : ' no') + (e.boss ? ' boss' : e.elite ? ' elite' : '') + '">' + spr(k) + '<div class="tiny">' + (n ? e.name : '???') + '</div><div class="tiny dim">' + (n ? 'x' + E.fmt(n) : '') + '</div></div>';
    }).join('') + '</div>';
    var un = D.UNIQUES.filter(function (u) { return S().uniq[u.id]; }).length;
    h += '<h3 style="margin:14px 0 8px" class="c5">🩸 Objets uniques ' + un + '/' + D.UNIQUES.length + '</h3>';
    D.ZONES.forEach(function (z) {
      z.uniques.forEach(function (uid) {
        var u = E.byId(D.UNIQUES, uid), ok = S().uniq[uid];
        h += '<div class="li' + (ok ? ' done' : ' locked') + '"><div class="ic">' + (ok ? E.byId(D.BASES, u.base).icon : '❔') + '</div><div class="grow"><b class="' + (ok ? 'c5' : '') + '">' + (ok ? u.name : '???') + '</b><div class="small dim">' + (ok ? '« ' + u.lore + ' »' : 'Lâché par ' + D.ENEMIES[z.boss].name) + '</div></div></div>';
      });
    });
    return h;
  }

  // ---------- réglages ----------
  ACT.settings = function () {
    var s = S().settings;
    modal('<h2>Réglages</h2><div class="btns"><button class="btn" data-act="setSfx">' + (s.sfx ? '🔊 Sons : oui' : '🔇 Sons : non') + '</button><button class="btn" data-act="setMusic">' + (s.music ? '🎵 Musique : oui' : '🎵 Musique : non') + '</button></div>' +
      '<div class="btns"><button class="btn" data-act="setVib">' + (s.vib !== false ? '📳 Vibrations : oui' : '📳 Vibrations : non') + '</button></div>' +
      '<div class="card small dim" style="margin-top:12px">💾 La partie se sauvegarde toute seule sur cet appareil, à chaque salle. Pour la mettre à l’abri ou la passer sur un autre appareil, copie le code ci-dessous.</div>' +
      '<div class="btns"><button class="btn" data-act="export">📤 Copier ma sauvegarde</button><button class="btn" data-act="importAsk">📥 Coller une sauvegarde</button></div>' +
      (S().run ? '<div class="btns"><button class="btn" data-act="abandonAsk">🏳️ Abandonner la descente</button></div>' : '') +
      '<div class="btns"><button class="btn" data-act="resetAsk" style="color:var(--blood)">Tout effacer</button><button class="btn primary" data-act="close">Fermer</button></div><div class="center" style="margin-top:8px"><button class="verb" data-act="news">Morvane version ' + D.VERSION + ' · voir les nouveautés ›</button></div>');
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
  // Appui long sur un élément [data-info="type:arg"] : ouvre sa fiche au lieu de l'activer
  var lpT = null, lpFired = false, lpXY = null;
  function lpStop() { clearTimeout(lpT); lpT = null; }
  document.addEventListener('pointerdown', function (e) {
    lpStop(); lpFired = false;
    var t = e.target.closest ? e.target.closest('[data-info]') : null; if (!t) return;
    lpXY = [e.clientX, e.clientY];
    lpT = setTimeout(function () { lpT = null; if (!ACT.info) return; lpFired = true; vib(15); var p = t.dataset.info.split(':'); ACT.info(p[0], p[1]); }, 450);
  });
  document.addEventListener('pointermove', function (e) { if (lpT && lpXY && Math.abs(e.clientX - lpXY[0]) + Math.abs(e.clientY - lpXY[1]) > 14) lpStop(); });
  ['pointerup', 'pointercancel'].forEach(function (n) { document.addEventListener(n, lpStop); });
  document.addEventListener('click', function (e) {
    if (lpFired) { lpFired = false; e.preventDefault(); return; }
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

  return { ACT: ACT, $: $, S: S, spr: spr, toast: toast, flash: flash, modal: modal, closeModal: closeModal, overlay: overlay, hub: hub, itemTile: itemTile, itemSheet: itemSheet, askOmen: askOmen, setHtml: setHtml, famHtml: famHtml, vib: vib, modLines: modLines, flushAch: flushAch, st: st, fmtMod: fmtMod, skillSheet: skillSheet, foeSheet: foeSheet, tagsHtml: tagsHtml, abIcons: abIcons };
})();
