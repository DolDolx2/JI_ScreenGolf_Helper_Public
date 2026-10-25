// Independent, reference-based field estimates. Not an official game algorithm.
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  root.JIField=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TYPES=['iron','wedge','wood','driver','utility'];
  const WINDS=['calm','head','tail','fromLeft','fromRight'];
  const LIES=['fairway','normalRough','heavyRough','fairwayBunker','greenBunker'];
  function compute({distance,height=0,club='iron',wind='calm',windSpeed=0,lie='fairway',penalty=0}){
    if(![distance,height,windSpeed,penalty].every(Number.isFinite) ||
      distance<=0 || distance>1000 || Math.abs(height)>300 ||
      windSpeed<0 || windSpeed>60 || penalty<0 || penalty>100 ||
      !TYPES.includes(club) || !WINDS.includes(wind) || !LIES.includes(lie)){
      throw new RangeError('거리·높낮이·풍속·페널티 입력 범위를 확인하세요.');
    }
    // Source says 50–70% adjustment for downhill wedges: 60% midpoint is provisional.
    const slopeFactor=club==='wedge'&&height<0?0.6:1;
    const slopeChange=height*slopeFactor;
    const slopeDistance=Math.max(0, distance+slopeChange);
    // Iron/wedge 1m per 1m/s; wood/driver 1.75m midpoint. Utility provisional 1.5m.
    const windFactor=club==='wood'||club==='driver'?1.75:club==='utility'?1.5:1;
    const windChange=wind==='head'?windSpeed*windFactor:wind==='tail'?-windSpeed*windFactor:0;
    const prePenalty=Math.max(0,slopeDistance+windChange);
    const lateral=wind==='fromRight'?windSpeed*distance/100:wind==='fromLeft'?-windSpeed*distance/100:0;
    const penaltyAdded=prePenalty*penalty/100;
    return {distance,slopeChange,slopeDistance,windChange,prePenalty,penalty,penaltyAdded,
      finalDistance:prePenalty+penaltyAdded, lateral, aim: lateral>0?'right':lateral<0?'left':'none',
      assumptions:{slopeFactor,windFactor}};
  }
  return Object.freeze({compute,TYPES,WINDS,LIES});
});
