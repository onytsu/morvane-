/* MORVANE — tutoriel guidé : un projecteur sur chaque élément, une bulle, étape par étape */
UI.guide = (function () {
  'use strict';
  var S = UI.S, ACT = UI.ACT, root = null, steps = [], idx = 0, done = null, isOpen = false;

  // Tutoriel du premier combat, raconté par la Veilleuse
  var FIGHT = [
    { t: 'Ton premier combat', x: 'Écoute-moi bien, voyageur. Ici, chacun frappe à son tour : <b>toi d’abord</b>, puis tes ennemis. Laisse-moi te montrer.' },
    { s: '.unit.en', t: 'L’ennemi', x: 'Au-dessus de sa tête, il trahit <b>ce qu’il va faire</b>. Un glaive et un 12 : il frappera pour 12.<br>Touche-le pour le viser.' },
    { s: '.hprow', t: 'Ta vie', x: 'Cette barre rouge, c’est ce qu’il te reste de vie. Le petit blason à côté porte ton niveau.' },
    { s: '#aps', t: 'Tes actions', x: 'Ces deux losanges d’or sont tes <b>actions</b>. Frapper ou parer en coûte une.' },
    { s: '#bstrike', t: 'Frapper', x: 'Ta lame contre l’ennemi visé.<br>Quand un ennemi baisse sa garde, ce bouton se couvre d’<b class="g-y">or</b> et devient <b class="g-y">Critique</b>. Ne laisse pas passer ta chance.' },
    { s: '#bparry', t: 'Parer', x: 'Quand un ennemi rassemble ses forces pour un grand coup, ce bouton s’embrase de <b class="g-c">bleu</b>.<br>Pare à cet instant : le coup est brisé, et tu ripostes.' },
    { s: '#dtray', t: 'Tes dés', x: 'À chaque tour, tu tires <b>trois dés</b> de ton sac. Touche un dé de ta main, puis une case de la table : il agit aussitôt, et ne coûte rien. La ligne du haut te dit toujours quoi faire.' },
    { s: '.skills', t: 'Tes pouvoirs', x: 'Tes pouvoirs se nourrissent d’un dé, pas d’une action. L’étiquette dit lequel ils réclament. Quand ton dé convient, le cadre <b class="g-g">s’illumine</b>.' },
    { s: '#tpass', t: 'Fin du tour', x: 'Quand tu as tout joué, rends la main. Les ennemis agiront.' },
    { s: '[data-act=runMenu]', t: 'Le menu', x: 'L’aide, la vitesse, le jeu automatique et la posture dorment ici. Tu pourras m’y rappeler.' },
    { t: 'Va, maintenant', x: 'Frappe juste, pose tes dés… et <b class="g-c">guette la lueur bleue</b>.', btn: 'Au combat' }
  ];
  // Rappels qui apparaissent une seule fois, au bon moment
  var ONCE = {
    parry: { s: '#bparry', t: 'Pare, maintenant !', x: 'Il rassemble ses forces. Touche le bouton <b class="g-c">bleu</b> : son coup se brisera sur toi.', tap: 1 },
    weak: { s: '#bstrike', t: 'Sa garde est ouverte', x: 'Ton bouton est devenu <b class="g-y">Critique</b>. Frappe avant la fin du tour !', tap: 1 }
  };
  // Premier passage au camp
  var CAMP = [
    { t: 'Le camp', x: 'Te voilà revenu. Entre deux descentes, on se repose ici, près de la dernière flamme.' },
    { s: '.camp-hero', t: 'Ton héros', x: 'Touche-le pour voir ses pouvoirs, son équipement et sa force. Les flèches changent de héros.' },
    { s: '[data-act=descend]', t: 'Descendre', x: 'Quand tu es prêt, retourne dans les profondeurs. Ce que tu trouves, <b>tu le gardes</b>, même dans la mort.' },
    { s: '.camp-quick', t: 'Autour du feu', x: 'Tes talents, les quêtes du jour, la chronique de Morvane et ta gloire. Une braise rouge signale ce qui t’attend.' },
    { s: '.tabs', t: 'Le reste', x: 'Ton sac, l’autel des bonus permanents, les pactes et tes hauts faits.', btn: 'Compris' }
  ];
  // Habillage : les cadres pixel servent de bordures à toute l’interface
  (function skin() {
    var r = document.documentElement.style;
    ['iron', 'gold', 'cyan', 'dark'].forEach(function (k) { r.setProperty('--fr-' + k, 'url(' + Sprites.url('ui_' + k) + ')'); });
    // icônes pixel des pouvoirs et des ultimes de chaque héros
    DATA.HEROES.forEach(function (h) { h.skills.forEach(function (k) { k.icon = UI.spr('sk_' + k.id, 'ski'); }); h.ult.icon = UI.spr('ul_' + h.id, 'ski'); h.passive.icon = UI.spr('pa_' + h.id, 'ski'); });
    Object.keys(DATA.DICE).forEach(function (t) { DATA.DICE[t].icon = UI.spr('dt_' + t, 'dgl'); });
    // icônes pixel des passifs : aubaines, aubaines propres à chaque héros (celles qui renforcent un pouvoir reprennent son icône) et pactes
    DATA.BOONS.forEach(function (b) { b.icon = UI.spr('bn_' + b.id.slice(2), 'ski'); });
    DATA.HEROES.forEach(function (h) { h.boons.forEach(function (b) { var m = b.mods, k = m.s1P ? 0 : m.s2P ? 1 : m.s3P ? 2 : -1; b.icon = UI.spr(k >= 0 ? 'up_' + h.skills[k].id : 'cb_' + b.id.slice(2), 'ski'); }); });
    DATA.PACTS.forEach(function (p) { p.icon = UI.spr('pc_' + p.id.slice(3), 'ski'); });
    // icônes utilisées par la feuille de style, puis remplacement de tous les emojis du jeu par leurs icônes pixel
    [['bolt', 'bn_foudre'], ['fire', 'bn_flamme'], ['ice', 'e_snow'], ['glass', 'bn_tempo']].forEach(function (k) { r.setProperty('--e-' + k[0], 'url(' + Sprites.url(k[1]) + ')'); });
    UI.emoWatch(document.getElementById('app'));
  })();

  function build() {
    root = document.createElement('div'); root.id = 'guide';
    root.innerHTML = '<div class="g-hole"></div><div class="g-bub"><span class="g-who">La Veilleuse</span>' + UI.spr('veilleuse', 'g-face') + '<div class="g-t"></div><div class="g-x"></div><div class="g-f"><span class="g-dots"></span><button class="g-skip">Passer</button><button class="g-next"></button></div></div>';
    document.getElementById('app').appendChild(root);
    root.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.g-skip')) { SND.play('click'); close(); return; }
      if (e.target.closest('.g-next')) { SND.play('click'); next(); return; }
      var st = steps[idx]; if (st && st.tap && e.target.closest('.g-hole')) { var el = target(st); close(); if (el) el.click(); }
    });
    window.addEventListener('resize', function () { if (isOpen) place(); });
  }
  function target(st) { if (!st.s) return null; var all = document.querySelectorAll(st.s); for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect(); if (r.width > 0 && r.height > 0) return all[i]; } return null; }
  function place() {
    var st = steps[idx], el = target(st), app = document.getElementById('app').getBoundingClientRect(), hole = root.firstChild, bub = root.lastChild;
    bub.querySelector('.g-t').innerHTML = st.t; bub.querySelector('.g-x').innerHTML = st.x;
    var many = steps.length > 1, d = ''; if (many) for (var i = 0; i < steps.length; i++) d += '<i class="' + (i === idx ? 'on' : '') + '"></i>';
    bub.querySelector('.g-dots').innerHTML = d;
    bub.querySelector('.g-next').textContent = st.btn || (idx < steps.length - 1 ? 'Suivant' : 'Compris');
    bub.querySelector('.g-skip').style.display = many && idx < steps.length - 1 ? '' : 'none';
    root.classList.toggle('tap', !!st.tap);
    if (!el) { root.classList.add('center'); hole.style.cssText = ''; bub.style.top = ''; bub.style.bottom = ''; return; }
    root.classList.remove('center');
    var r = el.getBoundingClientRect(), pad = 6, top = r.top - app.top - pad, left = r.left - app.left - pad;
    hole.style.cssText = 'top:' + top + 'px;left:' + left + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
    var below = r.top + r.height / 2 < app.top + app.height / 2;
    if (below) { bub.style.top = Math.min(app.height - 200, top + r.height + pad * 2 + 12) + 'px'; bub.style.bottom = ''; }
    else { bub.style.bottom = Math.min(app.height - 200, app.height - top + 12) + 'px'; bub.style.top = ''; }
  }
  function show() {
    while (idx < steps.length && steps[idx].s && !target(steps[idx])) idx++;
    if (idx >= steps.length) { close(); return; }
    root.classList.remove('pop'); void root.offsetWidth; root.classList.add('pop'); place();
  }
  function next() { idx++; if (idx >= steps.length) close(); else show(); }
  function close() {
    if (!isOpen) return; isOpen = false; root.classList.remove('on', 'pop');
    var fn = done; done = null; E_save(); if (fn) fn();
  }
  function E_save() { try { ENGINE.save(); } catch (e) { } }
  function run(list, fn) {
    if (!root) build(); if (!list.length) { if (fn) fn(); return; }
    steps = list; idx = 0; done = fn || null; isOpen = true; root.classList.add('on'); show();
  }
  // Tutoriel du premier combat (ou relancé depuis le menu)
  function start(replay) {
    var t = S().tuto; t.guide = 1; ['skill3', 'aim', 'press', 'intent', 'dice2'].forEach(function (k) { t[k] = 1; });
    run(FIGHT, null);
  }
  function once(key) {
    var t = S().tuto, run0 = S().run; if (t['g_' + key] || isOpen || !t.guide) return;
    if (S().settings.auto || document.getElementById('modal').classList.contains('on') || (UI.story && UI.story.open())) return;
    t['g_' + key] = 1; run([ONCE[key]], null);
  }
  function camp() { var t = S().tuto; if (t.gcamp) return false; t.gcamp = 1; setTimeout(function () { run(CAMP, null); }, 350); return true; }
  return { start: start, once: once, camp: camp, open: function () { return isOpen; } };
})();
