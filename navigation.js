/** Sample the opening camera flight without changing or aliasing either view. */
export function sampleFlight(from, to, elapsed, { duration = 2600, delay = 450, reduced = false } = {}) {
  const progress = reduced ? 1 : elapsed < delay ? 0 : duration <= 0 ? 1 : Math.min(1, Math.max(0, (elapsed - delay) / duration));
  const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
  const blend = (a, b) => progress === 0 ? a : progress === 1 ? b : a + (b - a) * eased;
  return {
    target: from.target.map((value, i) => blend(value, to.target[i])),
    position: from.position.map((value, i) => blend(value, to.position[i])),
    zoom: blend(from.zoom, to.zoom), done: progress === 1, progress,
  };
}

/**
 * Place labels in input order, choosing the closest free position to each
 * preferred center. Coordinates are CSS pixels; x/y in the result are top-left.
 * Offscreen anchors or labels that cannot fit retain their ID with visible:false.
 */
export function layoutLabels(items, width, height) {
  const margin = 12, gap = 6;
  const placed = [];
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  return items.map(item => {
    const labelWidth = Math.min(item.width, Math.max(0, width - margin * 2));
    const labelHeight = item.height;
    const maxX = width - margin - labelWidth;
    const maxY = height - margin - labelHeight;
    const preferredX = clamp(item.x + (item.dx ?? 0) - labelWidth / 2, margin, maxX);
    const preferredY = clamp(item.y + (item.dy ?? 0) - labelHeight / 2, margin, maxY);
    const result = { id: item.id, x: preferredX, y: preferredY, width: labelWidth, height: labelHeight,
      anchorX: item.x, anchorY: item.y, visible: false };
    if (item.x < 0 || item.x > width || item.y < 0 || item.y > height || maxX < margin || maxY < margin) return result;

    const xs = new Set([preferredX, margin, maxX]);
    const ys = new Set([preferredY, margin, maxY]);
    for (const other of placed) {
      xs.add(clamp(other.x - labelWidth - gap, margin, maxX));
      xs.add(clamp(other.x + other.width + gap, margin, maxX));
      ys.add(clamp(other.y - labelHeight - gap, margin, maxY));
      ys.add(clamp(other.y + other.height + gap, margin, maxY));
    }
    let best, bestDistance = Infinity;
    for (const y of ys) for (const x of xs) {
      const clear = placed.every(other => x + labelWidth + gap <= other.x ||
        other.x + other.width + gap <= x || y + labelHeight + gap <= other.y ||
        other.y + other.height + gap <= y);
      if (!clear) continue;
      const distance = (x - preferredX) ** 2 + (y - preferredY) ** 2;
      if (distance < bestDistance || (distance === bestDistance && (y < best.y || (y === best.y && x < best.x)))) {
        best = { x, y };
        bestDistance = distance;
      }
    }
    if (best) {
      Object.assign(result, best, { visible: true });
      placed.push(result);
    }
    return result;
  });
}
