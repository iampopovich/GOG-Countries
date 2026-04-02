# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.2] - 2026-04-03

### Added

- Interactive TUI mode — launches when called without arguments
- `--verbose` flag for debug logging

### Fixed

- Null-safe parsing of product ID from GOG page HTML
- `extractGogData` now handles `window.gogData` in plain `<script>` tags

## [1.0.1] - 2026-04-03

### Added

- `engines` field: requires Node.js ≥ 14
- `files` field: only necessary files are published to npm
- `prepublishOnly` script: runs tests before publish

### Fixed

- Jest version corrected from `^30.3.0` to `^29.7.0`

## [1.0.0] - 2026-04-03

### Added

- Initial release
- Check game prices across 82 countries by GOG URL or gogdb.org URL
- Wishlist support: fetch best prices for all games in a user's wishlist
- `--normalize` flag to convert all prices to USD
- `--pretty` flag for table output
- `--count` to limit number of countries shown
