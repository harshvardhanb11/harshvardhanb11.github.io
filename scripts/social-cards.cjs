/* Optional asset regeneration: npm install, then node scripts/social-cards.cjs */
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..'),
  context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const titles = {
  'event-engine': ['A fast path', 'you can replay.'],
  'snapshot-prune': ['Same bytes.', 'Different lifetime.'],
  loopbreaker: ['An exit from', 'the infinite feed.'],
  'order-agent': ['A quote is not', 'an execution.'],
  sentiment: ['A score needs', 'a meaningful target.'],
  'distributed-storage': ['Keep the data', 'moving.'],
  'compute-platform': ['Coordinate the', 'moving parts.'],
  'distributed-training': ['More workers.', 'More questions.'],
};
async function main() {
  for (const p of context.window.PORTFOLIO.projects) {
    const title = titles[p.id],
      color = p.category === 'ml' ? '#e9a385' : '#d4ed95';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#101815"/><path d="M60 80H1140M60 550H1140" stroke="#344039"/><text x="65" y="55" fill="#cde697" font-family="sans-serif" font-size="22">h·b</text><text x="110" y="55" fill="#a3b1a5" font-family="sans-serif" font-size="13">HARSHVARDHAN BIRLA / ENGINEERING NOTES</text><text x="65" y="146" fill="${color}" font-family="monospace" font-size="12" letter-spacing="2">${escape(p.number + ' / ' + p.type.toUpperCase())}</text><text x="60" y="270" fill="#f0f0e7" font-family="sans-serif" font-size="70" letter-spacing="-3">${escape(title[0])}</text><text x="60" y="360" fill="${color}" font-family="serif" font-style="italic" font-size="79" letter-spacing="-2">${escape(title[1])}</text><text x="65" y="441" fill="#a3b1a5" font-family="sans-serif" font-size="20">${escape(p.short)}</text><text x="65" y="483" fill="#a3b1a5" font-family="monospace" font-size="11">${escape(p.tech.join(' / '))}</text><text x="65" y="588" fill="#a3b1a5" font-family="monospace" font-size="11" letter-spacing="1">PROBLEM → IMPLEMENTATION → TRADEOFFS → EVIDENCE</text><text x="985" y="588" fill="${color}" font-family="monospace" font-size="11">${escape(p.evidence.toUpperCase())}</text><g fill="none" stroke="#344039" stroke-width="1"><rect x="960" y="165" width="90" height="90" transform="rotate(15 1005 210)"/><rect x="975" y="180" width="90" height="90" transform="rotate(15 1020 225)"/><rect x="990" y="195" width="90" height="90" transform="rotate(15 1035 240)"/></g><circle cx="1025" cy="228" r="4" fill="${color}"/></svg>`;
    fs.writeFileSync(path.join(root, 'assets', p.id + '-social.svg'), svg);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(root, 'assets', p.id + '-social.png'));
    console.log('Generated social card:', p.id);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
