/**
 * Tests for NPM statistics functions with mocked https requests
 */

const https = require('https');
const {
  fetchNpmDownloads,
  fetchNpmPackageInfo,
  getNpmStats,
  displayNpmStats
} = require('../src/npm-stats');
const logger = require('../src/logger');

// Mock logger to suppress output during tests
jest.mock('../src/logger', () => ({
  setupLogging: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock https module
jest.mock('https', () => ({
  get: jest.fn()
}));

/**
 * Helper to create a mock HTTP stream that returns the given body
 */
function mockHttpStream(body) {
  const stream = {
    on: jest.fn((event, callback) => {
      if (event === 'data') callback(body);
      if (event === 'end') callback();
      return stream;
    })
  };
  return stream;
}

/**
 * Helper to set up https.get to return a given response body
 */
function mockHttpGet(body) {
  https.get.mockImplementation((url, callback) => {
    callback(mockHttpStream(body));
    return { on: jest.fn() };
  });
}

/**
 * Helper to set up https.get to call the error handler
 */
function mockHttpGetError(errorMessage) {
  https.get.mockImplementation((url, callback) => {
    return {
      on: jest.fn((event, cb) => {
        if (event === 'error') cb(new Error(errorMessage));
      })
    };
  });
}

// Sample fixtures
const MOCK_DOWNLOADS = {
  downloads: 12345,
  start: '2024-03-01',
  end: '2024-03-31',
  package: 'test-package'
};

const MOCK_PACKAGE_INFO = {
  name: '@iampopovich/gog-countries',
  description: 'gog countries is a tool to check game prices in different countries',
  license: 'MIT',
  author: { name: 'iampopovich' },
  homepage: 'https://github.com/iampopovich/GOG-Countries#readme',
  'dist-tags': { latest: '1.0.8' },
  versions: {
    '1.0.6': {
      license: 'MIT',
      author: { name: 'iampopovich' },
      homepage: 'https://github.com/iampopovich/GOG-Countries#readme',
      dependencies: { inquirer: '^13.3.2' },
      devDependencies: { jest: '^29.7.0' }
    },
    '1.0.7': {
      license: 'MIT',
      author: { name: 'iampopovich' },
      homepage: 'https://github.com/iampopovich/GOG-Countries#readme',
      dependencies: { inquirer: '^13.3.2' },
      devDependencies: { jest: '^29.7.0' }
    },
    '1.0.8': {
      license: 'MIT',
      author: { name: 'iampopovich' },
      homepage: 'https://github.com/iampopovich/GOG-Countries#readme',
      dependencies: { inquirer: '^13.3.2' },
      devDependencies: { jest: '^29.7.0' }
    }
  },
  time: {
    created: '2023-01-01T00:00:00.000Z',
    modified: '2024-03-15T12:00:00.000Z',
    '1.0.6': '2023-12-01T00:00:00.000Z',
    '1.0.7': '2024-01-15T00:00:00.000Z',
    '1.0.8': '2024-03-01T00:00:00.000Z'
  }
};

// ─── fetchNpmDownloads ───────────────────────────────────────────────────────

describe('fetchNpmDownloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return download stats for a valid package', async () => {
    mockHttpGet(JSON.stringify(MOCK_DOWNLOADS));

    const result = await fetchNpmDownloads('test-package', 'last-month');

    expect(result).not.toBeNull();
    expect(result.downloads).toBe(12345);
    expect(result.package).toBe('test-package');
    expect(https.get).toHaveBeenCalledTimes(1);
    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('last-month/test-package'),
      expect.any(Function)
    );
  });

  test('should use last-month as default period', async () => {
    mockHttpGet(JSON.stringify(MOCK_DOWNLOADS));

    await fetchNpmDownloads('test-package');

    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('last-month'),
      expect.any(Function)
    );
  });

  test('should support last-week period', async () => {
    const weekData = { ...MOCK_DOWNLOADS, downloads: 3000, start: '2024-03-25', end: '2024-03-31' };
    mockHttpGet(JSON.stringify(weekData));

    const result = await fetchNpmDownloads('test-package', 'last-week');

    expect(result.downloads).toBe(3000);
    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('last-week'),
      expect.any(Function)
    );
  });

  test('should return null when API returns error field', async () => {
    mockHttpGet(JSON.stringify({ error: 'Not found' }));

    const result = await fetchNpmDownloads('nonexistent-package', 'last-month');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should return null on network error', async () => {
    mockHttpGetError('Network error');

    const result = await fetchNpmDownloads('test-package', 'last-month');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should return null on invalid JSON response', async () => {
    mockHttpGet('not valid json {{');

    const result = await fetchNpmDownloads('test-package', 'last-month');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should URL-encode scoped package names', async () => {
    mockHttpGet(JSON.stringify(MOCK_DOWNLOADS));

    await fetchNpmDownloads('@iampopovich/gog-countries', 'last-month');

    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('%40iampopovich%2Fgog-countries'),
      expect.any(Function)
    );
  });
});

