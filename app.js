import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createFish,stepFish,makeRng} from './behavior.js';
import {sampleFlight,layoutLabels} from './navigation.js';
import {catalog as projects} from './content.js';
import {assets} from './assets-manifest.js';
import {contentMarkup} from './content-view.js';
import {readingRecord} from './reading.js';
import {prepareMaterial,matchesObject} from './scene-quality.js';
import {birdHop,idleMotion} from './wildlife-motion.js';
import {FrameMeter,choosePixelRatio} from './performance-policy.js';
import {batchStaticMeshes,batchInteractiveGroup} from './scene-batch.js';

const $=id=>document.getElementById(id),canvas=$('world'),scene=new THREE.Scene();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const maximumPixelRatio=Math.min(devicePixelRatio,matchMedia('(pointer: coarse)').matches?1.35:1.6),meter=new FrameMeter();let lastQualityChange=performance.now();
renderer.setPixelRatio(maximumPixelRatio);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
// A smooth cyan-to-milk sky, without cloud geometry or image dependencies.
const skyCanvas=document.createElement('canvas');skyCanvas.width=2;skyCanvas.height=128;
const ctx=skyCanvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,128);gradient.addColorStop(0,'#55b5d4');gradient.addColorStop(.55,'#99d9df');gradient.addColorStop(1,'#e1f1de');ctx.fillStyle=gradient;ctx.fillRect(0,0,2,128);
scene.background=new THREE.CanvasTexture(skyCanvas);scene.background.colorSpace=THREE.SRGBColorSpace;
const camera=new THREE.OrthographicCamera(-12,12,7,-7,.05,200);camera.position.set(8,17,23);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,3,0);controls.enableDamping=true;controls.dampingFactor=.085;controls.enablePan=false;controls.rotateSpeed=.5;controls.zoomSpeed=.65;controls.minZoom=.8;controls.maxZoom=5.5;controls.minPolarAngle=.45;controls.maxPolarAngle=1.12;controls.minAzimuthAngle=-.45;controls.maxAzimuthAngle=.85;controls.update();
scene.add(new THREE.HemisphereLight(0xe5f7f0,0x8eaa78,1.6));
const sun=new THREE.DirectionalLight(0xffefca,2.5);sun.position.set(-7,15,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:11,bottom:-9,near:.5,far:45});sun.shadow.normalBias=.04;sun.shadow.bias=-.0003;scene.add(sun);
const fill=new THREE.DirectionalLight(0xbbeff5,.55);fill.position.set(8,6,-7);scene.add(fill);
function resize(){renderer.setSize(innerWidth,innerHeight);const r=innerWidth/innerHeight,s=r<1?16/r:14;camera.left=-s*r/2;camera.right=s*r/2;camera.top=s/2;camera.bottom=-s/2;camera.updateProjectionMatrix();if(loaded)labelsDirty=true}addEventListener('resize',resize);

