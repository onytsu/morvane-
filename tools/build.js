// Fabrique dist/morvane.html : le jeu entier dans un seul fichier (sons compris), pour l'essayer via un lien.
const fs = require('fs'), path = require('path'), R = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(R, f), 'utf8');
const emb = {}; fs.readdirSync(path.join(R, 'audio')).filter(f => f.endsWith('.mp3')).forEach(f => { emb[f.replace('.mp3', '')] = fs.readFileSync(path.join(R, 'audio', f)).toString('base64'); });
const js = ['data', 'engine', 'sprites', 'backgrounds', 'audio', 'fx', 'ui', 'ui-run'].map(n => rd('js/' + n + '.js')).join('\n;\n').replace(/<\/script/g, '<\/script');
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0d0b10"><title>Morvane</title>
<style>${rd('css/style.css')}</style></head>
<body><div id="app"><div id="screen"></div><div id="overlay"></div><div id="modal"></div><div id="toasts"></div><div id="flash"></div></div>
<script>window.AUDIO_EMBED=${JSON.stringify(emb)};</script>
<script>${js}</script></body></html>`;
fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
fs.writeFileSync(path.join(R, 'dist', 'morvane.html'), html);
// Version pour la page d'essai claude.ai (sans <html>/<body>, ajoutés à la publication)
const art = `<title>Morvane</title>
<style>${rd('css/style.css')}
:root { color-scheme: dark; --sat: 0px; --sab: 0px; } html, body { height: 100%; } #app { height: 100%; }</style>
<div id="app"><div id="screen"></div><div id="overlay"></div><div id="modal"></div><div id="toasts"></div><div id="flash"></div></div>
<script>window.AUDIO_EMBED=${JSON.stringify(emb)};</script>
<script>${js}</script>`;
fs.writeFileSync(path.join(R, 'dist', 'morvane-artifact.html'), art);
console.log('dist/morvane.html', (html.length / 1048576).toFixed(2), 'Mo');
