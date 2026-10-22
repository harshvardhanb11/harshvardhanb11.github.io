window.GLOSSARY = [
  {
    id: 'aba',
    name: 'ABA-style race',
    group: 'Concurrency',
    definition:
      'An identity appears unchanged after the underlying resource has changed. Old work can mistake the new resource for the original one.',
    example:
      'A delayed delete for object A₁ must not delete a new A₂ just because both contain the same bytes.',
    project: 'snapshot-prune',
  },
  {
    id: 'backpressure',
    name: 'Backpressure',
    group: 'Concurrency',
    definition:
      'A way for a slower downstream component to make upstream producers slow down or handle overload explicitly.',
    example:
      'A full bounded queue rejects a submission. The producer must retry, wait, or apply a documented drop policy.',
    project: 'event-engine',
  },
  {
    id: 'bounded-queue',
    name: 'Bounded queue',
    group: 'Concurrency',
    definition: 'A waiting buffer with a fixed capacity. It cannot absorb more work indefinitely.',
    example: 'In the queue lab, twelve slots fill when arrivals keep outpacing processing.',
    project: 'event-engine',
  },
  {
    id: 'spsc',
    name: 'SPSC',
    group: 'Concurrency',
    definition:
      'Single producer, single consumer: one thread submits items and one thread removes them.',
    example:
      'This ownership constraint enables a small lock-free queue design. It does not support arbitrary additional producers.',
    project: 'event-engine',
  },
  {
    id: 'lock-free',
    name: 'Lock-free',
    group: 'Concurrency',
    definition:
      'A concurrency property where system-wide progress does not depend on acquiring a mutex. It does not mean every operation always succeeds.',
    example: 'A lock-free queue can still be full and return false from a push attempt.',
    project: 'event-engine',
  },
  {
    id: 'p99',
    name: 'p99 latency',
    group: 'Performance',
    definition:
      'The 99th percentile of observed duration: about 99% of the measurements are at or below it.',
    example:
      'A reported 10.9 μs p99 for local decisions does not include network delays or prove an end-to-end service guarantee.',
    project: 'event-engine',
  },
  {
    id: 'throughput',
    name: 'Throughput',
    group: 'Performance',
    definition:
      'The amount of work completed in a unit of time, under a specified workload and measurement boundary.',
    example: 'Queue handoffs per second and complete requests per second measure different work.',
    project: 'event-engine',
  },
  {
    id: 'replay',
    name: 'Deterministic replay',
    group: 'Validation',
    definition:
      'Running the same ordered inputs through a system so its decisions can be inspected and reproduced.',
    example:
      'A timestamped CSV can make a market-stress scenario reviewable without relying on a live provider.',
    project: 'event-engine',
  },
  {
    id: 'precision',
    name: 'Precision',
    group: 'ML & evaluation',
    definition: 'Of the alerts produced, the fraction that match labeled alert events.',
    example: 'One correct alert plus one false alarm gives precision of 1 / 2 = 0.5.',
    project: 'event-engine',
  },
  {
    id: 'recall',
    name: 'Recall',
    group: 'ML & evaluation',
    definition: 'Of the labeled alert events, the fraction the system catches.',
    example:
      'Missing the only labeled stress event gives recall of zero, even if there are no false alarms.',
    project: 'event-engine',
  },
  {
    id: 'f1',
    name: 'F1 score',
    group: 'ML & evaluation',
    definition:
      'The harmonic mean of precision and recall. It summarizes a balance between false alarms and missed events.',
    example:
      'A perfect F1 on nine fixture records says nothing by itself about performance on unseen history.',
    project: 'event-engine',
  },
  {
    id: 'calibration',
    name: 'Calibration',
    group: 'ML & evaluation',
    definition: 'Whether probability estimates correspond to how often outcomes actually occur.',
    example:
      'Predictions near 0.8 should be correct about 80% of the time over comparable cases. A bounded score alone does not establish this.',
    project: 'sentiment',
  },
  {
    id: 'label-leakage',
    name: 'Data leakage',
    group: 'ML & evaluation',
    definition:
      'When training or evaluation uses information that would not legitimately be available for the intended prediction.',
    example:
      'Overlapping interview content in both training and validation can make the model look better than it generalizes.',
    project: 'sentiment',
  },
  {
    id: 'fine-tuning',
    name: 'Fine-tuning',
    group: 'ML & evaluation',
    definition: 'Updating a pretrained model using data for a particular task or domain.',
    example:
      'Starting from RoBERTa reduces training effort, but still requires meaningful labels and held-out evaluation.',
    project: 'sentiment',
  },
  {
    id: 'incarnation',
    name: 'Object incarnation',
    group: 'Storage',
    definition:
      'A specific physical lifetime of an object, distinct from the content it happens to hold.',
    example: 'A₁ and A₂ can share content hash H while requiring different deletion targets.',
    project: 'snapshot-prune',
  },
  {
    id: 'gc',
    name: 'Mark-and-sweep collection',
    group: 'Storage',
    definition:
      'A reclamation approach that identifies reachable objects, then removes candidates judged unreachable.',
    example:
      'If uploads continue during collection, the design must keep new references safe while its observations become stale.',
    project: 'snapshot-prune',
  },
  {
    id: 'lost-ack',
    name: 'Lost acknowledgement',
    group: 'Distributed systems',
    definition:
      'An operation may have succeeded remotely, but the caller never receives confirmation.',
    example:
      'Retrying a deletion after a timeout requires reasoning about both “already happened” and “not yet happened.”',
    project: 'snapshot-prune',
  },
  {
    id: 'idempotency',
    name: 'Idempotency',
    group: 'Distributed systems',
    definition:
      'Repeating an operation has the same intended effect as performing it once, within the operation’s defined identity and scope.',
    example: 'A retry is only safe if it cannot accidentally act on a replacement resource.',
    project: 'snapshot-prune',
  },
  {
    id: 'circuit-breaker',
    name: 'Circuit breaker',
    group: 'Reliability',
    definition:
      'A mechanism that stops repeated calls to a failing dependency, then probes for recovery.',
    example:
      'Closed allows calls, open blocks them, and half-open tests whether the dependency has recovered.',
    project: 'event-engine',
  },
  {
    id: 'fault-injection',
    name: 'Fault injection',
    group: 'Validation',
    definition:
      'Deliberately introducing failures to examine recovery behavior and safety properties.',
    example:
      'Kill a process after an object write but before its acknowledgement, then inspect the recovered state.',
    project: 'snapshot-prune',
  },
  {
    id: 'invariant',
    name: 'Invariant',
    group: 'Correctness',
    definition:
      'A property that must remain true across the system’s allowed states and operations.',
    example: 'Accepted queue events equal processed events plus events still waiting.',
    project: 'event-engine',
  },
  {
    id: 'fencing',
    name: 'Fencing',
    group: 'Distributed systems',
    definition:
      'Preventing an old owner or stale operation from making changes after its authority has been replaced.',
    example:
      'A worker that loses a lease may keep running; a commit boundary must reject its stale authority.',
    project: 'compute-platform',
  },
  {
    id: 'tif',
    name: 'Time-in-force',
    group: 'Execution policies',
    definition:
      'An order policy defining how long an order remains eligible and when it must be canceled or expired.',
    example:
      'GTT can expire before a favorable quote arrives; FOK requires enough liquidity for a complete fill.',
    project: 'order-agent',
  },
  {
    id: 'rpc',
    name: 'JSON-RPC',
    group: 'Infrastructure',
    definition: 'A request-and-response protocol for calling remote methods using JSON messages.',
    example:
      'The order agent uses Ethereum JSON-RPC to read balances and quotes. A read is separate from signing and submitting a transaction.',
    project: 'order-agent',
  },
];
