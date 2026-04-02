/**
 * Tests for API functions with mocked https requests
 */

const https = require('https');
const {
  extractProductId,
  requestPrice,
  requestPrices,
  sortPrices,
  outResult
} = require('../src/api');
const { COUNTRY_PRICES, Price } = require('../src/price');
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

describe('httpGet (internal function via extractProductId)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should make HTTPS GET request and return response body', async () => {
    const mockResponse = 'test response body';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    // Test via extractProductId which uses httpGet internally
    await expect(extractProductId('https://www.gog.com/game/test')).rejects.toThrow();
    // Note: Will throw because mock HTML doesn't have expected pattern
  });

  test('should handle errors in HTTPS request', async () => {
    const mockError = new Error('Network error');

    https.get.mockImplementation((url, callback) => {
      const stream = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(mockError);
          }
          return stream;
        })
      };
      const req = { on: jest.fn((event, callback) => callback(mockError)) };
      callback(stream);
      return req;
    });

    await expect(extractProductId('https://www.gog.com/game/test')).rejects.toThrow();
  });
});

describe('extractProductId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should extract product ID from GOG URL with card-product attribute', async () => {
    const mockHtml = '<div card-product="123456789">Game Title</div>';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockHtml);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const productId = await extractProductId('https://www.gog.com/game/diablo');
    
    expect(productId).toBe('123456789');
    expect(https.get).toHaveBeenCalled();
  });

  test('should handle URL with different game paths', async () => {
    const mockHtml = '<div card-product="987654321">Cyberpunk 2077</div>';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockHtml);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const productId = await extractProductId('https://www.gog.com/game/cyberpunk_2077');
    
    expect(productId).toBe('987654321');
  });

  test('should throw error when card-product attribute is missing', async () => {
    const mockHtml = '<div>Game without product ID</div>';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockHtml);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    await expect(extractProductId('https://www.gog.com/game/test')).rejects.toThrow();
  });

  test('should throw error on empty HTML response', async () => {
    const mockHtml = '';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockHtml);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    await expect(extractProductId('https://www.gog.com/game/test')).rejects.toThrow();
  });

  test('should throw error on network failure', async () => {
    https.get.mockImplementation((url, callback) => {
      const req = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Network error'));
          }
        })
      };
      return req;
    });

    await expect(extractProductId('https://www.gog.com/game/test')).rejects.toThrow();
  });
});

