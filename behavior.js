export function makeRng(seed=7){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export function createFish(x,z,seed){return{x,z,vx:0,vz:0,angle:0,speed:0,target:null,wait:0,timer:0,rng:makeRng(seed),mode:'巡游'}}
export function stepFish(f,dt,others=[]){
 const r=f.rng;f.timer-=dt;
 if(!f.target||f.timer<=0){const a=r()*Math.PI*2,rad=Math.sqrt(r())*.82;f.target={x:-.9+2.7*rad*Math.cos(a),z:2.45+1.55*rad*Math.sin(a)};f.timer=4+r()*6;f.cruise=.16+r()*.27;if(r()<.3)f.wait=.4+r()*1.2}
 f.wait=Math.max(0,f.wait-dt);let dx=f.target.x-f.x,dz=f.target.z-f.z;const dist=Math.hypot(dx,dz);if(dist<.22)f.timer=0;
 for(const o of others){if(o===f)continue;const d=Math.hypot(f.x-o.x,f.z-o.z);if(d>.01&&d<.55){dx+=(f.x-o.x)/d*(.55-d)*3;dz+=(f.z-o.z)/d*(.55-d)*3}}
 const q=((f.x+.9)/2.8)**2+((f.z-2.45)/1.6)**2;if(q>.82){dx+=(-.9-f.x)*4;dz+=(2.45-f.z)*4}
 const desired=Math.atan2(dx,dz);let turn=Math.atan2(Math.sin(desired-f.angle),Math.cos(desired-f.angle));const limit=.8*dt;f.angle+=Math.max(-limit,Math.min(limit,turn));
 const targetSpeed=f.wait>0?.025:f.cruise*(1-.55*Math.min(1,Math.abs(turn)/Math.PI));f.speed+=(targetSpeed-f.speed)*(1-Math.exp(-dt*2));f.vx=Math.sin(f.angle)*f.speed;f.vz=Math.cos(f.angle)*f.speed;f.x+=f.vx*dt;f.z+=f.vz*dt;f.mode=f.wait>0?'悬停':Math.abs(turn)>.4?'缓慢转向':'巡游';return f;
}
