const https = require('https');
const fs = require('fs');
const path = require('path');
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
    const options = {
      headers: headers
    };
    https.get(url, options, (res) => {
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
 * @returns {Promise<{html: string, tempFile: string|null}>}
 */
async function fetchWishlist(username, countryCode) {
  const url = `https://www.gog.com/u/${username}/wishlist`;
  const headers = {
    'Cookie': `gog_lc=${countryCode}_USD_en-US`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  try {
    const htmlContent = await httpGetWithHeaders(url, headers);
    
    // Create temp file
    const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gog-wishlist-'));
    const tempFilename = path.join(tempDir, `wishlist-${username}-${countryCode}.html`);
    fs.writeFileSync(tempFilename, htmlContent);
    
    logger.info(`Wishlist for ${username} with country code ${countryCode} saved to ${tempFilename}`);
    return { html: htmlContent, tempFile: tempFilename };
  } catch (error) {
    logger.error(`Error fetching wishlist: ${error}`);
    return { html: null, tempFile: null };
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
        const gogDataStr = match[1];
        const gogData = JSON.parse(gogDataStr);
        return gogData;
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
 * Process wishlist for all countries and find the best prices
 * @param {string} username - GOG username
 * @param {boolean} normalize - Normalize to USD
 * @returns {Promise<Object>} - Best prices by product
 */
async function processWishlist(username, normalize = false) {
  const productPrices = {};

  for (const [countryCode, countryName] of Object.entries(COUNTRIES)) {
    logger.info(`Processing country: ${countryName} (${countryCode})`);

    const { html, tempFile } = await fetchWishlist(username, countryCode);
    if (!html) {
      continue;
    }

    const gogData = extractGogData(html);
    if (!gogData || !gogData.products) {
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      if (tempFile) {
        const tempDir = path.dirname(tempFile);
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      }
      continue;
    }

    for (const product of gogData.products) {
      const productId = product.id;
      const productTitle = product.title;

      if (!productId || !productTitle) {
        continue;
      }

      const priceInfo = product.price;
      if (!priceInfo) {
        continue;
      }

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
          try {
            amount = parts[0];
            currency = parts[1];
          } catch (e) {
            logger.warn(`Could not parse price string: ${priceInfo}`);
            continue;
          }
        }
      }

      if (amount === null) {
        continue;
      }

      if (!(productTitle in productPrices)) {
        productPrices[productTitle] = {};
      }

      productPrices[productTitle][countryCode] = {
        countryCode,
        countryName,
        price: amount,
        currency
      };
    }

    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (tempFile) {
      const tempDir = path.dirname(tempFile);
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    }
  }

  const bestPrices = {};
  for (const [productName, countryPrices] of Object.entries(productPrices)) {
    if (Object.keys(countryPrices).length === 0) {
      continue;
    }

    let lowestPrice = null;
    let lowestCountry = null;

    for (const [code, priceData] of Object.entries(countryPrices)) {
      const price = parseFloat(priceData.price);
      if (isNaN(price)) {
        continue;
      }

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
      if (product.length > productWidth) {
        productWidth = product.length;
      }
    }
    productWidth += 2;
    const priceWidth = 10;
    const currencyWidth = 8;

    const header = `Product`.padEnd(productWidth) + `Price`.padEnd(priceWidth) + `Currency`.padEnd(currencyWidth) + 'Country';
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
