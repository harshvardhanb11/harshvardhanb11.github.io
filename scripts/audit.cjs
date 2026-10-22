/* Reproducible static and DOM audit. This is not a browser rendering audit. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { HtmlValidate } = require('html-validate');
const css = require('css-tree');

const project = path.resolve(__dirname, '..');
const dist = path.join(project, 'dist');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const result = {
  date: new Date().toISOString().slice(0, 10),
  scope: 'Static export and DOM checks; no real browser layout or device testing.',
  pages: 0,
  localReferences: 0,
  localReferenceErrors: [],
  htmlErrors: [],
  accessibilityViolations: [],
  cssErrors: [],
  contrast: [],
};

function collect(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return fs.statSync(full).isDirectory() ? collect(full) : full.endsWith('.html') ? [full] : [];
  });
}
function luminance(hex) {
  const values = hex
    .replace('#', '')
    .match(/../g)
    .map((part) => parseInt(part, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
async function main() {
  const pages = collect(dist);
  result.pages = pages.length;
  const validator = new HtmlValidate({
    extends: ['html-validate:standard'],
    rules: {
      'void-style': 'off',
      'no-trailing-whitespace': 'off',
      'long-title': 'off',
      'prefer-button': 'off',
    },
  });
  for (const file of pages) {
    const name = path.relative(dist, file);
    const validation = await validator.validateFile(file);
    for (const entry of validation.results)
      for (const message of entry.messages) {
        result.htmlErrors.push({ page: name, rule: message.ruleId, message: message.message });
      }
    const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
      url: 'https://audit.example.test/' + name,
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    });
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('h1').length, 1, `A single primary heading in ${name}`);
    assert.ok(doc.querySelector('meta[name="viewport"]'), `Viewport metadata in ${name}`);
    for (const element of doc.querySelectorAll('[href],[src]')) {
      const address = element.getAttribute('href') || element.getAttribute('src');
      if (!address || /^(https?:|mailto:|tel:|data:|blob:|#)/.test(address)) continue;
      result.localReferences++;
      const local = address.split(/[?#]/)[0];
      const target = local.startsWith('/')
        ? path.join(dist, local.slice(1))
        : path.resolve(path.dirname(file), local);
      if (!fs.existsSync(target)) result.localReferenceErrors.push({ page: name, address });
    }
    dom.window.eval(axeSource);
    const a11y = await dom.window.axe.run(doc, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    for (const item of a11y.violations) {
      result.accessibilityViolations.push({
        page: name,
        rule: item.id,
        impact: item.impact,
        targets: item.nodes.map((node) => node.target),
      });
    }
    dom.window.close();
  }
  for (const name of ['styles.css', 'detail.css']) {
    css.parse(fs.readFileSync(path.join(dist, name), 'utf8'), {
      parseValue: true,
      parseCustomProperty: true,
      onParseError: (error) => result.cssErrors.push({ file: name, message: error.message }),
    });
  }
  for (const [foreground, background] of [
    ['#f0f0e7', '#101815'],
    ['#a3b1a5', '#17211c'],
    ['#d4ed95', '#101815'],
    ['#e9a385', '#17211c'],
    ['#1b3125', '#f3f1e9'],
    ['#536757', '#e9ebe1'],
    ['#355d28', '#f3f1e9'],
    ['#9c4a32', '#e9ebe1'],
    ['#5d6c61', '#eeeae0'],
    ['#5a6b58', '#eeeae0'],
    ['#586b51', '#eeeae0'],
    ['#5c6f55', '#eeeae0'],
  ]) {
    const ratio = contrast(foreground, background);
    result.contrast.push({
      foreground,
      background,
      ratio: Number(ratio.toFixed(2)),
      passesAA: ratio >= 4.5,
    });
  }
  result.passed =
    result.htmlErrors.length === 0 &&
    result.localReferenceErrors.length === 0 &&
    result.accessibilityViolations.length === 0 &&
    result.cssErrors.length === 0 &&
    result.contrast.every((entry) => entry.passesAA);
  fs.writeFileSync(
    path.join(project, 'validation-results.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
