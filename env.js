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

function get(name) {
  const result = config[name]
  if (result == null) {
    throw new Error(`env variable '${name}' is not defined `)
  }
  return result
}

const webAppDir = path.join(process.cwd(), 'apps/web')
const distDir = path.join(process.cwd(), 'dist')
const nwDataDir = path.join(distDir, 'nw-data')
const gameDir = (isPtr) => (isPtr ? get('NW_GAME_PTR') : get('NW_GAME_LIVE'))
const extractDir = (isPtr) => (isPtr ? get('NW_DATA_PTR') : get('NW_DATA_LIVE'))
const importDir = (isPtr) => path.join(nwDataDir, isPtr ? 'ptr' : 'live')
const cdnPath = (isPtr) => (isPtr ? get('NW_CDN_PTR') : get('NW_CDN_LIVE'))
const publicPath = (isPtr) => path.relative(distDir, importDir(isPtr))

module.exports = {
  ...config,
  webAppDir,
  nwDataDir,
  distDir,
  gameDir,
  extractDir,
  importDir,
  cdnPath,
  publicPath,
}
