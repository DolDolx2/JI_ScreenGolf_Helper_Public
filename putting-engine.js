// Reference-based putting estimates; not an official Golfzon simulator formula.
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  root.JIPutting=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SPEED_POINTS=[[3.1,2.2],[4.5,2.7],[6.8,3.5],[8.6,4.1],[10.2,4.4],[12.8,4.8],[16.1,5.3]];
  function compute({distance,speed,slope='flat',heightCm=0,breakSide='none',breakCups=0}){
    for(const n of [distance,speed,heightCm,breakCups]) if(!Number.isFinite(n)) throw new RangeError('유효한 수치를 입력하세요.');
    if(distance<=0||distance>1000||![2.4,2.6,2.8,3.1].includes(speed)||heightCm<0||heightCm>1000||breakCups<0||breakCups>100||!['up','down','flat'].includes(slope)||!['left','right','none'].includes(breakSide)) throw new RangeError('입력 범위를 확인하세요.');
    const normalized=distance*2.6/speed;
    const slopeAdjustment=slope==='up'?20*(heightCm/100)*(speed/2.6):slope==='down'?-15*(heightCm/100)*(speed/2.6):0;
    const adjustedDistance=Math.max(0.5,normalized+slopeAdjustment);
    const speedEstimate=interpolate(adjustedDistance);
    const effectiveCups=breakSide==='none'?0:breakCups;
    return {adjustedDistance,ballSpeed:speedEstimate.value,ballSpeedExtrapolated:speedEstimate.extrapolated,aimOffsetCm:effectiveCups*5/distance,lateralCm:effectiveCups*10.8,breakSide:effectiveCups===0?'none':breakSide};
  }
  function interpolate(distance){
    let i=0;
    while(i<SPEED_POINTS.length-2 && distance>SPEED_POINTS[i+1][0]) i++;
    const [d1,v1]=SPEED_POINTS[i], [d2,v2]=SPEED_POINTS[i+1];
    return {value:Math.max(0,v1+(distance-d1)*(v2-v1)/(d2-d1)),extrapolated:distance<SPEED_POINTS[0][0]||distance>SPEED_POINTS.at(-1)[0]};
  }
  return Object.freeze({compute,SPEED_POINTS});
});
