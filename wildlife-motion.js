const clamp01 = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * value * (value * (value * 6 - 15) + 10);
const bell = value => value <= 0 || value >= 1 ? 0 : Math.sin(Math.PI * value) ** 2;

/**
 * A small bird hop. from/to and offset use the caller's world-space units.
 * lift is vertical displacement, lean is radians, and tail is a morph weight.
 * Preparation and landing stay grounded; only the middle phase travels.
 */
export function birdHop(u, from, to) {
  const phase = clamp01(u);
  if (phase === 0 || phase === 1) return { offset: phase === 0 ? from : to, lift: 0, tail: 0, lean: 0 };
  const direction = Math.sign(to - from);
  const flight = clamp01((phase - .16) / .64);
  const travel = ease(flight);
  // Keep the familiar ballistic center, rounding its takeoff and landing.
  const soften = ease(clamp01(flight / .12)) * ease(clamp01((1 - flight) / .12));
  const lift = .08 * 4 * flight * (1 - flight) * soften;
  const preparation = bell(phase / .16);
  const landing = bell((phase - .8) / .2);
  const flightLean = flight > 0 && flight < 1 ? .025 * Math.sin(2 * Math.PI * flight) : 0;
  return {
    offset: flight === 0 ? from : flight === 1 ? to : from * (1 - travel) + to * travel,
    lift,
    tail: .18 * bell(phase),
    lean: direction * (-.025 * preparation + flightLean + .018 * landing),
  };
}

function pulse(time, period, start, duration) {
  const local = ((time % period) + period) % period;
  return bell((local - start) / duration);
}

/**
 * Quiet, deterministic idle pose. breath is a very small signed scale/morph
 * increment, NOT a world-space vertical offset; anchor any scaling at the feet.
 * Ear/tail values are morph weights. Most time is spent between gestures.
 */
export function idleMotion(kind, time) {
  const pose = { breath: 0, earLeft: 0, earRight: 0, tail: 0 };
  if (kind === 'WhiteWagtail') {
    pose.breath = .001 * Math.sin(time * .95 + .7);
    pose.tail = .3 * pulse(time, 9.2, 1.1, .82);
  } else if (kind === 'Redstart') {
    pose.breath = .001 * Math.sin(time * 1.05 + 2.1);
    pose.tail = .16 * pulse(time, 11.7, 3.2, .66);
  } else if (kind === 'LeopardCat') {
    pose.breath = .0016 * Math.sin(time * .72 + 1.8);
    pose.earLeft = .22 * pulse(time, 10.8, 2.2, .38);
    pose.earRight = .18 * pulse(time, 10.8, 2.82, .32);
  } else if (kind === 'TreeFrog') {
    pose.breath = .0012 * Math.sin(time * .82 + 3.4);
  }
  return pose;
}
