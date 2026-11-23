# Changelog

All notable changes to node-blink1-server.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.1] - 2026-11-23

### Fixed
- `stopPattern()` removed the wrong entries from the play queue: it kept
  only the stopped pattern and dropped all others. With serialize mode on,
  stopping one pattern wiped out the other queued patterns.
- `PatternsService.initialize()` no longer mutates the pattern objects
  passed in (e.g. config-owned objects).
- `GET /blink1/random` sometimes returned a short color like `#37315`;
  colors are now always 6 hex digits, and `#FFFFFF` is possible.

### Changed
- `node-blink1` pinned to `0.5.1` (was `>=0.5.0`, which now resolves to
  0.6.0).
- `tinycolor2` minimum raised to `^1.6.0`.
- README: npm, downloads, node, license, and tests badges.

## [2.0.0] - 2026-06-07

Rewritten from the ground up to match the full
[Blink1Control2](https://github.com/todbot/Blink1Control2) API.

### Added
- Named color patterns: play, stop, add, delete, and pattern queue.
- Meta-patterns (`#rrggbb`, `~off`, `~blink:...`, `~pattern:...`).
- Multi-device support via `blink1_id` on all endpoints.
- Node.js library API: `createBlink1Server()` factory with an
  EventEmitter interface (e.g. `patternsChanged` for persistence).
- CLI options for port and host.
- Plug and unplug of blink(1) while the server is running.

[Unreleased]: https://github.com/todbot/Blink1Control2/compare/node-blink1-server-v2.0.1...HEAD
[2.0.1]: https://github.com/todbot/Blink1Control2/compare/node-blink1-server-v2.0.0...node-blink1-server-v2.0.1
[2.0.0]: https://github.com/todbot/Blink1Control2/tree/node-blink1-server-v2.0.0/packages/node-blink1-server
