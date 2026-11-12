/* MORVANE — interface de la descente : combat, butin, salles, mort */
UI.run = (function () {
  'use strict';
  var E = ENGINE, D = DATA, $ = UI.$, S = UI.S, ACT = UI.ACT;
  var running = false, paused = false, last = 0, shownPhase = null, phaseTimer = null, els = {}, posOf = {}, floats = 0, built = null;
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
      '<div class="hud"><div class="hpbar" id="hpbar"><i></i><u></u><span></span></div><div class="xprow"><b id="rlvl"></b><div class="bar"><i id="xpbar"></i></div><span class="hsts" id="hsts"></span></div>' +
      '<div class="skills">' + h.skills.map(function (k, i) { return '<button class="skb" id="sk' + i + '" data-act="skill" data-i="' + i + '"><span class="e">' + k.icon + '</span><span class="cd"></span><span class="n"></span></button>'; }).join('') +
      '<button class="skb potion" id="pot" data-act="potion">🧪<span class="cnt"></span></button><div class="side"><button class="tog" id="tauto" data-act="auto">AUTO</button><button class="tog" id="tspd" data-act="speed"></button></div></div>' +
      '<div class="row2"><button class="act" id="bparry" data-act="parry"><span class="ai">🤺</span><b>Parer</b><span class="cd"></span></button>' +
      '<button class="ultb" id="bult" data-act="ult"><i></i><span>' + h.ult.icon + ' ' + h.ult.name + '</span></button>' +
      '<button class="act" id="bstance" data-act="stance"><span class="ai"></span><b></b></button></div>' +
      '<button class="relics" id="relics" data-act="relics" style="width:100%"></button></div>';
    built = null; shownPhase = null;
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    syncPhase(true);
  }
  function stop() { running = false; clearTimeout(phaseTimer); }
  function pause(p) { paused = p; last = performance.now(); }

  // ---------- arène ----------
  function buildArena() {
    var run = S().run, c = run.combat, z = E.zoneOf(run.floor), a = $('#arena');
    a.style.setProperty('--z1', z.bg[0]); a.style.setProperty('--z2', z.bg[1]); a.style.setProperty('--zc', z.color);
    if (typeof Backgrounds !== 'undefined') { a.style.backgroundImage = 'url(' + Backgrounds.url(z.id) + ')'; a.classList.add('hasbg'); }
    a.innerHTML = '<div class="unit hero" id="uhero">' + UI.spr(run.hero) + '</div><div class="minions" id="minions"></div>';
    els = {}; posOf = {}; floats = 0;
    if (c) { c.enemies.forEach(function (e, i) { if (!e.dead) addEnemy(e, i, false); }); built = c; }
    else built = 'empty';
  }
  function addEnemy(e, i, spawn) {
    var c = S().run.combat, bossFight = c.enemies[0].boss, P = bossFight ? BPOS : POS, used = {}, k;
    for (k in posOf) if (els[k] && !els[k].classList.contains('dead')) used[posOf[k]] = 1;
    var pi = 0; while (used[pi] && pi < P.length - 1) pi++;
    posOf[e.id] = pi;
    var d = document.createElement('div');
    d.className = 'unit en' + (e.boss ? ' boss' : e.elite ? ' elite' : '') + (spawn ? ' spawn' : '');
    d.id = 'en' + e.id; d.dataset.act = 'target'; d.dataset.i = i;
    d.style.right = P[pi].r + '%'; d.style.bottom = P[pi].b + '%'; d.style.zIndex = 10 - Math.round(P[pi].b / 5);
    d.innerHTML = '<span class="warn">⚠️</span><div class="ename">' + e.name + '</div><div class="cbar"><i></i></div><div class="ebar"><i></i><u></u></div>' + UI.spr(e.key) + '<div class="sts"></div><span class="wk">🎯</span>';
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
  function anim(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, ms || 260); }
  function banner(big, small) { var a = $('#arena'); if (!a) return; var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = (small ? '<small>' + small + '</small>' : '') + big; a.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 2000); }
  function tuto(key, msg) { if (S().tuto[key]) return; S().tuto[key] = 1; UI.toast(msg, true); }

  function drain(c) {
    var run = S().run, hero = $('#uhero'), evs = c.events, i, e, el;
    for (i = 0; i < evs.length; i++) {
      e = evs[i]; el = e.id ? els[e.id] : null;
      switch (e.k) {
        case 'start': SND.music('combat'); tuto('skill', '👆 Ton héros frappe tout seul. Touche un <b>pouvoir</b> dès qu’il brille !'); break;
        case 'boss': SND.music('boss'); SND.play('boss_intro'); banner(c.enemies[0].name.toUpperCase(), 'BOSS'); UI.flash('#c2283a66'); break;
        case 'dmg':
          if (e.sh) { floatAt(el, 'Bouclier', 'txt'); break; }
          floatAt(el, E.fmt(e.v), e.crit ? 'crit' : e.dot ? 'dot' : '');
          if (!e.dot) { anim(el, 'hit', 220); SND.play(e.crit ? 'crit' : 'hit'); if (e.crit && e.skill) anim($('#arena'), 'shake', 250); }
          break;
        case 'miss': floatAt(el, 'Esquive', 'txt'); break;
        case 'swing': anim(hero, 'atk', 220); break;
        case 'eatk': anim(el, 'atk', 250); break;
        case 'hurt':
          if (e.sh) { floatAt(hero, 'Absorbé', 'txt'); SND.play('block', 0.5); break; }
          floatAt(hero, '-' + E.fmt(e.v), e.big ? 'big' : e.dot ? 'dot' : 'hurt');
          if (!e.dot) { anim(hero, 'hit', 250); SND.play(e.block ? 'block' : 'hurt'); }
          if (e.big) { anim($('#arena'), 'shake', 250); UI.flash('#c2283a55'); }
          if (run.hp / run.stats.hp < 0.4 && run.potions > 0) tuto('potion', '🧪 PV bas ! Touche la <b>fiole rouge</b> pour te soigner.');
          break;
        case 'dodge': floatAt(hero, 'Esquive !', 'txt'); break;
        case 'heal': if (e.v > run.stats.hp * 0.02) floatAt(hero, '+' + E.fmt(e.v), 'heal'); break;
        case 'skill': SND.play(e.sfx); floatAt(hero, e.name, 'txt'); anim(hero, 'atk', 220); break;
        case 'potion': SND.play('potion'); break;
        case 'die': if (el) { el.classList.add('dead'); el.classList.remove('charging'); } SND.play(e.boss ? 'boss_die' : 'die'); if (e.boss) { UI.flash('#ffffffaa'); anim($('#arena'), 'shake', 250); } break;
        case 'charge': tuto('charge', '⚠️ <b>Attaque chargée !</b> Touche <b>🤺 Parer</b> juste avant le coup pour l’annuler et riposter. Un étourdissement l’interrompt aussi.'); break;
        case 'interrupt': floatAt(el, 'Interrompu !', 'txt'); break;
        case 'enrage': floatAt(el, 'ENRAGÉ', 'big'); break;
        case 'summon': var idx = -1; c.enemies.forEach(function (x, j) { if (x.id === e.id) idx = j; }); if (idx >= 0) { addEnemy(c.enemies[idx], idx, true); floatAt(els[e.id], 'Invoqué', 'txt'); } break;
        case 'eheal': floatAt(el, 'Soin', 'heal'); break;
        case 'eshield': floatAt(el, 'Bouclier', 'txt'); break;
        case 'revive': UI.flash('#ffe9b8cc'); SND.play('skill_holy'); banner('RESSUSCITÉ', ''); break;
        case 'fury': UI.toast('🌑 Les ténèbres se referment : les ennemis frappent de plus en plus fort !'); break;
        case 'explode': UI.flash('#9aa04a55'); break;
        case 'dead': SND.play('death'); UI.flash('#000000dd'); break;
        case 'parryOn': anim(hero, 'parry', 1000); SND.play('equip'); break;
        case 'parry': if (e.perfect) { floatAt(hero, 'PARADE PARFAITE !', 'crit'); UI.flash('#ffe9b888'); SND.play('block'); anim($('#arena'), 'shake', 250); } else { floatAt(hero, 'Paré', 'txt'); SND.play('block', 0.6); } break;
        case 'ult': banner(e.name.toUpperCase(), 'ULTIME'); UI.flash('#d9a441aa'); SND.play(e.sfx); SND.play('levelup', 0.6); anim($('#arena'), 'shake', 250); break;
        case 'weak': tuto('weak', '🎯 <b>Point faible !</b> Touche vite l’ennemi marqué d’une cible pour un coup critique énorme.'); break;
        case 'weakhit': floatAt(el, 'POINT FAIBLE !', 'crit'); anim($('#arena'), 'shake', 250); break;
        case 'win': break;
      }
    }
    evs.length = 0;
  }
  function stIcons(st) { return (st.burn ? '🔥' : '') + (st.poison ? '☠️' + (st.poison.n > 1 ? st.poison.n : '') : '') + (st.bleed ? '🩸' : '') + (st.stun > 0 ? '💫' : '') + (st.weak > 0 ? '⬇️' : '') + (st.vuln > 0 ? '🎯' : ''); }
  function updateHud() {
    var run = S().run; if (!run) return; var c = run.combat, stt = run.stats, z = E.zoneOf(run.floor), pos = ((run.floor - 1) % 10) + 1, i;
    var key = run.floor + '|' + run.gold + '|' + run.cendres + '|' + run.lvl + '|' + Object.keys(run.boons).length + run.artifacts.length;
    if (updateHud.key !== key) {
      updateHud.key = key;
      $('#rzone').innerHTML = '<b style="color:' + z.color + '">' + z.name + '</b> · étage ' + run.floor + (E.cycleOf(run.floor) ? ' · <span class="bad">Abîme ' + E.cycleOf(run.floor) + '</span>' : '');
      var p = ''; for (i = 1; i <= 10; i++) p += '<i class="' + (i <= pos ? 'on' : '') + (i === 10 ? ' boss' : '') + '"></i>';
      $('#rpips').innerHTML = p; $('#rgold').textContent = '💰 ' + run.gold; $('#rcend').textContent = '🔥 ' + E.fmt(run.cendres);
      $('#rlvl').textContent = 'Niv. ' + run.lvl;
      var rel = ''; run.artifacts.forEach(function (id) { rel += E.byId(D.ARTIFACTS, id).icon; });
      for (var b in run.boons) { var bo = E.boonById(b); rel += bo.icon; }
      $('#relics').innerHTML = rel ? rel + '<span class="more"> ›</span>' : '<span class="more">Aucune aubaine pour l’instant</span>';
    }
    var hb = $('#hpbar'), frac = Math.max(0, run.hp / stt.hp), sh = c ? c.hero.shield : 0;
    hb.firstChild.style.width = (frac * 100) + '%'; hb.children[1].style.width = Math.min(100, sh / stt.hp * 100) + '%';
    hb.lastChild.textContent = E.fmt(Math.ceil(run.hp)) + ' / ' + E.fmt(stt.hp) + (sh >= 1 ? '  (+' + E.fmt(sh) + ')' : '');
    hb.classList.toggle('low', frac < 0.3);
    $('#xpbar').style.width = Math.min(100, run.xp / E.xpNeed(run.lvl) * 100) + '%';
    $('#hsts').textContent = c ? stIcons(c.hero.st) : '';
    for (i = 0; i < 3; i++) {
      var b2 = $('#sk' + i), ok = E.skillUnlocked(run.hero, i);
      if (!ok) { if (!b2.classList.contains('locked')) { b2.className = 'skb locked'; b2.firstChild.textContent = '🔒'; } continue; }
      var cd = c ? Math.max(0, c.hero.cds[i]) : 0, tot = E.skillCd(run, i), ready = c && !c.over && cd <= 0;
      b2.style.setProperty('--p', (cd / tot * 100) + '%'); b2.lastChild.textContent = cd > 0 ? Math.ceil(cd) : '';
      b2.classList.toggle('cool', cd > 0); b2.classList.toggle('ready', !!ready && !S().settings.auto);
    }
    var ult = Math.min(100, run.ult || 0), bu = $('#bult'), inC = c && !c.over && run.phase === 'combat';
    bu.firstChild.style.width = ult + '%'; bu.classList.toggle('ready', ult >= 100);
    if (ult >= 100 && inC) tuto('ult', '🌟 <b>Ultime prêt !</b> Touche la grande barre dorée : c’est ton coup le plus puissant. Il se recharge en combattant.');
    var bp = $('#bparry'), pcd = c ? Math.max(0, c.hero.parryCd) : 0;
    bp.classList.toggle('cool', pcd > 0); bp.lastChild.textContent = pcd > 0 ? Math.ceil(pcd) : ''; bp.classList.toggle('alert', !!inC && pcd <= 0 && c.enemies.some(function (x) { return !x.dead && x.charge; }));
    var bs = $('#bstance'), stn = run.stance || 'n';
    if (bs.dataset.s !== stn) { bs.dataset.s = stn; bs.firstChild.textContent = stn === 'a' ? '🗡️' : stn === 'd' ? '🛡️' : '⚖️'; bs.children[1].textContent = stn === 'a' ? 'Assaut' : stn === 'd' ? 'Garde' : 'Équilibre'; }
    var pt = $('#pot'); pt.lastChild.textContent = run.potions; pt.classList.toggle('cool', run.potions <= 0);
    $('#tauto').classList.toggle('on', !!S().settings.auto); $('#tspd').textContent = 'x' + S().settings.speed; $('#tspd').classList.toggle('on', S().settings.speed > 1);
  }
  function updateArena() {
    var run = S().run, c = run && run.combat; if (!c) return;
    c.enemies.forEach(function (e, i) {
      var el = els[e.id]; if (!el) return; if (e.dead) { el.children[3].firstChild.style.width = '0%'; return; }
      var bar = el.children[3]; bar.firstChild.style.width = Math.max(0, e.hp / e.maxhp * 100) + '%'; bar.lastChild.style.width = Math.min(100, e.shield / e.maxhp * 100) + '%';
      el.classList.toggle('charging', !!e.charge);
      if (e.charge) el.children[2].firstChild.style.width = ((1 - e.charge.t / e.charge.total) * 100) + '%';
      el.classList.toggle('tg', c.target === i && c.enemies.filter(function (x) { return !x.dead; }).length > 1);
      el.classList.toggle('enraged', e.enraged);
      var s = stIcons(e.st), se = el.children[5]; if (se.textContent !== s) se.textContent = s;
      el.classList.toggle('weak', !!c.weak && c.weak.id === e.id);
    });
    var hu = $('#uhero'); if (hu) { hu.classList.toggle('invuln', c.hero.invuln > 0); hu.classList.toggle('undying', !!c.hero.buffs.undying); }
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
        if (!paused && !$('#modal').classList.contains('on')) {
          var t = dt * (S().settings.speed || 1);
          while (t > 0 && !c.over) { var s = Math.min(0.05, t); E.tick(s); t -= s; }
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
    var key = run.phase + '|' + run.floor + '|' + run.pendingBoons + '|' + (run.room ? run.room.type : '');
    if (key === shownPhase) return; shownPhase = key;
    clearTimeout(phaseTimer);
    var delay = now ? 0 : run.phase === 'victory' && run.result && !run.result.chest ? 750 : run.phase === 'dead' ? 1100 : 0;
    if (delay) phaseTimer = setTimeout(render, delay); else render();
  }
  var quiet = false;
  function refresh() { updateHud.key = null; quiet = true; render(); quiet = false; }
  function render() {
    var run = S().run; if (!run || UI.st.screen !== 'run') return;
    if (run.phase === 'combat') { UI.overlay(null); if (built !== run.combat) buildArena(); return; }
    if (built === null) buildArena();
    if (run.phase === 'victory') return sheetVictory(run);
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
    if (best === 4) UI.toast('✨ <b class="c4">LÉGENDAIRE !</b>'); if (best === 5) UI.toast('🩸 <b class="c5">OBJET UNIQUE !</b>', true);
  }
  function sheetVictory(run) {
    var r = run.result, h = '';
    h += '<h2>' + (r.chest ? '🧰 Coffre ouvert' : r.boss ? '☠️ BOSS VAINCU' : r.type === 'elite' ? '👹 Élite vaincue' : 'Victoire') + '</h2>';
    if (r.firstKill) h += '<div class="center gold small" style="margin-bottom:6px">Nouvelle zone débloquée : tu pourras repartir d’ici !</div>';
    h += '<div class="gains">' + (r.gold ? '<span class="gold">+' + r.gold + ' 💰</span>' : '') + (r.cendres ? '<span class="ash">+' + E.fmt(r.cendres) + ' 🔥</span>' : '') + (r.lvlUps ? '<span style="color:#b3a6ff">Niveau ' + run.lvl + ' !</span>' : '') + '</div>';
    if (r.artifact) h += '<div class="choice b3" style="pointer-events:none"><div class="ic">' + r.artifact.icon + '</div><div><span class="tag">Artefact</span><b>' + r.artifact.name + '</b><div class="d">' + r.artifact.desc + '</div></div></div>';
    if (r.items.length) h += '<div class="loot">' + lootCards(r.items) + '</div><div class="tiny dim center">Touche un objet pour le voir ou l’équiper</div>';
    else if (!r.artifact) h += '<div class="center dim small" style="margin:8px 0">Pas d’objet cette fois.</div>';
    h += '<div class="btns"><button class="btn primary big" data-act="cont">CONTINUER</button></div>';
    UI.overlay(h);
    if (quiet) return;
    if (r.boss) SND.play('victory'); if (r.gold) SND.play('gold'); if (r.lvlUps) setTimeout(function () { SND.play('levelup'); }, 300);
    if (r.items.length) lootFx(r.items);
    if (r.boss) SND.music('combat');
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
  ACT.boon = function (d) { SND.play('levelup'); E.chooseBoon(+d.i); shownPhase = null; updateHud.key = null; syncPhase(true); };
  ACT.reroll = function () { if (E.rerollBoons()) { SND.play('click'); sheetBoon(S().run); } };
  function sheetDoors(run) {
    var next = run.floor + 1, z = E.zoneOf(next), frac = run.hp / run.stats.hp;
    var h = '<h2>Étage ' + next + '</h2><div class="center small dim" style="margin:-6px 0 10px">' + (run.doors[0] === 'boss' ? '<span class="bad">' + D.ENEMIES[z.boss].name + ' t’attend.</span>' : 'Choisis ta voie') + ' · PV <b class="' + (frac < 0.35 ? 'bad' : frac < 0.7 ? 'gold' : 'good') + '">' + Math.round(frac * 100) + ' %</b> · 🧪 ' + run.potions + '</div><div class="doors">';
    run.doors.forEach(function (t, i) { var r = D.ROOMS[t]; h += '<button class="door ' + t + '" style="animation-delay:' + (i * 0.08) + 's" data-act="door" data-i="' + i + '"><div class="ic">' + r.icon + '</div><b>' + r.name + '</b><span>' + r.hint + '</span></button>'; });
    h += '</div>';
    var hs = S().heroes[run.hero], better = S().inv.some(function (it) { if (E.equippedBy(it.uid)) return false; var cur = hs.equip[E.itemBase(it).slot], ci = cur ? E.findItem(cur) : null; return !ci || E.itemScore(it) > E.itemScore(ci) * 1.02; });
    if (better) h += '<div class="btns"><button class="btn goldb sm" data-act="runEquipBest">▲ Tu as trouvé mieux : équiper le meilleur</button></div>';
    UI.overlay(h);
  }
  ACT.runEquipBest = function () { var n = E.equipBest(S().run.hero); if (n) { SND.play('equip'); UI.toast('⚡ ' + n + ' objet' + (n > 1 ? 's' : '') + ' équipé' + (n > 1 ? 's' : '')); } E.save(); refresh(); };
  ACT.door = function (d) {
    var run = S().run, t = run.doors[+d.i]; SND.play('door');
    if (E.chooseDoor(+d.i)) { UI.overlay(null); built = null; if (t === 'boss') UI.flash('#000000ee'); syncPhase(true); }
  };
  function sheetRoom(run) {
    var r = run.room, t = r.type, h = '';
    if (t === 'tresor') h = '<h2>Salle du trésor</h2><div class="room-art">🧰</div><p class="center dim">Un coffre cerclé de fer. Il a l’air... de respirer ?</p><div class="btns"><button class="btn goldb big" data-act="room" data-a="open">OUVRIR</button></div>';
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
  ACT.skill = function (d) { var run = S().run; if (!run || run.phase !== 'combat') return; if (!E.useSkill(+d.i)) { if (!E.skillUnlocked(run.hero, +d.i)) UI.toast('🔒 Pouvoir débloqué à Maîtrise ' + ((+d.i) + 1) + ' (joue ce héros pour la monter).'); } };
  ACT.potion = function () { var run = S().run; if (!run) return; if (E.usePotion()) { if (!run.combat || run.phase !== 'combat') SND.play('potion'); } else SND.play('error'); };
  ACT.target = function (d) { if (!E.hitWeak(+d.i)) E.setTarget(+d.i); };
  ACT.parry = function () { var run = S().run; if (!run || run.phase !== 'combat') return; if (!E.parry()) SND.play('error'); };
  ACT.ult = function () { var run = S().run; if (!run || run.phase !== 'combat') return; if (!E.useUlt()) { SND.play('error'); UI.toast('L’ultime se charge en frappant, en tuant et en encaissant.'); } };
  ACT.stance = function () {
    var s = E.setStance(); SND.play('click');
    UI.toast(s === 'a' ? '🗡️ <b>Assaut</b> : +25 % dégâts infligés, +20 % dégâts subis.' : s === 'd' ? '🛡️ <b>Garde</b> : -25 % dégâts subis, -20 % dégâts infligés.' : '⚖️ <b>Équilibre</b> : aucun bonus, aucun malus.');
  };
  ACT.auto = function () { var s = S().settings; s.auto = !s.auto; SND.play('click'); if (s.auto) tuto('auto', '🤖 AUTO : tes pouvoirs et tes fioles se lancent tout seuls. Pratique, mais moins malin que toi.'); E.save(); };
  ACT.speed = function () { var s = S().settings; s.speed = s.speed >= 3 ? 1 : s.speed + 1; SND.play('click'); E.save(); };
  ACT.relics = function () {
    var run = S().run, h = '<h2>Ta descente</h2>', om = run.omen ? E.byId(D.OMENS, run.omen) : null;
    if (om) h += '<div class="li on"><div class="ic">' + om.icon + '</div><div class="grow"><b>Présage : ' + om.name + '</b><div class="small dim">' + om.desc + '</div></div></div>';
    if (run.artifacts.length) { h += '<h3 class="gold" style="margin-bottom:6px">Artefacts</h3>'; run.artifacts.forEach(function (id) { var a = E.byId(D.ARTIFACTS, id); h += '<div class="li"><div class="ic">' + a.icon + '</div><div class="grow"><b>' + a.name + '</b><div class="small dim">' + a.desc + '</div></div></div>'; }); }
    var ks = Object.keys(run.boons);
    if (ks.length) { h += '<h3 class="gold" style="margin:8px 0 6px">Aubaines</h3>'; ks.forEach(function (id) { var b = E.boonById(id); h += '<div class="li"><div class="ic">' + b.icon + '</div><div class="grow"><b>' + b.name + (run.boons[id] > 1 ? ' x' + run.boons[id] : '') + '</b><div class="small dim">' + b.desc + '</div></div></div>'; }); }
    if (!ks.length && !run.artifacts.length) h += '<p class="center dim">Rien encore. Gagne des niveaux pour choisir des aubaines.</p>';
    h += '<div class="btns"><button class="btn" data-act="allStats">📊 Mes stats</button><button class="btn primary" data-act="close">Fermer</button></div>';
    UI.st.view = run.hero; UI.modal(h);
  };
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
      '<div class="center dim small">' + h.name + ' est tombé à l’étage <b style="color:var(--text)">' + sum.floor + '</b> — ' + E.zoneOf(sum.floor).name + '</div>' +
      (sum.record ? '<div class="center gold" style="margin-top:6px;font-family:var(--serif);letter-spacing:.1em">★ NOUVEAU RECORD ★</div>' : '') +
      '<div class="sumgrid"><div class="stat"><b>' + sum.kills + '</b><span>Ennemis tués</span></div><div class="stat"><b class="ash">+' + E.fmt(sum.cendres) + '</b><span>Cendres 🔥</span></div><div class="stat"><b>' + sum.loot.length + '</b><span>Objets trouvés</span></div></div>' +
      '<div class="card"><div class="row"><b>Maîtrise de ' + h.name + '</b><span class="grow"></span><b class="gold">niv. ' + hs.lvl + '</b></div><div class="bar" style="margin-top:5px"><i style="width:' + Math.min(100, hs.xp / E.masteryNeed(hs.lvl) * 100) + '%"></i></div>' +
      (sum.heroUps ? '<div class="small good" style="margin-top:5px">▲ Maîtrise +' + sum.heroUps + ' : +' + (4 * sum.heroUps) + ' % attaque et PV' + ((lvlBefore < 2 && hs.lvl >= 2) || (lvlBefore < 3 && hs.lvl >= 3) ? ' · <b>nouveau pouvoir débloqué !</b>' : '') + ((lvlBefore < 4 && hs.lvl >= 4) || (lvlBefore < 8 && hs.lvl >= 8) ? ' · <b>+1 emplacement de pacte</b>' : '') + '</div>' : '<div class="tiny dim" style="margin-top:4px">+' + sum.mxp + ' expérience</div>') + '</div>';
    if (items.length) html += '<div class="card"><b>Butin gardé</b> <span class="tiny dim">(il est à toi pour toujours)</span><div class="inv-grid" style="margin-top:8px">' + items.slice(0, 18).map(function (it) { return UI.itemTile(it); }).join('') + '</div></div>';
    html += '<div class="card small dim">💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)] + '</div>' +
      '<button class="btn goldb wide" data-act="deathBest" style="margin-bottom:8px">⚡ Équiper le meilleur</button>' +
      '<div class="btns" style="margin-top:0"><button class="btn" data-act="toHub">🏰 Sanctuaire</button><button class="btn primary" data-act="again" data-z="' + startZone + '">⚔️ RELANCER</button></div><div style="height:20px"></div></div>';
    $('#screen').innerHTML = html;
    if (sum.record) setTimeout(function () { SND.play('levelup'); }, 500);
    UI.flushAch();
    var metaOk = D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; });
    if (metaOk) setTimeout(function () { UI.toast('⚱️ Tu as assez de Cendres pour un bonus permanent à l’<b>Autel</b> !', true); }, 900);
  }
  ACT.deathBest = function (d, el) { var n = E.equipBest(S().hero); S().inv.forEach(function (i) { i.isNew = false; }); E.save(); SND.play(n ? 'equip' : 'click'); UI.toast(n ? '⚡ ' + n + ' objet' + (n > 1 ? 's' : '') + ' équipé' + (n > 1 ? 's' : '') + ' — Puissance ' + E.fmt(E.power(S().hero)) : 'Tu portes déjà le meilleur.'); el.classList.add('off'); };
  ACT.toHub = function () { SND.play('click'); UI.hub(D.META.some(function (m) { var c = E.metaCost(m.id); return c != null && c <= S().cendres; }) ? 'autel' : 'hero'); };
  ACT.again = function (d) { UI.askOmen(S().hero, Math.min(+d.z || 1, E.maxStartZone())); };

  return { show: show, stop: stop, pause: pause, end: end, refresh: refresh };
})();
