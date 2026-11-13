// Vérifie l'adresse en ligne : chargement, cache hors-ligne, relance sans réseau, sauvegarde.
// node tools/livetest.js <dossier node_modules contenant puppeteer-core> <dossier de sortie> [adresse]
const path = require('path'), { spawn } = require('child_process');
const MOD = process.argv[2], OUT = process.argv[3], URL = process.argv[4] || 'https://onytsu.github.io/morvane-/';
const puppeteer = require(path.join(MOD, 'puppeteer-core'));
const sleep = ms => new Promise(r => setTimeout(r, ms)); let edge = null;
(async () => {
  edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9337', '--user-data-dir=' + path.join(OUT, 'edge-profile-' + Date.now()), '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let browser; for (let i = 0; i < 40 && !browser; i++) { await sleep(500); try { browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9337' }); } catch (e) { } }
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: 'load' }); await sleep(1500);
  const res = {};
  res.loaded = await page.evaluate(() => typeof ENGINE !== 'undefined' && !!document.querySelector('.splash'));
  // attendre que tout soit copié dans le cache hors-ligne
  for (let i = 0; i < 60; i++) { res.cached = await page.evaluate(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return { caches: ks, files: n }; }); if (res.cached.files >= 50) break; await sleep(1000); }
  res.sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? (r.active ? 'actif' : 'en attente') : 'absent'; });
  // jouer un peu pour avoir une sauvegarde
  await page.evaluate(() => { document.querySelector('[data-act=enter]').click(); }); await sleep(400);
  await page.evaluate(() => { const b = document.querySelector('[data-act=firstRun]'); if (b) b.click(); }); await sleep(1200);
  await page.evaluate(() => { UI.closeModal(); ENGINE.S.settings.auto = true; ENGINE.S.settings.speed = 3; }); await sleep(9000);
  await page.evaluate(() => ENGINE.save());
  const before = await page.evaluate(() => JSON.stringify([ENGINE.S.stats.kills, ENGINE.S.run ? ENGINE.S.run.floor : 0, ENGINE.S.stats.runs]));
  // couper le réseau et recharger
  await page.setOfflineMode(true);
  try { await page.reload({ waitUntil: 'load', timeout: 15000 }); await sleep(1500);
    res.offline = await page.evaluate(() => ({ app: typeof ENGINE !== 'undefined', splash: !!document.querySelector('.splash'), sprite: typeof Sprites !== 'undefined' && Sprites.url('chevalier').length > 100, bg: typeof Backgrounds !== 'undefined' }));
    const after = await page.evaluate(() => JSON.stringify([ENGINE.S.stats.kills, ENGINE.S.run ? ENGINE.S.run.floor : 0, ENGINE.S.stats.runs]));
    res.save = before === after ? 'identique ' + after : 'DIFFERENT ' + before + ' / ' + after;
    res.offlineAudio = await page.evaluate(async () => { const out = {}; for (const f of ['audio/hit.mp3', 'audio/music_hub.mp3', 'audio/music_z3.mp3', 'audio/music_final.mp3']) { try { const r = await fetch(f); out[f] = r.ok ? (await r.arrayBuffer()).byteLength : 'echec ' + r.status; } catch (e) { out[f] = 'echec'; } } return out; });
    await page.evaluate(() => document.querySelector('[data-act=enter]').click()); await sleep(1500);
    res.offlineResume = await page.evaluate(() => ({ screen: UI.st.screen, arena: !!document.querySelector('#arena .unit.hero') }));
    await page.screenshot({ path: path.join(OUT, 'en-ligne-puis-hors-ligne.png') });
  } catch (e) { res.offline = 'ECHEC: ' + e.message; }
  console.log(JSON.stringify({ url: URL, res, errors: errors.slice(0, 8) }, null, 1));
  await browser.close(); edge.kill(); process.exit(0);
})().catch(e => { console.error('TEST FAIL', e); try { if (edge) edge.kill(); } catch (x) { } process.exit(1); });
