// Recommendation based on final adjusted distance only; do not reapply lie/wind/elevation.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JIClub=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const NAMES=Object.freeze({i4:'아이언 4번',i5:'아이언 5번',i6:'아이언 6번',i7:'아이언 7번',i8:'아이언 8번',i9:'아이언 9번',p:'아이언 P',w48:'48도',w52:'52도',w56:'56도'});
function recommend(distance,clubs){
 if(!Number.isFinite(distance)||distance<0)throw new RangeError('유효한 공략거리가 필요합니다.');
 const available=Object.keys(NAMES).filter(k=>{
   const c=clubs?.[k];return c&&Number.isFinite(c.min)&&Number.isFinite(c.max)&&c.min>=0&&c.max>=c.min;
 }).map(k=>({key:k,name:NAMES[k],min:clubs[k].min,max:clubs[k].max}));
 if(!available.length)return {type:'unregistered',clubs:[],gap:null};
 const matches=available.filter(c=>c.min<=distance&&distance<=c.max);
 if(matches.length)return {type:matches.length===1?'single':'multiple',clubs:matches,gap:0};
 const gap=c=>distance<c.min?c.min-distance:distance>c.max?distance-c.max:0;
 const minGap=Math.min(...available.map(gap));
 const nearest=available.filter(c=>Math.abs(gap(c)-minGap)<1e-9);
 const maxRange=Math.max(...available.map(c=>c.max));
 const minRange=Math.min(...available.map(c=>c.min));
 return {type:distance>maxRange?'beyond-max':distance<minRange?'below-min':'nearest',clubs:nearest,gap:minGap};
}
return Object.freeze({recommend,NAMES});
});
