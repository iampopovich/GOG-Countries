const https = require('https');
const { COUNTRY_PRICES } = require('./price');
const logger = require('./logger');

/**
 * Make HTTP GET request and return response body
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} - Response body
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Extract product ID from a GOG game URL
 * @param {string} url - GOG game URL
 * @returns {Promise<string>} - Product ID
 */
async function extractProductId(url) {
  const html = await httpGet(url);
  const cardMatch = html.match(/card-product="\d*"/);
  if (!cardMatch) throw new Error('Could not find product ID on page. Check the URL.');
  const rawCardProduct = cardMatch[0];
  const idMatch = rawCardProduct.match(/(\d+)/);
  if (!idMatch) throw new Error('Could not parse product ID from page.');
  const productId = idMatch[0];
  logger.debug(`raw product id: ${rawCardProduct}`);
  logger.debug(`product id: ${productId}`);
  return productId;
}

/**
 * Request price for a specific product and country
 * @param {string} productId - Product ID
 * @param {Object} price - Price object
 * @param {boolean} normalize - Normalize to USD
 * @returns {Promise<void>}
 */
async function requestPrice(productId, price, normalize = false) {
  let url = `https://api.gog.com/products/${productId}/prices?countryCode=${price.countryCode}`;
  if (normalize) {
    url += '&currency=USD';
  }
  
  try {
    logger.debug(url);
    const response = await httpGet(url);
    const data = JSON.parse(response);
    logger.debug(data);
    
    for (let i = 0; i < data._embedded.prices.length; i++) {
      const item = data._embedded.prices[i];
      if (i === 0) {
        const finalPrice = item.finalPrice.split(' ');
        price.value = parseFloat(finalPrice[0]) / 100;
        price.currency = finalPrice[1];
      }
      if (item.currency.code === 'USD') {
        price.valueUsd = parseFloat(item.finalPrice.split(' ')[0]) / 100;
      }
    }
    logger.debug(price);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Request prices for all countries concurrently
 * @param {string} productId - Product ID
 * @param {boolean} normalize - Normalize to USD
 * @returns {Promise<void>}
 */
async function requestPrices(productId, normalize = false) {
  const promises = COUNTRY_PRICES.map(price => 
    requestPrice(productId, price, normalize)
  );
  await Promise.all(promises);
}

/**
 * Sort prices by value (USD if normalized)
 * @returns {Array} - Sorted array of prices
 */
function sortPrices() {
  return [...COUNTRY_PRICES].sort((a, b) => {
    const aVal = a.valueUsd !== null ? a.valueUsd : (a.value !== null ? a.value : Infinity);
    const bVal = b.valueUsd !== null ? b.valueUsd : (b.value !== null ? b.value : Infinity);
    return aVal - bVal;
  });
}

/**
 * Output the results in the specified format
 * @param {number} count - Number of countries to show
 * @param {boolean} pretty - Show as pretty table
 */
function outResult(count, pretty = false) {
  const sortedPrices = sortPrices();
  count = Math.min(Math.abs(count), sortedPrices.length);
  let outString = '';
  
  if (pretty) {
    const shiftCountry = 25;
    const shiftPrice = 10;
    const header = `{'Country'.padEnd(shiftCountry)} {'Price'.padEnd(shiftPrice)} {'Currency'}\n`;
    outString += header;
    outString += '-'.repeat(header.length - 1);
    for (let i = 0; i < count; i++) {
      const price = sortedPrices[i];
      outString += `\n${price.countryName.padEnd(shiftCountry)} ${String(price.value).padEnd(shiftPrice)} ${price.currency}`;
    }
  } else {
    for (let i = 0; i < count; i++) {
      const price = sortedPrices[i];
      outString += `\n${price.countryName}: ${price.value} ${price.currency}`;
    }
  }
  console.log(outString);
}

module.exports = {
  extractProductId,
  requestPrice,
  requestPrices,
  sortPrices,
  outResult
};
