const https = require('https');
const logger = require('./logger');

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const NPM_DOWNLOADS_URL = 'https://api.npmjs.org/downloads';

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
 * Fetch download statistics for an npm package over a given period
 * @param {string} packageName - npm package name (e.g. "@scope/package" or "package")
 * @param {string} period - Period string like "last-week", "last-month", "last-year"
 * @returns {Promise<Object|null>} - Download stats object or null on error
 */
async function fetchNpmDownloads(packageName, period = 'last-month') {
  const encoded = encodeURIComponent(packageName);
  const url = `${NPM_DOWNLOADS_URL}/point/${period}/${encoded}`;
  logger.debug(`Fetching npm downloads: ${url}`);
  try {
    const response = await httpGet(url);
    const data = JSON.parse(response);
    if (data.error) {
      logger.error(`npm downloads API error: ${data.error}`);
      return null;
    }
    return data;
  } catch (error) {
    logger.error(`Failed to fetch npm downloads for ${packageName}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch package metadata from the npm registry
 * @param {string} packageName - npm package name
 * @returns {Promise<Object|null>} - Package metadata or null on error
 */
async function fetchNpmPackageInfo(packageName) {
  const encoded = encodeURIComponent(packageName);
  const url = `${NPM_REGISTRY_URL}/${encoded}`;
  logger.debug(`Fetching npm package info: ${url}`);
  try {
    const response = await httpGet(url);
    const data = JSON.parse(response);
    if (data.error) {
      logger.error(`npm registry API error: ${data.error}`);
      return null;
    }
    return data;
  } catch (error) {
    logger.error(`Failed to fetch npm package info for ${packageName}: ${error.message}`);
    return null;
  }
}

/**
 * Build a summary of NPM activity statistics from registry and download data
 * @param {string} packageName - npm package name
 * @returns {Promise<Object|null>} - Stats summary or null on error
 */
async function getNpmStats(packageName) {
  logger.info(`Collecting npm statistics for: ${packageName}`);

  const [infoData, weekStats, monthStats, yearStats] = await Promise.all([
    fetchNpmPackageInfo(packageName),
    fetchNpmDownloads(packageName, 'last-week'),
    fetchNpmDownloads(packageName, 'last-month'),
    fetchNpmDownloads(packageName, 'last-year')
  ]);

  if (!infoData) {
    return null;
  }

  const latestVersion = infoData['dist-tags'] && infoData['dist-tags'].latest;
  const latestInfo = latestVersion && infoData.versions && infoData.versions[latestVersion];

  const versions = Object.keys(infoData.versions || {});
  const timeMap = infoData.time || {};
  const latestPublished = latestVersion && timeMap[latestVersion]
    ? new Date(timeMap[latestVersion]).toISOString().slice(0, 10)
    : 'unknown';
  const created = timeMap.created
    ? new Date(timeMap.created).toISOString().slice(0, 10)
    : 'unknown';
  const modified = timeMap.modified
    ? new Date(timeMap.modified).toISOString().slice(0, 10)
    : 'unknown';

  const dependencies = latestInfo && latestInfo.dependencies
    ? Object.keys(latestInfo.dependencies)
    : [];
  const devDependencies = latestInfo && latestInfo.devDependencies
    ? Object.keys(latestInfo.devDependencies)
    : [];

  return {
    name: infoData.name || packageName,
    description: infoData.description || '',
    latestVersion: latestVersion || 'unknown',
    totalVersions: versions.length,
    latestPublished,
    created,
    modified,
    license: (latestInfo && latestInfo.license) || infoData.license || 'unknown',
    author: (latestInfo && latestInfo.author && latestInfo.author.name)
      || (infoData.author && infoData.author.name)
      || 'unknown',
    homepage: (latestInfo && latestInfo.homepage) || infoData.homepage || '',
    dependencies,
    devDependencies,
    downloadsLastWeek: weekStats ? weekStats.downloads : null,
    downloadsLastMonth: monthStats ? monthStats.downloads : null,
    downloadsLastYear: yearStats ? yearStats.downloads : null,
    versions: versions.slice(-5).reverse()
  };
}

/**
 * Display NPM package statistics
 * @param {string} packageName - npm package name
 * @param {boolean} pretty - Show as formatted table
 * @returns {Promise<void>}
 */
async function displayNpmStats(packageName, pretty = false) {
  const stats = await getNpmStats(packageName);

  if (!stats) {
    console.log(`\nCould not retrieve stats for package: ${packageName}\n`);
    return;
  }

  if (pretty) {
    const sep = '─'.repeat(60);
    console.log(`\n\x1b[1m\x1b[36m NPM Statistics: ${stats.name}\x1b[0m`);
    console.log(sep);

    console.log('\x1b[1mPackage Info\x1b[0m');
    if (stats.description) console.log(`  Description    : ${stats.description}`);
    console.log(`  Latest Version : ${stats.latestVersion}`);
    console.log(`  Total Releases : ${stats.totalVersions}`);
    console.log(`  Latest Release : ${stats.latestPublished}`);
    console.log(`  Created        : ${stats.created}`);
    console.log(`  Last Modified  : ${stats.modified}`);
    console.log(`  License        : ${stats.license}`);
    if (stats.author !== 'unknown') console.log(`  Author         : ${stats.author}`);
    if (stats.homepage) console.log(`  Homepage       : ${stats.homepage}`);

    console.log(`\n\x1b[1mDownload Statistics\x1b[0m`);
    const pad = 14;
    console.log(`  ${'Last Week'.padEnd(pad)}: ${stats.downloadsLastWeek !== null ? stats.downloadsLastWeek.toLocaleString() : 'N/A'}`);
    console.log(`  ${'Last Month'.padEnd(pad)}: ${stats.downloadsLastMonth !== null ? stats.downloadsLastMonth.toLocaleString() : 'N/A'}`);
    console.log(`  ${'Last Year'.padEnd(pad)}: ${stats.downloadsLastYear !== null ? stats.downloadsLastYear.toLocaleString() : 'N/A'}`);

    if (stats.versions.length > 0) {
      console.log(`\n\x1b[1mRecent Versions\x1b[0m`);
      stats.versions.forEach(v => {
        const releaseDate = stats.modified ? '' : '';
        console.log(`  • ${v}${releaseDate}`);
      });
    }

    if (stats.dependencies.length > 0) {
      console.log(`\n\x1b[1mDependencies (${stats.dependencies.length})\x1b[0m`);
      stats.dependencies.forEach(dep => console.log(`  • ${dep}`));
    } else {
      console.log(`\n\x1b[1mDependencies\x1b[0m`);
      console.log('  None');
    }

    if (stats.devDependencies.length > 0) {
      console.log(`\n\x1b[1mDev Dependencies (${stats.devDependencies.length})\x1b[0m`);
      stats.devDependencies.forEach(dep => console.log(`  • ${dep}`));
    }

    console.log(sep);
    console.log();
  } else {
    console.log(`\nNPM Statistics: ${stats.name}`);
    if (stats.description) console.log(`Description: ${stats.description}`);
    console.log(`Latest Version: ${stats.latestVersion}`);
    console.log(`Total Releases: ${stats.totalVersions}`);
    console.log(`Latest Release: ${stats.latestPublished}`);
    console.log(`Created: ${stats.created}`);
    console.log(`Last Modified: ${stats.modified}`);
    console.log(`License: ${stats.license}`);
    if (stats.author !== 'unknown') console.log(`Author: ${stats.author}`);
    if (stats.homepage) console.log(`Homepage: ${stats.homepage}`);
    console.log(`Downloads (last week): ${stats.downloadsLastWeek !== null ? stats.downloadsLastWeek.toLocaleString() : 'N/A'}`);
    console.log(`Downloads (last month): ${stats.downloadsLastMonth !== null ? stats.downloadsLastMonth.toLocaleString() : 'N/A'}`);
    console.log(`Downloads (last year): ${stats.downloadsLastYear !== null ? stats.downloadsLastYear.toLocaleString() : 'N/A'}`);
    if (stats.versions.length > 0) {
      console.log(`Recent Versions: ${stats.versions.join(', ')}`);
    }
    if (stats.dependencies.length > 0) {
      console.log(`Dependencies: ${stats.dependencies.join(', ')}`);
    }
    if (stats.devDependencies.length > 0) {
      console.log(`Dev Dependencies: ${stats.devDependencies.join(', ')}`);
    }
    console.log();
  }
}

module.exports = {
  fetchNpmDownloads,
  fetchNpmPackageInfo,
  getNpmStats,
  displayNpmStats
};
