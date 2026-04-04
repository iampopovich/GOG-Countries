const inquirer = require('inquirer');
const { Separator } = inquirer;
const { extractProductId, requestPrices, sortPrices, outResult } = require('./api');
const { processWishlist, displayBestPrices } = require('./wishlist');
const logger = require('./logger');
const { version } = require('../package.json');

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function startSpinner(text) {
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r\x1b[36m${SPINNER_FRAMES[i % SPINNER_FRAMES.length]}\x1b[0m ${text}`);
    i++;
  }, 80);
  return {
    stop(doneText) {
      clearInterval(timer);
      process.stdout.write(`\r\x1b[32m✔\x1b[0m ${doneText || text}\n`);
    },
    fail(errText) {
      clearInterval(timer);
      process.stdout.write(`\r\x1b[31m✖\x1b[0m ${errText || text}\n`);
    }
  };
}

async function handleGamePrice() {
  const { url } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'GOG game URL:',
      validate: v => {
        if (!v.trim()) return 'URL cannot be empty';
        try {
          const parsed = new URL(v.trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) return 'URL must use http or https';
          if (!parsed.hostname.endsWith('gog.com') && !parsed.hostname.endsWith('gogdb.org')) {
            return 'URL must be from gog.com or gogdb.org';
          }
        } catch {
          return 'Invalid URL';
        }
        return true;
      }
    }
  ]);

  const { normalize, count, pretty } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'normalize',
      message: 'Normalize prices to USD?',
      default: false
    },
    {
      type: 'number',
      name: 'count',
      message: 'Number of countries to show:',
      default: 10,
      validate: v => v > 0 ? true : 'Must be greater than 0'
    },
    {
      type: 'confirm',
      name: 'pretty',
      message: 'Show as pretty table?',
      default: false
    }
  ]);

  console.log();
  const spinner = startSpinner('Fetching prices...');
  try {
    let productId;
    if (url.includes('gogdb.org')) {
      productId = url.split('/').pop();
    } else {
      productId = await extractProductId(url.trim());
    }
    await requestPrices(productId, normalize);
    spinner.stop('Done!');
    console.log();
    outResult(count, pretty);
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  }
  console.log();
}

async function handleWishlist() {
  const { username } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'GOG username:',
      validate: v => v.trim() ? true : 'Username cannot be empty'
    }
  ]);

  const { normalize, pretty } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'normalize',
      message: 'Normalize prices to USD?',
      default: false
    },
    {
      type: 'confirm',
      name: 'pretty',
      message: 'Show as pretty table?',
      default: false
    }
  ]);

  console.log();
  const spinner = startSpinner('Fetching wishlist...');
  try {
    const bestPrices = await processWishlist(username.trim(), normalize);
    spinner.stop('Done!');
    console.log();
    displayBestPrices(bestPrices, pretty);
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
  }
  console.log();
}

async function runTUI() {
  logger.setupLogging(false, true);
  const versionStr = `v${version}`.padEnd(7);
  console.log('\x1b[36m\x1b[1m');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log(`  ║         GOG Countries    ${versionStr}         ║`);
  console.log('  ║   Check game prices across all countries ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('\x1b[0m');

  let running = true;
  while (running) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Check game price by URL', value: 'url' },
          { name: 'Check wishlist by username', value: 'wishlist' },
          new Separator(),
          { name: 'Quit', value: 'quit' }
        ]
      }
    ]);

    console.log();

    if (action === 'url') {
      await handleGamePrice();
    } else if (action === 'wishlist') {
      await handleWishlist();
    } else {
      running = false;
    }
  }

  console.log('\x1b[2mGoodbye!\x1b[0m\n');
}

module.exports = { runTUI };
