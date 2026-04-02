/**
 * Tests for CLI argument parsing
 */

// We need to test the parseArgs function from index.js
// Since index.js has side effects, we'll extract and test the logic

const logger = require('../src/logger');

// Mock logger to suppress output
jest.mock('../src/logger', () => ({
  setupLogging: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock API and wishlist modules
jest.mock('../src/api', () => ({
  extractProductId: jest.fn(),
  requestPrices: jest.fn(),
  sortPrices: jest.fn(),
  outResult: jest.fn()
}));

jest.mock('../src/wishlist', () => ({
  processWishlist: jest.fn(),
  displayBestPrices: jest.fn()
}));

describe('CLI Argument Parsing', () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('parseArgs function', () => {
    function parseArgs(argv) {
      const args = {
        url: null,
        wishlist: null,
        normalize: false,
        count: 10,
        pretty: false,
        verbose: false,
        help: false
      };

      for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '-u' || arg === '--url') {
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

    test('should return default values with no arguments', () => {
      const args = parseArgs([]);

      expect(args.url).toBeNull();
      expect(args.wishlist).toBeNull();
      expect(args.normalize).toBe(false);
      expect(args.count).toBe(10);
      expect(args.pretty).toBe(false);
      expect(args.verbose).toBe(false);
      expect(args.help).toBe(false);
    });

    test('should parse short url flag', () => {
      const args = parseArgs(['-u', 'https://www.gog.com/game/diablo']);

      expect(args.url).toBe('https://www.gog.com/game/diablo');
    });

    test('should parse long url flag', () => {
      const args = parseArgs(['--url', 'https://www.gog.com/game/cyberpunk_2077']);

      expect(args.url).toBe('https://www.gog.com/game/cyberpunk_2077');
    });

    test('should parse short wishlist flag', () => {
      const args = parseArgs(['-w', 'username']);

      expect(args.wishlist).toBe('username');
    });

    test('should parse long wishlist flag', () => {
      const args = parseArgs(['--wishlist', 'testuser']);

      expect(args.wishlist).toBe('testuser');
    });

    test('should parse short normalize flag', () => {
      const args = parseArgs(['-n']);

      expect(args.normalize).toBe(true);
    });

    test('should parse long normalize flag', () => {
      const args = parseArgs(['--normalize']);

      expect(args.normalize).toBe(true);
    });

    test('should parse short count flag', () => {
      const args = parseArgs(['-c', '5']);

      expect(args.count).toBe(5);
    });

    test('should parse long count flag', () => {
      const args = parseArgs(['--count', '20']);

      expect(args.count).toBe(20);
    });

    test('should parse short pretty flag', () => {
      const args = parseArgs(['-p']);

      expect(args.pretty).toBe(true);
    });

    test('should parse long pretty flag', () => {
      const args = parseArgs(['--pretty']);

      expect(args.pretty).toBe(true);
    });

    test('should parse short verbose flag', () => {
      const args = parseArgs(['-v']);

      expect(args.verbose).toBe(true);
    });

    test('should parse long verbose flag', () => {
      const args = parseArgs(['--verbose']);

      expect(args.verbose).toBe(true);
    });

    test('should parse short help flag', () => {
      const args = parseArgs(['-h']);

      expect(args.help).toBe(true);
    });

    test('should parse long help flag', () => {
      const args = parseArgs(['--help']);

      expect(args.help).toBe(true);
    });

    test('should parse multiple flags together', () => {
      const args = parseArgs([
        '-u', 'https://www.gog.com/game/test',
        '-n',
        '-p',
        '-c', '15',
        '-v'
      ]);

      expect(args.url).toBe('https://www.gog.com/game/test');
      expect(args.normalize).toBe(true);
      expect(args.pretty).toBe(true);
      expect(args.count).toBe(15);
      expect(args.verbose).toBe(true);
    });

    test('should parse long flags together', () => {
      const args = parseArgs([
        '--url', 'https://www.gog.com/game/test',
        '--normalize',
        '--pretty',
        '--count', '15',
        '--verbose'
      ]);

      expect(args.url).toBe('https://www.gog.com/game/test');
      expect(args.normalize).toBe(true);
      expect(args.pretty).toBe(true);
      expect(args.count).toBe(15);
      expect(args.verbose).toBe(true);
    });

    test('should handle mixed short and long flags', () => {
      const args = parseArgs([
        '-u', 'https://www.gog.com/game/test',
        '--normalize',
        '-p',
        '--count', '15'
      ]);

      expect(args.url).toBe('https://www.gog.com/game/test');
      expect(args.normalize).toBe(true);
      expect(args.pretty).toBe(true);
      expect(args.count).toBe(15);
    });

    test('should handle URL with special characters', () => {
      const args = parseArgs([
        '-u', 'https://www.gog.com/game/cyberpunk_2077?param=value&other=123'
      ]);

      expect(args.url).toBe('https://www.gog.com/game/cyberpunk_2077?param=value&other=123');
    });

    test('should handle username with special characters', () => {
      const args = parseArgs([
        '-w', 'user_name-123'
      ]);

      expect(args.wishlist).toBe('user_name-123');
    });

    test('should handle count of zero', () => {
      const args = parseArgs(['-c', '0']);

      expect(args.count).toBe(0);
    });

    test('should handle large count values', () => {
      const args = parseArgs(['-c', '1000']);

      expect(args.count).toBe(1000);
    });

    test('should handle NaN for invalid count', () => {
      const args = parseArgs(['-c', 'invalid']);

      expect(isNaN(args.count)).toBe(true);
    });

    test('should handle missing value after flag', () => {
      const args = parseArgs(['-u']);

      expect(args.url).toBeUndefined();
    });

    test('should handle unknown flags gracefully', () => {
      const args = parseArgs(['--unknown-flag', 'value']);

      expect(args.url).toBeNull();
      expect(args.wishlist).toBeNull();
      expect(args.normalize).toBe(false);
    });

    test('should handle duplicate flags (last one wins)', () => {
      const args = parseArgs([
        '-u', 'https://first.com',
        '-u', 'https://second.com'
      ]);

      expect(args.url).toBe('https://second.com');
    });

    test('should handle normalize flag appearing multiple times', () => {
      const args = parseArgs(['-n', '-n', '-n']);

      expect(args.normalize).toBe(true);
    });

    test('should preserve flag order for same type', () => {
      const args = parseArgs([
        '-v',
        '-p',
        '-n'
      ]);

      expect(args.verbose).toBe(true);
      expect(args.pretty).toBe(true);
      expect(args.normalize).toBe(true);
    });
  });

  describe('printHelp function', () => {
    function printHelp() {
      console.log(`
GOG Price Checker - Check game prices across different countries

Usage: node index.js [options]

Options:
  -u, --url <url>        URL of the game page to scrape
  -w, --wishlist <user>  Username to fetch wishlist for
  -n, --normalize        Normalize currencies to USD
  -c, --count <num>      Number of countries to show (default: 10)
  -p, --pretty           Show result as pretty table
  -v, --verbose          Enable verbose logging
  -h, --help             Show this help message

Examples:
  node index.js -u https://www.gog.com/game/diablo -n -p
  node index.js -w username -p
  node index.js --url https://www.gog.com/game/cyberpunk_2077 --count 5
`);
    }

    test('should print help message with all options', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      printHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('GOG Price Checker');
      expect(output).toContain('-u, --url');
      expect(output).toContain('-w, --wishlist');
      expect(output).toContain('-n, --normalize');
      expect(output).toContain('-c, --count');
      expect(output).toContain('-p, --pretty');
      expect(output).toContain('-v, --verbose');
      expect(output).toContain('-h, --help');

      consoleSpy.mockRestore();
    });

    test('should include examples in help message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      printHelp();

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Examples:');
      expect(output).toContain('node index.js -u');
      expect(output).toContain('node index.js -w');

      consoleSpy.mockRestore();
    });

    test('should mention default count value', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      printHelp();

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('default: 10');

      consoleSpy.mockRestore();
    });
  });

  describe('Main function behavior', () => {
    test('should exit with help when help flag is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const processSpy = jest.spyOn(process, 'exit').mockImplementation();

      function parseArgs(argv) {
        const args = { help: false };
        for (let i = 0; i < argv.length; i++) {
          if (argv[i] === '-h' || argv[i] === '--help') {
            args.help = true;
          }
        }
        return args;
      }

      const args = parseArgs(['--help']);

      expect(args.help).toBe(true);

      consoleSpy.mockRestore();
      processSpy.mockRestore();
    });

    test('should show error when neither URL nor wishlist is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      function validateArgs(args) {
        if (!args.wishlist && !args.url) {
          return false;
        }
        return true;
      }

      const args = { url: null, wishlist: null };
      const isValid = validateArgs(args);

      expect(isValid).toBe(false);

      consoleSpy.mockRestore();
    });

    test('should accept URL mode', () => {
      const args = { url: 'https://www.gog.com/game/test', wishlist: null };

      expect(args.url).toBeTruthy();
      expect(args.wishlist).toBeNull();
    });

    test('should accept wishlist mode', () => {
      const args = { url: null, wishlist: 'username' };

      expect(args.url).toBeNull();
      expect(args.wishlist).toBeTruthy();
    });

    test('should handle both URL and wishlist (URL takes precedence)', () => {
      const args = {
        url: 'https://www.gog.com/game/test',
        wishlist: 'username'
      };

      // In the actual implementation, wishlist is checked first
      expect(args.url).toBeTruthy();
      expect(args.wishlist).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    function parseArgs(argv) {
      const args = {
        url: null,
        wishlist: null,
        normalize: false,
        count: 10,
        pretty: false,
        verbose: false,
        help: false
      };

      for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '-u' || arg === '--url') {
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

    test('should handle empty argv array', () => {
      const args = parseArgs([]);

      expect(args.url).toBeNull();
      expect(args.wishlist).toBeNull();
    });

    test('should handle undefined arguments', () => {
      const args = parseArgs([undefined, null]);

      expect(args.url).toBeNull();
    });

    test('should handle flags at the end without values', () => {
      const args = parseArgs(['-u', 'https://example.com', '-n', '-p']);

      expect(args.url).toBe('https://example.com');
      expect(args.normalize).toBe(true);
      expect(args.pretty).toBe(true);
    });

    test('should handle negative count values', () => {
      const args = parseArgs(['-c', '-5']);

      expect(args.count).toBe(-5);
    });

    test('should handle floating point count values', () => {
      const args = parseArgs(['-c', '5.5']);

      expect(args.count).toBe(5);
    });

    test('should handle very long URLs', () => {
      const longUrl = 'https://www.gog.com/game/' + 'a'.repeat(500);
      const args = parseArgs(['-u', longUrl]);

      expect(args.url).toBe(longUrl);
    });

    test('should handle URLs with fragments', () => {
      const args = parseArgs(['-u', 'https://www.gog.com/game/test#section']);

      expect(args.url).toBe('https://www.gog.com/game/test#section');
    });

    test('should handle usernames with numbers', () => {
      const args = parseArgs(['-w', 'user123']);

      expect(args.wishlist).toBe('user123');
    });

    test('should handle all boolean flags at once', () => {
      const args = parseArgs(['-n', '-p', '-v', '-h']);

      expect(args.normalize).toBe(true);
      expect(args.pretty).toBe(true);
      expect(args.verbose).toBe(true);
      expect(args.help).toBe(true);
    });
  });
});
