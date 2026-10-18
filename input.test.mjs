import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const registrations = source.slice(source.indexOf("canvas.addEventListener('pointermove'"), source.indexOf('function captureView'));

for (const type of ['pointerdown', 'wheel']) {
  test(`the first ${type} gesture interrupts flight before OrbitControls receives it`, () => {
    const listeners = [];
    const controls = { enabled: false };
    let gestureReceived = false;
    // OrbitControls attaches its normal-phase listener before app handlers.
    listeners.push({ type, capture: false, callback: () => { gestureReceived = controls.enabled; } });
    const context = {
      canvas: { addEventListener: (eventType, callback, options) => listeners.push({
        type: eventType, callback, capture: options === true || Boolean(options?.capture),
      }) },
      setPointer() {}, interruptFlight() { controls.enabled = true; },
      down: null, pointerDirty: false,
    };
    vm.runInNewContext(registrations, context);
    const event = { clientX: 20, clientY: 20 };
    for (const capture of [true, false]) for (const listener of listeners) {
      if (listener.type === type && listener.capture === capture) listener.callback(event);
    }
    assert.equal(gestureReceived, true, 'the initiating gesture must not be swallowed');
  });
}
