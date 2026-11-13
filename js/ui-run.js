/* MORVANE — interface de la descente : combat, butin, salles, mort */
UI.run = (function () {
  'use strict';
  var E = ENGINE, D = DATA, $ = UI.$, S = UI.S, ACT = UI.ACT;
  var running = false, paused = false, last = 0, shownPhase = null, phaseTimer = null, els = {}, posOf = {}, floats = 0, built = null, fxL = null, lootShown = 0, combo = 0, comboT = null;
  // v2.0 : lumière, orbes, projectiles, primes
  var vfx = null, orbEls = {}, shotEls = {}, stopT = 0, primeKey = '', wiping = false, stepT = 0, lastTurn = '', moving = false, diceKey = '';
  var RANGED = { pyro: 'fire', necro: 'dark', chasseuse: 'blade', pretresse: 'holy' };
  var ORB = { gold: '💰', heal: '❤️', ult: '🌟', fury: '🔥' };
  var FXMAP = { burn: 'fire', bleed: 'blood', thorns: 'hit', chain: 'ice', skel: 'death', ally: 'hit', star: 'crit' };
  function sfxKind(x) { return x === 'skill_fire' ? 'fire' : x === 'skill_holy' || x === 'heal' ? 'holy' : x === 'skill_dark' ? 'dark' : x === 'skill_blade' ? 'blade' : 'war'; }
  function hitstop(ms) { stopT = Math.max(stopT, ms / 1000); }
  function punch() { anim($('#arena'), 'punch', 260); }
  var POS = [{ r: 24, b: 20 }, { r: 2, b: 30 }, { r: 42, b: 36 }, { r: 12, b: 48 }, { r: 40, b: 8 }];
  var BPOS = [{ r: 1, b: 20 }, { r: 47, b: 10 }, { r: 44, b: 44 }, { r: 60, b: 28 }];
  var BRAR = ['Commune', 'Rare', 'Épique', 'Légendaire'];
  var TIPS = ['Les objets que tu trouves restent à toi, même après la mort.', 'Brûle tes Cendres à l’Autel : les bonus sont permanents.', 'Un ennemi qui brille en jaune prépare un gros coup. Étourdis-le !', 'Recycle les vieux objets pour améliorer les bons.', 'Les Élites donnent un artefact. Risqué, mais rentable.', 'Garde une fiole pour le boss.', 'Chaque héros a sa propre Maîtrise : joue-les tous.', 'Retremper un objet le remet au niveau de ton record.', 'Un feu de camp avant le boss peut tout changer.'];

  function show() {
    UI.st.screen = 'run'; UI.closeModal(); UI.overlay(null);
    var run = S().run; if (!run) { UI.hub(); return; }
    var h = E.hero(run.hero);
    $('#screen').innerHTML =
      '<div class="runbar"><div class="grow"><div class="zone" id="rzone"></div><div class="pips" id="rpips"></div></div><span class="cur gold" id="rgold"></span><span class="cur ash" id="rcend"></span><button class="icon-btn" data-act="runMenu">☰</button></div>' +
      '<div class="arena" id="arena"></div>' +
      '<div class="hud"><div class="hpbar" id="hpbar"><i></i><u></u><b class="gh"></b><span></span></div><div class="xprow"><b id="rlvl"></b><div class="bar"><i id="xpbar"></i></div><span class="hsts" id="hsts"></span></div>' +
      '<div class="turnrow"><span class="aps" id="aps"></span><b id="tlabel"></b><span class="grow"></span><button class="tog" id="tauto" data-act="auto">AUTO</button><button class="tog" id="tspd" data-act="speed"></button><button class="tog help" data-act="help">?</button><button class="tog pass" id="tpass" data-act="pass">Passer ⏭</button></div>' +
      '<div class="skills"><button class="skb strike" id="bstrike" data-act="strike" data-info="strike"><span class="e">⚔️</span><span class="nm">Frapper</span></button>' + h.skills.map(function (k, i) { return '<button class="skb" id="sk' + i + '" data-act="skill" data-i="' + i + '" data-info="skill:' + i + '"><span class="e">' + k.icon + '</span><span class="cd"></span><span class="ev"></span><span class="nm">' + k.name + '</span><span class="n"></span></button>'; }).join('') +
      '<button class="skb potion" id="pot" data-act="potion" data-info="potion">🧪<span class="cnt"></span></button></div>' +
      '<div class="row2"><button class="act" id="bparry" data-act="parry" data-info="parry"><span class="ai">🤺</span><b>Parer</b><span class="cd"></span></button>' +
      '<button class="ultb" id="bult" data-act="ult" data-info="ult"><i></i><span>' + h.ult.icon + ' ' + h.ult.name + '</span></button>' +
      '<button class="act" id="bstance" data-act="stance" data-info="stance"><span class="ai"></span><b></b></button></div>' +
      '<button class="relics" id="relics" data-act="relics" style="width:100%"></button></div>';
    built = null; shownPhase = null; updateHud.key = null; lastTurn = ''; diceKey = '';
    if (run.phase !== 'combat') SND.music(zoneMusic(run));
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    syncPhase(true);
  }
  function zoneMusic(run) { return 'z' + E.zoneOf(run.floor).id; }
  function stop() { running = false; clearTimeout(phaseTimer); }
  function pause(p) { paused = p; last = performance.now(); }

  // ---------- arène ----------
  function buildArena() {
    var run = S().run, c = run.combat, z = E.zoneOf(run.floor), a = $('#arena');
    a.style.setProperty('--z1', z.bg[0]); a.style.setProperty('--z2', z.bg[1]); a.style.setProperty('--zc', z.color);
    var bg = typeof Backgrounds !== 'undefined' ? ' style="background-image:url(' + Backgrounds.url(z.id) + ')"' : ''; a.classList.add('hasbg'); a.classList.remove('danger');
    a.innerHTML = '<div class="abg"' + bg + '></div><div class="rays"></div><div class="fog f1"></div><div class="unit hero enter" id="uhero">' + UI.spr(run.hero) + '</div><div class="minions" id="minions"></div><div class="fog f2"></div><div class="vig"></div>' +
      '<button class="primes" id="primes" data-act="primes"></button><button class="cdice" id="cdice" data-act="cdice"></button><div class="combo" id="combo"></div>' + extraHtml(run);
    els = {}; posOf = {}; floats = 0; lootShown = 0; combo = 0; orbEls = {}; shotEls = {}; primeKey = '';
    vfx = typeof VFX !== 'undefined' ? VFX.attach(a) : null;
    fxL = typeof FX !== 'undefined' ? FX.attach(a, { ambient: ['dust', 'leaves', 'fireflies', 'gold', 'embers', 'void'][z.id - 1], warm: 2 }) : null;
    if (c && c.dice) showDice(c, { d: c.dice, id: c.dfx.id, name: c.dfx.name, icon: c.dfx.icon }, true);
    if (c) { c.enemies.forEach(function (e, i) { if (!e.dead) { addEnemy(e, i, false); els[e.id].style.animationDelay = (0.15 + i * 0.09) + 's'; } }); built = c; }
    else built = 'empty';
  }
  function addEnemy(e, i, spawn) {
    var c = S().run.combat, bossFight = c.enemies[0].boss || c.enemies[0].champ, P = bossFight ? BPOS : POS, used = {}, k;
    for (k in posOf) if (els[k] && !els[k].classList.contains('dead')) used[posOf[k]] = 1;
    var pi = 0; while (used[pi] && pi < P.length - 1) pi++;
    posOf[e.id] = pi;
    var d = document.createElement('div');
    d.className = 'unit en' + (e.boss ? ' boss' : e.elite ? ' elite' : '') + (spawn ? ' spawn' : '') + (e.fix ? ' fixed fx-' + e.fix : '') + (e.big ? ' giant' : '') + (e.gold ? ' golden' : '') + (e.champ ? ' champ' : '');
    d.id = 'en' + e.id; d.dataset.act = 'target'; d.dataset.i = i; d.dataset.info = 'foe:' + i;
    d.style.right = P[pi].r + '%'; d.style.bottom = P[pi].b + '%'; d.style.zIndex = 10 - Math.round(P[pi].b / 5);
    d.innerHTML = '<span class="warn">⚠️</span><div class="ename">' + e.name + ' <span class="abi">' + UI.abIcons(e.ab) + '</span></div><div class="cbar"><i></i></div><div class="ebar"><i></i><b class="gh"></b><u></u></div>' + UI.spr(e.key) + '<div class="sts"></div><span class="wk">🎯</span>';
    $('#arena').appendChild(d); els[e.id] = d;
  }
  function floatAt(el, txt, cls) {
    if (!el || floats > 28) return; var a = $('#arena'); if (!a) return;
    var f = document.createElement('div'); f.className = 'float ' + (cls || ''); f.textContent = txt;
    var ar = a.getBoundingClientRect(), r = el.getBoundingClientRect();
    f.style.left = (r.left - ar.left + r.width / 2 - 18 + (Math.random() * 36 - 18)) + 'px';
    f.style.top = (r.top - ar.top + r.height * 0.3 + (Math.random() * 20 - 10)) + 'px';
    a.appendChild(f); floats++;
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); floats--; }, 800);
  }
  // --- variété : condition de salle, mercenaire, annonces ---
  function extraHtml(run) {
    var r = run.room, h = '', cd = r.cond ? E.byId(D.CONDS, r.cond) : null;
    if (cd) h += '<button class="cond" id="cond" data-act="cond">' + cd.icon + ' <b>' + cd.name + '</b><span id="condt"></span></button>';
    if (r.waves) h += '<div class="cond" id="wavec">🏟️ <b>Vague <span id="waven">' + (r.wave || 1) + '</span>/' + r.waves + '</b></div>';
    if (run.ally) h += '<div class="ally" id="ally">' + UI.spr(run.ally) + '</div>';
    h += UI.famHtml('fam');
    return h;
  }
  function intro(run) {
    var r = run.room, cd = r.cond ? E.byId(D.CONDS, r.cond) : null;
    if (r.variant === 'horde') { banner('HORDE', 'ILS SONT NOMBREUX'); }
    else if (r.variant === 'champion') { banner('CHAMPION', 'UN MONSTRE GÉANT'); SND.play('boss_intro', 0.6); }
    else if (r.variant === 'porteur') { banner("PORTEUR D'OR", 'TUE-LE AVANT QU’IL FUIE'); SND.play('gold'); tuto('porteur', "💰 Le <b>Porteur d'or</b> s’enfuit au bout de 6 tours. Vise-le et tue-le vite : il est plein d’or."); }
    else if (r.type === 'arene') { banner('ARÈNE', 'VAGUE 1/3'); SND.play('boss_intro', 0.6); }
    else if (cd) banner(cd.name.toUpperCase(), 'CONDITION');
    if (cd) UI.toast(cd.icon + ' <b>' + cd.name + '</b> : ' + cd.desc, true);
    if (S().run.combat.enemies.some(function (x) { return x.fix && !x.champ; })) tuto('fix', '✴️ Les monstres au <b>nom doré</b> ont un pouvoir en plus (vampirique, explosif, géant...). Ils sont plus durs, mais rapportent plus.');
  }
  // Présentation d'une zone, la première fois qu'on y entre
  function zoneIntro(run) {
    var z = E.zoneOf(run.floor); if (S().tuto['zone' + z.id]) return; S().tuto['zone' + z.id] = 1;
    var set = D.SETS[z.id - 1];
    UI.modal('<div class="center tiny gold" style="letter-spacing:.3em">ZONE ' + z.id + ' / 6</div><h2 style="color:' + z.color + ';font-size:24px;margin:4px 0 10px">' + z.name + '</h2><p class="center" style="font-style:italic;line-height:1.5">' + z.lore + '</p>' +
      '<div class="li"><div class="ic">☠️</div><div class="grow"><b>Gardien : ' + D.ENEMIES[z.boss].name + '</b><div class="small dim">Il t’attend à l’étage ' + (Math.floor((run.floor - 1) / 10) * 10 + 10) + '. ' + z.mech + '</div></div></div>' +
      '<div class="li"><div class="ic">' + set.icon + '</div><div class="grow"><b style="color:#6dffb0">◆ ' + set.name + '</b><div class="small dim">Le set d’objets qu’on ne trouve qu’ici.</div></div></div>' +
      '<div class="btns"><button class="btn primary big" data-act="close">ENTRER</button></div>', true);
  }
  function ending() {
    UI.modal('<div class="center tiny gold" style="letter-spacing:.3em">FIN ?</div><h2 style="color:#b48cff;font-size:24px;margin:4px 0 10px">Le trône est vide</h2>' +
      '<p class="center" style="font-style:italic;line-height:1.5">L’armure s’effondre. La couronne roule à tes pieds. Pendant un instant, Morvane respire.</p>' +
      '<p class="center" style="font-style:italic;line-height:1.5">Puis le sol s’ouvre sous le trône. Il y a d’autres étages. Il y en a toujours eu.</p>' +
      '<div class="li on"><div class="ic">🕳️</div><div class="grow"><b>L’Abîme est ouvert</b><div class="small dim">Les six zones recommencent, plus profondes et plus cruelles : Abîme 1, 2, 3... Jusqu’où iras-tu ?</div></div></div>' +
      '<div class="center tiny dim" style="margin-top:8px">Merci d’avoir joué à Morvane.</div>' +
      '<div class="btns"><button class="btn primary big" data-act="close">DESCENDRE ENCORE</button></div>', true);
    SND.play('loot_unique'); UI.flash('#9b6bffaa'); UI.vib([60, 60, 60, 60, 200]);
  }
  ACT.cond = function () { var r = S().run && S().run.room, cd = r && r.cond ? E.byId(D.CONDS, r.cond) : null; if (cd) UI.toast(cd.icon + ' <b>' + cd.name + '</b> : ' + cd.desc, true); };
  // --- petits effets ---
  function center(el) { var a = $('#arena'); if (!el || !a) return null; var ar = a.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - ar.left + r.width / 2, y: r.top - ar.top + r.height * 0.55, w: ar.width, h: ar.height, b: r.bottom - ar.top }; }
  function fxAt(el, kind, n) {
    if (!vfx) return; var p = center(el); if (!p) return;
    if (kind === 'heal') VFX.sparks(vfx, p.x, p.y + 20, 'heal', n, { speed: 110, g: -260, life: 1, streak: false });
    else VFX.sparks(vfx, p.x, p.y, FXMAP[kind] || kind, n, kind === 'death' ? { speed: 200, g: -120, life: 1 } : null);
  }
  function impactAt(el, crit) { if (!vfx) return; var p = center(el); if (p) VFX.impact(vfx, p.x + (Math.random() * 30 - 15), p.y + (Math.random() * 30 - 15), crit); }
  // Le héros bondit sur sa cible (ou tire, s'il se bat à distance)
  function heroSwing(c) {
    var hero = $('#uhero'), run = S().run, te = c.enemies[c.target], el = te && !te.dead ? els[te.id] : null; if (!hero) return;
    var kind = RANGED[run.hero], a = center(hero), b = center(el);
    if (kind || !a || !b) { anim(hero, 'cast', 220); if (kind && a && b && vfx) VFX.proj(vfx, a.x + 26, a.y - 16, b.x, b.y, kind, 0.12); return; }
    hero.style.setProperty('--dx', Math.round((b.x - a.x) * 0.5) + 'px'); hero.style.setProperty('--dy', Math.round((b.y - a.y) * 0.5) + 'px');
    anim(hero, 'atk', 240);
  }
  function foeSwing(el) {
    var a = center(el), b = center($('#uhero')); if (!a || !b) return;
    el.style.setProperty('--dx', Math.round((b.x - a.x) * 0.42) + 'px'); el.style.setProperty('--dy', Math.round((b.y - a.y) * 0.42) + 'px');
    anim(el, 'atk', 280);
  }
  // --- dés de combat ---
  function showDice(c, e, still) {
    var el = $('#cdice'); if (!el) return;
    el.className = 'cdice k-' + e.id + (still ? '' : ' roll'); el.innerHTML = die(e.d[0]) + die(e.d[1]) + (e.name ? '<b>' + e.icon + ' ' + e.name + '</b>' : '') + '<em id="cdre"></em>';
    if (still) return;
    void el.offsetWidth; SND.play('click', 0.8); setTimeout(function () { SND.play('click', 0.6); }, 90);
    if (e.id !== 'rien') {
      var hero = $('#uhero'), big = e.id === 'jackpot' || e.id === 'double' || e.id === 'sept';
      setTimeout(function () { floatAt(hero, e.name + ' !', big ? 'crit' : 'txt'); SND.play(e.id === 'jackpot' ? 'loot_legend' : big ? 'upgrade' : 'equip', 0.7); var h = center(hero); if (vfx && h) { VFX.ring(vfx, h.x, h.y, big ? 'gold' : 'ice', big ? 120 : 70, 0.4, 5); if (big) VFX.sparks(vfx, h.x, h.y, 'gold', e.id === 'jackpot' ? 50 : 20, { speed: 300, g: -160, life: 1 }); } if (e.id === 'jackpot') { UI.flash('#f2bd5e88'); UI.vib([30, 30, 80]); } }, 380);
      tuto('dice', '🎲 <b>Dés de combat.</b> Deux dés au début de chaque tour : double = +1 action, 7 = pouvoirs gratuits, 10 ou plus = +40 % dégâts, 4 ou moins = protection, deux chiffres qui se suivent = coup critique. Touche les dés pour les <b>relancer</b> (1 fois par combat).');
    }
  }
  ACT.cdice = function () {
    var run = S().run, c = run && run.combat; if (!c) return;
    if (E.rerollDice()) { SND.play('click'); return; }
    UI.toast('🎲 <b>' + c.dice[0] + ' + ' + c.dice[1] + (c.dfx.name ? ' : ' + c.dfx.name : '') + '</b><br>' + c.dfx.desc + (c.rerolls > 0 ? '<br><span class="dim">Relance possible au début de ton tour, avant d’agir.</span>' : '<br><span class="dim">Plus de relance pour ce combat.</span>'), true);
  };
  // --- orbes à ramasser ---
  function addOrb(e) {
    var a = $('#arena'); if (!a) return; var p = center(els[e.id]) || { x: a.clientWidth * 0.62, b: a.clientHeight * 0.7 };
    var b = document.createElement('button'); b.className = 'orb k-' + e.kind; b.dataset.oid = e.oid; b.innerHTML = '<i></i><span>' + ORB[e.kind] + '</span>';
    b.style.left = Math.max(34, Math.min(a.clientWidth - 34, p.x + Math.random() * 110 - 55)) + 'px';
    b.style.top = Math.max(70, Math.min(a.clientHeight - 30, p.b - 16 + Math.random() * 34 - 8)) + 'px';
    a.appendChild(b); orbEls[e.oid] = b;
    tuto('orb', '🔮 <b>Des orbes !</b> Les ramasser ne coûte aucune action, mais elles s’éteignent au bout de 3 tours : 💰 or, ❤️ soin, 🌟 ultime, 🔥 fureur (+30 % dégâts).');
  }
  function dropOrb(oid, cls) { var b = orbEls[oid]; if (!b) return null; delete orbEls[oid]; b.classList.add(cls); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 320); return b; }
  function takeOrb(e) {
    var b = dropOrb(e.oid, 'take'), a = $('#arena'); if (!b || !a) return;
    var x = parseFloat(b.style.left), y = parseFloat(b.style.top), h = center($('#uhero'));
    if (vfx) { VFX.ring(vfx, x, y, e.kind === 'ult' ? 'ice' : e.kind, 46, 0.3, 4); if (e.kind === 'gold') VFX.absorb(vfx, x, y, a.clientWidth - 135, -6, 'gold', 7); else if (h) VFX.absorb(vfx, x, y, h.x, h.y, e.kind === 'ult' ? 'ice' : e.kind, 7); }
    floatAt(b, e.kind === 'gold' ? '+' + e.v + ' 💰' : e.kind === 'heal' ? '+' + E.fmt(Math.max(1, e.v)) + ' PV' : e.kind === 'ult' ? '+12 % ultime' : 'FUREUR !', e.kind === 'gold' ? 'gold' : e.kind === 'heal' ? 'heal' : e.kind === 'fury' ? 'big' : 'txt');
    if (!e.end) { SND.play(e.kind === 'gold' ? 'gold' : e.kind === 'heal' ? 'heal' : 'upgrade', 0.7); UI.vib(10); }
    if (e.kind === 'gold') setTimeout(function () { anim($('#rgold'), 'bump', 300); }, 400);
  }
  // --- projectiles à renvoyer ---
  function addShot(e) {
    var a = $('#arena'), p = center(els[e.id]), q = center($('#uhero')); if (!a || !p || !q) return;
    var n = Object.keys(shotEls).length, b = document.createElement('button'); b.className = 'shot near'; b.dataset.sid = e.sid; b.innerHTML = '<i></i><span>💀</span>';
    b.style.transform = 'translate(' + (p.x - 18) + 'px,' + (p.y - 22) + 'px)'; a.appendChild(b);
    var x = q.x + 74 + n * 46, y = q.y - 78 - (n % 2) * 26;
    shotEls[e.sid] = { el: b, x: x, y: y, x2: q.x + 8, y2: q.y - 12 };
    void b.offsetWidth; b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    SND.play('skill_dark', 0.45);
    tuto('shot', '💀 <b>Crâne maudit !</b> Il te tombera dessus à la fin du tour ennemi. Touche-le pour le <b>renvoyer</b> (1 action) : gros dégâts sur celui qui l’a lancé.');
  }
  function endShot(sid) { var o = shotEls[sid]; if (!o) return null; delete shotEls[sid]; if (o.el.parentNode) o.el.parentNode.removeChild(o.el); return o; }
  document.addEventListener('pointerdown', function (ev) {
    if (UI.st.screen !== 'run' || paused) return; var t = ev.target.closest ? ev.target.closest('.orb, .shot') : null; if (!t) return;
    if (t.dataset.oid) E.takeOrb(+t.dataset.oid); else if (t.dataset.sid && !E.deflect(+t.dataset.sid)) { SND.play('error'); UI.toast('Renvoyer un crâne coûte une action, pendant ton tour.'); }
  });
  // --- primes ---
  function updatePrimes(run) {
    var info = E.primeInfo(run), key = info.map(function (p) { return p.def.id + p.have; }).join('|'); if (key === primeKey) return; primeKey = key;
    var el = $('#primes'); if (!el) return;
    el.innerHTML = info.map(function (p) { return '<span class="pr"><em>' + p.def.icon + '</em><b>' + p.have + '</b>/' + p.need + '<i style="width:' + (p.have / p.need * 100) + '%"></i></span>'; }).join('');
  }
  function drainPrimes(run) {
    while (run.primeLog && run.primeLog.length) {
      var x = run.primeLog.shift(), p = E.byId(D.PRIMES, x.id); if (!p) continue;
      UI.toast('🎯 <b>Prime remplie : ' + p.name + '</b><br>Récompense : ' + x.txt, true); SND.play('levelup', 0.7); anim($('#primes'), 'bump', 300); updateHud.key = null;
      var h = center($('#uhero')); if (vfx && h) { VFX.pillar(vfx, h.x, h.y, 'gold', 60, 0.7); VFX.sparks(vfx, h.x, h.y, 'gold', 22, { speed: 240, g: -200, life: 1 }); }
    }
  }
  ACT.primes = function () {
    var run = S().run; if (!run) return; SND.play('click');
    var h = '<h2>🎯 Primes</h2><div class="tiny dim center" style="margin:-6px 0 10px">Trois objectifs en cours. Une prime remplie paie tout de suite, et une autre la remplace.' + (run.primesDone ? ' · ' + run.primesDone + ' remplie' + (run.primesDone > 1 ? 's' : '') + ' cette descente' : '') + '</div>';
    E.primeInfo(run).forEach(function (p) { h += '<div class="li"><div class="ic">' + p.def.icon + '</div><div class="grow"><div class="row"><b class="grow">' + p.def.name + '</b><b class="gold">' + p.have + ' / ' + p.need + '</b></div><div class="small dim">' + p.def.desc + '</div><div class="bar" style="margin:5px 0 4px"><i style="width:' + (p.have / p.need * 100) + '%"></i></div><div class="tiny">Récompense : ' + p.reward + '</div></div></div>'; });
    h += '<div class="btns"><button class="btn primary" data-act="close">Fermer</button></div>'; UI.modal(h);
  };
  // --- changement de salle : rideau noir, titre, puis la salle apparaît ---
  function wipe(title, sub, fn) {
    var w = document.createElement('div'); w.className = 'wipe'; w.innerHTML = '<div><small>' + sub + '</small><b>' + title + '</b></div>'; $('#app').appendChild(w); wiping = true;
    setTimeout(function () { wiping = false; fn(); hitstop(450); w.classList.add('out'); }, 430);
    setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 1100);
  }
  function slash(el, crit) {
    var p = center(el), a = $('#arena'); if (!p || floats > 28) return;
    var s = document.createElement('i'); s.className = 'slash' + (crit ? ' crit' : ''); s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; s.style.setProperty('--rot', (Math.random() * 100 - 50) + 'deg');
    a.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 240);
  }
  function comboUp() {
    combo++; if (combo > (S().stats.maxCombo || 0)) S().stats.maxCombo = combo; var c = $('#combo'); if (!c) return;
    if (combo >= 5) { c.textContent = 'COMBO x' + combo; c.className = 'combo on' + (combo >= 50 ? ' c3' : combo >= 20 ? ' c2' : ''); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
    clearTimeout(comboT); comboT = setTimeout(comboBreak, 3500);
  }
  function comboBreak() { combo = 0; var c = $('#combo'); if (c) c.className = 'combo'; }
  function souls(el, n, coins) {
    var p = center(el); if (!p) return;
    if (vfx) { VFX.absorb(vfx, p.x, p.y, p.w - 50, -6, 'fire', n + 2); VFX.absorb(vfx, p.x, p.y, p.w - 135, -6, 'gold', coins + 1); }
    setTimeout(function () { anim($('#rcend'), 'bump', 300); anim($('#rgold'), 'bump', 300); }, 650);
  }
  function dropGems(c, el) {
    var p = center(el), a = $('#arena'); if (!p || !a) return;
    c.drops.slice(lootShown).forEach(function (g, i) {
      var d = document.createElement('i'); d.className = 'gem r' + g.item.rar; d.style.left = (p.x - 8 + (i - 0.5) * 22 + Math.random() * 10) + 'px'; d.style.top = (p.b - 26 + Math.random() * 8) + 'px';
      a.appendChild(d); if (g.item.rar >= 3) fxAt(el, g.item.rar >= 4 ? 'crit' : 'star', 14);
    });
    if (c.drops.length > lootShown) SND.play('loot', 0.7);
    lootShown = c.drops.length;
  }
  function anim(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, ms || 260); }
  function banner(big, small) { var a = $('#arena'); if (!a) return; var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = (small ? '<small>' + small + '</small>' : '') + big; a.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 2000); }
  function tuto(key, msg) { if (S().tuto[key]) return; S().tuto[key] = 1; UI.toast(msg, true); }

  function drain(c) {
    var run = S().run, hero = $('#uhero'), evs = c.events, i, e, el;
    for (i = 0; i < evs.length; i++) {
      e = evs[i]; el = e.id ? els[e.id] : null;
      switch (e.k) {
        case 'start': SND.music(zoneMusic(run)); intro(run); if (!S().tuto['help_' + run.hero]) { S().tuto['help_' + run.hero] = 1; helpSheet(true); } else zoneIntro(run); tuto('skill', '🎲 <b>Tour par tour.</b> À chaque tour tu as <b>2 actions ⚡</b> : ⚔️ Frapper, un pouvoir, 🤺 Parer... Ensuite, chaque ennemi joue.'); tuto('aim', '👆 Touche un ennemi pour le <b>viser</b>. Touche-le encore (ou ⚔️ Frapper) pour le <b>frapper</b>.'); tuto('press', '🔎 <b>Appui long</b> sur un pouvoir ou sur un ennemi : sa fiche s’ouvre et le combat se met en pause.'); break;
        case 'boss': SND.music(E.zoneOf(run.floor).id === 6 ? 'final' : 'boss'); SND.play('boss_intro'); banner(c.enemies[0].name.toUpperCase(), 'BOSS'); UI.flash('#c2283a66'); UI.vib(80); if (E.zoneOf(run.floor).taunt.length > 4) UI.toast('<i>« ' + E.zoneOf(run.floor).taunt + ' »</i>', true); break;
        case 'dmg':
          if (e.sh) { floatAt(el, 'Bouclier', 'txt'); break; }
          floatAt(el, E.fmt(e.v), e.crit ? 'crit' : e.dot ? 'dot' : '');
          if (e.dot) fxAt(el, e.dot, 4); else { impactAt(el, e.crit); comboUp(); }
          if (!e.dot) { anim(el, 'hit', 220); SND.play(e.crit ? 'crit' : 'hit'); if (e.crit && e.skill) { anim($('#arena'), 'shake', 250); hitstop(55); } else if (e.crit) punch(); }
          break;
        case 'miss': floatAt(el, e.hid ? 'Hors d’atteinte' : 'Esquive', 'txt'); break;
        case 'swing': heroSwing(c); break;
        case 'eatk': if (el) foeSwing(el); break;
        case 'hurt':
          if (e.sh) { floatAt(hero, 'Absorbé', 'txt'); SND.play('block', 0.5); break; }
          floatAt(hero, '-' + E.fmt(e.v), e.big ? 'big' : e.dot ? 'dot' : 'hurt');
          fxAt(hero, e.dot && e.dot !== 'thorns' ? e.dot : 'blood', e.big ? 26 : e.dot ? 3 : 8); if (e.big) { comboBreak(); var hb0 = center(hero); if (vfx && hb0) { VFX.ring(vfx, hb0.x, hb0.y, 'blood', 120, 0.4, 8); VFX.flash(vfx, hb0.x, hb0.y, 'blood', 120, 0.25); } hitstop(70); }
          if (!e.dot) { anim(hero, 'hit', 250); SND.play(e.block ? 'block' : 'hurt'); }
          if (e.big) { anim($('#arena'), 'shake', 250); UI.flash('#c2283a55'); UI.vib(60); }
          if (run.hp / run.stats.hp < 0.4 && run.potions > 0) tuto('potion', '🧪 PV bas ! Touche la <b>fiole rouge</b> pour te soigner.');
          break;
        case 'dodge': floatAt(hero, 'Esquive !', 'txt'); break;
        case 'heal': if (e.v > run.stats.hp * 0.02) { floatAt(hero, '+' + E.fmt(e.v), 'heal'); fxAt(hero, 'heal', 7); } break;
        case 'skill': var skd = E.hero(run.hero).skills[e.i]; if (skd) tuto('sk_' + skd.id, skd.icon + ' <b>' + skd.name + '</b> : ' + skd.desc); SND.play(e.sfx); floatAt(hero, e.name, 'txt'); anim(hero, 'cast', 220);
          var pts = [], seen = {}, hc = center(hero), kd = sfxKind(e.sfx);
          for (var j = i + 1; j < evs.length && evs[j].k !== 'skill' && evs[j].k !== 'ult'; j++) if (evs[j].k === 'dmg' && evs[j].skill && els[evs[j].id] && !seen[evs[j].id]) { seen[evs[j].id] = 1; pts.push(center(els[evs[j].id])); }
          if (vfx && hc) { VFX.cast(vfx, kd, hc.x, hc.y, pts); if (!pts.length) { VFX.pillar(vfx, hc.x, hc.y, kd, 64, 0.6); VFX.sparks(vfx, hc.x, hc.y + 20, kd, 18, { speed: 160, g: -300, life: 1 }); } }
          anim($('#sk' + e.i), 'fire', 300); break;
        case 'potion': SND.play('potion'); break;
        case 'die': if (el) { var dp = center(el); if (vfx && dp) VFX.death(vfx, dp.x, dp.y, e.boss); souls(el, e.boss ? 12 : 3, e.boss ? 10 : 3); dropGems(c, el); el.classList.add('dead'); el.classList.remove('charging'); } SND.play(e.boss ? 'boss_die' : 'die'); if (e.boss) { UI.flash('#ffffffaa'); anim($('#arena'), 'shake', 250); hitstop(160); UI.vib([40, 40, 120]); } break;
        case 'pturn': var tl = $('#tlabel'); if (tl) { tl.textContent = 'Tour ' + e.n; } anim($('#aps'), 'bump', 300); if (e.n > 1) { floatAt(hero, 'À toi', 'txt'); } document.querySelectorAll('.unit.en.acting').forEach(function (x) { x.classList.remove('acting'); }); break;
        case 'dice': showDice(c, e, false); break;
        case 'eturn': document.querySelectorAll('.unit.en.acting').forEach(function (x) { x.classList.remove('acting'); }); if (el) el.classList.add('acting'); break;
        case 'stunned': floatAt(el, 'Étourdi', 'txt'); break;
        case 'slowed': floatAt(hero, 'Entravé...', 'hurt'); break;
        case 'skel': anim($('#minions'), 'atk', 220); break;
        case 'orb': addOrb(e); break;
        case 'orbGone': dropOrb(e.oid, 'gone'); break;
        case 'orbTake': takeOrb(e); break;
        case 'shot': addShot(e); break;
        case 'shotGone': endShot(e.sid); break;
        case 'shotHit': var so = endShot(e.sid); if (so && vfx) { VFX.line(vfx, so.x, so.y, so.x2, so.y2, 'curse', 6, 0.2); VFX.flash(vfx, so.x2, so.y2, 'curse', 90, 0.22); VFX.sparks(vfx, so.x2, so.y2, 'curse', 16, { speed: 300 }); } break;
        case 'deflect': var sd = endShot(e.sid), dt0 = center(el);
          if (sd && vfx) { VFX.ring(vfx, sd.x, sd.y, 'curse', 70, 0.3, 6); VFX.flash(vfx, sd.x, sd.y, 'curse', 80, 0.18); if (dt0) VFX.proj(vfx, sd.x, sd.y, dt0.x, dt0.y, 'curse', 0.16, function () { VFX.ring(vfx, dt0.x, dt0.y, 'curse', 90, 0.35, 6); VFX.sparks(vfx, dt0.x, dt0.y, 'curse', 20, { speed: 340 }); }); }
          floatAt(el || hero, 'RENVOYÉ !', 'crit'); SND.play('block'); UI.vib(20); hitstop(45); punch(); break;
        case 'charge': tuto('charge', '⚠️ <b>Attaque chargée !</b> Il frappera très fort à son prochain tour. Dépense une action pour <b>🤺 Parer</b> : le coup est annulé et tu ripostes. L’étourdir marche aussi.'); break;
        case 'interrupt': floatAt(el, 'Interrompu !', 'txt'); break;
        case 'enrage': floatAt(el, 'ENRAGÉ', 'big'); var ep = center(el); if (vfx && ep) { VFX.ring(vfx, ep.x, ep.y, 'fury', 120, 0.45, 8); VFX.sparks(vfx, ep.x, ep.y, 'fury', 20, { speed: 280, g: -160 }); } break;
        case 'summon': var idx = -1; c.enemies.forEach(function (x, j) { if (x.id === e.id) idx = j; }); if (idx >= 0) { addEnemy(c.enemies[idx], idx, true); if (!e.quiet) floatAt(els[e.id], 'Invoqué', 'txt'); var sp0 = center(els[e.id]); if (vfx && sp0) { VFX.flash(vfx, sp0.x, sp0.y, 'dark', 80, 0.3); VFX.ring(vfx, sp0.x, sp0.y + 20, 'dark', 70, 0.4, 4); } } break;
        case 'eheal': floatAt(el, 'Soin', 'heal'); break;
        case 'eshield': floatAt(el, 'Bouclier', 'txt'); break;
        case 'revive': fxAt(hero, 'gold', 40); var rv = center(hero); if (vfx && rv) { VFX.pillar(vfx, rv.x, rv.y, 'holy', 110, 1); VFX.ring(vfx, rv.x, rv.y, 'holy', 160, 0.6, 8); } UI.flash('#ffe9b8cc'); SND.play('skill_holy'); banner('RESSUSCITÉ', ''); break;
        case 'fury': UI.toast('🌑 Les ténèbres se referment : les ennemis frappent de plus en plus fort !'); break;
        case 'explode': UI.flash('#9aa04a55'); break;
        case 'dead': UI.vib([80, 60, 160]); SND.play('death'); UI.flash('#000000dd'); break;
        case 'parryOn': anim(hero, 'parry', 1000); SND.play('equip'); break;
        case 'parry': if (e.perfect) { UI.vib(30); fxAt(hero, 'ice', 24); var pc = center(hero); if (vfx && pc) { VFX.ring(vfx, pc.x + 20, pc.y, 'ice', 130, 0.4, 8); VFX.flash(vfx, pc.x + 20, pc.y, 'ice', 110, 0.2); } hitstop(90); floatAt(hero, 'PARADE PARFAITE !', 'crit'); UI.flash('#ffe9b888'); SND.play('block'); anim($('#arena'), 'shake', 250); } else { floatAt(hero, 'Paré', 'txt'); SND.play('block', 0.6); } break;
        case 'ult': var uc = center(hero), upts = []; c.enemies.forEach(function (x) { if (els[x.id] && !els[x.id].classList.contains('dead')) upts.push(center(els[x.id])); });
          if (vfx && uc) { VFX.pillar(vfx, uc.x, uc.y, 'ult', 120, 0.9); VFX.cast(vfx, sfxKind(e.sfx), uc.x, uc.y, upts, true); VFX.sparks(vfx, uc.x, uc.y, 'ult', 50, { speed: 420, g: -80, life: 1.2 }); } hitstop(140); banner(e.name.toUpperCase(), 'ULTIME'); UI.flash('#d9a441aa'); SND.play(e.sfx); SND.play('levelup', 0.6); anim($('#arena'), 'shake', 250); break;
        case 'weak': tuto('weak', '🎯 <b>Point faible !</b> Ce tour-ci, frappe l’ennemi marqué d’une cible : coup critique énorme pour une seule action.'); break;
        case 'weakhit': fxAt(el, 'star', 22); var wp = center(el); if (vfx && wp) { VFX.ring(vfx, wp.x, wp.y, 'crit', 110, 0.35, 7); VFX.flash(vfx, wp.x, wp.y, 'crit', 120, 0.2); } hitstop(80); floatAt(el, 'POINT FAIBLE !', 'crit'); anim($('#arena'), 'shake', 250); break;
        case 'flee': if (el) { floatAt(el, 'Il s’enfuit !', 'txt'); el.classList.add('dead'); } SND.play('error'); break;
        case 'wave': banner('VAGUE ' + e.n + '/' + e.of, 'ARÈNE'); SND.play('door'); var wn = $('#waven'); if (wn) wn.textContent = e.n; break;
        case 'ally': anim($('#ally'), 'atk', 220); break;
        case 'bossfx': floatAt(el, e.txt, e.big ? 'big' : 'crit'); if (e.hero) floatAt(hero, e.hero, 'txt'); if (e.big) { anim($('#arena'), 'shake', 250); UI.flash('#c2283a44'); SND.play('boss_intro', 0.5); } tuto('mech' + E.zoneOf(run.floor).id, '☠️ <b>Spécialité du boss</b> : ' + E.zoneOf(run.floor).mech); break;
        case 'elanbreak': floatAt(hero, 'Élan brisé', 'hurt'); break;
        case 'evo': fxAt(hero, 'star', 10); break;
        case 'free': floatAt(hero, 'Rechargé !', 'crit'); anim($('#sk' + e.i), 'bump', 300); SND.play('upgrade', 0.6); break;
        case 'win': break;
      }
    }
    evs.length = 0;
  }
  function stIcons(st) { return (st.burn ? '🔥' : '') + (st.poison ? '☠️' + (st.poison.n > 1 ? st.poison.n : '') : '') + (st.bleed ? '🩸' : '') + (st.stun > 0 ? '💫' : '') + (st.weak > 0 ? '⬇️' : '') + (st.slow > 0 ? '🕸️' : '') + (st.vuln > 0 ? '🎯' : ''); }
  function updateHud() {
    var run = S().run; if (!run) return; var c = run.combat, stt = run.stats, z = E.zoneOf(run.floor), pos = ((run.floor - 1) % 10) + 1, i;
    var key = run.floor + '|' + run.gold + '|' + run.cendres + '|' + run.lvl + '|' + Object.keys(run.boons).length + run.artifacts.length + '|' + run.evos.length;
    if (updateHud.key !== key) {
      updateHud.key = key;
      $('#rzone').innerHTML = '<b style="color:' + z.color + '">' + z.name + '</b> · étage ' + run.floor + (E.cycleOf(run.floor) ? ' · <span class="bad">Abîme ' + E.cycleOf(run.floor) + '</span>' : '');
      var p = ''; for (i = 1; i <= 10; i++) p += '<i class="' + (i <= pos ? 'on' : '') + (i === 10 ? ' boss' : '') + '"></i>';
      $('#rpips').innerHTML = p; $('#rgold').textContent = '💰 ' + run.gold; $('#rcend').textContent = '🔥 ' + E.fmt(run.cendres);
      $('#rlvl').textContent = 'Niv. ' + run.lvl;
      var rel = ''; run.artifacts.forEach(function (id) { rel += E.byId(D.ARTIFACTS, id).icon; });
      for (var b in run.boons) { var bo = E.boonById(b); rel += bo.icon; }
      if (run.evos.length) rel = '✨' + run.evos.length + ' ' + rel;
      E.hero(run.hero).skills.forEach(function (k, si) { var n = k.evos.filter(function (v) { return run.evos.indexOf(v.id) >= 0; }).length, se = $('#sk' + si); if (se) se.children[2].textContent = n === 2 ? '✦✦' : n ? '✦' : ''; });
      $('#relics').innerHTML = rel ? rel + '<span class="more"> ›</span>' : '<span class="more">Aucune aubaine pour l’instant</span>';
    }
    var hb = $('#hpbar'), frac = Math.max(0, run.hp / stt.hp), sh = c ? c.hero.shield : 0;
    hb.firstChild.style.width = (frac * 100) + '%'; hb.children[1].style.width = Math.min(100, sh / stt.hp * 100) + '%'; hb.children[2].style.width = (frac * 100) + '%';
    var ar0 = $('#arena'); if (ar0) ar0.classList.toggle('danger', frac < 0.3 && run.phase === 'combat');
    updatePrimes(run); drainPrimes(run);
    hb.lastChild.textContent = E.fmt(Math.ceil(run.hp)) + ' / ' + E.fmt(stt.hp) + (sh >= 1 ? '  (+' + E.fmt(sh) + ')' : '');
    hb.classList.toggle('low', frac < 0.3);
    $('#xpbar').style.width = Math.min(100, run.xp / E.xpNeed(run.lvl) * 100) + '%';
    $('#hsts').textContent = c ? stIcons(c.hero.st) + (c.hero.elan ? ' ⚡x' + c.hero.elan : '') : '';
    var charging = !!c && !c.over && c.enemies.some(function (x) { return !x.dead && x.charge; }), hsk = E.hero(run.hero).skills;
    var mine = !!c && !c.over && c.turn === 'hero' && run.phase === 'combat', ap = mine ? c.hero.ap : 0;
    var hud = document.querySelector('.hud'); if (hud) hud.classList.toggle('wait', !!c && !c.over && run.phase === 'combat' && !mine);
    var apk = (c && run.phase === 'combat' ? ap : -1) + ''; var apsEl = $('#aps');
    if (apsEl && apsEl.dataset.k !== apk) { apsEl.dataset.k = apk; var ah = ''; for (i = 0; i < Math.max(E.AP, ap); i++) ah += '<i class="' + (i < ap ? 'on' : '') + '"></i>'; apsEl.innerHTML = ah; }
    $('#bstrike').classList.toggle('ready', mine && ap > 0 && !S().settings.auto); $('#tpass').classList.toggle('off', !mine);
    for (i = 0; i < 3; i++) {
      var b2 = $('#sk' + i), ok = E.skillUnlocked(run.hero, i);
      if (!ok) { if (!b2.classList.contains('locked')) { b2.className = 'skb locked'; b2.firstChild.textContent = '🔒'; } continue; }
      var cd = c ? Math.max(0, c.hero.cds[i]) : 0, tot = E.skillCd(run, i), ready = mine && cd <= 0;
      b2.style.setProperty('--p', (cd / tot * 100) + '%'); b2.lastChild.textContent = cd > 0 ? E.turns(cd) : '';
      b2.classList.toggle('cool', cd > 0); b2.classList.toggle('ready', !!ready && !S().settings.auto);
      var hint = !!ready && charging && hsk[i].tags.indexOf('Interrompt') >= 0;
      if (b2.dataset.h !== (hint ? '1' : '0')) { b2.dataset.h = hint ? '1' : '0'; b2.classList.toggle('hint', hint); b2.children[3].textContent = hint ? 'INTERROMPS !' : hsk[i].name; }
    }
    var ult = Math.min(100, run.ult || 0), bu = $('#bult'), inC = c && !c.over && run.phase === 'combat';
    bu.firstChild.style.width = ult + '%'; bu.classList.toggle('ready', ult >= 100);
    if (ult >= 100 && inC) { var hu0 = E.hero(run.hero).ult; tuto('ult_' + run.hero, '🌟 <b>Ultime prêt : ' + hu0.name + '</b><br>' + hu0.desc + '<br><span class="dim">Touche la grande barre dorée. Elle se recharge en combattant.</span>'); }
    var bp = $('#bparry'), pcd = c ? Math.max(0, c.hero.parryCd) : 0;
    bp.classList.toggle('cool', pcd > 0); bp.lastChild.textContent = pcd > 0 ? E.turns(pcd) : ''; bp.classList.toggle('alert', !!inC && pcd <= 0 && c.enemies.some(function (x) { return !x.dead && x.charge; }));
    var bs = $('#bstance'), stn = run.stance || 'n';
    if (bs.dataset.s !== stn) { bs.dataset.s = stn; bs.firstChild.textContent = stn === 'a' ? '🗡️' : stn === 'd' ? '🛡️' : '⚖️'; bs.children[1].textContent = stn === 'a' ? 'Assaut' : stn === 'd' ? 'Garde' : 'Équilibre'; }
    var pt = $('#pot'); pt.lastChild.textContent = run.potions; pt.classList.toggle('cool', run.potions <= 0);
    $('#tauto').classList.toggle('on', !!S().settings.auto); $('#tspd').textContent = 'x' + S().settings.speed; $('#tspd').classList.toggle('on', S().settings.speed > 1);
  }
  function updateArena() {
    var run = S().run, c = run && run.combat; if (!c) return;
    c.enemies.forEach(function (e, i) {
      var el = els[e.id]; if (!el) return; if (e.dead) { el.children[3].firstChild.style.width = '0%'; return; }
      var bar = el.children[3]; bar.firstChild.style.width = bar.children[1].style.width = Math.max(0, e.hp / e.maxhp * 100) + '%'; bar.lastChild.style.width = Math.min(100, e.shield / e.maxhp * 100) + '%';
      el.classList.toggle('charging', !!e.charge);
      if (e.charge) el.children[2].firstChild.style.width = ((1 - e.charge.t / e.charge.total) * 100) + '%';
      el.classList.toggle('tg', c.target === i && c.enemies.filter(function (x) { return !x.dead; }).length > 1);
      el.classList.toggle('enraged', e.enraged); el.classList.toggle('hidden', e.hidden > 0);
      var s = stIcons(e.st), se = el.children[5]; if (se.textContent !== s) se.textContent = s;
      el.classList.toggle('weak', !!c.weak && c.weak.id === e.id);
    });
    var ctm = $('#condt'); if (ctm && c.cond === 'defi') { var left = Math.max(0, Math.ceil((20 - c.t) / E.ROUND)); ctm.textContent = ' ' + left + ' tour' + (left > 1 ? 's' : ''); ctm.parentNode.classList.toggle('late', left <= 0); }
    var hu = $('#uhero'); if (hu) { hu.classList.toggle('invuln', c.hero.invuln > 0); hu.classList.toggle('undying', !!c.hero.buffs.undying); }
    if (hu) hu.classList.toggle('fury', !!c.hero.buffs.fury);
    var cre = $('#cdre'), canRe = !c.over && c.turn === 'hero' && !c.acted && c.rerolls > 0, crt = canRe ? '↻ ' + c.rerolls : ''; if (cre && cre.textContent !== crt) { cre.textContent = crt; $('#cdice').classList.toggle('canre', canRe); }
    for (var oi = 0; oi < c.orbs.length; oi++) { var ob = orbEls[c.orbs[oi].oid]; if (ob) ob.classList.toggle('last', c.orbs[oi].t <= E.ROUND); }
    var m = $('#minions'), n = c.hero.skel || 0;
    if (m && m.children.length !== n) { var h = ''; for (var i = 0; i < n; i++) h += UI.spr('serviteur'); m.innerHTML = h; }
  }
  function frame(ts) {
    if (!running) return;
    var dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    var run = S().run;
    if (run && UI.st.screen === 'run') {
      var c = run.combat;
      if (run.phase === 'combat' && c) {
        if (built !== c) buildArena();
        if (c.turn !== lastTurn) { lastTurn = c.turn; stepT = c.turn === 'foes' ? 0.55 : 0.6; }
        if (stopT > 0) stopT -= dt;
        else if (!paused && !wiping && !c.over && !$('#modal').classList.contains('on')) {
          stepT -= dt * (S().settings.speed || 1);
          if (stepT <= 0) {
            if (c.turn === 'foes') stepT = E.foeStep() ? 0.6 : 0.3;
            else if (S().settings.auto) { E.autoAct(); stepT = 0.5; }
            else stepT = 0;
          }
        }
      }
      if (c && built === c) { if (c.events.length) drain(c); updateArena(); }
      updateHud(); syncPhase(false);
    }
    requestAnimationFrame(frame);
  }
  // Affiche la bonne fenêtre selon la phase de la descente
  function syncPhase(now) {
    var run = S().run; if (!run) return;
    var key = run.phase + '|' + run.floor + '|' + run.pendingBoons + '|' + run.pendingEvos + '|' + (run.room ? run.room.type : '');
    if (key === shownPhase) return; shownPhase = key;
    clearTimeout(phaseTimer);
    var delay = now ? 0 : run.phase === 'victory' && run.result && !run.result.chest ? (run.result.boss ? 1700 : 850) : run.phase === 'dead' ? 1100 : 0;
    if (delay) phaseTimer = setTimeout(render, delay); else render();
  }
  var quiet = false;
  function refresh() { updateHud.key = null; quiet = true; render(); quiet = false; }
  function render() {
    var run = S().run; if (!run || UI.st.screen !== 'run') return;
    if (run.phase === 'combat') { UI.overlay(null); if (built !== run.combat) buildArena(); return; }
    if (built === null) buildArena();
    if (run.phase === 'victory') return sheetVictory(run);
    if ((run.phase === 'doors' || run.phase === 'room') && run.pendingEvos > 0 && sheetEvo(run)) return;
    if (run.phase === 'doors') return run.pendingBoons > 0 ? sheetBoon(run) : sheetDoors(run);
    if (run.phase === 'room') return run.pendingBoons > 0 ? sheetBoon(run) : sheetRoom(run);
    if (run.phase === 'dead') return end(false);
  }

  // ---------- fenêtres ----------
  function lootCards(items) {
    return items.map(function (g, i) {
      var it = g.item, b = E.itemBase(it);
      return '<div class="lootc" style="animation-delay:' + (0.15 + i * 0.22) + 's"><button class="item r' + it.rar + '"' + (g.salvaged ? ' style="opacity:.45"' : ' data-act="item" data-uid="' + it.uid + '"') + '>' + b.icon + '<span class="lv">' + it.ilvl + '</span></button><b class="c' + it.rar + '">' + D.RARITIES[it.rar].name + '</b><div class="dim">' + (g.salvaged ? '♻️ +' + g.essence + ' 💠' : b.name) + '</div></div>';
    }).join('');
  }
  function lootFx(items) {
    var best = -1; items.forEach(function (g, i) {
      if (g.item.rar > best) best = g.item.rar;
      setTimeout(function () { SND.play(D.RARITIES[g.item.rar].sfx); }, 150 + i * 220);
    });
    if (best >= 3) setTimeout(function () { UI.flash(D.RARITIES[best].color + (best >= 4 ? 'cc' : '77')); }, 200);
    if (best >= 4) UI.vib([40, 40, 120]);
    if (best === 4) UI.toast('✨ <b class="c4">LÉGENDAIRE !</b>'); if (best === 5) UI.toast('🩸 <b class="c5">OBJET UNIQUE !</b>', true);
  }
  function sheetVictory(run) {
    var r = run.result, h = '';
    h += '<h2>' + (r.chest ? ['🧰 Coffre forcé', '🧰 Coffre ouvert', '🗝️ Beau crochetage', '🗝️ Crochetage parfait !'][r.grade == null ? 1 : r.grade] : r.arene ? '🏟️ Arène conquise' : r.variant === 'champion' ? '💪 Champion terrassé' : r.variant === 'horde' ? 'Horde massacrée' : r.boss ? '☠️ BOSS VAINCU' : r.type === 'elite' ? '👹 Élite vaincue' : 'Victoire') + '</h2>';
    if (r.firstKill) h += '<div class="center gold small" style="margin-bottom:6px">Nouvelle zone débloquée : tu pourras repartir d’ici !</div>';
    h += '<div class="gains">' + (r.gold ? '<span class="gold">+' + r.gold + ' 💰</span>' : '') + (r.cendres ? '<span class="ash">+' + E.fmt(r.cendres) + ' 🔥</span>' : '') + (r.lvlUps ? '<span style="color:#b3a6ff">Niveau ' + run.lvl + ' !</span>' : '') + (r.lvlUps && run.pendingEvos > 0 ? '<span class="gold">✨ Éveil !</span>' : '') + '</div>';
    if (r.defi != null) h += '<div class="center small ' + (r.defi ? 'good' : 'dim') + '" style="margin-bottom:6px">⏱️ Défi du bourreau : ' + (r.defi ? '<b>réussi !</b> Coffre bonus.' : 'trop lent cette fois.') + '</div>';
    if (r.arene) h += '<div class="center small gold" style="margin-bottom:6px">Récompense : un artefact, une aubaine et un objet.</div>';
    if (r.allyLeft) h += '<div class="center small dim" style="margin-bottom:6px">' + E.hero(r.allyLeft).name + ' te salue et repart : son contrat est rempli.</div>';
    if (r.artifact) h += '<div class="choice b3" style="pointer-events:none"><div class="ic">' + r.artifact.icon + '</div><div><span class="tag">Artefact</span><b>' + r.artifact.name + '</b><div class="d">' + r.artifact.desc + '</div></div></div>';
    if (r.items.length) h += '<div class="loot">' + lootCards(r.items) + '</div><div class="tiny dim center">Touche un objet pour le voir ou l’équiper</div>';
    else if (!r.artifact) h += '<div class="center dim small" style="margin:8px 0">Pas d’objet cette fois.</div>';
    h += '<div class="btns"><button class="btn primary big" data-act="cont">CONTINUER</button></div>';
    UI.overlay(h);
    if (quiet) return;
    if (r.boss) SND.play('victory'); if (r.gold) SND.play('gold'); if (r.lvlUps) setTimeout(function () { SND.play('levelup'); }, 300);
    if (r.items.length) lootFx(r.items);
    if (r.boss) SND.music(zoneMusic(run));
    if (r.ending) setTimeout(ending, 1500);
    UI.flushAch();
  }
  ACT.cont = function () { SND.play('click'); E.continueRun(); syncPhase(true); };
  function sheetBoon(run) {
    if (!run.offer) E.makeOffer(run);
    var h = '<h2>🌒 Choisis une aubaine</h2><div class="tiny dim center" style="margin:-6px 0 8px">Niveau ' + run.lvl + ' · elle dure jusqu’à la fin de cette descente' + (run.pendingBoons > 1 ? ' · encore ' + run.pendingBoons : '') + '</div>';
    run.offer.forEach(function (id, i) {
      var b = E.boonById(id), n = run.boons[id] || 0;
      h += '<button class="choice b' + b.rar + '" style="animation-delay:' + (i * 0.07) + 's" data-act="boon" data-i="' + i + '"><div class="ic">' + b.icon + '</div><div class="grow"><span class="tag">' + BRAR[b.rar] + (b.cls ? ' · ' + E.hero(run.hero).name : '') + (n ? ' · déjà x' + n : '') + '</span><b>' + b.name + '</b><div class="d">' + b.desc + '</div></div></button>';
    });
    h += '<div class="btns"><button class="btn sm' + (run.rerolls > 0 ? '' : ' off') + '" data-act="reroll">🎲 Relancer (' + run.rerolls + ')</button></div>';
    UI.overlay(h);
  }
  // Éveil de pouvoir : renvoie false s'il n'y a plus rien à éveiller (on passe alors aux aubaines)
  function sheetEvo(run) {
    if (!run.evoOffer || !run.evoOffer.length) E.makeEvoOffer(run);
    if (!run.evoOffer.length) { run.pendingBoons += run.pendingEvos; run.pendingEvos = 0; run.evoOffer = null; return false; }
    var h = '<h2>✨ Éveil de pouvoir</h2><div class="tiny dim center" style="margin:-6px 0 8px">Niveau ' + run.lvl + ' · un de tes pouvoirs évolue : il garde son effet et gagne celui-ci en plus, jusqu’à la fin de la descente' + (run.pendingEvos > 1 ? ' · encore ' + run.pendingEvos : '') + '</div>';
    run.evoOffer.forEach(function (id, i) {
      var v = E.evoById(id), sk = E.evoSkill(id);
      h += '<button class="choice b3" style="animation-delay:' + (i * 0.07) + 's" data-act="evo" data-i="' + i + '"><div class="ic">' + sk.icon + '</div><div class="grow"><span class="tag">' + sk.name + ' ✨</span><b>' + v.name + '</b><div class="d">' + v.desc + '</div><div class="tiny dim" style="margin-top:3px">Aujourd’hui : ' + sk.desc + '</div></div></button>';
    });
    h += '<div class="tiny dim center">Prochain éveil au niveau ' + (Math.floor(run.lvl / 4) * 4 + 4) + '. Les pouvoirs encore verrouillés 🔒 s’éveillent une fois débloqués par la Maîtrise.</div>';
    UI.overlay(h); return true;
  }
  ACT.evo = function (d) { var v = E.chooseEvo(+d.i); if (!v) return; SND.play('levelup'); SND.play('skill_holy', 0.5); UI.flash('#d9a44166'); UI.toast('✨ <b>' + E.evoSkill(v.id).name + '</b> s’éveille : ' + v.name); shownPhase = null; updateHud.key = null; syncPhase(true); };
  ACT.boon = function (d) { SND.play('levelup'); E.chooseBoon(+d.i); shownPhase = null; updateHud.key = null; syncPhase(true); };
  ACT.reroll = function () { if (E.rerollBoons()) { SND.play('click'); sheetBoon(S().run); } };
  // ---------- plateau ----------
  var COLS = 7;
  function die(n) { var on = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n], h = '<span class="die">'; for (var i = 0; i < 9; i++) h += '<i class="' + (on.indexOf(i) >= 0 ? 'on' : '') + '"></i>'; return h + '</span>'; }
  function sheetDoors(run) {
    var b = run.board, z = E.zoneOf(run.floor), frac = run.hp / run.stats.hp, dbl = run.dice[0] === run.dice[1], h = '';
    var nk = b.pos + '|' + run.dice.join(',') + '|' + run.rooms, fresh = nk !== diceKey; diceKey = nk;
    h += '<h2>' + z.name + '</h2><div class="center small dim" style="margin:-6px 0 8px">Étage ' + run.floor + ' · PV <b class="' + (frac < 0.35 ? 'bad' : frac < 0.7 ? 'gold' : 'good') + '">' + Math.round(frac * 100) + ' %</b> · 🧪 ' + run.potions + ' · 💰 ' + run.gold + '</div>';
    h += '<div class="board" id="board">';
    b.cells.forEach(function (t, i) {
      var r = Math.floor(i / COLS), col = i % COLS; if (r % 2) col = COLS - 1 - col;
      var mv = -1; run.moves.forEach(function (m, k) { if (m.to === i) mv = k; });
      var rm = D.ROOMS[t], boss = t === 'boss';
      h += '<button class="cell ' + t + (i < b.pos ? ' past' : '') + (i === b.pos ? ' here' : '') + (mv >= 0 ? ' go' : '') + '" id="cell' + i + '" style="grid-row:' + (r + 1) + ';grid-column:' + (boss ? '1 / ' + (col + 2) : col + 1) + '" data-act="' + (mv >= 0 ? 'door' : 'cellInfo') + '" data-i="' + (mv >= 0 ? mv : i) + '">' +
        '<span class="ci">' + rm.icon + '</span>' + (boss ? '<b>' + D.ENEMIES[z.boss].name + '</b>' : '') + (mv >= 0 ? '<em>' + run.moves[mv].d + '</em>' : '') + (i > 0 && (i - 1) % 4 === 0 && !boss ? '<u>' + Math.ceil(i / 4) + '</u>' : '') + '</button>';
    });
    h += '<div class="pawn" id="pawn">' + UI.spr(run.hero) + '</div></div>';
    h += '<div class="dicerow' + (fresh ? ' roll' : '') + '">' + run.moves.map(function (m, k) { var rm = D.ROOMS[m.type]; return '<button class="dbtn ' + m.type + '" data-act="door" data-i="' + k + '">' + die(m.d) + '<span class="grow"><b>' + rm.icon + ' ' + rm.name + '</b><span>' + rm.hint + '</span></span></button>'; }).join('') + '</div>';
    h += '<div class="tiny dim center" style="margin-top:6px">' + (dbl ? '🎲 <b class="gold">Double !</b> Une seule case possible, mais +25 % d’ultime et +10 or.' : 'Deux dés, deux cases possibles : choisis où poser ton pion.') + '</div>';
    var hs = S().heroes[run.hero], better = S().inv.some(function (it) { if (E.equippedBy(it.uid)) return false; var cur = hs.equip[E.itemBase(it).slot], ci = cur ? E.findItem(cur) : null; return !ci || E.itemScore(it) > E.itemScore(ci) * 1.02; });
    if (b.rerolls > 0 && run.moves[0].type !== 'boss') h += '<div class="btns"><button class="btn sm" data-act="reboard">🎲 Relancer les deux dés (1 fois par zone)</button></div>';
    if (better) h += '<div class="btns"><button class="btn goldb sm" data-act="runEquipBest">▲ Tu as trouvé mieux : équiper le meilleur</button></div>';
    UI.overlay(h); placePawn(b.pos);
    var sh = document.querySelector('#overlay .sheet'), here = $('#cell' + b.pos); if (sh && here) sh.scrollTop = Math.max(0, here.offsetTop - 120);
    if (quiet) return;
    if (fresh) { for (var k = 0; k < 4; k++) setTimeout(function () { SND.play('click', 0.7); }, k * 110); }
    tuto('board', '🎲 <b>Le plateau.</b> Chaque zone est un chemin de cases jusqu’au boss. À chaque tour tu lances deux dés et tu choisis lequel jouer : regarde où ils t’emmènent.');
  }
  function placePawn(i) { var c = $('#cell' + i), p = $('#pawn'); if (!c || !p) return; p.style.left = (c.offsetLeft + c.offsetWidth / 2) + 'px'; p.style.top = (c.offsetTop + c.offsetHeight / 2) + 'px'; }
  ACT.reboard = function () { if (moving || wiping) return; if (E.rerollBoard()) sheetDoors(S().run); else SND.play('error'); };
  ACT.cellInfo = function (d) { var run = S().run, t = run && run.board ? run.board.cells[+d.i] : null, rm = t && D.ROOMS[t]; if (rm) { SND.play('click'); UI.toast(rm.icon + ' <b>' + rm.name + '</b> : ' + rm.hint); } };
  ACT.runEquipBest = function () { var n = E.equipBest(S().run.hero); if (n) { SND.play('equip'); UI.toast('⚡ ' + n + ' objet' + (n > 1 ? 's' : '') + ' équipé' + (n > 1 ? 's' : '')); } E.save(); refresh(); };
  ACT.door = function (d) {
    var run = S().run, m = run.moves[+d.i]; if (wiping || moving || !m || run.phase !== 'doors') return;
    moving = true; var from = run.board.pos, n = m.to - from, p = $('#pawn'), k = 0;
    document.querySelectorAll('.cell.go, .dbtn').forEach(function (x) { if (x.id !== 'cell' + m.to) x.classList.add('off'); });
    (function hop() {
      k++; placePawn(from + k); SND.play('click', 0.8); if (p) anim(p, 'hop', 170);
      if (k < n) { setTimeout(hop, 170); return; }
      setTimeout(function () { moving = false; arrive(+d.i, m); }, 260);
    })();
  };
  function arrive(i, m) {
    var run = S().run, rm = D.ROOMS[m.type], instant = m.type === 'bourse' || m.type === 'piege' || m.type === 'fontaine';
    if (instant) {
      if (!E.chooseDoor(i)) return;
      SND.play(m.type === 'piege' ? 'hurt' : m.type === 'bourse' ? 'gold' : 'heal'); if (m.type === 'piege') { UI.flash('#c2283a55'); UI.vib(40); }
      if (run.note) UI.toast(run.note, true); updateHud.key = null; shownPhase = null; syncPhase(true); return;
    }
    SND.play('door');
    wipe(rm.icon + ' ' + rm.name, 'Étage ' + E.floorAt(m.to) + ' · ' + E.zoneOf(E.floorAt(m.to)).name, function () {
      if (E.chooseDoor(i)) { UI.overlay(null); built = null; if (m.type === 'boss') UI.flash('#000000ee'); if (run.note) UI.toast(run.note, true); syncPhase(true); }
    });
  }
  function sheetRoom(run) {
    var r = run.room, t = r.type, h = '';
    if (t === 'mercenaire') {
      h = '<h2>🤝 Camp de mercenaires</h2><p class="center dim small" style="margin-top:-6px">« Notre lame contre ton or. Jusqu’au prochain boss. » · Tu as <b class="gold">💰 ' + run.gold + '</b></p>';
      r.mercs.forEach(function (id, i) {
        var m = E.hero(id), no = run.gold < r.price;
        h += '<button class="choice b1' + (no ? ' off' : '') + '"' + (no ? ' style="opacity:.45"' : '') + ' data-act="room" data-a="hire" data-arg="' + i + '"><div class="ic">' + UI.spr(id).replace('<img', '<img style="width:42px;height:42px"') + '</div><div class="grow"><span class="tag">' + m.title + '</span><b>' + m.name + ' — 💰 ' + r.price + '</b><div class="d">' + D.ALLIES[id] + '</div></div></button>';
      });
      h += '<div class="btns"><button class="btn" data-act="room" data-a="leave">Continuer seul</button></div>';
      UI.overlay(h); return;
    }
    if (t === 'forge' || t === 'runes' || t === 'roue') { UI.mini.room(run); return; }
    if (t === 'tresor') h = '<h2>Salle du trésor</h2><div class="room-art">🧰</div><p class="center dim">Un coffre cerclé de fer. Il a l’air... de respirer ?</p><div class="btns"><button class="btn goldb big" data-act="lockpick">🗝️ CROCHETER</button></div><div class="btns" style="margin-top:8px"><button class="btn sm" data-act="room" data-a="open" data-arg="0">Forcer le coffre (butin moindre)</button></div>';
    else if (t === 'marchand') {
      h = '<h2>⚖️ Le Colporteur</h2><p class="center dim small" style="margin-top:-6px">« Tout a un prix. Surtout toi. » · Tu as <b class="gold">💰 ' + run.gold + '</b></p>';
      r.stock.forEach(function (s, i) {
        var no = s.sold || run.gold < s.price || (s.kind === 'potion' && run.potions >= run.potionsMax) || (s.kind === 'heal' && run.hp >= run.stats.hp);
        var rc = s.kind === 'item' ? ' c' + s.item.rar : '';
        h += '<div class="li"><div class="ic">' + s.icon + '</div><div class="grow"><b class="' + rc + '">' + s.name + '</b><div class="small dim">' + s.desc + '</div></div><button class="btn sm ' + (no ? 'off' : 'goldb') + '" data-act="room" data-a="buy" data-arg="' + i + '">' + (s.sold ? 'Vendu' : '💰 ' + s.price) + '</button></div>';
      });
      h += '<div class="btns"><button class="btn primary" data-act="room" data-a="leave">Repartir</button></div>';
    } else if (t === 'repos') {
      h = '<h2>🔥 Feu de camp</h2><div class="room-art">🏕️</div>' +
        '<button class="choice b1" data-act="room" data-a="heal"><div class="ic">❤️</div><div><b>Se reposer</b><div class="d">Soigne 45 % de tes PV.</div></div></button>' +
        '<button class="choice b2" data-act="room" data-a="sharpen"><div class="ic">⚔️</div><div><b>S’entraîner</b><div class="d">+8 % attaque et PV pour cette descente.</div></div></button>' +
        '<button class="choice b0" data-act="room" data-a="potion"><div class="ic">🧪</div><div><b>Distiller</b><div class="d">+1 fiole et soigne 15 % PV.</div></div></button>';
    } else if (t === 'autel') {
      h = '<h2>🩸 Autel maudit</h2><p class="center dim small" style="margin-top:-6px">Il offre. Il prend. Pour toute la descente.</p>';
      r.altars.forEach(function (ai, i) { var a = D.ALTARS[ai]; h += '<button class="choice b2" data-act="room" data-a="take" data-arg="' + i + '"><div class="ic">🩸</div><div><b>' + a.name + '</b><div class="d">' + a.desc + '</div></div></button>'; });
      h += '<div class="btns"><button class="btn" data-act="room" data-a="skip">Refuser et partir</button></div>';
    } else if (t === 'event') {
      var ev = E.byId(D.EVENTS, r.event);
      h = '<h2>' + ev.title + '</h2><p class="center" style="font-style:italic">' + ev.text + '</p>';
      ev.opts.forEach(function (o, i) { var no = o.need && o.need.gold && run.gold < o.need.gold; h += '<button class="choice b' + (i === ev.opts.length - 1 ? 0 : 1) + (no ? ' off' : '') + '"' + (no ? ' style="opacity:.4"' : '') + ' data-act="room" data-a="opt" data-arg="' + i + '"><div class="ic">' + (i === 0 ? '🅰️' : i === 1 ? '🅱️' : '🚪') + '</div><div><b>' + o.t + '</b></div></button>'; });
    }
    UI.overlay(h);
  }
  ACT.room = function (d) {
    var run = S().run, t = run.room.type, res = E.roomAction(d.a, d.arg != null ? +d.arg : undefined);
    if (res === false) { SND.play('error'); return; }
    if (res === 'mimic') { UI.overlay(null); built = null; setTimeout(function () { banner('MIMIQUE !', 'PIÈGE'); SND.play('boss_intro'); }, 60); }
    else if (res === 'chest') SND.play('door');
    else if (res === 'buy') { SND.play('buy'); if (run.pendingBoons > 0) { shownPhase = null; } else { sheetRoom(run); updateHud.key = null; return; } }
    else if (t === 'repos') { SND.play(d.a === 'heal' ? 'heal' : d.a === 'potion' ? 'potion' : 'upgrade'); UI.toast(res, true); }
    else if (res !== 'leave' && typeof res === 'string' && res) { UI.toast(res, true); SND.play(t === 'autel' && d.a === 'take' ? 'skill_dark' : 'click'); if (run.phase === 'combat') { UI.overlay(null); built = null; } }
    updateHud.key = null; syncPhase(true);
  };

  // ---------- actions de combat ----------
  function myTurn() { var run = S().run, c = run && run.combat; if (!c || run.phase !== 'combat' || c.over) return false; if (c.turn !== 'hero') { SND.play('error'); return false; } return true; }
  ACT.strike = function () { if (myTurn() && !E.strike()) SND.play('error'); };
  ACT.pass = function () { if (myTurn()) { SND.play('click'); E.pass(); } };
  ACT.skill = function (d) { var run = S().run; if (!myTurn()) return; if (!E.useSkill(+d.i)) { if (!E.skillUnlocked(run.hero, +d.i)) UI.toast('🔒 Pouvoir débloqué à Maîtrise ' + ((+d.i) + 1) + ' (joue ce héros pour la monter).'); } };
  ACT.potion = function () { var run = S().run; if (!run) return; if (E.usePotion()) { if (!run.combat || run.phase !== 'combat') SND.play('potion'); } else SND.play('error'); };
  ACT.target = function (d) {
    var run = S().run, c = run && run.combat, i = +d.i; if (!c || c.over) return;
    var e = c.enemies[i], n = c.enemies.filter(function (x) { return !x.dead; }).length; if (!e || e.dead) return;
    if (c.weak && c.weak.id === e.id) { if (myTurn()) E.hitWeak(i); return; }
    if (c.target === i || n === 1) { c.target = i; ACT.strike(); } else { E.setTarget(i); SND.play('click'); }
  };
  ACT.parry = function () { if (myTurn() && !E.parry()) SND.play('error'); };
  ACT.ult = function () { if (!myTurn()) return; if (!E.useUlt()) { SND.play('error'); UI.toast('L’ultime se charge en frappant, en tuant et en encaissant. Le lancer ne coûte aucune action.'); } };
  ACT.stance = function () {
    var s = E.setStance(); SND.play('click');
    UI.toast(s === 'a' ? '🗡️ <b>Assaut</b> : +25 % dégâts infligés, +20 % dégâts subis.' : s === 'd' ? '🛡️ <b>Garde</b> : -25 % dégâts subis, -20 % dégâts infligés.' : '⚖️ <b>Équilibre</b> : aucun bonus, aucun malus.');
  };
  ACT.auto = function () { var s = S().settings; s.auto = !s.auto; SND.play('click'); if (s.auto) tuto('auto', '🤖 AUTO : ton héros joue ses tours tout seul. Pratique, mais il ne ramasse pas les orbes et ne renvoie pas les crânes.'); E.save(); };
  ACT.speed = function () { var s = S().settings; s.speed = s.speed >= 3 ? 1 : s.speed + 1; SND.play('click'); E.save(); };
  ACT.relics = function () {
    var run = S().run, h = '<h2>Ta descente</h2>', om = run.omen ? E.byId(D.OMENS, run.omen) : null;
    if (om) h += '<div class="li on"><div class="ic">' + om.icon + '</div><div class="grow"><b>Présage : ' + om.name + '</b><div class="small dim">' + om.desc + '</div></div></div>';
    if (run.artifacts.length) { h += '<h3 class="gold" style="margin-bottom:6px">Artefacts</h3>'; run.artifacts.forEach(function (id) { var a = E.byId(D.ARTIFACTS, id); h += '<div class="li"><div class="ic">' + a.icon + '</div><div class="grow"><b>' + a.name + '</b><div class="small dim">' + a.desc + '</div></div></div>'; }); }
    if (run.evos.length) { h += '<h3 class="gold" style="margin:8px 0 6px">✨ Éveils</h3>'; run.evos.forEach(function (id) { var v = E.evoById(id), sk = E.evoSkill(id); h += '<div class="li"><div class="ic">' + sk.icon + '</div><div class="grow"><b>' + v.name + '</b> <span class="tiny dim">' + sk.name + '</span><div class="small dim">' + v.desc + '</div></div></div>'; }); }
    var ks = Object.keys(run.boons);
    if (ks.length) { h += '<h3 class="gold" style="margin:8px 0 6px">Aubaines</h3>'; ks.forEach(function (id) { var b = E.boonById(id); h += '<div class="li"><div class="ic">' + b.icon + '</div><div class="grow"><b>' + b.name + (run.boons[id] > 1 ? ' x' + run.boons[id] : '') + '</b><div class="small dim">' + b.desc + '</div></div></div>'; }); }
    if (!ks.length && !run.artifacts.length && !run.evos.length) h += '<p class="center dim">Rien encore. Gagne des niveaux pour choisir des aubaines, et un éveil ✨ tous les 4 niveaux.</p>';
    h += '<div class="btns"><button class="btn" data-act="allStats">📊 Mes stats</button><button class="btn primary" data-act="close">Fermer</button></div>';
    UI.st.view = run.hero; UI.modal(h);
  };
  // Fiche d'aide : ce que fait chaque bouton. Le combat est en pause tant qu'elle est ouverte.
  function helpSheet(first) {
    var run = S().run; if (!run) return; var hero = E.hero(run.hero);
    var h = '<h2>' + (first ? 'Voici tes pouvoirs' : 'Aide') + '</h2><div class="tiny dim center" style="margin:-6px 0 10px">' + hero.name + ', ' + hero.title + ' · le combat est en pause</div>';
    h += '<div class="li"><div class="ic">🌟</div><div class="grow"><b>' + hero.passive.name + '</b> <span class="tiny dim">passif, toujours actif</span><div class="small dim">' + hero.passive.desc + '</div></div></div>';
    hero.skills.forEach(function (k, i) {
      var ok = E.skillUnlocked(run.hero, i);
      var nums = ok ? E.skillNumbers(run.hero, i, run) : [], evn = k.evos.filter(function (v) { return run.evos.indexOf(v.id) >= 0; });
      h += '<button class="li tap' + (ok ? '' : ' locked') + '" data-act="skillInfo" data-h="' + run.hero + '" data-i="' + i + '"><div class="ic">' + (ok ? k.icon : '🔒') + '</div><div class="grow"><b>' + k.name + '</b> <span class="tiny dim">' + (ok ? 'recharge ' + E.turns(E.skillCd(run, i)) + ' tours' : 'se débloque à Maîtrise ' + (i + 1)) + '</span>' + UI.tagsHtml(k) + '<div class="small dim">' + k.desc + '</div>' +
        (nums.length ? '<div class="tiny gold">' + nums[0] + '</div>' : '') + evn.map(function (v) { return '<div class="tiny" style="color:#ffd87a">✨ ' + v.name + ' : ' + v.desc + '</div>'; }).join('') + '</div><span class="dim">›</span></button>';
    });
    h += '<div class="tiny dim center" style="margin:-2px 0 8px">Touche un pouvoir pour le détail. En combat : <b>appui long</b> sur un pouvoir ou un ennemi.</div>';
    h += '<div class="li on"><div class="ic">' + hero.ult.icon + '</div><div class="grow"><b>' + hero.ult.name + '</b> <span class="tiny gold">ultime · grande barre dorée</span><div class="small dim">' + hero.ult.desc + ' Elle se remplit quand tu frappes, tues et encaisses.</div></div></div>';
    var foes = run.combat && !first ? run.combat.enemies.filter(function (x) { return !x.dead; }) : [];
    if (foes.length) {
      h += '<h3 class="gold" style="margin:10px 0 6px">En face de toi</h3>';
      foes.forEach(function (x) { var names = []; for (var ak in x.ab) if (D.AB_INFO[ak]) names.push(D.AB_INFO[ak][0] + ' ' + D.AB_INFO[ak][1]); h += '<button class="li tap" data-act="foeLive" data-i="' + run.combat.enemies.indexOf(x) + '"><div class="ic">' + UI.spr(x.key).replace('<img', '<img style="width:34px;height:34px"') + '</div><div class="grow"><b>' + x.name + '</b><div class="small dim">' + (names.join(' · ') || 'Aucune capacité spéciale') + '</div></div><span class="dim">›</span></button>'; });
    }
    h += '<div class="li on"><div class="ic">✨</div><div class="grow"><b>Éveils de pouvoir</b><div class="small dim">Tous les 4 niveaux d’une descente (4, 8, 12...), tu fais évoluer un de tes pouvoirs. Un ✦ sur le bouton montre qu’il est éveillé.</div></div></div>';
    h += '<div class="li on"><div class="ic">🎲</div><div class="grow"><b>Tour par tour</b><div class="small dim">À ton tour tu as <b>2 actions ⚡</b>. Frapper, lancer un pouvoir, parer, toucher un point faible ou renvoyer un crâne coûtent 1 action. L’ultime, la fiole, la posture et les orbes sont gratuits. Ensuite chaque ennemi joue, l’un après l’autre.</div></div></div>';
    h += '<div class="li on"><div class="ic">🎲</div><div class="grow"><b>Dés de combat</b><div class="small dim">Deux dés au début de chaque tour.<br>🎲 <b>Double</b> : +1 action · 👑 <b>Double six</b> : +1 action et tout est critique<br>🍀 <b>Total 7</b> : tes pouvoirs sont gratuits ce tour<br>💥 <b>10 ou 11</b> : +40 % dégâts · 🛡️ <b>3 ou 4</b> : -40 % dégâts subis<br>✨ <b>Deux chiffres qui se suivent</b> : prochain coup critique<br>Touche les dés pour les relancer : 1 fois par combat, avant d’agir.</div></div></div>';
    h += '<h3 class="gold" style="margin:10px 0 6px">Les autres boutons</h3>' +
      '<div class="li"><div class="ic">⚔️</div><div class="grow"><b>Frapper</b><div class="small dim">Attaque l’ennemi visé (▼). Plus ta vitesse d’attaque est haute, plus tu donnes de coups par action. Toucher un ennemi le vise ; le toucher encore le frappe.</div></div></div>' +
      '<div class="li"><div class="ic">🤺</div><div class="grow"><b>Parer</b><div class="small dim">Jusqu’à ton prochain tour, tu subis 70 % de dégâts en moins et tu ripostes. Si tu pares une <b>attaque chargée ⚠️</b> (ennemi qui brille en jaune), elle est annulée et l’ennemi est étourdi.</div></div></div>' +
      '<div class="li"><div class="ic">⚖️</div><div class="grow"><b>Posture</b><div class="small dim">🗡️ Assaut : +25 % dégâts, mais +20 % dégâts subis. 🛡️ Garde : -25 % dégâts subis, mais -20 % dégâts. Change quand tu veux.</div></div></div>' +
      '<div class="li"><div class="ic">🎯</div><div class="grow"><b>Point faible</b><div class="small dim">Quand une cible apparaît sur un ennemi, elle reste un tour : touche-le pour un énorme coup critique (1 action).</div></div></div>' +
      '<div class="li"><div class="ic">🧪</div><div class="grow"><b>Fiole</b><div class="small dim">Rend 35 % de tes PV. Tu en regagnes une à chaque boss vaincu.</div></div></div>' +
      '<div class="li"><div class="ic">🤖</div><div class="grow"><b>AUTO et vitesse</b><div class="small dim">AUTO joue tes tours tout seul (sans points faibles, orbes ni crânes). x1 / x2 / x3 accélère les animations.</div></div></div>' +
      '<h3 class="gold" style="margin:10px 0 6px">Les symboles</h3><div class="small dim" style="line-height:1.7">🔥 brûlure · ☠️ poison · 🩸 saignement : dégâts à chaque tour<br>💫 étourdi : ne peut pas agir · ⬇️ affaibli : frappe moins fort<br>🎯 vulnérable : subit +25 % dégâts · ⚠️ prépare un gros coup<br>🕸️ entravé : une frappe sur deux ne part pas</div>' +
      '<div class="btns"><button class="btn sm" data-act="lexique">📖 Lexique : tous les mots expliqués</button></div>' +
      '<div class="btns"><button class="btn primary big" data-act="close">' + (first ? 'COMPRIS, AU COMBAT' : 'REPRENDRE') + '</button></div>';
    UI.modal(h);
  }
  ACT.foeLive = function (d) { var run = S().run, x = run && run.combat ? run.combat.enemies[+d.i] : null; if (x) { SND.play('click'); UI.modal(UI.foeSheet(x.key, x)); } };
  function miniSheet(icon, title, sub, text) { UI.modal('<div class="skhead"><div class="ic">' + icon + '</div><div class="grow"><b>' + title + '</b><div class="tiny dim">' + sub + '</div></div></div><p style="margin:10px 2px">' + text + '</p><div class="btns"><button class="btn" data-act="help">‹ Aide</button><button class="btn primary" data-act="close">Fermer</button></div>'); }
  // Appui long : fiche de ce qu'on touche
  ACT.info = function (type, arg) {
    var run = S().run; if (!run || UI.st.screen !== 'run' || $('#modal').classList.contains('on')) return;
    var hero = E.hero(run.hero);
    if (type === 'skill') UI.modal(UI.skillSheet(run.hero, +arg));
    else if (type === 'foe') ACT.foeLive({ i: arg });
    else if (type === 'ult') miniSheet(hero.ult.icon, hero.ult.name, 'Ultime de ' + hero.name + ' · chargé à ' + Math.floor(run.ult || 0) + ' %', hero.ult.desc + '<br><br><span class="dim">La barre dorée se remplit quand tu frappes, tues, encaisses, lances un pouvoir ou touches un point faible 🎯. Elle garde sa charge d’une salle à l’autre.</span>');
    else if (type === 'parry') miniSheet('🤺', 'Parer', '1 action · utilisable un tour sur deux', 'Jusqu’à ton prochain tour, tu subis 70 % de dégâts en moins et tu ripostes.<br><br>Si tu pares une <b>attaque chargée ⚠️</b> (l’ennemi brille en jaune), le coup est <b>annulé</b>, l’ennemi est étourdi et ta riposte fait 300 % dégâts.');
    else if (type === 'strike') miniSheet('⚔️', 'Frapper', '1 action', 'Attaque l’ennemi visé (▼). Tu donnes autant de coups que ta vitesse d’attaque le permet : 1 coup à vitesse 1, parfois 2 au-dessus.<br><br><span class="dim">Touche un ennemi pour le viser, touche-le encore pour le frapper.</span>');
    else if (type === 'stance') miniSheet('⚖️', 'Posture', 'change quand tu veux, sans recharge', '🗡️ <b>Assaut</b> : +25 % dégâts infligés, mais +20 % dégâts subis.<br>🛡️ <b>Garde</b> : -25 % dégâts subis, mais -20 % dégâts infligés.<br>⚖️ <b>Équilibre</b> : rien ne change.<br><br><span class="dim">Assaut quand tout va bien, Garde quand tes PV fondent ou qu’un boss s’enrage.</span>');
    else if (type === 'potion') miniSheet('🧪', 'Fiole de soin', run.potions + ' / ' + run.potionsMax + ' en réserve', 'Rend 35 % de tes PV, tout de suite. Tu en regagnes une à chaque boss vaincu, et tu peux en acheter au Colporteur ou en distiller au feu de camp.');
  };
  ACT.help = function () { SND.play('click'); helpSheet(false); };
  ACT.runMenu = function () { ACT.settings(); };

  // ---------- fin de descente ----------
  function end(abandon) {
    var run = S().run; if (!run) return;
    var heroId = run.hero, startZone = E.zoneNum(run.startFloor), lvlBefore = S().heroes[heroId].lvl;
    var sum = E.endRun(abandon); stop(); built = null; UI.overlay(null); UI.closeModal();
    UI.st.screen = 'death'; UI.st.view = heroId; UI.st.zone = null; SND.music('hub');
    var h = E.hero(heroId), hs = S().heroes[heroId], items = sum.loot.map(function (l) { return E.findItem(l.uid); }).filter(Boolean);
    items.sort(function (a, b) { return b.rar - a.rar; });
    var html = '<div class="content death" style="padding-top:22px">' +
      '<h1>' + (abandon ? 'RETOUR' : 'TU ES MORT') + '</h1><div class="center" style="margin:6px 0">' + UI.spr('tombe', '') .replace('<img', '<img style="width:64px;height:64px"') + '</div>' +
      '<div class="center dim small">' + h.name + (abandon ? ' est rentré de l’étage ' : ' est tombé à l’étage ') + '<b style="color:var(--text)">' + sum.floor + '</b> — ' + E.zoneOf(sum.floor).name + '</div>' +
      (sum.record ? '<div class="center gold" style="margin-top:6px;font-family:var(--serif);letter-spacing:.1em">★ NOUVEAU RECORD ★</div>' : '') +
      '<div class="sumgrid"><div class="stat"><b>' + sum.kills + '</b><span>Ennemis tués</span></div><div class="stat"><b class="ash">+' + E.fmt(sum.cendres) + '</b><span>Cendres 🔥</span></div><div class="stat"><b>' + sum.loot.length + '</b><span>Objets trouvés</span></div><div class="stat"><b>' + E.fmt(sum.dmg) + '</b><span>Dégâts infligés</span></div><div class="stat"><b>' + E.fmt(sum.maxHit) + '</b><span>Plus gros coup</span></div><div class="stat"><b>' + Math.floor(sum.time / 60) + ' min ' + ('0' + Math.floor(sum.time % 60)).slice(-2) + '</b><span>Durée</span></div></div>' +
      (function () { var g = E.gloryInfo(); return '<div class="card glory"><div class="row"><b>🏅 Gloire</b><span class="grow"></span><b class="gold" style="font-size:19px">+' + sum.score + '</b></div><div class="tiny ' + (sum.scoreRec ? 'gold' : 'dim') + '">' + (sum.scoreRec ? '★ Meilleur score ★' : 'Score de la descente · record ' + S().stats.bestScore) + '</div><div class="bar" style="margin:6px 0 4px"><i style="width:' + Math.min(100, g.pts / g.need * 100) + '%"></i></div><div class="tiny dim">Palier ' + g.lvl + ' · ' + g.pts + ' / ' + g.need + ' · prochaine récompense : <span style="color:var(--text)">' + g.next + '</span></div>' + sum.gloryUps.map(function (u) { return '<div class="gup">▲ Palier ' + u.lvl + ' : <b>' + u.txt + '</b></div>'; }).join('') + '</div>'; })() +
      '<div class="card"><div class="row"><b>Maîtrise de ' + h.name + '</b><span class="grow"></span><b class="gold">niv. ' + hs.lvl + '</b></div><div class="bar" style="margin-top:5px"><i style="width:' + Math.min(100, hs.xp / E.masteryNeed(hs.lvl) * 100) + '%"></i></div>' +
      (sum.heroUps ? '<div class="small good" style="margin-top:5px">▲ Maîtrise +' + sum.heroUps + ' : +' + (3 * sum.heroUps) + ' % attaque et PV · <b>+' + sum.heroUps + ' point' + (sum.heroUps > 1 ? 's' : '') + ' de talent</b>' + ((lvlBefore < 2 && hs.lvl >= 2) || (lvlBefore < 3 && hs.lvl >= 3) ? ' · <b>nouveau pouvoir débloqué !</b>' : '') + ((lvlBefore < 4 && hs.lvl >= 4) || (lvlBefore < 8 && hs.lvl >= 8) ? ' · <b>+1 emplacement de pacte</b>' : '') + '</div>' : '<div class="tiny dim" style="margin-top:4px">+' + sum.mxp + ' expérience</div>') + '</div>';
    if (items.length) html += '<div class="card"><b>Butin gardé</b> <span class="tiny dim">(il est à toi pour toujours)</span><div class="inv-grid" style="margin-top:8px">' + items.slice(0, 18).map(function (it) { return UI.itemTile(it); }).join('') + '</div></div>';
    html += '<div class="card small dim">💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)] + '</div>' +
      '<button class="btn goldb wide" data-act="deathBest" style="margin-bottom:8px">⚡ Équiper le meilleur</button>' +
      '<div class="btns" style="margin-top:0"><button class="btn" data-act="toHub">🏰 Sanctuaire</button><button class="btn primary" data-act="again" data-z="' + startZone + '">⚔️ RELANCER</button></div><div style="height:20px"></div></div>';
    $('#screen').innerHTML = html;
    if (typeof FX !== 'undefined') FX.attach($('#screen'), { ambient: 'ash', warm: 4 });
    if (sum.record) setTimeout(function () { SND.play('levelup'); }, 500);
    if (sum.gloryUps.length) setTimeout(function () { SND.play(sum.gloryUps.some(function (u) { return u.uid; }) ? 'loot_epic' : 'upgrade'); UI.toast('🏅 <b>Gloire : palier ' + S().glory.lvl + ' !</b>'); }, 900);
    UI.flushAch();
    var metaOk = D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; });
    if (metaOk) setTimeout(function () { UI.toast('⚱️ Tu as assez de Cendres pour un bonus permanent à l’<b>Autel</b> !', true); }, 900);
  }
  ACT.deathBest = function (d, el) { var n = E.equipBest(S().hero); S().inv.forEach(function (i) { i.isNew = false; }); E.save(); SND.play(n ? 'equip' : 'click'); UI.toast(n ? '⚡ ' + n + ' objet' + (n > 1 ? 's' : '') + ' équipé' + (n > 1 ? 's' : '') + ' — Puissance ' + E.fmt(E.power(S().hero)) : 'Tu portes déjà le meilleur.'); el.classList.add('off'); };
  ACT.toHub = function () { SND.play('click'); UI.hub(D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; }) ? 'autel' : 'hero'); };
  ACT.again = function (d) { UI.askOmen(S().hero, Math.min(+d.z || 1, E.maxStartZone())); };

  // Fin d'une épreuve (forge, runes, roue) : message, puis on passe à la suite
  function after(txt, sfx) { if (txt) UI.toast(txt, true); if (sfx) SND.play(sfx); shownPhase = null; updateHud.key = null; syncPhase(true); }
  return { show: show, stop: stop, pause: pause, end: end, refresh: refresh, after: after, hud: function () { updateHud.key = null; } };
})();
