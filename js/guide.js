/* MORVANE — tutoriel guidé : un projecteur sur chaque élément, une bulle, étape par étape */
UI.guide = (function () {
  'use strict';
  var S = UI.S, ACT = UI.ACT, root = null, steps = [], idx = 0, done = null, isOpen = false;

  // Tutoriel du premier combat
  var FIGHT = [
    { t: 'Ton premier combat', x: 'Le combat se joue <b>au tour par tour</b> : tu joues, puis les ennemis jouent.<br>Je te montre l’essentiel en quelques étapes.' },
    { s: '.unit.en', t: 'L’ennemi', x: 'Au-dessus de sa tête, tu vois <b>ce qu’il va faire</b> à son tour.<br>⚔️ 12 = il va frapper pour 12.<br>Touche un ennemi pour le viser.' },
    { s: '.hprow', t: 'Ta vie', x: 'La barre rouge, ce sont tes <b>points de vie</b>. Le petit rond à gauche, c’est ton niveau.' },
    { s: '#aps', t: 'Tes actions ⚡', x: 'À chaque tour tu as <b>2 actions</b>. Frapper ou Parer coûte 1 action.' },
    { s: '#bstrike', t: 'Frapper', x: 'Attaque l’ennemi visé.<br>Parfois un ennemi se découvre : ce bouton devient <b class="g-y">💥 COUP CRITIQUE</b> en jaune. Appuie vite, ça fait très mal !' },
    { s: '#bparry', t: 'Parer', x: 'Quand un ennemi prépare un gros coup, ce bouton s’allume en <b class="g-c">BLEU VIF : PARE !</b><br>Pare à ce moment-là : le coup est annulé et tu ripostes.' },
    { s: '#dtray', t: 'Tes dés', x: 'Chaque tour, tu reçois <b>3 dés</b>. Touche une case de la table pour en poser un : il agit tout de suite, <b>gratuitement</b>.<br>⚔️ frappe · 🛡️ protège · ❤️ soigne' },
    { s: '.skills', t: 'Tes pouvoirs', x: 'Un pouvoir se lance <b>avec un dé</b>, sans dépenser d’action.<br>L’étiquette blanche dit quel dé il veut (≤3, PAIR...). Il s’allume en <b class="g-g">vert</b> quand ton dé convient.' },
    { s: '#tpass', t: 'Fin du tour', x: 'Quand tu as fini, touche ici : les ennemis jouent à leur tour.' },
    { s: '[data-act=runMenu]', t: 'Le menu', x: 'L’aide, la vitesse, le jeu automatique et la posture sont rangés ici.<br>Tu peux aussi y revoir ce tutoriel.' },
    { t: 'À toi de jouer !', x: 'Frappe, pose tes dés, et <b>surveille le bouton bleu</b>.', btn: 'C’EST PARTI' }
  ];
  // Rappels qui apparaissent une seule fois, au bon moment
  var ONCE = {
    parry: { s: '#bparry', t: 'PARE MAINTENANT !', x: 'Un ennemi charge un gros coup ⚠️.<br>Touche le bouton <b class="g-c">bleu</b> : le coup sera annulé.', tap: 1 },
    weak: { s: '#bstrike', t: 'Point faible !', x: 'Un ennemi s’est découvert. Ton bouton Frapper est devenu <b class="g-y">💥 COUP CRITIQUE</b> : appuie avant la fin du tour !', tap: 1 }
  };
  // Premier passage au camp
  var CAMP = [
    { t: 'Le camp', x: 'Entre deux descentes, ton héros se repose ici, au coin du feu.' },
    { s: '.camp-scene', t: 'Ton héros', x: 'Touche-le pour voir ses pouvoirs et ses statistiques. Les flèches ‹ › changent de héros.' },
    { s: '[data-act=descend]', t: 'Descendre', x: 'Repars au combat. Tu gardes <b>tout ton butin</b>, même si tu meurs.' },
    { s: '.camp-quick', t: 'Raccourcis', x: 'Talents, quêtes du jour, histoire... Un point rouge 🔴 signale quelque chose à prendre.' },
    { s: '.tabs', t: 'Le reste', x: '🎒 Sac : ton équipement · ⚱️ Autel : bonus permanents · 📜 Pactes · 🏆 Hauts faits.', btn: 'COMPRIS' }
  ];

  function build() {
    root = document.createElement('div'); root.id = 'guide';
    root.innerHTML = '<div class="g-hole"></div><div class="g-bub"><div class="g-t"></div><div class="g-x"></div><div class="g-f"><span class="g-dots"></span><button class="g-skip">Passer</button><button class="g-next"></button></div></div>';
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
    bub.querySelector('.g-next').textContent = st.btn || (idx < steps.length - 1 ? 'Suivant ›' : st.tap ? 'Compris' : 'OK');
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
