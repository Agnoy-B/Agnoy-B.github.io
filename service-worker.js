const CACHE_NAME = 'fund-data-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // 如果你有单独的 style.css 或 main.js 文件，也请把路径加在这里
  // '/style.css',
  // '/app.js'
];

// 安装阶段：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 拦截请求：优先读取缓存，没有则走网络
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有，直接返回缓存
      if (response) {
        return response;
      }
      // 如果没有，克隆请求去网络获取
      return fetch(event.request).then((networkResponse) => {
        // 只缓存成功的响应，且是同源请求（不缓存第三方 API 数据，保证数据实时性）
        if (!networkResponse || networkResponse.status !== 200 || event.request.url.startsWith('http')) {
           return networkResponse;
        }

        // 将网络获取的资源放入缓存（可选，对于动态数据不建议这样做）
        // const responseToCache = networkResponse.clone();
        // caches.open(CACHE_NAME).then((cache) => {
        //   cache.put(event.request, responseToCache);
        // });

        return networkResponse;
      });
    })
  );
});
