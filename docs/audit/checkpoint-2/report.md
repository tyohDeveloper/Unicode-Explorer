# Unicode Explorer: Audit Checkpoint 2 (Phase 4 release)

Checkpoint date: 2026-10-08. Compares the state at **app 2.0.0.0 / data 1.1.0.0** (tags
`2.0.0.0-app`, `1.1.0.0-data`) with [Checkpoint 1](../checkpoint-1/report.md) (baseline
commit e7ad733). Every Checkpoint 1 finding is re-examined against the current tree and
measurements, not against the changelog; where the changelog was wrong this report says so.

## State at the checkpoint

| | Checkpoint 1 (e7ad733) | Checkpoint 2 (2.0.0.0-app) |
|---|---|---|
| Artifact | `Unicode.html` 406,485 bytes | `Unicode.html` 2,795,352 bytes (gzip 1,985,453), of which 1,765,228 bytes are four embedded fonts |
| Source | 10 concatenated global scripts, Replit scaffold | 91 TypeScript/ESM files in six layer roles, zero standards exceptions |
| Data | UCD downloaded at build time, unverified | 5 UCD 17.0.0 files vendored with SHA-256; 6 generated tables regeneration-checked |
| Fonts | none embedded | Unifont 17.0.05, Unifont Upper, Last Resort 18.000 (full build), Adobe Blank 2, all hash-pinned to upstream; 7 sidecar packs as release assets |
| Tests | none | 50 unit, 13 Playwright over `file://`; CI build, e2e and release workflows green |
| Releases | tag v1.0.0.0 | 1.1.0.0-app, 1.2.0.0-app, 2.0.0.0-app; 1.0.0.0-data, 1.1.0.0-data; release assets: `Unicode.html`, Complete (20.1 MB), Complete + Hieroglyphs (26.7 MB) |
| Commits since Checkpoint 1 | — | 43 on `main` (Phases 1–4), terse and decomposed |

## What was measured

All measurements in the sandbox's Chromium 1248 (Linux, Playwright) against the released
artifact over `file://`; scripts are in [`evidence/`](evidence/).

| Measurement | Result |
|---|---|
| Start-up to first interactive render (name table decoded, fonts loaded, catalogue probe failed softly) | 525–565 ms |
| Visible assigned Unicode 17 characters verified by the **embedded fonts alone** (probe terminated by Adobe Blank) | **77,873 of 159,375** (48.9%); cmap count is 77,874, see CP2-07; 20 blocks have gaps, all in the supplementary planes (`evidence/embedded-only-gaps-by-block.json`) |
| Verified with the full output stack on this machine (its Noto fonts count) | 87,965 (55.2%) |
| Verified by the embedded **Last Resort** behind Blank | 159,375 of 159,375 (every placeholder renders; the HE build measured 0) |
| Probe time, all 159,375 characters, embedded fonts only | 1.2 s |
| Probe time, all characters, full stack with 137 device families | 35–37 s |
| All blocks in Grid mode, select to rendered (includes detection) | 52–53 s (Checkpoint 1: 19.2 s) |
| Release workflow on GitHub's runner: pinned hashes verified, packs rebuilt byte-identically, manifest unchanged | pass ([run](https://github.com/tyohDeveloper/Unicode-Explorer/actions/runs/37837036087)) |
| Edition coverage recorded by `build:packs` | Standard 77,874 · Complete 154,164 (96.7%) · Complete + Hieroglyphs 159,230 (99.9%) of 159,375 |

## Verdict

The three P1 glyph findings (GLY-01, GLY-02) and the P1 build, architecture and security findings
are closed with evidence. The application is now a verified, reproducible, standards-conformant
artifact with its own font coverage; the remaining open P1 items are **PRF-01** (which detection
has made worse, see CP2-01), **ACC-01**, and **DAT-01** (Unicode 18), all scheduled.

Two course corrections during Phase 4 are the headline lessons:

1. **A font can load and still render nothing.** The Last Resort HE build the audit recommended
   has a format 13 cmap that Chromium does not use; the full build with a format 12 cmap ships
   instead (D-11, CP2-02). The e2e test that should have caught this checked CSS rather than
   pixels; it now measures the glyph (CP2-05).
2. **Detection cannot be made to say "missing".** The probe only sees fonts named in the list;
   system fallback is invisible to it, and Chromium's tofu metrics vary by code point. The app
   therefore reports **verified / unverified** and makes placeholders opt-in (D-12, CP2-03).

