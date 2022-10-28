require('dotenv').config()
const path = require('path')
const config = {
  NW_GAME_LIVE: process.env.NW_GAME_LIVE,
  NW_GAME_PTR: process.env.NW_GAME_PTR,
  NW_DATA_LIVE: process.env.NW_DATA_LIVE,
  NW_DATA_PTR: process.env.NW_DATA_PTR,
  NW_PTR: ['true', 'yes', '1'].includes(process.env.NW_PTR),
  CDN_SPACE: process.env.CDN_SPACE,
  CDN_UPLOAD_KEY: process.env.CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET: process.env.CDN_UPLOAD_SECRET,
  CDN_REGION: process.env.CDN_REGION,
  CDN_ENDPOINT: process.env.CDN_ENDPOINT,
}

const webAppRoot = path.join(process.cwd(), 'apps/web')
const nwDataRoot = path.join(webAppRoot, 'nw-data')

module.exports = {
  ...config,
  webAppRoot: webAppRoot,
  nwDataRoot: nwDataRoot,
  gameDir: (isPtr) => isPtr ? config.NW_GAME_PTR : config.NW_GAME_LIVE,
  extractDir: (isPtr) => isPtr ? config.NW_DATA_PTR : config.NW_DATA_LIVE,
  importDir: (isPtr) => path.join(nwDataRoot, isPtr ? 'ptr' : 'live'),
}
