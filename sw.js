'use strict';
// Version bump changes the static shell cache on the next online visit.
const CACHE='ji-golf-shell-v2-20261123';
const CORE=['./','./index.html','./styles.css','./app.js',
  './intro.js','./field-engine.js','./settings-engine.js',
  './club-engine.js','./putting-calculator/index.html','./manifest.webmanifest','./icons/app.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ji-golf-shell-')&&key!==CACHE).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith(fetch(req).then(response=>{if(response.ok&&req.url.startsWith(self.registration.scope))caches.open(CACHE).then(cache=>cache.put(req,response.clone()));return response;}).catch(()=>caches.match(req)));
});
