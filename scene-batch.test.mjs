import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import * as THREE from './vendor/three/build/three.module.js';

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return { url: new URL('./vendor/three/build/three.module.js', import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { batchStaticMeshes, batchInteractiveGroup } = await import('./scene-batch.js');

function fixture() {
  const scene = new THREE.Scene(), root = new THREE.Group();
  root.position.set(3, 2, -1);
  root.rotation.y = .4;
  scene.add(root);
  return { scene, root, material: new THREE.MeshStandardMaterial() };
}
function worldVertices(mesh) {
  mesh.updateWorldMatrix(true, false);
  const position = mesh.geometry.attributes.position, vector = new THREE.Vector3();
  return Array.from({ length: position.count }, (_, i) => vector.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).toArray());
}
function assertVertices(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((p, i) => p.forEach((value, axis) => assert.ok(Math.abs(value - expected[i][axis]) < 1e-5)));
}
function watchClones(geometry, disposed) {
  const original = geometry.clone;
  geometry.clone = function () {
    const clone = original.call(this);
    clone.addEventListener('dispose', () => disposed.push(clone));
    return clone;
  };
}

test('a single static mesh keeps its object, geometry and exact world placement', () => {
  const { scene, root, material } = fixture();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
  mesh.position.set(1, 2, 3); root.add(mesh);
  const geometry = mesh.geometry, before = worldVertices(mesh), disposed = [];
  watchClones(geometry, disposed);
  batchStaticMeshes(root, scene, () => '');
  assert.equal(mesh.parent, root);
  assert.equal(mesh.geometry, geometry);
  assert.equal(disposed.length, 0);
  assertVertices(worldVertices(mesh), before);
  assert.equal(scene.children.length, 1);
});

test('multiple compatible meshes merge with all triangles and world positions intact', () => {
  const { scene, root, material } = fixture(), disposed = [];
  const a = new THREE.Mesh(new THREE.BoxGeometry(), material), b = new THREE.Mesh(new THREE.BoxGeometry(), material);
  a.position.set(-2, .4, 1); b.position.set(2, 1, -1); b.rotation.z = .2;
  root.add(a, b);
  const expected = [...worldVertices(a), ...worldVertices(b)];
  const triangles = (a.geometry.index.count + b.geometry.index.count) / 3;
  watchClones(a.geometry, disposed); watchClones(b.geometry, disposed);
  batchStaticMeshes(root, scene, () => '');
  const merged = scene.children.find(child => child.isMesh);
  assert.ok(merged);
  assert.equal(merged.geometry.index.count / 3, triangles);
  assert.equal(merged.material, material);
  assert.equal(a.parent, null); assert.equal(b.parent, null);
  assertVertices(worldVertices(merged), expected);
  assert.equal(disposed.length, 2);
});

test('interactive, animal, morph and multiple-material meshes stay independent', () => {
  const { scene, root, material } = fixture();
  const meshes = Array.from({ length: 4 }, () => new THREE.Mesh(new THREE.BoxGeometry(), material));
  meshes[0].userData.interactive = 'Contact';
  meshes[1].userData.kind = 'fish';
  meshes[2].morphTargetInfluences = [0];
  meshes[3].material = [material];
  root.add(...meshes);
  batchStaticMeshes(root, scene, object => object.userData.kind || '');
  assert.deepEqual(root.children, meshes);
  assert.equal(scene.children.length, 1);
});

test('an incompatible merge preserves original meshes and disposes temporary clones', () => {
  const { scene, root, material } = fixture(), disposed = [];
  const a = new THREE.Mesh(new THREE.BoxGeometry(), material), b = new THREE.Mesh(new THREE.BoxGeometry(), material);
  b.geometry.attributes.position.normalized = true;
  root.add(a, b);
  const before = [...worldVertices(a), ...worldVertices(b)];
  watchClones(a.geometry, disposed); watchClones(b.geometry, disposed);
  const reportError = console.error;
  // The real vendor merger reports expected incompatible input via console.error.
  console.error = () => {};
  try { batchStaticMeshes(root, scene, () => ''); } finally { console.error = reportError; }
  assert.equal(a.parent, root); assert.equal(b.parent, root);
  assert.equal(scene.children.length, 1);
  assertVertices([...worldVertices(a), ...worldVertices(b)], before);
  assert.equal(disposed.length, 2);
});

test('interactive group batching reduces mesh draws while preserving transformed world vertices and hover scaling', () => {
  const { scene, root: group, material } = fixture();
  group.userData.id = 'GameProduct';
  group.scale.set(1.2, .8, 1.4);
  const a = new THREE.Mesh(new THREE.BoxGeometry(), material), b = new THREE.Mesh(new THREE.BoxGeometry(), material);
  a.position.set(1, 2, 3); b.position.set(-1, .5, 2); b.rotation.z = .25;
  group.add(a, b);
  const position = group.position.clone(), rotation = group.quaternion.clone(), scale = group.scale.clone();
  const before = [...worldVertices(a), ...worldVertices(b)];
  const triangles = (a.geometry.index.count + b.geometry.index.count) / 3;
  const pickables = batchInteractiveGroup(group);
  assert.equal(pickables.length, 1);
  assert.deepEqual(pickables, group.children.filter(child => child.isMesh));
  const merged = pickables[0];
  assert.equal(merged.userData.interactive, 'GameProduct');
  assert.equal(merged.geometry.index.count / 3, triangles);
  assert.equal(merged.castShadow, true); assert.equal(merged.receiveShadow, true);
  assert.equal(a.parent, null); assert.equal(b.parent, null);
  assertVertices(worldVertices(merged), before);
  assert.ok(group.position.equals(position));
  assert.ok(group.quaternion.equals(rotation));
  assert.ok(group.scale.equals(scale));
  group.scale.multiplyScalar(1.07);
  const localOrigin = group.getWorldPosition(new THREE.Vector3());
  const afterHover = before.map(p => p.map((v, axis) => localOrigin.toArray()[axis] + (v - localOrigin.toArray()[axis]) * 1.07));
  assertVertices(worldVertices(merged), afterHover);
  assert.equal(scene.children[0], group);
});

test('interactive singletons retain identity and all direct meshes remain pickable', () => {
  const { root: group, material } = fixture();
  group.userData.id = 'Writing';
  const single = new THREE.Mesh(new THREE.BoxGeometry(), material);
  const morph = new THREE.Mesh(new THREE.BoxGeometry(), material); morph.morphTargetInfluences = [0];
  const multi = new THREE.Mesh(new THREE.BoxGeometry(), [material]);
  const nested = new THREE.Group(); nested.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  group.add(single, morph, multi, nested);
  const geometry = single.geometry;
  const pickables = batchInteractiveGroup(group);
  assert.deepEqual(pickables, [single, morph, multi]);
  assert.equal(single.geometry, geometry);
  assert.ok(pickables.every(mesh => mesh.userData.interactive === 'Writing'));
  assert.ok(pickables.every(mesh => mesh.parent === group));
  assert.equal(nested.children.length, 1);
});

test('failed interactive group merges preserve meshes and dispose temporary geometry', () => {
  const { root: group, material } = fixture(), disposed = [];
  group.userData.id = 'Content';
  const a = new THREE.Mesh(new THREE.BoxGeometry(), material), b = new THREE.Mesh(new THREE.BoxGeometry(), material);
  b.geometry.attributes.position.normalized = true;
  group.add(a, b);
  watchClones(a.geometry, disposed); watchClones(b.geometry, disposed);
  const reportError = console.error;
  console.error = () => {};
  let pickables;
  try { pickables = batchInteractiveGroup(group); } finally { console.error = reportError; }
  assert.deepEqual(pickables, [a, b]);
  assert.equal(disposed.length, 2);
  assert.ok(pickables.every(mesh => mesh.parent === group && mesh.userData.interactive === 'Content'));
});
