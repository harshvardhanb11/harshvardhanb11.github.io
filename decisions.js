/* Architectural comparisons, explicitly distinguished from undocumented history. */
window.DESIGN_DECISIONS = {
  'event-engine': [
    [
      'Bounded SPSC handoff',
      'An unbounded or more general multi-producer queue',
      'Keeps the handoff compact and capacity explicit, but requires one producer and consumer per queue and an overload policy.',
    ],
    [
      'Replayable source abstraction',
      'Debugging only against a changing live feed',
      'Makes the same core decisions inspectable on repeatable inputs; fixture realism remains a separate requirement.',
    ],
    [
      'Separate local microbenchmarks',
      'One undifferentiated performance number',
      'Isolates queue and scoring costs, but does not measure network-to-durable-storage latency.',
    ],
  ],
  'snapshot-prune': [
    [
      'Distinguish physical incarnations',
      'Delete by logical content identity alone',
      'Narrows the target of stale work, at the cost of lifecycle metadata and recovery bookkeeping.',
    ],
    [
      'Collect while operations continue',
      'Pause all mutating work for collection',
      'Preserves concurrency, but makes stale observations and interleavings part of the correctness argument.',
    ],
    [
      'Test lost acknowledgements',
      'Treat every timeout as a failed operation',
      'Explores uncertain remote outcomes and retry safety. End-state invariants must explain what survived.',
    ],
  ],
  loopbreaker: [
    [
      'Canonical keys plus fingerprints',
      'Count visible DOM elements',
      'Improves identity across UI surfaces while retaining heuristic matching risks.',
    ],
    [
      'Active watch-time gates',
      'Use wall-clock time since opening a page',
      'Avoids charging inactive tabs, but depends on observable focus and playback state.',
    ],
    [
      'On-device session persistence',
      'Synchronize every event through a backend',
      'Keeps this feature local and simple to run; it does not synchronize across devices or prevent local tampering.',
    ],
  ],
  'order-agent': [
    [
      'Explicit time-in-force policies',
      'Execute whenever a quote crosses a limit',
      'Makes cancellation, expiry, and full-liquidity requirements inspectable as state transitions.',
    ],
    [
      'Credential-free policy fixture',
      'Require an RPC endpoint for every review',
      'Improves reproducibility, but does not test provider failure or on-chain settlement.',
    ],
    [
      'Mock transaction submission',
      'Sign and broadcast real transactions',
      'Creates a clear demo boundary. A production execution path would need separate security, durability, and reconciliation work.',
    ],
  ],
  sentiment: [
    [
      'Explore a pretrained representation',
      'Train a transformer from scratch',
      'Makes a small experiment practical; source-domain sentiment still needs a justified target in the interview domain.',
    ],
    [
      'Define labels before measuring success',
      'Interpret any numeric output as confidence',
      'A meaningful target is necessary for evaluation. The public prototype contains placeholders, so model-quality conclusions remain open.',
    ],
  ],
  'distributed-storage': [
    [
      'Partitioned Kafka communication',
      'One undifferentiated communication stream',
      'Enables parallel processing, while requiring deliberate ordering and partition-balance decisions.',
    ],
    [
      'Replicated metadata',
      'A single copy of critical metadata',
      'Introduces redundancy and recovery work; exact consistency and acknowledgement guarantees need implementation evidence.',
    ],
    [
      'Named single-node failure scenarios',
      'A broad, unqualified availability claim',
      'Makes the reported test boundary concrete without implying coverage of partitions or simultaneous failures.',
    ],
  ],
  'compute-platform': [
    [
      'Separate storage, cache, and coordination roles',
      'Ask one component to serve all state needs',
      'Fits components to different access patterns, while increasing the importance of cross-service consistency.',
    ],
    [
      'Distributed coordination',
      'Let workers claim tasks independently',
      'Provides a place to coordinate ownership; fencing stale workers and committing results still need an explicit protocol.',
    ],
  ],
  'distributed-training': [
    [
      'Managed distributed data parallel setup',
      'A single-worker baseline',
      'Adds a scaling path, but communication and startup can dominate a small workload. A measured comparison is needed.',
    ],
    [
      'Hosted inference endpoint',
      'Keep inference entirely in a notebook',
      'Demonstrates a deployment workflow, while introducing endpoint lifecycle and service-cost responsibilities.',
    ],
  ],
};
