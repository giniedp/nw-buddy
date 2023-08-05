require('dotenv').config()

function cmd(cmd) {
  const shell = require('shelljs')
  const result = shell.exec(cmd, { silent: true })
  if (result.code !== 0) {
    throw new Error('[git-rev-sync] failed to execute command: ' + result.stdout)
  }
  return result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '')
}

// https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables

const branchName = process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || cmd('git branch --show-current')
const commitHash = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA
const path = require('path')
const config = {
  NW_GAME_LIVE: process.env.NW_GAME_LIVE,
  NW_GAME_PTR: process.env.NW_GAME_PTR,
  NW_CDN_PTR: process.env.NW_CDN_PTR,
  NW_CDN_LIVE: process.env.NW_CDN_LIVE,
  NW_UNPACK_LIVE: process.env.NW_UNPACK_LIVE,
  NW_UNPACK_PTR: process.env.NW_UNPACK_PTR,
  NW_USE_CDN: ['true', 'yes', '1'].includes(process.env.NW_USE_CDN),
  NW_USE_PTR: ['true', 'yes', '1'].includes(process.env.NW_USE_PTR ?? String(branchName === 'ptr')),
  BRANCH_NAME: branchName,
  CDN_UPLOAD_SPACE: process.env.CDN_UPLOAD_SPACE,
  CDN_UPLOAD_KEY: process.env.CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET: process.env.CDN_UPLOAD_SECRET,
  CDN_UPLOAD_ENDPOINT: process.env.CDN_UPLOAD_ENDPOINT,
  VERSION: require(path.resolve(process.cwd(), 'package.json')).version + (commitHash ? `#${commitHash}` : ''),
}

function get(name) {
  const result = config[name]
  if (result == null) {
    throw new Error(`env variable '${name}' is not defined `)
  }
  return result
}

const root = process.cwd()
const srcDir = (...paths) => path.join(root, 'apps', ...paths)
const dstDir = (...paths) => path.join(root, 'dist', ...paths)
const tmpDir = (...paths) => path.join(root, 'tmp', ...paths)

const nwData = {
  cwd: root,
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
    return path.resolve(root, get(isPtr ? 'NW_GAME_PTR' : 'NW_GAME_LIVE'))
  },
  /**
   * Live or PTR unpack directory where game assets are extracted to
   * @param {boolean} isPtr
   * @returns {string}
   */
  unpackDir: (isPtr) => {
    return path.resolve(root, get(isPtr ? 'NW_UNPACK_PTR' : 'NW_UNPACK_LIVE'))
  },
  /**
   * Live or PTR temporary directory where game assets are converted to
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
  publicUrl: (isPtr, isCdn, deployUrl) => {
    if (isCdn) {
      return nwData.cdnUrl(isPtr)
    }
    return (deployUrl || '') + nwData.assetPath(isPtr)
  },
}

module.exports = {
  ...config,
  nwData,
}
