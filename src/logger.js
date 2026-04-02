/**
 * Logger utility for GOG Price Checker
 */

let verboseMode = false;

/**
 * Setup logging based on verbosity level
 * @param {boolean} verbose - Enable verbose logging
 */
function setupLogging(verbose = false) {
  verboseMode = verbose;
  if (verbose) {
    console.debug = console.log;
  } else {
    console.debug = () => {};
  }
}

/**
 * Log info message
 * @param {string} message - Message to log
 */
function info(message) {
  console.log(`${new Date().toISOString()} - INFO - ${message}`);
}

/**
 * Log debug message (only if verbose mode is enabled)
 * @param {string} message - Message to log
 */
function debug(message) {
  if (verboseMode) {
    console.log(`${new Date().toISOString()} - DEBUG - ${message}`);
  }
}

/**
 * Log error message
 * @param {string} message - Message to log
 */
function error(message) {
  console.error(`${new Date().toISOString()} - ERROR - ${message}`);
}

/**
 * Log warning message
 * @param {string} message - Message to log
 */
function warn(message) {
  console.warn(`${new Date().toISOString()} - WARN - ${message}`);
}

module.exports = {
  setupLogging,
  info,
  debug,
  error,
  warn
};
