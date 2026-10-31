const CACHE = 'blocks-bc9ceb50';
const CORE = ['./index.html', './manifest.json', './voice-ko.json', './voice-en.json', './voice-common.json', './icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'reload'}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/manifest.json');
  if (isPage) {
    /* 페이지는 항상 최신을 먼저 받아오고, 인터넷이 없거나 느리면 저장해 둔 것을 씀 */
    const key = url.pathname.endsWith('manifest.json') ? './manifest.json' : './index.html';
    const net = fetch(req, {cache: 'no-store'}).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    });
    e.respondWith(Promise.race([net, new Promise((_, rej) => setTimeout(rej, 4000))]).catch(() => caches.match(key)));
    return;
  }
  /* 목소리·그림 파일은 저장해 둔 것을 바로 씀 (버전이 바뀌면 통째로 새로 받음) */
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
