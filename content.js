/* Portfolio copy. Public repository evidence and resume claims are distinguished. */
window.PORTFOLIO = {
  owner: 'Harshvardhan Birla',
  email: 'harshvardhanb11@gmail.com',
  github: 'https://github.com/harshvardhanb11',
  projects: [
    {
      id: 'event-engine',
      category: 'systems',
      number: '01',
      type: 'Low-latency systems',
      name: 'Low-Latency C++ Event Processing Engine',
      tagline: 'The fast path. The full story.',
      short: 'Low-Latency C++ Event Processing Engine',
      description:
        'A C++17 event-processing backend with live and replayable inputs, explainable risk scoring, provider circuit breakers, and SQLite persistence paths.',
      tech: ['C++17', 'Concurrency', 'SQLite'],
      visual: 'engine',
      evidence: 'Public source',
      metric: '10.9 μs',
      metricLabel: 'Reported p99 · local decision path',
      repo: 'stablecoin_depeg_prediction_system',
      subtitle:
        'Live feeds, deterministic replay, bounded handoff, and local performance benchmarks.',
      intro:
        'I built this C++17 backend to process stablecoin price events from live providers and replay files. I separated data sources from scoring, added provider fault handling, and built tests and benchmarks around the processing path.',
      facts: [
        ['Language', 'C++17'],
        ['Handoff', 'Bounded SPSC queue'],
        ['Validation', 'Tests + deterministic replay'],
        ['Measured scope', 'Local microbenchmarks'],
      ],
      sections: [
        [
          'The problem',
          'A live data feed is a moving target. If a provider stalls, an alert looks wrong, or the processing path slows down, reproducing the exact conditions can be difficult. The project separates input sources from core scoring so deterministic sample and CSV replay data can exercise the same risk logic as live observations.',
        ],
        [
          'What is implemented',
          'The modular core includes a shared IDataSource interface, CoinGecko and Binance latest-price sources, replay parsing, per-symbol histories, explainable scoring, circuit breakers, and a threshold backtester. The larger provider-mode implementation contains additional ingestion and SQLite persistence paths; it is distinct from the default modular build.',
        ],
        [
          'A closer look: the queue',
          'LockFreeSpscQueue uses a fixed-size array with atomic head and tail indexes. Release stores publish writes; acquire loads observe the opposite side’s progress. Head and tail are separately aligned to 64 bytes. One array slot stays unused to distinguish full from empty. A full queue returns false rather than silently accepting another event.',
        ],
        [
          'The tradeoff',
          'A single-producer/single-consumer design makes the handoff compact, but the ownership constraint is real: adding arbitrary producers would require a different coordination model. Bounded capacity makes overload visible, while leaving the caller responsible for retrying, slowing ingestion, or choosing an explicit drop policy. The benchmark producer yields and retries.',
        ],
        [
          'What the numbers mean',
          'The repository reports approximately 8.37 million queue handoffs per second and 10.9 microseconds p99 local decision latency. These come from separate benchmark paths: 250,000 queue items, and 25,000 decision iterations. The decision benchmark includes risk assessment, feature calculation, and the predictor call. Neither figure is an end-to-end network-to-durable-storage guarantee.',
        ],
        [
          'Prediction needs a separate argument',
          'The advanced predictor initializes fixed feature and ensemble weights and exposes a weight-update method. That implementation is not, by itself, evidence of a trained, calibrated production predictor. Likewise, perfect precision and recall on a nine-record replay establish the behavior of that fixture, not broad historical forecasting accuracy.',
        ],
        [
          'How to inspect it',
          'The repository provides make verify for a local build, focused tests, benchmarks, and demonstrations. Queue ordering, concurrent handoff, replay reporting, risk scoring, and circuit-breaker transitions have test coverage. The lab on this site reimplements the small replay scoring rule in JavaScript so the threshold tradeoff is inspectable without compiling C++.',
        ],
        [
          'Next questions',
          'A useful next study would vary producer rate, queue capacity, consumer pauses, history length, and hardware. It would report saturation, dropped or rejected events, and end-to-end tails separately. Predictive claims would need larger held-out historical datasets and explicit labeling rules.',
        ],
      ],
      sources: [
        ['README & scope', 'README.md'],
        ['Queue implementation', 'include/util/lock_free_spsc_queue.hpp'],
        ['Benchmark implementation', 'benchmarks/stablecoin_benchmark.cpp'],
        ['Scoring rule', 'src/core/risk_engine.cpp'],
        ['Predictor implementation', 'src/core/advanced_predictor.cpp'],
        ['Replay fixture', 'data/sample_replay.csv'],
      ],
      provenance:
        'Public code and documentation inspected. Benchmark values are repository-reported and were not rerun for this portfolio. Tradeoff discussion is architectural analysis.',
      lab: 'replay',
    },
    {
      id: 'snapshot-prune',
      category: 'systems',
      number: '02',
      type: 'Distributed storage',
      name: 'Live Snapshot Prune',
      tagline: 'Same bytes. Different lifetime.',
      short: 'Live Snapshot Prune',
      description:
        'A backup storage system with PostgreSQL metadata, snapshot APIs, independent object storage, and garbage collection that runs alongside uploads and restores.',
      tech: ['Python', 'PostgreSQL', 'Docker'],
      visual: 'storage',
      evidence: 'Resume project',
      metric: 'A₁ ≠ A₂',
      metricLabel: 'Concurrent uploads + online cleanup',
      subtitle: 'Concurrent backup operations with online garbage collection and fault injection.',
      intro:
        'I designed a backup storage system with transactional metadata and an independent object store. The cleanup design distinguishes content hashes from physical object lifetimes so a delayed delete cannot remove a newly uploaded copy.',
      facts: [
        ['Metadata', 'Transactional PostgreSQL'],
        ['Data plane', 'Independent object storage'],
        ['Collection', 'Online mark-and-sweep'],
        ['Verification', 'Fault injection'],
      ],
      sections: [
        [
          'The problem',
          'A backup system cannot assume that the world stops during garbage collection. Uploads create data, snapshots acquire references, restores read objects, and deletions remove references. A collector can make a valid observation that becomes stale before its external delete actually takes effect.',
        ],
        [
          'How it fits together',
          'The project combines PostgreSQL metadata transactions, independent object storage, snapshot APIs, and online mark-and-sweep collection. Correctness mechanisms distinguish logical content identity from physical object incarnations. A verifier introduces faults across multiple services and validates end-state invariants.',
        ],
        [
          'The race, step by step',
          'Imagine an unreferenced object A₁ containing content with hash H. A delete for A₁ is queued but delayed. The same bytes are uploaded again and become live as A₂. If the stale delete addresses only H, it can remove the new live data. The content identity returned to the same value, while the physical lifetime changed: an ABA-style hazard.',
        ],
        [
          'The design implication',
          'Deletion needs an identity or precondition that refers to the selected incarnation. The exact storage-key layout and fencing protocol cannot be established from the resume alone. The conceptual lab uses distinct A₁ and A₂ targets to demonstrate why the distinction matters, without presenting it as a reproduction of the implementation.',
        ],
        [
          'The tradeoff',
          'Separating identities adds lifecycle metadata and recovery bookkeeping. In return, it gives delayed work a narrower target. A safe design must still explain how retries, lost acknowledgements, and orphan objects are reconciled across the transactional metadata boundary and nontransactional object operations.',
        ],
        [
          'Testing the uncertain outcome',
          'The resume reports fault injection for lost acknowledgements, process crashes, restart recovery, concurrent operations, and orphan reclamation. These cases are valuable because a timeout does not reveal whether a remote operation committed. The verifier also checks final invariants rather than treating a successful API response as sufficient evidence.',
        ],
        [
          'The next failure study',
          'A deeper failure study should make the invariants explicit, vary operation schedules, and inspect recovery traces. The central questions are whether live data remains reachable, whether retries address the intended object, and whether orphan reclamation eventually makes progress.',
        ],
      ],
      sources: [],
      provenance:
        'Resume-based project, 2026. No public source repository was located. The race visualization is conceptual and does not execute the original services.',
      lab: 'storage',
    },
    {
      id: 'loopbreaker',
      category: 'product',
      number: '03',
      type: 'Product engineering',
      name: 'Loopbreaker',
      tagline: 'An exit from the infinite feed.',
      short: 'Loopbreaker',
      description:
        'A browser extension that counts short-form videos and active watch time, saves sessions locally, and inserts pause points on Instagram and YouTube.',
      tech: ['JavaScript', 'Manifest V3', 'Browser APIs'],
      visual: 'loop',
      evidence: 'Public source',
      metric: 'Pause.',
      metricLabel: 'Watch counts + active time + pause points',
      repo: 'Loopbreaker',
      subtitle: 'Browser-based watch tracking with local session recovery.',
      intro:
        'I built Loopbreaker to track short-form viewing sessions and add stopping points. The extension handles duplicate videos, active-playback timing, and session recovery after a page refresh.',
      facts: [
        ['Surfaces', 'Instagram & YouTube web'],
        ['State', 'Per-platform localStorage'],
        ['Timing', 'Active watch time'],
        ['Status', 'Experimental extension'],
      ],
      sections: [
        [
          'The problem',
          'An infinite feed has no natural stopping point. Loopbreaker shows the number of short-form videos consumed and active watch time, then introduces warnings and temporary pause-locks at milestones. It is an experimental behavior-support tool; its source does not establish health or clinical outcomes.',
        ],
        [
          'Identity, not just DOM elements',
          'The same content can appear in a feed preview, a dedicated Reel view, and after back navigation. The implementation uses seen reel keys and media fingerprints, with URL, media, and other fallback signals. This is more robust than counting each newly visible video element, but remains dependent on the platform’s changing interface.',
        ],
        [
          'Fairness is a timing requirement',
          'The timer checks page visibility, browser focus, supported short-form context, and a playing video. Time does not accrue during the intervention modal or hard lock. These gates matter because leaving a tab open is different from actively watching a feed.',
        ],
        [
          'Persistence changes the experience',
          'Session state includes counted identities, active watch time, triggered milestones, continue count, and pending lock information. State is restored for a recent same-day session; a ten-minute inactivity rule constrains reuse. Refreshing a page therefore need not erase an active session.',
        ],
        [
          'The tradeoff',
          'Local state avoids a backend dependency and keeps this feature’s session data on-device. It also means there is no cross-device synchronization and local persistence is not tamper-proof. Heuristic fingerprints may still miss matches or conflate content. The persisted identity lists are capped at 700 entries, making very long-session behavior a useful test case.',
        ],
        [
          'Interventions are policy',
          'The code has separate reel-count and active-time milestones, earlier night-time intervention, and escalating delays. These are implemented product policies, not validated optimal thresholds. A useful experiment would measure whether people understand the pause, whether it creates intentional exits, and whether false counts damage trust.',
        ],
        [
          'What is shipped, what is next',
          'The repository contains the extension manifest, content script, and overlay styling. It documents experimental limitations, browser-only support, platform DOM fragility, and no Chrome Web Store release. A sensible next step is a regression fixture suite for navigation, duplicate content, fullscreen, idle tabs, and refresh recovery.',
        ],
      ],
      sources: [
        ['Product writeup', 'README.md'],
        ['Counting & session logic', 'content.js'],
        ['Permissions & injection', 'manifest.json'],
        ['Overlay styling', 'overlay.css'],
      ],
      provenance:
        'Based on public source and documentation. No user study or behavioral impact measurement is claimed.',
    },
    {
      id: 'order-agent',
      category: 'systems',
      number: '04',
      type: 'Execution infrastructure',
      name: 'Curve DEX Limit Order Agent',
      tagline: 'A quote is not an execution.',
      short: 'Curve DEX Limit Order Agent',
      description:
        'A C++ order agent with live Ethereum reads, four order policies, and an offline scenario harness. Transaction submission is mocked.',
      tech: ['C++17', 'JSON-RPC', 'State machines'],
      visual: 'orders',
      evidence: 'Public source',
      repo: 'curve_dex_limit-order-agent',
      metric: '4 policies',
      metricLabel: 'GTC · GTT · IOC · FOK',
      subtitle: 'GTC, GTT, IOC, and FOK policies with live RPC reads and mocked submission.',
      intro:
        'I implemented order eligibility, expiry, and liquidity checks around Ethereum RPC reads. A deterministic C++ harness exercises the four policies without credentials; the live-read path currently ends at mocked transaction submission.',
      facts: [
        ['Reads', 'Sepolia JSON-RPC'],
        ['Policies', 'GTC / GTT / IOC / FOK'],
        ['Submission', 'Mocked'],
        ['Review path', 'Credential-free harness'],
      ],
      sections: [
        [
          'The problem',
          'A favorable price does not settle an order. Eligibility also depends on lifetime, liquidity, and policy. Separating those rules makes the behavior inspectable before introducing real transaction execution.',
        ],
        [
          'What is implemented',
          'The main path reads Ethereum JSON-RPC data, queries ERC-20 balances and Curve-style quotes, and monitors active orders. It encodes and prints transaction calldata, then returns deterministic mock hashes. Signing and broadcasting are not implemented.',
        ],
        [
          'Four different promises',
          'GTC remains pending until its price condition is met. GTT adds an expiry. IOC cancels if an immediate fill is unavailable. FOK requires enough liquidity for the whole order. The local harness uses an explicit deterministic quote sequence and activation steps to expose those differences.',
        ],
        [
          'Ordering the checks matters',
          'In the harness, a GTT order expires when the current step is greater than its expiry step. That check happens before price eligibility. In the fixture, a favorable quote at step 4 cannot rescue an order whose expiry was step 3. The lab reproduces this discrete policy sequence, not blockchain execution.',
        ],
        [
          'The tradeoff',
          'A no-credential harness gives reviewers a fast path to reason about state transitions. It cannot test nonce management, transaction inclusion, settlement, chain reorganizations, or price changes between quote and execution. Those require a separate execution design and validation plan.',
        ],
        [
          'Evidence and next work',
          'The fixture ends with one filled order, two cancellations, and one expiry. The repository documents missing persistence and simplified demo amount handling. A production path would need careful integer accounting, durable order state, secure key management, and idempotent reconciliation with on-chain outcomes.',
        ],
      ],
      sources: [
        ['Scope & limitations', 'README.md'],
        ['Policy harness', 'offline_limit_order_terminal.cpp'],
        ['Main agent', 'final_limit_order_agent.cpp'],
      ],
      provenance:
        'Based on public code and documentation. The standalone C++ policy harness was compiled and run locally to cross-check the browser fixture. Transactions are mocked; no blockchain execution was performed.',
      lab: 'orders',
    },
    {
      id: 'sentiment',
      category: 'ml',
      number: '05',
      type: 'Applied machine learning',
      name: 'Interview Sentiment with RoBERTa',
      tagline: 'Interview transcripts, transformer models.',
      short: 'Interview Sentiment with RoBERTa',
      description:
        'An exploratory RoBERTa notebook for preparing interview transcripts and testing sentiment-related scoring.',
      tech: ['Python', 'PyTorch', 'RoBERTa'],
      visual: 'ml',
      evidence: 'Exploratory notebook',
      repo: 'sentiment-analysis',
      metric: 'Define y.',
      metricLabel: 'Interview transcript sentiment prototype',
      subtitle: 'Exploratory transcript preparation and RoBERTa training setup.',
      intro:
        'I explored adapting a pretrained Twitter-RoBERTa sentiment model to interview transcripts. The notebook covers transcript preparation, tokenization, and training setup; reproducible labeling and a complete evaluated training run remain follow-up work.',
      facts: [
        ['Model family', 'RoBERTa'],
        ['Data', 'startup-interviews'],
        ['Implementation', 'Jupyter notebook'],
        ['Reported metric', 'MSE workflow'],
      ],
      sections: [
        [
          'The problem',
          'Interview responses are unstructured text. This project explores transcript preparation and sentiment-related scoring using a pretrained transformer. Its documentation describes confidence-related outputs, which require careful interpretation.',
        ],
        [
          'The workflow',
          'The notebook sketches loading interview questions and responses, constructing transcripts, tokenizing text, splitting training and validation data, and adapting a Twitter-RoBERTa sentiment model. It contains a machine-local CSV path and a placeholder list of five confidence values, rather than a documented full-dataset labeling pipeline. Its Trainer setup also needs a dataset that consistently supplies inputs and labels. The published notebook should therefore be treated as a prototype, not a reproduced training run.',
        ],
        [
          'The tradeoff',
          'Transfer learning makes a domain experiment practical, but the source and target domains differ. Social-media sentiment is not the same as interview confidence. A useful score requires defensible labels and a reason to expect the learned representation to generalize.',
        ],
        [
          'What validation should answer',
          'Mean squared error needs a clearly defined numerical target. A technical review should inspect how targets were constructed, whether speakers or overlapping transcripts leak across splits, and whether performance varies with language, response length, or background. These are evaluation questions rather than claims of completed checks.',
        ],
        [
          'The boundary of the result',
          'The internship resume reports a 35% evaluation improvement across its work. The public material inspected does not define that metric, baseline, or evaluation protocol sufficiently to repeat it as a verified result for this notebook. Sentiment should not be treated as a direct measure of candidate competence.',
        ],
        [
          'A useful next experiment',
          'First replace local paths and placeholder targets with reproducible data-and-label preparation. Then construct a proper labeled training dataset, establish a manually reviewed target definition and held-out split, compare against a simple baseline, and inspect error slices. That would make a fine-tuning result more informative than a model name or a single aggregate score.',
        ],
      ],
      sources: [
        ['Workflow documentation', 'README.md'],
        ['Public notebook', 'test1%20sentiment.ipynb'],
      ],
      provenance:
        'The public notebook and documentation were inspected. It contains prototype setup and placeholder targets; no trained-model quality claim is made. Evaluation recommendations are analysis, not reported experiments.',
    },
    {
      id: 'distributed-storage',
      category: 'systems',
      number: '06',
      type: 'Distributed systems',
      name: 'Distributed Storage Engine',
      tagline: 'Keep the data moving.',
      short: 'Distributed Storage Engine',
      description:
        'Multi-node storage with Kafka-based ingestion, partitioned communication, parallel consumers, replicated metadata, and recovery from tested single-node failures.',
      tech: ['Apache Kafka', 'Replication', 'Fault tolerance'],
      visual: 'distributed',
      evidence: 'Resume project',
      metric: 'Recover.',
      metricLabel: 'Replicated metadata + single-node recovery',
      subtitle: 'Kafka ingestion, replicated metadata, and single-node recovery.',
      intro:
        'I built a multi-node storage system using Kafka for ingestion and inter-node data movement. Replicated metadata and dual-storage fault tolerance kept data accessible during tested single-node failures.',
      facts: [
        ['Period', 'Jul–Nov 2023'],
        ['Messaging', 'Apache Kafka'],
        ['Resilience', 'Replicated metadata'],
        ['Reported test', 'Single-node failure'],
      ],
      sections: [
        [
          'The problem',
          'A multi-node storage system needs scalable ingestion and durable inter-node communication while retaining access to data during failures.',
        ],
        [
          'How it fits together',
          'Kafka handles ingestion and partitioned inter-node communication. Parallel consumers move data between storage nodes, while replicated metadata and dual-storage fault-tolerance mechanisms support recovery. Tested single-node failures retained data access.',
        ],
        [
          'The tradeoff',
          'Partitions enable parallel processing, while ordering remains a per-partition property that the application must use deliberately. Replication adds storage and synchronization work. These are architectural implications; the resume does not establish the exact placement or consistency protocol.',
        ],
        [
          'A useful follow-up',
          'A reproducible workload would make it possible to compare throughput, transfer latency, and recovery time under the same conditions. A failure matrix should connect each injected fault to the acknowledgement contract and the data guarantees that remain intact.',
        ],
        [
          'The review question',
          'Single-node survival is one useful failure case. It does not establish behavior under split-brain coordination, simultaneous failures, disk corruption, or network partitions. A precise availability claim should name the failures tested and the data guarantees preserved.',
        ],
      ],
      sources: [],
      provenance:
        'Based on the supplied resume. No public implementation or benchmark trace was located.',
    },
    {
      id: 'compute-platform',
      category: 'systems',
      number: '07',
      type: 'Distributed orchestration',
      name: 'Distributed Compute Orchestration Platform',
      tagline: 'Tasks, state, and worker coordination.',
      short: 'Distributed Compute Orchestration Platform',
      description:
        'Multi-node task orchestration with HDFS for durable data, Redis for fast state access, and ZooKeeper for worker coordination.',
      tech: ['HDFS', 'Redis', 'ZooKeeper'],
      visual: 'compute',
      evidence: 'Resume project',
      metric: 'State.',
      metricLabel: 'HDFS + Redis + ZooKeeper',
      subtitle: 'Distributed task execution with durable data and coordinated workers.',
      intro:
        'I built distributed execution infrastructure for coordinating tasks across worker nodes. I integrated HDFS for durable storage, Redis for state and caching, and ZooKeeper for coordination.',
      facts: [
        ['Period', 'Dec 2023–Apr 2024'],
        ['Durable storage', 'HDFS'],
        ['Fast state', 'Redis'],
        ['Coordination', 'ZooKeeper'],
      ],
      sections: [
        [
          'The problem',
          'Multi-node execution requires coordination, distributed state, and a way to move durable data through worker pipelines.',
        ],
        [
          'How it fits together',
          'HDFS provides durable storage, Redis handles low-latency state and cache access, and ZooKeeper coordinates work across nodes. Each component has a distinct responsibility in the execution pipeline.',
        ],
        [
          'The tradeoff',
          'Separating responsibilities can make each component easier to reason about, but the workflow must still explain cross-service consistency. A coordinator can assign work while a cache is stale or a worker completes a task just before losing its session.',
        ],
        [
          'What a design review should establish',
          'The resume does not specify task delivery guarantees, duplicate-execution handling, worker fencing, or the source of truth for completion state. Those details determine whether retries are safe and whether abandoned work can be reassigned.',
        ],
        [
          'A useful follow-up',
          'A task lifecycle trace would connect assignment, execution, completion, and recovery. Running that trace through worker crashes and coordination loss would reveal where the workflow needs fencing, reconciliation, or an explicit retry policy.',
        ],
      ],
      sources: [],
      provenance:
        'Based on the supplied resume. Architecture tradeoffs are analysis, not verified implementation details.',
    },
    {
      id: 'distributed-training',
      category: 'ml',
      number: '08',
      type: 'ML infrastructure',
      name: 'Distributed TensorFlow Training',
      tagline: 'From training to hosted inference.',
      short: 'Distributed TensorFlow Training',
      description:
        'A TensorFlow/SageMaker walkthrough covering distributed training configuration, model deployment, inference, and resource cleanup.',
      tech: ['TensorFlow', 'SageMaker', 'MNIST'],
      visual: 'training',
      evidence: 'Public walkthrough',
      repo: 'aws-tensorflow',
      metric: 'Scale?',
      metricLabel: 'Training configuration → hosted inference',
      subtitle: 'TensorFlow distribution and deployment on SageMaker.',
      intro:
        'I documented a TensorFlow-on-SageMaker workflow from training configuration through hosted inference and cleanup. The walkthrough uses MNIST and covers the estimator and distribution settings needed to launch a managed training job.',
      facts: [
        ['Framework', 'TensorFlow 2'],
        ['Runtime', 'SageMaker distributed'],
        ['Dataset', 'MNIST'],
        ['Artifact', 'Notebook walkthrough'],
      ],
      sections: [
        [
          'The problem',
          'Increasing instance count is not enough to make training distributed. The training script, runtime configuration, and data-parallel strategy must agree.',
        ],
        [
          'What the repository covers',
          'The guide introduces SageMaker’s distributed data parallel library, role setup, the training script, TensorFlow estimator configuration, training, endpoint deployment, inference, and cleanup.',
        ],
        [
          'The tradeoff',
          'A managed runtime removes some infrastructure setup while adding service-specific dependencies and cloud costs. With a small dataset like MNIST, startup and communication overhead may outweigh the benefit of another worker.',
        ],
        [
          'Evidence and limits',
          'The repository is a learning walkthrough. It does not provide a measured scaling curve, cost-per-training-run comparison, or independently reproduced multi-node result. The portfolio presents it as exploration rather than a production training platform.',
        ],
        [
          'A stronger follow-up',
          'Hold the target quality and dataset fixed, compare one worker with several, and report both wall-clock time and total compute cost. That reveals whether scaling improved the actual objective.',
        ],
      ],
      sources: [['Walkthrough & notebook', 'README.md']],
      provenance:
        'Based on public repository documentation. No cloud training or deployment job was run for this portfolio.',
    },
  ],
  notes: [
    {
      id: 'identity',
      category: 'Storage / 4 min',
      title: 'A hash is not a lifetime.',
      intro: 'Why identity becomes a correctness primitive when work can arrive late.',
      paragraphs: [
        'Content addressing is attractive because equal bytes can share an identity. But that is an equality about content, not a statement about the lifetime of the object that currently stores it. The distinction becomes visible when reclamation overlaps with new writes.',
        'Consider a collector that selects an unreferenced object, queues a delete, and then loses the acknowledgement. Meanwhile, an uploader makes the same content live again. Retrying the old delete must not target this new lifetime merely because the content hash matches.',
        'This is why a robust design needs to state what its operation addresses: a logical item, an immutable physical object, or a specific incarnation guarded by a precondition. The correct mechanism depends on the storage API and metadata model; a diagram alone cannot establish those guarantees.',
        'The broader lesson applies to worker leases, retries, caches, and resource cleanup. Whenever old work can outlive its original context, ask what prevents it from acting on a replacement resource. Identity is part of the concurrency protocol.',
        'This note explains the race described in Live Snapshot Prune’s resume entry. It is conceptual analysis rather than a published proof of that project’s implementation.',
      ],
      related: 'snapshot-prune',
    },
    {
      id: 'benchmarks',
      category: 'Performance / 4 min',
      title: 'The boundary is part of the benchmark.',
      intro: 'A latency number becomes useful when you can say where the clock starts and stops.',
      paragraphs: [
        '“10.9 microseconds p99” is precise syntax. Its meaning still depends on what was timed. A local scoring call, an inter-thread handoff, a provider request, and a durable write answer different performance questions.',
        'The event engine’s benchmark separates queue throughput from decision latency. The throughput test passes 250,000 items between producer and consumer threads. The decision test times risk assessment, feature calculation, and prediction on in-memory histories. That is useful evidence about those paths.',
        'It does not automatically describe network latency, queueing under sustained overload, provider throttling, or durable persistence. Combining separate maxima into one end-to-end claim would erase the conditions that made each measurement interpretable.',
        'A more complete study can layer the measurements: isolated microbenchmarks first, then a controlled load test with queue occupancy and rejected work, then end-to-end latency under a named workload. Record hardware, compiler settings, history size, and repetition count so someone else can ask the same question.',
        'A benchmark is strongest when its boundary is visible. The result then starts a conversation about the system instead of ending one with a large number.',
      ],
      related: 'event-engine',
    },
    {
      id: 'ai-evaluation',
      category: 'AI & ML / 4 min',
      title: 'Before the model, define the target.',
      intro: 'A sophisticated model cannot resolve an ambiguous question for you.',
      paragraphs: [
        'Transfer learning makes it possible to start with a useful representation and adapt it to a smaller domain. That reduces the cost of an experiment. It does not define what the experiment is trying to measure.',
        'An interview sentiment score, a confidence label, and a judgment of candidate competence are different concepts. Moving between them requires evidence. A model can consistently predict a proxy that is poorly aligned with the decision people care about.',
        'The first design artifact should therefore be a target definition: how labels are obtained, what disagreement means, what data is excluded from training, and which errors matter most. A train-validation split must reflect the intended deployment setting rather than merely separate rows.',
        'Then compare a simple baseline, inspect errors by meaningful slices, and show examples where the model is wrong. For the small replay lab on this site, even a perfect score is tied to just nine labeled observations. That visible limitation is more informative than treating a perfect fixture result as general predictive ability.',
        'These are evaluation principles drawn from reviewing the public projects. They are not a claim that every proposed experiment has already been run, or that generative AI was used in the original projects.',
      ],
      related: 'sentiment',
    },
    {
      id: 'ai-assisted-build',
      category: 'Building with AI / 5 min',
      title: 'Generate the draft. Verify the claim.',
      intro:
        'How AI assistance helped build this portfolio—and where the output needed a closer look.',
      paragraphs: [
        'This portfolio was built with AI assistance from a supplied resume and public GitHub repositories. The useful output includes more than styling: project narratives, interactive explanations, a static export, and a testable implementation. The important constraint was to keep each claim connected to evidence.',
        'Source inspection changed the story in concrete ways. The order agent has live reads but mocked transaction submission, so the site does not describe it as a working on-chain execution bot. The sentiment notebook contains local setup and placeholder targets, so it is presented as an exploratory prototype. The resume now follows the latest LaTeX supplied by Harshvardhan, including the updated experience figures.',
        'The interactive demonstrations were checked against their boundaries. The replay scoring rule was ported to JavaScript and all nine fixture scores were compared against the original C++ RiskEngine to within 1e-10. The original C++ order-policy harness was compiled and run to cross-check the browser state sequence. Storage and queue demonstrations remain explicitly labeled conceptual models.',
        'Automated checks cover the lab invariants, navigation, filtering, search, direct project links, and portable export. Separate static checks inspect local links, headings, metadata, and accessibility rules that can be evaluated without browser layout. These checks are useful, but they do not establish that the full page has been visually reviewed on every device.',
        'The site is deliberately portable: ordinary HTML, CSS, JavaScript, a zero-dependency static build, and a single-file edition. Generating those files is separate from publishing a working public URL. Ownership of the files makes future changes and moving between hosts easier.',
        'The lesson is practical: AI can accelerate implementation while still leaving the reasoning visible. Generated prose, a green test, and an impressive metric each need an appropriate boundary. This note describes the production of the portfolio; it does not imply that generative AI was used in the original projects.',
      ],
      related: 'event-engine',
    },
  ],
};
