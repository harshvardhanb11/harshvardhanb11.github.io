/* Pure, deterministic browser-lab models. No backend or market connection. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const replay = [
    { symbol: 'USDC', price: 1, volume: 1200000, liquidity: 5, expected: false },
    { symbol: 'USDC', price: 0.9992, volume: 1400000, liquidity: 4.8, expected: false },
    { symbol: 'USDC', price: 0.9935, volume: 2500000, liquidity: 2, expected: false },
    { symbol: 'USDC', price: 0.982, volume: 6200000, liquidity: 0.7, expected: true },
    { symbol: 'USDT', price: 1.0001, volume: 2200000, liquidity: 6, expected: false },
    { symbol: 'USDT', price: 0.9998, volume: 2000000, liquidity: 6.2, expected: false },
    { symbol: 'DAI', price: 1.0003, volume: 900000, liquidity: 4.5, expected: false },
    { symbol: 'DAI', price: 1.0012, volume: 850000, liquidity: 4.5, expected: false },
    { symbol: 'FRAX', price: 0.989, volume: 1500000, liquidity: 0.8, expected: false },
  ];
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function scoreReplay(records = replay) {
    const histories = {};
    return records.map((row) => {
      const prices = histories[row.symbol] || (histories[row.symbol] = []);
      prices.push(row.price);
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const sd = Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length);
      const score = clamp(
        0.65 * clamp(Math.abs(row.price - 1) / 0.05) +
          0.25 * clamp(sd / 0.02) +
          0.1 * (row.liquidity <= 0 ? 1 : clamp(1 / row.liquidity)),
      );
      return { ...row, score };
    });
  }
  function thresholdMetrics(threshold, records = scoreReplay()) {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1)
      throw new RangeError('Threshold must be between 0 and 1.');
    let tp = 0,
      fp = 0,
      fn = 0,
      tn = 0;
    const rows = records.map((row) => {
      const alert = row.score >= threshold;
      if (alert && row.expected) tp++;
      else if (alert) fp++;
      else if (row.expected) fn++;
      else tn++;
      return { ...row, alert };
    });
    const precision = tp + fp ? tp / (tp + fp) : 0,
      recall = tp + fn ? tp / (tp + fn) : 0;
    return {
      tp,
      fp,
      fn,
      tn,
      precision,
      recall,
      f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
      rows,
    };
  }
  function newQueue() {
    return { depth: 0, accepted: 0, processed: 0, rejected: 0, tick: 0 };
  }
  function advanceQueue(state, producer, consumer, capacity = 12) {
    if (
      ![producer, consumer, capacity].every(Number.isInteger) ||
      producer < 0 ||
      consumer < 0 ||
      capacity < 1
    )
      throw new RangeError('Nonnegative integer rates and positive capacity are required.');
    // A discrete tick drains first, then attempts the producer batch.
    const processed = Math.min(consumer, state.depth),
      remaining = state.depth - processed;
    const accepted = Math.min(producer, capacity - remaining),
      rejected = producer - accepted;
    return {
      depth: remaining + accepted,
      accepted: state.accepted + accepted,
      processed: state.processed + processed,
      rejected: state.rejected + rejected,
      tick: state.tick + 1,
    };
  }
  const market = [
    { price: 0.995, liquidity: 2000000 },
    { price: 1.006, liquidity: 1500000 },
    { price: 1.021, liquidity: 700000 },
    { price: 1.035, liquidity: 3000000 },
    { price: 1.041, liquidity: 2500000 },
  ];
  function newOrders() {
    return [
      {
        policy: 'GTC',
        limit: 1.02,
        amount: 1000000,
        expiry: 0,
        activation: 0,
        status: 'PENDING',
        reason: 'waiting',
      },
      {
        policy: 'IOC',
        limit: 1.03,
        amount: 1000000,
        expiry: 0,
        activation: 0,
        status: 'PENDING',
        reason: 'waiting',
      },
      {
        policy: 'FOK',
        limit: 1.02,
        amount: 1000000,
        expiry: 0,
        activation: 2,
        status: 'PENDING',
        reason: 'activates at tick 2',
      },
      {
        policy: 'GTT',
        limit: 1.04,
        amount: 1000000,
        expiry: 3,
        activation: 0,
        status: 'PENDING',
        reason: 'waiting',
      },
    ];
  }
  function advanceOrders(orders, step) {
    if (!market[step]) throw new RangeError('Market tick outside fixture.');
    const tick = market[step];
    return orders.map((original) => {
      const order = { ...original };
      if (order.status !== 'PENDING' || step < order.activation) return order;
      if (order.policy === 'GTT' && step > order.expiry)
        return { ...order, status: 'EXPIRED', reason: 'time_expired' };
      if (tick.price < order.limit) {
        if (order.policy === 'IOC' || order.policy === 'FOK')
          return { ...order, status: 'CANCELED', reason: 'price_not_met' };
        return { ...order, reason: 'price_not_met' };
      }
      if (order.policy === 'FOK' && tick.liquidity < order.amount)
        return { ...order, status: 'CANCELED', reason: 'insufficient_liquidity' };
      return {
        ...order,
        status: 'FILLED',
        reason: 'limit_crossed',
        fill: tick.price,
        fillStep: step,
      };
    });
  }
  function storageEvent(step, aware = true) {
    if (!Number.isInteger(step) || step < 0 || step > 4)
      throw new RangeError('Storage event outside scenario.');
    const descriptions = [
      'Ready. A₁ has no live references. Issue its deletion to begin.',
      `Delete requested for ${aware ? 'incarnation A₁' : 'content address H'}. The response is uncertain.`,
      'The first attempt removes A₁, but its acknowledgement is lost. A retry remains pending.',
      'An upload creates live A₂ with the same content hash H. Old delete work is still pending.',
      aware
        ? 'The retry targets A₁ only. A₂ survives: stale work cannot delete its new lifetime.'
        : 'The retry targets H. It resolves to A₂ and deletes live data: the invariant is violated.',
    ];
    return {
      step,
      aware,
      oldDeleted: step >= 2,
      newExists: step >= 3,
      newLost: step === 4 && !aware,
      finished: step === 4,
      message: descriptions[step],
    };
  }
  return {
    replay,
    scoreReplay,
    thresholdMetrics,
    newQueue,
    advanceQueue,
    market,
    newOrders,
    advanceOrders,
    storageEvent,
  };
});
