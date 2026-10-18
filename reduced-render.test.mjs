import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from './vendor/three/build/three.module.js';

test('leaving hover in reduced-motion renders the restored object once', () => {
  const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
  const start = source.indexOf(' for(const [id,g] of rigGroups)');
  const end = source.indexOf('if(introPending){introPending=false;', start);
  const step = new Function('rigGroups', 'scaleVector', 'renderer', `
    const labelHover=null,hover=null,reduced=true,elapsed=1/60,loaded=true;
    let labelsDirty=false,pointerDirty=false,transition=null,introPending=false;
    const now=0,meter={reset(){}},scene={},camera={},$=()=>({open:false});
    const updatePortals=()=>{};
    ${source.slice(start, end)}
  `);
  const group = new THREE.Group();
  group.scale.setScalar(1.07);
  let frames = 0;
  step(new Map([['Writing', group]]), new THREE.Vector3(), {render(){frames++;}});
  assert.equal(group.scale.x, 1);
  assert.equal(frames, 1, 'the visible canvas must receive the restored pose');
});
