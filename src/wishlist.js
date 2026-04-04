const https = require('https');
const { COUNTRIES } = require('./price');
const logger = require('./logger');

/**
 * Make HTTP GET request with headers
 * @param {string} url - URL to fetch
 * @param {Object} headers - Request headers
 * @returns {Promise<string>} - Response body
 */
function httpGetWithHeaders(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Fetch wishlist HTML for a specific user and country code
 * @param {string} username - GOG username
 * @param {string} countryCode - Country code
 * @returns {Promise<string|null>} - HTML content or null on error
 */
async function fetchWishlist(username, countryCode) {
  const url = `https://www.gog.com/u/${username}/wishlist`;
  const headers = {
    'Cookie': `gog_lc=${countryCode}_USD_en-US`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    return await httpGetWithHeaders(url, headers);
  } catch (error) {
    logger.error(`Error fetching wishlist for ${countryCode}: ${error}`);
    return null;
  }
}

/**
 * Extract gogData object from HTML content
 * @param {string} htmlContent - HTML content
 * @returns {Object|null} - Parsed gogData object
 */
function extractGogData(htmlContent) {
  try {
    const patterns = [
      /window\.gogData\s*=\s*(\{.*?\});\s*(?:window\.|var)/s,
      /var\s+gogData\s*=\s*(\{.*?\});/s,
      /<script>\s*var\s+gogData\s*=\s*(\{.*?\});\s*<\/script>/s,
      /<script>[^<]*window\.gogData\s*=\s*(\{.*?\});\s*<\/script>/s
    ];

    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        return JSON.parse(match[1]);
      }
    }

    logger.error('Could not find gogData in HTML');
    return null;
  } catch (error) {
    logger.error(`Error extracting gogData: ${error}`);
    return null;
  }
}

/**
 * Process wishlist for a single country
 * @param {string} username
 * @param {string} countryCode
 * @param {string} countryName
 * @returns {Promise<Array>} - Array of {productTitle, countryCode, countryName, price, currency}
 */
async function fetchWishlistForCountry(username, countryCode, countryName) {
  const html = await fetchWishlist(username, countryCode);
  if (!html) return [];

  const gogData = extractGogData(html);
  if (!gogData || !gogData.products) return [];

  const results = [];
  for (const product of gogData.products) {
    const productId = product.id;
    const productTitle = product.title;
    if (!productId || !productTitle) continue;

    const priceInfo = product.price;
    if (!priceInfo) continue;

    let amount = null;
    let currency = 'USD';

    if (typeof priceInfo === 'object') {
      amount = priceInfo.amount;
      const currInfo = priceInfo.currency;
      if (typeof currInfo === 'object') {
        currency = currInfo.code || 'USD';
      } else if (typeof currInfo === 'string') {
        currency = currInfo;
      }
    } else if (typeof priceInfo === 'string') {
      const parts = priceInfo.split(' ');
      if (parts.length >= 2) {
        amount = parts[0];
        currency = parts[1];
      }
    }

    if (amount === null) continue;

    results.push({ productTitle, countryCode, countryName, price: amount, currency });
  }
  return results;
}

/**
 * Process wishlist for all countries concurrently and find the best prices
 * @param {string} username - GOG username
 * @param {boolean} normalize - Normalize to USD (reserved for future use)
 * @returns {Promise<Object>} - Best prices by product
 */
async function processWishlist(username, normalize = false) {
  const entries = Object.entries(COUNTRIES);

  const allResults = await Promise.all(
    entries.map(([countryCode, countryName]) =>
      fetchWishlistForCountry(username, countryCode, countryName)
    )
  );

  const productPrices = {};
  for (const countryResults of allResults) {
    for (const { productTitle, countryCode, countryName, price, currency } of countryResults) {
      if (!(productTitle in productPrices)) {
        productPrices[productTitle] = {};
      }
      productPrices[productTitle][countryCode] = { countryCode, countryName, price, currency };
    }
  }

  const bestPrices = {};
  for (const [productName, countryPrices] of Object.entries(productPrices)) {
    let lowestPrice = null;
    let lowestCountry = null;

    for (const [code, priceData] of Object.entries(countryPrices)) {
      const price = parseFloat(priceData.price);
      if (isNaN(price)) continue;

      if (lowestPrice === null || price < lowestPrice) {
        lowestPrice = price;
        lowestCountry = code;
      }
    }

    if (lowestCountry) {
      bestPrices[productName] = countryPrices[lowestCountry];
    }
  }

  return bestPrices;
}

/**
 * Display the best prices for each product
 * @param {Object} bestPrices - Best prices by product
 * @param {boolean} pretty - Show as pretty table
 */
function displayBestPrices(bestPrices, pretty = false) {
  if (!bestPrices || Object.keys(bestPrices).length === 0) {
    console.log('No products found in wishlist or prices could not be determined.');
    return;
  }

  if (pretty) {
    let productWidth = 0;
    for (const product of Object.keys(bestPrices)) {
      if (product.length > productWidth) productWidth = product.length;
    }
    productWidth += 2;
    const priceWidth = 10;
    const currencyWidth = 8;

    const header = `${'Product'.padEnd(productWidth)}${'Price'.padEnd(priceWidth)}${'Currency'.padEnd(currencyWidth)}Country`;
    console.log(header);
    console.log('-'.repeat(header.length));

    for (const [product, priceData] of Object.entries(bestPrices)) {
      console.log(
        product.padEnd(productWidth) +
        String(priceData.price).padEnd(priceWidth) +
        String(priceData.currency).padEnd(currencyWidth) +
        priceData.countryName
      );
    }
  } else {
    for (const [product, priceData] of Object.entries(bestPrices)) {
      console.log(`${product} - ${priceData.price} ${priceData.currency} - ${priceData.countryName}`);
    }
  }
}

module.exports = {
  fetchWishlist,
  extractGogData,
  processWishlist,
  displayBestPrices
};
