// Settings validation/storage independent of the DOM and calculation engines.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JISettings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='ji-screen-settings-v1';
const CLUBS=['i4','i5','i6','i7','i8','i9','p','w48','w52','w56'];
const DEFAULT_PENALTIES=Object.freeze({normalRough:0,heavyRough:0,fairwayBunker:20,greenBunker:0});
const numberIn=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const validRate=v=>numberIn(v,0,100);
const validDistance=v=>numberIn(v,0,1000);
const validClub=r=>r!==null&&typeof r==='object'&&validDistance(r.min)&&validDistance(r.max)&&r.min<=r.max;
function defaults(){return {penalties:{...DEFAULT_PENALTIES},clubs:{}};}
function normalize(raw){
 const result=defaults();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const k of Object.keys(DEFAULT_PENALTIES))if(validRate(raw.penalties?.[k]))result.penalties[k]=raw.penalties[k];
 for(const k of CLUBS)if(validClub(raw.clubs?.[k]))result.clubs[k]={min:raw.clubs[k].min,max:raw.clubs[k].max};
 return result;
}
function load(storage){
 try{const text=storage.getItem(KEY);return {value:normalize(text===null?null:JSON.parse(text)),ok:true};}
 catch{return {value:defaults(),ok:false};}
}
function save(storage,settings){
 try{storage.setItem(KEY,JSON.stringify(normalize(settings)));return true;}catch{return false;}
}
function setPenalty(settings,key,value){
 if(!Object.hasOwn(DEFAULT_PENALTIES,key)||!validRate(value))return false;
 settings.penalties[key]=value;return true;
}
function setClub(settings,key,min,max){
 if(!CLUBS.includes(key))return false;
 if(min===null&&max===null){delete settings.clubs[key];return true;}
 if(!validClub({min,max}))return false;
 settings.clubs[key]={min,max};return true;
}
return Object.freeze({KEY,CLUBS,DEFAULT_PENALTIES,defaults,normalize,load,save,setPenalty,setClub,validRate,validDistance});
});
