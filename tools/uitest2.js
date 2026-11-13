// Captures ciblées des nouveautés (préfixes, champion, horde, porteur d'or, arène, mercenaires, contrats).
// node tools/uitest2.js <dossier node_modules contenant puppeteer-core> <dossier de sortie>
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const MOD = process.argv[2], OUT = process.argv[3];
const puppeteer = require(path.join(MOD, 'puppeteer-core'));
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8378);
const sleep = ms => new Promise(r => setTimeout(r, ms)); let edge = null;
(async () => {
  edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless=new', '--remote-debugging-port=9334', '--user-data-dir=' + path.join(OUT, 'edge-profile-' + Date.now()), '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let browser; for (let i = 0; i < 40 && !browser; i++) { await sleep(500); try { browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9334' }); } catch (e) { } }
  const page = await browser.newPage(); const errors = [];
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8378/index.html'); await sleep(700);
  const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') });
  // prépare un compte avec un peu de progression, sans tutoriels
  await page.evaluate(() => { const S = ENGINE.S; ['skill', 'charge', 'potion', 'weak', 'ult', 'auto', 'fix', 'porteur', 'help_chevalier', 'hub', 'ult_chevalier', 'sk_k1', 'zone1', 'zone2'].forEach(k => S.tuto[k] = 1); S.stats.runs = 3; S.stats.best = 12; S.stats.bossMax = 1; S.cendres = 500; S.meta.m_force = 40; S.meta.m_vigueur = 40; S.meta.m_peau = 40; ENGINE.startRun('chevalier', 2); });
  const scene = async (name, room, extra, wait) => {
    await page.evaluate((room, extra) => { const S = ENGINE.S, run = S.run; run.hp = run.stats.hp; run.room = room; run.result = null; Object.assign(run, extra || {}); if (room.group) { run.phase = 'combat'; ENGINE._buildCombat(run); } else run.phase = 'room'; UI.run.show(); }, room, extra || {});
    await sleep(wait || 2600); await shot(name);
    return page.evaluate(() => { const r = ENGINE.S.run; return r ? r.phase : 'none'; });
  };
  const res = {};
  res.champion = await scene('1-champion-defi-allie', { type: 'combat', variant: 'champion', cond: 'defi', group: [{ k: 'loup', hp: 2.4, atk: 1.25, fix: 'geant', fix2: 'vamp', champ: 1 }] }, { ally: 'pyro' });
  res.horde = await scene('2-horde-prefixes', { type: 'combat', variant: 'horde', cond: 'sang', group: [{ k: 'loup', hp: 0.42, atk: 0.7 }, { k: 'araignee', hp: 0.42, atk: 0.7, fix: 'feu' }, { k: 'corbeau', hp: 0.42, atk: 0.7 }, { k: 'pendu', hp: 0.42, atk: 0.7, fix: 'toxique' }, { k: 'loup', hp: 0.42, atk: 0.7, fix: 'spectral' }] }, { ally: null });
  res.porteur = await scene('3-porteur-or', { type: 'combat', variant: 'porteur', group: [{ k: 'rat', hp: 3.2, atk: 0.3, flee: 12, gold: 1 }, 'araignee'] }, {});
  // arène : laisser tourner jusqu'à la vague 2
  await page.evaluate(() => { ENGINE.S.settings.auto = true; ENGINE.S.settings.speed = 3; });
  res.arene1 = await scene('4-arene-vague1', { type: 'arene', waves: 3, wave: 1, group: ['loup', 'corbeau'] }, {}, 1500);
  for (let i = 0; i < 60; i++) { await sleep(400); const w = await page.evaluate(() => ENGINE.S.run && ENGINE.S.run.room.wave); if (w >= 2) break; }
  await sleep(900); await shot('5-arene-vague2');
  for (let i = 0; i < 120; i++) { await sleep(400); const ph = await page.evaluate(() => ENGINE.S.run ? ENGINE.S.run.phase : 'none'); if (ph !== 'combat') { res.areneEnd = ph; break; } }
  await sleep(1400); await shot('6-arene-victoire');
  res.areneResult = await page.evaluate(() => { const r = ENGINE.S.run; return r && r.result ? { arene: !!r.result.arene, artifact: !!r.result.artifact, items: r.result.items.length, pendingBoons: r.pendingBoons, wave: r.room.wave } : null; });
  await page.evaluate(() => { ENGINE.S.settings.auto = false; ENGINE.S.settings.speed = 1; ENGINE.S.run.gold = 120; ENGINE.S.run.pendingBoons = 0; ENGINE.S.run.offer = null; });
  res.merc = await scene('7-mercenaires', { type: 'mercenaire', mercs: ['pyro', 'assassin'], price: 45 }, {}, 900);
  res.hire = await page.evaluate(() => { document.querySelector('[data-act=room][data-a=hire]').click(); const r = ENGINE.S.run; return { ally: r.ally, gold: r.gold, phase: r.phase }; });
  await sleep(500);
  // contrats : en remplir un et le réclamer
  await page.evaluate(() => { ENGINE.endRun(true); const cs = ENGINE.contracts(); ENGINE.S.stats[cs[0].stat] += cs[0].need; UI.hub('hero'); });
  await sleep(700); await shot('8-contrats');
  res.contract = await page.evaluate(() => { const before = ENGINE.S.cendres; const b = document.querySelector('[data-act=contract]:not(.off)'); if (b) b.click(); return { clicked: !!b, gained: ENGINE.S.cendres - before, claimed: ENGINE.contracts()[0].claimed }; });
  // fusion : 3 objets communs -> 1 rare
  await page.evaluate(() => { const S = ENGINE.S; for (let i = 0; i < 4; i++) S.inv.push(ENGINE.makeItem(8 + i, 1, { slot: ['arme', 'casque', 'bottes', 'anneau'][i], set: i < 2 ? 'set_corbeau' : null })); S.inv.push(ENGINE.makeItem(9, 2, {})); UI.hub('sac'); });
  await sleep(300); await page.evaluate(() => document.querySelector('[data-act=fuseMenu]').click()); await sleep(300);
  res.fusePicks = await page.evaluate(() => { const ts = [...document.querySelectorAll('#modal .inv-grid .item.r1')].slice(0, 3); ts.forEach(t => document.querySelector('#modal .inv-grid .item[data-uid="' + t.dataset.uid + '"]').click()); return UI.st.fuse.length; });
  await sleep(300); await shot('9-fusion-choix');
  res.fuse = await page.evaluate(() => { const n = ENGINE.S.inv.length, pv = ENGINE.fusePreview(UI.st.fuse); document.querySelector('[data-act=fuseDo]').click(); const it = ENGINE.S.inv[ENGINE.S.inv.length - 1]; return { before: n, after: ENGINE.S.inv.length, preview: pv, result: { rar: it.rar, ilvl: it.ilvl, set: it.set || null, name: ENGINE.itemName(it) }, fusions: ENGINE.S.stats.fusions }; });
  await sleep(500); await shot('10-fusion-resultat');
  // fiche d'aide en combat
  await page.evaluate(() => { UI.closeModal(); ENGINE.startRun('chevalier', 1); UI.run.show(); });
  await sleep(900); await page.evaluate(() => document.querySelector('[data-act=help]').click()); await sleep(400); await shot('11-aide-combat');
  console.log(JSON.stringify({ res, errors: errors.slice(0, 10) }, null, 1));
  await browser.close(); edge.kill(); srv.close(); process.exit(0);
})().catch(e => { console.error("TEST FAIL", e); try { if (edge) edge.kill(); } catch (x) { } process.exit(1); });
