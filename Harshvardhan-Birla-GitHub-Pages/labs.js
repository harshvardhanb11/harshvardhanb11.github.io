'use strict';
(() => {
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)],
    core = window.LabCore;
  window.selectLab = function (name, focus = false) {
    $$('[data-lab]').forEach((button) => {
      const active = button.dataset.lab === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    $$('.lab-panel').forEach((panel) => {
      panel.hidden = panel.id !== 'panel-' + name;
    });
  };
  $$('[data-lab]').forEach((button) => {
    button.addEventListener('click', () => window.selectLab(button.dataset.lab));
    button.addEventListener('keydown', (e) => {
      const tabs = $$('[data-lab]').filter((tab) => !tab.hidden),
        index = tabs.indexOf(button);
      let next = null;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        window.selectLab(tabs[next].dataset.lab, true);
      }
    });
  });
  let storageStep = 0;
  function renderStorage() {
    const event = core.storageEvent(storageStep, $('#incarnation-mode').checked);
    $('#storage-step-count').textContent = `Event ${storageStep} / 4`;
    $('#object-old').classList.toggle('deleted', event.oldDeleted);
    $('#old-state').textContent = event.oldDeleted
      ? 'Removed'
      : storageStep === 1
        ? 'Delete requested'
        : 'Unreferenced';
    $('#object-new').classList.toggle('inactive', !event.newExists);
    $('#object-new').classList.toggle('lost', event.newLost);
    $('#new-state').textContent = event.newLost
      ? 'Live data deleted'
      : event.newExists
        ? 'Live reference'
        : 'Not created yet';
    $('#storage-log').textContent = event.message;
    $('#storage-invariant').classList.toggle('bad', event.newLost);
    $('#storage-invariant').innerHTML =
      `<span class="status-dot"></span> ${event.newLost ? 'Violated: old work removed newly referenced A₂.' : event.finished ? 'Preserved: live A₂ survived the stale delete.' : 'Invariant: newly referenced A₂ must survive old work.'}`;
    $('#storage-step').disabled = event.finished;
    $('#storage-step').textContent = event.finished ? 'Scenario complete ✓' : 'Next event →';
  }
  $('#storage-step').addEventListener('click', () => {
    if (storageStep < 4) storageStep++;
    renderStorage();
  });
  $('#storage-reset').addEventListener('click', () => {
    storageStep = 0;
    renderStorage();
  });
  $('#incarnation-mode').addEventListener('change', renderStorage);
  renderStorage();
  const scored = core.scoreReplay();
  function renderReplay() {
    const threshold = Number($('#risk-threshold').value),
      result = core.thresholdMetrics(threshold, scored);
    $('#risk-value').value = threshold.toFixed(2);
    $('#replay-chart').innerHTML = result.rows
      .map(
        (row, i) =>
          `<div class="replay-bar-wrap" title="${row.symbol} · score ${row.score.toFixed(4)} · ${row.expected ? 'labeled alert' : 'labeled normal'} · ${row.alert ? 'alert fired' : 'no alert'}"><span class="score-label">${row.score.toFixed(2)}</span><div class="replay-bar ${row.alert ? (row.expected ? 'alert' : 'false-positive') : row.expected ? 'missed' : ''}" style="height:${Math.max(2, (row.score / 0.55) * 115)}px" aria-hidden="true"></div><small>${row.symbol}</small><span class="sr-only">Record ${i + 1}: ${row.symbol}, score ${row.score.toFixed(4)}, ${row.alert ? 'alert' : 'no alert'}, expected ${row.expected ? 'alert' : 'normal'}.</span></div>`,
      )
      .join('');
    $('#metric-tp').textContent = result.tp;
    $('#metric-fp').textContent = result.fp;
    $('#metric-fn').textContent = result.fn;
    $('#metric-f1').textContent = result.f1.toFixed(2);
    const alerts = result.tp + result.fp;
    $('#replay-summary').textContent = `${alerts} alert${alerts === 1 ? '' : 's'} / 9 records`;
    $('#replay-message').textContent = result.fn
      ? 'The labeled stress event is missed. Silence is not the same as correctness.'
      : result.fp
        ? `The stress event is caught, with ${result.fp} false alarm${result.fp === 1 ? '' : 's'} in this fixture.`
        : 'The labeled stress event is caught with no false alarms in this tiny fixture.';
  }
  $('#risk-threshold').addEventListener('input', renderReplay);
  renderReplay();
  let queue = core.newQueue();
  function renderQueue() {
    $('#queue-slots').innerHTML = Array.from(
      { length: 12 },
      (_, i) =>
        `<div class="queue-slot ${i < queue.depth ? 'filled' : ''}" aria-hidden="true">${i < queue.depth ? '●' : '·'}</div>`,
    ).join('');
    $('#queue-slots').setAttribute(
      'aria-label',
      `Queue occupancy: ${queue.depth} of 12 slots filled`,
    );
    $('#queue-depth').textContent = queue.depth;
    $('#queue-accepted').textContent = queue.accepted;
    $('#queue-processed').textContent = queue.processed;
    $('#queue-rejected').textContent = queue.rejected;
    $('#queue-tick').textContent = `Tick ${queue.tick}`;
    $('#queue-message').textContent =
      queue.tick === 0
        ? 'Set a rate and advance time. Each tick drains existing work, then submits new events.'
        : queue.depth === 12
          ? 'Queue full. New submissions beyond capacity are rejected; the caller needs an explicit overload policy.'
          : `Accepted = processed + queued: ${queue.accepted} = ${queue.processed} + ${queue.depth}. Rejected attempts are counted separately.`;
  }
  ['producer', 'consumer'].forEach((name) =>
    $('#' + name + '-rate').addEventListener('input', () => {
      $('#' + name + '-value').value = $('#' + name + '-rate').value;
    }),
  );
  $('#queue-step').addEventListener('click', () => {
    queue = core.advanceQueue(
      queue,
      Number($('#producer-rate').value),
      Number($('#consumer-rate').value),
    );
    renderQueue();
  });
  $('#queue-reset').addEventListener('click', () => {
    queue = core.newQueue();
    renderQueue();
  });
  renderQueue();
  let orders = core.newOrders(),
    marketStep = -1;
  function renderOrders() {
    $('#order-rows').innerHTML = orders
      .map(
        (order) =>
          `<tr><th scope="row">${order.policy}</th><td>${order.limit.toFixed(4)}</td><td><span class="order-state ${order.status}">${order.status}</span></td><td>${order.reason.replaceAll('_', ' ')}</td></tr>`,
      )
      .join('');
    $('#order-market').textContent =
      marketStep < 0
        ? 'Awaiting tick 0'
        : `Tick ${marketStep} · ${core.market[marketStep].price.toFixed(4)} · liquidity ${(core.market[marketStep].liquidity / 1000000).toFixed(1)}M`;
    $('#order-step').disabled = marketStep === 4;
    $('#order-step').textContent = marketStep === 4 ? 'Replay complete ✓' : 'Next market tick →';
    $('#order-message').textContent =
      marketStep < 0
        ? 'GTC waits. IOC needs an immediate fill. FOK needs full liquidity. GTT has an expiry.'
        : marketStep === 0
          ? 'IOC cancels immediately: its price condition is not met. GTC and GTT wait.'
          : marketStep === 2
            ? 'GTC fills. FOK activates, then cancels because 700,000 liquidity is below its 1,000,000 amount.'
            : marketStep === 4
              ? 'GTT expires before evaluating the now-favorable price. Final: 1 filled, 2 canceled, 1 expired.'
              : 'Pending orders are evaluated again. Terminal states stay terminal.';
  }
  $('#order-step').addEventListener('click', () => {
    if (marketStep < 4) {
      marketStep++;
      orders = core.advanceOrders(orders, marketStep);
    }
    renderOrders();
  });
  $('#order-reset').addEventListener('click', () => {
    orders = core.newOrders();
    marketStep = -1;
    renderOrders();
  });
  renderOrders();
  const requestedLab = new URLSearchParams(location.search).get('lab');
  if (['storage', 'replay', 'queue', 'orders'].includes(requestedLab))
    window.openProjectDemo?.(requestedLab);
  else if (location.hash === '#playground') window.openProjectDemo?.('storage');
})();
