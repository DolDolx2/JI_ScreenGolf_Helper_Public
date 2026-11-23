// V2 settings: preserve V1 localStorage key and migrate saved built-in clubs.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JISettings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='ji-screen-settings-v1';
const CLUBS=['i3','i4','i5','i6','i7','i8','i9','p','w48','w52','w56','w58'];
const DEFAULT_PENALTIES=Object.freeze({normalRough:0,heavyRough:0,fairwayBunker:20,greenBunker:0});
const numberIn=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const validRate=v=>numberIn(v,0,100);
const validDistance=v=>numberIn(v,0,1000);
const validClub=r=>r!==null&&typeof r==='object'&&validDistance(r.min)&&validDistance(r.max)&&r.min<=r.max;
const validName=n=>typeof n==='string'&&n.trim().length>=1&&n.trim().length<=32;
const customId=id=>typeof id==='string'&&/^custom-[a-z0-9-]{8,48}$/.test(id);
function defaults(){return {penalties:{...DEFAULT_PENALTIES},clubs:{},customClubs:[]};}
function normalize(raw){
 const result=defaults();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const k of Object.keys(DEFAULT_PENALTIES))if(validRate(raw.penalties?.[k]))result.penalties[k]=raw.penalties[k];
 if(Array.isArray(raw.customClubs)){
   const used=new Set();
   for(const item of raw.customClubs.slice(0,30)){
     if(!item||!customId(item.id)||!validName(item.name)||used.has(item.id))continue;
     used.add(item.id); result.customClubs.push({id:item.id,name:item.name.trim()});
   }
 }
 for(const k of [...CLUBS,...result.customClubs.map(c=>c.id)]){
   if(validClub(raw.clubs?.[k]))result.clubs[k]={min:raw.clubs[k].min,max:raw.clubs[k].max};
 }
 return result;
}
function load(storage){
 try{const text=storage.getItem(KEY);return {value:normalize(text===null?null:JSON.parse(text)),ok:true};}
 catch{return {value:defaults(),ok:false};}
}
function save(storage,settings){try{storage.setItem(KEY,JSON.stringify(normalize(settings)));return true;}catch{return false;}}
function setPenalty(settings,key,value){
 if(!Object.hasOwn(DEFAULT_PENALTIES,key)||!validRate(value))return false;
 settings.penalties[key]=value;return true;
}
function availableKeys(settings){return [...CLUBS,...(settings.customClubs||[]).map(c=>c.id)];}
function setClub(settings,key,min,max){
 if(!availableKeys(settings).includes(key))return false;
 if(min===null&&max===null){delete settings.clubs[key];return true;}
 if(!validClub({min,max}))return false;
 settings.clubs[key]={min,max};return true;
}
function addCustomClub(settings,name,id){
 const clean=typeof name==='string'?name.trim():'';
 if(!validName(clean)||!customId(id)||CLUBS.includes(id)||settings.customClubs.length>=30||settings.customClubs.some(c=>c.id===id||c.name===clean))return false;
 settings.customClubs.push({id,name:clean});return true;
}
function removeCustomClub(settings,id){
 const idx=settings.customClubs.findIndex(c=>c.id===id);
 if(idx<0)return false;
 settings.customClubs.splice(idx,1);delete settings.clubs[id];return true;
}
return Object.freeze({KEY,CLUBS,DEFAULT_PENALTIES,defaults,normalize,load,save,setPenalty,setClub,addCustomClub,removeCustomClub,availableKeys,validRate,validDistance});
});
