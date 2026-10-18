import test from 'node:test';
import assert from 'node:assert/strict';
import { birdHop, idleMotion } from './wildlife-motion.js';

test('hops begin and finish grounded with their requested offsets', () => {
  assert.deepEqual(birdHop(0, 0, .18), { offset: 0, lift: 0, tail: 0, lean: 0 });
  assert.deepEqual(birdHop(1, 0, .18), { offset: .18, lift: 0, tail: 0, lean: 0 });
  assert.deepEqual(birdHop(1, .18, 0), { offset: 0, lift: 0, tail: 0, lean: 0 });
});

test('hops have a short grounded preparation and a restrained airborne arc', () => {
  assert.equal(birdHop(.08, 0, .18).offset, 0);
  assert.equal(birdHop(.08, 0, .18).lift, 0);
  const apex = birdHop(.48, 0, .18);
  assert.ok(apex.lift > .06 && apex.lift <= .085);
  assert.ok(apex.offset > .07 && apex.offset < .11);
  assert.equal(birdHop(.9, 0, .18).lift, 0);
});

test('forward and return hops travel continuously without overshooting', () => {
  for (const [from, to] of [[0, .18], [.18, 0]]) {
    let previous = from;
    for (let i = 0; i <= 1000; i++) {
      const pose = birdHop(i / 1000, from, to);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(pose.offset >= 0 && pose.offset <= .18);
      assert.ok(to > from ? pose.offset >= previous : pose.offset <= previous);
      assert.ok(pose.lift >= 0 && pose.lift <= .085);
      assert.ok(pose.tail >= 0 && pose.tail <= .2);
      assert.ok(Math.abs(pose.lean) <= .04);
      previous = pose.offset;
    }
  }
});

test('preparation, flight and landing join without position or pose jumps', () => {
  for (const u of [0, .16, .8, 1]) {
    const before = birdHop(u - 1e-7, 0, .18);
    const after = birdHop(u + 1e-7, 0, .18);
    for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < 1e-5, key);
  }
});

test('idle poses are deterministic, restrained, continuous, and mostly resting', () => {
  for (const kind of ['WhiteWagtail', 'Redstart', 'LeopardCat', 'TreeFrog', 'Unknown']) {
    let resting = 0;
    for (let i = 0; i < 3000; i++) {
      const time = i * .02;
      const pose = idleMotion(kind, time);
      assert.deepEqual(idleMotion(kind, time), pose);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(Math.abs(pose.breath) <= .002);
      assert.ok(pose.earLeft >= 0 && pose.earLeft <= .25);
      assert.ok(pose.earRight >= 0 && pose.earRight <= .25);
      assert.ok(pose.tail >= 0 && pose.tail <= .35);
      const next = idleMotion(kind, time + 1e-7);
      for (const key of Object.keys(pose)) assert.ok(Math.abs(pose[key] - next[key]) < 1e-5, `${kind} ${key}`);
      if (pose.earLeft === 0 && pose.earRight === 0 && pose.tail === 0) resting++;
    }
    assert.ok(resting > 2400, `${kind} rests during most of the cycle`);
  }
});

test('wagtail tail and cat ears move while frog only breathes quietly', () => {
  const poses = kind => Array.from({ length: 1200 }, (_, i) => idleMotion(kind, i / 100));
  const bird = poses('WhiteWagtail'), cat = poses('LeopardCat'), frog = poses('TreeFrog');
  assert.ok(bird.some(p => p.tail > .2));
  assert.ok(bird.every(p => p.earLeft === 0 && p.earRight === 0));
  assert.ok(cat.some(p => p.earLeft > .15));
  assert.ok(cat.some(p => p.earRight > .15));
  assert.ok(cat.every(p => !(p.earLeft > 0 && p.earRight > 0)));
  assert.ok(frog.some(p => Math.abs(p.breath) > .0005));
  assert.ok(frog.every(p => p.tail === 0 && p.earLeft === 0 && p.earRight === 0));
});
