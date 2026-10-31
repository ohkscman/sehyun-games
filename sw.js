/* 첫 화면 전용: 첫 화면 파일만 다루고, cards/ blocks/ 게임 파일은 각 게임이 알아서 저장함 */
const CACHE = 'home-2';
const CORE = ['./', './index.html', './home/', './home/index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './cards/icon-192.png', './blocks/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'reload'}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('home-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), base = new URL(self.registration.scope);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  const rel = url.pathname.slice(base.pathname.length);
  const isGameIcon = rel === 'cards/icon-192.png' || rel === 'blocks/icon-192.png';
  const isHome = rel === 'home/' || rel === 'home/index.html';
  if (rel.includes('/') && !isGameIcon && !isHome) return;           /* 게임 폴더 안의 요청은 건드리지 않음 */
  const key = rel === '' ? './index.html' : rel === 'home/' ? './home/index.html' : './' + rel;
  /* 최신을 먼저 받아오고, 인터넷이 없거나 느리면 저장해 둔 것을 씀 */
  const net = fetch(req, {cache: 'no-store'}).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return res; });
  e.respondWith(Promise.race([net, new Promise((_, rej) => setTimeout(rej, 4000))]).catch(() => caches.match(key)));
});
