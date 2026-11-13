// Robot de test : joue N descentes à la suite sur un même compte et affiche la progression.
// (v3.0 : les combats sont joués tour par tour avec ENGINE.autoAct / ENGINE.foeStep)
// node tools/sim.js [descentes] [comptes] [hero|all]
const D = require('../js/data.js');
globalThis.DATA = D;
const E = require('../js/engine.js');
const RUNS = +process.argv[2] || 40, ACCOUNTS = +process.argv[3] || 3, HERO = process.argv[4] || 'best';

function playRun() {
  const S = E.S; S.settings.auto = true;
  const heroes = Object.keys(S.heroes);
  const hero = HERO === 'best' ? S.hero : HERO === 'all' ? heroes[S.stats.runs % heroes.length] : (S.heroes[HERO] ? HERO : S.hero);
  E.equipBest(hero);
  // repart de la zone la plus haute qui a déjà été bien dépassée
  let sz = Math.max(1, Math.min(E.maxStartZone(), Math.floor((S.stats.best - 1) / 10) - 0));
  const run = E.startRun(hero, sz);
  let guard = 0, simT = 0;
  while (S.run && guard++ < 200000) {
    const r = S.run;
    if (r.pendingEvos > 0) { E.chooseEvo(0); continue; }
    if (r.pendingBoons > 0) { if (!r.offer) E.makeOffer(r); let bi = 0, br = -1; r.offer.forEach((id, i) => { const b = E.boonById(id); const sc = b.rar + Math.random() * 0.8 + (b.mods.atkP || b.mods.hpP ? 0.4 : 0); if (sc > br) { br = sc; bi = i; } }); E.chooseBoon(bi); continue; }
    if (r.pendingDice > 0) { if (!r.diceOffer) E.makeDiceOffer(r); const ui = r.diceOffer.findIndex(o => o.k === 'up'); const li = r.bag.findIndex(d => d.t === 'lame' && d.f[5] < 9); if (r.bag.length >= 9 && ui >= 0 && li >= 0) E.chooseDie(ui, li); else E.chooseDie(0); continue; }
    if (r.phase === 'combat') { let n = 0; while (r.combat && !r.combat.over && n++ < 20000) { const c = r.combat; if (c.turn === 'hero') { if (!E.autoAct()) E.pass(); } else if (!E.foeStep()) simT += E.ROUND; c.events.length = 0; } if (r.combat && !r.combat.over) { r.hp = 0; r.phase = 'dead'; } continue; }
    if (r.phase === 'victory') { E.continueRun(); continue; }
    if (r.phase === 'doors') {
      const frac = r.hp / r.stats.hp; let ch = 0, best = -1;
      r.doors.forEach((t, i) => { let sc = { combat: 5, elite: frac > 0.7 ? 7 : 1, bourse: 6, fontaine: frac < 0.8 ? 7 : 4, piege: 0.5, tresor: 6, forge: 6, runes: 6, roue: 5, marchand: r.gold >= 70 ? 6 : 2, repos: frac < 0.6 ? 9 : 3, autel: 4, event: 5, boss: 9 }[t]; if (sc > best) { best = sc; ch = i; } });
      E.chooseDoor(ch); continue;
    }
    if (r.phase === 'room') {
      const t = r.room.type;
      if (t === 'tresor') E.roomAction('open');
      else if (t === 'marchand') { r.room.stock.forEach((s, i) => { if (s.kind === 'artifact' || s.kind === 'boon' || (s.kind === 'heal' && r.hp < r.stats.hp * 0.5) || s.kind === 'item') E.roomAction('buy', i); }); E.roomAction('leave'); }
      else if (t === 'repos') E.roomAction(r.hp < r.stats.hp * 0.65 ? 'heal' : 'sharpen');
      else if (t === 'autel') E.roomAction(Math.random() < 0.5 ? 'take' : 'skip', 0);
      else if (t === 'mercenaire') { if (E.roomAction('hire', 0) === false) E.roomAction('leave'); }
      else if (t === 'forge') E.roomAction('forge', 2 + Math.floor(Math.random() * 3));
      else if (t === 'runes') E.roomAction('runes', 1 + Math.floor(Math.random() * 2));
      else if (t === 'roue') { E.roomAction('spin'); E.roomAction('leave'); }
      else if (t === 'event') { const ev = E.byId(D.EVENTS, r.room.event); let i = Math.floor(Math.random() * ev.opts.length); if (E.roomAction('opt', i) === false) E.roomAction('opt', ev.opts.length - 1); }
      continue;
    }
    if (r.phase === 'dead') break;
  }
  const sum = E.endRun(false); sum.simT = simT; sum.startZone = sz;
  // entre deux descentes : s'équiper, forger, acheter
  E.collectIdle();
  D.HEROES.forEach(h => { if (E.canUnlock(h.id)) E.unlockHero(h.id); });
  E.equipBest(S.hero);
  E.salvageBelow(1);
  const eq = S.heroes[S.hero].equip;
  for (let k = 0; k < 30; k++) { let did = false; for (const sl in eq) { if (E.upgrade(eq[sl])) did = true; } if (!did) break; }
  for (let k = 0; k < 400; k++) {
    let best = null, bc = Infinity;
    D.META.forEach(m => { const c = E.metaCost(m.id); if (c != null && c < bc) { bc = c; best = m.id; } });
    if (!best || !E.buyMeta(best)) break;
  }
  for (let k = 0; k < 20 && E.talentPoints(S.hero) > 0; k++) { const tl = D.TALENTS[S.hero]; E.addTalent(S.hero, tl[Math.floor(Math.random() * tl.length)].id); }
  const hs = S.heroes[S.hero]; S.pacts.forEach(p => { if (hs.pacts.length < E.pactSlots(S.hero) && hs.pacts.indexOf(p) < 0) E.togglePact(p); });
  return sum;
}

