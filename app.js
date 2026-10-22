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
  if (!$('#notes-grid').children.length)
    $('#notes-grid').innerHTML = templates.notes(data.notes, !!window.PORTABLE);
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
  if (!$('#glossary-grid').children.length)
    $('#glossary-grid').innerHTML = templates.glossary(terms, !!window.PORTABLE);
  $('#glossary-search').addEventListener('input', () => {
    const q = $('#glossary-search').value.trim().toLowerCase();
    let count = 0;
    terms.forEach((t) => {
      const el = $('#term-' + t.id);
      el.hidden = ![t.name, t.definition, t.group, t.example].join(' ').toLowerCase().includes(q);
      if (!el.hidden) count++;
    });
    $('#glossary-empty').hidden = count > 0;
  });

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
  function updateTime() {
    try {
      $('#local-time').textContent =
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date()) + ' IST';
    } catch {
      $('#local-time').textContent = 'IST';
    }
  }
  updateTime();
  setInterval(updateTime, 60000);

  $$('[data-filter]').forEach((button) =>
    button.addEventListener('click', () => {
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      let shown = 0;
      $$('.project-card').forEach((card) => {
        const visible =
          button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
        card.hidden = !visible;
        if (visible) {
          shown++;
          card.classList.add('visible');
        }
      });
      $('#work-count').textContent =
        `${String(shown).padStart(2, '0')} project${shown === 1 ? '' : 's'} / ${button.dataset.filter === 'all' ? '03 disciplines' : button.textContent.trim()}`;
    }),
  );
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

  function openReader(html, title) {
    if (!reader.open) {
      scrollBeforeReader = window.scrollY;
      readerTrigger = document.activeElement;
      readerOpenedDirect = !lastRoute && /^#(project|note)\//.test(location.hash);
      if (readerOpenedDirect)
        readerReturnHash = location.hash.startsWith('#note/') ? '#notes' : '#work';
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
      `<header class="reader-hero"><p class="eyebrow">Project ${project.number} / ${escape(project.type)} / ${escape(project.evidence)}</p><h1 id="reader-title">${escape(project.name).replace('\n', ' ')}</h1><p class="reader-subtitle">${escape(project.subtitle)}</p><div class="reader-facts">${project.facts.map((f) => `<div><span>${escape(f[0])}</span><b>${escape(f[1])}</b></div>`).join('')}</div></header>
      <div class="reader-layout"><aside class="reader-toc" aria-label="In this case study"><span>IN THIS STORY</span>${toc}${project.repo ? `<a href="${data.github}/${project.repo}" target="_blank" rel="noopener noreferrer">Open repository ↗</a>` : ''}</aside><article class="reader-article"><p class="reader-intro">${escape(project.intro)}</p>${templates.architecture(project.id)}${termMarkup}${project.sections.map((s, i) => `<section class="reader-chapter" id="chapter-${project.id}-${i}"><h2>${escape(s[0])}</h2><p>${escape(s[1])}</p></section>`).join('')}${templates.decisions(window.DESIGN_DECISIONS?.[project.id])}<blockquote class="reader-question">${escape(project.question)}</blockquote>${project.lab ? `<button class="button button-lime" data-jump-lab="${project.lab}">Explore the interactive lab ↗</button>` : ''}${sources ? `<section class="reader-sources"><h2>Go to the evidence</h2>${sources}</section>` : ''}<p class="reader-provenance">${escape(project.provenance)}</p><div class="reader-actions"><button class="text-button" id="copy-case-link">Copy story link ⧉</button><a href="#project/${next.id}">Next: ${escape(next.short)} →</a></div></article></div>`,
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
        closeReader('#playground');
        window.selectLab?.(labButton.dataset.jumpLab);
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
      `<header class="reader-hero"><p class="eyebrow">Field note / ${escape(note.category)}</p><h1 id="reader-title">${escape(note.title)}</h1><p class="reader-subtitle">${escape(note.intro)}</p></header><article class="note-body">${note.paragraphs.map((p, i) => `<p${i === 0 ? ' class="reader-intro"' : ''}>${escape(p)}</p>`).join('')}<div class="reader-actions"><a href="#project/${note.related}">Explore the related project ↗</a><a href="#notes" data-close-reader="#notes">All field notes →</a></div></article>`,
      note.title,
    );
    $('[data-close-reader]', reader).addEventListener('click', (e) => {
      e.preventDefault();
      closeReader('#notes');
    });
  }
  function colophon() {
    openReader(
      `<header class="reader-hero"><p class="eyebrow">Colophon / About this site</p><h1 id="reader-title">Built around the work.</h1><p class="reader-subtitle">A portfolio should make reasoning easier to inspect.</p></header><article class="note-body"><p class="reader-intro">The visual language borrows from engineering drawings: boundaries, coordinates, signals, and deliberate annotations.</p><ul class="colophon-list"><li>Eight project stories separate public source evidence, supplied resume information, and architectural analysis.</li><li>Four browser labs illustrate delayed deletion, threshold evaluation, backpressure, and order-state transitions.</li><li>The hero is a procedural Canvas drawing. There are no stock photographs, remote fonts, tracking scripts, analytics, or third-party runtime libraries.</li><li>Theme preference is stored locally. Reduced-motion preferences are respected, and animation can be paused manually.</li><li>This portfolio was drafted and implemented with AI assistance from the supplied resume and public repositories. That does not imply AI was used in the original projects.</li><li>Reported benchmark results are attributed to the repository. Simulations are labeled and do not execute the original backends.</li><li>The site itself adds no visitor analytics. A hosting provider may maintain its own access logs.</li></ul><p>Content was prepared from the resume and public GitHub material inspected on 22 October 2026. Employer source code and nonpublic engineering details are not included.</p></article>`,
      'About this site',
    );
  }
  function closeReader(target) {
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
      reader.close();
      document.body.style.overflow = '';
      document.title = originalTitle;
    }
    if (hash.startsWith('#term-')) {
      const term = document.getElementById(hash.slice(1));
      if (term?.classList.contains('term-card')) {
        $('#glossary-search').value = '';
        $$('.term-card').forEach((card) => (card.hidden = false));
        $('#glossary-empty').hidden = true;
        term.open = true;
        requestAnimationFrame(() =>
          term.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant', block: 'start' }),
        );
      }
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
  $('#open-colophon').addEventListener('click', () => {
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

  const searchItems = [
    ...data.projects.map((p) => ({
      title: p.short,
      kind: 'Project',
      search: `${p.short} ${p.description} ${p.tech.join(' ')} ${p.sections.map((s) => s.join(' ')).join(' ')}`,
      href: '#project/' + p.id,
    })),
    ...data.notes.map((n) => ({
      title: n.title,
      kind: 'Field note',
      search: n.title + ' ' + n.intro + ' ' + n.paragraphs.join(' '),
      href: '#note/' + n.id,
    })),
    ...terms.map((t) => ({
      title: t.name,
      kind: 'Plain-English term',
      search: [t.name, t.definition, t.example, t.group].join(' '),
      href: '#term-' + t.id,
    })),
    {
      title: 'The systems playground',
      kind: 'Interactive labs',
      search: 'lab simulation queue storage thresholds orders playground',
      href: '#playground',
    },
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
