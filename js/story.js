/* MORVANE — l'histoire : prologue, six chapitres, épilogue.
   Chaque chapitre a quatre scènes (arrivée, mi-parcours, face au gardien, après sa chute), jouées une seule fois
   pendant la descente puis relisibles dans la Chronique du sanctuaire. */
UI.story = (function () {
  'use strict';
  var E = ENGINE, D = DATA, ACT = UI.ACT, $ = UI.$;
  function S() { return E.S; }
  function seen() { if (!S().story) S().story = {}; return S().story; }

  // Une page : [qui, texte, options]. qui : null = récit, 'V' = la Veilleuse, 'H' = ton héros, 'B' = le gardien de la zone.
  var HERO_LINE = {
    chevalier: 'J’étais de sa garde. J’ai juré de le protéger. Aujourd’hui, le protéger, c’est le coucher pour de bon.',
    pyro: 'Il éteint les feux ? Alors il en a peur. Très bien. J’en apporte.',
    assassin: 'On m’a payé pour un roi, autrefois. Je n’ai jamais rendu l’avance.',
    necro: 'Les morts d’en bas, je les connais tous par leur nom. Lui n’en a pas. Ça m’intrigue.',
    berserker: 'Dans le Nord on dit : ce qui ne saigne pas, on le casse.',
    pretresse: 'J’ai prié avec eux, la quarantième nuit. Je descends reprendre ma prière.',
    chasseuse: 'Mon frère se balance encore dans le bois d’en bas. Je vais le décrocher.',
    moine: 'Je n’ai rien à lui demander. C’est pour ça que j’irai jusqu’au bout.'
  };
  var CH = [
    { id: 'pro', num: 'Prologue', title: 'La dernière flamme', zone: 0, color: '#ffb347', beats: [
      { key: 'pro', label: 'La dernière flamme', bg: 'title', pages: [
        [null, 'Morvane était un royaume de cloches et de moissons. Puis la peste est montée du marais, et le roi Théobald est mort comme tout le monde.'],
        [null, 'Son peuple ne l’a pas accepté. Quarante nuits, il a prié pour qu’il revienne. La quarante et unième, quelque chose a répondu.'],
        [null, 'Le roi s’est relevé. Une armure, une couronne, et rien dedans. Depuis, chaque feu qu’il approche s’éteint. On l’appelle le Roi Creux.'],
        ['V', 'Te voilà debout. Doucement : tu étais de la cendre il y a un instant.', { bg: 'camp', l: 'H', r: 'veilleuse' }],
        ['V', 'Je suis la Veilleuse. Cette flamme est la dernière de Morvane. Tant qu’elle brûle, ceux qu’elle a réchauffés peuvent se relever.'],
        ['V', 'Sous cette chapelle, six royaumes pourrissent. Tout en bas, il y a un trône. Descends. Si tu tombes, je te rallumerai.'],
        ['V', 'Emporte cette braise. Par elle, je te verrai. Et de temps en temps, je te parlerai.'],
        ['H', '@hero']
      ] }
    ] },
    { id: 'c1', num: 'Chapitre I', title: 'Ceux qui ne dorment plus', zone: 1, beats: [
      { key: 'c1.intro', label: 'La descente', pages: [
        [null, 'Sous la chapelle, l’escalier descend plus loin que les fondations. Les dalles portent des noms. La plupart ont été grattés.'],
        [null, 'Ici reposaient les morts de Morvane. Reposaient. Les tombes sont ouvertes, et elles l’ont été de l’intérieur.'],
        ['V', 'Le Fossoyeur a enterré le roi de ses propres mains. Demande-lui ce qu’il a entendu, cette nuit-là.', { r: 'veilleuse' }]
      ] },
      { key: 'c1.mid', label: 'Le compte à la craie', pages: [
        [null, 'Sur un mur, quelqu’un a tenu un compte à la craie. Des milliers de bâtons. Le dernier est suivi d’un seul mot : « presque ».'],
        [null, 'Les morts que tu abats portent leurs habits du dimanche. On les a enterrés avec soin. Quelqu’un les aimait.']
      ] },
      { key: 'c1.boss', label: 'Trois coups', r: 'B', pages: [
        ['B', '@taunt'],
        ['B', 'Je l’ai mis en terre, tu sais. Six pieds, bien tassés. Et la nuit, il a frappé au couvercle. Trois coups. Poliment.'],
        ['B', 'Alors j’ai ouvert. Qu’est-ce que tu aurais fait, toi ? C’était mon roi.']
      ] },
      { key: 'c1.end', label: 'La fosse', pages: [
        [null, 'Le Fossoyeur tombe dans la fosse qu’il creusait. Elle était à sa taille. Elle l’attendait depuis longtemps.'],
        ['B', 'Il n’avait pas de visage, sous le linceul… Alors j’ai fermé les yeux. Les miens.', { r: 'B' }],
        [null, 'Derrière la dernière tombe, des racines ont crevé le mur. Elles viennent d’en bas, et elles sentent la corde mouillée.', { r: null }]
      ] }
    ] },
    { id: 'c2', num: 'Chapitre II', title: 'Les arbres ont de la mémoire', zone: 2, beats: [
      { key: 'c2.intro', label: 'La lune d’en bas', pages: [
        [null, 'Une forêt, sous la terre. Il ne devrait pas y avoir de lune ici. Il y en a une, pâle comme un œil qui ne cligne pas.'],
        [null, 'Quand le roi est revenu, certains ont osé dire qu’il était mort. On les a pendus pour mensonge. Puis on a pendu ceux qui les pleuraient.'],
        [null, 'Les cordes sont toujours là. Elles se balancent sans vent.']
      ] },
      { key: 'c2.mid', label: 'Les souliers', pages: [
        [null, 'Au pied d’un chêne, un petit soulier. Plus loin, un autre arbre, un autre soulier. Quelqu’un les a rangés par paires.'],
        [null, 'Les ronces s’écartent sur ton passage. Ce n’est pas de la peur. Elles te montrent le chemin : on t’attend.']
      ] },
      { key: 'c2.boss', label: 'La mère', r: 'B', pages: [
        ['B', '@taunt'],
        ['B', 'Ils ont pendu mon fils pour avoir dit la vérité. Je l’ai décroché. Puis j’ai décroché tous les autres. Les arbres m’ont aidée.'],
        ['B', 'Maintenant ils sont tous à moi. Toi aussi, tu as l’air d’un enfant perdu.']
      ] },
      { key: 'c2.end', label: 'Les cordes dénouées', pages: [
        [null, 'La Mère des Ronces se défait, branche après branche. Dans tout le bois, les cordes se dénouent d’elles-mêmes.'],
        ['V', 'Je l’ai connue, avant. Elle vendait des pommes au marché. Tu lui as rendu son chagrin : c’est mieux que ce qu’elle en avait fait.', { r: 'veilleuse' }],
        [null, 'Sous les racines arrachées, de l’eau suinte. Noire, tiède. Elle a l’odeur du commencement : celle de la peste.', { r: null }]
      ] }
    ] },
    { id: 'c3', num: 'Chapitre III', title: 'Ce que l’eau a gardé', zone: 3, beats: [
      { key: 'c3.intro', label: 'Le marais', pages: [
        [null, 'C’est d’ici que la peste est montée. On a jeté les premiers malades dans le marais pour sauver les autres. Ça n’a sauvé personne.'],
        [null, 'L’eau n’a rien rendu. Ni les corps, ni les barques, ni les cloches qu’on a noyées pour qu’elles cessent de sonner le glas.'],
        [null, 'Des lueurs dansent au ras de l’eau. Ne les suis pas. Elles ont déjà quelqu’un à qui tenir compagnie.']
      ] },
      { key: 'c3.mid', label: 'La table mise', pages: [
        [null, 'Une cabane sur pilotis. Dedans, une table mise pour deux, couverte de vase. Le pain est encore là. Personne n’est revenu dîner.'],
        [null, 'Par moments, tout le marais se soulève et retombe. Lentement. Comme une poitrine.']
      ] },
      { key: 'c3.boss', label: 'L’île qui ouvre un œil', r: 'B', pages: [
        [null, 'L’eau se retire d’un seul coup. Ce que tu prenais pour une île ouvre un œil.'],
        [null, 'Il ne dit rien. Il n’en a pas besoin. Au fond de sa gueule, tu reconnais des visages. Ils ont l’air de dormir.']
      ] },
      { key: 'c3.end', label: 'Les noyés', pages: [
        [null, 'Le Léviathan s’échoue. De son ventre, le marais rend enfin ses noyés. Ils flottent, les mains ouvertes, apaisés.'],
        ['V', 'Le roi est mort de cette eau-là, comme eux. Je lui tenais la main. Retiens bien ça : il est mort. Vraiment mort.', { r: 'veilleuse' }],
        [null, 'Au fond du bassin vidé, des marches de marbre. Et, très loin en dessous, des voix qui chantent faux.', { r: null }]
      ] }
    ] },
    { id: 'c4', num: 'Chapitre IV', title: 'La prière exaucée', zone: 4, beats: [
      { key: 'c4.intro', label: 'Quarante nuits', pages: [
        [null, 'Une cathédrale entière, engloutie avec ses fidèles. Les cierges y brûlent d’une flamme qui n’éclaire pas.'],
        [null, 'C’est ici qu’on a prié quarante nuits. C’est ici que la prière a été exaucée. Personne n’a songé à demander par qui.'],
        [null, 'Sur les vitraux, les saints ont le visage gratté. Tous. Avec les ongles.']
      ] },
      { key: 'c4.mid', label: 'Le registre', pages: [
        [null, 'Sur un lutrin, un registre : les noms de ceux qui ont prié. La dernière page est signée d’une seule main, mille fois.'],
        [null, 'Un seul nom manque. Celui de la reine. Elle n’a pas prié. Elle a pris la bougie du chevet, et elle est partie.']
      ] },
      { key: 'c4.boss', label: 'Sans visage', r: 'B', pages: [
        ['B', '@taunt'],
        ['B', 'J’ai demandé qu’il revienne. Je n’ai pas précisé ce qui devait revenir. C’est ma seule faute, et elle est sans fond.'],
        ['B', 'Je l’ai vu de près, le soir du miracle. Depuis, je n’ai plus besoin de visage.']
      ] },
      { key: 'c4.end', label: 'La faim', pages: [
        [null, 'L’Évêque s’effondre devant l’autel. Sous le masque, il n’y a rien à regarder. Il sourit quand même : ça se sent.'],
        ['B', 'Ne lui en veux pas… Il n’a rien demandé. C’est nous qui avions faim de lui.', { r: 'B' }],
        [null, 'Derrière l’autel, une trappe laisse monter une chaleur de four. Quelque part en bas, un marteau frappe sans jamais s’arrêter.', { r: null }]
      ] }
    ] },
    { id: 'c5', num: 'Chapitre V', title: 'La couronne trop grande', zone: 5, beats: [
      { key: 'c5.intro', label: 'Les forges royales', pages: [
        [null, 'Les forges royales. On y a fait les épées de Morvane, ses cloches, ses grilles. Et, pour finir, une couronne.'],
        [null, 'Car le roi revenu n’avait plus de tête où la poser. Il fallait une couronne assez grande pour tenir sur du vide.'],
        [null, 'Les forgerons sont toujours à leur poste. Enchaînés. Ils brûlent sans se consumer, et ils continuent de frapper.']
      ] },
      { key: 'c5.mid', label: 'Les couronnes ratées', pages: [
        [null, 'Dans un coin, des couronnes ratées, par centaines. Toutes trop petites. Le vide grandissait plus vite que le métal.'],
        [null, 'Sur une enclume, gravé au burin : « Si elle refroidit, il s’en apercevra. »']
      ] },
      { key: 'c5.boss', label: 'Tant qu’elle est chaude', r: 'B', pages: [
        ['B', '@taunt'],
        ['B', 'J’ai forgé sa couronne. Tant qu’elle est chaude, il croit qu’il est roi. Il croit qu’il est quelqu’un.'],
        ['B', 'Tu veux savoir ce qu’il fera, le jour où il comprendra qu’il n’est personne ? Moi, non. Alors je chauffe.']
      ] },
      { key: 'c5.end', label: 'La forge refroidit', pages: [
        [null, 'Le Seigneur des Braises s’éteint comme un tison sous la pluie. Une à une, les enclumes se taisent.'],
        [null, 'Pour la première fois depuis des années, la forge refroidit. Très loin au-dessous, quelque chose le remarque.'],
        ['V', 'Il sait que tu viens, maintenant. Je le sens d’ici : ma flamme penche vers le bas.', { r: 'veilleuse' }]
      ] }
    ] },
    { id: 'c6', num: 'Chapitre VI', title: 'Le Roi Creux', zone: 6, beats: [
      { key: 'c6.intro', label: 'Sous le monde', pages: [
        [null, 'Plus de pierre, plus de terre. Un ciel violet sans étoiles, sous le monde. Tout ce qui a été éteint finit ici.'],
        [null, 'Les ombres qui rôdent ont été des gens. Elles ne s’en souviennent pas. Elles se souviennent seulement d’avoir eu chaud.'],
        [null, 'Au bout de la salle, un trône. Dessus, une armure assise bien droite, comme on l’apprend aux rois.']
      ] },
      { key: 'c6.mid', label: 'Les portraits', pages: [
        [null, 'Des portraits, le long des murs. Le même homme, de l’enfance à la vieillesse. Sur le dernier, la toile est intacte et le visage est absent.'],
        [null, 'Tu comprends en marchant. Le roi Théobald est mort de la peste, et il est resté mort. Ce qui est assis là-bas n’est pas lui.'],
        [null, 'C’est la prière. Quarante nuits de « reviens », sans personne pour y répondre. Elle a pris la place.']
      ] },
      { key: 'c6.boss', label: 'Ce qui a répondu', r: 'B', pages: [
        ['B', '@taunt'],
        ['B', 'Ils m’ont appelé. J’ai répondu. J’ai cherché ce qu’ils voulaient dans chaque feu, dans chaque poitrine. Rien n’a suffi.'],
        ['B', 'Tu portes une braise. Sa flamme à elle. Donne. C’est tout ce qu’il me manque pour être lui.']
      ] },
      { key: 'c6.end', label: 'Le trône vide', pages: [
        [null, 'L’armure s’effondre, pièce à pièce. Elle sonne creux. La couronne roule jusqu’à tes pieds. Elle est encore trop grande.'],
        ['B', 'Dis-leur… que j’ai essayé… d’être lui.', { r: 'B' }],
        ['V', 'C’est fini ? … Non. Je le sens encore. On ne tue pas un vide. On le comble, un feu après l’autre.', { r: 'veilleuse' }]
      ] }
    ] },
    { id: 'epi', num: 'Épilogue', title: 'Un feu après l’autre', zone: 0, color: '#ffb347', beats: [
      { key: 'epi', label: 'Un feu après l’autre', bg: 'camp', l: 'H', r: 'veilleuse', pages: [
        ['V', 'Tu es remonté. Assieds-toi. Regarde la flamme : elle est plus haute qu’hier.'],
        ['V', 'J’étais sa reine. Je n’ai pas prié avec les autres. J’ai gardé la bougie de son chevet : un mort a droit à une lumière, pas à un rappel.'],
        ['V', 'Le trône est vide. Mais sous le trône il y a l’Abîme : tout ce que la prière a creusé. Ça ne se referme pas en un jour.'],
        ['V', 'Alors on continue. Tu descends, tu rapportes des cendres, je rallume. C’est long, de rendre un royaume.'],
        [null, 'Quelque part au-dessus, pour la première fois depuis longtemps, une cloche sonne. Une seule. C’est un début.', { bg: 'title', l: null, r: null }]
      ] }
    ] }
  ];
  var BEAT = {}, CHOF = {};
  CH.forEach(function (c) { c.beats.forEach(function (b) { BEAT[b.key] = b; CHOF[b.key] = c; }); });
  var TOTAL = Object.keys(BEAT).length;

  // ---------- déblocage ----------
  function unlocked(key) {
    var c = CHOF[key], st = S().stats;
    if (seen()[key]) return true;
    if (c.id === 'pro') return st.runs > 0;
    if (c.id === 'epi') return st.boss6 > 0;
    return st.bossMax >= c.zone;
  }
  function countUnlocked() { var n = 0; for (var k in BEAT) if (unlocked(k)) n++; return n; }
  function current() { var cur = CH[0]; CH.forEach(function (c) { if (c.beats.some(function (b) { return unlocked(b.key); })) cur = c; }); return cur; }
  function fresh() { return !seen()._read && countUnlocked() > 0; }

  // ---------- lecture d'une scène ----------
  var root = null, queue = [], cur = null, typeT = null, isOpen = false, fxL = null;
  function heroId() { var s = S(); return (s.run && s.run.hero) || s.hero || 'chevalier'; }
  function sprOf(v, zone) { if (v === 'H') return heroId(); if (v === 'N') return cur && cur.npc ? (cur.npc.spr === 'H' ? heroId() : cur.npc.spr) : null; if (v === 'B') return zone ? D.ZONES[zone - 1].boss : null; return v || null; }
  function whoName(w, zone) { if (w === 'N') return cur && cur.npc ? cur.npc.name : ''; return w === 'V' ? 'La Veilleuse' : w === 'H' ? E.hero(heroId()).name : w === 'B' && zone ? D.ENEMIES[D.ZONES[zone - 1].boss].name : ''; }
  function txtOf(t, zone) { if (t === '@hero') return HERO_LINE[heroId()] || HERO_LINE.chevalier; if (t === '@taunt') return D.ZONES[zone - 1].taunt; return t; }
  // Voix : chaque personnage a sa hauteur de bip pendant que son texte s'écrit
  var HV = { chevalier: 150, pyro: 190, assassin: 170, necro: 120, berserker: 100, pretresse: 260, chasseuse: 230, moine: 140 };
  function voiceOf(w) {
    if (w === 'V') return [300, 0.8, 'triangle'];
    if (w === 'H') return [HV[heroId()] || 160, 0.8, 'square'];
    if (w === 'B') return [85, 0.9, 'sawtooth'];
    if (w === 'N') return [(cur && cur.npc && cur.npc.voice) || 160, 0.85, (cur && cur.npc && cur.npc.wave) || 'square'];
    return [560, 0.35, 'triangle'];
  }
  function ensure() {
    if (root) return;
    root = document.createElement('div'); root.id = 'story';
    root.innerHTML = '<div class="st-scene"><div class="st-bg a"></div><div class="st-bg b"></div><div class="st-ch st-l"></div><div class="st-ch st-r"></div><div class="st-vig"></div></div>' +
      '<div class="st-top"><span class="st-chap"></span><button class="st-skip" data-st="skip">Passer ⏭</button></div>' +
      '<div class="st-box"><div class="st-who"></div><p class="st-txt"></p><div class="st-opts"></div><div class="st-foot"><span class="st-dots"></span><span class="st-next">▼</span></div></div>' +
      '<div class="st-card"><div class="st-orn">✦</div><div class="st-num"></div><h1></h1><div class="st-rule"></div><div class="st-sub"></div><div class="st-tap">Touche pour continuer</div></div>';
    document.getElementById('app').appendChild(root);
    root.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest && e.target.closest('[data-st=opt]');
      if (opt) { pickOpt(+opt.getAttribute('data-i')); return; }
      if (e.target.closest && e.target.closest('[data-st=skip]')) { SND.play('click'); if (cur && cur.talk && cur.talk.phase === 'intro') { endType(); showOpts(); } else if (!(cur && cur.talk && cur.talk.phase === 'choose')) finish(); return; }
      if (cur && cur.talk && cur.talk.phase === 'choose') return;
      advance();
    });
  }
  function q(s) { return root.querySelector(s); }
  function bgUrl(id) { return typeof Backgrounds !== 'undefined' ? Backgrounds.url(id) : ''; }
  function setBg(id) {
    if (cur.bg === id) return; cur.bg = id;
    var a = q('.st-bg.a'), b = q('.st-bg.b'), on = cur.flip ? a : b, off = cur.flip ? b : a; cur.flip = !cur.flip;
    on.style.backgroundImage = 'url(' + bgUrl(id) + ')'; on.classList.add('on'); off.classList.remove('on');
    if (fxL && fxL.cv && fxL.cv.parentNode) fxL.cv.parentNode.removeChild(fxL.cv);
    var amb = { 1: 'dust', 2: 'leaves', 3: 'fireflies', 4: 'gold', 5: 'embers', 6: 'void', camp: 'embers', title: 'ash' }[id];
    fxL = typeof FX !== 'undefined' ? FX.attach(q('.st-scene'), { ambient: amb, warm: 2 }) : null;
  }
  function setCh(side, id) {
    var el = q('.st-' + side), key = side + 'Id'; if (cur[key] === id) return; cur[key] = id;
    if (!id) { el.classList.remove('on'); return; }
    var sz = typeof Sprites !== 'undefined' ? Sprites.size(id) : { w: 24 }, heroLike = sz.w <= 24 && !D.ENEMIES[id];
    el.className = 'st-ch st-' + side + ' s' + sz.w + (side === 'r' && heroLike ? ' flipx' : '');
    el.innerHTML = UI.spr(id); void el.offsetWidth; el.classList.add('on');
  }
  function showPage() {
    var b = cur.beat, c = cur.ch, p = b.pages[cur.i], o = p[2] || {};
    if (o.bg !== undefined) cur.wantBg = o.bg; if (o.l !== undefined) cur.wantL = o.l; if (o.r !== undefined) cur.wantR = o.r;
    setBg(cur.wantBg); setCh('l', sprOf(cur.wantL, c.zone)); setCh('r', sprOf(cur.wantR, c.zone));
    var who = p[0], name = whoName(who, c.zone), box = q('.st-box');
    box.className = 'st-box' + (who ? ' say' : ' narr') + (who === 'B' || (who === 'N' && cur.npc && cur.npc.foe) ? ' foe' : '');
    q('.st-opts').innerHTML = '';
    q('.st-who').textContent = name;
    q('.st-l').classList.toggle('dim', who === 'V' || who === 'B' || who === 'N'); q('.st-r').classList.toggle('dim', who === 'H');
    q('.st-dots').innerHTML = b.pages.map(function (x, k) { return '<i' + (k === cur.i ? ' class="on"' : '') + '></i>'; }).join('');
    var full = txtOf(p[1], c.zone), el = q('.st-txt'), n = 0, tick = 0, vo = voiceOf(who);
    cur.full = full; cur.typing = true; el.textContent = ''; box.classList.remove('done');
    clearInterval(typeT);
    typeT = setInterval(function () {
      var chunk = full.slice(n, n + 2); n += 2; el.textContent = full.slice(0, n);
      if (tick++ % 2 === 0 && /[A-Za-zÀ-ÿ0-9]/.test(chunk)) SND.blip(vo[0], vo[1], vo[2]);
      if (n >= full.length) endType();
    }, 24);
  }
  function endType() { clearInterval(typeT); typeT = null; if (!cur) return; cur.typing = false; q('.st-txt').textContent = cur.full; q('.st-box').classList.add('done'); }
  function advance() {
    if (!cur) return;
    if (cur.card) { cur.card = false; root.classList.remove('card'); SND.play('click', 0.6); showPage(); return; }
    if (cur.typing) { endType(); return; }
    SND.play('click', 0.5);
    if (++cur.i >= cur.beat.pages.length) { if (cur.talk && cur.talk.phase === 'intro') { cur.i--; showOpts(); return; } finish(); return; }
    showPage();
  }
  // ---------- dialogue avec choix (salles Mystère) ----------
  function showOpts() {
    var t = cur.talk; t.phase = 'choose'; if (t.onReady) t.onReady();
    var box = q('.st-box'); box.classList.remove('done'); box.classList.add('choose');
    q('.st-opts').innerHTML = t.choices.map(function (o, i) { return '<button class="st-opt' + (o.off ? ' off' : '') + '" data-st="opt" data-i="' + i + '"><span>' + (i + 1) + '</span><b>' + o.t + '</b>' + (o.sub ? '<em>' + o.sub + '</em>' : '') + '</button>'; }).join('');
    q('.st-dots').innerHTML = '';
  }
  function pickOpt(i) {
    var t = cur && cur.talk; if (!t || t.phase !== 'choose' || !t.choices[i]) return;
    if (t.choices[i].off) { SND.play('error'); return; }
    var res = t.onChoice(i);
    if (res === false) { SND.play('error'); return; }
    SND.play('click', 0.7); q('.st-box').classList.remove('choose');
    t.phase = 'after';
    if (!res || !res.pages || !res.pages.length) { finish(); return; }
    cur.beat = { key: 'talk', pages: res.pages }; cur.i = 0; showPage();
  }
  // Ouvre un dialogue : o = { npc: { spr, name, voice, wave, foe }, bg, color, title, pages, choices: [{ t, sub, off }], onChoice(i) -> { pages } | false | null, skipIntro, done }
  function talk(o) {
    ensure();
    if (isOpen && cur && cur.talk) return false;
    cur = { beat: { key: 'talk', pages: o.pages && o.pages.length && !o.skipIntro ? o.pages : [o.pages[o.pages.length - 1]] }, ch: { zone: 0, num: '', title: '' }, i: 0, done: o.done, bg: null, flip: false, lId: undefined, rId: undefined,
      wantBg: o.bg || 'camp', wantL: 'H', wantR: 'N', npc: o.npc || null, talk: { phase: 'intro', choices: o.choices || [], onChoice: o.onChoice, onReady: o.onReady } };
    isOpen = true;
    root.style.setProperty('--sc', o.color || '#ffb347');
    q('.st-chap').textContent = o.title || '';
    q('.st-l').className = 'st-ch st-l'; q('.st-r').className = 'st-ch st-r';
    root.className = 'on talk';
    showPage();
    if (o.skipIntro) { endType(); showOpts(); }
    return true;
  }
  function start(item) {
    ensure();
    var b = BEAT[item.key], c = CHOF[b.key];
    if (!item.replay) { seen()[b.key] = 1; E.save(); }
    cur = { beat: b, ch: c, i: 0, done: item.done, bg: null, flip: false, lId: undefined, rId: undefined, wantBg: b.bg || c.zone || 'camp', wantL: b.l !== undefined ? b.l : null, wantR: b.r !== undefined ? b.r : null, card: !!item.card };
    isOpen = true;
    root.style.setProperty('--sc', c.color || (c.zone ? D.ZONES[c.zone - 1].color : '#ffb347'));
    q('.st-chap').textContent = c.num + ' · ' + c.title;
    q('.st-l').className = 'st-ch st-l'; q('.st-r').className = 'st-ch st-r';
    root.className = 'on' + (item.card ? ' card' : '');
    if (item.card) {
      q('.st-num').textContent = c.num.toUpperCase(); root.querySelector('.st-card h1').textContent = c.title;
      q('.st-sub').textContent = c.zone ? D.ZONES[c.zone - 1].name : c.id === 'pro' ? 'Morvane' : 'Le sanctuaire';
      setBg(cur.wantBg); SND.play('boss_intro', 0.35);
    } else showPage();
  }
  function finish() {
    clearInterval(typeT); typeT = null;
    var done = cur && cur.done; cur = null;
    if (queue.length) { start(queue.shift()); if (done) done(); return; }
    isOpen = false;
    if (root) { root.className = ''; if (fxL && fxL.cv && fxL.cv.parentNode) fxL.cv.parentNode.removeChild(fxL.cv); fxL = null; }
    if (done) done();
  }
  // Joue une scène (une seule fois, sauf relecture). done() est appelé à la fin, ou tout de suite si elle a déjà été vue.
  function play(key, done, opt) {
    opt = opt || {};
    if (!BEAT[key] || (!opt.replay && seen()[key])) { if (done) done(); return false; }
    var item = { key: key, done: done, replay: !!opt.replay, card: !!opt.card };
    if (isOpen) queue.push(item); else start(item);
    return true;
  }
  function zoneKey(run, part) { return E.cycleOf(run.floor) > 0 ? null : 'c' + E.zoneOf(run.floor).id + '.' + part; }
  // Arrivée dans une zone : le prologue d'abord s'il n'a jamais été vu, puis le carton du chapitre.
  function enterZone(run, done) {
    var k = zoneKey(run, 'intro'); if (!k || seen()[k]) { if (done) done(); return false; }
    if (k === 'c1.intro' && !seen().pro) { play('pro', null, { card: true }); play(k, done, { card: true }); }
    else play(k, done, { card: true });
    return true;
  }
  function inZone(run, part, done) { var k = zoneKey(run, part); if (!k) { if (done) done(); return false; } return play(k, done); }

  // ---------- la Chronique ----------
  function chron() {
    seen()._read = 1;
    var n = countUnlocked(), h = '<div class="center tiny gold" style="letter-spacing:.3em">CHRONIQUE</div><h2 style="margin:2px 0 4px">Les Cendres du Roi Creux</h2>' +
      '<div class="center tiny dim" style="margin-bottom:10px">' + n + ' / ' + TOTAL + ' scènes découvertes · touche un chapitre pour le relire</div>';
    CH.forEach(function (c, i) {
      var open = c.beats.filter(function (b) { return unlocked(b.key); }), z = c.zone ? D.ZONES[c.zone - 1] : null, col = c.color || (z ? z.color : '#ffb347');
      if (!open.length) {
        h += '<div class="chap lk"><div class="cthumb">🔒</div><div class="grow"><span class="cnum">' + c.num + '</span><b>? ? ?</b><div class="tiny dim">' + (z ? 'Atteins : ' + z.name : c.id === 'epi' ? 'Vide le trône' : 'Commence une descente') + '</div></div></div>';
        return;
      }
      h += '<button class="chap" data-act="chronPlay" data-i="' + i + '" style="--sc:' + col + '"><div class="cthumb" style="background-image:url(' + bgUrl(c.zone || (c.id === 'pro' ? 'title' : 'camp')) + ')"></div><div class="grow"><span class="cnum">' + c.num + (z ? ' · ' + z.short : '') + '</span><b>' + c.title + '</b>' +
        '<div class="cbeats">' + c.beats.map(function (b) { var ok = unlocked(b.key); return '<i class="' + (ok ? 'on' : '') + '">' + (ok ? b.label : '· · ·') + '</i>'; }).join('') + '</div></div><span class="cgo">▶</span></button>';
    });
    UI.modal(h + '<div class="btns"><button class="btn primary" data-act="close">Fermer</button></div>');
  }
  ACT.chron = function () { SND.play('click'); chron(); E.save(); };
  ACT.chronPlay = function (d) {
    var c = CH[+d.i]; if (!c) return;
    var list = c.beats.filter(function (b) { return unlocked(b.key); }); if (!list.length) return;
    UI.closeModal(); SND.play('door');
    list.forEach(function (b, k) { play(b.key, k === list.length - 1 ? chron : null, { replay: true, card: k === 0 }); });
  };
  // Carte du sanctuaire
  function hubCard() {
    var c = current(), n = countUnlocked(), z = c.zone ? D.ZONES[c.zone - 1] : null;
    return '<button class="chroncard" data-act="chron" style="--sc:' + (c.color || (z ? z.color : '#ffb347')) + '"><div class="cthumb" style="background-image:url(' + bgUrl(c.zone || (c.id === 'epi' ? 'camp' : 'title')) + ')"></div>' +
      '<div class="grow"><span class="cnum">📖 Chronique · ' + c.num + '</span><b>' + c.title + '</b><div class="bar"><i style="width:' + (n / TOTAL * 100) + '%"></i></div><div class="tiny dim">' + n + ' / ' + TOTAL + ' scènes · relis l’histoire de Morvane</div></div>' + (fresh() ? '<i class="dot"></i>' : '') + '<span class="cgo">›</span></button>';
  }
  return { play: play, talk: talk, talking: function () { return isOpen && !!(cur && cur.talk); }, enterZone: enterZone, inZone: inZone, open: function () { return isOpen; }, chron: chron, hubCard: hubCard, fresh: fresh, seen: seen, CH: CH };
})();