const objectRules={GameProduct:/Observation console|Console instrument|Console indicator/,Photography:/Telescope/,VibeCoding:/Culture|Glass frame|Code tree|Code canopy|Code seed/,Writing:/Writing paper/,Content:/Notice board|Notice post|Board field/,Experience:/Island map|Exploration route/,Contact:/ID badge|ID photo|ID lanyard/};
const animals=[],fish=[],hotspots=[],pickables=[],waterUniforms=[],rng=makeRng(20261003),pointer=new THREE.Vector2(9,9),ray=new THREE.Raycaster();let loaded=false,t=0,hover=null,hoverSince=0,down=null,transition=null,previous=performance.now(),lastPick=0,frameCount=0,fpsStart=previous;
const rigGroups=new Map();let root;
const portalMeta={GameProduct:['游戏与产品',-115,-65,172],Photography:['摄影',105,50,144],VibeCoding:['创意编程',-15,-126,138],Writing:['写作',-140,22,126],Content:['内容与运营',140,-75,188],Experience:['个人经历',-50,118,166],Contact:['联系我',120,112,126]};
const portals=new Map(),viewVector=new THREE.Vector3(),scaleVector=new THREE.Vector3(),viewMatrix=new THREE.Matrix4(),currentView=new THREE.Matrix4();
let tourReady=false,introPending=false,labelsDirty=true,pointerDirty=true,labelHover=null,returnView=null,returnFocus=null,viewMode='work';
const islandView={target:[0,3,0],position:[8,17,23],zoom:1},workTarget=new THREE.Vector3();
resize();
function kind(o){for(let p=o;p;p=p.parent)if(p.userData.kind)return p.userData.kind;return ''}
function morph(o,name,v){for(const m of o.userData.morphMeshes||[]){const i=m.morphTargetDictionary?.[name];if(i!==undefined)m.morphTargetInfluences[i]=v}}
function water(fall){const uniforms={uTime:{value:0},uFall:{value:fall?1:0}};waterUniforms.push(uniforms);return new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
 vertexShader:`varying vec3 vP;uniform float uTime;uniform float uFall;void main(){vec4 p=modelMatrix*vec4(position,1.);vP=p.xyz;if(uFall<.5)p.y+=.004*sin(p.x*7.+uTime)*cos(p.z*6.-uTime);gl_Position=projectionMatrix*viewMatrix*p;}`,
 fragmentShader:`varying vec3 vP;uniform float uTime;uniform float uFall;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}void main(){float a=sin(vP.x*4.+vP.z*3.+uTime*.35)*sin(vP.z*3.-uTime*.28);float shimmer=pow(max(0.,sin(vP.x*8.+sin(vP.z*5.+uTime*.3))*cos(vP.z*7.-uTime*.24)),8.);vec3 c=mix(vec3(.19,.65,.65),vec3(.56,.88,.79),.35+a*.08)+shimmer*.055;float opacity=.34+shimmer*.025;if(uFall>.5){float flow=n(vec2(vP.x*13.+vP.z*5.,vP.y*2.5+uTime*1.65));float thread=pow(max(0.,sin(vP.x*35.+vP.z*8.+flow*2.)),6.);float s=flow*.35+thread*.25;c=mix(vec3(.43,.80,.78),vec3(.91,.98,.91),s);opacity=.46+s*.22;}gl_FragColor=vec4(c,opacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})}
function batch(){batchStaticMeshes(root,scene,kind)}
function setup(gltf){root=gltf.scene;scene.add(root);root.updateMatrixWorld(true);const remove=[],cascadeBounds=[],preparedMaterials=new Set(),anisotropy=renderer.capabilities.getMaxAnisotropy();
 root.traverse(o=>{if(kind(o)==='cascade'&&o.isMesh)cascadeBounds.push(new THREE.Box3().setFromObject(o));if(o.name.startsWith('V3 distant')||(o.isMesh&&o.getWorldPosition(new THREE.Vector3()).length()>12))remove.push(o)});remove.forEach(o=>o.removeFromParent());
 // Trees are whole assets: their separate canopy/bark primitives must never
 // be mistaken for short plants and displaced independently by water clearance.
 const moved=[];root.traverse(o=>{if(!o.isMesh||kind(o)||/rock|stone|boulder|island|topograph|water|shore|floor|ground|foam|ripple|edge/i.test(o.name))return;for(let p=o;p;p=p.parent)if(/^V3[ _](?:Tree_|secondary[ _]broadleaf)/.test(p.name))return;let box=new THREE.Box3().setFromObject(o);if(box.max.y-box.min.y>2.8)return;for(const b of cascadeBounds){if(b.clone().expandByScalar(.08).intersectsBox(box)){const right=(box.min.x+box.max.x)>(b.min.x+b.max.x);o.position.x+=right?b.max.x-box.min.x+.18:b.min.x-box.max.x-.18;o.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(o);if(!moved.includes(o.name))moved.push(o.name)}}});
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])prepareMaterial(m,anisotropy,preparedMaterials)}
  if(o.name==='ISLAND_Topography'&&o.isMesh){const pos=o.geometry.attributes.position,colors=new Float32Array(pos.count*3),p=new THREE.Vector3(),land=new THREE.Color(.36,.56,.16),bed=new THREE.Color(.10,.38,.34);for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);const u=THREE.MathUtils.smoothstep(p.y,.62,.78),c=bed.clone().lerp(land,u);c.toArray(colors,i*3)}o.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));o.material.vertexColors=true;o.material.color.setRGB(1,1,1);o.material.needsUpdate=true}
  const k=o.userData.kind;if(k==='fish'){const p=o.getWorldPosition(new THREE.Vector3()),f={o,state:createFish(p.x,p.z,103+fish.length*997),y:p.y,phase:fish.length*2};fish.push(f);o.traverse(m=>{if(!m.isMesh)return;m.geometry.computeBoundingBox();const b=m.geometry.boundingBox,span=b.max.z-b.min.z,u={value:f.phase};m.userData.swim=u;const mat=m.material.clone();mat.onBeforeCompile=s=>{s.uniforms.swimTime=u;s.vertexShader='uniform float swimTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfloat tail=clamp((position.z-(${b.min.z}))/${span},0.,1.);transformed.x+=sin(swimTime-tail*4.)*${span*.025}*tail*tail;`)};mat.customProgramCacheKey=()=>`fish-v6-${span}`;m.material=mat})}
  if(['WhiteWagtail','Redstart','LeopardCat','TreeFrog'].includes(k)){o.userData.base=o.position.clone();o.userData.baseScale=o.scale.clone();o.userData.next=2+rng()*7;o.userData.until=0;o.userData.rest=0;o.userData.morphMeshes=[];o.traverse(m=>{if(m.morphTargetDictionary)o.userData.morphMeshes.push(m)});if(k==='WhiteWagtail'){const proxy=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),new THREE.MeshBasicMaterial({visible:false}));new THREE.Box3().setFromObject(o).getCenter(proxy.position);proxy.userData.interactive='Badge';scene.add(proxy);pickables.push(proxy)}animals.push(o)}
  if(k==='cascade'||k==='lake')o.traverse(m=>{if(m.isMesh){m.material=water(k==='cascade');m.castShadow=false;m.renderOrder=2}});
  if(k==='hotspot'){const id=o.userData.hotspotId.replace('HOTSPOT_','');if(projects[id])hotspots.push({id,anchor:o})}
 });
 // Group the actual desk items around their individual anchors so feedback moves the object.
 for(const entry of hotspots){const g=new THREE.Group();scene.add(g);entry.anchor.getWorldPosition(g.position);g.userData.id=entry.id;g.userData.baseScale=1;const matches=[];root.traverse(o=>{if(o.isMesh&&matchesObject(o.name,objectRules[entry.id]))matches.push(o)});for(const m of matches)g.attach(m);pickables.push(...batchInteractiveGroup(g));entry.group=g;rigGroups.set(entry.id,g);
  const proxy=new THREE.Mesh(new THREE.SphereGeometry(entry.id==='VibeCoding'?.42:entry.id==='Contact'?.13:entry.id==='Experience'?.2:entry.id==='Writing'?.18:.28,8,6),new THREE.MeshBasicMaterial({visible:false}));entry.anchor.getWorldPosition(proxy.position);proxy.userData.interactive=entry.id;scene.add(proxy);pickables.push(proxy);
 }
 for(const h of hotspots){workTarget.add(h.group.position);createPortal(h)}workTarget.divideScalar(Math.max(1,hotspots.length));
 fish.forEach(f=>{f.swimUniforms=[];f.o.traverse(m=>{if(m.userData.swim)f.swimUniforms.push(m.userData.swim)})});
 batch();scene.updateMatrixWorld(true);scene.matrixWorldAutoUpdate=false;renderer.shadowMap.needsUpdate=true;loaded=true;introPending=true;$('loading').hidden=true;window.observatory.ready=true;window.observatory.movedPlants=moved;
}
new GLTFLoader().load('./assets/island.glb',setup,e=>{$('progress').textContent=e.total?`正在准备浮岛 / Preparing the island… ${Math.round(e.loaded/e.total*100)}%`:'正在准备浮岛 / Preparing the island…'},e=>{$('progress').textContent='浮岛加载失败 / Unable to load the island.';$('retry').hidden=false;console.error(e)});$('retry').onclick=()=>location.reload();
function setPointer(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);pointerDirty=true}
function hit(){ray.setFromCamera(pointer,camera);const intersections=ray.intersectObjects(pickables,false);return intersections[0]?.object.userData.interactive||null}
canvas.addEventListener('pointermove',e=>{setPointer(e);if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down.dragged=true;$('label').hidden=true}});
canvas.addEventListener('pointerdown',e=>{setPointer(e);down={x:e.clientX,y:e.clientY,dragged:false};interruptFlight()},{capture:true});
canvas.addEventListener('pointerup',e=>{setPointer(e);const d=down;down=null;if(!d||d.dragged)return;const id=hit();if(id)openProject(id)});
canvas.addEventListener('pointercancel',()=>down=null);canvas.addEventListener('pointerleave',()=>{pointer.set(9,9);pointerDirty=true;hover=null});canvas.addEventListener('wheel',interruptFlight,{passive:true,capture:true});
function captureView(){return {target:controls.target.toArray(),position:camera.position.toArray(),zoom:camera.zoom}}
function applyView(v){controls.target.fromArray(v.target);camera.position.fromArray(v.position);camera.zoom=v.zoom;camera.updateProjectionMatrix();labelsDirty=true;pointerDirty=true}
function flyTo(to,options={}){transition={start:performance.now(),from:captureView(),to,options:{duration:options.duration??2600,delay:options.delay??0,reduced}};controls.enableDamping=false;controls.enabled=false}
function revealPortals(){tourReady=true;labelsDirty=true;$('view-toggle').hidden=false;updateViewButton();updatePortals();if(!$('preview').open&&returnFocus){const target=returnFocus;returnFocus=null;(target.isConnected&&target.getClientRects().length?target:canvas).focus({preventScroll:true})}}
function interruptFlight(){if(transition){transition=null;controls.enableDamping=true;controls.enabled=true;revealPortals()}}
function workView(){const delta=workTarget.clone().sub(new THREE.Vector3(...islandView.target));return {target:workTarget.toArray(),position:new THREE.Vector3(...islandView.position).add(delta).toArray(),zoom:innerWidth<700?3.7:2.65}}
function focusWork(options={}){viewMode='work';flyTo(workView(),options);updateViewButton()}
function focusIsland(){viewMode='island';flyTo(islandView,{duration:1300});updateViewButton()}
function updateViewButton(){$('view-toggle').textContent=viewMode==='work'?'Whole island / 全岛':'Work area / 作品区'}
$('view-toggle').onclick=()=>viewMode==='work'?focusIsland():focusWork({duration:1500});
function createPortal(h){const meta=portalMeta[h.id],button=document.createElement('button');button.type='button';button.className='portal';button.dataset.project=h.id;button.setAttribute('aria-label',`${projects[h.id].title}，${meta[0]}，点击查看 / Click to explore`);const body=document.createElement('span');body.className='portal-body';const en=document.createElement('span'),zh=document.createElement('small');en.textContent=projects[h.id].label;zh.textContent=meta[0]+' ↗';body.append(en,zh);button.append(body);button.style.width=meta[3]+'px';button.onclick=()=>openProject(h.id);button.onpointerenter=()=>{labelHover=h.id};button.onpointerleave=()=>{labelHover=null;pointerDirty=true};button.onfocus=()=>labelHover=h.id;button.onblur=()=>labelHover=null;$('portals').append(button);const line=document.createElementNS('http://www.w3.org/2000/svg','line');$('leaders').append(line);portals.set(h.id,{button,line,width:meta[3],height:52,dx:meta[1],dy:meta[2]})}
function updatePortals(){const visible=tourReady&&!transition&&!$('preview').open;$('portals').hidden=!visible;$('leaders').hidden=!visible;if(!visible)return;const items=[];for(const h of hotspots){viewVector.copy(h.group.position).project(camera);const p=portals.get(h.id);if(viewVector.z<-1||viewVector.z>1){p.button.hidden=true;p.line.style.display='none';continue}items.push({id:h.id,x:(viewVector.x+1)*innerWidth/2,y:(1-viewVector.y)*innerHeight/2,width:p.width,height:p.height,dx:p.dx,dy:p.dy})}for(const item of layoutLabels(items,innerWidth,innerHeight)){const p=portals.get(item.id);p.button.hidden=!item.visible;p.line.style.display=item.visible?'':'none';if(!item.visible)continue;p.button.style.transform=`translate3d(${item.x}px,${item.y}px,0)`;p.line.setAttribute('x1',item.anchorX);p.line.setAttribute('y1',item.anchorY);p.line.setAttribute('x2',Math.min(item.x+item.width-12,Math.max(item.x+12,item.anchorX)));p.line.setAttribute('y2',item.y+item.height/2)}}
function openProject(id){
 const p=readingRecord(id);if(!p||!loaded||$('preview').open||(id!=='Badge'&&!rigGroups.has(id)))return;
 interruptFlight();returnView=captureView();returnFocus=document.activeElement;
 $('category').textContent=p.label;$('title').textContent=p.title;$('work-list').innerHTML=contentMarkup(p,assets);
 $('label').hidden=true;$('preview').showModal();$('close').focus({preventScroll:true});$('work-list').scrollTop=0;controls.enabled=false;labelsDirty=true;updatePortals();
}
function closePreview(){if(!$('preview').open)return;$('preview').close();$('work-list').replaceChildren();controls.enabled=true;labelHover=null;hover=null;pointerDirty=true;if(returnView){flyTo(returnView,{duration:450});returnView=null}else revealPortals()}
// An embedded original can request Escape-close, never an unrelated window.
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='portfolio-close')return;const frame=$('work-list').querySelector('[data-original-frame]');if(frame&&event.source===frame.contentWindow)closePreview()});
$('close').onclick=closePreview;$('back').onclick=closePreview;$('preview').addEventListener('cancel',e=>{e.preventDefault();closePreview()});$('preview').addEventListener('click',e=>{if(e.target===$('preview')){const r=$('preview').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePreview()}});
canvas.addEventListener('keydown',e=>{if(e.key==='Escape')focusIsland();if(e.key==='Enter'){const id=hit();if(id)openProject(id)}});
function animate(dt){t+=dt;const states=fish.map(v=>v.state);for(const f of fish){stepFish(f.state,dt,states);f.phase+=dt*(2+f.state.speed*10);f.o.position.set(f.state.x,f.y+.008*Math.sin(t*.8),f.state.z);f.o.rotation.y=f.state.angle;for(const u of f.swimUniforms)u.value=f.phase;f.o.updateMatrixWorld(true)}
 for(const o of animals){const k=o.userData.kind,b=o.userData.base;const a=o.userData,pose=idleMotion(k,t);if(t>a.next){a.start=t;a.until=t+.58;a.next=a.until+5+rng()*9;a.to=a.rest>.1?0:.18}const u=(t-(a.start??-100))/Math.max(.01,a.until-(a.start??0)),active=u>=0&&u<=1;
  o.scale.copy(a.baseScale);o.scale.y*=1+pose.breath;
  if(k==='WhiteWagtail'){morph(o,'Preen',0);morph(o,'Tail',pose.tail)}
  if(k==='Redstart'){if(!active&&a.hopping){a.rest=a.to;a.hopping=false}const hop=active?birdHop(u,a.rest,a.to):{offset:a.rest,lift:0,tail:0,lean:0};if(active)a.hopping=true;o.position.set(b.x+hop.offset,b.y+hop.lift,b.z+hop.offset*.25);morph(o,'Preen',0);morph(o,'Tail',Math.max(pose.tail,hop.tail))}
  if(k==='LeopardCat'){morph(o,'EarLeft',pose.earLeft);morph(o,'EarRight',pose.earRight)}
  o.updateMatrixWorld(true);
 }
 waterUniforms.forEach(u=>u.uTime.value=t);
}
const gl=renderer.getContext(),gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');
window.observatory={ready:false,stats:{},movedPlants:[],renderer:gpuInfo?gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL):'Unavailable',snapshot:()=>({time:t,view:captureView(),tourReady,viewMode,fish:fish.map(f=>({x:f.state.x,z:f.state.z,heading:f.o.rotation.y,angle:f.state.angle,speed:f.state.speed})),animals:animals.map(o=>({kind:o.userData.kind,morphs:o.morphTargetInfluences})),hotspots:hotspots.map(h=>{const p=h.group.position.clone().project(camera);return{id:h.id,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}})}),openProject,focusWork,focusIsland};
function frame(now){requestAnimationFrame(frame);const elapsed=Math.min((now-previous)/1000,.15);previous=now;if(document.hidden){meter.reset(now);return;}
 if(loaded&&$('preview').open&&!transition){meter.reset(now);return;}
 if(loaded&&!reduced&&!$('preview').open){let remaining=elapsed;while(remaining>0){const dt=Math.min(remaining,1/30);animate(dt);remaining-=dt}}
 if(transition){const v=sampleFlight(transition.from,transition.to,now-transition.start,transition.options);applyView(v);if(v.done){transition=null;controls.enableDamping=true;controls.enabled=!$('preview').open;revealPortals()}}controls.update();camera.updateMatrixWorld();
 currentView.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);if(!viewMatrix.equals(currentView)){viewMatrix.copy(currentView);labelsDirty=true;pointerDirty=true}
 if(loaded&&pointerDirty&&now-lastPick>80){lastPick=now;pointerDirty=false;hover=down||$('preview').open?null:hit();canvas.style.cursor=down?'grabbing':hover?'pointer':'grab'}
 for(const [id,g] of rigGroups){const selected=(labelHover||hover)===id&&!$('preview').open,scale=selected?1.07:1;if(Math.abs(g.scale.x-scale)>.0001){g.scale.lerp(scaleVector.setScalar(scale),reduced?1:1-Math.exp(-elapsed*10));g.updateMatrixWorld(true);labelsDirty=true}}
 const needsRender=labelsDirty||pointerDirty||transition||introPending||hover||labelHover;
 if(labelsDirty){updatePortals();labelsDirty=false}
 if(loaded&&reduced&&!needsRender){meter.reset(now);return;}
 renderer.render(scene,camera);if(introPending){introPending=false;focusWork({delay:450})}const stats=meter.sample(now);if(stats){window.observatory.stats={fps:Math.round(stats.fps),p95FrameMs:Math.round(stats.p95),triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,pixelRatio:renderer.getPixelRatio(),antialias:gl.getContextAttributes().antialias,shadowSize:sun.shadow.mapSize.x};if(loaded&&!transition&&now-lastQualityChange>8000){const ratio=choosePixelRatio(renderer.getPixelRatio(),maximumPixelRatio,stats.fps);if(ratio!==renderer.getPixelRatio()){renderer.setPixelRatio(ratio);resize()}lastQualityChange=now}}}
requestAnimationFrame(frame);
