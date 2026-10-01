# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Releases prior to this file's existence aren't individually documented here; see [GitHub Releases](https://github.com/p3k/germknoedel/releases) for the historical list.

## [4.0.0] - 2026-10-01

### Changed

- **Breaking:** dropped support for Node.js 16 and 18, both end of life. The minimum supported version is now Node.js 20.19.0. ([#161](https://github.com/p3k/germknoedel/pull/161))
- Published on [JSR](https://jsr.io/@p3k/germknoedel) again, after a long gap – confirmed working under Deno and Bun as well as Node.js, and kept in sync with the npm release going forward. ([#176](https://github.com/p3k/germknoedel/pull/176))
- Shipped TypeScript type declarations (`index.d.ts`) for the library's `calculate` and `validate` exports. ([#176](https://github.com/p3k/germknoedel/pull/176))
- Trimmed the published npm and JSR packages down to just the files needed at runtime. ([#173](https://github.com/p3k/germknoedel/pull/173))

### Fixed

- Generated codes no longer depend on the host machine's timezone. The same command could previously produce a different, wrong date of birth or expiry depending on where it ran – every default invocation was affected for anyone running it west of UTC. ([#170](https://github.com/p3k/germknoedel/pull/170))
- `--gender` no longer accepts inherited `Object.prototype` member names (e.g. `--gender toString`) as if they were valid genders, which used to crash with an unrelated error instead of reporting "Unknown gender". ([#171](https://github.com/p3k/germknoedel/pull/171))
- `--update` now reports the actual HTTP status when its data source is unreachable, instead of a misleading "incorrect header check" error. The source itself has gone offline permanently with no known replacement; see [#107](https://github.com/p3k/germknoedel/issues/107). ([#167](https://github.com/p3k/germknoedel/pull/167))
- Corrected the LICENSE file, which had held the plain GPL-3.0 text since the project's first commit despite `package.json` having declared LGPL-3.0-or-later from very early on. ([#175](https://github.com/p3k/germknoedel/pull/175))
- Fixed the two dead links under Kudos, now pointing at Wayback Machine snapshots of the original pages. ([#168](https://github.com/p3k/germknoedel/pull/168))
