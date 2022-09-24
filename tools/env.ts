import * as dotenv from 'dotenv'

dotenv.config()

export function env(isPtr: boolean) {
  return {
    gameDir: isPtr ? process.env['NW_GAME_PTR'] : process.env['NW_GAME_LIVE'],
    dataDir: isPtr ? process.env['NW_DATA_PTR'] : process.env['NW_DATA_LIVE']
  }
}
