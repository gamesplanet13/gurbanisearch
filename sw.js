/* Games Planet Gurbani — offline app shell. Search corpus stored in IndexedDB by Controller. */
const VERSION='gurbani-shell-2026-11-13-searcher-brand-v11';
const CORE=[
 './','./index.html','./searcher.html','./gurbani-searcher.css','./gurbani-searcher-sync.js','./projection.html','./book.html','./obs.html','./camera.html',
 './gurbani-desktop-preview.js','./gurbani-desktop-fullscreen.js','./gurbani-screen-preview.js','./gurbani-waheguru-wide.js','./gurbani-updates.js','./gurbani-camera.js','./gurbani-layout.js','./gurbani-book-motion.js','./gurbani-peer-manager.js','./peerjs-1.5.5.min.js',
 './data/banis/anand-six.json','./data/banis/sukhmani-sahib.json',
 './data/anand-ending-salok.json','./assets/sahibzaade-family.webp',
 './assets/searcher/ang.png','./assets/searcher/favorites.png','./assets/searcher/history.png','./assets/searcher/initials.png','./assets/searcher/brand.svg','./assets/searcher/next-off.png','./assets/searcher/next.png','./assets/searcher/previous.png','./assets/searcher/search-mode.png','./assets/searcher/search.png','./assets/searcher/settings.png','./assets/searcher/waheguru.png','./assets/searcher/word.png',
 './assets/splash-portrait.svg','./assets/splash-landscape.svg'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  await Promise.allSettled(CORE.map(async path=>{
   try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response)}catch(_){}
  }));
  await self.skipWaiting()
 })())
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('gurbani-shell-')&&k!==VERSION).map(k=>caches.delete(k)));
  await self.clients.claim()
 })())
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const scopePath=new URL('./',self.location.href).pathname;
 if(!url.pathname.startsWith(scopePath))return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==='basic')cache.put(request,response.clone()).catch(()=>{});
   return response
  }catch(error){
   const cached=await cache.match(request,{ignoreSearch:true});
   if(cached)return cached;
   if(request.mode==='navigate'){
    const fallback=await cache.match('./index.html');
    if(fallback)return fallback
   }
   throw error
  }
 })())
});
