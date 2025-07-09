import { injectAppDB } from '../db'
import { DBT_TABLE_STATES } from './constants'
import { TableStateRecord } from './types'

export type TableStatesDB = ReturnType<typeof injectTableStatesDB>
export function injectTableStatesDB() {
  return injectAppDB().table<TableStateRecord>(DBT_TABLE_STATES)
}
