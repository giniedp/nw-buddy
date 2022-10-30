require('dotenv').config()
const path = require('path')
const config = {
  NW_GAME_LIVE: process.env.NW_GAME_LIVE,
  NW_GAME_PTR: process.env.NW_GAME_PTR,
  NW_DATA_LIVE: process.env.NW_DATA_LIVE,
  NW_DATA_PTR: process.env.NW_DATA_PTR,
  NW_CDN_PTR: process.env.NW_CDN_PTR,
  NW_CDN_LIVE: process.env.NW_CDN_LIVE,
  NW_USE_CDN: ['true', 'yes', '1'].includes(process.env.NW_USE_CDN),
  NW_USE_PTR: ['true', 'yes', '1'].includes(process.env.NW_USE_PTR),
  CDN_UPLOAD_SPACE: process.env.CDN_UPLOAD_SPACE,
  CDN_UPLOAD_KEY: process.env.CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET: process.env.CDN_UPLOAD_SECRET,
  CDN_UPLOAD_ENDPOINT: process.env.CDN_UPLOAD_ENDPOINT,
  VERSION: require('./package.json').version,
}

function get(name) {
  const result = config[name]
  if (result == null) {
    throw new Error(`env variable '${name}' is not defined `)
  }
  return result
}

const root = __dirname
const srcDir = (...paths) => path.join(root, 'apps', ...paths)
const dstDir = (...paths) => path.join(root, 'dist', ...paths)
const tmpDir = (...paths) => path.join(root, 'tmp', ...paths)
const web = {
  src: (...paths) => srcDir('web', ...paths),
  dist: (...paths) => dstDir('web', ...paths),
}
const nwData = {
  /**
   * Temporary directory where game assets are extracted to
   * @param {string[]} paths
   * @returns {string}
   */
  tmp: (...paths) => {
    return tmpDir('nw-data', ...paths)
  },
  /**
   * Directory where game assets are imported to
   * @param {string[]} paths
   * @returns {string}
   */
  dist: (...paths) => {
    return dstDir('nw-data', ...paths)
  },
  /**
   * Live or PTR game client directory
   * @param {boolean} isPtr
   * @returns {string}
   */
  srcDir: (isPtr) => {
    return get(isPtr ? 'NW_GAME_PTR' : 'NW_GAME_LIVE')
  },
  /**
   * Live or PTR temporary directory where game assets are extracted to
   * @param {boolean} isPtr
   * @returns {string}
   */
  tmpDir: (isPtr) => {
    return nwData.tmp(isPtr ? 'ptr' : 'live')
  },
  /**
   * Live or PTR directory where game assets are imported to
   * @param {boolean} isPtr
   * @returns {string}
   */
  distDir: (isPtr) => {
    return nwData.dist(isPtr ? 'ptr' : 'live')
  },
  /**
   * Live or PTR directory relative from outside the dist directory.
   * @param {boolean} isPtr
   * @param {string[]} paths
   * @returns {string}
   */
  assetPath: (isPtr, ...paths) => {
    return path.relative(nwData.dist('..'), nwData.dist(isPtr ? 'ptr' : 'live'), ...paths)
  },
  /**
   * Live or PTR CDN directory
   * @param {boolean} isPtr
   * @returns {string}
   */
  cdnUrl: (isPtr) => {
    return get(isPtr ? 'NW_CDN_PTR' : 'NW_CDN_LIVE')
  },
  /**
   * Base url from where the assets will be serverd. Is either the `assetPath` or `cdnUrl`.
   * @param {boolean} isPtr
   * @param {boolean} isCdn
   * @returns {string}
   */
  publicUrl: (isPtr, isCdn) => {
    return isCdn ? nwData.cdnUrl(isPtr) : nwData.assetPath(isPtr)
  }
}

module.exports = {
  ...config,
  web,
  nwData,
}
