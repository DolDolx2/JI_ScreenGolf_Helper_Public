'use strict';
// Version bump changes the static shell cache on the next online visit.
const CACHE='ji-golf-shell-v4-slope-consistency-20261025';
const CORE=['./','./index.html','./styles.css','./app.js',
  './putting-engine.js','./field-engine.js','./settings-engine.js',
  './club-engine.js','./putting-mat.js','./manifest.webmanifest','./icons/app.svg'];
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
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
