import { AppDbRecord } from '../app-db'

export interface BookmarkRecord extends AppDbRecord {
  itemId: string
  userId: string
  characterId: string
  flags?: number
  gearScore?: number
}
