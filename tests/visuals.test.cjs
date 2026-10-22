const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { JSDOM } = require('jsdom');
function setup() {
  const dom = new JSDOM(
    '<!doctype html><html data-theme="dark"><body><div><canvas id="system-canvas"></canvas></div><dialog></dialog></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true },
  );
  const w = dom.window,
    frames = new Map(),
    state = { moving: true, hidden: false, width: 520, height: 500, calls: 0 },
    observers = {};
  let serial = 0;
  w.requestAnimationFrame = (callback) => {
    const id = ++serial;
    frames.set(id, callback);
    return id;
  };
  w.cancelAnimationFrame = (id) => frames.delete(id);
  w.motionAllowed = () => state.moving;
  Object.defineProperty(w.document, 'hidden', { get: () => state.hidden });
  const methods = {
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
  const context = new Proxy(methods, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        state.calls++;
        for (const arg of args)
          if (typeof arg === 'number')
            assert.ok(Number.isFinite(arg), 'Drawing coordinates must remain finite.');
      };
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
  w.HTMLCanvasElement.prototype.getContext = () => context;
  w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    width: state.width,
    height: state.height,
  });
  w.ResizeObserver = class {
    constructor(callback) {
      observers.resize = callback;
    }
    observe() {}
  };
  w.IntersectionObserver = class {
    constructor(callback) {
      observers.intersection = callback;
    }
    observe() {}
  };
  w.eval(fs.readFileSync(path.join(__dirname, '../visuals.js'), 'utf8'));
  return { w, frames, state, observers, close: () => dom.window.close() };
}
test('Hero keeps exactly one animation chain after repeated resizes', () => {
  const c = setup();
  try {
    assert.equal(c.frames.size, 1);
    for (let i = 0; i < 100; i++) {
      c.state.width = 320 + i;
      c.observers.resize();
      assert.equal(c.frames.size, 1);
    }
    for (let i = 0; i < 60; i++) {
      const [id, callback] = [...c.frames][0];
      c.frames.delete(id);
      callback(i * 16.67);
      assert.equal(c.frames.size, 1);
    }
    assert.ok(c.state.calls > 0);
  } finally {
    c.close();
  }
});
test('Hero stops for pause, page hiding, and offscreen state', () => {
  const c = setup();
  try {
    c.state.moving = false;
    c.w.dispatchEvent(new c.w.Event('portfolio-motion'));
    assert.equal(c.frames.size, 0);
    c.state.moving = true;
    c.w.dispatchEvent(new c.w.Event('portfolio-motion'));
    assert.equal(c.frames.size, 1);
    c.state.hidden = true;
    c.w.document.dispatchEvent(new c.w.Event('visibilitychange'));
    assert.equal(c.frames.size, 0);
    c.state.hidden = false;
    c.w.document.dispatchEvent(new c.w.Event('visibilitychange'));
    assert.equal(c.frames.size, 1);
    c.observers.intersection([{ isIntersecting: false }]);
    assert.equal(c.frames.size, 0);
    c.observers.intersection([{ isIntersecting: true }]);
    assert.equal(c.frames.size, 1);
  } finally {
    c.close();
  }
});
test('Hero pauses behind a dialog and resumes when the dialog closes', async () => {
  const c = setup();
  try {
    const dialog = c.w.document.querySelector('dialog');
    dialog.setAttribute('open', '');
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(c.frames.size, 0);
    dialog.removeAttribute('open');
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(c.frames.size, 1);
  } finally {
    c.close();
  }
});
test('Zero-size and narrow canvases do not create invalid drawing coordinates', () => {
  const c = setup();
  try {
    for (const [width, height] of [
      [0, 0],
      [1, 1],
      [280, 300],
      [320, 340],
      [1920, 1080],
    ]) {
      c.state.width = width;
      c.state.height = height;
      c.observers.resize();
      assert.equal(c.frames.size, 1);
    }
  } finally {
    c.close();
  }
});
