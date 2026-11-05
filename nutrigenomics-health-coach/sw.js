const CACHE='nutrigenomics-health-coach-v6';
const FILES=['./','./index.html','./manifest.webmanifest','./business-workspace.css?v=20261105-4','./business-workspace.js?v=20261105-4','./client-care-enhancements.css?v=20261105-4','./client-care-enhancements.js?v=20261105-4','./interface-redesign.css?v=20261105-ui1'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const refresh=event.request.mode==='navigate'||/\\.(?:js|css)$/.test(url.pathname);
 if(refresh){
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match('./index.html'))));
});