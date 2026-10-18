import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Vector3, CatmullRomCurve3 } from './vendor/three/build/three.module.js';

// Execute the actual shipped lanyard component. Only React's mounting boundary
// and asset loading are substituted; its joint configuration, Three.js curve,
// and animation callback run unchanged. The browser check covers real Rapier
// integration and pointer dragging separately.
function mountLanyard(isMobile = false) {
  const html = readFileSync(new URL('./content/lanyard/index.html', import.meta.url), 'utf8');
  const entry = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/)[1];
  const bundle = readFileSync(new URL(entry, new URL('./content/lanyard/index.html', import.meta.url)), 'utf8');
  const start = bundle.indexOf('function BP(');
  const end = bundle.indexOf('const iP=', start);
  assert.ok(start >= 0 && end > start, 'the actual card component must be present');
  const joints = [];
  const states = [];
  let tick;
  const element = (type, props) => ({ type, props });
  const context = {
    m: Vector3, C0: CatmullRomCurve3,
    tA: {
      useRef: () => ({ current: null }),
      useMemo: callback => callback(),
      useState: initial => {
        const value = typeof initial === 'function' ? initial() : initial;
        states.push(value);
        return [value, () => {}];
      },
      useEffect: () => {},
    },
    BI: { jsx: element, jsxs: element, Fragment: 'fragment' },
    mh: () => ({ nodes: { card: {}, clip: {}, clamp: {} }, materials: { base: { map: {} }, metal: {} } }),
    ss: () => ({}), $Z: '', AP: '', xN: '',
    he: 'rigid-body', Il: 'ball-collider', EL: 'cuboid-collider',
    xw: (a, b, config) => joints.push({ type: 'rope', a, b, config }),
    zZ: (a, b, config) => joints.push({ type: 'spherical', a, b, config }),
    qh: callback => { tick = callback; },
  };
  const component = vm.runInNewContext(`(${bundle.slice(start, end)})`, context);
  const tree = component({ isMobile });
  let linePoints;
  const bodies = [];
  function mount(node, origin = new Vector3()) {
    if (!node || !node.props) return;
    const { props } = node;
    const position = origin.clone().add(new Vector3(...(props.position || [0, 0, 0])));
    if (node.type === 'rigid-body') {
      const body = {
        translation: () => position,
        angvel: () => new Vector3(), rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
        setAngvel: () => {},
      };
      props.ref.current = body;
      bodies.push({ body, position, type: props.type });
    } else if (node.type === 'mesh' && props.ref) {
      props.ref.current = { geometry: { setPoints: points => { linePoints = points; } } };
    }
    for (const child of [props.children].flat()) mount(child, position);
  }
  mount(tree);
  return { joints, bodies, curve: states[0], tick, linePoints: () => linePoints };
}

const anchor = (ref, offset) => ref.current.translation().clone().add(new Vector3(...offset));

test('the first frame starts with every suspension constraint already satisfied', () => {
  const { joints, bodies } = mountLanyard();
  assert.equal(joints.length, 4);
  assert.equal(bodies.filter(body => body.type === 'dynamic').length, 4);
  for (const joint of joints) {
    const separation = anchor(joint.a, joint.config[0]).distanceTo(anchor(joint.b, joint.config[1]));
    if (joint.type === 'rope') assert.ok(Math.abs(separation - joint.config[2]) < 1e-9, `rope has ${separation} initial distance`);
    else assert.ok(separation < 1e-9, `card attachment has ${separation} initial constraint error`);
  }
});

test('the first visible strap falls straight from the top centre on desktop and mobile', () => {
  for (const isMobile of [false, true]) {
    const card = mountLanyard(isMobile);
    card.tick({}, 0);
    const points = card.linePoints();
    assert.equal(points.length, (isMobile ? 16 : 32) + 1);
    for (let index = 0; index < points.length; index++) {
      assert.ok(Math.abs(points[index].x) < 1e-9 && Math.abs(points[index].z) < 1e-9, 'strap must start on the vertical centre line');
      if (index) assert.ok(points[index].y >= points[index - 1].y - 1e-9, 'strap must not loop back on itself');
    }
    assert.ok(Math.abs(points.at(-1).y - 4) < 1e-9);
  }
});

test('strap smoothing never extrapolates beyond the bodies after a slow or stalled frame', () => {
  for (const delta of [1 / 240, 1 / 60, 1 / 20, 0.15, 1, 5]) {
    const card = mountLanyard();
    const smoothedBodies = card.bodies.slice(1, 3);
    for (const { body, position } of smoothedBodies) body.lerped = position.clone().add(new Vector3(0, 1, 0));
    card.tick({}, delta);
    for (const { body, position } of smoothedBodies) {
      assert.ok(body.lerped.y >= position.y - 1e-9 && body.lerped.y <= position.y + 1 + 1e-9, `delta ${delta} extrapolated the strap`);
    }
    for (const point of card.linePoints()) assert.ok([point.x, point.y, point.z].every(Number.isFinite));
  }
});
