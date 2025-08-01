import { AppDbRecord } from '../app-db'

export interface CharacterRecord extends AppDbRecord {
  /**
   * Name of the character
   */
  name: string
  /**
   * Character level
   */
  level?: number
  /**
   * Server name
   */
  serverName?: string
  /**
   * Company name
   */
  companyName?: string
  /**
   * Faction
   */
  faction?: 'covenant' | 'syndicate' | 'marauder'
  /**
   * Gender
   */
  gender?: 'male' | 'female'
  skin?: number
  face?: number
  hairStyle?: number
  hairColor?: number
  beardStyle?: number
  beardColor?: number
  /**
   *
   */
  progressionLevels: Record<string | number, number>
  /**
   * Active crafting buffs (effect or perk or faction buff IDs)
   */
  effectStacks: Record<string, number>
  /**
   * Territory progression and notes
   */
  territories: Record<string, TerritoryData>
}

export interface TerritoryData {
  standing?: number
  notes?: string
  tags?: string[]
}
