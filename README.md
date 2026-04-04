# GOG Countries

Find the cheapest price for any GOG game across **82 countries** — by URL or from your wishlist.

**Requires:** Node.js ≥ 14

## Install

**From npm:**
```bash
npm install -g @iampopovich/gog-countries
```

**From GitHub Packages:**
```bash
npm install -g @iampopovich/gog-countries --registry=https://npm.pkg.github.com
```

**Without installing TUI mode (npx):**
```bash
npx @iampopovich/gog-countries
```

## Usage

### Interactive mode (TUI)

Just run without arguments:

```
gog-countries
```

```
  ╔══════════════════════════════════════════╗
  ║         GOG Countries    v1.0.x          ║
  ║   Check game prices across all countries ║
  ╚══════════════════════════════════════════╝

? What would you like to do?
❯ Check game price by URL
  Check wishlist by username
  NPM activity statistics
  ──────────────
  Quit
```

**Checking a game by URL:**

```
? What would you like to do? Check game price by URL

  GOG game URL: https://www.gog.com/game/cyberpunk_2077
  Normalize to USD? (y/N): y
  Number of countries to show (default 10): 5
  Pretty table? (y/N): y

  ✔ Done!

Country                   Price      Currency
------------------------------------------
Argentina                 14.99      USD
Turkey                    17.49      USD
Brazil                    19.99      USD
Colombia                  22.99      USD
India                     24.99      USD
```

**Checking a wishlist:**

```
? What would you like to do? Check wishlist by username

  GOG username: johndoe
  Normalize to USD? No
  Pretty table? Yes

  ✔ Done!

Product                   Price     Currency  Country
-----------------------------------------------------
Cyberpunk 2077            899.00    ARS       Argentina
The Witcher 3             499.00    ARS       Argentina
Disco Elysium             12.49     USD       Turkey
```

**NPM activity statistics:**

```
? What would you like to do? NPM activity statistics

  NPM package name (leave blank for this package): @iampopovich/gog-countries
  Show as pretty table? Yes

  ✔ Done!

 NPM Statistics: @iampopovich/gog-countries
────────────────────────────────────────────────────────────
Package Info
  Description    : gog countries is a tool to check game prices...
  Latest Version : 1.0.8
  Total Releases : 8
  Latest Release : 2024-03-01
  Created        : 2023-01-01
  Last Modified  : 2024-03-15
  License        : MIT
  Author         : iampopovich
  Homepage       : https://github.com/iampopovich/GOG-Countries#readme

Download Statistics
  Last Week     : 1,234
  Last Month    : 5,678
  Last Year     : 42,000

Recent Versions
  • 1.0.8
  • 1.0.7
  • 1.0.6

Dependencies (1)
  • inquirer

Dev Dependencies (1)
  • jest
────────────────────────────────────────────────────────────
```

### CLI mode

```bash
# Single game by URL
gog-countries -u https://www.gog.com/game/diablo --normalize --pretty --count 5

# Wishlist
gog-countries -w username --pretty

# gogdb.org links also work
gog-countries -u https://www.gogdb.org/product/1207658992

# NPM activity statistics for this package
gog-countries --npm-stats --pretty

# NPM activity statistics for any package
gog-countries --npm-stats --npm-package lodash --pretty
```

### All flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--url` | `-u` | GOG game page URL | — |
| `--wishlist` | `-w` | GOG username | — |
| `--normalize` | `-n` | Convert all prices to USD | off |
| `--count` | `-c` | How many countries to show | 10 |
| `--pretty` | `-p` | Table output instead of plain text | off |
| `--npm-stats` | | Show NPM activity statistics | off |
| `--npm-package` | | NPM package name for `--npm-stats` | this package |
| `--verbose` | `-v` | Debug logging | off |
| `--help` | `-h` | Show help | — |

## NPM Activity Statistics

The `--npm-stats` flag (also available interactively in TUI mode) fetches live data from the [npm registry](https://registry.npmjs.org) and [npm download stats API](https://api.npmjs.org) and displays:

- **Package info:** version, description, author, license, homepage
- **Release history:** total versions released, date of latest release, five most recent versions
- **Download statistics:** download counts for the last week, month, and year
- **Dependencies:** production and development dependency lists

By default it shows stats for `@iampopovich/gog-countries`. Pass `--npm-package <name>` (or enter a name in TUI) to inspect any other public npm package.

```bash
# This package's own stats (plain text)
gog-countries --npm-stats

# A third-party package, formatted
gog-countries --npm-stats --npm-package express --pretty
```

## License

MIT
