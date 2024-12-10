import { CharacterRecord } from "./types";

interface DeprecatedFields {
  /**
   * Character weapon levels
   * @deprecated
   */
  weaponLevels: Record<string, number>
  /**
   * Character tradeskill levels
   * @deprecated
   */
  tradeskillLevels: Record<string, number>
  /**
   * Character tradeskill armor sets
   * @deprecated
   */
  tradeskillSets: Record<string, string[]>
  /**
   * Cusom trade skill yield bonus
   * @deprecated
   */
  tradeskillBonus: Record<string, number>
  /**
   * Crafting preference: first light bonus
   * @deprecated
   */
  craftingFlBonus: boolean
}

export function migrateCharacter(record: CharacterRecord): CharacterRecord {
  const old = record as unknown as DeprecatedFields
  if (old.tradeskillLevels) {
    record.progressionLevels = record.progressionLevels || {}
    for (const [key, value] of Object.entries(old.tradeskillLevels)) {
      if (!record.progressionLevels || key in record.progressionLevels) {
        record.progressionLevels[key] = value
      }
    }
    delete old.tradeskillLevels
  }
  if (old.tradeskillSets != null) {
    delete old.tradeskillSets
  }
  if (old.tradeskillBonus != null) {
    delete old.tradeskillBonus
  }
  if (old.craftingFlBonus != null) {
    delete old.craftingFlBonus
  }
  if (old.weaponLevels) {
    // TODO
  }
  return record
}
