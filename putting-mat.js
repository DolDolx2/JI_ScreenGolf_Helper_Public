// Geometrically scaled putting-mat aiming guide (centimetres => SVG units).
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JIMat=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WIDTH_CM=35,LANES=6,BALL_CM=4.3,UNIT=10,TARGET_X=WIDTH_CM*UNIT/2;
function layout({offsetCm,direction}){
 if(!Number.isFinite(offsetCm)||offsetCm<0||!['right','left','none'].includes(direction))throw new RangeError('잘못된 조준값');
 const signed=direction==='right'?offsetCm:direction==='left'?-offsetCm:0;
 // Target is always a conspicuous lane boundary. Move the ball opposite the aim direction.
 const ballX=TARGET_X-signed*UNIT;
 const outside=ballX-BALL_CM*UNIT/2<0||ballX+BALL_CM*UNIT/2>WIDTH_CM*UNIT;
 return {ballX,targetX:TARGET_X,ballRadius:BALL_CM*UNIT/2,laneWidth:WIDTH_CM*UNIT/LANES,
  lanes:Math.abs(signed)/(WIDTH_CM/LANES),signedCm:signed,outside};
}
return Object.freeze({layout,WIDTH_CM,LANES,BALL_CM});
});
