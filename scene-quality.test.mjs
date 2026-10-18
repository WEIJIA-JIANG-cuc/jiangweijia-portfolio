import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from './vendor/three/build/three.module.js';

// Keep missing exports as assertion failures during the first TDD run.
const quality = await import('./scene-quality.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('scene-quality.js')) return {};
  throw error;
});
const bytes = readFileSync(new URL('./assets/island.glb', import.meta.url));
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));

function materialFromAsset(name) {
  const definition = gltf.materials.find(material => material.name === name);
  assert.ok(definition, `missing shipped material: ${name}`);
  const material = new THREE.MeshStandardMaterial();
  material.name = name;
  material.color.fromArray(definition.pbrMetallicRoughness.baseColorFactor);
  material.side = definition.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  material.roughness = definition.pbrMetallicRoughness.roughnessFactor ?? 1;
  return material;
}

function prepare(material, repetitions = 1, maxAnisotropy = 16) {
  assert.equal(typeof quality.prepareMaterial, 'function', 'export prepareMaterial');
  const seen = new Set();
  for (let i = 0; i < repetitions; i++) quality.prepareMaterial(material, maxAnisotropy, seen);
  return material;
}

test('one or one hundred references to the same real moss material produce the same color', () => {
  const once = prepare(materialFromAsset('V3 sunny moss'));
  const shared = prepare(materialFromAsset('V3 sunny moss'), 100);
  assert.deepEqual(shared.color.toArray(), once.color.toArray());
  assert.notDeepEqual(once.color.toArray(), gltf.materials.find(m => m.name === once.name).pbrMetallicRoughness.baseColorFactor.slice(0, 3));
});

test('the real shaded and sunny moss retain their visible lightness separation after shared use', () => {
  const shaded = prepare(materialFromAsset('V3 shaded moss'), 100).color.getHSL({});
  const sunny = prepare(materialFromAsset('V3 sunny moss'), 100).color.getHSL({});
  assert.ok(sunny.l - shaded.l > 0.05, `moss contrast collapsed: ${sunny.l - shaded.l}`);
  assert.ok(sunny.l < 0.4 && shaded.l < 0.3, 'shared plants were bleached toward white');
});

test('material identity, rather than duplicate names, determines which colors are prepared', () => {
  assert.equal(typeof quality.prepareMaterial, 'function', 'export prepareMaterial');
  const first = materialFromAsset('V3 sunny moss');
  const second = materialFromAsset('V3 sunny moss');
  const original = first.color.toArray();
  const seen = new Set();
  assert.equal(quality.prepareMaterial(first, 8, seen), first);
  quality.prepareMaterial(second, 8, seen);
  assert.notDeepEqual(second.color.toArray(), original);
  assert.deepEqual(second.color.toArray(), first.color.toArray());
});

test('textured and vertex-colored surfaces keep their colors and original sidedness', () => {
  const textured = materialFromAsset('V3 sunny moss');
  textured.map = new THREE.Texture();
  textured.side = THREE.FrontSide;
  const original = textured.color.toArray();
  const roughness = textured.roughness;
  prepare(textured, 100, 16);
  assert.deepEqual(textured.color.toArray(), original);
  assert.equal(textured.map.anisotropy, 4);
  assert.equal(textured.side, THREE.FrontSide);
  assert.equal(textured.roughness, roughness);

  const vertexColored = materialFromAsset('V3 sunny moss');
  vertexColored.vertexColors = true;
  const vertexColor = vertexColored.color.toArray();
  prepare(vertexColored);
  assert.deepEqual(vertexColored.color.toArray(), vertexColor);
  assert.equal(vertexColored.side, THREE.DoubleSide, 'thin foliage lost its back faces');
});

test('glass remains translucent with one transparent pass and hardware-bounded texture filtering', () => {
  const glass = materialFromAsset('Culture glass');
  glass.map = new THREE.Texture();
  const original = glass.color.toArray();
  const roughness = glass.roughness;
  prepare(glass, 100, 2);
  assert.equal(glass.transparent, true);
  assert.equal(glass.opacity, 0.2);
  assert.equal(glass.depthWrite, false);
  assert.equal(glass.forceSinglePass, true);
  assert.equal(glass.map.anisotropy, 2);
  assert.equal(glass.side, THREE.DoubleSide);
  assert.equal(glass.roughness, roughness);
  assert.deepEqual(glass.color.toArray(), original);
});

test('opaque warm surfaces remain opaque without changing their existing color or side', () => {
  const paper = materialFromAsset('Field notes');
  paper.transparent = true;
  paper.opacity = 0.4;
  paper.depthWrite = false;
  const original = paper.color.toArray();
  prepare(paper);
  assert.equal(paper.transparent, false);
  assert.equal(paper.opacity, 1);
  assert.equal(paper.depthWrite, true);
  assert.deepEqual(paper.color.toArray(), original);
  assert.equal(paper.side, THREE.DoubleSide);
});

test('all seven entrances match actual shipped mesh names after Three.js normalization', () => {
  assert.equal(typeof quality.matchesObject, 'function', 'export matchesObject');
  const rules = {
    GameProduct: /Observation console|Console instrument|Console indicator/,
    Photography: /Telescope/,
    VibeCoding: /Culture|Glass frame|Code tree|Code canopy|Code seed/,
    Writing: /Writing paper/,
    Content: /Notice board|Notice post|Board field/,
    Experience: /Island map|Exploration route/,
    Contact: /ID badge|ID photo|ID lanyard/,
  };
  const names = gltf.nodes.filter(node => node.mesh !== undefined)
    .map(node => THREE.PropertyBinding.sanitizeNodeName(node.name));
  for (const [entrance, rule] of Object.entries(rules)) {
    assert.ok(names.some(name => quality.matchesObject(name, rule)), `${entrance} has no real object`);
  }
  assert.equal(quality.matchesObject('V3_ANIMAL_LeopardCat', rules.Contact), false);
  assert.equal(quality.matchesObject('Writing paper', rules.Writing), true);
});

test('reusing a regex cannot alternate matching entrances or mutate its cursor', () => {
  assert.equal(typeof quality.matchesObject, 'function', 'export matchesObject');
  const rule = /Writing paper/g;
  rule.lastIndex = 5;
  for (let i = 0; i < 3; i++) assert.equal(quality.matchesObject('Writing_paper001', rule), true);
  assert.equal(rule.lastIndex, 5);
});
