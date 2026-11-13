// Generates MORVANE audio with ElevenLabs. Re-runnable: skips existing files.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('no key'); process.exit(1); }
const RAW = path.join(__dirname, 'audio-raw'), OUT = path.join(__dirname, '..', 'audio');
fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const sfx = [
 ['hit',0.5,'sword slash hitting flesh, short dull impact, dry'],
 ['crit',0.7,'heavy critical blow, bone crunch with metallic ring, dry'],
 ['hurt',0.5,'hero takes a hit, muffled armour thud and short male grunt'],
 ['block',0.5,'sword blocked by a metal shield, clang, dry'],
 ['skill_fire',1.2,'fireball whoosh and burst'],
 ['skill_holy',1.3,'holy smite, choir-like shimmer and bright impact'],
 ['skill_dark',1.3,'dark necromantic spell, ghostly whisper swell and bone rattle'],
 ['skill_blade',0.8,'three very fast dagger slashes'],
 ['skill_war',1.2,'barbarian war cry with heavy axe swing'],
 ['heal',1.0,'soft magical healing chime, warm'],
 ['potion',0.9,'cork pop and gulp of a potion'],
 ['die',0.8,'small monster death, wet squelch and short dying screech'],
 ['boss_intro',2.5,'huge monster roar in a stone crypt with low rumble'],
 ['boss_die',3.0,'giant creature collapsing, deep dying roar, stone debris, then a low choir chord'],
 ['loot',0.5,'small item drop, soft coin-and-leather tick',-6],
 ['loot_rare',0.8,'magical item drop, bright crystal ping'],
 ['loot_epic',1.2,'epic item drop, rising arcane shimmer with deep bell'],
 ['loot_legend',1.8,'legendary item drop, triumphant dark choir stab with golden shimmer and a big bell'],
 ['loot_unique',2.2,'unique blood-red relic drop, ominous deep gong, reversed whisper swell and a heartbeat'],
 ['levelup',1.2,'level up, rising dark fantasy fanfare sting'],
 ['door',1.0,'heavy wooden dungeon door creaking open'],
 ['click',0.5,'soft stone button tap, tiny click, very short and quiet',-6],
 ['gold',0.6,'handful of coins dropping'],
 ['upgrade',1.0,'blacksmith hammer on anvil, two strikes with sparks'],
 ['salvage',0.8,'metal item breaking apart into shards'],
 ['equip',0.6,'leather and metal armour piece being strapped on'],
 ['buy',0.6,'coins on a wooden counter'],
 ['error',0.5,'low dull negative thud, very short',-6],
 ['death',3.0,'hero death, slow funeral bell toll with a fading low drone'],
 ['victory',2.0,'short grim victory sting, low brass and a bell'],
];
const music = [
 ['music_hub','slow melancholic dark fantasy sanctuary theme, solo cello and soft choir pad, distant bell, campfire calm, minor key, instrumental, seamless loop'],
 ['music_combat','tense driving dark fantasy battle loop, low strings ostinato, war drums, minor key, medium-fast tempo, instrumental, no vocals, seamless loop'],
 ['music_boss','epic boss battle, pounding drums, ominous latin-style choir without clear words, heavy brass, fast, instrumental, seamless loop'],
 ['music_z1','dark fantasy crypt exploration battle loop, cold echoing stone hall, low cello ostinato, slow heavy war drum, distant pipe organ, eerie boys choir pad, minor key, medium tempo, instrumental, no vocals, seamless loop'],
 ['music_z2','dark fantasy haunted dead forest battle loop, nervous pizzicato strings, wooden percussion and bone rattles, mournful fiddle melody, howling wind, minor key, medium-fast tempo, instrumental, no vocals, seamless loop'],
 ['music_z3','dark fantasy plague swamp battle loop, sluggish detuned double bass, wet hand drums, eerie bass clarinet and bowed saw, croaking low brass drones, sickly atmosphere, minor key, medium tempo, instrumental, no vocals, seamless loop'],
 ['music_z4','dark fantasy desecrated gothic cathedral battle loop, huge pipe organ riff, tolling church bells, dramatic string stabs, wordless solemn choir, timpani, minor key, medium-fast tempo, instrumental, seamless loop'],
 ['music_z5','dark fantasy infernal forge battle loop, pounding anvil hits and metal percussion, aggressive low brass riff, driving taiko drums, distorted cello chugs, fiery and relentless, minor key, fast tempo, instrumental, no vocals, seamless loop'],
 ['music_z6','dark fantasy void throne room battle loop, cold ethereal synth pads, reversed whispers, slow majestic tragic strings theme, deep sub bass pulse, glassy bells, cosmic dread, minor key, medium tempo, instrumental, no vocals, seamless loop'],
 ['music_final','final boss battle against a hollow undead king, tragic and colossal, full orchestra, thundering drums, soaring wordless choir, heroic sorrowful string melody over fast ostinato, pipe organ, minor key, fast tempo, instrumental, seamless loop'],
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function post(url, body) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 429) { await sleep(8000 * (i + 1)); continue; }
    if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 500));
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error('429 retries exhausted');
}
const ff = args => { const r = spawnSync('ffmpeg', ['-y','-v','error',...args], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr); };
const dur = f => parseFloat(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f],{encoding:'utf8'}).stdout);
function procSfx(name, target, gain = 0) {
  const raw = path.join(RAW, name + '.mp3'), tmp = path.join(RAW, name + '.tmp.wav'), out = path.join(OUT, name + '.mp3');
  const sr = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02';
  ff(['-i', raw, '-af', `${sr},areverse,${sr},areverse,atrim=0:${target + 0.4}`, '-ac','1','-ar','44100', tmp]);
  const d = dur(tmp);
  const vol = gain ? `,volume=${gain}dB` : '';
  ff(['-i', tmp, '-af', `loudnorm=I=-16:TP=-1.5${vol},afade=t=out:st=${Math.max(0,d-0.06)}:d=0.06`, '-ac','1','-ar','44100','-b:a','64k', out]);
  fs.unlinkSync(tmp);
}
function procMusic(name) {
  ff(['-i', path.join(RAW, name + '.mp3'), '-af','loudnorm=I=-20:TP=-2:LRA=11','-ac','2','-ar','44100','-b:a','96k', path.join(OUT, name + '.mp3')]);
}
async function pool(tasks, n) { const q = [...tasks]; await Promise.all(Array.from({length:n}, async () => { while (q.length) { const t = q.shift(); try { await t(); } catch (e) { console.error('FAIL', e.message); } } })); }
(async () => {
  const tasks = [];
  for (const [name, d, text, gain] of sfx) tasks.push(async () => {
    const raw = path.join(RAW, name + '.mp3');
    if (fs.existsSync(path.join(OUT, name + '.mp3'))) return;
    if (!fs.existsSync(raw)) { fs.writeFileSync(raw, await post('https://api.elevenlabs.io/v1/sound-generation', { text, duration_seconds: d, prompt_influence: 0.4 })); console.log('gen', name); }
    procSfx(name, d, gain);
  });
  for (const [name, prompt] of music) tasks.push(async () => {
    const raw = path.join(RAW, name + '.mp3');
    if (fs.existsSync(path.join(OUT, name + '.mp3'))) return;
    if (!fs.existsSync(raw)) { fs.writeFileSync(raw, await post('https://api.elevenlabs.io/v1/music', { prompt, music_length_ms: 60000 })); console.log('gen', name); }
    procMusic(name);
  });
  await pool(tasks, 3);
  console.log('done');
})();