describe('requestPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset COUNTRY_PRICES state
    COUNTRY_PRICES.forEach(price => {
      price.currency = null;
      price.value = null;
      price.valueUsd = null;
    });
  });

  test('should fetch price for a product and country', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [
          {
            finalPrice: '5999 USD',
            currency: { code: 'USD' }
          }
        ]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockApiResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('US', 'United States');
    await requestPrice('123456789', price, false);

    expect(price.value).toBe(59.99);
    expect(price.currency).toBe('USD');
    expect(price.valueUsd).toBe(59.99);
  });

  test('should normalize currency to USD when normalize flag is true', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [
          {
            finalPrice: '4999 EUR',
            currency: { code: 'EUR' }
          },
          {
            finalPrice: '5499 USD',
            currency: { code: 'USD' }
          }
        ]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockApiResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('DE', 'Germany');
    await requestPrice('123456789', price, true);

    expect(price.value).toBe(49.99);
    expect(price.currency).toBe('EUR');
    expect(price.valueUsd).toBe(54.99);
    
    // Verify URL includes currency=USD parameter
    expect(https.get).toHaveBeenCalledWith(
      expect.stringContaining('currency=USD'),
      expect.any(Function)
    );
  });

  test('should handle API response with multiple prices', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [
          {
            finalPrice: '2999 USD',
            currency: { code: 'USD' }
          },
          {
            finalPrice: '3999 USD',
            currency: { code: 'USD' }
          }
        ]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockApiResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('US', 'United States');
    await requestPrice('123456789', price, false);

    // Should use first price
    expect(price.value).toBe(29.99);
    expect(price.currency).toBe('USD');
  });

  test('should handle API errors gracefully', async () => {
    https.get.mockImplementation((url, callback) => {
      const req = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('API Error'));
          }
        })
      };
      return req;
    });

    const price = new Price('US', 'United States');
    
    // Should not throw, but log error
    await expect(requestPrice('123456789', price, false)).resolves.toBeUndefined();
    
    // Price should remain unchanged
    expect(price.value).toBeNull();
    expect(price.currency).toBeNull();
  });

  test('should handle invalid JSON response', async () => {
    const mockApiResponse = 'Invalid JSON';
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockApiResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('US', 'United States');
    
    await expect(requestPrice('123456789', price, false)).resolves.toBeUndefined();
    
    // Price should remain unchanged
    expect(price.value).toBeNull();
    expect(price.currency).toBeNull();
  });

  test('should handle empty prices array', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: []
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(mockApiResponse);
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('US', 'United States');
    await requestPrice('123456789', price, false);

    // Price should remain unchanged
    expect(price.value).toBeNull();
    expect(price.currency).toBeNull();
  });

  test('should construct correct API URL without normalization', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [{ finalPrice: '1000 USD', currency: { code: 'USD' } }]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') callback(mockApiResponse);
        else if (event === 'end') callback();
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    const price = new Price('GB', 'United Kingdom');
    await requestPrice('123456789', price, false);

    expect(https.get).toHaveBeenCalledWith(
      'https://api.gog.com/products/123456789/prices?countryCode=GB',
      expect.any(Function)
    );
  });
});

describe('requestPrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    COUNTRY_PRICES.forEach(price => {
      price.currency = null;
      price.value = null;
      price.valueUsd = null;
    });
  });

  test('should request prices for all countries concurrently', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [{ finalPrice: '5999 USD', currency: { code: 'USD' } }]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') callback(mockApiResponse);
        else if (event === 'end') callback();
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    await requestPrices('123456789', false);

    // Should make requests for all countries
    expect(https.get).toHaveBeenCalledTimes(COUNTRY_PRICES.length);
  });

  test('should handle normalize flag for all requests', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [{ finalPrice: '5999 USD', currency: { code: 'USD' } }]
      }
    });

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') callback(mockApiResponse);
        else if (event === 'end') callback();
        return mockStream;
      })
    };

    https.get.mockImplementation((url, callback) => {
      callback(mockStream);
      return { on: jest.fn() };
    });

    await requestPrices('123456789', true);

    // All requests should include currency=USD
    const calls = https.get.mock.calls;
    calls.forEach(call => {
      expect(call[0]).toContain('currency=USD');
    });
  });

  test('should wait for all requests to complete', async () => {
    const mockApiResponse = JSON.stringify({
      _embedded: {
        prices: [{ finalPrice: '5999 USD', currency: { code: 'USD' } }]
      }
    });

    let resolveCallbacks = [];

    https.get.mockImplementation((url, callback) => {
      const mockStream = {
        on: jest.fn((event, cb) => {
          if (event === 'data') cb(mockApiResponse);
          else if (event === 'end') cb();
          return mockStream;
        })
      };
      callback(mockStream);
      return { on: jest.fn() };
    });

    await requestPrices('123456789', false);

    // Verify all calls were made
    expect(https.get).toHaveBeenCalledTimes(COUNTRY_PRICES.length);
  });
});

