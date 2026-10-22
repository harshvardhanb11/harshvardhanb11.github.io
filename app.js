'use strict';
(() => {
  const data = window.PORTFOLIO;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const root = document.documentElement;
  const reader = $('#reader');
  const searchDialog = $('#search-dialog');
  let scrollBeforeReader = 0,
    readerReturnHash = '#work',
    readerTrigger = null,
    readerOpenedDirect = false;
  let lastRoute = '';
  const originalTitle = document.title;
  const assetSource = (project, path) => `${data.github}/${project.repo}/blob/main/${path}`;
  const templates = window.PortfolioTemplates;
  if (!$('#project-grid').children.length)
    $('#project-grid').innerHTML = templates.projects(data.projects, !!window.PORTABLE);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-project-id],a[data-note-id]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const hash = a.dataset.projectId
      ? '#project/' + a.dataset.projectId
      : '#note/' + a.dataset.noteId;
    if (location.hash === hash) handleRoute();
    else location.hash = hash;
  });
  const terms = window.GLOSSARY || [];
  function applyTheme(theme) {
    root.dataset.theme = theme;
    $('#theme-toggle').setAttribute(
      'aria-label',
      `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
    );
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#101815' : '#f3f1e9';
  }
  try {
    const theme = localStorage.getItem('hb-portfolio-theme');
    if (theme === 'light' || theme === 'dark') applyTheme(theme);
  } catch {}
  $('#theme-toggle').addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try {
      localStorage.setItem('hb-portfolio-theme', theme);
    } catch {}
  });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    $('#mobile-nav').hidden = !open;
  });
  $$('#mobile-nav a').forEach((a) =>
    a.addEventListener('click', () => {
      $('#mobile-nav').hidden = true;
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
    }),
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#mobile-nav').hidden) {
      $('#mobile-nav').hidden = true;
      $('#menu-toggle').setAttribute('aria-expanded', 'false');
      $('#menu-toggle').focus();
    }
  });

  function parkDemos() {
    const demo = $('#playground'),
      store = $('#demo-store');
    if (demo && store) {
      store.appendChild(demo);
      demo.hidden = true;
    }
  }
  function openReader(html, title) {
    parkDemos();
    if (!reader.open) {
      scrollBeforeReader = window.scrollY;
      readerTrigger = document.activeElement;
      readerOpenedDirect = !lastRoute && /^#(project|note)\//.test(location.hash);
      if (readerOpenedDirect) readerReturnHash = '#work';
      else if (lastRoute && !/^#(project|note)\//.test(lastRoute) && lastRoute !== '#colophon')
        readerReturnHash = lastRoute;
      document.body.style.overflow = 'hidden';
      reader.showModal();
    }
    $('#reader-content').innerHTML = html;
    document.title = `${title} — Harshvardhan Birla`;
    reader.scrollTop = 0;
    $('#reader-x').focus({ preventScroll: true });
  }
  function caseStudy(project) {
    const index = data.projects.indexOf(project),
      next = data.projects[(index + 1) % data.projects.length];
    const toc = project.sections
      .map(
        (s, i) =>
          `<a href="#chapter-${project.id}-${i}" data-chapter="chapter-${project.id}-${i}">${escape(s[0])}</a>`,
      )
      .join('');
    const sources = project.sources
      .map(
        (s) =>
          `<a href="${assetSource(project, s[1])}" target="_blank" rel="noopener noreferrer">${escape(s[0])} ↗</a>`,
      )
      .join('');
    const projectTerms = terms.filter((t) => t.project === project.id).slice(0, 4);
    const termMarkup = projectTerms.length
      ? `<details class="reader-terms"><summary>Key terms in plain English <span>+</span></summary>${projectTerms.map((t) => `<div><h3>${escape(t.name)}</h3><p>${escape(t.definition)}</p></div>`).join('')}</details>`
      : '';
    openReader(
      `<header class="reader-hero"><p class="eyebrow">Project ${project.number} / ${escape(project.type)}</p><h1 id="reader-title">${escape(project.name).replace('\n', ' ')}</h1><p class="reader-tagline">${escape(project.tagline).replace('\n', ' ')}</p><p class="reader-subtitle">${escape(project.subtitle)}</p><div class="reader-facts">${project.facts.map((f) => `<div><span>${escape(f[0])}</span><b>${escape(f[1])}</b></div>`).join('')}</div></header>
      <div class="reader-layout"><aside class="reader-toc" aria-label="In this case study"><span>IN THIS STORY</span>${toc}${project.repo ? `<a href="${data.github}/${project.repo}" target="_blank" rel="noopener noreferrer">Open repository ↗</a>` : ''}</aside><article class="reader-article"><p class="reader-intro">${escape(project.intro)}</p>${project.lab ? `<button class="button button-lime demo-open-button" data-jump-lab="${project.lab}" aria-expanded="false" aria-controls="reader-demo-slot">Try the interactive demo ↓</button><div id="reader-demo-slot"></div>` : ''}${templates.architecture(project.id)}${termMarkup}${project.sections.map((s, i) => `<section class="reader-chapter" id="chapter-${project.id}-${i}"><h2>${escape(s[0])}</h2><p>${escape(s[1])}</p></section>`).join('')}${templates.decisions(window.DESIGN_DECISIONS?.[project.id])}${sources ? `<section class="reader-sources"><h2>Explore the code</h2>${sources}</section>` : ''}<div class="reader-actions"><button class="text-button" id="copy-case-link">Copy story link ⧉</button><a href="#project/${next.id}">Next: ${escape(next.short)} →</a></div></article></div>`,
      project.short,
    );
    $$('[data-chapter]', reader).forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document
          .getElementById(a.dataset.chapter)
          .scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant', block: 'start' });
      }),
    );
    const labButton = $('[data-jump-lab]', reader);
    if (labButton)
      labButton.addEventListener('click', () => {
        const demo = $('#playground');
        const opening = labButton.getAttribute('aria-expanded') !== 'true';
        labButton.setAttribute('aria-expanded', String(opening));
        if (!opening) {
          parkDemos();
          return;
        }
        $('#reader-demo-slot').appendChild(demo);
        demo.hidden = false;
        const allowed = project.id === 'event-engine' ? ['replay', 'queue'] : [project.lab];
        $$('[data-lab]').forEach((tab) => {
          tab.hidden = !allowed.includes(tab.dataset.lab);
        });
        $('.lab-tabs').hidden = allowed.length === 1;
        window.selectLab?.(labButton.dataset.jumpLab);
        demo.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant', block: 'start' });
      });
    $('#copy-case-link').addEventListener('click', async () => {
      const url =
        window.PORTABLE || location.protocol === 'file:'
          ? location.href
          : new URL(`projects/${project.id}/`, new URL('.', location.href)).href;
      const ok = await copyText(url);
      $('#copy-case-link').textContent = ok
        ? 'Story link copied ✓'
        : 'Select the address in your browser to copy';
    });
  }
  function fieldNote(note) {
    openReader(
      `<header class="reader-hero"><p class="eyebrow">Field note / ${escape(note.category)}</p><h1 id="reader-title">${escape(note.title)}</h1><p class="reader-subtitle">${escape(note.intro)}</p></header><article class="note-body">${note.paragraphs.map((p, i) => `<p${i === 0 ? ' class="reader-intro"' : ''}>${escape(p)}</p>`).join('')}<div class="reader-actions"><a href="#project/${note.related}">Explore the related project ↗</a><a href="#work" data-close-reader="#work">All projects →</a></div></article>`,
      note.title,
    );
    $('[data-close-reader]', reader).addEventListener('click', (e) => {
      e.preventDefault();
      closeReader('#work');
    });
  }
  function colophon() {
    openReader(
      `<header class="reader-hero"><p class="eyebrow">Colophon / About this site</p><h1 id="reader-title">Built around the work.</h1><p class="reader-subtitle">A portfolio should make reasoning easier to inspect.</p></header><article class="note-body"><p class="reader-intro">The visual language borrows from engineering drawings: boundaries, coordinates, signals, and deliberate annotations.</p><p>Eight project stories explore design decisions, failure modes, and tradeoffs. Four interactive labs let you change a condition and follow the consequences.</p><p>The motion is drawn in Canvas. You can pause it, switch themes, or use your device’s reduced-motion setting.</p><p>Built with AI assistance, then checked against project code and reproducible tests. Read the field note for the process.</p><p>No visitor analytics or tracking scripts.</p></article>`,
      'About this site',
    );
  }
  function closeReader(target) {
    parkDemos();
    if (reader.open) reader.close();
    document.body.style.overflow = '';
    document.title = originalTitle;
    const dest = target || readerReturnHash || '#work',
      direct = readerOpenedDirect;
    readerOpenedDirect = false;
    history.replaceState(null, '', dest);
    lastRoute = dest;
    if (target || direct) {
      requestAnimationFrame(() => {
        const section = document.getElementById(dest.slice(1));
        section?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant' });
        const heading = section?.querySelector('h2');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      });
    } else {
      window.scrollTo({ top: scrollBeforeReader, behavior: 'instant' });
      if (readerTrigger && readerTrigger.isConnected) readerTrigger.focus({ preventScroll: true });
    }
  }
  function handleRoute() {
    const hash = location.hash;
    if (hash.startsWith('#project/')) {
      const p = data.projects.find((p) => p.id === hash.slice(9));
      if (p) {
        caseStudy(p);
      } else {
        showMissing('project');
      }
    } else if (hash.startsWith('#note/')) {
      const n = data.notes.find((n) => n.id === hash.slice(6));
      if (n) {
        fieldNote(n);
      } else {
        showMissing('note');
      }
    } else if (hash === '#colophon') {
      colophon();
    } else if (reader.open) {
      parkDemos();
      reader.close();
      document.body.style.overflow = '';
      document.title = originalTitle;
    }
    lastRoute = hash;
  }
  function showMissing(kind) {
    openReader(
      `<header class="reader-hero"><p class="eyebrow">Link not found</p><h1 id="reader-title">That ${kind} isn’t here.</h1><p class="reader-subtitle">Use the close button to return to the portfolio, or search for another topic.</p></header>`,
      'Story not found',
    );
  }
  $('#reader-close').addEventListener('click', (e) => {
    e.preventDefault();
    closeReader();
  });
  $('#reader-x').addEventListener('click', () => closeReader());
  reader.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeReader();
  });
  reader.addEventListener('click', (e) => {
    if (e.target === reader) {
      const r = reader.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        closeReader();
    }
  });
  window.addEventListener('hashchange', handleRoute);
  $('#open-colophon')?.addEventListener('click', () => {
    location.hash = 'colophon';
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#project/"],a[href^="#note/"]');
    if (a && a.hash === location.hash) {
      e.preventDefault();
      handleRoute();
    }
  });
  handleRoute();
  window.openProjectDemo = (name) => {
    const id = {
      storage: 'snapshot-prune',
      replay: 'event-engine',
      queue: 'event-engine',
      orders: 'order-agent',
    }[name];
    const project = data.projects.find((p) => p.id === id);
    if (!project) return;
    history.replaceState(null, '', '#project/' + id);
    caseStudy(project);
    $('[data-jump-lab]', reader)?.click();
    window.selectLab?.(name);
    lastRoute = location.hash;
  };

  const searchItems = [
    ...data.projects.map((p) => ({
      title: p.short,
      kind: 'Project',
      search: `${p.short} ${p.description} ${p.tech.join(' ')} ${p.sections.map((s) => s.join(' ')).join(' ')} ${terms
        .filter((t) => t.project === p.id)
        .map((t) => t.name)
        .join(' ')}`,
      href: '#project/' + p.id,
    })),
    {
      title: 'About & experience',
      kind: 'Background',
      search: 'oracle BITS experience resume about education',
      href: '#about',
    },
  ];
  function renderSearch() {
    const q = $('#site-search').value.toLowerCase().trim();
    const matches = searchItems.filter((item) =>
      q.split(/\s+/).every((word) => item.search.toLowerCase().includes(word)),
    );
    $('#search-results').innerHTML = matches.length
      ? matches
          .map(
            (item) =>
              `<a class="search-result" href="${item.href}">${escape(item.title)} <span>${item.kind} ↗</span></a>`,
          )
          .join('')
      : '<p class="no-results">No results yet. Try “queue”, “storage”, “Oracle”, or “model”.</p>';
    $$('.search-result', searchDialog).forEach((a) =>
      a.addEventListener('click', () => searchDialog.close()),
    );
  }
  function openSearch() {
    if (reader.open) closeReader();
    searchDialog.showModal();
    $('#site-search').value = '';
    renderSearch();
    $('#site-search').focus();
  }
  $$('.command-button').forEach((b) => b.addEventListener('click', openSearch));
  $('#search-close').addEventListener('click', () => searchDialog.close());
  $('#site-search').addEventListener('input', renderSearch);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchDialog.open ? searchDialog.close() : openSearch();
    }
  });
  searchDialog.addEventListener('click', (e) => {
    if (e.target === searchDialog) {
      const r = searchDialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        searchDialog.close();
    }
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        const ok = document.execCommand('copy');
        field.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }
  $('.copy-email').addEventListener('click', async () => {
    const ok = await copyText(data.email);
    $('#copy-status').textContent = ok
      ? 'Email address copied.'
      : 'Copy the email address from the adjacent link.';
    $('.copy-email').textContent = ok ? '✓' : '⧉';
    setTimeout(() => {
      $('.copy-email').textContent = '⧉';
    }, 2500);
  });
  function motionAllowed() {
    return (
      !matchMedia('(prefers-reduced-motion: reduce)').matches && root.dataset.motion !== 'paused'
    );
  }
  window.motionAllowed = motionAllowed;
  const motionButton = $('#motion-toggle'),
    media = matchMedia('(prefers-reduced-motion: reduce)');
  function setMotion(paused) {
    const effective = media.matches || paused;
    root.dataset.motion = effective ? 'paused' : 'running';
    motionButton.setAttribute('aria-pressed', String(effective));
    motionButton.disabled = media.matches;
    motionButton.textContent = media.matches
      ? 'Reduced motion enabled'
      : effective
        ? 'Resume motion ▶'
        : 'Pause motion Ⅱ';
    window.dispatchEvent(new Event('portfolio-motion'));
  }
  setMotion(media.matches);
  motionButton.addEventListener('click', () => setMotion(root.dataset.motion !== 'paused'));
  media.addEventListener?.('change', (e) => setMotion(e.matches));
  if ('IntersectionObserver' in window && motionAllowed()) {
    root.classList.add('motion-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    $$('.reveal').forEach((el) => observer.observe(el));
  }
  let progressPending = false;
  window.addEventListener(
    'scroll',
    () => {
      if (progressPending) return;
      progressPending = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        $('#page-progress').style.width = (max > 0 ? (100 * scrollY) / max : 0) + '%';
        progressPending = false;
      });
    },
    { passive: true },
  );
})();
