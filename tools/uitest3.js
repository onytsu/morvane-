// Captures des écrans v1.6 : familiers, offrande du jour, présentation de zone, fin, bilan de partie.
// node tools/uitest3.js <dossier node_modules contenant puppeteer-core> <dossier de sortie>
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const MOD = process.argv[2], OUT = process.argv[3]; const puppeteer = require(path.join(MOD, 'puppeteer-core'));
const ROOT = path.join(__dirname, '..'); const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8380);
const sleep = ms => new Promise(r => setTimeout(r, ms)); let edge = null;
(async () => {
  edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9336', '--user-data-dir=' + path.join(OUT, 'edge-profile-' + Date.now()), '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let browser; for (let i = 0; i < 40 && !browser; i++) { await sleep(500); try { browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9336' }); } catch (e) { } }
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://127.0.0.1:8380/index.html'); await sleep(700);
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const res = {};
  await page.evaluate(() => { const S = ENGINE.S; ['hub', 'skill', 'help_chevalier', 'charge', 'potion', 'weak', 'fix'].forEach(k => S.tuto[k] = 1); S.stats.runs = 6; S.stats.best = 24; S.stats.bossMax = 2; S.heroes.chevalier.lvl = 4; S.meta.m_force = 60; S.meta.m_vigueur = 60; S.codex = { rat: 55, squelette: 80, corbeau: 12, spectre: 40 }; ENGINE.setFam('f_squelette'); UI.hub('hero'); });
  await sleep(600); await shot('1-sanctuaire-offrande-familier');
  res.daily = await page.evaluate(() => { const c = ENGINE.S.cendres; document.querySelector('[data-act=daily]').click(); return { gained: ENGINE.S.cendres - c, still: !!document.querySelector('[data-act=daily]') }; });
  await page.evaluate(() => UI.hub('pactes')); await sleep(300); await page.evaluate(() => { const c = document.querySelector('#content'); c.scrollTop = c.scrollHeight; }); await sleep(300); await shot('2-familiers');
  res.famPick = await page.evaluate(() => { document.querySelector('[data-act=fam][data-id=f_rat]').click(); return ENGINE.S.fam; });
  // présentation de zone : descente en zone 2
  await page.evaluate(() => { ENGINE.startRun('chevalier', 2); UI.run.show(); }); await sleep(1200); await shot('3-presentation-zone');
  res.zoneModal = await page.evaluate(() => !!document.querySelector('#modal.on')); await page.evaluate(() => UI.closeModal()); await sleep(1500); await shot('4-combat-familier');
  // fin du jeu : victoire contre le Roi Creux
  await page.evaluate(() => { const S = ENGINE.S, run = S.run; S.stats.bossMax = 5; S.settings.auto = true; S.settings.speed = 3; S.tuto.zone6 = 1; S.meta.m_force = 3000; S.meta.m_vigueur = 6000; S.meta.m_peau = 3000; run.floor = 60; run.room = { type: 'boss', group: ['roi_creux'] }; ENGINE.recalc(run); run.hp = run.stats.hp; run.phase = 'combat'; ENGINE._buildCombat(run); run.combat.enemies[0].hp = 1; run.combat.enemies[0].t = 99; UI.run.show(); });
  for (let i = 0; i < 100; i++) { await sleep(400); const ph = await page.evaluate(() => ENGINE.S.run ? ENGINE.S.run.phase : 'none'); if (ph !== 'combat') { res.bossEnd = ph; break; } }
  await sleep(3200); await shot('5-fin');
  res.ending = await page.evaluate(() => ({ modal: !!document.querySelector('#modal.on'), ending: ENGINE.S.run && ENGINE.S.run.result && !!ENGINE.S.run.result.ending, bossMax: ENGINE.S.stats.bossMax }));
  await page.evaluate(() => { UI.closeModal(); UI.run.end(true); }); await sleep(900); await shot('6-bilan');
  console.log(JSON.stringify({ res, errors: errors.slice(0, 8) }, null, 1)); await browser.close(); edge.kill(); srv.close(); process.exit(0);
})().catch(e => { console.error('TEST FAIL', e); try { if (edge) edge.kill(); } catch (x) { } process.exit(1); });
