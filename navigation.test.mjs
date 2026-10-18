import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleFlight, layoutLabels } from './navigation.js';

const from = { target: [0, 2, 4], position: [2, 4, 6], zoom: 1 };
const to = { target: [8, 10, 12], position: [10, 12, 14], zoom: 3 };

test('flight holds the starting view during its opening delay', () => {
  assert.deepEqual(sampleFlight(from, to, 400), { ...from, done: false, progress: 0 });
});
test('flight finishes at the exact destination and remains there', () => {
  for (const elapsed of [3050, 10000]) {
    assert.deepEqual(sampleFlight(from, to, elapsed), { ...to, done: true, progress: 1 });
  }
});
test('flight eases into motion with quintic smootherstep interpolation', () => {
  assert.deepEqual(sampleFlight(from, to, 1100), {
    target: [.828125, 2.828125, 4.828125], position: [2.828125, 4.828125, 6.828125],
    zoom: 1.20703125, done: false, progress: 0.25,
  });
});

test('flight starts and stops with near-zero endpoint acceleration', () => {
  const h = .0001;
  const x = progress => sampleFlight(from, to, progress * 1000, { duration: 1000, delay: 0 }).target[0];
  // One-sided second differences measure actual camera motion in normalized time.
  const startAcceleration = (x(0) - 2 * x(h) + x(2 * h)) / (h * h);
  const endAcceleration = (x(1) - 2 * x(1 - h) + x(1 - 2 * h)) / (h * h);
  assert.ok(Math.abs(startAcceleration) < .06, `start acceleration ${startAcceleration}`);
  assert.ok(Math.abs(endAcceleration) < .06, `end acceleration ${endAcceleration}`);
});
test('reduced motion immediately shows the destination', () => {
  assert.deepEqual(sampleFlight(from, to, 0, { reduced: true }), { ...to, done: true, progress: 1 });
});
test('flight honors custom timing and zero duration', () => {
  assert.equal(sampleFlight(from, to, 600, { duration: 1000, delay: 100 }).zoom, 2);
  assert.deepEqual(sampleFlight(from, to, 100, { duration: 0, delay: 100 }), { ...to, done: true, progress: 1 });
});
test('flight never mutates or aliases either view', () => {
  const a = structuredClone(from), b = structuredClone(to);
  const originalA = structuredClone(a), originalB = structuredClone(b);
  const view = sampleFlight(a, b, 0);
  view.target[0] = 99;
  view.position[0] = 99;
  assert.deepEqual(a, originalA);
  assert.deepEqual(b, originalB);
});

function assertFits(labels, width, height) {
  for (const label of labels) {
    assert.equal(label.visible, true);
    assert.ok(label.x >= 12 && label.y >= 12);
    assert.ok(label.x + label.width <= width - 12);
    assert.ok(label.y + label.height <= height - 12);
  }
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i], b = labels[j];
    assert.ok(a.x + a.width + 6 <= b.x || b.x + b.width + 6 <= a.x ||
      a.y + a.height + 6 <= b.y || b.y + b.height + 6 <= a.y,
    `labels ${a.id} and ${b.id} overlap or lack their 6px gap`);
  }
}

for (const [width, height] of [[390, 844], [1440, 900]]) {
  test(`seven clustered labels fit without overlap in ${width}x${height}`, () => {
    const items = Array.from({ length: 7 }, (_, i) => ({
      id: `label-${i}`, x: width / 2 + i, y: height / 2 + i,
      width: 160 + i * 8, height: 46, dx: 0, dy: -30,
    }));
    const before = structuredClone(items);
    const labels = layoutLabels(items, width, height);
    assertFits(labels, width, height);
    assert.deepEqual(labels.map(label => label.id), items.map(item => item.id));
    assert.deepEqual(layoutLabels(items, width, height), labels);
    assert.deepEqual(items, before);
    assert.equal(labels[0].anchorX, width / 2);
    assert.equal(labels[0].anchorY, height / 2);
  });
}
test('isolated labels use their preferred center and clamp at viewport edges', () => {
  assert.deepEqual(layoutLabels([{ id: 'center', x: 100, y: 100, width: 80, height: 46, dx: 10, dy: -10 }], 390, 844),
    [{ id: 'center', x: 70, y: 67, width: 80, height: 46, anchorX: 100, anchorY: 100, visible: true }]);
  assertFits(layoutLabels([{ id: 'edge', x: 390, y: 0, width: 366, height: 46, dx: 200, dy: -100 }], 390, 844), 390, 844);
});
test('offscreen anchors are hidden while preserving identity', () => {
  const labels = layoutLabels([{ id: 'outside', x: -1, y: 200, width: 100, height: 46, dx: 0, dy: 0 }], 390, 844);
  assert.equal(labels[0].id, 'outside');
  assert.equal(labels[0].visible, false);
});
