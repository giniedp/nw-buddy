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
}

const webAppRoot = path.join(process.cwd(), 'apps/web')
const nwDataRoot = path.join(webAppRoot, 'nw-data')
const gameDir = (isPtr) => (isPtr ? config.NW_GAME_PTR : config.NW_GAME_LIVE)
const extractDir = (isPtr) => (isPtr ? config.NW_DATA_PTR : config.NW_DATA_LIVE)
const importDir = (isPtr) => path.join(nwDataRoot, isPtr ? 'ptr' : 'live')
const cdnPath = (isPtr) => (isPtr ? config.NW_CDN_PTR : config.NW_CDN_LIVE)
const publicPath = (isPtr) => path.relative(webAppRoot, importDir(isPtr))

module.exports = {
  ...config,
  webAppRoot,
  nwDataRoot,
  gameDir,
  extractDir,
  importDir,
  cdnPath,
  publicPath,
}
