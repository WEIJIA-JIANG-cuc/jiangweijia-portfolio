import { MathUtils } from './vendor/three/build/three.module.js';

/** Prepare each shared material once; reuse `seen` for the whole scene pass. */
export function prepareMaterial(material, maxAnisotropy, seen = new Set()) {
  if (seen.has(material)) return material;
  seen.add(material);

  if (/glass/i.test(material.name)) {
    material.transparent = true;
    material.opacity = 0.2;
    material.depthWrite = false;
    material.forceSinglePass = true;
  } else {
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
  }

  // Keep the asset's sidedness, roughness, and full-resolution texture detail.
  if (material.map) material.map.anisotropy = Math.min(4, maxAnisotropy);
  if (!material.map && !material.vertexColors && material.color) {
    const hsl = material.color.getHSL({});
    if (hsl.h > 0.16 && hsl.h < 0.46) {
      material.color.setHSL(
        MathUtils.lerp(hsl.h, 0.23, 0.2),
        Math.min(0.62, hsl.s * 1.08),
        Math.min(0.75, hsl.l * 1.12),
      );
    }
  }
  return material;
}

/** Match GLTFLoader's normalized names without changing a shared regex cursor. */
export function matchesObject(name, pattern) {
  const cursor = pattern.lastIndex;
  pattern.lastIndex = 0;
  try {
    return pattern.test(name.replaceAll('_', ' '));
  } finally {
    pattern.lastIndex = cursor;
  }
}
