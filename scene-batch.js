import { Matrix4, Mesh } from './vendor/three/build/three.module.js';
import { mergeGeometries } from './vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Combine compatible static meshes, leaving singleton buckets untouched.
 * Source meshes/geometry survive a failed merge; only temporary clones dispose.
 */
export function batchStaticMeshes(root, scene, kind) {
  const buckets = new Map();
  root.updateWorldMatrix(true, true);
  scene.updateWorldMatrix(true, false);
  root.traverse(object => {
    if (!object.isMesh || kind(object) || object.userData.interactive ||
      object.morphTargetInfluences || Array.isArray(object.material)) return;
    const geometry = object.geometry;
    const key = `${object.material.uuid}|${Object.keys(geometry.attributes).sort().join(',')}|${Boolean(geometry.index)}`;
    const bucket = buckets.get(key) || [];
    bucket.push(object);
    buckets.set(key, bucket);
  });

  const sceneInverse = new Matrix4().copy(scene.matrixWorld).invert();
  const transform = new Matrix4();
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const temporary = [];
    try {
      for (const object of meshes) {
        const geometry = object.geometry.clone();
        temporary.push(geometry);
        transform.multiplyMatrices(sceneInverse, object.matrixWorld);
        geometry.applyMatrix4(transform);
      }
      const geometry = mergeGeometries(temporary);
      if (!geometry) continue;
      const merged = new Mesh(geometry, meshes[0].material);
      merged.castShadow = true;
      merged.receiveShadow = true;
      scene.add(merged);
      for (const object of meshes) object.removeFromParent();
    } finally {
      for (const geometry of temporary) geometry.dispose();
    }
  }
}

/**
 * Batch direct static prop meshes in group-local coordinates. The group remains
 * the hover/placement rig; return its current direct meshes for ray picking.
 */
export function batchInteractiveGroup(group) {
  const buckets = new Map();
  for (const object of group.children) {
    if (!object.isMesh || object.morphTargetInfluences || Array.isArray(object.material)) continue;
    const geometry = object.geometry;
    const key = `${object.material.uuid}|${Object.keys(geometry.attributes).sort().join(',')}|${Boolean(geometry.index)}`;
    const bucket = buckets.get(key) || [];
    bucket.push(object);
    buckets.set(key, bucket);
  }
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const temporary = [];
    try {
      for (const object of meshes) {
        if (object.matrixAutoUpdate) object.updateMatrix();
        const geometry = object.geometry.clone();
        temporary.push(geometry);
        geometry.applyMatrix4(object.matrix);
      }
      const geometry = mergeGeometries(temporary);
      if (!geometry) continue;
      const merged = new Mesh(geometry, meshes[0].material);
      merged.userData.interactive = group.userData.id;
      merged.castShadow = true;
      merged.receiveShadow = true;
      group.add(merged);
      for (const object of meshes) object.removeFromParent();
    } finally {
      for (const geometry of temporary) geometry.dispose();
    }
  }
  const pickables = group.children.filter(object => object.isMesh);
  for (const object of pickables) object.userData.interactive = group.userData.id;
  return pickables;
}
