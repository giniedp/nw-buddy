require('dotenv').config()

const config = {
  NW_GAME_LIVE: process.env.NW_GAME_LIVE,
  NW_GAME_PTR: process.env.NW_GAME_PTR,
  NW_DATA_LIVE: process.env.NW_DATA_LIVE,
  NW_DATA_PTR: process.env.NW_DATA_PTR,
  NW_PTR: ['true', 'yes', '1'].includes(process.env.NW_PTR),
}
module.exports = {
  ...config,
  gameDir: (isPtr) => isPtr ? config.NW_GAME_PTR : config.NW_GAME_LIVE,
  dataDir: (isPtr) => isPtr ? config.NW_DATA_PTR : config.NW_DATA_LIVE
}
