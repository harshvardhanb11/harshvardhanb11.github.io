# Validation record

Prepared on 22 October 2026. These checks describe the supplied build, not a hosted production deployment.

| Check                                         | Result                            | Boundary                                                                              |
| --------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| Automated tests                               | 35 passed                         | Pure lab logic, DOM interactions, export structure, animation scheduling              |
| Exported pages                                | 15                                | Homepage, resume, 404, eight project pages, four field notes                          |
| Standard HTML validation                      | Passed                            | All exported pages; formatting-only preferences excluded                              |
| Local asset and page references               | Passed                            | Checked by the reproducible static audit                                              |
| Automated accessibility rules                 | No violations found               | DOM-based WCAG-tagged rules available without layout; not a conformance certification |
| Color contrast                                | Selected text palette meets 4.5:1 | Dark, light, and cream experience-section text pairs; see JSON for ratios             |
| CSS parsing                                   | Passed                            | Main stylesheet and standalone-article stylesheet                                     |
| Original C++ order harness                    | Compiled and run                  | Final result: one fill, two cancellations, one expiry                                 |
| Original C++ replay scoring                   | Cross-checked                     | All nine browser scores match within 1e-10                                            |
| Procedural hero artwork                       | Rendered and inspected            | Dark/light artwork and narrow-size artwork; not a full website screenshot             |
| Full browser rendering and real-device review | **Not completed**                 | Browser launch was unavailable in the execution environment                           |
| Public hosting                                | **Not completed**                 | Hosting and GitHub linking were unavailable in the workspace                          |

The functional suite covers replay threshold behavior, fixture accounting, queue conservation and overload, order activation and terminal states, the stale-delete scenario, filters, project readers, direct links, search, glossary navigation, keyboard-operated lab tabs, theme preference, animation pausing, malformed URLs, and the portable file.

Animation scheduling tests check that resizing does not create duplicate loops, and that motion stops while paused, offscreen, hidden, or behind an open dialog.

## Reproduce the local checks

Node 24.8 or later is required for the optional development audit tools used here. The shipped website itself has no runtime package dependencies.

```sh
npm install
npm run build
npm test
npm run test:ui
npm run audit
```

`validation-results.json` records the static and accessibility audit, including selected contrast ratios. The audit intentionally excludes automated layout-based color checks; palette contrast is calculated separately. It does not simulate a real browser layout.

## Original-code cross-checks

- `validation-evidence/order-harness.txt` is output from compiling and running the public standalone C++ fixture.
- `validation-evidence/replay-cross-check.csv` compares the original C++ scoring output with this website’s JavaScript model on the same nine fixture records.

Source:

- https://github.com/harshvardhanb11/curve_dex_limit-order-agent/blob/main/offline_limit_order_terminal.cpp
- https://github.com/harshvardhanb11/stablecoin_depeg_prediction_system/blob/main/src/core/risk_engine.cpp
- https://github.com/harshvardhanb11/stablecoin_depeg_prediction_system/blob/main/src/util/statistics.cpp
- https://github.com/harshvardhanb11/stablecoin_depeg_prediction_system/blob/main/data/sample_replay.csv

The reported 8.37M events/sec and 10.9 μs p99 remain attributed to the repository. The performance benchmark was **not** rerun as part of these cross-checks. No blockchain transaction was signed or broadcast, and no cloud training job was run.

## Before broad public sharing

Open the actual published URL on a phone and a desktop browser. Review wrapping, scrolling, the mobile menu, dialog focus, reduced-motion behavior, and resume printing. Confirm that the public address works for a signed-out visitor. `PUBLISH.html` explains manual upload without GitHub linking.
