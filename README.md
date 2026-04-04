# GOG Countries

[![npm version](https://img.shields.io/npm/v/@iampopovich/gog-countries)](https://www.npmjs.com/package/@iampopovich/gog-countries)
[![npm downloads](https://img.shields.io/npm/dm/@iampopovich/gog-countries)](https://www.npmjs.com/package/@iampopovich/gog-countries)
[![npm license](https://img.shields.io/npm/l/@iampopovich/gog-countries)](https://github.com/iampopovich/GOG-Countries/blob/main/LICENSE)
[![node version](https://img.shields.io/node/v/@iampopovich/gog-countries)](https://www.npmjs.com/package/@iampopovich/gog-countries)

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

### CLI mode

```bash
# Single game by URL
gog-countries -u https://www.gog.com/game/diablo --normalize --pretty --count 5

# Wishlist
gog-countries -w username --pretty

# gogdb.org links also work
gog-countries -u https://www.gogdb.org/product/1207658992
```

### All flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--url` | `-u` | GOG game page URL | — |
| `--wishlist` | `-w` | GOG username | — |
| `--normalize` | `-n` | Convert all prices to USD | off |
| `--count` | `-c` | How many countries to show | 10 |
| `--pretty` | `-p` | Table output instead of plain text | off |
| `--verbose` | `-v` | Debug logging | off |
| `--help` | `-h` | Show help | — |

## License

MIT
