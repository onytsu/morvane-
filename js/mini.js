/* MORVANE — épreuves d'adresse : crochetage des coffres, forge, runes, roue du destin.
   Chaque épreuve se joue dans la fenêtre du bas, puis donne son résultat au moteur (ENGINE.roomAction). */
UI.mini = (function () {
  'use strict';
  var E = ENGINE, D = DATA, $ = UI.$, S = UI.S, ACT = UI.ACT;
  var loopId = 0; // change à chaque nouvelle épreuve : les anciennes boucles s'arrêtent d'elles-mêmes

  function sheet(html) { UI.overlay(html); return $('#overlay .sheet'); }
  function pins(n) { var h = '<div class="pins">'; for (var i = 0; i < n; i++) h += '<i></i>'; return h + '</div>'; }
  function setPin(i, ok) { var p = document.querySelectorAll('#overlay .pins i')[i]; if (p) p.className = ok ? 'ok' : 'ko'; }
  function curPin(i) { var p = document.querySelectorAll('#overlay .pins i')[i]; if (p) p.className = 'cur'; }
  function msg(txt, cls) { var m = $('#mmsg'); if (!m) return; m.textContent = txt; m.className = 'mmsg ' + (cls || ''); void m.offsetWidth; m.classList.add('pop'); }
  // Boucle d'animation liée à une épreuve : s'arrête si la fenêtre a changé
  function loop(root, fn) {
    var id = ++loopId, last = performance.now();
    (function f(ts) { if (id !== loopId || !document.body.contains(root)) return; var dt = Math.min(0.05, (ts - last) / 1000); last = ts; if (fn(dt) !== false) requestAnimationFrame(f); })(last);
  }
  function tap(el, fn) { el.addEventListener('pointerdown', function (ev) { ev.preventDefault(); fn(ev); }); }
  function burst(L, el, kind, n) { if (!L || !el) return; var a = L.el.getBoundingClientRect(), r = el.getBoundingClientRect(); VFX.sparks(L, r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, kind, n, { speed: 320 }); VFX.ring(L, r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, kind, 80, 0.35, 5); }

  // ---------- Crochetage : 3 goupilles, toucher quand le crochet passe dans la zone ----------
  function lockpick(done) {
    var root = sheet('<h2>🗝️ Crochetage</h2><div class="tiny dim center" style="margin:-6px 0 10px">Touche quand le crochet passe dans la <b class="good">zone verte</b>. Trois goupilles : plus tu en réussis, meilleur est le butin.</div>' + pins(3) +
      '<div class="lp" id="lp"><div class="lpz" id="lpz"></div><div class="lpc" id="lpc">🗝️</div></div><div class="mmsg" id="mmsg">&nbsp;</div>' +
      '<div class="btns"><button class="btn goldb big" id="mtap">CROCHETER</button></div>');
    var L = typeof VFX !== 'undefined' ? VFX.attach(root) : null;
    var pin = 0, ok = 0, ph = Math.random() * 6, zc = 0.5, zw = 0.24, pos = 0, wait = 0.5, ended = false;
    function setup() { zw = [0.26, 0.21, 0.17][pin]; zc = 0.16 + Math.random() * 0.68; var z = $('#lpz'); z.style.left = ((zc - zw / 2) * 100) + '%'; z.style.width = (zw * 100) + '%'; curPin(pin); }
    setup();
    loop(root, function (dt) {
      if (wait > 0) { wait -= dt; return; }
      ph += dt * [2.7, 3.5, 4.3][Math.min(2, pin)]; pos = 0.5 + 0.5 * Math.sin(ph);
      var c = $('#lpc'); if (c) c.style.left = (pos * 100) + '%';
    });
    function hit() {
      if (ended || wait > 0) return;
      var good = Math.abs(pos - zc) <= zw / 2 + 0.012;
      setPin(pin, good); if (good) { ok++; SND.play('equip'); msg(Math.abs(pos - zc) < zw / 5 ? 'Clic parfait !' : 'Clic !', 'good'); burst(L, $('#lpc'), 'gold', 12); UI.vib(15); }
      else { SND.play('error'); msg('La goupille résiste...', 'bad'); var lp = $('#lp'); lp.classList.remove('miss'); void lp.offsetWidth; lp.classList.add('miss'); }
      pin++; wait = 0.55;
      if (pin >= 3) { ended = true; setTimeout(function () { done(ok); }, 600); } else setTimeout(setup, 500);
    }
    tap($('#mtap'), hit); tap($('#lp'), hit);
  }
  ACT.lockpick = function () {
    var run = S().run; if (!run || run.phase !== 'room' || run.room.type !== 'tresor') return;
    if (run.room.mimic) { ACT.room({ a: 'open' }); return; }
    SND.play('click'); lockpick(function (n) { ACT.room({ a: 'open', arg: n }); });
  };

  // ---------- Forge : 5 frappes, toucher quand l'anneau rejoint le cercle ----------
  function forge(done) {
    var root = sheet('<h2>⚒️ La Forge</h2><div class="tiny dim center" style="margin:-6px 0 8px">Frappe quand l’anneau rejoint le <b class="gold">cercle doré</b>. Cinq frappes.</div>' + pins(5) +
      '<div class="fg" id="fg"><div class="fgt"></div><div class="fgr" id="fgr"></div><div class="fgi" id="fgi">⚒️</div></div><div class="mmsg" id="mmsg">&nbsp;</div>');
    var L = typeof VFX !== 'undefined' ? VFX.attach(root) : null;
    var n = 0, ok = 0, t = 0, wait = 0.7, ended = false, T = 1.25, sc = 2.6;
    curPin(0);
    function next(good, label) {
      setPin(n, good); if (good) ok++; msg(label, good ? 'good' : 'bad'); n++; t = 0; wait = 0.5; T = 1.25 - n * 0.1;
      var r = $('#fgr'); if (r) r.style.opacity = 0;
      if (n >= 5) { ended = true; setTimeout(function () { done(ok); }, 650); } else curPin(n);
    }
    loop(root, function (dt) {
      if (ended) return false; if (wait > 0) { wait -= dt; return; }
      t += dt; sc = 2.6 - 2.2 * (t / T);
      var r = $('#fgr'); if (r) { r.style.opacity = 1; r.style.transform = 'scale(' + sc.toFixed(3) + ')'; }
      if (sc < 0.45) { SND.play('error'); next(false, 'Trop tard !'); }
    });
    tap($('#fg'), function () {
      if (ended || wait > 0) return; var d = Math.abs(sc - 1), fi = $('#fgi');
      fi.classList.remove('hit'); void fi.offsetWidth; fi.classList.add('hit');
      if (d <= 0.3) { SND.play('block'); SND.play(d <= 0.12 ? 'crit' : 'hit'); burst(L, $('#fg'), d <= 0.12 ? 'crit' : 'fire', d <= 0.12 ? 30 : 16); UI.vib(d <= 0.12 ? 30 : 15); next(true, d <= 0.12 ? 'Parfait !' : 'Bien !'); }
      else { SND.play('error'); next(false, sc > 1 ? 'Trop tôt !' : 'Trop tard !'); }
    });
  }

  // ---------- Runes : retenir et répéter une suite de plus en plus longue ----------
  var STONES = ['🔥', '💧', '🌿', '⚡', '🌙', '☀️'], TONES = ['click', 'equip', 'gold', 'potion', 'buy', 'upgrade'];
  function runes(done) {
    var root = sheet('<h2>🔮 Les Runes</h2><div class="tiny dim center" style="margin:-6px 0 8px">Regarde les pierres s’allumer, puis touche-les <b>dans le même ordre</b>. Trois suites, de plus en plus longues.</div>' + pins(3) +
      '<div class="rn" id="rn">' + STONES.map(function (e, i) { return '<button class="rs s' + i + '" data-i="' + i + '">' + e + '</button>'; }).join('') + '</div><div class="mmsg" id="mmsg">Regarde bien...</div>');
    var L = typeof VFX !== 'undefined' ? VFX.attach(root) : null;
    var round = 0, seq = [], at = 0, listen = false, ended = false, id = ++loopId;
    function alive() { return id === loopId && document.body.contains(root); }
    function lit(i, ms) { var b = root.querySelectorAll('.rs')[i]; if (!b) return; b.classList.add('on'); SND.play(TONES[i], 0.8); setTimeout(function () { b.classList.remove('on'); }, ms); }
    function play() {
      listen = false; at = 0; seq = []; var len = 3 + round, prev = -1;
      for (var k = 0; k < len; k++) { var v; do { v = Math.floor(Math.random() * 6); } while (v === prev); prev = v; seq.push(v); }
      curPin(round); msg('Regarde bien...', '');
      seq.forEach(function (v, k) { setTimeout(function () { if (alive()) lit(v, 380); }, 650 + k * 560); });
      setTimeout(function () { if (alive()) { listen = true; msg('À toi !', 'gold'); root.querySelector('.rn').classList.add('go'); } }, 650 + len * 560);
    }
    function end(n) { ended = true; listen = false; setTimeout(function () { done(n); }, 700); }
    tap($('#rn'), function (ev) {
      var b = ev.target.closest ? ev.target.closest('.rs') : null; if (!b || !listen || ended) return; var i = +b.dataset.i;
      lit(i, 200);
      if (i !== seq[at]) { setPin(round, false); SND.play('error'); msg('Ce n’était pas celle-là.', 'bad'); root.querySelector('.rn').classList.remove('go'); var good = root.querySelectorAll('.rs')[seq[at]]; if (good) good.classList.add('was'); end(round); return; }
      at++;
      if (at >= seq.length) {
        setPin(round, true); round++; listen = false; root.querySelector('.rn').classList.remove('go'); SND.play('levelup', 0.6); burst(L, $('#rn'), 'dark', 22); UI.vib(20);
        msg(round >= 3 ? 'Les trois sceaux cèdent !' : 'Sceau brisé !', 'good');
        if (round >= 3) end(3); else setTimeout(function () { if (alive()) play(); }, 900);
      }
    });
    play();
  }

  // ---------- Roue du destin ----------
  var wheelRot = 0;
  function wheel(run) {
    var r = run.room, n = D.WHEEL.length, step = 360 / n;
    var labels = D.WHEEL.map(function (w, i) { return '<span style="transform:rotate(' + (i * step + step / 2) + 'deg) translateY(calc(var(--wr, 92px) * -1))"><em style="transform:rotate(' + (-(i * step + step / 2)) + 'deg)">' + w.icon + '</em></span>'; }).join('');
    var root = sheet('<h2>🎡 Roue du destin</h2><p class="center dim small" style="margin-top:-6px">« Un tour offert. Le second se paie. » · Tu as <b class="gold">💰 <span id="wgold">' + run.gold + '</span></b></p>' +
      '<div class="wheelbox"><div class="wptr"></div><div class="wheel" id="wheel" style="transform:rotate(' + wheelRot + 'deg)">' + labels + '</div><div class="whub"></div></div><div class="mmsg" id="mmsg">&nbsp;</div><div class="btns" id="wbtns"></div>');
    var L = typeof VFX !== 'undefined' ? VFX.attach(root) : null;
    function btns() {
      var can = r.spins === 0 || (r.spins === 1 && run.gold >= r.price);
      $('#wbtns').innerHTML = (r.spins < 2 ? '<button class="btn goldb' + (can ? '' : ' off') + '" data-act="wspin">' + (r.spins === 0 ? '🎡 TOURNER (gratuit)' : '🎡 Relancer · 💰 ' + r.price) + '</button>' : '') + (r.spins > 0 ? '<button class="btn primary" data-act="wleave">Repartir</button>' : '');
    }
    btns();
    ACT.wspin = function () {
      var res = E.roomAction('spin'); if (!res) { SND.play('error'); return; }
      $('#wbtns').innerHTML = ''; msg('...', '');
      var target = 360 - (res.i * step + step / 2) + (Math.random() * 24 - 12), cur = ((wheelRot % 360) + 360) % 360;
      wheelRot += 360 * 5 + ((target - cur) + 360) % 360;
      var w = $('#wheel'); w.style.transition = 'transform 3.6s cubic-bezier(.12,.62,.08,1)'; w.style.transform = 'rotate(' + wheelRot + 'deg)';
      for (var k = 0; k < 22; k++) setTimeout(function () { if (document.body.contains(root)) SND.play('click', 0.6); }, 3300 * Math.pow(k / 22, 1.8));
      setTimeout(function () {
        if (!document.body.contains(root)) return; var sl = D.WHEEL[res.i], bad = !!sl.fx.curse;
        msg(sl.icon + ' ' + sl.name + ' — ' + res.txt, bad ? 'bad' : 'good'); SND.play(bad ? 'skill_dark' : sl.fx.artifact || sl.fx.item != null ? 'loot_epic' : 'gold');
        if (bad) UI.flash('#c2283a55'); else burst(L, $('#wheel'), sl.fx.artifact ? 'crit' : 'gold', 26);
        UI.vib(bad ? [60, 40, 60] : 25); $('#wgold').textContent = run.gold; UI.run.hud(); btns();
      }, 3750);
    };
    ACT.wleave = function () { E.roomAction('leave'); SND.play('click'); UI.run.after(); };
  }

  // ---------- Entrée des nouvelles salles ----------
  function room(run) {
    var t = run.room.type;
    if (t === 'roue') return wheel(run);
    if (t === 'forge') {
      sheet('<h2>⚒️ La Forge</h2><div class="room-art">⚒️</div><p class="center dim">Une enclume encore chaude, un marteau qui n’attend que toi.</p>' +
        '<div class="li"><div class="ic">🔥</div><div class="grow"><b>Cinq frappes</b><div class="small dim">Chaque frappe juste donne <b class="gold">+2 % attaque</b> pour la descente (+2 % d’office). Cinq sur cinq : +20 % dégâts critiques en plus.</div></div></div>' +
        '<div class="btns"><button class="btn goldb big" data-act="miniGo">FORGER</button></div><div class="btns" style="margin-top:8px"><button class="btn sm" data-act="miniSkip">Passer</button></div>');
    } else {
      sheet('<h2>🔮 Les Runes</h2><div class="room-art">🔮</div><p class="center dim">Six pierres gravées. Elles s’allument quand tu approches.</p>' +
        '<div class="li"><div class="ic">🧠</div><div class="grow"><b>Trois sceaux</b><div class="small dim">1 sceau : <b class="good">+25 % PV</b> · 2 sceaux : <b class="gold">une aubaine</b> en plus · 3 sceaux : <b style="color:#ffd87a">un éveil ✨</b> en plus.</div></div></div>' +
        '<div class="btns"><button class="btn goldb big" data-act="miniGo">TOUCHER LES PIERRES</button></div><div class="btns" style="margin-top:8px"><button class="btn sm" data-act="miniSkip">Passer</button></div>');
    }
  }
  ACT.miniGo = function () {
    var run = S().run; if (!run || run.phase !== 'room') return; var t = run.room.type; SND.play('click');
    if (t === 'forge') forge(function (n) { var txt = E.roomAction('forge', n); UI.run.after(txt, n >= 4 ? 'levelup' : 'upgrade'); if (n >= 5) UI.flash('#ffb34777'); });
    else if (t === 'runes') runes(function (n) { var txt = E.roomAction('runes', n); UI.run.after(txt, n >= 2 ? 'skill_holy' : n ? 'heal' : 'error'); if (n >= 3) UI.flash('#8f7cff77'); });
  };
  ACT.miniSkip = function () { var run = S().run; if (!run || run.phase !== 'room') return; var txt = E.roomAction('skip'); SND.play('click'); UI.run.after(txt); };

  return { room: room };
})();
