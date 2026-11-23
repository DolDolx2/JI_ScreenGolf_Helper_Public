'use strict';
// V2.0 Build 20261123.01 - no app response caching.
// Existing application caches are removed, but browser localStorage is NEVER cleared.
const SCOPE=self.registration.scope;
async function clearAppCaches(){
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('ji-golf-shell-')).map(k=>caches.delete(k)));
}
self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([clearAppCaches(),self.clients.claim()]));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='JI_CLEAR_APP_CACHE'){
    event.waitUntil(clearAppCaches().then(()=>event.ports?.[0]?.postMessage({ok:true})).catch(()=>event.ports?.[0]?.postMessage({ok:false})));
  }
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(!url.href.startsWith(SCOPE)||url.origin!==self.location.origin)return;
  // Network only, bypass HTTP cache; never reuse stale application resources.
  event.respondWith(fetch(new Request(req,{cache:'no-store'})));
});
