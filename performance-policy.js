/** Measure only active frames; resetting is required after reading or hiding. */
export class FrameMeter {
  reset(now) { this.start = this.previous = now; this.times = []; }
  sample(now) {
    if (this.previous === undefined) { this.reset(now); return null; }
    const delta = now - this.previous;
    this.previous = now;
    if (delta > 0) this.times.push(delta);
    if (now - this.start < 1900 || !this.times.length) return null;
    const times = this.times.sort((a, b) => a - b);
    const result = { fps: this.times.length * 1000 / (now - this.start),
      p50: times[Math.floor((times.length - 1) * .5)],
      p95: times[Math.floor((times.length - 1) * .95)] };
    this.reset(now);
    return result;
  }
}

/** Small, infrequent changes retain AA, textures, shadows and CSS resolution. */
export function choosePixelRatio(current, maximum, fps) {
  const next = fps < 28 ? current - .1 : fps > 52 ? current + .05 : current;
  return Math.round(Math.min(maximum, Math.max(Math.min(1, maximum), next)) * 100) / 100;
}
