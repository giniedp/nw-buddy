import { injectAppDB } from '../db'
import { DBT_CHARACTERS } from './constants'
import { CharacterRecord } from './types'

export type CharactersDB = ReturnType<typeof injectCharactersDB>
export function injectCharactersDB() {
  return injectAppDB().table<CharacterRecord>(DBT_CHARACTERS)
}
