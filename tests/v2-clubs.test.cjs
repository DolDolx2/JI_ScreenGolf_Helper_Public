// Run: node --test tests/v2-clubs.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../settings-engine.js');
const C=require('../club-engine.js');
test('legacy V1 settings are retained',()=>{
 const s=S.normalize({penalties:{fairwayBunker:33},clubs:{i7:{min:120,max:145}}});
 assert.equal(s.penalties.fairwayBunker,33);
 assert.deepEqual(s.clubs.i7,{min:120,max:145});
 assert.deepEqual(s.customClubs,[]);
});
test('iron 3 and wedge 58 are default clubs',()=>{
 assert.ok(S.CLUBS.includes('i3'));
 assert.ok(S.CLUBS.includes('w58'));
 assert.equal(C.NAMES.i3,'아이언 3번');
 assert.equal(C.NAMES.w58,'58도 웨지');
});
test('custom club participates in recommendation and can be removed',()=>{
 const s=S.defaults();
 assert.equal(S.addCustomClub(s,'유틸리티 4번','custom-abcdef12'),true);
 assert.equal(S.setClub(s,'custom-abcdef12',155,175),true);
 assert.equal(C.recommend(165,s.clubs,s.customClubs).clubs[0].name,'유틸리티 4번');
 assert.equal(S.removeCustomClub(s,'custom-abcdef12'),true);
 assert.equal(C.recommend(165,s.clubs,s.customClubs).type,'unregistered');
});
test('invalid club distance and duplicate name are rejected',()=>{
 const s=S.defaults();S.addCustomClub(s,'60도 웨지','custom-12345678');
 assert.equal(S.addCustomClub(s,'60도 웨지','custom-12345679'),false);
 assert.equal(S.setClub(s,'custom-12345678',180,140),false);
 assert.equal(S.setClub(s,'custom-12345678',-1,30),false);
});
test('storage round-trip preserves custom clubs',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const s=S.defaults();S.addCustomClub(s,'7번 우드','custom-87654321');S.setClub(s,'custom-87654321',175,185);
 assert.equal(S.save(storage,s),true);
 assert.deepEqual(S.load(storage).value.customClubs,[{id:'custom-87654321',name:'7번 우드'}]);
 assert.equal(S.load(storage).value.clubs['custom-87654321'].min,175);
});
