/**
 * Jest Configuration for GOG-Countries
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    'index.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Coverage report formats
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Test timeout in milliseconds
  testTimeout: 10000,

  // Stop running tests after the first failure
  bail: false,

  // Display individual test results
  collectCoverage: false
};
