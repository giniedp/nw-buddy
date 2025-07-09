import { injectAppDB } from '../db'
import { DBT_TABLE_PRESETS } from './constants'
import { TablePresetRecord } from './types'

export type TablePresetsDB = ReturnType<typeof injectTablePresetsDB>
export function injectTablePresetsDB() {
  return injectAppDB().table<TablePresetRecord>(DBT_TABLE_PRESETS)
}
