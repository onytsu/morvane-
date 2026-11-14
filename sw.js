/* MORVANE — cache hors-ligne. Changer CACHE à chaque mise à jour des fichiers. */
var CACHE = 'morvane-v29';
var FILES = ["./","index.html","manifest.webmanifest","css/style.css","js/data.js","js/engine.js","js/sprites.js","js/backgrounds.js","js/audio.js","js/fx.js","js/vfx.js","js/ui.js","js/ui-run.js","js/mini.js","js/story.js","js/guide.js","fonts/cinzel-700.woff2","fonts/outfit-500.woff2","fonts/outfit-700.woff2","icons/icon-192.png","icons/icon-512.png","audio/block.mp3","audio/boss_die.mp3","audio/boss_intro.mp3","audio/buy.mp3","audio/click.mp3","audio/crit.mp3","audio/death.mp3","audio/die.mp3","audio/door.mp3","audio/equip.mp3","audio/error.mp3","audio/gold.mp3","audio/heal.mp3","audio/hit.mp3","audio/hurt.mp3","audio/levelup.mp3","audio/loot.mp3","audio/loot_epic.mp3","audio/loot_legend.mp3","audio/loot_rare.mp3","audio/loot_unique.mp3","audio/music_boss.mp3","audio/music_combat.mp3","audio/music_final.mp3","audio/music_hub.mp3","audio/music_z1.mp3","audio/music_z2.mp3","audio/music_z3.mp3","audio/music_z4.mp3","audio/music_z5.mp3","audio/music_z6.mp3","audio/potion.mp3","audio/salvage.mp3","audio/skill_blade.mp3","audio/skill_dark.mp3","audio/skill_fire.mp3","audio/skill_holy.mp3","audio/skill_war.mp3","audio/upgrade.mp3","audio/victory.mp3"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).then(function (res) {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () { return caches.match('index.html'); });
  }));
});
