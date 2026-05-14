const STATIC_CACHE = 'fund-static-v1';
const API_CACHE = 'fund-api-v1';

// —— 静态资源预缓存 ——
const STATIC_ASSETS = [
  '/',
  '/index.html'
  // 你的 HTML 是单文件，主要就这两个
];

// —— 需要缓存的 CDN 资源域名 ——
const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net'
];

// —— 东方财富 API 域名 ——
const API_HOSTS = [
  'fundgz.1234567.com.cn',   // 实时估值
  'fund.eastmoney.com'       // 全量列表 + 历史净值
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ——————————————————————————————
  //  1. 东方财富 API → 网络优先
  //     数据必须最新，断网时用缓存兜底
  // ——————————————————————————————
  if (API_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ——————————————————————————————
  //  2. CDN 资源（字体、图标、Chart.js）→ 缓存优先
  //     这些几乎不变，缓存后秒加载
  // ——————————————————————————————
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // ——————————————————————————————
  //  3. HTML 本身 → 缓存优先（你的单文件）
  // ——————————————————————————————
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request);
      })
    );
  }
});
