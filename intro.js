'use strict';
// One-time-per-page 5-second introduction, also skippable by the user.
(function(){
  const root=document.getElementById('intro');
  const skip=document.getElementById('intro-skip');
  const countdown=document.getElementById('intro-countdown');
  const bar=document.getElementById('intro-progress-bar');
  if(!root||!skip)return;
  let started=performance.now(),finished=false,timer;
  function enter(){
    if(finished)return;
    finished=true;clearInterval(timer);
    root.hidden=true;root.setAttribute('aria-hidden','true');
    document.body.classList.remove('intro-open');
    const tab=document.getElementById('tab-putting');if(tab)tab.focus({preventScroll:true});
  }
  skip.addEventListener('click',enter);
  document.body.classList.add('intro-open');
  timer=setInterval(()=>{
    const elapsed=performance.now()-started;
    const fraction=Math.min(1,elapsed/5000);
    bar.style.width=(fraction*100)+'%';
    countdown.textContent=Math.max(0,Math.ceil((5000-elapsed)/1000))+'초 후 자동 입장';
    if(fraction>=1)enter();
  },50);
  document.addEventListener('visibilitychange',()=>{
    // Resume according to elapsed visible time, avoiding a stale splash after switching tabs.
    if(document.visibilityState==='visible'&&performance.now()-started>=5000)enter();
  });
})();
