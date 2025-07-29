import { injectAppDB } from '../db'
import { DBT_TRANSMOGS } from './constants'
import { TransmogRecord } from './types'

export type TransmogsDB = ReturnType<typeof injectTransmogsDB>
export function injectTransmogsDB() {
  return injectAppDB().table<TransmogRecord>(DBT_TRANSMOGS)
}
