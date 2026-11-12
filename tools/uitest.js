// Test dans un vrai navigateur (Edge sans fenêtre) : joue une partie en cliquant, prend des captures.
// node tools/uitest.js <dossier node_modules contenant puppeteer-core> <dossier de sortie> [scenario]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const MOD = process.argv[2], OUT = process.argv[3], SCEN = process.argv[4] || 'play';
const puppeteer = require(path.join(MOD, 'puppeteer-core'));
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8377);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const prof = path.join(OUT, 'edge-profile-' + Date.now());
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + prof, '--no-first-run', '--autoplay-policy=no-user-gesture-required', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let browser; for (let i = 0; i < 40 && !browser; i++) { await sleep(500); try { browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333' }); } catch (e) { } }
  const page = await browser.newPage(); const errors = [];
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8377/index.html'); await sleep(800);
  let n = 0; const shot = async name => { await page.screenshot({ path: path.join(OUT, String(++n).padStart(2, '0') + '-' + name + '.png') }); };
  const click = async sel => { const ok = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel); return ok; };
  const phase = () => page.evaluate(() => { const r = ENGINE.S.run; return r ? r.phase + (r.pendingBoons > 0 ? '+boon' : '') : UI.st.screen; });
  await shot('splash');
  await click('[data-act=enter]'); await sleep(400); await shot('intro');
  await click('[data-act=firstRun]'); await sleep(1500); await shot('combat1');
  await page.evaluate(() => { ENGINE.S.settings.speed = 3; });
  // boucle de jeu : clique comme un joueur
  let shots = {}, t0 = Date.now(), deaths = 0, maxDeaths = SCEN === 'long' ? 4 : 2;
  while (Date.now() - t0 < (SCEN === 'long' ? 240000 : 120000)) {
    const ph = await phase();
    if (!shots[ph] && ph !== 'combat') { shots[ph] = 1; await sleep(700); await shot(ph.replace('+', '-')); }
    if (ph === 'combat') { for (let i = 0; i < 3; i++) await click('#sk' + i + '.ready'); const low = await page.evaluate(() => ENGINE.S.run && ENGINE.S.run.hp / ENGINE.S.run.stats.hp < 0.4); if (low) await click('#pot'); if (!shots.midcombat && Date.now() - t0 > 6000) { shots.midcombat = 1; await shot('midcombat'); } const boss = await page.evaluate(() => ENGINE.S.run && ENGINE.S.run.room.type === 'boss'); if (boss && !shots.boss) { shots.boss = 1; await sleep(1200); await shot('boss'); } await sleep(120); }
    else if (ph.indexOf('victory') === 0) { await click('[data-act=cont]'); await sleep(150); }
    else if (ph.indexOf('+boon') > 0) { await click('[data-act=boon]'); await sleep(150); }
    else if (ph === 'doors') { const rt = await page.evaluate(() => ENGINE.S.run.doors.join(',')); const want = ['marchand', 'repos', 'autel', 'event', 'tresor', 'elite'].find(t => !shots['room:' + t] && rt.split(',').indexOf(t) >= 0); const idx = want ? rt.split(',').indexOf(want) : 0; if (want) shots['room:' + want] = 1; await click('[data-act=door][data-i="' + idx + '"]'); await sleep(250); const p2 = await phase(); if (p2 === 'room' && want) { await sleep(500); await shot('room-' + want); } }
    else if (ph === 'room') { if (!(await click('[data-act=room][data-a=open]')) && !(await click('[data-act=room][data-a=heal]')) && !(await click('[data-act=room][data-a=take]')) && !(await click('[data-act=room][data-a=opt]'))) { await click('[data-act=room][data-a=buy]:not(.off)'); await click('[data-act=room][data-a=leave]'); } await sleep(200); }
    else if (ph === 'death') { deaths++; await sleep(900); await shot('death' + deaths); if (deaths >= maxDeaths) break; await click('[data-act=deathBest]'); await sleep(200); await click('[data-act=again]'); await sleep(600); await page.evaluate(() => { ENGINE.S.settings.speed = 3; }); }
    else await sleep(200);
  }
  await click('[data-act=toHub]'); await sleep(600); await shot('hub-after');
  for (const t of ['hero', 'sac', 'autel', 'pactes', 'faits']) { await click('[data-act=tab][data-tab=' + t + ']'); await sleep(350); await shot('tab-' + t); }
  await click('[data-act=tab][data-tab=sac]'); await sleep(200); await click('.inv-grid .item'); await sleep(300); await shot('item-sheet'); await click('[data-act=close]');
  await click('[data-act=settings]'); await sleep(300); await shot('settings'); await click('[data-act=close]');
  // rechargement : la sauvegarde doit revenir
  const before = await page.evaluate(() => JSON.stringify([ENGINE.S.cendres, ENGINE.S.inv.length, ENGINE.S.stats.kills]));
  await page.reload(); await sleep(900);
  const after = await page.evaluate(() => JSON.stringify([ENGINE.S.cendres, ENGINE.S.inv.length, ENGINE.S.stats.kills]));
  const sw = await page.evaluate(async () => { if (!navigator.serviceWorker) return 'no sw'; const r = await navigator.serviceWorker.getRegistration(); return r ? 'sw ok' : 'sw none'; });
  // hors-ligne : couper le réseau et recharger
  await sleep(1500); await page.setOfflineMode(true); let offline = 'fail';
  try { await page.reload({ timeout: 8000 }); await sleep(800); offline = await page.evaluate(() => typeof ENGINE !== 'undefined' && !!document.querySelector('.splash') ? 'ok' : 'no app'); } catch (e) { offline = 'fail: ' + e.message; }
  await shot('offline-reload');
  console.log(JSON.stringify({ save: before === after ? 'ok ' + after : 'DIFF ' + before + ' vs ' + after, sw, offline, deaths, stats: await page.evaluate(() => ENGINE.S.stats).catch(() => null), errors: errors.slice(0, 15) }, null, 1));
  await browser.close(); edge.kill(); srv.close(); process.exit(0);
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
