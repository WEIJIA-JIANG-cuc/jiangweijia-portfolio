import test from 'node:test';
import assert from 'node:assert/strict';
const policy = await import('./performance-policy.js').catch(() => ({}));

test('paused time never contaminates resumed frame rate', () => {
  assert.equal(typeof policy.FrameMeter, 'function');
  const meter = new policy.FrameMeter();
  meter.reset(0);
  for (let i = 1; i <= 120; i++) meter.sample(i * 1000 / 60);
  meter.reset(12000);
  let reading;
  for (let i = 1; i <= 120; i++) reading = meter.sample(12000 + i * 1000 / 60) || reading;
  assert.ok(reading.fps > 59 && reading.fps < 61);
  assert.ok(reading.p95 < 17);
});

test('quality adapts slowly without falling below native CSS resolution', () => {
  assert.equal(typeof policy.choosePixelRatio, 'function');
  assert.equal(policy.choosePixelRatio(1, 1.4, 12), 1);
  assert.equal(policy.choosePixelRatio(1.4, 1.4, 12), 1.3);
  assert.equal(policy.choosePixelRatio(1.2, 1.4, 60), 1.25);
  assert.equal(policy.choosePixelRatio(1.4, 1.4, 60), 1.4);
  assert.equal(policy.choosePixelRatio(1.2, 1.4, 35), 1.2);
});
