/* DOM integration tests; these do not claim browser rendering or visual QA. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
function prepare(window) {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new window.Event('close'));
  };
  window.HTMLCanvasElement.prototype.getContext = () => null;
  window.URL.createObjectURL = () => 'blob:https://example.test/local-resume';
  window.IntersectionObserver = class {
    observe(el) {
      el.classList.add('visible');
    }
    unobserve() {}
  };
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async () => {} } });
}
function load({ hash = '', portable = false, query = '' } = {}) {
  const file = portable ? 'Harshvardhan-Birla-Portfolio.html' : 'index.html';
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    url: 'https://example.test/' + query + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    beforeParse: prepare,
  });
  dom.window.addEventListener('error', (e) => errors.push(e.message));
  if (portable) {
    for (const script of dom.window.document.querySelectorAll('script:not([src])'))
      if (script.type !== 'application/ld+json') dom.window.eval(script.textContent);
  } else {
    for (const file of [
      'content.js',
      'glossary.js',
      'decisions.js',
      'render.js',
      'app.js',
      'lab-core.js',
      'labs.js',
      'visuals.js',
    ])
      dom.window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  return { dom, w: dom.window, d: dom.window.document, errors, close: () => dom.window.close() };
}
const wait = () => new Promise((resolve) => setTimeout(resolve, 25));
function click(ctx, selector) {
  const el = ctx.d.querySelector(selector);
  assert.ok(el, selector + ' exists');
  el.click();
  return el;
}

test('Homepage initializes all content and labs without JavaScript errors', () => {
  const ctx = load();
  try {
    assert.equal(ctx.d.querySelectorAll('.project-card').length, 8);
    assert.equal(ctx.d.querySelectorAll('.note-card').length, 4);
    assert.equal(ctx.d.querySelectorAll('.term-card').length, 24);
    assert.equal(ctx.d.querySelectorAll('.lab-panel:not([hidden])').length, 1);
    assert.deepEqual(ctx.errors, []);
    const ids = [...ctx.d.querySelectorAll('[id]')].map((el) => el.id);
    assert.equal(new Set(ids).size, ids.length, 'No duplicate IDs');
  } finally {
    ctx.close();
  }
});
test('Category filters show the expected content and update pressed states', () => {
  const ctx = load();
  try {
    click(ctx, '[data-filter="ml"]');
    assert.equal(ctx.d.querySelectorAll('.project-card:not([hidden])').length, 2);
    assert.equal(ctx.d.querySelector('[data-filter="ml"]').getAttribute('aria-pressed'), 'true');
    click(ctx, '[data-filter="product"]');
    assert.equal(ctx.d.querySelectorAll('.project-card:not([hidden])').length, 1);
    click(ctx, '[data-filter="all"]');
    assert.equal(ctx.d.querySelectorAll('.project-card:not([hidden])').length, 8);
  } finally {
    ctx.close();
  }
});
test('Project reader, chapter links, next story, and escape return to portfolio', async () => {
  const ctx = load();
  try {
    click(ctx, '[data-project-id="event-engine"]');
    await wait();
    assert.equal(ctx.d.querySelector('#reader').open, true);
    assert.match(ctx.d.querySelector('#reader-title').textContent, /fast path/i);
    assert.ok(ctx.d.querySelector('[data-chapter]'));
    click(ctx, '.reader-actions a');
    await wait();
    assert.match(ctx.w.location.hash, /snapshot-prune/);
    assert.match(ctx.d.querySelector('#reader-title').textContent, /Same bytes/);
    const e = new ctx.w.Event('cancel', { cancelable: true });
    ctx.d.querySelector('#reader').dispatchEvent(e);
    assert.equal(ctx.d.querySelector('#reader').open, false);
    assert.equal(ctx.d.body.style.overflow, '');
  } finally {
    ctx.close();
  }
});
test('Direct case URLs, invalid stories, and field notes have working close actions', () => {
  for (const hash of ['#project/loopbreaker', '#note/identity', '#project/not-found']) {
    const ctx = load({ hash });
    try {
      assert.equal(ctx.d.querySelector('#reader').open, true);
      assert.ok(ctx.d.querySelector('#reader-title'));
      click(ctx, '#reader-x');
      assert.equal(ctx.d.querySelector('#reader').open, false);
    } finally {
      ctx.close();
    }
  }
});
test('Jump from case study to the correct interactive lab', async () => {
  const ctx = load({ hash: '#project/order-agent' });
  try {
    click(ctx, '[data-jump-lab="orders"]');
    await wait();
    assert.equal(ctx.d.querySelector('#reader').open, false);
    assert.equal(ctx.d.querySelector('#panel-orders').hidden, false);
    assert.equal(ctx.w.location.hash, '#playground');
  } finally {
    ctx.close();
  }
});
test('Tab keyboard navigation sets focus, visibility, and ARIA consistently', () => {
  const ctx = load();
  try {
    const first = ctx.d.querySelector('#tab-storage');
    first.dispatchEvent(new ctx.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(ctx.d.activeElement.id, 'tab-replay');
    assert.equal(ctx.d.querySelector('#tab-replay').getAttribute('aria-selected'), 'true');
    assert.equal(ctx.d.querySelector('#panel-replay').hidden, false);
    assert.equal(ctx.d.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
    ctx.d.activeElement.dispatchEvent(
      new ctx.w.KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    assert.equal(ctx.d.activeElement.id, 'tab-orders');
  } finally {
    ctx.close();
  }
});
test('Storage lab demonstrates both safe and unsafe outcomes and resets', () => {
  const ctx = load();
  try {
    for (let i = 0; i < 4; i++) click(ctx, '#storage-step');
    assert.match(ctx.d.querySelector('#storage-log').textContent, /A₂ survives/);
    assert.equal(ctx.d.querySelector('#storage-step').disabled, true);
    const toggle = ctx.d.querySelector('#incarnation-mode');
    toggle.checked = false;
    toggle.dispatchEvent(new ctx.w.Event('change'));
    assert.ok(ctx.d.querySelector('#object-new').classList.contains('lost'));
    assert.match(ctx.d.querySelector('#storage-invariant').textContent, /Violated/);
    click(ctx, '#storage-reset');
    assert.equal(ctx.d.querySelector('#storage-step').disabled, false);
    assert.ok(ctx.d.querySelector('#object-new').classList.contains('inactive'));
  } finally {
    ctx.close();
  }
});
test('Replay range, queue stalls, and order controls render real state transitions', () => {
  const ctx = load();
  try {
    const range = ctx.d.querySelector('#risk-threshold');
    range.value = '.5';
    range.dispatchEvent(new ctx.w.Event('input'));
    assert.equal(ctx.d.querySelector('#metric-fn').textContent, '1');
    assert.equal(ctx.d.querySelector('#metric-f1').textContent, '0.00');
    ctx.d.querySelector('#producer-rate').value = '6';
    ctx.d.querySelector('#consumer-rate').value = '0';
    for (let i = 0; i < 4; i++) click(ctx, '#queue-step');
    assert.equal(ctx.d.querySelector('#queue-rejected').textContent, '12');
    assert.equal(ctx.d.querySelectorAll('.queue-slot.filled').length, 12);
    for (let i = 0; i < 5; i++) click(ctx, '#order-step');
    assert.equal(ctx.d.querySelector('#order-step').disabled, true);
    assert.match(
      ctx.d.querySelector('#order-message').textContent,
      /1 filled, 2 canceled, 1 expired/,
    );
    click(ctx, '#order-reset');
    assert.equal(ctx.d.querySelector('#order-step').disabled, false);
  } finally {
    ctx.close();
  }
});
test('Search finds repository concepts and no-result state; theme persists', () => {
  const ctx = load();
  try {
    click(ctx, '.command-button');
    assert.equal(ctx.d.querySelector('#search-dialog').open, true);
    const search = ctx.d.querySelector('#site-search');
    search.value = 'SPSC';
    search.dispatchEvent(new ctx.w.Event('input'));
    assert.match(ctx.d.querySelector('#search-results').textContent, /Event Processing/);
    search.value = 'zzzzunfindable';
    search.dispatchEvent(new ctx.w.Event('input'));
    assert.ok(ctx.d.querySelector('.no-results'));
    click(ctx, '#search-close');
    click(ctx, '#theme-toggle');
    assert.equal(ctx.d.documentElement.dataset.theme, 'light');
    assert.equal(ctx.w.localStorage.getItem('hb-portfolio-theme'), 'light');
  } finally {
    ctx.close();
  }
});
test('Glossary filtering, mobile navigation, and motion control work', () => {
  const ctx = load();
  try {
    const search = ctx.d.querySelector('#glossary-search');
    search.value = 'p99';
    search.dispatchEvent(new ctx.w.Event('input'));
    assert.equal(ctx.d.querySelectorAll('.term-card:not([hidden])').length, 1);
    search.value = 'xxunfindable';
    search.dispatchEvent(new ctx.w.Event('input'));
    assert.equal(ctx.d.querySelector('#glossary-empty').hidden, false);
    click(ctx, '#menu-toggle');
    assert.equal(ctx.d.querySelector('#mobile-nav').hidden, false);
    click(ctx, '#mobile-nav a');
    assert.equal(ctx.d.querySelector('#mobile-nav').hidden, true);
    click(ctx, '#motion-toggle');
    assert.equal(ctx.d.documentElement.dataset.motion, 'paused');
    assert.equal(ctx.d.querySelector('#motion-toggle').getAttribute('aria-pressed'), 'true');
  } finally {
    ctx.close();
  }
});
test('Portable export initializes embedded scripts, reader, and resume link', async () => {
  const ctx = load({ portable: true });
  try {
    assert.equal(ctx.w.PORTABLE, true);
    assert.equal(ctx.d.querySelectorAll('.project-card').length, 8);
    assert.equal(ctx.d.querySelectorAll('script[src]').length, 0);
    assert.equal(ctx.d.querySelectorAll('link[rel="stylesheet"]').length, 0);
    assert.ok(ctx.d.querySelector('.hero-cta a[href^="blob:"]'));
    click(ctx, '[data-project-id="event-engine"]');
    await wait();
    assert.equal(ctx.d.querySelector('#reader').open, true);
    assert.deepEqual(ctx.errors, []);
  } finally {
    ctx.close();
  }
});
test('All project story routes render source or resume provenance', () => {
  const seed = load();
  const ids = seed.w.PORTFOLIO.projects.map((p) => p.id);
  seed.close();
  for (const id of ids) {
    const ctx = load({ hash: '#project/' + id });
    try {
      assert.ok(ctx.d.querySelectorAll('.reader-chapter').length >= 5);
      assert.ok(ctx.d.querySelector('.reader-provenance').textContent.length > 30);
      assert.deepEqual(ctx.errors, []);
    } finally {
      ctx.close();
    }
  }
});
test('Exported homepage contains readable project, note, and glossary content without scripts', () => {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'));
  try {
    const d = dom.window.document;
    assert.equal(d.querySelectorAll('.project-card').length, 8);
    assert.equal(d.querySelectorAll('.note-card').length, 4);
    assert.equal(d.querySelectorAll('.term-card').length, 24);
    for (const link of d.querySelectorAll('[data-project-id],[data-note-id]'))
      assert.match(link.getAttribute('href'), /^(projects|notes)\//);
  } finally {
    dom.window.close();
  }
});
test('Every standalone article has actual content, valid local assets, and a single h1', () => {
  const dist = path.join(root, 'dist');
  let pages = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.html')) pages.push(full);
    }
  }
  walk(dist);
  assert.equal(pages.length, 15);
  for (const file of pages) {
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
    try {
      const d = dom.window.document;
      assert.equal(d.querySelectorAll('h1').length, 1, file);
      assert.ok(d.querySelector('meta[name="description"]') || file.endsWith('404.html'));
      for (const element of d.querySelectorAll('[href],[src]')) {
        const url = element.getAttribute('href') || element.getAttribute('src');
        if (!url || /^(https?:|mailto:|tel:|data:|blob:|#)/.test(url)) continue;
        const local = url.split(/[?#]/)[0];
        assert.ok(fs.existsSync(path.resolve(path.dirname(file), local)), `${file}: ${url}`);
      }
      if (file.includes(path.sep + 'projects' + path.sep)) {
        assert.equal(d.querySelectorAll('.architecture-diagram').length, 1);
        assert.ok(d.querySelectorAll('.reader-chapter').length >= 5);
      }
    } finally {
      dom.window.close();
    }
  }
});
test('Global search opens a plain-English term and makes it visible', async () => {
  const ctx = load();
  try {
    click(ctx, '.command-button');
    const search = ctx.d.querySelector('#site-search');
    search.value = 'backpressure';
    search.dispatchEvent(new ctx.w.Event('input'));
    const link = [...ctx.d.querySelectorAll('.search-result')].find(
      (a) => a.getAttribute('href') === '#term-backpressure',
    );
    assert.ok(link);
    link.click();
    await wait();
    assert.equal(ctx.d.querySelector('#term-backpressure').open, true);
    assert.equal(ctx.d.querySelector('#term-backpressure').hidden, false);
    assert.equal(ctx.d.querySelector('#search-dialog').open, false);
  } finally {
    ctx.close();
  }
});
test('Malformed glossary hashes do not abort the rest of the interface', () => {
  const ctx = load({ hash: '#term-%22[' });
  try {
    assert.deepEqual(ctx.errors, []);
    click(ctx, '[data-filter="product"]');
    assert.equal(ctx.d.querySelectorAll('.project-card:not([hidden])').length, 1);
  } finally {
    ctx.close();
  }
});
test('Closing a directly loaded note returns to notes and focuses the section heading', async () => {
  const ctx = load({ hash: '#note/identity' });
  try {
    click(ctx, '#reader-x');
    await wait();
    assert.equal(ctx.w.location.hash, '#notes');
    assert.equal(ctx.d.activeElement.id, 'notes-title');
  } finally {
    ctx.close();
  }
});
