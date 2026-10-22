const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../lab-core.js');

test('Replay matches all four recorded threshold outcomes', () => {
  const expected = [
    { t: 0.2, tp: 1, fp: 1, fn: 0, tn: 7 },
    { t: 0.3, tp: 1, fp: 0, fn: 0, tn: 8 },
    { t: 0.4, tp: 1, fp: 0, fn: 0, tn: 8 },
    { t: 0.5, tp: 0, fp: 0, fn: 1, tn: 8 },
  ];
  for (const fixture of expected) {
    const actual = core.thresholdMetrics(fixture.t);
    for (const field of ['tp', 'fp', 'fn', 'tn'])
      assert.equal(actual[field], fixture[field], `threshold ${fixture.t}, ${field}`);
  }
});
test('Stress score matches repository output to four decimals', () => {
  assert.equal(core.scoreReplay()[3].score.toFixed(4), '0.4239');
});
test('Threshold comparisons include equality and reject invalid inputs', () => {
  assert.equal(core.thresholdMetrics(0.3, [{ score: 0.3, expected: true }]).tp, 1);
  for (const bad of [-1, 1.1, NaN, Infinity])
    assert.throws(() => core.thresholdMetrics(bad), RangeError);
});
test('Per-symbol histories are isolated and all fixture rows are accounted for', () => {
  const scored = core.scoreReplay();
  assert.equal(scored.length, 9);
  assert.equal(scored[4].symbol, 'USDT');
  assert.equal(scored[4].score, core.scoreReplay([core.replay[4]])[0].score);
  for (const t of [0, 0.01, 0.2, 0.3, 0.8, 1]) {
    const r = core.thresholdMetrics(t);
    assert.equal(r.tp + r.fp + r.fn + r.tn, 9);
  }
});
test('Queue bounds and conservation hold through rates and long stalls', () => {
  for (let producer = 0; producer <= 6; producer++)
    for (let consumer = 0; consumer <= 6; consumer++) {
      let state = core.newQueue();
      for (let tick = 0; tick < 100; tick++) {
        state = core.advanceQueue(state, producer, consumer);
        assert.ok(state.depth >= 0 && state.depth <= 12);
        assert.equal(state.accepted, state.processed + state.depth);
        assert.equal(state.accepted + state.rejected, state.tick * producer);
      }
    }
});
test('Stopped consumer fills the queue and creates visible rejections', () => {
  let state = core.newQueue();
  for (let i = 0; i < 5; i++) state = core.advanceQueue(state, 6, 0);
  assert.equal(state.depth, 12);
  assert.equal(state.processed, 0);
  assert.equal(state.rejected, 18);
  state = core.advanceQueue(state, 0, 6);
  state = core.advanceQueue(state, 0, 6);
  assert.equal(state.depth, 0);
  assert.equal(state.processed, 12);
});
test('Queue model does not mutate prior states', () => {
  const initial = core.newQueue();
  core.advanceQueue(initial, 4, 0);
  assert.equal(initial.depth, 0);
});
test('Order fixture produces exactly the C++ harness terminal outcomes', () => {
  let orders = core.newOrders();
  for (let i = 0; i < 5; i++) orders = core.advanceOrders(orders, i);
  assert.deepEqual(
    orders.map((o) => [o.policy, o.status, o.reason]),
    [
      ['GTC', 'FILLED', 'limit_crossed'],
      ['IOC', 'CANCELED', 'price_not_met'],
      ['FOK', 'CANCELED', 'insufficient_liquidity'],
      ['GTT', 'EXPIRED', 'time_expired'],
    ],
  );
  assert.equal(orders[0].fillStep, 2);
  assert.equal(orders[0].fill, 1.021);
});
test('Inactive FOK order is not evaluated before its activation tick', () => {
  assert.equal(core.advanceOrders(core.newOrders(), 0)[2].status, 'PENDING');
});
test('GTT expiry is checked before a favorable late quote', () => {
  const order = core.newOrders().filter((o) => o.policy === 'GTT');
  assert.equal(core.market[4].price >= order[0].limit, true);
  assert.equal(core.advanceOrders(order, 4)[0].status, 'EXPIRED');
});
test('Terminal order states remain terminal', () => {
  let orders = core.advanceOrders(core.newOrders(), 0);
  const canceled = orders[1];
  orders = core.advanceOrders(orders, 4);
  assert.deepEqual(orders[1], canceled);
});
test('Incarnation-aware storage retry preserves the new object', () => {
  const result = core.storageEvent(4, true);
  assert.equal(result.oldDeleted, true);
  assert.equal(result.newExists, true);
  assert.equal(result.newLost, false);
});
test('Content-only stale retry demonstrates loss of newly referenced data', () => {
  const result = core.storageEvent(4, false);
  assert.equal(result.newLost, true);
  assert.equal(result.finished, true);
});
test('Storage scenario starts without a new object and names uncertainty', () => {
  assert.equal(core.storageEvent(0).newExists, false);
  assert.match(core.storageEvent(2).message, /acknowledgement is lost/);
  assert.throws(() => core.storageEvent(5), RangeError);
});
