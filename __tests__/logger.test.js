/**
 * Tests for logger utility
 */

const logger = require('../src/logger');

describe('Logger Module', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    error: console.error,
    warn: console.warn
  };

  beforeEach(() => {
    // Reset console mocks
    jest.clearAllMocks();
    console.log = jest.fn();
    console.debug = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    // Reset logger state by calling setupLogging
    logger.setupLogging(false);
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  describe('setupLogging', () => {
    test('should enable verbose mode when true', () => {
      logger.setupLogging(true);
      
      const testMessage = 'debug message';
      logger.debug(testMessage);
      
      expect(console.log).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    test('should disable verbose mode when false', () => {
      logger.setupLogging(false);
      
      const testMessage = 'debug message';
      logger.debug(testMessage);
      
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should disable verbose mode by default', () => {
      logger.setupLogging();
      
      const testMessage = 'debug message';
      logger.debug(testMessage);
      
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should override console.debug when verbose is false', () => {
      logger.setupLogging(false);
      
      // console.debug should be a no-op function
      expect(typeof console.debug).toBe('function');
      // Verify it's been replaced by calling it - should not call console.log
      console.debug('test');
      expect(console.log).not.toHaveBeenCalledWith('test');
    });

    test('should set console.debug to console.log when verbose is true', () => {
      logger.setupLogging(true);
      
      // console.debug should be aliased to console.log
      console.debug('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });
  });

  describe('info', () => {
    test('should log info message with timestamp and INFO level', () => {
      const message = 'Test info message';
      logger.info(message);
      
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should include ISO timestamp in info message', () => {
      const message = 'Test info message';
      logger.info(message);
      
      const callArg = console.log.mock.calls[0][0];
      // Check for ISO date format pattern (YYYY-MM-DDTHH:MM:SS.sssZ)
      expect(callArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should log multiple info messages', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      expect(console.log).toHaveBeenCalledTimes(3);
    });

    test('should handle empty message', () => {
      logger.info('');
      
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
    });

    test('should handle special characters in message', () => {
      const message = 'Test with special chars: @#$%^&*()';
      logger.info(message);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should handle unicode characters in message', () => {
      const message = 'Test unicode: 你好世界 🌍';
      logger.info(message);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should handle very long messages', () => {
      const message = 'A'.repeat(10000);
      logger.info(message);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });
  });

  describe('debug', () => {
    test('should log debug message when verbose mode is enabled', () => {
      logger.setupLogging(true);
      
      const message = 'Test debug message';
      logger.debug(message);
      
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should not log debug message when verbose mode is disabled', () => {
      logger.setupLogging(false);
      
      const message = 'Test debug message';
      logger.debug(message);
      
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should not log debug message by default', () => {
      const message = 'Test debug message';
      logger.debug(message);
      
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should include ISO timestamp in debug message', () => {
      logger.setupLogging(true);
      
      const message = 'Test debug message';
      logger.debug(message);
      
      const callArg = console.log.mock.calls[0][0];
      expect(callArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle empty debug message', () => {
      logger.setupLogging(true);
      
      logger.debug('');
      
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    test('should handle object messages', () => {
      logger.setupLogging(true);
      
      const obj = { key: 'value', number: 42 };
      logger.debug(JSON.stringify(obj));
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('key')
      );
    });
  });

  describe('error', () => {
    test('should log error message with timestamp and ERROR level', () => {
      const message = 'Test error message';
      logger.error(message);
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should include ISO timestamp in error message', () => {
      const message = 'Test error message';
      logger.error(message);
      
      const callArg = console.error.mock.calls[0][0];
      expect(callArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should always log errors regardless of verbose mode', () => {
      logger.setupLogging(false);
      
      const message = 'Test error message';
      logger.error(message);
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should log errors in verbose mode', () => {
      logger.setupLogging(true);
      
      const message = 'Test error message';
      logger.error(message);
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should log multiple error messages', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      logger.error('Error 3');
      
      expect(console.error).toHaveBeenCalledTimes(3);
    });

    test('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error(error.message);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    test('should handle empty error message', () => {
      logger.error('');
      
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('warn', () => {
    test('should log warning message with timestamp and WARN level', () => {
      const message = 'Test warning message';
      logger.warn(message);
      
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
    });

    test('should include ISO timestamp in warning message', () => {
      const message = 'Test warning message';
      logger.warn(message);
      
      const callArg = console.warn.mock.calls[0][0];
      expect(callArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should always log warnings regardless of verbose mode', () => {
      logger.setupLogging(false);
      
      const message = 'Test warning message';
      logger.warn(message);
      
      expect(console.warn).toHaveBeenCalled();
    });

    test('should log warnings in verbose mode', () => {
      logger.setupLogging(true);
      
      const message = 'Test warning message';
      logger.warn(message);
      
      expect(console.warn).toHaveBeenCalled();
    });

    test('should log multiple warning messages', () => {
      logger.warn('Warning 1');
      logger.warn('Warning 2');
      logger.warn('Warning 3');
      
      expect(console.warn).toHaveBeenCalledTimes(3);
    });

    test('should handle empty warning message', () => {
      logger.warn('');
      
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Logger State Management', () => {
    test('should toggle verbose mode correctly', () => {
      // Start with verbose disabled
      logger.setupLogging(false);
      logger.debug('Should not appear');
      expect(console.log).not.toHaveBeenCalled();
      
      // Enable verbose
      logger.setupLogging(true);
      logger.debug('Should appear');
      expect(console.log).toHaveBeenCalled();
      
      // Disable verbose again
      jest.clearAllMocks();
      logger.setupLogging(false);
      logger.debug('Should not appear again');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should maintain state between log calls', () => {
      logger.setupLogging(true);
      
      logger.debug('Message 1');
      logger.debug('Message 2');
      logger.debug('Message 3');
      
      expect(console.log).toHaveBeenCalledTimes(3);
    });

    test('should reset state when setupLogging is called', () => {
      logger.setupLogging(true);
      logger.debug('With verbose');
      expect(console.log).toHaveBeenCalledTimes(1);
      
      logger.setupLogging(false);
      jest.clearAllMocks();
      logger.debug('Without verbose');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Log Format', () => {
    test('should follow format: timestamp - LEVEL - message', () => {
      logger.info('Test message');
      
      const callArg = console.log.mock.calls[0][0];
      expect(callArg).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - INFO - /);
    });

    test('should have consistent format across all log levels', () => {
      logger.info('info');
      logger.debug('debug');
      logger.error('error');
      logger.warn('warn');
      
      const infoCall = console.log.mock.calls[0][0];
      const errorCall = console.error.mock.calls[0][0];
      const warnCall = console.warn.mock.calls[0][0];
      
      // All should have timestamp and level
      expect(infoCall).toMatch(/ - INFO - /);
      expect(errorCall).toMatch(/ - ERROR - /);
      expect(warnCall).toMatch(/ - WARN - /);
    });
  });

  describe('Module Exports', () => {
    test('should export setupLogging function', () => {
      expect(typeof logger.setupLogging).toBe('function');
    });

    test('should export info function', () => {
      expect(typeof logger.info).toBe('function');
    });

    test('should export debug function', () => {
      expect(typeof logger.debug).toBe('function');
    });

    test('should export error function', () => {
      expect(typeof logger.error).toBe('function');
    });

    test('should export warn function', () => {
      expect(typeof logger.warn).toBe('function');
    });
  });
});
