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
    recommendationEl.textContent=renderRecommendation(JIClub.recommend(r.finalDistance,settings.clubs));
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
for(const row of document.querySelectorAll('[data-club]')){
  const key=row.dataset.club;
  const minInput=row.querySelector('[data-bound="min"]');
  const maxInput=row.querySelector('[data-bound="max"]');
  const saved=settings.clubs[key];
  if(saved){minInput.value=String(saved.min);maxInput.value=String(saved.max);}
  const changed=()=>{
    const status=document.getElementById('club-status');
    const emptyMin=minInput.value.trim()==='';
    const emptyMax=maxInput.value.trim()==='';
    if(emptyMin&&emptyMax){
      JISettings.setClub(settings,key,null,null);
      status.textContent=saveSettings()?'미등록 상태로 저장했습니다.':'브라우저 저장에 실패했습니다.';
      updateField();
      return;
    }
    if(emptyMin||emptyMax||!JISettings.setClub(settings,key,Number(minInput.value),Number(maxInput.value))){
      status.textContent='최소·최대 거리를 모두 입력하세요(0~1,000m, 최소 ≤ 최대). 기존 유효값은 보존됩니다.';
      return;
    }
    status.textContent=saveSettings()?'클럽 거리 저장 완료':'브라우저 저장에 실패했습니다.';
    updateField();
  };
  minInput.addEventListener('change',changed);
  maxInput.addEventListener('change',changed);
}
document.querySelectorAll('#panel-field input,#panel-field select').forEach(el=>{
  el.addEventListener('input',updateField);
  el.addEventListener('change',updateField);
});
updateField();

function updateMatGuide(offsetCm,direction){
  const text=document.getElementById('mat-guide-text');
  const desc=document.getElementById('mat-desc');
  const ball=document.getElementById('mat-ball');
  const line=document.getElementById('mat-aim-line');
  if(offsetCm===null){
    ball.setAttribute('cx','175');line.setAttribute('x1','175');
    text.textContent='퍼팅 거리를 입력하면 공의 시작 위치를 표시합니다.';
    desc.textContent=text.textContent;
    return;
  }
  const p=JIMat.layout({offsetCm,direction});
  ball.setAttribute('cx',String(p.ballX));
  line.setAttribute('x1',String(p.ballX));
  const side=direction==='right'?'우측':direction==='left'?'좌측':'중앙';
  text.textContent=p.outside
    ?side+' '+offsetCm.toFixed(1)+'cm: 공이 매트 표시 범위를 벗어납니다. 정확한 거리는 수치로 확인하세요.'
    :side+' '+offsetCm.toFixed(1)+'cm · '+p.lanes.toFixed(2)+'칸 · 고정 경계선 방향으로 조준';
  desc.textContent='기준 경계선 x=175, 공 중심 x='+p.ballX.toFixed(1)+'. '+text.textContent;
}
function updatePutting(){
  const value=id=>document.getElementById(id).value;
  const distanceText=value('putting-distance');
  const outputs=['putting-result-distance','putting-result-speed','putting-result-aim','putting-result-lateral'].map(id=>document.getElementById(id));
  const status=document.getElementById('putting-status');
  if(!distanceText.trim()){outputs.forEach(el=>el.textContent='입력 대기');status.textContent='남은 거리를 입력하면 자동 계산합니다.';updateMatGuide(null,'none');return;}
  try{
    const result=JIPutting.compute({
      distance:Number(distanceText),speed:Number(value('green-speed')),
      slope:value('putting-slope'),heightCm:value('putting-height').trim()?Number(value('putting-height')):0,
      breakSide:value('putting-break-side'),breakCups:value('putting-break-cups').trim()?Number(value('putting-break-cups')):0
    });
    const side=result.breakSide==='none'?'없음':result.breakSide==='right'?'오른쪽':'왼쪽';
    outputs[0].textContent=result.adjustedDistance.toFixed(1)+' m';
    outputs[1].textContent=result.ballSpeed.toFixed(2)+' m/s';
    outputs[2].textContent=result.breakSide==='none'?'보정 없음':side+' '+result.aimOffsetCm.toFixed(1)+' cm';
    outputs[3].textContent=result.lateralCm.toFixed(1)+' cm';
    updateMatGuide(result.aimOffsetCm,result.breakSide);
    status.textContent=result.ballSpeedExtrapolated?'볼스피드는 참고 실측표 범위 밖 외삽 추정치입니다. 실제 측정값으로 검증이 필요합니다.':'참고 경험식에 따른 예상 결과입니다.';
  }catch(e){outputs.forEach(el=>el.textContent='확인 필요');status.textContent=e.message;updateMatGuide(null,'none');}
}
document.querySelectorAll('#putting-inputs input,#putting-inputs select').forEach(el=>{
  el.addEventListener('input',updatePutting);
  el.addEventListener('change',updatePutting);
});
updatePutting();
