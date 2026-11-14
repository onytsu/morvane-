/* MORVANE — contenu du jeu (aucune logique ici) */
var DATA = (function () {
  'use strict';

  // ---------- Raretés ----------
  var RARITIES = [
    { id: 0, key: 'normal', name: 'Normal', color: '#9a9aa3', mult: 1.0, affixes: 0, sfx: 'loot' },
    { id: 1, key: 'commun', name: 'Commun', color: '#4fc46a', mult: 1.15, affixes: 1, sfx: 'loot' },
    { id: 2, key: 'rare', name: 'Rare', color: '#4a9bff', mult: 1.35, affixes: 2, sfx: 'loot_rare' },
    { id: 3, key: 'epique', name: 'Épique', color: '#b565f5', mult: 1.6, affixes: 3, sfx: 'loot_epic' },
    { id: 4, key: 'legendaire', name: 'Légendaire', color: '#ff9a2e', mult: 1.9, affixes: 4, sfx: 'loot_legend' },
    { id: 5, key: 'unique', name: 'Unique', color: '#ff3b3b', mult: 2.2, affixes: 4, sfx: 'loot_unique' }
  ];

  // ---------- Noms lisibles des bonus ----------
  // fmt : 'flat' = +12 | 'pct' = +12 % | 'x' = texte spécial
  var MODS = {
    hp: { n: 'PV', fmt: 'flat' }, atk: { n: 'Attaque', fmt: 'flat' }, def: { n: 'Armure', fmt: 'flat' },
    hpP: { n: 'PV', fmt: 'pct' }, atkP: { n: 'Attaque', fmt: 'pct' }, defP: { n: 'Armure', fmt: 'pct' },
    spdP: { n: "Vitesse d'attaque", fmt: 'pct' }, allP: { n: 'Toutes les stats', fmt: 'pct' },
    crit: { n: 'Chance de critique', fmt: 'pct' }, critd: { n: 'Dégâts critiques', fmt: 'pct' },
    ls: { n: 'Vol de vie', fmt: 'pct' }, dodge: { n: 'Esquive', fmt: 'pct' },
    regen: { n: 'Régénération / s', fmt: 'pct' }, pow: { n: 'Puissance des pouvoirs', fmt: 'pct' },
    cdr: { n: 'Recharge des pouvoirs', fmt: 'pctm' }, gf: { n: 'Or et Cendres', fmt: 'pct' },
    mf: { n: 'Chance de butin', fmt: 'pct' }, xp: { n: 'Expérience', fmt: 'pct' },
    thorns: { n: 'Épines (renvoi)', fmt: 'pct' }, block: { n: 'Chance de blocage', fmt: 'pct' },
    echo: { n: 'Chance de frapper deux fois', fmt: 'pct' },
    burnHit: { n: "Chance d'embraser", fmt: 'pct' }, poisonHit: { n: "Chance d'empoisonner", fmt: 'pct' },
    bleedHit: { n: 'Chance de faire saigner', fmt: 'pct' },
    firstStrike: { n: 'Dégâts du premier coup', fmt: 'pct' }, startShield: { n: 'Bouclier en début de combat (% PV)', fmt: 'pct' },
    killHeal: { n: 'Soin par ennemi tué (% PV)', fmt: 'pct' }, exec: { n: 'Dégâts aux ennemis sous 30 % PV', fmt: 'pct' },
    chain: { n: 'Chaque 4e coup frappe tous les ennemis', fmt: 'pct' }, frenzy: { n: 'Vitesse par coup (cumulable x10)', fmt: 'pct' },
    revive: { n: 'Résurrection par descente', fmt: 'flat' }, boonChoices: { n: "Choix d'aubaine en plus", fmt: 'flat' },
    potions: { n: 'Fiole en plus', fmt: 'flat' }, dmgP: { n: 'Dégâts infligés', fmt: 'pct' },
    takenP: { n: 'Dégâts subis', fmt: 'pct' }, healP: { n: 'Soins reçus', fmt: 'pct' },
    burnP: { n: 'Dégâts de brûlure', fmt: 'pct' }, poisonP: { n: 'Dégâts de poison', fmt: 'pct' },
    bleedP: { n: 'Dégâts de saignement', fmt: 'pct' }, skel: { n: 'Serviteur squelette max', fmt: 'flat' },
    skelP: { n: 'Dégâts des serviteurs', fmt: 'pct' }, s1P: { n: 'Dégâts du pouvoir 1', fmt: 'pct' },
    s2P: { n: 'Dégâts du pouvoir 2', fmt: 'pct' }, s3P: { n: 'Dégâts du pouvoir 3', fmt: 'pct' },
    atkPerRoom: { n: 'Attaque par salle franchie', fmt: 'pct' }, vulnStart: { n: 'Les ennemis commencent Vulnérables (s)', fmt: 'flat' },
    rerolls: { n: "Relance d'aubaines", fmt: 'flat' }, startGold: { n: 'Or de départ', fmt: 'flat' },
    idleP: { n: "Cendres de l'Ossuaire", fmt: 'pct' }, startBoons: { n: 'Aubaine offerte au départ', fmt: 'flat' },
    enemyHpP: { n: 'PV des ennemis', fmt: 'pct' }, idleH: { n: "Heures de réserve de l'Ossuaire", fmt: 'flat' },
    enemyAtkP: { n: 'Attaque des ennemis', fmt: 'pct' }, ultP: { n: "Charge de l'ultime", fmt: 'pct' },
    parryP: { n: 'Dégâts de riposte (parade)', fmt: 'pct' }, weakP: { n: 'Dégâts sur point faible', fmt: 'pct' }, diceRerolls: { n: 'Relance des dés de combat', fmt: 'flat' }, diceP: { n: 'Force des figures de dés', fmt: 'pct' }, diceHand: { n: 'Dés piochés par tour', fmt: 'flat' }, diceV: { n: 'Valeur de tous les dés', fmt: 'flat' },
    skillHeal: { n: 'Soin à chaque pouvoir lancé (% PV)', fmt: 'pct' }, stunDmg: { n: 'Dégâts aux ennemis étourdis', fmt: 'pct' },
    statusDmg: { n: 'Dégâts aux ennemis brûlés, empoisonnés ou saignants', fmt: 'pct' }, skillEcho: { n: 'Chance de pouvoir rechargé aussitôt', fmt: 'pct' },
    startEvo: { n: 'Éveil de pouvoir offert au départ', fmt: 'flat' }
  };

  // ---------- Héros ----------
  var HEROES = [
    {
      id: 'chevalier', name: 'Aldric', title: 'Chevalier Déchu', role: 'Tank — facile',
      desc: "Un mur d'acier. Encaisse, étourdit, punit.",
      base: { hp: 150, atk: 10, def: 9, spd: 1.0, crit: 5 },
      passive: { name: "Serment de Pierre", desc: "20 % de chance de bloquer un coup (dégâts divisés par 2). Chaque coup bloqué ajoute +1 à un dé de ta prochaine main (jusqu’à +3).", mods: { block: 20 } },
      unlock: null, start: { artifact: null, potions: 0 },
      skills: [
        { id: 'k1', name: "Écu du Parjure", icon: '', cd: 7, sfx: 'block', desc: "180 % dégâts et étourdit 1 tour. Interrompt les attaques chargées. Te donne un bouclier de 4 % PV par point du dé." },
        { id: 'k2', name: "Parole Reprise", icon: '', cd: 12, sfx: 'skill_holy', desc: "320 % dégâts et te soigne de 8 % PV. Ton plus petit dé en main devient un 6." },
        { id: 'k3', name: "Veille de Fer", icon: '', cd: 18, sfx: 'skill_war', desc: "Bouclier de 30 % PV qui renvoie les coups pendant 3 tours. Te rend 1 action ⚡ tout de suite." }
      ],
      boons: [
        { id: 'c_k1', name: 'Bouclier à pointes', rar: 1, desc: 'Écu du Parjure : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_k2', name: 'Garde parfaite', rar: 2, desc: '+12 % de chance de blocage.', mods: { block: 12 } },
        { id: 'c_k3', name: 'Verdict', rar: 1, desc: 'Parole Reprise : +50 % dégâts.', mods: { s2P: 50 } }
      ]
    },
    {
      id: 'pyro', name: 'Ysolde', title: 'Sorcière des Cendres', role: 'Mage — dégâts de zone',
      desc: 'Tout brûle. Fragile, mais rien ne lui survit longtemps.',
      base: { hp: 100, atk: 14, def: 3, spd: 0.9, crit: 5 },
      passive: { name: "Cendres Fidèles", desc: "Chaque attaque embrase la cible. Quand un ennemi en feu meurt pendant ton tour, ton plus petit dé gagne +2.", mods: { burnHit: 100 } },
      unlock: { boss: 1 }, start: {},
      skills: [
        { id: 'p1', name: "Cendre Vive", icon: '', cd: 6, sfx: 'skill_fire', desc: "220 % dégâts et embrase la cible. Le feu se propage : les ennemis déjà en feu prennent 90 %, les autres s’embrasent." },
        { id: 'p2', name: "Marée de Suie", icon: '', cd: 11, sfx: 'skill_fire', desc: "140 % dégâts à tous et les embrase. Tes dés Lame en main deviennent des dés Braise, avec +1." },
        { id: 'p3', name: "Bûcher du Roi Creux", icon: '', cd: 16, sfx: 'skill_fire', desc: "400 % dégâts (640 % si la cible brûle). Puis chaque autre ennemi en feu explose : 150 % dégâts, et sa brûlure s’éteint." }
      ],
      boons: [
        { id: 'c_p1', name: 'Combustion', rar: 1, desc: 'Brûlures : +60 % dégâts.', mods: { burnP: 60 } },
        { id: 'c_p2', name: 'Pyromanie', rar: 1, desc: 'Cendre Vive : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_p3', name: 'Cendres aux cendres', rar: 2, desc: 'Bûcher du Roi Creux : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    },
    {
      id: 'assassin', name: 'Corvin', title: 'Lame de Minuit', role: 'Assassin — critiques',
      desc: 'Rapide, mortel, insaisissable. Empoisonne à chaque critique.',
      base: { hp: 105, atk: 9, def: 4, spd: 1.5, crit: 18 },
      passive: { name: "Heure Noire", desc: "Tes coups critiques empoisonnent (cumulable). Dans l’ombre, la pire chance devient la meilleure : un dé qui tombe sur 1 devient un 6.", mods: {} },
      unlock: { cost: 300 }, start: {},
      skills: [
        { id: 'a1', name: "Minuit Moins Trois", icon: '', cd: 5, sfx: 'skill_blade', desc: "3 coups de 85 % dégâts, +1 coup pour chaque dé Lame encore dans ta main." },
        { id: 'a2', name: "Pas de Corbeau", icon: '', cd: 12, sfx: 'skill_dark', desc: "+60 % esquive pendant 2 tours, ton prochain coup est un critique doublé, et tous tes dés en main se retournent." },
        { id: 'a3', name: "Glas", icon: '', cd: 14, sfx: 'crit', desc: "300 % dégâts, 750 % si la cible a moins de 35 % PV. S’il la tue, tu regagnes 1 action ⚡." }
      ],
      boons: [
        { id: 'c_a1', name: 'Venin noir', rar: 1, desc: 'Poison : +60 % dégâts.', mods: { poisonP: 60 } },
        { id: 'c_a2', name: 'Mille coupures', rar: 1, desc: 'Minuit Moins Trois : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_a3', name: 'Sentence', rar: 2, desc: 'Glas : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    },
    {
      id: 'necro', name: 'Mortis', title: "Fossoyeur d'Âmes", role: 'Invocateur — armée',
      desc: 'Chaque ennemi tué se relève pour lui. Plus le combat dure, plus il est fort.',
      base: { hp: 100, atk: 9, def: 3, spd: 1.0, crit: 5 },
      passive: { name: "Ossements Comptés", desc: "Chaque ennemi tué relève un serviteur squelette (max 3). Chaque serviteur ajoute +1 au dé que tu glisses dans un pouvoir.", mods: {} },
      unlock: { boss: 2 }, start: {},
      skills: [
        { id: 'n1', name: "Première Pelletée", icon: '', cd: 6, sfx: 'skill_dark', desc: "200 % dégâts et relève un serviteur. Si ton armée est déjà pleine, tu pioches un dé." },
        { id: 'n2', name: "Dîme des Morts", icon: '', cd: 10, sfx: 'skill_dark', desc: "190 % dégâts, +30 % par serviteur. Te soigne d’autant." },
        { id: 'n3', name: "Exhumation", icon: '', cd: 20, sfx: 'skill_dark', desc: "Ton armée se relève au complet et frappe 3 fois plus vite pendant 3 tours. Les dés de la table sont enterrés : +5 % d’ultime chacun." }
      ],
      boons: [
        { id: 'c_n1', name: 'Fosse commune', rar: 2, desc: '+1 serviteur maximum.', mods: { skel: 1 } },
        { id: 'c_n2', name: 'Os trempés', rar: 1, desc: 'Serviteurs : +50 % dégâts.', mods: { skelP: 50 } },
        { id: 'c_n3', name: 'Sangsue', rar: 1, desc: 'Dîme des Morts : +50 % dégâts.', mods: { s2P: 50 } }
      ]
    },
    {
      id: 'berserker', name: 'Hrolf', title: 'Écorché du Nord', role: 'Berserker — risque',
      desc: 'Plus il saigne, plus il frappe fort. Se soigne en tuant.',
      base: { hp: 135, atk: 12, def: 3, spd: 1.1, crit: 8 },
      passive: { name: "Peau d’Écorché", desc: "+1 % dégâts par 1 % de PV manquant. Sous 30 % PV, tu as 3 actions ⚡ par tour au lieu de 2.", mods: {} },
      unlock: { cost: 2500 }, start: {},
      skills: [
        { id: 'b1', name: "Entaille d’Écorché", icon: '', cd: 5, sfx: 'skill_war', desc: "200 % dégâts et fait saigner. Sous 50 % PV, tu frappes une seconde fois (100 %)." },
        { id: 'b2', name: "Offrande de Peau", icon: '', cd: 14, sfx: 'skill_war', desc: "Sacrifie 10 % PV : +60 % vitesse et 15 % vol de vie pendant 3 tours, et 1 action ⚡ en plus." },
        { id: 'b3', name: "Ronde des Loups", icon: '', cd: 12, sfx: 'skill_war', desc: "220 % dégâts à tous (330 % sur ceux qui saignent). Te soigne de 5 % PV par ennemi touché." }
      ],
      boons: [
        { id: 'c_b1', name: 'Plaies ouvertes', rar: 1, desc: 'Saignement : +60 % dégâts.', mods: { bleedP: 60 } },
        { id: 'c_b2', name: 'Boucher', rar: 1, desc: 'Entaille d’Écorché : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_b3', name: 'Ouragan', rar: 2, desc: 'Ronde des Loups : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    },
    {
      id: 'pretresse', name: 'Séraphine', title: 'Sainte Hérétique', role: 'Soutien — immortelle',
      desc: 'Se soigne sans cesse. Ses PV sont son arme.',
      base: { hp: 125, atk: 9, def: 5, spd: 1.0, crit: 5 },
      passive: { name: "Grâce Impie", desc: "Régénère 1 % PV par seconde, et les soins en trop deviennent un bouclier. Chaque dé pair posé sur la table te soigne de 2 % PV.", mods: { regen: 1 } },
      unlock: { boss: 4 }, start: {},
      skills: [
        { id: 's1', name: "Stigmate", icon: '', cd: 6, sfx: 'skill_holy', desc: "190 % dégâts, affaiblit la cible 2 tours (-25 % attaque) et te soigne de 5 % PV." },
        { id: 's2', name: "Psaume Inversé", icon: '', cd: 12, sfx: 'heal', desc: "Soigne 25 % PV et retire poison, brûlure et saignement. Tu pioches un dé et gagnes une relance." },
        { id: 's3', name: "Cloche Hérétique", icon: '', cd: 18, sfx: 'skill_holy', desc: "Inflige 30 % de tes PV max à tous les ennemis et les étourdit 1 tour." }
      ],
      boons: [
        { id: 'c_s1', name: 'Ferveur', rar: 1, desc: 'Soins reçus : +35 %.', mods: { healP: 35 } },
        { id: 'c_s2', name: 'Fouet sacré', rar: 1, desc: 'Stigmate : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_s3', name: 'Jour du jugement', rar: 2, desc: 'Cloche Hérétique : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    },
    {
      id: 'chasseuse', name: 'Maëlle', title: 'Traqueuse des Pendus', role: 'Tireuse — points faibles',
      desc: 'Elle voit où frapper. Fragile de près, mortelle si tu vises juste.',
      base: { hp: 100, atk: 11, def: 3, spd: 1.25, crit: 10 },
      passive: { name: "Œil du Gibet", desc: "Les points faibles apparaissent 2 fois plus souvent et font +50 % dégâts. Le premier frappé à chaque tour te rend ton action.", mods: { weakP: 50 } },
      unlock: { boss: 3 }, start: {},
      skills: [
        { id: 'h1', name: "Carreau de Gibet", icon: '', cd: 5, sfx: 'skill_blade', desc: "230 % dégâts qui ignorent l’armure, rend la cible vulnérable 2 tours et lui ouvre un point faible." },
        { id: 'h2', name: "Nœud Coulant", icon: '', cd: 11, sfx: 'block', desc: "150 % dégâts, étourdit 1 tour et fait saigner. Interrompt les attaques chargées." },
        { id: 'h3', name: "Volée des Pendus", icon: '', cd: 14, sfx: 'skill_blade', desc: "5 carreaux de 75 % dégâts au hasard. +50 % sur une cible vulnérable ou au point faible ouvert." }
      ],
      boons: [
        { id: 'c_h1', name: 'Pointes barbelées', rar: 1, desc: 'Carreau de Gibet : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_h2', name: 'Instinct de chasse', rar: 2, desc: 'Points faibles : +80 % dégâts.', mods: { weakP: 80 } },
        { id: 'c_h3', name: 'Carquois sans fond', rar: 1, desc: 'Volée des Pendus : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    },
    {
      id: 'moine', name: 'Frère Odon', title: 'Poing de Cendre', role: 'Combattant — élan',
      desc: 'Chaque coup le rend plus fort. Ne laisse pas un gros coup briser son élan.',
      base: { hp: 120, atk: 10, def: 5, spd: 1.3, crit: 8 },
      passive: { name: "Élan de Cendre", desc: "Chaque coup donne +4 % dégâts (jusqu’à x10). À élan maximum, le premier dé que tu poses chaque tour compte double. L’élan retombe à zéro si tu encaisses une attaque chargée.", mods: {} },
      unlock: { cost: 8000 }, start: {},
      skills: [
        { id: 'm1', name: "Paume de Braise", icon: '', cd: 4, sfx: 'hit', desc: "170 % dégâts, étourdit et embrase. Interrompt les attaques chargées. +2 élan." },
        { id: 'm2', name: "Souffle du Foyer", icon: '', cd: 12, sfx: 'heal', desc: "Soigne 15 % PV, retire poison, brûlure et saignement, et met l’élan au maximum. Tu gagnes une relance." },
        { id: 'm3', name: "Cent Cendres", icon: '', cd: 13, sfx: 'skill_blade', desc: "6 coups rapides de 60 % dégâts, +1 élan chacun. Si l’élan atteint le maximum, tu regagnes 1 action ⚡." }
      ],
      boons: [
        { id: 'c_m1', name: 'Main de pierre', rar: 1, desc: 'Paume de Braise : +50 % dégâts.', mods: { s1P: 50 } },
        { id: 'c_m2', name: 'Pas du vent', rar: 2, desc: '+12 % vitesse et +5 % esquive.', mods: { spdP: 12, dodge: 5 } },
        { id: 'c_m3', name: 'Mille cendres', rar: 1, desc: 'Cent Cendres : +60 % dégâts.', mods: { s3P: 60 } }
      ]
    }
  ];

  // ---------- Ultimes (jauge qui se remplit en combat) ----------
  var ULTS = {
    chevalier: { name: "Le Serment Tenu", icon: '', sfx: 'skill_holy', desc: "Invulnérable 2 tours, 400 % dégâts à tous les ennemis, et 1 action ⚡ en plus." },
    pyro: { name: "La Dernière Flamme", icon: '', sfx: 'skill_fire', desc: "6 météores de 160 % dégâts, embrase tous les ennemis et recharge tous tes pouvoirs." },
    assassin: { name: "Douze Coups de Minuit", icon: '', sfx: 'skill_blade', desc: "12 coups critiques de 60 % dégâts sur des ennemis au hasard." },
    necro: { name: "Le Grand Ossuaire", icon: '', sfx: 'skill_dark', desc: "400 % dégâts à tous, te soigne de la moitié et relève 2 serviteurs." },
    berserker: { name: "Hiver Rouge", icon: '', sfx: 'skill_war', desc: "3 tours : vitesse doublée et 20 % vol de vie. Impossible de mourir pendant 2 tours. Tous tes dés en main passent à 6." },
    pretresse: { name: "Miracle Profane", icon: '', sfx: 'skill_holy', desc: "Soigne tous tes PV, bouclier de 30 % PV, étourdit tous les ennemis 1 tour." },
    chasseuse: { name: "La Corde Tranchée", icon: '', sfx: 'crit', desc: "900 % dégâts critiques qui ignorent l’armure. Si la cible meurt, l’ultime revient à moitié chargé." },
    moine: { name: "Le Foyer Intérieur", icon: '', sfx: 'skill_holy', desc: "4 tours : vitesse +80 %, esquive +40 %, chaque coup te soigne de 2 % PV. Tu pioches 2 dés." }
  };
  HEROES.forEach(function (h) { h.ult = ULTS[h.id]; });

  // ---------- Fiches de pouvoirs : étiquettes, conseil, et de quoi calculer les vrais chiffres ----------
  // calc : ['dmg', multiplicateur, nombre de coups, précision] | ['heal', % PV] | ['shield', % PV] | ['hpdmg', % PV]
  var SKILL_INFO = {
    k1: [['Dégâts', 'Étourdit', 'Interrompt', 'Bouclier'], "Garde-le pour un ennemi qui charge ⚠️. Un gros dé (4) donne un plus gros bouclier.", [['dmg', 1.8]]],
    k2: [['Gros dégâts', 'Soin', 'Dés'], "Ton plus gros coup. Lance-le quand ta main contient un petit dé : il deviendra un 6.", [['dmg', 3.2], ['heal', 8]]],
    k3: [['Bouclier', 'Renvoi', '+1 action'], "Ne coûte pas ton tour : il te rend une action. À lancer avant de frapper.", [['shield', 30]]],
    p1: [['Dégâts', 'Brûlure', 'Propagation'], "Lance-le après Marée de Suie : tous les ennemis en feu prennent des dégâts.", [['dmg', 2.2, 1, 'sur la cible'], ['dmg', 0.9, 1, 'sur chaque ennemi en feu']]],
    p2: [['Zone', 'Brûlure', 'Dés'], "Garde des dés Lame en main avant de le lancer : ils deviennent des Braises.", [['dmg', 1.4, 1, 'à chaque ennemi']]],
    p3: [['Très gros dégâts', 'Explosions'], "Embrase d’abord tout le monde : chaque ennemi en feu explosera.", [['dmg', 4.0, 1], ['dmg', 6.4, 1, 'si la cible brûle'], ['dmg', 1.5, 1, 'par explosion']]],
    a1: [['Dégâts', 'Plusieurs coups'], "Garde tes dés Lame en main et utilise un autre dé : chaque Lame ajoute un coup.", [['dmg', 0.85, 3]]],
    a2: [['Esquive', 'Critique garanti', 'Dés'], "Tes petits dés deviennent grands en se retournant. Lance-le avec une main de 1 et de 2.", []],
    a3: [['Très gros dégâts', 'Achève', '+1 action'], "Attends que la cible passe sous 35 % PV : s’il la tue, tu rejoues.", [['dmg', 3.0, 1], ['dmg', 7.5, 1, 'sous 35 % PV']]],
    n1: [['Dégâts', 'Serviteur', 'Dés'], "Chaque lancer ajoute un squelette. Armée pleine : il te donne un dé.", [['dmg', 2.0]]],
    n2: [['Dégâts', 'Soin'], "Plus ton armée est grande, plus il frappe et soigne.", [['dmg', 1.9, 1, 'sans serviteur']]],
    n3: [['Serviteurs', 'Rafale', 'Ultime'], "Remplis d’abord la table de dés : chacun enterré charge ton ultime.", []],
    b1: [['Dégâts', 'Saignement'], "Sous la moitié de tes PV, il frappe deux fois.", [['dmg', 2.0]]],
    b2: [['Vitesse', 'Vol de vie', '+1 action', 'Coûte des PV'], "Te rend une action : lance-le en début de tour, puis frappe.", []],
    b3: [['Zone', 'Soin', 'Saignement'], "Fais d’abord saigner tout le monde : les loups mordent 50 % plus fort.", [['dmg', 2.2, 1, 'à chaque ennemi'], ['dmg', 3.3, 1, 'sur ceux qui saignent'], ['heal', 5, 'par ennemi touché']]],
    s1: [['Dégâts', 'Affaiblit', 'Soin'], "Vise celui qui frappe le plus fort.", [['dmg', 1.9], ['heal', 5]]],
    s2: [['Soin', 'Purifie', 'Dés'], "Te soigne et remplit ta main. Garde-le pour un moment difficile.", [['heal', 25]]],
    s3: [['Zone', 'Étourdit'], "Ses dégâts dépendent de tes PV max, pas de ton attaque.", [['hpdmg', 30, 'à chaque ennemi']]],
    h1: [['Dégâts', 'Perce l’armure', 'Point faible'], "Il ouvre un point faible : enchaîne avec ⚔️ Critique pour un énorme coup.", [['dmg', 2.3]]],
    h2: [['Étourdit', 'Interrompt', 'Saignement'], "Garde-le pour un ennemi qui charge ⚠️.", [['dmg', 1.5]]],
    h3: [['Dégâts', '5 coups', 'Au hasard'], "Lance-le après Carreau de Gibet : chaque carreau sur la cible ouverte fait +50 %.", [['dmg', 0.75, 5]]],
    m1: [['Dégâts', 'Étourdit', 'Interrompt', 'Élan'], "Recharge courte : casse les attaques chargées ⚠️ et nourrit ton élan.", [['dmg', 1.7]]],
    m2: [['Soin', 'Purifie', 'Élan max'], "Élan à fond d’un coup, plus une relance de dés.", [['heal', 15]]],
    m3: [['Dégâts', '6 coups', '+1 action'], "Si l’élan atteint 10 pendant la rafale, tu rejoues.", [['dmg', 0.6, 6]]]
  };

  // ---------- Éveils de pouvoir : 2 par pouvoir. On en choisit un tous les 4 niveaux d'une descente. ----------
  // mods = bonus pour la descente | cd = multiplicateur de recharge | fx = effets ajoutés quand le pouvoir est lancé :
  //   again/splash (coup en plus sur la cible / sur les autres, en multiple de l'attaque), stun, burn, poison, bleed, vuln, weak (sur la cible),
  //   stunAll, burnAll, bleedAll, vulnAll, weakAll (sur tous), heal, shield (% PV), ult (charge), spd/ls ([valeur, durée]), skel, cdOthers (s)
  var EVOS = {
    k1: [{ name: 'Onde de choc', desc: 'Frappe aussi les autres ennemis (90 %) et étourdit tout le monde 0,8 s.', fx: { splash: 0.9, stunAll: 0.8 } },
      { name: 'Brise-garde', desc: '+40 % dégâts et rend la cible vulnérable 4 s (+25 % dégâts subis).', mods: { s1P: 40 }, fx: { vuln: 4 } }],
    k2: [{ name: 'Sentence de sang', desc: 'Fait saigner la cible et te soigne de 10 % PV en plus.', fx: { bleed: 1, heal: 10 } },
      { name: 'Marteau du juge', desc: 'Recharge 25 % plus courte et charge ton ultime.', cd: 0.75, fx: { ult: 10 } }],
    k3: [{ name: 'Serment éternel', desc: 'Ajoute un bouclier de 15 % PV et te soigne de 8 % PV.', fx: { shield: 15, heal: 8 } },
      { name: 'Représailles', desc: '+40 % vitesse d’attaque pendant 6 s.', fx: { spd: [40, 6] } }],
    p1: [{ name: 'Cendre jumelle', desc: 'Une seconde gerbe frappe la cible (110 % dégâts).', fx: { again: 1.1 } },
      { name: 'Mèche courte', desc: 'Recharge 30 % plus courte.', cd: 0.7 }],
    p2: [{ name: 'Onde étourdissante', desc: 'Étourdit tous les ennemis 1 s.', fx: { stunAll: 1 } },
      { name: 'Cendres collantes', desc: 'Rend tous les ennemis vulnérables 4 s (+25 % dégâts subis).', fx: { vulnAll: 4 } }],
    p3: [{ name: 'Phénix', desc: 'Te soigne de 12 % PV et te donne un bouclier de 10 % PV.', fx: { heal: 12, shield: 10 } },
      { name: 'Brasier intérieur', desc: '+50 % dégâts et charge ton ultime.', mods: { s3P: 50 }, fx: { ult: 15 } }],
    a1: [{ name: 'Lames empoisonnées', desc: 'Ajoute 2 doses de poison à la cible.', fx: { poison: 2 } },
      { name: 'Entaille profonde', desc: 'Fait saigner la cible et la rend vulnérable 2 s.', fx: { bleed: 1, vuln: 2 } }],
    a2: [{ name: 'Pas de l’ombre', desc: '+50 % vitesse d’attaque pendant 3 s.', fx: { spd: [50, 3] } },
      { name: 'Sangsue d’ombre', desc: 'Te soigne de 6 % PV et donne 20 % de vol de vie pendant 4 s.', fx: { heal: 6, ls: [20, 4] } }],
    a3: [{ name: 'Faucheuse', desc: 'Frappe aussi les autres ennemis (150 % dégâts).', fx: { splash: 1.5 } },
      { name: 'Appétit', desc: '+40 % dégâts et charge ton ultime.', mods: { s3P: 40 }, fx: { ult: 12 } }],
    n1: [{ name: 'Os éclatés', desc: 'Les éclats frappent aussi les autres ennemis (100 % dégâts).', fx: { splash: 1.0 } },
      { name: 'Moelle noire', desc: 'Affaiblit la cible 4 s (-25 % attaque) et la rend vulnérable 3 s.', fx: { weak: 4, vuln: 3 } }],
    n2: [{ name: 'Festin d’âmes', desc: 'Relève un serviteur et recharge 20 % plus courte.', cd: 0.8, fx: { skel: 1 } },
      { name: 'Sang caillé', desc: '+30 % dégâts et te donne un bouclier de 12 % PV.', mods: { s2P: 30 }, fx: { shield: 12 } }],
    n3: [{ name: 'Marche funèbre', desc: 'Étourdit tous les ennemis 1,5 s.', fx: { stunAll: 1.5 } },
      { name: 'Pacte des os', desc: 'Te soigne de 15 % PV et charge ton ultime.', fx: { heal: 15, ult: 15 } }],
    b1: [{ name: 'Double taillade', desc: 'Un second coup frappe la cible (120 % dégâts).', fx: { again: 1.2 } },
      { name: 'Boucherie', desc: 'Frappe aussi les autres ennemis (100 %) et les fait tous saigner.', fx: { splash: 1.0, bleedAll: 1 } }],
    b2: [{ name: 'Rage aveugle', desc: 'Rend tous les ennemis vulnérables 5 s (+25 % dégâts subis).', fx: { vulnAll: 5 } },
      { name: 'Cuir épais', desc: 'Te donne un bouclier de 15 % PV.', fx: { shield: 15 } }],
    b3: [{ name: 'Cyclone', desc: 'Recharge 30 % plus courte.', cd: 0.7 },
      { name: 'Lames barbelées', desc: 'Fait saigner tous les ennemis et les étourdit 0,8 s.', fx: { bleedAll: 1, stunAll: 0.8 } }],
    s1: [{ name: 'Jugement en chaîne', desc: 'Frappe aussi les autres ennemis (120 %) et les affaiblit tous 4 s.', fx: { splash: 1.2, weakAll: 4 } },
      { name: 'Stigmates', desc: 'Embrase la cible et la rend vulnérable 3 s.', fx: { burn: 1, vuln: 3 } }],
    s2: [{ name: 'Cantique', desc: 'Ajoute un bouclier de 15 % PV.', fx: { shield: 15 } },
      { name: 'Zèle', desc: '+40 % vitesse d’attaque pendant 5 s et charge ton ultime.', fx: { spd: [40, 5], ult: 10 } }],
    s3: [{ name: 'Châtiment éternel', desc: 'Embrase tous les ennemis et les rend vulnérables 3 s.', fx: { burnAll: 1, vulnAll: 3 } },
      { name: 'Lumière réparatrice', desc: 'Te soigne de 12 % PV et recharge 20 % plus courte.', cd: 0.8, fx: { heal: 12 } }],
    h1: [{ name: 'Carreau empoisonné', desc: 'Ajoute 3 doses de poison à la cible.', fx: { poison: 3 } },
      { name: 'Ricochet', desc: 'Le carreau rebondit sur les autres ennemis (120 % dégâts).', fx: { splash: 1.2 } }],
    h2: [{ name: 'Champ de pièges', desc: 'Étourdit tous les ennemis 1,2 s et les fait saigner.', fx: { stunAll: 1.2, bleedAll: 1 } },
      { name: 'Piège incendiaire', desc: 'Embrase la cible et la rend vulnérable 4 s.', fx: { burn: 1, vuln: 4 } }],
    h3: [{ name: 'Déluge', desc: 'Recharge 30 % plus courte.', cd: 0.7 },
      { name: 'Pluie de feu', desc: 'Embrase tous les ennemis et charge ton ultime.', fx: { burnAll: 1, ult: 12 } }],
    m1: [{ name: 'Paume vibrante', desc: '+40 % dégâts et rend la cible vulnérable 3 s.', mods: { s1P: 40 }, fx: { vuln: 3 } },
      { name: 'Onde de choc', desc: 'Frappe aussi les autres ennemis (100 %) et étourdit tout le monde 0,5 s.', fx: { splash: 1.0, stunAll: 0.5 } }],
    m2: [{ name: 'Peau de pierre', desc: 'Ajoute un bouclier de 15 % PV.', fx: { shield: 15 } },
      { name: 'Second souffle', desc: '+40 % vitesse 5 s et tes deux autres pouvoirs gagnent 2 s de recharge.', fx: { spd: [40, 5], cdOthers: 2 } }],
    m3: [{ name: 'Poings ardents', desc: 'Embrase la cible et la fait saigner.', fx: { burn: 1, bleed: 1 } },
      { name: 'Frappe finale', desc: 'Termine par un dernier coup à 200 % dégâts.', fx: { again: 2.0 } }]
  };
  // ---------- Emplacements de dé des pouvoirs (v3.4) : chaque pouvoir s'active en y glissant un dé qui respecte sa condition ----------
  var NEEDS = {
    any: { label: '★', txt: 'n’importe quel dé', ok: function () { return true; } },
    max3: { label: '≤3', txt: 'un dé de 3 ou moins', ok: function (v) { return v <= 3; } },
    max4: { label: '≤4', txt: 'un dé de 4 ou moins', ok: function (v) { return v <= 4; } },
    min3: { label: '≥3', txt: 'un dé de 3 ou plus', ok: function (v) { return v >= 3; } },
    min4: { label: '≥4', txt: 'un dé de 4 ou plus', ok: function (v) { return v >= 4; } },
    min5: { label: '≥5', txt: 'un dé de 5 ou plus', ok: function (v) { return v >= 5; } },
    pair: { label: 'PAIR', txt: 'un dé pair (2, 4, 6...)', ok: function (v) { return v % 2 === 0; } },
    impair: { label: 'IMPAIR', txt: 'un dé impair (1, 3, 5...)', ok: function (v) { return v % 2 === 1; } }
  };
  // need : la condition. flat : la valeur du dé ne change rien (pouvoirs d'appui), sinon elle règle la puissance.
  var SKILL_NEED = {
    k1: ['max4'], k2: ['min4'], k3: ['pair'], p1: ['impair'], p2: ['pair'], p3: ['min5'],
    a1: ['max3'], a2: ['impair', 1], a3: ['min4'], n1: ['min3'], n2: ['pair'], n3: ['max3', 1],
    b1: ['impair'], b2: ['max3', 1], b3: ['min4'], h1: ['min4'], h2: ['max3'], h3: ['pair'],
    m1: ['impair'], m2: ['pair'], m3: ['min4'], s1: ['min3'], s2: ['pair'], s3: ['min4']
  };
  HEROES.forEach(function (h) {
    h.skills.forEach(function (k) {
      var nd = SKILL_NEED[k.id] || ['any']; k.need = nd[0]; k.flat = !!nd[1];
      k.cd = Math.max(2, Math.round(k.cd * 0.6)); // v3.4 : les pouvoirs se paient en dés, ils reviennent donc plus vite
      var inf = SKILL_INFO[k.id]; k.tags = inf[0]; k.tip = inf[1]; k.calc = inf[2];
      k.evos = EVOS[k.id]; k.evos.forEach(function (v, j) { v.id = k.id + (j ? 'b' : 'a'); v.skill = k.id; });
    });
  });

  // ---------- Ce que font les ennemis, en clair (v = valeur de la capacité) ----------
  var AB_INFO = {
    charge: ['⚠️', 'Attaque chargée', function () { return 'Prépare régulièrement un coup énorme (il brille en jaune). Pare-le 🤺 juste avant l’impact ou étourdis-le pour l’annuler.'; }],
    poison: ['☠️', 'Empoisonne', function (v) { return v + ' % de chance de t’empoisonner à chaque coup : dégâts chaque seconde, et les doses se cumulent.'; }],
    burn: ['🔥', 'Embrase', function (v) { return v + ' % de chance de t’embraser à chaque coup : dégâts chaque seconde pendant 3 s.'; }],
    bleed: ['🩸', 'Fait saigner', function (v) { return v + ' % de chance de te faire saigner à chaque coup : dégâts chaque seconde pendant 4 s.'; }],
    weak: ['⬇️', 'Affaiblit', function (v) { return v + ' % de chance de t’affaiblir : tu frappes 25 % moins fort pendant 4 s.'; }],
    leech: ['🧛', 'Vampire', function () { return 'Se soigne chaque fois qu’il te blesse. Tue-le vite, ou bloque ses coups.'; }],
    heal: ['💚', 'Soigneur', function (v) { return 'Toutes les 6 s, rend ' + v + ' % PV à l’ennemi le plus blessé. À tuer en premier.'; }],
    shield: ['🛡️', 'Bouclier', function (v) { return 'Toutes les 10 s, se protège d’un bouclier (' + v + ' % de ses PV).'; }],
    summon: ['📣', 'Invocateur', function () { return 'Appelle des renforts toutes les 13 s. Plus le combat dure, plus ils sont nombreux.'; }],
    dodge: ['💨', 'Insaisissable', function (v) { return 'Esquive ' + v + ' % de tes attaques normales. Tes pouvoirs, eux, touchent toujours.'; }],
    enrage: ['😡', 'S’enrage', function () { return 'Sous 30 % PV, il frappe 40 % plus vite et 25 % plus fort. Achève-le sans traîner.'; }],
    explode: ['💥', 'Explosif', function () { return 'Explose en mourant et te blesse. Garde des PV ou un bouclier avant de l’achever.'; }],
    thorns: ['🌵', 'Épines', function () { return 'Te blesse un peu chaque fois que tu le frappes.'; }]
  };

  // ---------- Lexique : tous les mots du jeu, expliqués ----------
  var GLOSS = [
    ['🎒', 'Sac de dés', 'Les dés de ton héros pour cette descente. Tu en pioches 3 par tour ; quand le sac est vide, il est remélangé. Élites, boss et un combat sur trois t’offrent un dé.'],
    ['🔲', 'Table de dés', 'Les 9 cases où tu poses tes dés. Un dé posé agit tout de suite et ne coûte aucune action. La table est purgée quand elle est pleine.'],
    ['🎲', 'Figure', 'Trois dés alignés sur la table : Brelan, Suite, Sept chanceux, Coup fort ou Prudence, selon leurs valeurs.'],
    ['👁️', 'Intention', 'Ce qu’un ennemi fera à son prochain tour, affiché sous son nom, avec les dégâts attendus.'],
    ['🔥', 'Brûlure', '25 % de ton attaque par seconde pendant 3 s. Relancer une brûlure la remet à 3 s.'],
    ['☠️', 'Poison', '8 % de ton attaque par seconde et par dose, pendant 5 s. Jusqu’à 8 doses cumulées : c’est le plus fort sur les combats longs.'],
    ['🩸', 'Saignement', '22 % de ton attaque par seconde pendant 4 s.'],
    ['💫', 'Étourdi', 'L’ennemi ne fait plus rien. Étourdir annule aussi une attaque chargée ⚠️. Les boss restent étourdis moins longtemps.'],
    ['🎯', 'Vulnérable', 'La cible subit +25 % de dégâts de toutes tes attaques.'],
    ['⬇️', 'Affaibli', 'Inflige 25 % de dégâts en moins. Ça marche sur les ennemis comme sur toi.'],
    ['🕸️', 'Entravé', 'Tu frappes 2 fois moins vite.'],
    ['⚠️', 'Attaque chargée', 'Un ennemi qui brille en jaune prépare un coup énorme. Pare 🤺 juste avant l’impact (parade parfaite : coup annulé + riposte) ou étourdis-le.'],
    ['🛡️', 'Bouclier', 'Des PV en plus, affichés en clair sur ta barre de vie. Ils partent avant tes vrais PV.'],
    ['💥', 'Critique', 'Un coup critique fait 150 % de dégâts, plus tes « dégâts critiques ».'],
    ['📖', 'Puissance des pouvoirs', 'Augmente les dégâts de tes 3 pouvoirs et de ton ultime (pas de tes attaques normales).'],
    ['⏳', 'Recharge', 'Le temps d’attente avant de relancer un pouvoir. « Recharge plus rapide » le raccourcit.'],
    ['🧛', 'Vol de vie', 'Une part des dégâts de tes coups te revient en PV.'],
    ['💨', 'Esquive', 'Chance d’éviter complètement un coup.'],
    ['🧱', 'Blocage', 'Chance de diviser par 2 les dégâts d’un coup.'],
    ['⛰️', 'Armure', 'Réduit les dégâts des coups. Les brûlures, poisons et saignements l’ignorent.'],
    ['🌵', 'Épines', 'Renvoie une part de ton attaque à celui qui te frappe.'],
    ['🌟', 'Ultime', 'Ton pouvoir le plus fort. La grande barre dorée se remplit quand tu frappes, tues, encaisses et touches les points faibles.'],
    ['✨', 'Éveil', 'Tous les 4 niveaux d’une descente, tu fais évoluer un de tes pouvoirs. Il garde son effet et en gagne un nouveau.'],
    ['🌒', 'Aubaine', 'Un bonus choisi à chaque niveau. Il dure jusqu’à la fin de la descente.'],
    ['🏺', 'Artefact', 'Une relique gagnée sur les élites, les boss et les arènes. Elle dure jusqu’à la fin de la descente.'],
    ['⚖️', 'Posture', '🗡️ Assaut : +25 % dégâts, +20 % dégâts subis. 🛡️ Garde : -25 % dégâts subis, -20 % dégâts.']
  ];

  // ---------- Dés de combat (v3.2) : chaque héros a un sac de dés, posés sur une table de 9 cases ----------
  // w : poids dans les offres de dés. Les effets sont écrits « par point » de la valeur du dé.
  var DICE = {
    lame: { name: 'Lame', icon: '⚔️', w: 20, desc: 'Frappe l’ennemi visé : 18 % de ton attaque par point.' },
    garde: { name: 'Garde', icon: '🛡️', w: 16, desc: 'Bouclier de 1,5 % de tes PV max par point. Il tient jusqu’à ton prochain tour.' },
    seve: { name: 'Sève', icon: '❤️', w: 10, desc: 'Te soigne de 0,6 % de tes PV max par point.' },
    echo: { name: 'Écho', icon: '✨', w: 13, desc: 'Ne fait rien seul : chaque dé posé à côté de lui gagne la moitié de sa valeur. Il reste actif tant que la table n’est pas purgée.' },
    miroir: { name: 'Miroir', icon: '🪞', w: 8, desc: 'Devient une copie du plus fort dé voisin, puis agit comme lui. Sans voisin, il ne reflète rien.' },
    braise: { name: 'Braise', icon: '🔥', w: 9, desc: '12 % de ton attaque par point, et enflamme l’ennemi visé.' },
    venin: { name: 'Venin', icon: '☠️', w: 9, desc: 'Empoisonne l’ennemi visé : une dose de poison tous les 2 points.' },
    foudre: { name: 'Foudre', icon: '⚡', w: 8, desc: '9 % de ton attaque par point à tous les ennemis.' },
    astre: { name: 'Astre', icon: '🌟', w: 8, desc: 'Charge ton ultime de 2 % par point.' }
  };
  var BAGS = {
    chevalier: ['lame', 'lame', 'garde', 'garde', 'garde', 'echo'], pyro: ['lame', 'lame', 'braise', 'garde', 'seve', 'echo'],
    assassin: ['lame', 'lame', 'lame', 'venin', 'garde', 'echo'], necro: ['lame', 'lame', 'garde', 'seve', 'seve', 'echo'],
    berserker: ['lame', 'lame', 'lame', 'lame', 'seve', 'echo'], chasseuse: ['lame', 'lame', 'lame', 'garde', 'astre', 'echo'],
    moine: ['lame', 'lame', 'garde', 'seve', 'echo', 'echo'], pretresse: ['lame', 'garde', 'garde', 'seve', 'seve', 'echo']
  };
  // Figures : trois dés alignés (ligne, colonne ou diagonale), d'après leur valeur tirée
  var FIGS = [
    ['👑', 'Brelan', 'trois valeurs identiques', '+1 action et tous tes coups sont critiques ce tour.'],
    ['✨', 'Suite', 'trois valeurs qui se suivent', 'Ton prochain coup est critique.'],
    ['🍀', 'Sept chanceux', 'total de 7', 'Ce tour, tes pouvoirs acceptent n’importe quel dé.'],
    ['💥', 'Coup fort', 'total de 15 ou plus', '+40 % dégâts ce tour.'],
    ['🛡️', 'Prudence', 'total de 6 ou moins', '-40 % dégâts subis jusqu’à ton prochain tour.']
  ];

  // ---------- Version et nouveautés ----------
  var VERSION = '3.8';
  var NEWS = [
    ['🌟', 'Des passifs réinventés', 'Chaque héros a un nouveau passif lié aux dés ou au tour : les blocages d’Aldric renforcent ta main, les 1 de Corvin deviennent des 6, les serviteurs de Mortis renforcent ses pouvoirs, Hrolf gagne une 3e action sous 30 % PV...'],
    ['🕯️', 'Des pouvoirs propres à Morvane', 'Les 8 héros ont des pouvoirs entièrement repensés : Écu du Parjure, Bûcher du Roi Creux, Minuit Moins Trois, Exhumation, Ronde des Loups, Psaume Inversé, Carreau de Gibet, Cent Cendres... chacun avec sa propre icône.'],
    ['🎲', 'Des pouvoirs qui jouent avec les dés', 'Certains pouvoirs changent tes dés (un petit dé devient un 6, les Lames deviennent des Braises, toute ta main se retourne), te font piocher, te rendent une action ou ouvrent un point faible.'],
    ['👑', 'Huit nouveaux ultimes', 'Le Serment Tenu, La Dernière Flamme, Douze Coups de Minuit, Le Grand Ossuaire, Hiver Rouge, Miracle Profane, La Corde Tranchée, Le Foyer Intérieur.'],
    ['🛠️', 'Une interface forgée', 'Boutons, emplacements de pouvoir et camp sont désormais sertis dans des cadres de fer et d’or en pixel art, avec leurs propres icônes.'],
    ['🕯️', 'La Veilleuse te guide', 'Le tutoriel est maintenant raconté par la Veilleuse, dans le style des dialogues de l’histoire.'],
    ['🧭', 'Des boutons plus simples', 'En combat, deux grands boutons : ⚔️ Frapper et 🛡️ Parer, avec tes pouvoirs juste en dessous. Vitesse, jeu automatique, posture et aide sont rangés dans le menu ☰.'],
    ['🛡️', 'Une parade qui se voit', 'Quand un ennemi charge un gros coup, le bouton Parer devient bleu vif : PARE ! L’écran s’entoure de bleu et l’ennemi brille de la même couleur.'],
    ['💥', 'Coup critique en un geste', 'Plus besoin de toucher la cible : quand un point faible s’ouvre, ton bouton Frapper devient COUP CRITIQUE, en jaune.'],
    ['🎓', 'Un tutoriel', 'Au premier combat, un guide te montre chaque élément, pas à pas. Tu peux le revoir depuis le menu ☰.'],
    ['🔥', 'Le camp', 'Le sanctuaire devient un camp épuré : ton héros se repose au coin du feu. Touche-le pour sa fiche, et retrouve talents, quêtes, histoire et gloire en raccourcis.'],
    ['🎲', 'Des pouvoirs à dés', 'Tes pouvoirs ne coûtent plus d’action : ils se lancent en y glissant un dé. Chacun demande un dé précis (≤3, ≥4, PAIR, IMPAIR...), affiché sur son bouton.'],
    ['💪', 'La valeur compte', 'Plus le dé glissé est fort, plus le pouvoir frappe : 5 = 100 %, 6 = 110 %, 1 = 60 %. Les pouvoirs d’appui se contentent d’un petit dé.'],
    ['⇅', 'Retourner un dé', 'Une fois par tour, retourne un dé sur sa face opposée : 1↔6, 2↔5, 3↔4. De quoi remplir la condition qui te manque.'],
    ['🔥', 'Dés enflammés et gelés', 'Embrasé, un de tes dés prend feu : le jouer coûte 3 % de tes PV. Entravé, ton meilleur dé gèle et tombe à 1.'],
    ['⚔️', 'Deux actions pour frapper', 'Tes 2 actions ⚡ servent à Frapper, Parer, viser un point faible ou renvoyer un crâne. À toi de choisir : un dé sur la table, ou dans un pouvoir ?'],
    ['📖', 'Une histoire en chapitres', 'Un prologue, six chapitres et un épilogue : découvre ce qui est arrivé à Morvane, à son roi, et qui est la Veilleuse. Les scènes se jouent pendant ta descente.'],
    ['🕯️', 'La Chronique', 'Au sanctuaire, la carte 📖 Chronique garde toutes les scènes découvertes. Touche un chapitre pour le relire.'],
    ['🏞️', 'Des décors enfin visibles', 'L’arène montre maintenant les voûtes, les vitraux, la forêt et les forges, avec des accessoires propres à chaque zone.'],
    ['🔥', 'Sanctuaire et écran-titre', 'La chapelle en ruine, la dernière flamme, la Veilleuse au coin du feu, et la lune rouge sur Morvane.'],
    ['♟️', 'Plateau illustré', 'Chaque plateau porte le décor de sa zone, et le gardien t’attend sur la dernière case.'],
    ['🎒', 'Sac de dés', 'Chaque héros a son sac de dés : ⚔️ Lame, 🛡️ Garde, ❤️ Sève, ✨ Écho... Tu en pioches 3 par tour et tu les poses sur la table.'],
    ['🔲', 'Table de dés', 'Neuf cases. Un dé posé agit tout de suite. ✨ Écho renforce ses voisins, 🪞 Miroir copie son voisin. Les cases ×2 et +2 changent tout.'],
    ['🎲', 'Figures', 'Trois dés alignés forment une figure : Brelan (+1 action, coups critiques), Suite, Sept chanceux, Coup fort, Prudence.'],
    ['👁️', 'Intentions', 'Au-dessus de chaque ennemi : ce qu’il fera à son tour, et combien ça fera mal. Pose tes 🛡️ au bon moment.'],
    ['🎁', 'Nouveaux dés', 'Élites, boss et un combat sur trois offrent un dé : ajoute-le au sac, cisèle un dé ou brise-en un.'],
    ['🏅', 'Gloire', 'Chaque descente, même ratée, donne un score qui remplit la piste de Gloire : Cendres, essence, objets épiques et légendaires, sans fin.'],
    ['🏆', 'Score et record', 'Ton score s’affiche à la fin de chaque descente. Bats ton record.'],
    ['🔁', 'Relance du plateau', 'Une fois par zone, tu peux relancer les deux dés du plateau.'],
    ['♟️', 'Rappel : plateau et tour par tour', 'Chaque zone est un chemin de 36 cases. En combat : tes actions ⚡, puis chaque ennemi joue.']
  ];

  // ---------- Sets d'objets (bonus à 2, 4 et 6 pièces portées). Un set par zone. ----------
  var SETS = [
    { id: 'set_fossoyeur', name: 'Ossements du Fossoyeur', short: 'du Fossoyeur', icon: '⚰️', zone: 1, bonus: { 2: { killHeal: 3, hpP: 10 }, 4: { atkP: 20, gf: 30 }, 6: { revive: 1, firstStrike: 200 } } },
    { id: 'set_corbeau', name: 'Voile du Corbeau', short: 'du Corbeau', icon: '🦅', zone: 2, bonus: { 2: { crit: 6, dodge: 4 }, 4: { critd: 45, spdP: 12 }, 6: { echo: 25, weakP: 100 } } },
    { id: 'set_peste', name: 'Suaire de la Peste', short: 'de la Peste', icon: '☠️', zone: 3, bonus: { 2: { poisonHit: 30, bleedHit: 20 }, 4: { poisonP: 80, bleedP: 80 }, 6: { exec: 70, ls: 6 } } },
    { id: 'set_inquisiteur', name: "Vœux de l'Inquisiteur", short: "de l'Inquisiteur", icon: '⛪', zone: 4, bonus: { 2: { defP: 25, block: 5 }, 4: { hpP: 25, parryP: 150 }, 6: { takenP: -20, startShield: 35 } } },
    { id: 'set_braises', name: 'Cœur des Braises', short: 'des Braises', icon: '🔥', zone: 5, bonus: { 2: { burnHit: 35, pow: 15 }, 4: { burnP: 90, cdr: 12 }, 6: { dmgP: 30, chain: 90 } } },
    { id: 'set_roi', name: 'Regalia du Roi Creux', short: 'du Roi Creux', icon: '👑', zone: 6, bonus: { 2: { gf: 30, mf: 25 }, 4: { allP: 8, ultP: 50 }, 6: { boonChoices: 1, allP: 12 } } }
  ];

  // ---------- Présages (un au choix au début de chaque descente) ----------
  var OMENS = [
    { id: 'o_sang', name: 'Lune de sang', icon: '🌕', desc: 'Butin rare +60 %. Mais ennemis +20 % attaque.', mods: { enemyAtkP: 20, mf: 60 } },
    { id: 'o_brume', name: 'Brume dorée', icon: '🌫️', desc: '+80 % or et Cendres. Mais -15 % PV max.', mods: { gf: 80, hpP: -15 } },
    { id: 'o_elites', name: 'Nuit des élites', icon: '👹', desc: 'Beaucoup plus de salles Élite, et chaque élite lâche un objet de plus.', mods: { eliteW: 1 } },
    { id: 'o_hate', name: 'Serment de hâte', icon: '⚡', desc: "+25 % vitesse d'attaque. Mais aucun feu de camp.", mods: { spdP: 25, noRest: 1 } },
    { id: 'o_clement', name: 'Présage clément', icon: '🕯️', desc: '+2 fioles de soin. Rien à payer.', mods: { potions: 2 } },
    { id: 'o_relique', name: 'Chasse aux reliques', icon: '🏺', desc: 'Commence avec un artefact. Mais ennemis +15 % PV.', mods: { startArtifact: 1, enemyHpP: 15 } },
    { id: 'o_etoile', name: 'Étoile filante', icon: '🌠', desc: "L'ultime se charge 2 fois plus vite. Mais +15 % dégâts subis.", mods: { ultP: 100, takenP: 15 } },
    { id: 'o_grimoire', name: 'Vieux grimoire', icon: '📜', desc: '+40 % expérience. Mais -10 % attaque.', mods: { xp: 40, atkP: -10 } },
    { id: 'o_duel', name: 'Loi du duel', icon: '🤺', desc: 'Parade : riposte +200 %. Points faibles : +100 % dégâts. Mais -10 % PV max.', mods: { parryP: 200, weakP: 100, hpP: -10 } },
    { id: 'o_eveil', name: 'Lune d’éveil', icon: '✨', desc: 'Commence avec un Éveil de pouvoir. Mais ennemis +10 % attaque.', mods: { startEvo: 1, enemyAtkP: 10 } },
    { id: 'o_arcane', name: 'Marée arcanique', icon: '🌊', desc: '+35 % puissance des pouvoirs. Mais ils se rechargent 15 % moins vite.', mods: { pow: 35, cdr: -15 } }
  ];

  // ---------- Talents : 1 point par niveau de Maîtrise, 5 rangs par talent. mods = bonus par rang ----------
  var TALENTS = {
    chevalier: [['t_k1', 'Mur', '🧱', { block: 3 }], ['t_k2', 'Colosse', '❤️', { hpP: 5 }], ['t_k3', 'Bouclier clouté', '🛡️', { s1P: 15 }], ['t_k4', 'Juge', '⚔️', { s2P: 15 }], ['t_k5', 'Garde haute', '🤺', { parryP: 30 }], ['t_k6', 'Bastion', '🏰', { ultP: 10 }]],
    pyro: [['t_p1', 'Brasier', '🔥', { burnP: 15 }], ['t_p2', 'Érudite', '📖', { pow: 6 }], ['t_p3', 'Pyromane', '☄️', { s1P: 15 }], ['t_p4', 'Onde de choc', '💥', { s2P: 15 }], ['t_p5', 'Concentration', '⏳', { cdr: 3 }], ['t_p6', 'Embrasement', '🌋', { ultP: 10 }]],
    assassin: [['t_a1', 'Œil vif', '🎯', { crit: 2 }], ['t_a2', 'Cruel', '🩸', { critd: 10 }], ['t_a3', 'Venin', '🐍', { poisonP: 15 }], ['t_a4', 'Fantôme', '💨', { dodge: 2 }], ['t_a5', 'Point vital', '🔪', { weakP: 25 }], ['t_a6', 'Exécuteur', '☠️', { s3P: 15 }]],
    necro: [['t_n1', 'Fosse commune', '🦴', { skelP: 15 }], ['t_n2', 'Sangsue', '🧛', { s2P: 15 }], ['t_n3', 'Chair morte', '❤️', { hpP: 5 }], ['t_n4', 'Nécrologue', '📖', { pow: 6 }], ['t_n5', 'Moissonneur', '🍖', { killHeal: 1 }], ['t_n6', 'Légion', '💀', { ultP: 10 }]],
    berserker: [['t_b1', 'Rage', '💪', { atkP: 4 }], ['t_b2', 'Hémorragie', '🩸', { bleedP: 15 }], ['t_b3', 'Soif', '🧛', { ls: 1 }], ['t_b4', 'Peau tannée', '❤️', { hpP: 5 }], ['t_b5', 'Frénésie', '🥁', { spdP: 3 }], ['t_b6', 'Carnage', '😡', { ultP: 10 }]],
    chasseuse: [['t_h1', 'Œil perçant', '🎯', { crit: 2 }], ['t_h2', 'Point vital', '🔪', { weakP: 25 }], ['t_h3', 'Carreaux lourds', '🏹', { s1P: 15 }], ['t_h4', 'Déluge', '🌧️', { s3P: 15 }], ['t_h5', 'Main sûre', '🖐️', { spdP: 3 }], ['t_h6', 'Patience', '⏳', { ultP: 10 }]],
    moine: [['t_m1', 'Poings durcis', '👊', { atkP: 4 }], ['t_m2', 'Pas léger', '💨', { dodge: 2 }], ['t_m3', 'Paume lourde', '🗿', { s1P: 15 }], ['t_m4', 'Rafale', '💢', { s3P: 15 }], ['t_m5', 'Sérénité', '🌿', { healP: 8 }], ['t_m6', 'Illumination', '☯️', { ultP: 10 }]],
    pretresse: [['t_s1', 'Ferveur', '🙏', { healP: 8 }], ['t_s2', 'Sainteté', '❤️', { hpP: 5 }], ['t_s3', 'Fouet sacré', '✨', { s1P: 15 }], ['t_s4', 'Colère', '⚡', { s3P: 15 }], ['t_s5', 'Grâce', '🌿', { regen: 0.2 }], ['t_s6', 'Miracle', '🌟', { ultP: 10 }]]
  };
  for (var th in TALENTS) TALENTS[th] = TALENTS[th].map(function (t) { return { id: t[0], name: t[1], icon: t[2], mods: t[3], max: 5 }; });

  // ---------- Préfixes de monstres (rendent les combats différents) ----------
  var MOBFIX = [
    { id: 'vamp', name: 'vampirique', ab: { leech: 70 } }, { id: 'feu', name: 'enflammé', ab: { burn: 60 } },
    { id: 'blinde', name: 'blindé', def: 1.3, hp: 1.15, desc: 'Armure épaisse et un peu plus de PV. Les brûlures, poisons et saignements ignorent son armure.' }, { id: 'rapide', name: 'rapide', int: 0.62, desc: 'Attaque beaucoup plus souvent.' },
    { id: 'regen', name: 'régénérant', ab: { heal: 5 } }, { id: 'explosif', name: 'explosif', ab: { explode: 220 } },
    { id: 'spectral', name: 'spectral', ab: { dodge: 30 } }, { id: 'geant', name: 'géant', hp: 1.8, atk: 1.2, desc: 'Énorme : beaucoup plus de PV et frappe plus fort.' },
    { id: 'toxique', name: 'toxique', ab: { poison: 65 } }, { id: 'maudit', name: 'maudit', ab: { weak: 55 } }
  ];
  // ---------- Conditions de salle ----------
  var CONDS = [
    { id: 'brume', name: 'Brume toxique', icon: '☣️', desc: 'Tout le monde perd des PV chaque seconde, les ennemis deux fois plus vite.' },
    { id: 'beni', name: 'Sol béni', icon: '✨', desc: 'Tu régénères 2 % PV par seconde.' },
    { id: 'tenebres', name: 'Ténèbres', icon: '🌑', desc: 'Les ennemis esquivent 20 % des coups, mais les points faibles apparaissent 2 fois plus souvent.' },
    { id: 'sang', name: 'Lune de sang', icon: '🩸', desc: 'Tous les dégâts +40 %, pour toi comme pour eux.' },
    { id: 'hate', name: 'Vent de hâte', icon: '💨', desc: 'Tout le monde attaque 30 % plus vite.' },
    { id: 'or', name: "Veine d'or", icon: '💰', desc: 'Or et Cendres doublés dans cette salle.' },
    { id: 'defi', name: 'Défi du bourreau', icon: '⏱️', desc: 'Tue tout en moins de 20 secondes pour gagner un coffre bonus.' },
    { id: 'silence', name: 'Silence', icon: '🤐', desc: 'Tes pouvoirs se rechargent 2 fois moins vite, mais ton ultime 2 fois plus vite.' },
    { id: 'echo', name: 'Écho de la crypte', icon: '🔔', desc: 'Tes pouvoirs se rechargent 40 % plus vite.' },
    { id: 'fragile', name: 'Os fragiles', icon: '🦴', desc: 'Les ennemis commencent Vulnérables pendant 8 s (+25 % dégâts subis).' }
  ];
  // ---------- Mercenaires (un autre héros se bat à tes côtés jusqu'au prochain boss) ----------
  var ALLIES = {
    chevalier: 'Frappe et te donne un petit bouclier à chaque coup.', pyro: 'Brûle tous les ennemis.',
    assassin: 'Coups rapides, souvent doublés.', necro: 'Draine les ennemis et te rend des PV.',
    berserker: 'Frappe très fort.', pretresse: 'Te soigne en continu.',
    chasseuse: 'Tire de loin et rend la cible vulnérable.', moine: 'Frappe vite et étourdit parfois.'
  };
  // ---------- Contrats du jour : [statistique, quantité, texte] ----------
  // ---------- Primes : objectifs courts pendant une descente. stat = compteur de la descente ----------
  var PRIMES = [
    { id: 'pr_kills', icon: '☠️', name: 'Moisson', desc: 'Tue 15 ennemis', stat: 'kills', need: 15, rw: { gold: 40 } },
    { id: 'pr_elite', icon: '👹', name: 'Gros gibier', desc: 'Vaincs une élite', stat: 'elites', need: 1, rw: { boon: 1 } },
    { id: 'pr_parry', icon: '🤺', name: 'Riposte', desc: 'Réussis 2 parades parfaites', stat: 'parry', need: 2, rw: { potion: 1 } },
    { id: 'pr_deflect', icon: '💀', name: 'Retour à l’envoyeur', desc: 'Renvoie 4 projectiles', stat: 'deflect', need: 4, rw: { boon: 1 } },
    { id: 'pr_orbs', icon: '🔮', name: 'Glaneur', desc: 'Ramasse 8 orbes', stat: 'orbs', need: 8, rw: { ult: 60, gold: 20 } },
    { id: 'pr_weak', icon: '🎯', name: 'Œil de lynx', desc: 'Touche 3 points faibles', stat: 'weak', need: 3, rw: { gold: 50 } },
    { id: 'pr_ult', icon: '🌟', name: 'Déchaînement', desc: 'Lance 2 ultimes', stat: 'ult', need: 2, rw: { heal: 25 } },
    { id: 'pr_skills', icon: '✋', name: 'Mains agiles', desc: 'Lance 12 pouvoirs', stat: 'skills', need: 12, rw: { gold: 35 } },
    { id: 'pr_rooms', icon: '🚪', name: 'Toujours plus bas', desc: 'Gagne 4 combats', stat: 'rooms', need: 4, rw: { heal: 20 } },
    { id: 'pr_mini', icon: '⚒️', name: 'Doigts d’or', desc: 'Réussis une épreuve (forge, runes ou crochetage)', stat: 'mini', need: 1, rw: { boon: 1 } },
    { id: 'pr_crits', icon: '💥', name: 'Coups de maître', desc: 'Inflige 20 coups critiques', stat: 'crits', need: 20, rw: { gold: 40 } },
    { id: 'pr_clean', icon: '🛡️', name: 'Sans une égratignure', desc: 'Finis 3 combats avec plus de 70 % de PV', stat: 'clean', need: 3, rw: { potion: 1 } }
  ];
  // ---------- Roue du destin : 8 parts égales à l'écran, mais pas la même chance (w) ----------
  var WHEEL = [
    { icon: '💰', name: 'Bourse', w: 18, fx: { gold: 60 }, r: '' },
    { icon: '💀', name: 'Malédiction', w: 13, fx: { curse: 1 }, r: 'La roue mord : -12 % PV et +5 % dégâts subis.' },
    { icon: '🧪', name: 'Fiole', w: 14, fx: { potion: 1 }, r: '+1 fiole.' },
    { icon: '🎁', name: 'Objet', w: 9, fx: { item: 2 }, r: '' },
    { icon: '❤️', name: 'Soin', w: 14, fx: { healPct: 35 }, r: '+35 % PV.' },
    { icon: '🔥', name: 'Cendres', w: 12, fx: { cendres: 1 }, r: '' },
    { icon: '🌒', name: 'Aubaine', w: 14, fx: { boon: 1 }, r: 'Une aubaine à choisir.' },
    { icon: '👑', name: 'Artefact', w: 6, fx: { artifact: 1 }, r: '' }
  ];
  var CONTRACTS = [
    ['kills', 40, 'Tue 40 ennemis'], ['kills', 90, 'Tue 90 ennemis'], ['elites', 3, 'Vaincs 3 élites'], ['bosses', 1, 'Vaincs un boss'],
    ['chests', 2, 'Ouvre 2 coffres'], ['items', 8, 'Trouve 8 objets'], ['runs', 3, 'Lance 3 descentes'], ['upgrades', 3, 'Améliore 3 fois un objet'],
    ['weak', 10, 'Touche 10 points faibles'], ['parry', 3, 'Réussis 3 parades parfaites'], ['ult', 5, 'Lance 5 ultimes'], ['fusions', 2, 'Fusionne des objets 2 fois'], ['arenes', 1, 'Gagne une arène'], ['evos', 2, 'Choisis 2 éveils de pouvoir'],
    ['doubles', 4, 'Forme 4 figures sur la table de dés'], ['orbs', 15, 'Ramasse 15 orbes'], ['deflect', 6, 'Renvoie 6 projectiles'], ['minis', 2, 'Réussis 2 épreuves (forge, runes, crochetage)'], ['primes', 3, 'Remplis 3 primes']
  ];

  // ---------- Zones et ennemis ----------
  // Stats de base à l'étage 1. ab = capacités : poison, burn, bleed, charge (attaque chargée), heal, explode,
  // summon, enrage, leech, dodge (%), shield, weak (affaiblit le héros), fast
  var ENEMIES = {
    // Zone 1
    squelette: { name: 'Squelette', hp: 42, atk: 6, int: 2.0, def: 2, ab: {} },
    goule: { name: 'Goule', hp: 55, atk: 5, int: 1.5, def: 0, ab: { leech: 30 } },
    rat: { name: 'Rat pesteux', hp: 24, atk: 3, int: 1.0, def: 0, ab: { poison: 35 } },
    spectre: { name: 'Spectre', hp: 34, atk: 7, int: 2.2, def: 0, ab: { dodge: 25 } },
    // Zone 2
    loup: { name: 'Loup galeux', hp: 40, atk: 5, int: 1.1, def: 0, ab: { bleed: 30 } },
    araignee: { name: 'Veuve des bois', hp: 36, atk: 5, int: 1.6, def: 0, ab: { poison: 60 } },
    corbeau: { name: 'Charognard', hp: 26, atk: 4, int: 0.9, def: 0, ab: { dodge: 30 } },
    pendu: { name: 'Pendu', hp: 70, atk: 9, int: 2.6, def: 3, ab: { charge: 9 } },
    // Zone 3
    sangsue: { name: 'Sangsue géante', hp: 48, atk: 5, int: 1.4, def: 0, ab: { leech: 80 } },
    crapaud: { name: 'Crapaud bubonique', hp: 60, atk: 6, int: 2.2, def: 1, ab: { poison: 50, explode: 150 } },
    noye: { name: 'Noyé', hp: 80, atk: 8, int: 2.4, def: 4, ab: { weak: 30 } },
    essaim: { name: 'Essaim', hp: 22, atk: 2, int: 0.5, def: 0, ab: { dodge: 35 } },
    // Zone 4
    cultiste: { name: 'Cultiste', hp: 44, atk: 6, int: 1.8, def: 0, ab: { heal: 7 } },
    gargouille: { name: 'Gargouille', hp: 75, atk: 8, int: 2.4, def: 9, ab: {} },
    flagellant: { name: 'Flagellant', hp: 50, atk: 6, int: 1.3, def: 0, ab: { bleed: 40, enrage: 1 } },
    ange: { name: 'Ange déchu', hp: 58, atk: 10, int: 2.2, def: 2, ab: { charge: 8, dodge: 15 } },
    // Zone 5
    diablotin: { name: 'Diablotin', hp: 30, atk: 5, int: 1.0, def: 0, ab: { burn: 50 } },
    golem: { name: 'Golem de scories', hp: 110, atk: 10, int: 3.0, def: 12, ab: { charge: 10 } },
    cerbere: { name: "Chien de l'enfer", hp: 46, atk: 6, int: 1.0, def: 0, ab: { burn: 35, enrage: 1 } },
    forgeron: { name: 'Démon forgeron', hp: 78, atk: 9, int: 2.2, def: 6, ab: { shield: 8 } },
    // Zone 6
    ombre: { name: 'Ombre', hp: 40, atk: 7, int: 1.4, def: 0, ab: { dodge: 40 } },
    oeil: { name: 'Œil béant', hp: 50, atk: 11, int: 2.8, def: 0, ab: { charge: 7, weak: 40 } },
    devoreur: { name: 'Dévoreur', hp: 85, atk: 8, int: 1.6, def: 3, ab: { leech: 60, enrage: 1 } },
    chevalier_creux: { name: 'Chevalier creux', hp: 95, atk: 10, int: 2.2, def: 10, ab: { charge: 9 } },
    // Nouveaux monstres (2 par zone)
    chauve_souris: { name: 'Chauve-souris', hp: 20, atk: 3, int: 0.8, def: 0, ab: { leech: 40, dodge: 20 } },
    momie: { name: 'Momie', hp: 75, atk: 7, int: 2.4, def: 3, ab: { weak: 40 } },
    sanglier: { name: 'Sanglier maudit', hp: 65, atk: 8, int: 2.2, def: 2, ab: { charge: 7 } },
    champignon: { name: 'Mycélion', hp: 45, atk: 4, int: 1.8, def: 0, ab: { poison: 50, heal: 5 } },
    moustique: { name: 'Moustique géant', hp: 22, atk: 3, int: 0.7, def: 0, ab: { leech: 60, dodge: 25 } },
    limon: { name: 'Limon putride', hp: 70, atk: 6, int: 2.0, def: 1, ab: { poison: 40, explode: 120 } },
    nonne: { name: 'Sœur aveugle', hp: 48, atk: 5, int: 1.7, def: 0, ab: { heal: 8, weak: 30 } },
    armure: { name: 'Armure sainte', hp: 90, atk: 9, int: 2.4, def: 11, ab: { shield: 8 } },
    salamandre: { name: 'Salamandre', hp: 44, atk: 6, int: 1.2, def: 0, ab: { burn: 60 } },
    forge_esprit: { name: 'Esprit de forge', hp: 36, atk: 8, int: 1.8, def: 0, ab: { dodge: 25, burn: 40, explode: 130 } },
    larme: { name: 'Larme du vide', hp: 30, atk: 5, int: 1.0, def: 0, ab: { dodge: 30, weak: 30 } },
    colosse_creux: { name: 'Colosse creux', hp: 130, atk: 12, int: 3.0, def: 12, ab: { charge: 8, enrage: 1 } },
    // Spécial
    mimique: { name: 'Mimique', hp: 150, atk: 9, int: 1.4, def: 4, ab: { bleed: 40 }, elite: true },
    // Élites
    chevalier_os: { name: "Chevalier d'os", hp: 190, atk: 10, int: 2.0, def: 6, ab: { charge: 8 }, elite: true },
    dryade: { name: 'Dryade pourrie', hp: 200, atk: 8, int: 1.7, def: 4, ab: { poison: 60, heal: 6 }, elite: true },
    sorciere: { name: 'Sorcière des tourbes', hp: 180, atk: 10, int: 2.0, def: 2, ab: { poison: 50, weak: 40, summon: 'crapaud' }, elite: true },
    inquisiteur: { name: 'Inquisiteur', hp: 210, atk: 11, int: 1.9, def: 6, ab: { burn: 60, charge: 8 }, elite: true },
    bourreau: { name: 'Bourreau', hp: 240, atk: 14, int: 2.6, def: 5, ab: { charge: 7, bleed: 50, enrage: 1 }, elite: true },
    heraut: { name: 'Héraut du vide', hp: 220, atk: 12, int: 2.0, def: 4, ab: { dodge: 20, weak: 40, summon: 'ombre', charge: 9 }, elite: true },
    liche: { name: 'Liche mineure', hp: 170, atk: 11, int: 2.0, def: 2, ab: { summon: 'squelette', weak: 40, charge: 9 }, elite: true },
    chasseur_fou: { name: 'Chasseur fou', hp: 190, atk: 10, int: 1.4, def: 3, ab: { bleed: 50, dodge: 15 }, elite: true },
    hydre: { name: 'Hydre des tourbes', hp: 230, atk: 9, int: 1.5, def: 3, ab: { heal: 6, poison: 60, enrage: 1 }, elite: true },
    paladin: { name: 'Paladin déchu', hp: 230, atk: 12, int: 2.2, def: 10, ab: { shield: 10, charge: 8 }, elite: true },
    maitre_chaines: { name: 'Maître des chaînes', hp: 220, atk: 12, int: 1.8, def: 5, ab: { burn: 50, summon: 'diablotin', charge: 9 }, elite: true },
    devoreur_etoiles: { name: "Dévoreur d'étoiles", hp: 240, atk: 13, int: 2.0, def: 4, ab: { leech: 50, dodge: 15, charge: 7, enrage: 1 }, elite: true },
    // Boss
    fossoyeur: { name: 'Le Fossoyeur', hp: 520, atk: 11, int: 2.0, def: 4, ab: { charge: 8, summon: 'squelette', enrage: 1, burst: 1 }, boss: true },
    mere_ronces: { name: 'La Mère des Ronces', hp: 600, atk: 10, int: 1.6, def: 5, ab: { bleed: 60, heal: 5, charge: 9, thorns: 15, roots: 13 }, boss: true },
    leviathan: { name: 'Le Léviathan fangeux', hp: 700, atk: 12, int: 2.0, def: 6, ab: { poison: 70, charge: 7, summon: 'sangsue', enrage: 1, dive: 15 }, boss: true },
    eveque: { name: "L'Évêque sans visage", hp: 650, atk: 12, int: 1.8, def: 5, ab: { charge: 6, weak: 50, summon: 'cultiste', shield: 10, ward: 1 }, boss: true },
    seigneur_braises: { name: 'Le Seigneur des Braises', hp: 760, atk: 14, int: 1.9, def: 8, ab: { burn: 80, charge: 6, enrage: 1, heat: 1 }, boss: true },
    roi_creux: { name: 'Le Roi Creux', hp: 900, atk: 15, int: 1.8, def: 8, ab: { charge: 5, weak: 40, summon: 'chevalier_creux', enrage: 1, dodge: 10, leech: 30, rebirth: 1 }, boss: true }
  };

  var ZONES = [
    { id: 1, name: 'Crypte des Oubliés', short: 'Crypte', color: '#7d8aa6', bg: ['#141722', '#0b0c12'], mobs: ['squelette', 'goule', 'rat', 'spectre', 'chauve_souris', 'momie'], elite: 'chevalier_os', elites: ['chevalier_os', 'liche'], boss: 'fossoyeur', uniques: ['u_pelle', 'u_linceul', 'u_lanterne'] },
    { id: 2, name: 'Bois des Pendus', short: 'Bois', color: '#6f9b5a', bg: ['#131c14', '#090d0a'], mobs: ['loup', 'araignee', 'corbeau', 'pendu', 'sanglier', 'champignon'], elite: 'dryade', elites: ['dryade', 'chasseur_fou'], boss: 'mere_ronces', uniques: ['u_ronces', 'u_corbeau', 'u_croc'] },
    { id: 3, name: 'Marais de la Peste', short: 'Marais', color: '#9aa04a', bg: ['#191b10', '#0c0d08'], mobs: ['sangsue', 'crapaud', 'noye', 'essaim', 'moustique', 'limon'], elite: 'sorciere', elites: ['sorciere', 'hydre'], boss: 'leviathan', uniques: ['u_coeur', 'u_carapace', 'u_bottes'] },
    { id: 4, name: 'Cathédrale Profanée', short: 'Cathédrale', color: '#c9a55a', bg: ['#1c1710', '#0d0b08'], mobs: ['cultiste', 'gargouille', 'flagellant', 'ange', 'nonne', 'armure'], elite: 'inquisiteur', elites: ['inquisiteur', 'paladin'], boss: 'eveque', uniques: ['u_anneau', 'u_larme', 'u_calice'] },
    { id: 5, name: 'Forges Infernales', short: 'Forges', color: '#e0622e', bg: ['#21110c', '#100806'], mobs: ['diablotin', 'golem', 'cerbere', 'forgeron', 'salamandre', 'forge_esprit'], elite: 'bourreau', elites: ['bourreau', 'maitre_chaines'], boss: 'seigneur_braises', uniques: ['u_braisefer', 'u_sceau', 'u_marteau'] },
    { id: 6, name: 'Trône du Roi Creux', short: 'Trône', color: '#9b6bff', bg: ['#170f24', '#0a0710'], mobs: ['ombre', 'oeil', 'devoreur', 'chevalier_creux', 'larme', 'colosse_creux'], elite: 'heraut', elites: ['heraut', 'devoreur_etoiles'], boss: 'roi_creux', uniques: ['u_couronne', 'u_faux', 'u_manteau'] }
  ];

  // ---------- Histoire : présentation de chaque zone et réplique du boss ----------
  var LORE = {
    1: ['Sous la chapelle de Morvane, les morts ne dorment plus. Le Fossoyeur les déterre un par un pour son armée, et il lui en manque toujours un : toi.', 'Encore un qui marche. Je vais arranger ça.'],
    2: ['On pendait ici les voleurs, puis les innocents, puis plus personne ne compta. Les arbres ont bu tant de larmes qu’ils ont appris à haïr.', 'Mes enfants ont faim. Approche, petite chose.'],
    3: ['La peste est née dans cette eau. Ceux qui s’y sont noyés ne sont jamais remontés. Quelque chose de très grand les a gardés.', '...'],
    4: ['Les fidèles priaient pour que le Roi revienne. Il est revenu, vide. L’Évêque a arraché son propre visage pour ne plus le voir.', 'Agenouille-toi. Ou je te ferai agenouiller.'],
    5: ['Ici fut forgée la couronne du Roi Creux. Les forgerons brûlent encore, enchaînés à leurs enclumes, et leur maître ne laisse rien refroidir.', 'Ta chair fera un bon charbon.'],
    6: ['Le dernier étage. Un trône, une armure, et rien dedans. Le Roi Creux n’a jamais été un homme : seulement la faim de tout ce qu’il a éteint.', 'Tu es venu remplir le vide ? Il n’y a pas assez de toi.']
  };
  ZONES.forEach(function (z) { z.lore = LORE[z.id][0]; z.taunt = LORE[z.id][1]; });
  // Spécialité de chaque boss, affichée dans la présentation de la zone
  var MECH = {
    1: 'À la moitié de ses PV, il relève deux squelettes d’un coup.',
    2: 'Ses racines t’entravent régulièrement : tu frappes 2 fois moins vite pendant 4 s.',
    3: 'Il plonge et devient intouchable, puis resurgit avec un coup énorme : pare-le.',
    4: 'À 66 % et 33 % de ses PV, il se protège d’un bouclier et te réduit au silence (pouvoirs retardés).',
    5: 'La chaleur de la forge te brûle de plus en plus fort : tue-le vite.',
    6: 'Quand il tombe, il se relève une fois, enragé, avec 40 % de ses PV.'
  };
  ZONES.forEach(function (z) { z.mech = MECH[z.id]; });

  // ---------- Familiers : débloqués en tuant assez de monstres d'une espèce. Un seul actif. ----------
  var FAMILIARS = [
    { id: 'f_rat', spr: 'rat', name: 'Rat fouineur', need: ['rat', 40], desc: "+20 % d'or et de Cendres.", mods: { gf: 20 } },
    { id: 'f_squelette', spr: 'serviteur', noflip: 1, name: 'Petit squelette', need: ['squelette', 60], desc: '+8 % de chance de frapper deux fois.', mods: { echo: 8 } },
    { id: 'f_spectre', spr: 'spectre', name: 'Feu follet', need: ['spectre', 40], desc: '+6 % esquive.', mods: { dodge: 6 } },
    { id: 'f_corbeau', spr: 'corbeau', name: 'Corbeau charognard', need: ['corbeau', 40], desc: '+25 % chance de butin rare.', mods: { mf: 25 } },
    { id: 'f_araignee', spr: 'araignee', name: 'Veuve apprivoisée', need: ['araignee', 40], desc: "+25 % de chance d'empoisonner.", mods: { poisonHit: 25 } },
    { id: 'f_sangsue', spr: 'sangsue', name: 'Sangsue fidèle', need: ['sangsue', 40], desc: '+3 % vol de vie.', mods: { ls: 3 } },
    { id: 'f_gargouille', spr: 'gargouille', name: 'Gargouille de poche', need: ['gargouille', 40], desc: '+20 % armure.', mods: { defP: 20 } },
    { id: 'f_diablotin', spr: 'diablotin', name: 'Diablotin lié', need: ['diablotin', 40], desc: "+25 % de chance d'embraser.", mods: { burnHit: 25 } },
    { id: 'f_oeil', spr: 'oeil', name: 'Œil veilleur', need: ['oeil', 40], desc: '+6 % critique, +50 % dégâts sur point faible.', mods: { crit: 6, weakP: 50 } },
    { id: 'f_mimique', spr: 'mimique', name: 'Mimique domptée', need: ['mimique', 5], desc: '+50 or au départ et +1 fiole.', mods: { startGold: 50, potions: 1 } }
  ];

  // ---------- Objets ----------
  var SLOTS = [
    { id: 'arme', name: 'Arme', icon: '🗡️' }, { id: 'casque', name: 'Casque', icon: '⛑️' },
    { id: 'armure', name: 'Armure', icon: '🛡️' }, { id: 'bottes', name: 'Bottes', icon: '🥾' },
    { id: 'anneau', name: 'Anneau', icon: '💍' }, { id: 'amulette', name: 'Amulette', icon: '📿' }
  ];
  // imp = bonus fixe de la base. s = grandit avec le niveau d'objet (exponentiel) ; sinon valeur en %.
  var BASES = [
    { id: 'epee', slot: 'arme', name: 'Épée', icon: '🗡️', imp: { atk: 5 } },
    { id: 'hache', slot: 'arme', name: 'Hache', icon: '🪓', imp: { atk: 5.6 }, imp2: { critd: 12 } },
    { id: 'dague', slot: 'arme', name: 'Dague', icon: '🔪', imp: { atk: 4.2 }, imp2: { crit: 5 } },
    { id: 'baton', slot: 'arme', name: 'Bâton', icon: '⚕️', imp: { atk: 4.4 }, imp2: { pow: 15 } },
    { id: 'masse', slot: 'arme', name: 'Masse', icon: '🔨', imp: { atk: 5.2 }, imp2: { block: 4 } },
    { id: 'heaume', slot: 'casque', name: 'Heaume', icon: '⛑️', imp: { hp: 22, def: 1.5 } },
    { id: 'capuche', slot: 'casque', name: 'Capuche', icon: '🎭', imp: { hp: 18 }, imp2: { dodge: 3 } },
    { id: 'couronne', slot: 'casque', name: 'Diadème', icon: '👑', imp: { hp: 16 }, imp2: { pow: 10 } },
    { id: 'plastron', slot: 'armure', name: 'Plastron', icon: '🛡️', imp: { hp: 26, def: 3 } },
    { id: 'robe', slot: 'armure', name: 'Robe', icon: '🥋', imp: { hp: 30 }, imp2: { cdr: 5 } },
    { id: 'cuir', slot: 'armure', name: 'Cuirasse', icon: '🦺', imp: { hp: 24, def: 2 }, imp2: { dodge: 3 } },
    { id: 'greves', slot: 'bottes', name: 'Grèves', icon: '🥾', imp: { hp: 12, def: 2 } },
    { id: 'sandales', slot: 'bottes', name: 'Sandales', icon: '👢', imp: { hp: 12 }, imp2: { spdP: 6 } },
    { id: 'chevaliere', slot: 'anneau', name: 'Chevalière', icon: '💍', imp: { atk: 1.6 }, imp2: { crit: 4 } },
    { id: 'jonc', slot: 'anneau', name: 'Jonc', icon: '⭕', imp: { hp: 10 }, imp2: { ls: 2 } },
    { id: 'pendentif', slot: 'amulette', name: 'Pendentif', icon: '📿', imp: { hp: 12 }, imp2: { pow: 12 } },
    { id: 'talisman', slot: 'amulette', name: 'Talisman', icon: '🧿', imp: { atk: 1.4 }, imp2: { mf: 10 } }
  ];
  // Affixes aléatoires. s:true = valeur qui grandit avec le niveau d'objet.
  var AFFIXES = [
    { k: 'atk', min: 1.2, max: 2.2, s: true, pre: 'cruel', slots: ['arme', 'anneau', 'amulette'] },
    { k: 'hp', min: 8, max: 15, s: true, pre: 'robuste' },
    { k: 'def', min: 1, max: 2, s: true, pre: 'blindé', slots: ['casque', 'armure', 'bottes'] },
    { k: 'atkP', min: 4, max: 9, pre: 'féroce' }, { k: 'hpP', min: 4, max: 9, pre: 'vigoureux' },
    { k: 'defP', min: 5, max: 10, pre: 'solide', slots: ['casque', 'armure', 'bottes'] },
    { k: 'spdP', min: 3, max: 7, pre: 'vif' }, { k: 'crit', min: 2, max: 5, pre: 'perçant' },
    { k: 'critd', min: 8, max: 18, pre: 'brutal' }, { k: 'ls', min: 1, max: 3, pre: 'vampirique' },
    { k: 'dodge', min: 2, max: 4, pre: 'furtif' }, { k: 'regen', min: 0.2, max: 0.5, pre: 'béni' },
    { k: 'pow', min: 6, max: 14, pre: 'occulte' }, { k: 'cdr', min: 3, max: 6, pre: 'hâtif' },
    { k: 'gf', min: 6, max: 14, pre: 'doré' }, { k: 'mf', min: 5, max: 12, pre: 'chanceux' },
    { k: 'xp', min: 5, max: 10, pre: 'sage' }, { k: 'thorns', min: 6, max: 14, pre: 'épineux', slots: ['casque', 'armure', 'bottes'] },
    { k: 'block', min: 2, max: 4, pre: 'gardien', slots: ['arme', 'armure'] }
  ];
  // Pouvoirs des objets légendaires (un au hasard)
  var POWERS = [
    { id: 'pw_echo', name: 'Écho', mods: { echo: 15 } }, { id: 'pw_braise', name: 'Braise', mods: { burnHit: 40, burnP: 30 } },
    { id: 'pw_venin', name: 'Venin', mods: { poisonHit: 35, poisonP: 30 } }, { id: 'pw_embuscade', name: 'Embuscade', mods: { firstStrike: 200 } },
    { id: 'pw_egide', name: 'Égide', mods: { startShield: 25 } }, { id: 'pw_festin', name: 'Festin', mods: { killHeal: 6 } },
    { id: 'pw_bourreau', name: 'Bourreau', mods: { exec: 50 } }, { id: 'pw_foudre', name: 'Foudre', mods: { chain: 90 } },
    { id: 'pw_frenesie', name: 'Frénésie', mods: { frenzy: 3 } }, { id: 'pw_sangsue', name: 'Sangsue', mods: { ls: 6 } },
    { id: 'pw_sablier', name: 'Sablier', mods: { cdr: 15 } }, { id: 'pw_fiole', name: 'Alchimiste', mods: { potions: 1, healP: 20 } },
    { id: 'pw_hemorragie', name: 'Hémorragie', mods: { bleedHit: 35, bleedP: 30 } }, { id: 'pw_titan', name: 'Titan', mods: { allP: 8 } },
    { id: 'pw_duel', name: 'Duelliste', mods: { parryP: 120, block: 6 } }, { id: 'pw_zenith', name: 'Zénith', mods: { ultP: 40 } }, { id: 'pw_traque', name: 'Traque', mods: { weakP: 100 } },
    { id: 'pw_rituel', name: 'Rituel', mods: { skillHeal: 2, pow: 15 } }, { id: 'pw_predateur', name: 'Prédateur', mods: { statusDmg: 25 } }
  ];
  // Objets uniques (rouges) — seulement sur les boss
  var UNIQUES = [
    { id: 'u_pelle', name: 'Pelle du Fossoyeur', base: 'masse', lore: 'Elle a creusé plus de tombes que de tranchées.', aff: { atkP: 14, critd: 20, hpP: 8, gf: 20 }, mods: { killHeal: 10, firstStrike: 150 } },
    { id: 'u_linceul', name: 'Linceul du Dernier Souffle', base: 'robe', lore: 'On ne meurt qu’une fois. Sauf toi.', aff: { hpP: 14, regen: 0.6, defP: 12, cdr: 6 }, mods: { revive: 1 } },
    { id: 'u_ronces', name: 'Couronne de Ronces', base: 'couronne', lore: 'Chaque épine est un souvenir.', aff: { hpP: 12, defP: 12, pow: 14, regen: 0.4 }, mods: { thorns: 70, bleedHit: 30 } },
    { id: 'u_corbeau', name: 'Pas du Corbeau', base: 'sandales', lore: 'Tu arrives avant ton ombre.', aff: { spdP: 10, dodge: 6, crit: 5, atkP: 8 }, mods: { dodge: 10, frenzy: 3 } },
    { id: 'u_coeur', name: 'Cœur du Léviathan', base: 'pendentif', lore: 'Il bat encore. Lentement.', aff: { hpP: 16, ls: 3, pow: 14, defP: 8 }, mods: { regen: 2, hpP: 20 } },
    { id: 'u_carapace', name: "Carapace de l'Abomination", base: 'plastron', lore: 'Forgée dans ce qui ne voulait pas mourir.', aff: { hpP: 12, defP: 16, thorns: 14, block: 4 }, mods: { startShield: 45 } },
    { id: 'u_anneau', name: "Anneau de l'Évêque", base: 'chevaliere', lore: 'Il bénit. Il maudit. Il ne fait pas la différence.', aff: { crit: 5, pow: 16, atkP: 9, xp: 10 }, mods: { cdr: 22, pow: 30 } },
    { id: 'u_larme', name: 'Larme Noire', base: 'talisman', lore: 'La dernière chose que pleura un ange.', aff: { atkP: 10, crit: 5, mf: 15, critd: 18 }, mods: { echo: 28 } },
    { id: 'u_braisefer', name: 'Braisefer', base: 'epee', lore: 'La lame ne refroidit jamais.', aff: { atkP: 16, crit: 6, spdP: 8, critd: 20 }, mods: { burnHit: 100, burnP: 120 } },
    { id: 'u_sceau', name: 'Sceau du Bourreau', base: 'jonc', lore: 'Un seul geste. Un seul verdict.', aff: { crit: 6, critd: 22, atkP: 10, ls: 3 }, mods: { exec: 80, crit: 8 } },
    { id: 'u_couronne', name: 'Couronne du Roi Creux', base: 'heaume', lore: 'Elle est trop grande. Elle le sera toujours.', aff: { hpP: 14, atkP: 12, defP: 12, mf: 15 }, mods: { allP: 15, boonChoices: 1 } },
    { id: 'u_lanterne', name: 'Lanterne du Fossoyeur', base: 'pendentif', lore: 'Elle n’éclaire que ce qui est déjà mort.', aff: { hpP: 12, gf: 25, pow: 12, mf: 15 }, mods: { gf: 40, killHeal: 5 } },
    { id: 'u_croc', name: 'Croc de la Meute', base: 'dague', lore: 'Arraché vivant. Il mord encore.', aff: { atkP: 14, crit: 6, spdP: 8, critd: 18 }, mods: { bleedHit: 60, spdP: 15 } },
    { id: 'u_bottes', name: 'Bottes du Noyé', base: 'greves', lore: 'Elles sont toujours mouillées.', aff: { hpP: 14, defP: 12, regen: 0.5, dodge: 4 }, mods: { regen: 1, takenP: -10 } },
    { id: 'u_calice', name: 'Calice Profané', base: 'jonc', lore: 'Ce qu’on y boit ne se dit pas.', aff: { hpP: 10, ls: 3, pow: 12, crit: 4 }, mods: { healP: 50, ls: 6 } },
    { id: 'u_marteau', name: 'Marteau des Chaînes', base: 'masse', lore: 'Chaque maillon fut un forgeron.', aff: { atkP: 15, block: 4, critd: 20, defP: 10 }, mods: { parryP: 200, block: 10 } },
    { id: 'u_manteau', name: "Manteau d'Étoiles Mortes", base: 'cuir', lore: 'Regarde bien : aucune ne brille.', aff: { hpP: 12, dodge: 5, spdP: 8, defP: 10 }, mods: { dodge: 15, ultP: 60 } },
    { id: 'u_faux', name: 'Faux des Âmes', base: 'hache', lore: 'Elle moissonne. Tu récoltes.', aff: { atkP: 18, critd: 25, spdP: 8, crit: 6 }, mods: { ls: 12, chain: 120 } }
  ];

  // ---------- Aubaines (passifs de descente) ----------
  // rar : 0 commune, 1 rare, 2 épique, 3 légendaire. max = nombre de fois qu'on peut la prendre.
  var BOONS = [
    { id: 'b_force', name: 'Force brute', icon: '💪', rar: 0, max: 9, desc: '+12 % attaque.', mods: { atkP: 12 } },
    { id: 'b_vie', name: 'Sang épais', icon: '❤️', rar: 0, max: 9, desc: '+14 % PV max.', mods: { hpP: 14 } },
    { id: 'b_fer', name: 'Peau de fer', icon: '⛰️', rar: 0, max: 9, desc: '+18 % armure.', mods: { defP: 18 } },
    { id: 'b_hate', name: 'Main leste', icon: '🖐️', rar: 0, max: 8, desc: "+9 % vitesse d'attaque.", mods: { spdP: 9 } },
    { id: 'b_oeil', name: 'Œil du faucon', icon: '🎯', rar: 0, max: 8, desc: '+6 % chance de critique.', mods: { crit: 6 } },
    { id: 'b_cruel', name: 'Cruauté', icon: '🩸', rar: 0, max: 8, desc: '+25 % dégâts critiques.', mods: { critd: 25 } },
    { id: 'b_or', name: 'Doigts crochus', icon: '💰', rar: 0, max: 5, desc: "+30 % d'or et de Cendres.", mods: { gf: 30 } },
    { id: 'b_arcane', name: 'Savoir interdit', icon: '📖', rar: 0, max: 8, desc: '+18 % puissance des pouvoirs.', mods: { pow: 18 } },
    { id: 'b_des1', name: 'Dé pipé', icon: '🎲', rar: 1, max: 2, desc: '+1 relance de ta main de dés par combat.', mods: { diceRerolls: 1 } },
    { id: 'b_des2', name: 'Main lourde', icon: '🎰', rar: 2, max: 2, desc: 'Les figures Coup fort et Prudence sont 50 % plus puissantes.', mods: { diceP: 50 } },
    { id: 'b_des3', name: 'Grande main', icon: '🖐️', rar: 3, max: 1, desc: 'Tu pioches 1 dé de plus à chaque tour.', mods: { diceHand: 1 } },
    { id: 'b_des4', name: 'Dés lestés', icon: '⚖️', rar: 2, max: 2, desc: 'Tous tes dés valent 1 point de plus.', mods: { diceV: 1 } },
    { id: 'b_regen', name: 'Chair tenace', icon: '🌿', rar: 0, max: 5, desc: 'Régénère +0,5 % PV par seconde.', mods: { regen: 0.5 } },
    { id: 'b_sang', name: 'Soif', icon: '🧛', rar: 1, max: 5, desc: '+4 % vol de vie.', mods: { ls: 4 } },
    { id: 'b_ombre', name: 'Pas de côté', icon: '💨', rar: 1, max: 5, desc: '+6 % esquive.', mods: { dodge: 6 } },
    { id: 'b_tempo', name: 'Tempo', icon: '⏳', rar: 1, max: 4, desc: 'Pouvoirs rechargés 10 % plus vite.', mods: { cdr: 10 } },
    { id: 'b_chance', name: 'Chance du pendu', icon: '🍀', rar: 1, max: 4, desc: '+25 % chance de butin rare.', mods: { mf: 25 } },
    { id: 'b_festin', name: 'Festin', icon: '🍖', rar: 1, max: 4, desc: 'Tuer un ennemi soigne 4 % PV.', mods: { killHeal: 4 } },
    { id: 'b_epines', name: 'Ronces', icon: '🌵', rar: 1, max: 5, desc: 'Renvoie 25 % de ton attaque à chaque coup reçu.', mods: { thorns: 25 } },
    { id: 'b_flamme', name: 'Flammes impies', icon: '🔥', rar: 1, max: 3, desc: "+35 % de chance d'embraser en attaquant.", mods: { burnHit: 35 } },
    { id: 'b_venin', name: 'Venin', icon: '🐍', rar: 1, max: 3, desc: "+35 % de chance d'empoisonner en attaquant.", mods: { poisonHit: 35 } },
    { id: 'b_saigne', name: 'Lame dentelée', icon: '🦈', rar: 1, max: 3, desc: '+35 % de chance de faire saigner.', mods: { bleedHit: 35 } },
    { id: 'b_bourreau', name: 'Coup de grâce', icon: '⚰️', rar: 1, max: 4, desc: '+35 % dégâts aux ennemis sous 30 % PV.', mods: { exec: 35 } },
    { id: 'b_egide', name: "Bouclier d'os", icon: '🦴', rar: 1, max: 4, desc: 'Commence chaque combat avec un bouclier de 12 % PV.', mods: { startShield: 12 } },
    { id: 'b_echo', name: 'Écho', icon: '👥', rar: 2, max: 4, desc: '+12 % de chance de frapper deux fois.', mods: { echo: 12 } },
    { id: 'b_embuscade', name: 'Embuscade', icon: '🗯️', rar: 2, max: 3, desc: 'Ton premier coup de chaque combat fait +150 % dégâts.', mods: { firstStrike: 150 } },
    { id: 'b_foudre', name: "Chaîne d'éclairs", icon: '⚡', rar: 2, max: 3, desc: 'Chaque 4e attaque frappe tous les ennemis (+70 %).', mods: { chain: 70 } },
    { id: 'b_frenesie', name: 'Frénésie', icon: '🥁', rar: 2, max: 3, desc: 'Chaque coup : +2 % vitesse (x10), remis à zéro à chaque combat.', mods: { frenzy: 2 } },
    { id: 'b_verre', name: 'Canon de verre', icon: '💎', rar: 2, max: 2, desc: '+45 % attaque, mais -18 % PV max.', mods: { atkP: 45, hpP: -18 } },
    { id: 'b_colosse', name: 'Colosse', icon: '🗿', rar: 2, max: 2, desc: '+35 % PV et +25 % armure, -8 % vitesse.', mods: { hpP: 35, defP: 25, spdP: -8 } },
    { id: 'b_fiole', name: 'Alambic', icon: '🧪', rar: 2, max: 2, desc: '+1 fiole et +25 % de soins reçus.', mods: { potions: 1, healP: 25 } },
    { id: 'b_tout', name: 'Bénédiction creuse', icon: '🌒', rar: 2, max: 3, desc: '+7 % à toutes les stats.', mods: { allP: 7 } },
    { id: 'b_sangfroid', name: 'Sang-froid', icon: '🧊', rar: 0, max: 5, desc: '-4 % dégâts subis.', mods: { takenP: -4 } },
    { id: 'b_duelliste', name: 'Duelliste', icon: '⚔️', rar: 1, max: 3, desc: 'Parade : riposte +60 %. +4 % blocage.', mods: { parryP: 60, block: 4 } },
    { id: 'b_pillard', name: 'Pillard', icon: '🗝️', rar: 1, max: 3, desc: '+20 % or et Cendres, +20 % butin rare.', mods: { gf: 20, mf: 20 } },
    { id: 'b_brasier', name: 'Brasier', icon: '♨️', rar: 1, max: 3, desc: 'Brûlures : +50 % dégâts.', mods: { burnP: 50 } },
    { id: 'b_pestilence', name: 'Pestilence', icon: '🧫', rar: 1, max: 3, desc: 'Poison : +50 % dégâts.', mods: { poisonP: 50 } },
    { id: 'b_ecorcheur', name: 'Écorcheur', icon: '🔪', rar: 1, max: 3, desc: 'Saignement : +50 % dégâts.', mods: { bleedP: 50 } },
    { id: 'b_zenith', name: 'Zénith', icon: '🌞', rar: 2, max: 2, desc: "L'ultime se charge 40 % plus vite, +15 % puissance.", mods: { ultP: 40, pow: 15 } },
    { id: 'b_titan', name: 'Titan épineux', icon: '🦔', rar: 3, max: 1, desc: '+40 % PV et renvoie 60 % de ton attaque à chaque coup reçu.', mods: { hpP: 40, thorns: 60 } },
    { id: 'b_riposte', name: 'Riposte', icon: '🤺', rar: 1, max: 3, desc: 'Parade : la riposte fait +100 % dégâts.', mods: { parryP: 100 } },
    { id: 'b_lynx', name: 'Œil de lynx', icon: '🎯', rar: 1, max: 3, desc: 'Points faibles : +60 % dégâts.', mods: { weakP: 60 } },
    { id: 'b_adrenaline', name: 'Adrénaline', icon: '💉', rar: 1, max: 3, desc: "L'ultime se charge 30 % plus vite.", mods: { ultP: 30 } },
    { id: 'b_phenix', name: 'Dernier souffle', icon: '🕊️', rar: 3, max: 1, desc: 'Une fois par descente, reviens à la vie avec 40 % PV.', mods: { revive: 1 } },
    { id: 'b_avatar', name: 'Avatar de guerre', icon: '👹', rar: 3, max: 1, desc: '+30 % dégâts infligés.', mods: { dmgP: 30 } },
    { id: 'b_bastion', name: 'Bastion', icon: '🏯', rar: 3, max: 1, desc: '-22 % dégâts subis.', mods: { takenP: -22 } },
    { id: 'b_destin', name: 'Fil du destin', icon: '🧵', rar: 3, max: 1, desc: "+1 choix à chaque aubaine et +1 relance.", mods: { boonChoices: 1, rerolls: 1 } },
    { id: 'b_tempete', name: 'Tempête de lames', icon: '🌀', rar: 3, max: 1, desc: '+25 % vitesse et +15 % chance de frapper deux fois.', mods: { spdP: 25, echo: 15 } },
    { id: 'b_maitrise', name: 'Maîtrise', icon: '🎓', rar: 1, max: 3, desc: '+15 % puissance des pouvoirs, recharge 6 % plus rapide.', mods: { pow: 15, cdr: 6 } },
    { id: 'b_rituel', name: 'Rituel', icon: '🕯️', rar: 1, max: 3, desc: 'Chaque pouvoir lancé te soigne de 2 % PV.', mods: { skillHeal: 2 } },
    { id: 'b_opportuniste', name: 'Opportuniste', icon: '💫', rar: 1, max: 3, desc: '+40 % dégâts aux ennemis étourdis.', mods: { stunDmg: 40 } },
    { id: 'b_predateur', name: 'Prédateur', icon: '🐺', rar: 2, max: 2, desc: '+25 % dégâts aux ennemis qui brûlent, saignent ou sont empoisonnés.', mods: { statusDmg: 25 } },
    { id: 'b_resonance', name: 'Résonance', icon: '🔔', rar: 3, max: 1, desc: '20 % de chance qu’un pouvoir lancé soit rechargé aussitôt.', mods: { skillEcho: 20 } },
    { id: 'b_rempart', name: 'Second rempart', icon: '🧱', rar: 2, max: 2, desc: '+8 % blocage et bouclier de 10 % PV au début de chaque combat.', mods: { block: 8, startShield: 10 } }
  ];

  // ---------- Artefacts (reliques de descente, uniques) ----------
  var ARTIFACTS = [
    { id: 'r_crane', name: 'Crâne du premier roi', icon: '💀', desc: '+22 % attaque.', mods: { atkP: 22 } },
    { id: 'r_coeur', name: 'Cœur encore battant', icon: '💗', desc: '+25 % PV et +0,5 % régénération.', mods: { hpP: 25, regen: 0.5 } },
    { id: 'r_lanterne', name: 'Lanterne des noyés', icon: '🏮', desc: '+50 % chance de butin rare.', mods: { mf: 50 } },
    { id: 'r_bourse', name: 'Bourse sans fond', icon: '👛', desc: "+60 % d'or et de Cendres.", mods: { gf: 60 } },
    { id: 'r_sablier', name: 'Sablier fêlé', icon: '⌛', desc: 'Pouvoirs rechargés 20 % plus vite.', mods: { cdr: 20 } },
    { id: 'r_dent', name: "Dent de l'abomination", icon: '🦷', desc: '+10 % critique, +35 % dégâts critiques.', mods: { crit: 10, critd: 35 } },
    { id: 'r_miroir', name: 'Miroir noir', icon: '🖤', desc: 'Renvoie 60 % de ton attaque à chaque coup reçu.', mods: { thorns: 60 } },
    { id: 'r_calice', name: 'Calice de sang', icon: '🍷', desc: '+8 % vol de vie.', mods: { ls: 8 } },
    { id: 'r_clou', name: 'Clou du pendu', icon: '📌', desc: 'Premier coup de chaque combat : +250 % dégâts.', mods: { firstStrike: 250 } },
    { id: 'r_pierre', name: "Pierre d'âme", icon: '🔮', desc: 'Une résurrection de plus pour cette descente.', mods: { revive: 1 } },
    { id: 'r_chapelet', name: "Chapelet d'os", icon: '📿', desc: 'Bouclier de 22 % PV au début de chaque combat.', mods: { startShield: 22 } },
    { id: 'r_oeil', name: 'Œil du corbeau', icon: '👁️', desc: "+1 choix à chaque aubaine.", mods: { boonChoices: 1 } },
    { id: 'r_plume', name: "Plume d'ange déchu", icon: '🦅', desc: '+12 % esquive, +8 % vitesse.', mods: { dodge: 12, spdP: 8 } },
    { id: 'r_braise', name: 'Braise éternelle', icon: '♨️', desc: 'Tes attaques embrasent (+60 %), brûlures +40 %.', mods: { burnHit: 60, burnP: 40 } },
    { id: 'r_peste', name: 'Fiole de peste', icon: '🧫', desc: 'Tes attaques empoisonnent (+50 %), poison +40 %.', mods: { poisonHit: 50, poisonP: 40 } },
    { id: 'r_cor', name: 'Cor de guerre', icon: '📯', desc: "+20 % vitesse d'attaque.", mods: { spdP: 20 } },
    { id: 'r_masque', name: 'Masque du bourreau', icon: '👺', desc: '+60 % dégâts aux ennemis sous 30 % PV.', mods: { exec: 60 } },
    { id: 'r_piece', name: 'Pièce du passeur', icon: '💰', desc: '+2 fioles.', mods: { potions: 2 } },
    { id: 'r_grimoire', name: 'Grimoire scellé', icon: '📕', desc: '+40 % puissance des pouvoirs.', mods: { pow: 40 } },
    { id: 'r_chaine', name: 'Chaîne brisée', icon: '⛓️', desc: '+2 % attaque par salle franchie dans cette descente.', mods: { atkPerRoom: 2 } },
    { id: 'r_idole', name: 'Idole affamée', icon: '🗿', desc: '+45 % dégâts infligés, mais +20 % dégâts subis.', mods: { dmgP: 45, takenP: 20 } },
    { id: 'r_couronne', name: 'Éclat de couronne', icon: '👑', desc: '+10 % à toutes les stats.', mods: { allP: 10 } },
    { id: 'r_larme', name: 'Larme de sainte', icon: '💧', desc: '+45 % soins reçus.', mods: { healP: 45 } },
    { id: 'r_fer', name: 'Fer à marquer', icon: '🔱', desc: 'Les ennemis commencent Vulnérables pendant 6 s (+25 % dégâts subis).', mods: { vulnStart: 6 } },
    { id: 'r_enclume', name: 'Enclume miniature', icon: '⚒️', desc: '+30 % armure, renvoie 20 %.', mods: { defP: 30, thorns: 20 } },
    { id: 'r_boussole', name: 'Boussole du fossoyeur', icon: '🧭', desc: '+30 % butin rare et +30 % or et Cendres.', mods: { mf: 30, gf: 30 } },
    { id: 'r_gantelet', name: 'Gantelet de duelliste', icon: '🧤', desc: 'Parade : riposte +150 %. +8 % blocage.', mods: { parryP: 150, block: 8 } },
    { id: 'r_coeurvide', name: 'Cœur du vide', icon: '🕳️', desc: "L'ultime se charge 60 % plus vite.", mods: { ultP: 60 } },
    { id: 'r_cible', name: 'Cible gravée', icon: '🎯', desc: 'Points faibles : +120 % dégâts.', mods: { weakP: 120 } },
    { id: 'r_bandage', name: 'Bandages bénis', icon: '🩹', desc: '+30 % soins reçus, +0,6 % régénération.', mods: { healP: 30, regen: 0.6 } },
    { id: 'r_fouet', name: 'Fouet à neuf queues', icon: '➰', desc: 'Tes attaques font saigner (+50 %), saignement +50 %.', mods: { bleedHit: 50, bleedP: 50 } },
    { id: 'r_etoile', name: 'Étoile de fer', icon: '✴️', desc: 'Chaque 4e attaque frappe tous les ennemis (+100 %).', mods: { chain: 100 } },
    { id: 'r_sceptre', name: 'Sceptre brisé', icon: '⚜️', desc: '+25 % puissance des pouvoirs, recharge 12 % plus rapide.', mods: { pow: 25, cdr: 12 } },
    { id: 'r_tambour', name: 'Tambour de peau', icon: '🥁', desc: 'Chaque coup : +3 % vitesse (x10).', mods: { frenzy: 3 } },
    { id: 'r_diapason', name: 'Diapason d’os', icon: '🔔', desc: '15 % de chance qu’un pouvoir lancé soit rechargé aussitôt.', mods: { skillEcho: 15 } },
    { id: 'r_encens', name: 'Encens noir', icon: '🕯️', desc: 'Chaque pouvoir lancé te soigne de 3 % PV. +15 % puissance.', mods: { skillHeal: 3, pow: 15 } },
    { id: 'r_crochet', name: 'Crochet du boucher', icon: '🪝', desc: '+60 % dégâts aux ennemis étourdis.', mods: { stunDmg: 60 } },
    { id: 'r_fiel', name: 'Fiole de fiel', icon: '🧪', desc: '+30 % dégâts aux ennemis qui brûlent, saignent ou sont empoisonnés.', mods: { statusDmg: 30 } },
    { id: 'r_metronome', name: 'Métronome fêlé', icon: '🎼', desc: 'Pouvoirs rechargés 10 % plus vite, ultime chargé 30 % plus vite.', mods: { cdr: 10, ultP: 30 } }
  ];

  // ---------- Autel des Cendres (améliorations permanentes) ----------
  var META = [
    { id: 'm_force', name: 'Force', icon: '⚔️', desc: '+5 % attaque', max: 999, cost: 15, grow: 1.2, mods: { atkP: 5 } },
    { id: 'm_vigueur', name: 'Vigueur', icon: '❤️', desc: '+5 % PV', max: 999, cost: 15, grow: 1.2, mods: { hpP: 5 } },
    { id: 'm_peau', name: 'Peau de fer', icon: '🛡️', desc: '+5 % armure', max: 999, cost: 12, grow: 1.2, mods: { defP: 5 } },
    { id: 'm_precision', name: 'Précision', icon: '🎯', desc: '+1 % critique', max: 25, cost: 30, grow: 1.3, mods: { crit: 1 } },
    { id: 'm_cruaute', name: 'Cruauté', icon: '🩸', desc: '+5 % dégâts critiques', max: 40, cost: 30, grow: 1.25, mods: { critd: 5 } },
    { id: 'm_avarice', name: 'Avarice', icon: '💰', desc: "+8 % d'or et de Cendres", max: 50, cost: 25, grow: 1.25, mods: { gf: 8 } },
    { id: 'm_fortune', name: 'Fortune', icon: '🍀', desc: '+5 % chance de butin rare', max: 40, cost: 40, grow: 1.28, mods: { mf: 5 } },
    { id: 'm_sagesse', name: 'Sagesse', icon: '📖', desc: "+6 % d'expérience", max: 30, cost: 30, grow: 1.28, mods: { xp: 6 } },
    { id: 'm_fioles', name: 'Fioles', icon: '🧪', desc: '+1 fiole de soin', max: 3, cost: 150, grow: 6, mods: { potions: 1 } },
    { id: 'm_heritage', name: 'Héritage', icon: '👛', desc: '+25 or au départ', max: 10, cost: 40, grow: 1.6, mods: { startGold: 25 } },
    { id: 'm_ossuaire', name: 'Ossuaire', icon: '⚱️', desc: "+20 % de Cendres hors-ligne", max: 50, cost: 50, grow: 1.3, mods: { idleP: 20 } },
    { id: 'm_reserve', name: 'Caveau', icon: '🕰️', desc: '+2 h de réserve hors-ligne', max: 8, cost: 200, grow: 2.2, mods: { idleH: 2 } },
    { id: 'm_relance', name: 'Présage', icon: '🎲', desc: "+1 relance d'aubaines par descente", max: 3, cost: 120, grow: 5, mods: { rerolls: 1 } },
    { id: 'm_depart', name: 'Baptême', icon: '🌒', desc: '+1 aubaine offerte au départ', max: 3, cost: 400, grow: 8, mods: { startBoons: 1 } }
  ];

  // ---------- Pactes (passifs à équiper au sanctuaire) ----------
  var PACTS = [
    { id: 'pa_sang', name: 'Pacte de sang', icon: '🩸', desc: '+25 % attaque, -12 % PV.', mods: { atkP: 25, hpP: -12 }, how: 'Vaincre Le Fossoyeur' },
    { id: 'pa_fer', name: 'Serment de fer', icon: '⛓️', desc: '+35 % armure, +10 % PV.', mods: { defP: 35, hpP: 10 }, how: 'Mourir 5 fois' },
    { id: 'pa_voleur', name: 'Marque du voleur', icon: '🗝️', desc: '+30 % or et Cendres, +20 % butin rare.', mods: { gf: 30, mf: 20 }, how: 'Ouvrir 10 coffres' },
    { id: 'pa_soif', name: 'Soif éternelle', icon: '🧛', desc: '+6 % vol de vie.', mods: { ls: 6 }, how: 'Vaincre La Mère des Ronces' },
    { id: 'pa_fureur', name: 'Fureur ancienne', icon: '🥁', desc: "+18 % vitesse d'attaque.", mods: { spdP: 18 }, how: 'Tuer 500 ennemis' },
    { id: 'pa_bourreau', name: 'Rite du bourreau', icon: '⚰️', desc: '+8 % critique, +30 % dégâts critiques.', mods: { crit: 8, critd: 30 }, how: 'Vaincre Le Léviathan fangeux' },
    { id: 'pa_presage', name: 'Œil du présage', icon: '👁️', desc: '+1 choix à chaque aubaine.', mods: { boonChoices: 1 }, how: 'Atteindre le niveau 15 dans une descente' },
    { id: 'pa_maitre', name: "Maître d'armes", icon: '⏳', desc: 'Pouvoirs rechargés 18 % plus vite, +20 % puissance.', mods: { cdr: 18, pow: 20 }, how: "Vaincre L'Évêque sans visage" },
    { id: 'pa_cendre', name: 'Cœur de cendre', icon: '🕊️', desc: 'Une résurrection par descente.', mods: { revive: 1 }, how: 'Vaincre Le Seigneur des Braises' },
    { id: 'pa_fossoyeur', name: 'Pacte du fossoyeur', icon: '⚱️', desc: '+60 % or et Cendres, mais ennemis +15 % PV.', mods: { gf: 60, enemyHpP: 15 }, how: 'Trouver un objet légendaire' },
    { id: 'pa_creux', name: 'Bénédiction creuse', icon: '👑', desc: '+12 % à toutes les stats.', mods: { allP: 12 }, how: 'Vaincre Le Roi Creux' },
    { id: 'pa_duel', name: 'Voie du duelliste', icon: '🤺', desc: 'Parade : riposte +100 %. Points faibles : +60 % dégâts.', mods: { parryP: 100, weakP: 60 }, how: 'Réussir 30 parades parfaites' },
    { id: 'pa_arene', name: "Champion de l'arène", icon: '🏟️', desc: '+12 % dégâts infligés.', mods: { dmgP: 12 }, how: 'Gagner 5 arènes' },
    { id: 'pa_alchimie', name: "Sang d'alchimiste", icon: '⚗️', desc: '+1 fiole et +30 % soins reçus.', mods: { potions: 1, healP: 30 }, how: 'Fusionner des objets 25 fois' },
    { id: 'pa_relique', name: 'Faveur du pendu', icon: '🎁', desc: 'Commence chaque descente avec un artefact au hasard.', mods: { startArtifact: 1 }, how: 'Trouver un objet unique' }
  ];

  // ---------- Hauts faits ----------
  // c = [clé de statistique, valeur à atteindre]
  var ACHIEVEMENTS = [
    { id: 'h_boss1', name: 'Premier sang', desc: 'Vaincre Le Fossoyeur', c: ['boss1', 1], cendres: 100, pact: 'pa_sang' },
    { id: 'h_boss2', name: 'Bûcheron', desc: 'Vaincre La Mère des Ronces', c: ['boss2', 1], cendres: 300, pact: 'pa_soif' },
    { id: 'h_boss3', name: 'Pêche au gros', desc: 'Vaincre Le Léviathan fangeux', c: ['boss3', 1], cendres: 800, pact: 'pa_bourreau' },
    { id: 'h_boss4', name: 'Hérétique', desc: "Vaincre L'Évêque sans visage", c: ['boss4', 1], cendres: 2000, pact: 'pa_maitre' },
    { id: 'h_boss5', name: 'Trempé au feu', desc: 'Vaincre Le Seigneur des Braises', c: ['boss5', 1], cendres: 5000, pact: 'pa_cendre' },
    { id: 'h_boss6', name: 'Régicide', desc: 'Vaincre Le Roi Creux', c: ['boss6', 1], cendres: 15000, pact: 'pa_creux' },
    { id: 'h_mort5', name: 'Têtu', desc: 'Mourir 5 fois', c: ['deaths', 5], cendres: 80, pact: 'pa_fer' },
    { id: 'h_coffre', name: 'Pilleur de tombes', desc: 'Ouvrir 10 coffres', c: ['chests', 10], cendres: 150, pact: 'pa_voleur' },
    { id: 'h_kill500', name: 'Faucheur', desc: 'Tuer 500 ennemis', c: ['kills', 500], cendres: 400, pact: 'pa_fureur' },
    { id: 'h_lvl15', name: 'Élu', desc: 'Atteindre le niveau 15 dans une descente', c: ['maxLvl', 15], cendres: 300, pact: 'pa_presage' },
    { id: 'h_leg', name: 'Lueur orange', desc: 'Trouver un objet légendaire', c: ['leg', 1], cendres: 500, pact: 'pa_fossoyeur' },
    { id: 'h_uni', name: 'Lueur rouge', desc: 'Trouver un objet unique', c: ['uni', 1], cendres: 1500, pact: 'pa_relique' },
    { id: 'h_parry', name: 'Mur vivant', desc: 'Réussir 30 parades parfaites', c: ['parry', 30], cendres: 600, pact: 'pa_duel' },
    { id: 'h_arene', name: 'Gladiateur', desc: 'Gagner 5 arènes', c: ['arenes', 5], cendres: 800, pact: 'pa_arene' },
    { id: 'h_fusion2', name: 'Grand œuvre', desc: 'Fusionner des objets 25 fois', c: ['fusions', 25], cendres: 1200, pact: 'pa_alchimie' },
    { id: 'h_weak', name: 'Œil de lynx', desc: 'Toucher 100 points faibles', c: ['weak', 100], cendres: 500 },
    { id: 'h_kill100', name: 'Chasseur', desc: 'Tuer 100 ennemis', c: ['kills', 100], cendres: 60 },
    { id: 'h_kill2k', name: 'Fléau', desc: 'Tuer 2 000 ennemis', c: ['kills', 2000], cendres: 1500 },
    { id: 'h_kill10k', name: 'Extinction', desc: 'Tuer 10 000 ennemis', c: ['kills', 10000], cendres: 10000 },
    { id: 'h_et5', name: 'Premiers pas', desc: "Atteindre l'étage 5", c: ['best', 5], cendres: 40 },
    { id: 'h_et25', name: 'Explorateur', desc: "Atteindre l'étage 25", c: ['best', 25], cendres: 600 },
    { id: 'h_et45', name: 'Sans retour', desc: "Atteindre l'étage 45", c: ['best', 45], cendres: 3000 },
    { id: 'h_et75', name: "Enfant de l'Abîme", desc: "Atteindre l'étage 75", c: ['best', 75], cendres: 20000 },
    { id: 'h_et120', name: 'Au-delà', desc: "Atteindre l'étage 120", c: ['best', 120], cendres: 100000 },
    { id: 'h_elite', name: "Tueur d'élites", desc: 'Vaincre 25 élites', c: ['elites', 25], cendres: 500 },
    { id: 'h_fusion', name: 'Alchimiste', desc: 'Fusionner des objets 10 fois', c: ['fusions', 10], cendres: 400 },
    { id: 'h_forge', name: 'Forgeron', desc: 'Améliorer des objets 20 fois', c: ['upgrades', 20], cendres: 300 },
    { id: 'h_epic', name: 'Lueur violette', desc: 'Trouver 10 objets épiques', c: ['epic', 10], cendres: 400 },
    { id: 'h_runs', name: 'Habitué', desc: 'Lancer 25 descentes', c: ['runs', 25], cendres: 500 },
    { id: 'h_heros', name: 'Compagnie maudite', desc: 'Débloquer tous les héros', c: ['heroes', 8], cendres: 5000 },
    { id: 'h_evo', name: 'Éveillé', desc: 'Choisir 10 éveils de pouvoir', c: ['evos', 10], cendres: 300 },
    { id: 'h_evo2', name: 'Grand maître', desc: 'Choisir 60 éveils de pouvoir', c: ['evos', 60], cendres: 3000 },
    { id: 'h_orbs', name: 'Glaneur', desc: 'Ramasser 100 orbes', c: ['orbs', 100], cendres: 400 },
    { id: 'h_deflect', name: 'Retour à l’envoyeur', desc: 'Renvoyer 50 projectiles', c: ['deflect', 50], cendres: 600 },
    { id: 'h_minis', name: 'Doigts d’or', desc: 'Réussir 15 épreuves (forge, runes, crochetage)', c: ['minis', 15], cendres: 800 },
    { id: 'h_dbl', name: 'Veinard', desc: 'Former 50 figures sur la table de dés', c: ['doubles', 50], cendres: 500 },
    { id: 'h_score', name: 'Légende', desc: 'Atteindre 300 de score en une descente', c: ['bestScore', 300], cendres: 1500 },
    { id: 'h_primes', name: 'Chasseur de primes', desc: 'Remplir 30 primes', c: ['primes', 30], cendres: 1000 }
  ];

  // ---------- Événements ----------
  var EVENTS = [
    { id: 'e_puits', title: 'Le puits qui murmure', text: 'Une voix monte du fond. Elle connaît ton nom.',
      opts: [{ t: 'Jeter 40 or', need: { gold: 40 }, fx: { gold: -40, boon: 1 }, r: 'Le puits te rend une aubaine.' },
        { t: 'Boire son eau', fx: { healPct: 35, curse: 'takenP', curseV: 6 }, r: "+35 % PV... mais l'eau était noire (+6 % dégâts subis)." },
        { t: 'Passer ton chemin', fx: {}, r: 'La voix rit derrière toi.' }] },
    { id: 'e_pendu', title: "L'homme pendu", text: "Il se balance encore. Ses poches sont pleines.",
      opts: [{ t: 'Fouiller ses poches', fx: { gold: 60, hpPct: -12 }, r: '+60 or. Il te griffe en se réveillant (-12 % PV).' },
        { t: 'Le décrocher', fx: { boon: 1, hpPct: -6 }, r: 'Reconnaissant, son fantôme te bénit.' },
        { t: 'Partir', fx: {}, r: 'La corde grince.' }] },
    { id: 'e_statue', title: 'La sainte sans mains', text: 'Une statue pleure du sang dans une coupe.',
      opts: [{ t: 'Boire la coupe', fx: { maxHpP: 10, healPct: 15 }, r: '+10 % PV max pour cette descente.' },
        { t: 'Tremper ta lame', fx: { atkP: 10 }, r: '+10 % attaque pour cette descente.' },
        { t: 'Prier', fx: { healPct: 30 }, r: 'Tu te sens mieux (+30 % PV).' }] },
    { id: 'e_joueur', title: 'Le joueur de dés', text: 'Un squelette en haillons secoue un gobelet. « Double ou rien ? »',
      opts: [{ t: 'Parier la moitié de ton or', fx: { gamble: 1 }, r: '' },
        { t: 'Refuser', fx: {}, r: 'Il hausse ses épaules. Enfin, ce qu’il en reste.' }] },
    { id: 'e_forge', title: 'La forge abandonnée', text: 'Les braises sont encore chaudes. Un marteau t’attend.',
      opts: [{ t: 'Forger (-10 % PV)', fx: { hpPct: -10, item: 2 }, r: 'Tu repars avec une pièce de qualité.' },
        { t: 'Te réchauffer', fx: { healPct: 20 }, r: '+20 % PV.' }] },
    { id: 'e_marche', title: "Le marché des âmes", text: 'Une ombre te tend un contrat. « Un peu de toi contre beaucoup de moi. »',
      opts: [{ t: 'Signer (-20 % PV max)', fx: { maxHpP: -20, artifact: 1 }, r: 'Un artefact apparaît dans ta main.' },
        { t: 'Déchirer le contrat', fx: { gold: 25 }, r: 'Des pièces tombent du papier.' }] },
    { id: 'e_miroir', title: 'Le miroir fêlé', text: 'Ton reflet ne bouge pas en même temps que toi. Il te tend la main.',
      opts: [{ t: 'Lui serrer la main', fx: { boon: 1, curse: 'takenP', curseV: 5 }, r: 'Il te donne une aubaine... et garde un peu de toi (+5 % dégâts subis).' },
        { t: 'Briser le miroir', fx: { gold: 45 }, r: 'Sept ans de malheur. Et 45 or dans le cadre.' },
        { t: 'Détourner les yeux', fx: {}, r: 'Il te regarde partir.' }] },
    { id: 'e_enfant', title: "L'enfant qui chante", text: 'Une petite voix fredonne dans le noir. Il n’y a pas d’enfants ici.',
      opts: [{ t: 'Lui donner 30 or', need: { gold: 30 }, fx: { gold: -30, healPct: 50 }, r: 'La chanson te répare (+50 % PV).' },
        { t: 'Suivre la voix', fx: { ambush: 1 }, r: '' },
        { t: 'Boucher tes oreilles', fx: {}, r: 'La chanson s’arrête net.' }] },
    { id: 'e_alchimiste', title: "L'alchimiste aveugle", text: '« Rouge ou verte ? Je ne sais plus laquelle tue. »',
      opts: [{ t: 'Boire la rouge', fx: { atkP: 12, hpPct: -15 }, r: 'Tes veines brûlent : +12 % attaque, -15 % PV.' },
        { t: 'Boire la verte', fx: { maxHpP: 12 }, r: 'Ta peau durcit : +12 % PV max.' },
        { t: 'Refuser poliment', fx: {}, r: '« Sage. Ou lâche. »' }] },
    { id: 'e_biblio', title: 'La bibliothèque noyée', text: 'Des livres gonflés d’eau. Un seul est sec. Un autre est en or.',
      opts: [{ t: 'Lire le livre sec', fx: { boon: 1, hpPct: -8 }, r: 'Les mots te blessent, mais tu apprends une aubaine.' },
        { t: 'Voler le livre en or', fx: { gold: 70, curse: 'takenP', curseV: 4 }, r: '+70 or. Quelque chose a remarqué (+4 % dégâts subis).' },
        { t: 'Ne toucher à rien', fx: {}, r: 'Les pages se tournent toutes seules derrière toi.' }] },
    { id: 'e_cranes', title: 'Le mur de crânes', text: 'L’un d’eux claque des dents. « Une pièce pour un mort ? »',
      opts: [{ t: 'Lui donner 50 or', need: { gold: 50 }, fx: { gold: -50, artifact: 1 }, r: 'Il crache un artefact.' },
        { t: 'Lui arracher une dent', fx: { item: 2, hpPct: -10 }, r: 'Il te mord (-10 % PV), mais sa dent valait le coup.' },
        { t: 'Passer', fx: {}, r: 'Mille orbites te suivent.' }] },
    { id: 'e_mourant', title: 'Le chevalier mourant', text: 'Adossé au mur, il tient encore son épée. « Finis-en. Ou aide-moi. »',
      opts: [{ t: 'Abréger ses souffrances', fx: { cendres: 1 }, r: 'Il te remercie d’un souffle.' },
        { t: 'Panser ses plaies', fx: { hpPct: -12, boon: 1 }, r: 'Tu y laisses de tes forces. Il t’enseigne une aubaine.' },
        { t: 'Prendre son équipement', fx: { item: 1 }, r: 'Il ne proteste pas longtemps.' }] },
    { id: 'e_tombe', title: 'La tombe ouverte', text: 'Quelqu’un a creusé ici il y a peu. Ou quelque chose en est sorti.',
      opts: [{ t: 'Descendre fouiller', fx: { ambush: 1 }, r: '' },
        { t: 'Reboucher par respect', fx: { cendres: 1 }, r: 'Les morts te remercient en Cendres.' }] },
    { id: 'e_maitre', title: 'Le maître d’armes', text: 'Un fantôme en armure répète le même geste depuis cent ans. Il s’arrête et te regarde.',
      opts: [{ t: 'S’entraîner avec lui (-15 % PV)', fx: { hpPct: -15, evo: 1 }, r: 'Il te corrige à coups de plat de lame. Un de tes pouvoirs s’éveille.' },
        { t: 'Lui payer une leçon (60 or)', need: { gold: 60 }, fx: { gold: -60, boon: 1 }, r: 'Il t’enseigne une aubaine.' },
        { t: 'Saluer et passer', fx: {}, r: 'Il reprend son geste.' }] },
    { id: 'e_fontaine', title: 'La fontaine à l’envers', text: 'L’eau coule vers le plafond. Au fond du bassin, quelque chose brille.',
      opts: [{ t: 'Boire', fx: { healPct: 40 }, r: 'Elle a un goût de pluie. +40 % PV.' },
        { t: 'Plonger le bras', fx: { hpPct: -10, artifact: 1 }, r: 'Ça mord (-10 % PV), mais tu ressors quelque chose.' },
        { t: 'Remplir une fiole', fx: { potion: 1 }, r: '+1 fiole.' }] },
    { id: 'e_ossements', title: 'Le tas d’ossements', text: 'Des os bien rangés, par taille. Quelqu’un tient à l’ordre, ici.',
      opts: [{ t: 'Fouiller sans rien ranger', fx: { item: 2, curse: 'takenP', curseV: 4 }, r: 'Tu trouves un objet. Quelqu’un est vexé (+4 % dégâts subis).' },
        { t: 'Ranger les os tombés', fx: { cendres: 1, healPct: 10 }, r: 'Un merci glacé te traverse (+10 % PV).' },
        { t: 'Passer', fx: {}, r: 'Rien ne bouge.' }] }
  ];

  var ROOMS = {
    combat: { name: 'Combat', icon: '⚔️', hint: 'Monstres, butin, expérience' },
    elite: { name: 'Élite', icon: '👹', hint: 'Dangereux. Artefact + meilleur butin' },
    tresor: { name: 'Trésor', icon: '🧰', hint: 'Un coffre... en principe' },
    marchand: { name: 'Marchand', icon: '⚖️', hint: 'Dépense ton or' },
    repos: { name: 'Feu de camp', icon: '🔥', hint: 'Soigne-toi ou affûte ta lame' },
    autel: { name: 'Autel maudit', icon: '🩸', hint: 'Un pouvoir contre un prix' },
    event: { name: 'Mystère', icon: '❓', hint: 'Qui sait ?' },
    mercenaire: { name: 'Mercenaires', icon: '🤝', hint: "Un allié jusqu'au boss" },
    arene: { name: 'Arène', icon: '🏟️', hint: '3 vagues. Grosse récompense' },
    start: { name: 'Départ', icon: '🚩', hint: 'L’entrée de la zone' },
    bourse: { name: 'Bourse', icon: '💰', hint: 'Un peu d’or, et tu rejoues' },
    piege: { name: 'Piège', icon: '🕳️', hint: '-10 % PV, et tu rejoues' },
    fontaine: { name: 'Fontaine', icon: '⛲', hint: '+15 % PV, et tu rejoues' },
    forge: { name: 'Forge', icon: '⚒️', hint: 'Frappe juste : plus d’attaque' },
    runes: { name: 'Runes', icon: '🔮', hint: 'Retiens la suite. Soin, aubaine, éveil' },
    roue: { name: 'Roue du destin', icon: '🎡', hint: 'Un tour gratuit. Ou pire' },
    boss: { name: 'BOSS', icon: '☠️', hint: 'Le gardien de la zone' }
  };

  var ALTARS = [
    { name: 'Offrande de chair', desc: '+30 % attaque, -15 % PV max.', mods: { atkP: 30, hpP: -15 } },
    { name: 'Offrande de fer', desc: '+30 % PV max, -10 % vitesse.', mods: { hpP: 30, spdP: -10 } },
    { name: 'Offrande de hâte', desc: '+20 % vitesse, +10 % dégâts subis.', mods: { spdP: 20, takenP: 10 } },
    { name: "Offrande d'or", desc: '+80 % or et butin rare, ennemis +12 % PV.', mods: { gf: 80, mf: 40, enemyHpP: 12 } },
    { name: 'Offrande de sang', desc: '+10 % vol de vie, -25 % soins reçus.', mods: { ls: 10, healP: -25 } },
    { name: 'Offrande de rage', desc: '+15 % critique, +40 % dégâts critiques, -20 % armure.', mods: { crit: 15, critd: 40, defP: -20 } }
  ];

  // Le jeu se joue au tour par tour : 1 tour = 2 secondes de l'ancien temps réel.
  // Les textes ci-dessus sont écrits en secondes ; on les traduit en tours une fois pour toutes ici.
  function nb(x) { return parseFloat(String(x).replace(',', '.')); }
  function fr(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }
  function tours(sec) { var n = Math.max(1, Math.ceil(nb(sec) / 2 - 1e-9)); return n + ' tour' + (n > 1 ? 's' : ''); }
  function toTurns(t) {
    return t.replace(/(\d+(?:,\d+)?) %( PV| de ton attaque)? par seconde/g, function (m, n, w) { return fr(nb(n) * 2) + ' %' + (w || '') + ' par tour'; })
      .replace(/chaque seconde/g, 'à chaque tour').replace(/en moins de (\d+) secondes/g, function (m, n) { return 'en moins de ' + tours(n); })
      .replace(/([Tt])outes les (\d+(?:,\d+)?) s\b/g, function (m, c, n) { return c + 'ous les ' + tours(n); })
      .replace(/(\d+(?:,\d+)?) s(?![\wà-ÿ’'])/g, function (m, n) { return tours(n); });
  }
  function conv(o, depth) {
    if (!o || typeof o !== 'object' || depth > 8) return;
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (typeof v === 'string') { if (k !== 'id' && k !== 'sfx' && k !== 'icon') o[k] = toTurns(v); }
      else if (typeof v === 'function') o[k] = function () { var r = v.apply(this, arguments); return typeof r === 'string' ? toTurns(r) : r; };
      else conv(v, depth + 1);
    });
  }
  var OUT = {
    RARITIES: RARITIES, MODS: MODS, HEROES: HEROES, ENEMIES: ENEMIES, ZONES: ZONES, SLOTS: SLOTS, BASES: BASES,
    SETS: SETS, OMENS: OMENS, TALENTS: TALENTS, FAMILIARS: FAMILIARS, MOBFIX: MOBFIX, CONDS: CONDS, ALLIES: ALLIES, CONTRACTS: CONTRACTS, AFFIXES: AFFIXES, POWERS: POWERS, UNIQUES: UNIQUES, BOONS: BOONS, ARTIFACTS: ARTIFACTS, META: META,
    PACTS: PACTS, ACHIEVEMENTS: ACHIEVEMENTS, EVENTS: EVENTS, ROOMS: ROOMS, PRIMES: PRIMES, WHEEL: WHEEL, ALTARS: ALTARS,
    AB_INFO: AB_INFO, GLOSS: GLOSS, NEEDS: NEEDS, DICE: DICE, BAGS: BAGS, FIGS: FIGS, VERSION: VERSION, NEWS: NEWS
  }
  conv(OUT, 0);
  return OUT;
})();
if (typeof module !== 'undefined') module.exports = DATA;
