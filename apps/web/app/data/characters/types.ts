
export interface CharacterRecord {
  /**
   * ID in database
   */
  id: string
  /**
   * Image ID
   */
  imageId: string
  /**
   * Name of the character
   */
  name: string
  /**
   * Character level
   */
  level: number
  /**
   * Server name
   */
  serverName: string
  /**
   * Company name
   */
  companyName: string
  /**
   * Faction
   */
  faction: 'covenant' | 'syndicate' | 'marauder'
  /**
   *
   */
  progressionLevels: Record<string, number>
  /**
   * Active crafting buffs (effect or perk or faction buff IDs)
   */
  effectStacks: Record<string, number>
  /**
   * Character weapon levels
   */
  weaponLevels: Record<string, number>
  /**
   * Character tradeskill levels
   */
  tradeskillLevels: Record<string, number>
  /**
   * Character tradeskill armor sets
   */
  tradeskillSets: Record<string, string[]>
  /**
   * Cusom trade skill yield bonus
   */
  tradeskillBonus: Record<string, number>
  /**
   * Crafting preference: first light bonus
   */
  craftingFlBonus: boolean
}
