/**
 * Tests for Price class and COUNTRIES constant
 */

const { Price, COUNTRIES, COUNTRY_PRICES } = require('../src/price');

describe('Price Class', () => {
  describe('constructor', () => {
    test('should create Price instance with countryCode and countryName', () => {
      const price = new Price('US', 'United States');
      
      expect(price.countryCode).toBe('US');
      expect(price.countryName).toBe('United States');
      expect(price.currency).toBeNull();
      expect(price.value).toBeNull();
      expect(price.valueUsd).toBeNull();
    });

    test('should initialize currency, value, and valueUsd to null', () => {
      const price = new Price('DE', 'Germany');
      
      expect(price.currency).toBeNull();
      expect(price.value).toBeNull();
      expect(price.valueUsd).toBeNull();
    });

    test('should handle empty string countryCode', () => {
      const price = new Price('', 'Unknown');
      
      expect(price.countryCode).toBe('');
      expect(price.countryName).toBe('Unknown');
    });

    test('should handle empty string countryName', () => {
      const price = new Price('XX', '');
      
      expect(price.countryCode).toBe('XX');
      expect(price.countryName).toBe('');
    });
  });

  describe('property assignment', () => {
    test('should allow setting currency property', () => {
      const price = new Price('US', 'United States');
      price.currency = 'USD';
      
      expect(price.currency).toBe('USD');
    });

    test('should allow setting value property', () => {
      const price = new Price('US', 'United States');
      price.value = 59.99;
      
      expect(price.value).toBe(59.99);
    });

    test('should allow setting valueUsd property', () => {
      const price = new Price('US', 'United States');
      price.valueUsd = 59.99;
      
      expect(price.valueUsd).toBe(59.99);
    });

    test('should allow setting all properties at once', () => {
      const price = new Price('DE', 'Germany');
      price.currency = 'EUR';
      price.value = 49.99;
      price.valueUsd = 54.99;
      
      expect(price.currency).toBe('EUR');
      expect(price.value).toBe(49.99);
      expect(price.valueUsd).toBe(54.99);
    });
  });
});

