# Harshvardhan Birla — Engineering the invisible

A complete static portfolio: eight detailed engineering case studies, four field notes, a 24-term glossary, four interactive systems labs, a procedural Canvas hero, light/dark themes, accessible keyboard controls, and a printable resume.

## Open it immediately

Open `Harshvardhan-Birla-Portfolio.html` in a current browser. It contains the styles, scripts, graphics, and resume in one file. It works without a build step, a server, external fonts, or runtime packages.

For publishing, use the **contents of `dist/`**. The exported site also includes standalone project and article pages that work without JavaScript.

## Publish without linking GitHub

The site has been built locally; it has **not** been published from this workspace. A download or local preview is not a public website address.

### Netlify manual deployment

1. Sign in to your own Netlify account.
2. Use its manual deployment / drag-and-drop flow.
3. Upload the `dist` folder, with `index.html` directly inside that folder.
4. Open the production URL Netlify returns. Choose a site name in that account if desired and available.
5. Verify the homepage, a project page, the resume, and the labs on your phone.

Official instructions: https://docs.netlify.com/deploy/create-deploys/#drag-and-drop

### Cloudflare Pages Direct Upload

1. Sign in to your own Cloudflare account.
2. Create a Pages project using Direct Upload.
3. Upload `dist` using the dashboard’s drag-and-drop flow.
4. Deploy, then use the production URL returned by Cloudflare.

Official instructions: https://developers.cloudflare.com/pages/get-started/direct-upload/

No Git integration is needed for either manual-upload route. Neither provider has been connected or used to publish this site here.

### What “lasting” means

No hosted service can promise access “until infinity.” A public address depends on the hosting account, project, provider service, and applicable plan remaining active. A custom domain also needs renewal. Keep this source archive so the site can move to another host. No paid subscription or domain purchase has been made.

After publishing, set the real public address and rebuild to add canonical links, an XML sitemap, and absolute social-image URLs:

```sh
SITE_URL=https://your-actual-production-address.example node build.mjs
```

Replace that example with the exact real address, then redeploy `dist`. Do not treat the example as a live website.

## Edit and rebuild

- `content.js`: project stories and field notes.
- `glossary.js`: definitions and examples.
- `index.html`: homepage structure.
- `styles.css`: layout, themes, responsive rules, and typography.
- `app.js`: navigation, search, case reader, filtering, and preferences.
- `render.js`: shared templates used by the static export and browser.
- `lab-core.js`: pure deterministic lab models.
- `labs.js`: lab controls and rendering.
- `visuals.js`: procedural Canvas artwork.
- `resume.html`: print-ready resume.
- `build.mjs`: standalone page generation and single-file export.
- `detail.js`: standalone article theme control.

```sh
node build.mjs
node --test tests/core.test.cjs
```

For local HTTP navigation:

```sh
python3 -m http.server 8000 --directory dist
```

Then open http://localhost:8000. Node is only needed for rebuilding and tests. Visitors receive ordinary static HTML, CSS, and JavaScript.

`PUBLISH.html` is a plain-language publishing guide for the site owner. `VALIDATION.md` and `validation-results.json` describe the checks performed and their limits. To reproduce optional DOM and accessibility checks, use Node 24.8+, install development dependencies, then run `npm run test:ui` and `npm run audit`.

## Evidence and content boundaries

- Public source was read from `github.com/harshvardhanb11`.
- Live Snapshot Prune, Distributed Storage Engine, and Compute Orchestration are based on the supplied resume; public implementations were not located on that profile.
- Benchmark figures are repository-reported. Network and durable-storage latency are outside the stated microbenchmark scope.
- The Curve agent reads live RPC data, but signing and submission are mocked.
- The replay lab ports the small repository scoring rule and CSV fixture into JavaScript. It does not execute the C++ backend.
- The storage and queue labs are conceptual models; they are not correctness proofs or performance measurements.
- The website does not claim that interview sentiment measures competence or that the original projects used generative AI.
- The supplied resume versions contain different defect counts. This version avoids those disputed counts.
- AI assisted preparation of this website. That is disclosed in the colophon.
- The original C++ order-policy harness was compiled and run as a cross-check. The nine browser replay scores were also compared with the original C++ RiskEngine and matched to within 1e-10.

Employer source code, private diagnostics, and an unverified LinkedIn URL are not included.

## Accessibility and privacy

The site includes a skip link, semantic headings, labeled controls, native dialogs and disclosure widgets, keyboard-operable tabs, visible focus outlines, live result announcements, reduced-motion support, and an explicit animation pause control. Preferences are stored locally, when available.

The code adds no analytics, form backend, external script dependencies, or remote font requests. The hosting provider may maintain its own access logs.

## Maintenance

Change facts and metrics in `content.js`, rebuild, run tests, and redeploy. Check linked repositories and contact details periodically. Avoid replacing carefully scoped benchmark descriptions with broad production-performance claims.