const table = [];
for (let a = 0; a < ACCOUNTS; a++) {
  E._setStore(null); E.load();
  const rows = [];
  for (let i = 0; i < RUNS; i++) { const s = playRun(); rows.push(s); }
  table.push(rows);
  const S = E.S;
  console.log(`\n=== Compte ${a + 1} : record étage ${S.stats.best}, boss max zone ${S.stats.bossMax}, morts ${S.stats.deaths}, kills ${S.stats.kills}, cendres ${E.fmt(S.cendres)}, héros ${Object.keys(S.heroes).join(',')}`);
  console.log('objets trouvés', S.stats.items, 'épiques', S.stats.epic, 'légendaires', S.stats.leg, 'uniques', S.stats.uni, '| hauts faits', Object.keys(S.ach).length, '| méta', JSON.stringify(S.meta));
  console.log(rows.map((s, i) => `${i + 1}:${s.hero.slice(0, 3)} z${s.startZone} ét.${s.floor} niv${s.lvl} ${Math.round(s.simT)}s`).join(' | '));
}
console.log('\nMoyenne étage atteint par n° de descente :');
let line = '';
for (let i = 0; i < RUNS; i++) { let t = 0; table.forEach(r => t += r[i].floor); line += `${i + 1}:${(t / ACCOUNTS).toFixed(0)} `; }
console.log(line);
let tt = 0, n = 0; table.forEach(r => r.forEach(s => { tt += s.simT / Math.max(1, s.rooms); n++; }));
console.log('Durée moyenne par salle (s de jeu) :', (tt / n).toFixed(1));

let l5 = 0, lall = 0; table.forEach(r => r.forEach((x, i) => { lall += x.loot.length; if (i < 5) l5 += x.loot.length; }));
console.log('Objets par descente : 5 premières', (l5 / (5 * ACCOUNTS)).toFixed(1), '| toutes', (lall / (RUNS * ACCOUNTS)).toFixed(1));