// ─── fetchNpmPackageInfo ─────────────────────────────────────────────────────

describe('fetchNpmPackageInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return package metadata for a valid package', async () => {
    mockHttpGet(JSON.stringify(MOCK_PACKAGE_INFO));

    const result = await fetchNpmPackageInfo('@iampopovich/gog-countries');

    expect(result).not.toBeNull();
    expect(result.name).toBe('@iampopovich/gog-countries');
    expect(result['dist-tags'].latest).toBe('1.0.8');
    expect(https.get).toHaveBeenCalledTimes(1);
  });

  test('should URL-encode scoped package names', async () => {
    mockHttpGet(JSON.stringify(MOCK_PACKAGE_INFO));

    await fetchNpmPackageInfo('@iampopovich/gog-countries');

    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('%40iampopovich%2Fgog-countries'),
      expect.any(Function)
    );
  });

  test('should return null when API returns error field', async () => {
    mockHttpGet(JSON.stringify({ error: 'Not found' }));

    const result = await fetchNpmPackageInfo('nonexistent-xyz-package');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should return null on network error', async () => {
    mockHttpGetError('Connection refused');

    const result = await fetchNpmPackageInfo('test-package');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should return null on invalid JSON response', async () => {
    mockHttpGet('not valid json');

    const result = await fetchNpmPackageInfo('test-package');

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });
});

// ─── getNpmStats ──────────────────────────────────────────────────────────────

describe('getNpmStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupAllMocks() {
    // Will be called 4 times: package info + week + month + year downloads
    let callCount = 0;
    https.get.mockImplementation((url, callback) => {
      callCount++;
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(MOCK_PACKAGE_INFO);
      } else if (url.includes('last-week')) {
        body = JSON.stringify({ downloads: 3000, package: '@iampopovich/gog-countries' });
      } else if (url.includes('last-month')) {
        body = JSON.stringify({ downloads: 12000, package: '@iampopovich/gog-countries' });
      } else if (url.includes('last-year')) {
        body = JSON.stringify({ downloads: 120000, package: '@iampopovich/gog-countries' });
      } else {
        body = JSON.stringify({});
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });
  }

  test('should return complete stats object for a valid package', async () => {
    setupAllMocks();

    const stats = await getNpmStats('@iampopovich/gog-countries');

    expect(stats).not.toBeNull();
    expect(stats.name).toBe('@iampopovich/gog-countries');
    expect(stats.latestVersion).toBe('1.0.8');
    expect(stats.totalVersions).toBe(3);
    expect(stats.license).toBe('MIT');
    expect(stats.author).toBe('iampopovich');
    expect(stats.downloadsLastWeek).toBe(3000);
    expect(stats.downloadsLastMonth).toBe(12000);
    expect(stats.downloadsLastYear).toBe(120000);
    expect(stats.dependencies).toContain('inquirer');
    expect(stats.devDependencies).toContain('jest');
  });

  test('should return correct version history (most recent first)', async () => {
    setupAllMocks();

    const stats = await getNpmStats('@iampopovich/gog-countries');

    expect(stats.versions).toEqual(['1.0.8', '1.0.7', '1.0.6']);
  });

  test('should return formatted dates', async () => {
    setupAllMocks();

    const stats = await getNpmStats('@iampopovich/gog-countries');

    expect(stats.created).toBe('2023-01-01');
    expect(stats.latestPublished).toBe('2024-03-01');
  });

  test('should return null when package info is unavailable', async () => {
    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify({ error: 'Not found' });
      } else {
        body = JSON.stringify(MOCK_DOWNLOADS);
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });

    const stats = await getNpmStats('nonexistent-package');

    expect(stats).toBeNull();
  });

  test('should handle missing download stats gracefully', async () => {
    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(MOCK_PACKAGE_INFO);
      } else {
        // All download requests fail
        body = JSON.stringify({ error: 'not found' });
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });

    const stats = await getNpmStats('@iampopovich/gog-countries');

    expect(stats).not.toBeNull();
    expect(stats.downloadsLastWeek).toBeNull();
    expect(stats.downloadsLastMonth).toBeNull();
    expect(stats.downloadsLastYear).toBeNull();
  });

  test('should handle package with no dependencies', async () => {
    const infoNoDeps = {
      ...MOCK_PACKAGE_INFO,
      versions: {
        '1.0.0': {
          license: 'MIT',
          author: { name: 'testuser' }
          // no dependencies or devDependencies
        }
      },
      'dist-tags': { latest: '1.0.0' }
    };

    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(infoNoDeps);
      } else {
        body = JSON.stringify(MOCK_DOWNLOADS);
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });

    const stats = await getNpmStats('no-deps-package');

    expect(stats.dependencies).toEqual([]);
    expect(stats.devDependencies).toEqual([]);
  });

  test('should handle package with no author', async () => {
    const infoNoAuthor = {
      ...MOCK_PACKAGE_INFO,
      author: undefined,
      versions: {
        '1.0.8': {
          license: 'MIT'
          // no author
        }
      }
    };

    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(infoNoAuthor);
      } else {
        body = JSON.stringify(MOCK_DOWNLOADS);
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });

    const stats = await getNpmStats('no-author-package');

    expect(stats.author).toBe('unknown');
  });
});

