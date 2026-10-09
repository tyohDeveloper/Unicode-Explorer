# Checkpoint 4 evidence

- `measure-checkpoint-4.cjs`: warm start-up (5 runs), the embedded-only probe split by font
  and design, and all-block first-cell and detection times for a Standard and a Complete build,
  with network and error traces. `ONLY_ALL=1` runs the Complete all-blocks measurement alone; it
  was used to compare the 2.2.5.0 release zip with 2.3.0.0, two runs each.
- `measurements.json`: 2.3.0.0-app. `measurements-2.3.1.0.json`: 2.3.1.0-app (after CP4-01).

Run from the repository with `NODE_PATH=node_modules node docs/audit/checkpoint-4/evidence/measure-checkpoint-4.cjs <standard Unicode.html> <complete Unicode.html beside unicode-fonts/> .`