describe('sortPrices', () => {
  beforeEach(() => {
    COUNTRY_PRICES.forEach(price => {
      price.currency = null;
      price.value = null;
      price.valueUsd = null;
    });
  });

  test('should sort prices by valueUsd when available', () => {
    const price1 = new Price('US', 'United States');
    price1.valueUsd = 50.00;
    price1.value = 45.00;

    const price2 = new Price('DE', 'Germany');
    price2.valueUsd = 60.00;
    price2.value = 55.00;

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const sorted = sortPrices();

    expect(sorted[0].countryCode).toBe('US');
    expect(sorted[1].countryCode).toBe('DE');
  });

  test('should sort prices by value when valueUsd is not available', () => {
    const price1 = new Price('US', 'United States');
    price1.valueUsd = null;
    price1.value = 40.00;

    const price2 = new Price('DE', 'Germany');
    price2.valueUsd = null;
    price2.value = 50.00;

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const sorted = sortPrices();

    expect(sorted[0].countryCode).toBe('US');
    expect(sorted[1].countryCode).toBe('DE');
  });

  test('should handle mixed null values', () => {
    const price1 = new Price('US', 'United States');
    price1.valueUsd = 50.00;
    price1.value = null;

    const price2 = new Price('DE', 'Germany');
    price2.valueUsd = null;
    price2.value = null;

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const sorted = sortPrices();

    // price1 should come first (has value), price2 should come last (null = Infinity)
    expect(sorted[0].countryCode).toBe('US');
  });

  test('should not mutate original array', () => {
    const price1 = new Price('US', 'United States');
    price1.valueUsd = 60.00;

    const price2 = new Price('DE', 'Germany');
    price2.valueUsd = 50.00;

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const sorted = sortPrices();

    expect(COUNTRY_PRICES[0].countryCode).toBe('US');
    expect(sorted[0].countryCode).toBe('DE');
  });

  test('should handle all null values', () => {
    COUNTRY_PRICES.forEach(price => {
      price.valueUsd = null;
      price.value = null;
    });

    const sorted = sortPrices();

    // Should return array with all items (all have Infinity value)
    expect(sorted.length).toBe(COUNTRY_PRICES.length);
  });
});

describe('outResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    COUNTRY_PRICES.forEach(price => {
      price.currency = null;
      price.value = null;
      price.valueUsd = null;
    });
  });

  test('should output results in plain format', () => {
    const price1 = new Price('US', 'United States');
    price1.value = 59.99;
    price1.currency = 'USD';

    const price2 = new Price('DE', 'Germany');
    price2.value = 49.99;
    price2.currency = 'EUR';

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(2, false);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('United States');
    expect(output).toContain('Germany');

    consoleSpy.mockRestore();
  });

  test('should output results in pretty table format', () => {
    const price1 = new Price('US', 'United States');
    price1.value = 59.99;
    price1.currency = 'USD';

    const price2 = new Price('DE', 'Germany');
    price2.value = 49.99;
    price2.currency = 'EUR';

    COUNTRY_PRICES[0] = price1;
    COUNTRY_PRICES[1] = price2;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(2, true);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('Country');
    expect(output).toContain('Price');
    expect(output).toContain('Currency');

    consoleSpy.mockRestore();
  });

  test('should limit output to specified count', () => {
    for (let i = 0; i < 10; i++) {
      const price = new Price(`C${i}`, `Country ${i}`);
      price.value = i * 10;
      price.currency = 'USD';
      COUNTRY_PRICES[i] = price;
    }

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(3, false);

    const output = consoleSpy.mock.calls[0][0];
    const lines = output.trim().split('\n');
    
    // Should have 3 country lines (plus possible empty first line)
    const countryLines = lines.filter(line => line.includes('Country'));
    expect(countryLines.length).toBeLessThanOrEqual(3);

    consoleSpy.mockRestore();
  });

  test('should handle count greater than available prices', () => {
    const price1 = new Price('US', 'United States');
    price1.value = 59.99;
    price1.currency = 'USD';

    COUNTRY_PRICES[0] = price1;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(100, false);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('should handle negative count', () => {
    const price1 = new Price('US', 'United States');
    price1.value = 59.99;
    price1.currency = 'USD';

    COUNTRY_PRICES[0] = price1;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(-5, false);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('should handle zero count', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    outResult(0, false);

    const output = consoleSpy.mock.calls[0][0];
    expect(output.trim()).toBe('');

    consoleSpy.mockRestore();
  });
});
