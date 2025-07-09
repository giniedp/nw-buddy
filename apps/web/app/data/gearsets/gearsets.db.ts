import { injectAppDB } from '../db'
import { DBT_GEARSETS } from './constants'
import { GearsetRecord } from './types'

export type GearsetsDB = ReturnType<typeof injectGearsetsDB>
export function injectGearsetsDB() {
  return injectAppDB().table<GearsetRecord>(DBT_GEARSETS)
}
