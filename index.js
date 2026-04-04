#!/usr/bin/env node

/**
 * GOG Countries - CLI Application
 * Check game prices across different countries
 */

const { extractProductId, requestPrices, sortPrices, outResult } = require('./src/api');
const { processWishlist, displayBestPrices } = require('./src/wishlist');
const { runTUI } = require('./src/tui');
const logger = require('./src/logger');
const { version } = require('./package.json');

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = {
    url: null,
    wishlist: null,
    normalize: false,
    count: 10,
    pretty: false,
    verbose: false,
    help: false
  };

  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '-V' || arg === '--version') {
      console.log(`gog-countries v${version}`);
      process.exit(0);
    } else if (arg === '-u' || arg === '--url') {
      args.url = argv[++i];
    } else if (arg === '-w' || arg === '--wishlist') {
      args.wishlist = argv[++i];
    } else if (arg === '-n' || arg === '--normalize') {
      args.normalize = true;
    } else if (arg === '-c' || arg === '--count') {
      args.count = parseInt(argv[++i], 10);
    } else if (arg === '-p' || arg === '--pretty') {
      args.pretty = true;
    } else if (arg === '-v' || arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '-h' || arg === '--help') {
      args.help = true;
    }
  }

  return args;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
GOG Countries - Check game prices across different countries

Usage: gog-countries [options]

Options:
  -u, --url <url>        URL of the game page to scrape
  -w, --wishlist <user>  Username to fetch wishlist for
  -n, --normalize        Normalize currencies to USD
  -c, --count <num>      Number of countries to show (default: 10)
  -p, --pretty           Show result as pretty table
  -v, --verbose          Enable verbose logging
  -V, --version          Show version
  -h, --help             Show this help message

Examples:
  gog-countries -u https://www.gog.com/game/diablo -n -p
  gog-countries -w username -p
  gog-countries --url https://www.gog.com/game/cyberpunk_2077 --count 5
`);
}

/**
 * Main function to run the script
 */
async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  logger.setupLogging(args.verbose);

  if (args.wishlist) {
    logger.info(`Fetching wishlist for user: ${args.wishlist}`);
    const bestPrices = await processWishlist(args.wishlist, args.normalize);
    displayBestPrices(bestPrices, args.pretty);
  } else if (args.url) {
    let productId;
    if (args.url.includes('gogdb.org')) {
      productId = args.url.split('/').pop();
    } else {
      productId = await extractProductId(args.url);
    }
    await requestPrices(productId, args.normalize);
    outResult(args.count, args.pretty);
  } else {
    await runTUI();
  }
}

// Run main function
main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
