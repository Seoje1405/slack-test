const STATIC_CACHE = 'team-hub-static-v1';
const PAGE_CACHE = 'team-hub-pages-v1';

const PRECACHE_URLS = ['/dashboard'];

// 설치: 핵심 페이지 미리 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 활성화: 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [STATIC_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청 — 항상 네트워크 (오프라인 시 그냥 실패)
  if (url.pathname.startsWith('/api/')) return;

  // Next.js 정적 자산 — 캐시 우선 (빌드 해시로 버전 관리)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 페이지 탐색 — 네트워크 우선, 실패 시 캐시 fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached ?? caches.match('/dashboard')
          )
        )
    );
  }
});
