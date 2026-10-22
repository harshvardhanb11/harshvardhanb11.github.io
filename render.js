/* Shared deterministic templates for progressive static export and browser UI. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioTemplates = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const e = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const graphics = {
    engine:
      '<div class="engine-path"><span class="engine-box">event</span><span class="path-arrow">→</span><span class="engine-box lit">SPSC</span><span class="path-arrow">→</span><span class="engine-box">decision</span></div>',
    storage:
      '<div class="card-graphic-storage"><strong>A₁</strong><small>≠</small><strong>A₂</strong></div>',
    loop: '<div class="loop-rings"><i></i><i></i><i></i><i></i></div>',
    orders:
      '<div class="order-graphic"><span>GTC</span><span>GTT</span><span>IOC</span><span>FOK</span></div>',
    ml: '<div class="ml-graphic">RoBERTa</div>',
    distributed:
      '<div class="nodes-graphic"><i></i><span>↔</span><i></i><span>↔</span><i></i></div>',
    compute:
      '<div class="engine-path"><span class="engine-box">worker</span><span class="path-arrow">↔</span><span class="engine-box lit">state</span><span class="path-arrow">↔</span><span class="engine-box">worker</span></div>',
    training: '<div class="ml-graphic">n → n + 1</div>',
  };
  function projects(items, portable = false) {
    return items
      .map(
        (p) =>
          `<article class="project-card reveal" data-category="${p.category}" aria-labelledby="card-${p.id}"><div class="project-visual"><div class="visual-grid" aria-hidden="true"></div><span class="visual-code">${p.number} / ${e(p.type.toUpperCase())}</span><div class="visual-center" aria-hidden="true">${graphics[p.visual]}</div><span class="visual-caption">${e(p.metricLabel)}</span></div><div class="project-info"><div class="project-meta"><span>${e(p.type)}</span></div><h3 class="project-title" id="card-${p.id}">${e(p.name)}</h3><p class="project-tagline">${e(p.tagline)}</p><p>${e(p.description)}</p><div class="project-tags">${p.tech.map((t) => `<span>${e(t)}</span>`).join('')}</div><a class="project-link" data-project-id="${p.id}" href="${portable ? '#project/' + p.id : 'projects/' + p.id + '/'}" aria-label="Read ${e(p.short)} case study">View project <span>↗</span></a></div></article>`,
      )
      .join('');
  }
  function notes(items, portable = false) {
    return items
      .map(
        (n) =>
          `<article class="note-card reveal"><span class="eyebrow">${e(n.category)}</span><h3>${e(n.title)}</h3><p>${e(n.intro)}</p><a data-note-id="${n.id}" href="${portable ? '#note/' + n.id : 'notes/' + n.id + '/'}" aria-label="Read ${e(n.title)}">Read field note <span>↗</span></a></article>`,
      )
      .join('');
  }
  function glossary(terms, portable = false) {
    return terms
      .map(
        (t) =>
          `<details class="term-card" id="term-${t.id}"><summary>${e(t.name)}<span aria-hidden="true">+</span></summary><div><span class="eyebrow">${e(t.group)}</span><p>${e(t.definition)}</p><p class="term-example">${e(t.example)}</p><a data-project-id="${t.project}" href="${portable ? '#project/' + t.project : 'projects/' + t.project + '/'}">See it in a project ↗</a></div></details>`,
      )
      .join('');
  }
  const diagrams = {
    'event-engine': {
      lanes: [
        [
          ['Live / CSV / sample', 'Inputs'],
          ['IDataSource', 'Shared interface'],
          ['RiskEngine', 'Core decisions'],
        ],
        [
          ['Producer', 'Queue benchmark'],
          ['SPSC buffer', 'Bounded handoff'],
          ['Consumer', 'Drains events'],
        ],
      ],
      caption:
        'Two views of the implementation. The queue benchmark is separate from the CLI source-to-scoring path.',
    },
    'snapshot-prune': {
      lanes: [
        [
          ['Snapshot APIs', 'Operations'],
          ['PostgreSQL', 'Transactional metadata'],
          ['References', 'Logical liveness'],
        ],
        [
          ['Upload / restore', 'Data access'],
          ['Object store', 'Physical objects'],
          ['Incarnations', 'Distinct lifetimes'],
        ],
      ],
      caption:
        'Conceptual model: transactional metadata tracks logical references while the object store holds distinct physical lifetimes.',
    },
    loopbreaker: {
      lanes: [
        [
          ['Page & media', 'Observed signals'],
          ['Identity matching', 'Avoid double counts'],
          ['Session state', 'Local persistence'],
        ],
        [
          ['Playback gates', 'Count active time'],
          ['Milestones', 'Intervention policy'],
          ['Pause / choice', 'User interaction'],
        ],
      ],
      caption:
        'Observation and intervention responsibilities in the browser content script. Heuristic identity remains a limitation.',
    },
    'order-agent': {
      lanes: [
        [
          ['RPC reads', 'Quotes & balances'],
          ['Order policies', 'Lifetime & liquidity'],
          ['Mock submission', 'Encoded calldata'],
        ],
      ],
      caption:
        'Live quotes and balance reads feed order policies; the current submission path is mocked.',
    },
    sentiment: {
      lanes: [
        [
          ['Interview data', 'Transcript preparation'],
          ['Tokenizer', 'Model inputs'],
          ['RoBERTa', 'Fine-tuning'],
        ],
        [
          ['Validation split', 'Held-out examples'],
          ['MSE workflow', 'Documented metric'],
          ['Model export', 'Saved artifact'],
        ],
      ],
      caption:
        'Exploratory training workflow: transcript preparation, tokenization, validation, and model export.',
    },
    'distributed-storage': {
      lanes: [
        [
          ['Kafka', 'Partitioned movement'],
          ['Consumers', 'Parallel work'],
          ['Storage nodes', 'Data access'],
        ],
        [
          ['Metadata', 'Replicated state'],
          ['Node failure', 'Tested scenario'],
          ['Recovery', 'Reported behavior'],
        ],
      ],
      caption:
        'Partitioned data movement and replicated metadata support recovery in the tested single-node failure scenario.',
    },
    'compute-platform': {
      roles: true,
      lanes: [
        [
          ['HDFS', 'Durable storage'],
          ['Redis', 'Low-latency state'],
          ['ZooKeeper', 'Coordination'],
        ],
      ],
      caption:
        'HDFS, Redis, and ZooKeeper divide durable storage, fast state access, and worker coordination.',
    },
    'distributed-training': {
      lanes: [
        [
          ['MNIST & script', 'Training inputs'],
          ['Estimator', 'Distribution setup'],
          ['Training job', 'Managed workers'],
        ],
        [
          ['Model artifact', 'Training output'],
          ['Endpoint', 'Hosted deployment'],
          ['Inference', 'Prediction request'],
        ],
      ],
      caption:
        'A walkthrough from distributed training configuration to a hosted inference endpoint.',
    },
  };
  function architecture(id) {
    const d = diagrams[id];
    if (!d) return '';
    return `<figure class="architecture-diagram"><div class="architecture-title"><span class="eyebrow">System at a glance</span><span class="mono">${d.roles ? 'Component roles' : 'Responsibility flow'}</span></div>${d.lanes.map((lane) => `<div class="architecture-lane">${lane.map((node, index) => `${index && !d.roles ? '<span class="architecture-arrow" aria-hidden="true">→</span>' : ''}<div class="architecture-node"><strong>${e(node[0])}</strong><small>${e(node[1])}</small></div>`).join('')}</div>`).join('')}<figcaption>${e(d.caption)}</figcaption></figure>`;
  }
  function decisions(rows) {
    if (!rows?.length) return '';
    return `<section class="decision-section"><h2>Design alternatives, compared</h2><p class="decision-context">What each approach makes easier, and what it asks you to handle.</p><div class="decision-scroll"><table class="decision-table"><caption class="sr-only">Design choices, alternatives, and their tradeoffs</caption><thead><tr><th scope="col">Choice explored</th><th scope="col">Alternative</th><th scope="col">What changes</th></tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${e(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  return { escape: e, projects, notes, glossary, architecture, decisions };
});
