# Fonts

`manifest.json` is the single source of truth for every font the build may embed: source URL,
version, SHA-256, license, measured coverage, and which editions use it. No font binaries are
committed. Phase 4 adds `tools/fetch-fonts.mjs`, which downloads manifest entries into a
git-ignored `fonts/cache/`, verifies hashes, converts TTF/OTF to WOFF2 where upstream ships none,
and records the resulting hashes back into the manifest.

Entries under `candidates` are kept aside and are not fetched or embedded (`docs/PLAN.md` D-4).

Entries whose upstream `sha256` is `null` (Unifont OTF, Jigmo zip) carry the hash of the
Unicode Font Kit WOFF2 conversion instead; the upstream hash is recorded on first fetch.
