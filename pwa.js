'use strict';
if('serviceWorker' in navigator && window.isSecureContext){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{
      // Calculators remain usable while online even if cache registration fails.
    });
  });
}
