import type { AppDbTable } from '../app-db'
import { injectAppDB } from '../db'
import { DBT_ITEMS } from './constants'
import { ItemInstanceRecord } from './types'

export type ItemInstancesDB = AppDbTable<ItemInstanceRecord>
export function injectItemInstancesDB(): ItemInstancesDB {
  return injectAppDB().table<ItemInstanceRecord>(DBT_ITEMS)
}
