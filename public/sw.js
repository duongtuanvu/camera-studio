// Retire v1's network-first cache, which could mix HTML and chunks across deploys.
const CACHE='camera-studio-shell-v2';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('camera-studio-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url),scope=new URL(self.registration.scope);
 if(r.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname)||r.headers.has('range'))return;
 const path=u.pathname.slice(scope.pathname.length);
 // Never intercept navigations, HTML, or mutable unversioned assets.
 if(!/^(assets\/[^/]+-[\w-]{6,}\.(?:js|css)|runtime-v2\/[\w./-]+)$/.test(path))return;
 event.respondWith((async()=>{try{const cache=await caches.open(CACHE);const saved=await cache.match(r);if(saved)return saved;const response=await fetch(r);const type=response.headers.get('content-type')||'';if(response.ok&&response.type==='basic'&&!type.includes('text/html')){try{await cache.put(r,response.clone());}catch{/* storage pressure */}}return response;}catch{return fetch(r);}})());
});