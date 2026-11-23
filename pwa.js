'use strict';
// Remove only caches previously created by this app. Do not touch localStorage/club distances.
async function clearOwnAppCaches(){
  if(!('caches' in window))return;
  try{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('ji-golf-shell-')).map(k=>caches.delete(k)));
  }catch(e){console.warn('App cache cleanup skipped',e);}
}
clearOwnAppCaches();
if('serviceWorker' in navigator&&window.isSecureContext){
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
      await registration.update();
      const controller=navigator.serviceWorker.controller||registration.active;
      if(controller)controller.postMessage({type:'JI_CLEAR_APP_CACHE'});
    }catch(e){console.warn('Service worker unavailable',e);}
  });
}