// ─── displayNpmStats ─────────────────────────────────────────────────────────

describe('displayNpmStats', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function setupAllMocks() {
    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(MOCK_PACKAGE_INFO);
      } else if (url.includes('last-week')) {
        body = JSON.stringify({ downloads: 3000, package: '@iampopovich/gog-countries' });
      } else if (url.includes('last-month')) {
        body = JSON.stringify({ downloads: 12000, package: '@iampopovich/gog-countries' });
      } else if (url.includes('last-year')) {
        body = JSON.stringify({ downloads: 120000, package: '@iampopovich/gog-countries' });
      } else {
        body = JSON.stringify({});
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });
  }

  test('should output stats in plain text format by default', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries');

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('@iampopovich/gog-countries');
    expect(output).toContain('1.0.8');
    expect(output).toContain('MIT');
  });

  test('should output stats in pretty format when pretty=true', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries', true);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('NPM Statistics');
    expect(output).toContain('@iampopovich/gog-countries');
    expect(output).toContain('1.0.8');
    expect(output).toContain('Download Statistics');
    expect(output).toContain('Dependencies');
  });

  test('should show download numbers in pretty format', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries', true);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('3,000');
    expect(output).toContain('12,000');
    expect(output).toContain('120,000');
  });

  test('should display message when package is not found', async () => {
    https.get.mockImplementation((url, callback) => {
      callback(mockHttpStream(JSON.stringify({ error: 'Not found' })));
      return { on: jest.fn() };
    });

    await displayNpmStats('nonexistent-package');

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('Could not retrieve stats');
    expect(output).toContain('nonexistent-package');
  });

  test('should show N/A for missing download stats in plain format', async () => {
    https.get.mockImplementation((url, callback) => {
      let body;
      if (url.includes('registry.npmjs.org')) {
        body = JSON.stringify(MOCK_PACKAGE_INFO);
      } else {
        body = JSON.stringify({ error: 'not found' });
      }
      callback(mockHttpStream(body));
      return { on: jest.fn() };
    });

    await displayNpmStats('@iampopovich/gog-countries', false);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('N/A');
  });

  test('should show dependencies in pretty format', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries', true);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('inquirer');
  });

  test('should show dev dependencies in pretty format', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries', true);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('jest');
  });

  test('should list recent versions in plain format', async () => {
    setupAllMocks();

    await displayNpmStats('@iampopovich/gog-countries', false);

    const output = consoleSpy.mock.calls.map(args => args[0]).join('\n');
    expect(output).toContain('1.0.8');
    expect(output).toContain('Recent Versions');
  });
});
