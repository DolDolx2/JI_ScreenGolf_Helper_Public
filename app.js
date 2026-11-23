'use strict';
// Mobile UI, calculations and validated personal settings.
const tabs = [...document.querySelectorAll('[data-tab]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function selectTab(name, moveFocus = false) {
  if (!tabs.some((tab) => tab.dataset.tab === name)) return;
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  panels.forEach((panel) => { panel.hidden = panel.id !== 'panel-' + name; });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
      (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next].dataset.tab, true);
  });
});
selectTab('putting');

const formatDistance=value=>Number(value.toFixed(2)).toLocaleString('ko-KR',{maximumFractionDigits:2});
const loaded=JISettings.load(localStorage);
let settings=loaded.value;
const saveSettings=()=>JISettings.save(localStorage,settings);
if(!loaded.ok) document.addEventListener('DOMContentLoaded',()=>{document.getElementById('penalty-status').textContent='저장 데이터를 읽을 수 없어 기본값으로 시작했습니다.';});
function renderRecommendation(result){
  if(result.type==='unregistered')return '설정에서 클럽 거리 입력';
  const names=result.clubs.map(c=>c.name).join(' / ');
  if(result.type==='single')return names;
  if(result.type==='multiple')return names+' (복수 후보)';
  if(result.type==='beyond-max')return names+' (등록 최대거리 초과 '+formatDistance(result.gap)+'m)';
  if(result.type==='below-min')return names+' (등록 최소거리 미만 '+formatDistance(result.gap)+'m)';
  return names+' (가장 근접, 차이 '+formatDistance(result.gap)+'m)';
}
function updateField(){
  const read=id=>document.getElementById(id).value;
  const resultEl=document.getElementById('field-penalty-result');
  const formulaEl=document.getElementById('field-penalty-formula');
  const aimEl=document.getElementById('field-aim');
  const statusEl=document.getElementById('field-status');
  const recommendationEl=document.getElementById('field-recommendation');
  const raw=read('field-distance');
  if(raw.trim()===''){
    resultEl.textContent='입력 대기';
    recommendationEl.textContent='거리 입력 대기';
    formulaEl.textContent='남은 거리를 입력하면 보정식이 표시됩니다.';
    aimEl.textContent='입력 대기';
    statusEl.textContent='참고 경험식의 추정값입니다.';
    return;
  }
  const lie=read('field-lie');
  const penalty=lie==='fairway'?0:settings.penalties[lie];
  try {
    const r=JIField.compute({
      distance:Number(raw),
      height:read('field-height-direction')==='flat'?0:(read('field-height-direction')==='down'?-1:1)*(read('field-height').trim()?Number(read('field-height')):0),
      club:read('field-club'),wind:read('field-wind'),
      windSpeed:read('field-wind-speed').trim()?Number(read('field-wind-speed')):0,
      lie,penalty
    });
    resultEl.textContent=formatDistance(r.finalDistance)+' m';
    recommendationEl.textContent=renderRecommendation(JIClub.recommend(r.finalDistance,settings.clubs,settings.customClubs));
    formulaEl.textContent='높낮이: '+formatDistance(r.distance)+'m '+(r.slopeChange<0?'−':'+')+' '+formatDistance(Math.abs(r.slopeChange))+
      'm → '+formatDistance(r.slopeDistance)+'m | 바람: '+(r.windChange<0?'−':'+')+
      formatDistance(Math.abs(r.windChange))+'m → '+formatDistance(r.prePenalty)+'m | 라이: '+
      formatDistance(r.prePenalty)+'m × (1 + '+r.penalty+'%) = '+formatDistance(r.finalDistance)+'m';
    aimEl.textContent=r.aim==='none'?'보정 없음':(r.aim==='right'?'오른쪽 ':'왼쪽 ')+formatDistance(Math.abs(r.lateral))+' m';
    statusEl.textContent='참고 경험식에 따른 예상값이며 실제 탄도·바람 영향을 보장하지 않습니다.';
  }catch(e){
    resultEl.textContent='입력 확인 필요';
    recommendationEl.textContent='거리 입력 확인';
    aimEl.textContent='입력 확인 필요';
    formulaEl.textContent='유효한 거리(0 초과~1,000m), 높낮이(±300m), 풍속(0~60m/s), 보정률(0~100%)을 입력하세요.';
    statusEl.textContent=e.message;
  }
}
for(const input of document.querySelectorAll('[data-penalty]')){
  const key=input.dataset.penalty;
  input.value=String(settings.penalties[key]);
  input.addEventListener('input',()=>{
    const value=Number(input.value);
    const status=document.getElementById('penalty-status');
    if(input.value.trim()===''||!JISettings.setPenalty(settings,key,value)){
      status.textContent='0~100% 범위의 유효한 값을 입력하세요. 잘못된 값은 반영되지 않습니다.';
      return;
    }
    status.textContent=saveSettings()?'보정률 저장 완료':'저장 불가: 브라우저 저장 설정을 확인하세요.';
    updateField();
  });
}
// Render built-in and user-added clubs from the same validated settings model.
const clubRows=document.getElementById('club-rows');
const clubStatus=document.getElementById('club-status');
function makeClubRow(key,name,isCustom){
  const row=document.createElement('div');row.className='club-row';row.dataset.club=key;
  const heading=document.createElement('span');heading.className='club-name';heading.textContent=name;row.append(heading);
  const boundInput=bound=>{
    const input=document.createElement('input');
    input.type='number';input.min='0';input.max='1000';input.step='0.1';input.inputMode='decimal';
    input.placeholder=bound==='min'?'최소':'최대';input.dataset.bound=bound;
    input.setAttribute('aria-label',name+' '+(bound==='min'?'최소':'최대')+' 거리');
    if(settings.clubs[key])input.value=String(settings.clubs[key][bound]);
    return input;
  };
  const minimum=boundInput('min'),maximum=boundInput('max');
  row.append(minimum,maximum);
  const persist=()=>{
    const emptyMin=minimum.value.trim()==='',emptyMax=maximum.value.trim()==='';
    if(emptyMin&&emptyMax){JISettings.setClub(settings,key,null,null);clubStatus.textContent=saveSettings()?'미등록으로 저장했습니다.':'저장할 수 없습니다.';updateField();return;}
    if(emptyMin||emptyMax||!JISettings.setClub(settings,key,Number(minimum.value),Number(maximum.value))){
      clubStatus.textContent='최소·최대를 모두 입력하세요 (0~1000m, 최소 ≤ 최대). 기존 저장값은 유지됩니다.';return;
    }
    clubStatus.textContent=saveSettings()?'클럽 비거리 저장 완료':'브라우저 저장에 실패했습니다.';
    updateField();
  };
  minimum.addEventListener('change',persist);
  maximum.addEventListener('change',persist);
  if(isCustom){
    const remove=document.createElement('button');remove.type='button';remove.className='club-remove';
    remove.textContent='삭제';remove.setAttribute('aria-label',name+' 삭제');
    remove.addEventListener('click',()=>{
      if(!window.confirm(name+' 클럽과 저장된 비거리를 삭제하시겠습니까?'))return;
      JISettings.removeCustomClub(settings,key);
      clubStatus.textContent=saveSettings()?'클럽 삭제 완료':'브라우저 저장에 실패했습니다.';
      renderClubs();updateField();
    });
    row.append(remove);
  }
  return row;
}
function renderClubs(){
  clubRows.replaceChildren();
  for(const [key,name] of Object.entries(JIClub.NAMES))clubRows.append(makeClubRow(key,name,false));
  for(const club of settings.customClubs)clubRows.append(makeClubRow(club.id,club.name,true));
}
function newClubId(){
  const rand=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  return 'custom-'+rand;
}
function addClub(){
  const input=document.getElementById('custom-club-name'),name=input.value.trim();
  if(Object.values(JIClub.NAMES).includes(name)){
    clubStatus.textContent='기본 목록에 이미 있는 클럽입니다.';return;
  }
  if(!JISettings.addCustomClub(settings,name,newClubId())){
    clubStatus.textContent='이름은 1~32자, 중복 없이 입력하세요. 사용자 클럽은 최대 30개입니다.';return;
  }
  const ok=saveSettings();
  clubStatus.textContent=ok?'새 클럽을 추가했습니다. 최소·최대 비거리를 입력하세요.':'클럽을 저장하지 못했습니다.';
  input.value='';renderClubs();updateField();
}
document.getElementById('add-club-btn').addEventListener('click',addClub);
document.getElementById('custom-club-name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addClub();}});
renderClubs();
window.addEventListener('message',event=>{
  const frame=document.getElementById('putting-frame');
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='ji-putting-size')return;
  const height=Number(event.data.height);
  if(Number.isFinite(height)&&height>=200&&height<=15000)frame.style.height=Math.ceil(height)+'px';
});
document.querySelectorAll('#panel-field input,#panel-field select').forEach(el=>{
  el.addEventListener('input',updateField);
  el.addEventListener('change',updateField);
});
updateField();

