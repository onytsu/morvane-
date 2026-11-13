// Captures v1.7 : 8 héros, nouveaux monstres, pouvoirs des nouveaux héros, spécialités de boss.
// node tools/uitest4.js <dossier node_modules contenant puppeteer-core> <dossier de sortie>
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const MOD = process.argv[2], OUT = process.argv[3]; const puppeteer = require(path.join(MOD, 'puppeteer-core'));
const ROOT = path.join(__dirname, '..'); const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8381);
const sleep = ms => new Promise(r => setTimeout(r, ms)); let edge = null;
(async () => {
  edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=9338', '--user-data-dir=' + path.join(OUT, 'edge-profile-' + Date.now()), '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let browser; for (let i = 0; i < 40 && !browser; i++) { await sleep(500); try { browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9338' }); } catch (e) { } }
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://127.0.0.1:8381/index.html'); await sleep(700);
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const res = {};
  await page.evaluate(() => { const S = ENGINE.S; for (const k of ['hub', 'skill', 'charge', 'potion', 'weak', 'fix', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6', 'help_chasseuse', 'help_moine', 'help_chevalier']) S.tuto[k] = 1; S.stats.runs = 9; S.stats.best = 35; S.stats.bossMax = 3; S.stats.boss3 = 1; S.cendres = 9000; ENGINE.checkAch(); S.meta.m_force = 80; S.meta.m_vigueur = 120; S.meta.m_peau = 80; UI.hub('hero'); });
  await sleep(500);
  res.unlock = await page.evaluate(() => ({ chasseuse: ENGINE.heroUnlocked('chasseuse'), moineAchetable: ENGINE.canUnlock('moine') }));
  await page.evaluate(() => document.querySelector('[data-act=heroPick][data-id=chasseuse]').click()); await sleep(400); await shot('1-traqueuse-sanctuaire');
  await page.evaluate(() => { document.querySelector('[data-act=heroPick][data-id=moine]').click(); }); await sleep(300);
  res.moineBuy = await page.evaluate(() => { const b = document.querySelector('[data-act=unlock]'); if (b) b.click(); return ENGINE.heroUnlocked('moine'); }); await sleep(400); await shot('2-moine-sanctuaire');
  const scene = async (name, hero, floor, room, wait, fn) => {
    await page.evaluate((hero, floor, room) => { const S = ENGINE.S; if (S.run) ENGINE.endRun(true); S.heroes[hero].lvl = Math.max(S.heroes[hero].lvl, 3); ENGINE.startRun(hero, 1); const run = S.run; run.floor = floor; run.room = room; ENGINE.recalc(run); run.hp = run.stats.hp; run.phase = 'combat'; ENGINE._buildCombat(run); UI.run.show(); }, hero, floor, room);
    await sleep(wait || 2500); if (fn) await page.evaluate(fn); await sleep(600); await shot(name);
  };
  await scene('3-traqueuse-zone1-nouveaux', 'chasseuse', 5, { type: 'combat', group: ['chauve_souris', 'momie', 'liche'] }, 2200, () => { ENGINE.useSkill(0); ENGINE.useSkill(2); });
  res.h = await page.evaluate(() => { const r = ENGINE.S.run, c = r.combat; r.ult = 100; const hp0 = c.enemies.filter(e => !e.dead).map(e => Math.round(e.hp)); const ok = ENGINE.useUlt(); return { ult: ok, avant: hp0, apres: c.enemies.filter(e => !e.dead).map(e => Math.round(e.hp)), ultApres: Math.round(r.ult) }; });
  await scene('4-moine-zone3-nouveaux', 'moine', 25, { type: 'combat', group: ['moustique', 'limon', 'hydre'] }, 3500, () => { ENGINE.useSkill(2); });
  res.m = await page.evaluate(() => { const r = ENGINE.S.run, c = r.combat; const e0 = c.hero.elan; r.ult = 100; const ok = ENGINE.useUlt(); return { elan: e0, ult: ok, eveil: !!c.hero.buffs.eveil, elanApres: c.hero.elan }; });
  await scene('5-zone5-zone6-nouveaux', 'chevalier', 45, { type: 'combat', group: ['salamandre', 'forge_esprit', 'maitre_chaines'] }, 2000);
  await scene('6-zone4-nouveaux', 'chevalier', 35, { type: 'combat', group: ['nonne', 'armure', 'paladin'] }, 2000);
  await scene('7-zone6-nouveaux', 'chevalier', 55, { type: 'combat', group: ['larme', 'colosse_creux', 'devoreur_etoiles'] }, 2000);
  // spécialité du Léviathan : la plongée
  await scene('8-leviathan-plonge', 'chevalier', 30, { type: 'boss', group: ['leviathan'] }, 1500, () => { const e = ENGINE.S.run.combat.enemies[0]; e.bt = 14.9; e.chargeCd = 99; });
  await sleep(700); await shot('8b-leviathan-plonge');
  res.dive = await page.evaluate(() => { const e = ENGINE.S.run.combat.enemies[0]; return { hidden: e.hidden > 0, classe: document.querySelector('.unit.en.boss').classList.contains('hidden') }; });
  // le Roi Creux se relève
  res.rebirth = await page.evaluate(() => { const S = ENGINE.S; ENGINE.endRun(true); ENGINE.startRun('chevalier', 1); const run = S.run; run.floor = 60; run.room = { type: 'boss', group: ['roi_creux'] }; ENGINE.recalc(run); run.hp = run.stats.hp; run.phase = 'combat'; ENGINE._buildCombat(run); const e = run.combat.enemies[0]; e.hp = 1; e.t = 99; e.chargeCd = 99; S.settings.auto = false; for (let i = 0; i < 40 && !e.reborn; i++) ENGINE.tick(0.1); return { reborn: !!e.reborn, dead: e.dead, hpPct: Math.round(e.hp / e.maxhp * 100) }; });
  console.log(JSON.stringify({ res, errors: errors.slice(0, 8) }, null, 1)); await browser.close(); edge.kill(); srv.close(); process.exit(0);
})().catch(e => { console.error('TEST FAIL', e); try { if (edge) edge.kill(); } catch (x) { } process.exit(1); });
