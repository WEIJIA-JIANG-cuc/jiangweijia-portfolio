import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from './vendor/three/build/three.module.js';

// Run the actual clearance pass, without WebGL, DOM, or a mock scene. This
// catches a tree's canopy and bark being moved independently during setup.
const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const start = source.indexOf('const moved=[];root.traverse');
const end = source.indexOf('\n root.traverse(o=>{if(o.isMesh)', start);
assert.ok(start >= 0 && end > start, 'the production clearance pass must be available');
const kind = source.slice(source.indexOf('function kind('), source.indexOf('function morph('));
const clearCorridor = new Function('root', 'cascadeBounds', 'THREE', `${kind}\n${source.slice(start, end)};return moved;`);

function mesh(name, size, position) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial());
  object.name = name;
  object.position.fromArray(position);
  return object;
}

test('clearing the waterfall never separates a tree trunk from its canopy', () => {
  for (const name of ['V3_Tree_average_lush', 'V3_secondary_broadleaf001', 'V3 Tree_average_lush', 'V3 secondary broadleaf.001']) {
    const root = new THREE.Group();
    const tree = new THREE.Group();
    tree.name = name;
    tree.position.set(0, 1, 0);
    tree.rotation.y = 0.6;
    tree.scale.setScalar(2.5);
    const canopy = mesh('canopy', [1.4, 1, 1.4], [0, 1.3, 0]);
    const trunk = mesh('bark', [0.2, 1, 0.2], [0, 0.5, 0]);
    tree.add(canopy, trunk);
    root.add(tree);
    root.updateMatrixWorld(true);
    const before = [canopy, trunk].map(o => o.matrixWorld.toArray());
    clearCorridor(root, [new THREE.Box3(new THREE.Vector3(-0.2, 1.2, -0.2), new THREE.Vector3(0.2, 2.4, 0.2))], THREE);
    root.updateMatrixWorld(true);
    assert.deepEqual([canopy, trunk].map(o => o.matrixWorld.toArray()), before, name);
  }
});

test('ordinary small plants still move out of the waterfall while water and animals stay in place', () => {
  const root = new THREE.Group();
  const grass = mesh('V3_Grass_bush', [0.2, 0.3, 0.2], [0.05, 1.5, 0]);
  const water = mesh('water', [0.2, 0.3, 0.2], [0.05, 1.5, 0]);
  water.userData.kind = 'lake';
  const bird = mesh('bird', [0.2, 0.3, 0.2], [0.05, 1.5, 0]);
  bird.userData.kind = 'Redstart';
  root.add(grass, water, bird);
  root.updateMatrixWorld(true);
  const corridor = new THREE.Box3(new THREE.Vector3(-0.2, 1.2, -0.2), new THREE.Vector3(0.2, 2.4, 0.2));
  clearCorridor(root, [corridor], THREE);
  assert.ok(!corridor.intersectsBox(new THREE.Box3().setFromObject(grass)), 'the grass must clear the water');
  assert.deepEqual(water.position.toArray(), [0.05, 1.5, 0]);
  assert.deepEqual(bird.position.toArray(), [0.05, 1.5, 0]);
});

// Load only tree and cascade geometry from the shipped GLB. Images, materials,
// and unrelated objects cannot affect the clearance pass; vertices and node
// transforms stay exact. Box3 uses the same conservative local-box corners as
// GLTFLoader, rather than a tighter but non-equivalent vertex-world bound.
function actualVegetation() {
  const bytes = readFileSync(new URL('./assets/island.glb', import.meta.url));
  const jsonSize = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
  const binStart = 20 + jsonSize + 8;
  const root = new THREE.Group();
  const trees = [];
  const cascades = [];
  for (const node of gltf.nodes) {
    if (node.mesh === undefined || (!/^V3 (Tree_|secondary broadleaf)/.test(node.name) && node.extras?.kind !== 'cascade')) continue;
    const parts = gltf.meshes[node.mesh].primitives.map(primitive => {
      const accessor = gltf.accessors[primitive.attributes.POSITION];
      const view = gltf.bufferViews[accessor.bufferView];
      assert.equal(accessor.componentType, 5126);
      const positions = new Float32Array(accessor.count * 3);
      const offset = binStart + (view.byteOffset || 0) + (accessor.byteOffset || 0);
      for (let i = 0; i < accessor.count; i++) for (let j = 0; j < 3; j++) positions[i * 3 + j] = bytes.readFloatLE(offset + i * (view.byteStride || 12) + j * 4);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    });
    const object = parts.length === 1 ? parts[0] : new THREE.Group().add(...parts);
    object.name = THREE.PropertyBinding.sanitizeNodeName(node.name);
    Object.assign(object.userData, node.extras);
    if (node.matrix) object.applyMatrix4(new THREE.Matrix4().fromArray(node.matrix));
    else {
      if (node.translation) object.position.fromArray(node.translation);
      if (node.rotation) object.quaternion.fromArray(node.rotation);
      if (node.scale) object.scale.fromArray(node.scale);
    }
    root.add(object);
    (node.extras?.kind === 'cascade' ? cascades : trees).push(object);
  }
  root.updateMatrixWorld(true);
  return { root, trees, cascadeBounds: cascades.map(o => new THREE.Box3().setFromObject(o)) };
}

test('the actual island keeps all 19 tree trunks attached, including the two displaced rear trunks', () => {
  const { root, trees, cascadeBounds } = actualVegetation();
  assert.equal(trees.length, 19);
  assert.ok(cascadeBounds.length > 0);
  const before = new Map();
  for (const tree of trees) tree.traverse(o => { if (o.isMesh) before.set(o, o.matrixWorld.toArray()); });
  clearCorridor(root, cascadeBounds, THREE);
  root.updateMatrixWorld(true);
  for (const [object, matrix] of before) assert.deepEqual(object.matrixWorld.toArray(), matrix, object.parent?.name || object.name);
});
