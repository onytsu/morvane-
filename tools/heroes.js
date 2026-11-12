// Compare les héros : chacun joue N descentes sur un compte neuf (mêmes règles que sim.js)
const D = require('../js/data.js'); globalThis.DATA = D; const E = require('../js/engine.js');
const N = +process.argv[2] || 12, ACC = +process.argv[3] || 4;
function play(hero) {
  const S = E.S; S.settings.auto = true; E.equipBest(hero);
  E.startRun(hero, Math.max(1, Math.min(E.maxStartZone(), Math.floor((S.stats.best - 1) / 10))));
  let g = 0;
  while (S.run && g++ < 100000) { const r = S.run;
    if (r.pendingBoons > 0) { if (!r.offer) E.makeOffer(r); E.chooseBoon(Math.floor(Math.random() * r.offer.length)); continue; }
    if (r.phase === 'combat') { let n = 0; while (r.combat && !r.combat.over && n++ < 20000) { E.tick(0.1); r.combat.events.length = 0; } if (r.combat && !r.combat.over) { r.phase = 'dead'; } continue; }
    if (r.phase === 'victory') { E.continueRun(); continue; }
    if (r.phase === 'doors') { const f = r.hp / r.stats.hp; let i = r.doors.indexOf(f < 0.55 ? 'repos' : 'combat'); E.chooseDoor(i < 0 ? 0 : i); continue; }
    if (r.phase === 'room') { const t = r.room.type; if (t === 'tresor') E.roomAction('open'); else if (t === 'marchand') E.roomAction('leave'); else if (t === 'repos') E.roomAction('heal'); else if (t === 'autel') E.roomAction('skip'); else { const ev = E.byId(D.EVENTS, r.room.event); E.roomAction('opt', ev.opts.length - 1); } continue; }
    if (r.phase === 'dead') break; }
  const s = E.endRun(false); E.equipBest(hero); E.salvageBelow(0);
  for (let k = 0; k < 200; k++) { let b = null, bc = Infinity; D.META.forEach(m => { const c = E.metaCost(m.id); if (c != null && c < bc) { bc = c; b = m.id; } }); if (!b || !E.buyMeta(b)) break; }
  return s.floor;
}
D.HEROES.forEach(h => { const avg = Array(N).fill(0);
  for (let a = 0; a < ACC; a++) { E._setStore(null); E.load(); if (!E.S.heroes[h.id]) E.unlockHero(h.id, true); E.S.hero = h.id; E.S.heroes[h.id].lvl = 3; for (let i = 0; i < N; i++) avg[i] += play(h.id) / ACC; }
  console.log(h.id.padEnd(10), avg.map(x => String(Math.round(x)).padStart(3)).join(' ')); });