describe('COUNTRIES Constant', () => {
  test('should be an object', () => {
    expect(typeof COUNTRIES).toBe('object');
    expect(COUNTRIES).not.toBeNull();
  });

  test('should contain expected country codes', () => {
    expect(COUNTRIES.US).toBe('United States');
    expect(COUNTRIES.GB).toBe('United Kingdom');
    expect(COUNTRIES.DE).toBe('Germany');
    expect(COUNTRIES.FR).toBe('France');
    expect(COUNTRIES.JP).toBeUndefined(); // Japan not in list
  });

  test('should have country codes as keys', () => {
    const keys = Object.keys(COUNTRIES);
    
    expect(keys).toContain('US');
    expect(keys).toContain('GB');
    expect(keys).toContain('DE');
    expect(keys).toContain('AU');
  });

  test('should have country names as values', () => {
    const values = Object.values(COUNTRIES);
    
    expect(values).toContain('United States');
    expect(values).toContain('United Kingdom');
    expect(values).toContain('Germany');
  });

  test('should have two-letter country codes', () => {
    const keys = Object.keys(COUNTRIES);
    
    keys.forEach(code => {
      expect(code).toHaveLength(2);
      expect(code).toMatch(/^[A-Z]{2}$/);
    });
  });

  test('should have non-empty country names', () => {
    const values = Object.values(COUNTRIES);
    
    values.forEach(name => {
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });

  test('should contain all major regions', () => {
    // North America
    expect(COUNTRIES.US).toBeDefined();
    expect(COUNTRIES.CA).toBeDefined();
    expect(COUNTRIES.MX).toBeDefined();
    
    // Europe
    expect(COUNTRIES.GB).toBeDefined();
    expect(COUNTRIES.DE).toBeDefined();
    expect(COUNTRIES.FR).toBeDefined();
    
    // Asia Pacific
    expect(COUNTRIES.AU).toBeDefined();
    expect(COUNTRIES.JP).toBeUndefined(); // Not in list
    expect(COUNTRIES.SG).toBeDefined();
    
    // South America
    expect(COUNTRIES.BR).toBeDefined();
    expect(COUNTRIES.AR).toBeDefined();
    
    // Middle East
    expect(COUNTRIES.AE).toBeDefined();
    expect(COUNTRIES.SA).toBeDefined();
    
    // Africa
    expect(COUNTRIES.ZA).toBeDefined();
    expect(COUNTRIES.NG).toBeDefined();
  });

  test('should have correct count of countries', () => {
    const countryCount = Object.keys(COUNTRIES).length;
    
    // Verify we have a substantial number of countries
    expect(countryCount).toBeGreaterThan(50);
  });
});

describe('COUNTRY_PRICES Constant', () => {
  test('should be an array', () => {
    expect(Array.isArray(COUNTRY_PRICES)).toBe(true);
  });

  test('should contain Price instances', () => {
    COUNTRY_PRICES.forEach(price => {
      expect(price).toBeInstanceOf(Price);
    });
  });

  test('should have same length as COUNTRIES', () => {
    expect(COUNTRY_PRICES.length).toBe(Object.keys(COUNTRIES).length);
  });

  test('should have Price instances with correct properties', () => {
    const usPrice = COUNTRY_PRICES.find(p => p.countryCode === 'US');
    
    expect(usPrice).toBeDefined();
    expect(usPrice.countryCode).toBe('US');
    expect(usPrice.countryName).toBe('United States');
    expect(usPrice.currency).toBeNull();
    expect(usPrice.value).toBeNull();
    expect(usPrice.valueUsd).toBeNull();
  });

  test('should have unique country codes', () => {
    const codes = COUNTRY_PRICES.map(p => p.countryCode);
    const uniqueCodes = [...new Set(codes)];
    
    expect(codes.length).toBe(uniqueCodes.length);
  });

  test('should have unique country names', () => {
    const names = COUNTRY_PRICES.map(p => p.countryName);
    const uniqueNames = [...new Set(names)];
    
    expect(names.length).toBe(uniqueNames.length);
  });

  test('should cover all countries from COUNTRIES', () => {
    const countryCodes = Object.keys(COUNTRIES);
    const priceCodes = COUNTRY_PRICES.map(p => p.countryCode);
    
    countryCodes.forEach(code => {
      expect(priceCodes).toContain(code);
    });
  });
});

describe('Price Class - Edge Cases', () => {
  test('should handle special characters in countryName', () => {
    const price = new Price('HK', 'Hong Kong SAR China');
    
    expect(price.countryName).toBe('Hong Kong SAR China');
  });

  test('should handle spaces in countryName', () => {
    const price = new Price('BA', 'Bosnia and Herzegovina');
    
    expect(price.countryName).toBe('Bosnia and Herzegovina');
  });

  test('should allow null assignment to properties', () => {
    const price = new Price('US', 'United States');
    price.currency = null;
    price.value = null;
    price.valueUsd = null;
    
    expect(price.currency).toBeNull();
    expect(price.value).toBeNull();
    expect(price.valueUsd).toBeNull();
  });

  test('should allow undefined assignment to properties', () => {
    const price = new Price('US', 'United States');
    price.currency = undefined;
    price.value = undefined;
    price.valueUsd = undefined;
    
    expect(price.currency).toBeUndefined();
    expect(price.value).toBeUndefined();
    expect(price.valueUsd).toBeUndefined();
  });

  test('should handle decimal values', () => {
    const price = new Price('US', 'United States');
    price.value = 59.99;
    price.valueUsd = 59.99;
    
    expect(price.value).toBe(59.99);
    expect(price.valueUsd).toBe(59.99);
  });

  test('should handle zero values', () => {
    const price = new Price('US', 'United States');
    price.value = 0;
    price.valueUsd = 0;
    
    expect(price.value).toBe(0);
    expect(price.valueUsd).toBe(0);
  });

  test('should handle negative values', () => {
    const price = new Price('US', 'United States');
    price.value = -10.00;
    price.valueUsd = -10.00;
    
    expect(price.value).toBe(-10.00);
    expect(price.valueUsd).toBe(-10.00);
  });
});