One correction to the release notes: the 2.0.0.0 CHANGELOG and PLAN listed **GLY-06** (fixed
2em cells, no emoji presentation toggle) as closed. It is not; the combining-mark work belongs
to GLY-04. Both documents are corrected in the checkpoint commit.

## Finding register

[`finding-register.csv`](finding-register.csv) carries every Checkpoint 1 finding with its
Checkpoint 2 status, the version that closed it, and the evidence, plus seven new findings.

| Status | Count | Findings |
|---|---:|---|
| Closed | 23 | GLY-01, GLY-02†, GLY-04, GLY-05, DAT-02, BLD-01–06, ARC-01–06, ARC-08, ACC-04, SEC-01–03, DOC-01 |
| Partial | 4 | GLY-03 (device fonts named; stacks unchanged), DAT-03 (data, still authored), ACC-02 (headers yes, cells no), UX-02 (name sort yes, duplicate Ch sort remains) |
| Open | 9 | GLY-06, DAT-01, DAT-04, ARC-07, PRF-01 (worse), PRF-02, ACC-01, ACC-03, UX-01 |
| Deferred | 1 | DAT-05 (detail panel; not scheduled) |

† closed with the D-12 limitation.

New at this checkpoint:

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| CP2-01 | P2 | Probe cost scales with stack length: 1.2 s embedded-only vs 35 s with 137 device names; all-blocks Grid 52 s | Open; Phase 5 (prune absent families at start-up, lazy per-block probing, virtualisation) |
| CP2-02 | P1 | Last Resort HE yields no glyphs in Chromium (format 13 cmap) | Closed in 2.0.0.0 (full build; D-11) |
| CP2-03 | P3 | Detection cannot observe system fallback | Accepted limitation (D-12) |
| CP2-04 | P3 | 145 Tangut characters (Unicode 13–17 additions) have no font anywhere | Open; re-pin Noto Serif Tangut in Phase 6 |
| CP2-05 | P3 | Placeholder e2e test asserted CSS, not rendering | Closed in this checkpoint (canvas measurement added) |
| CP2-06 | P3 | Early Dynastic Cuneiform miscategorised | Closed in data 1.1.0.0 |
| CP2-07 | P3 | One Unifont Specials entry draws nothing (77,873 vs 77,874) | Cosmetic |

## Recommendations for Phase 5

In priority order, with the finding each serves:

1. **Prune the probe stack at start-up** (CP2-01): measure each `data/device-fonts.json` family
   once with a representative character behind Adobe Blank; keep only families present. On a
   typical device this leaves a handful of names, returning probe cost to ~1 s for everything
   and shortening `--glyph-font`, which also speeds layout.
2. **Virtualise the output and probe lazily** (PRF-01, PRF-02, CP2-01): windowed rendering over
   fixed-size cells; probe only rendered blocks in idle chunks; cache coverage per block so
   headings and the status bar fill in progressively instead of after a 50 s freeze.
3. **Keyboard access** (ACC-01, ACC-02): focusable mode/font controls (visually hidden, not
   `display:none`), roving focus in grids, Enter to insert; keep focus in the grid (UX-01).
4. **Contrast and labels** (ACC-03): lighten the accent for text use; the coverage amber
   (7.3:1) already passes.
5. **Cells that fit their glyph and a presentation toggle** (GLY-06); remove the duplicate Ch
   sort (UX-02); index `docs/tasks/` (ARC-07); alias and code-point search from the generated
   abbreviations table (DAT-04).

Phase 6 keeps Unicode 18 (DAT-01) with the data-derived algorithmic ranges (DAT-03) and the
Tangut re-pin (CP2-04). Q-10 (`local()`-composed script-aware stacks) stays deferred.

## Sources

- Measurements: [`evidence/`](evidence/) scripts, run 2026-10-08 against commit `2.0.0.0-app`.
- Decisions: [`../../PLAN.md`](../../PLAN.md) D-11, D-12, D-13; [ADR-0001](../../adr/0001-sidecar-font-packs.md).
- Release: <https://github.com/tyohDeveloper/Unicode-Explorer/releases/tag/2.0.0.0-app>; CI build
  <https://github.com/tyohDeveloper/Unicode-Explorer/actions/runs/37837036666>, release
  <https://github.com/tyohDeveloper/Unicode-Explorer/actions/runs/37837036087>.
- Last Resort builds: <https://github.com/unicode-org/last-resort-font/releases/tag/18.000>
  (`LastResort-Regular.ttf`, `LastResortHE-Regular.ttf`).
