import type { ArmorAppearanceDefinitions } from '@nw-data/generated'

/**
 * The game files of a model, paths as the data has them (nwbt normalizes them)
 */
export interface ModelSource {
  /**
   * A `.cdf`, `.cgf` / `.skin` or `.dynamicslice`
   */
  model: string
  /**
   * The material, for a `.cdf` the override of every attachment. Null for the model's own.
   */
  material?: string | null
  /**
   * The material the game draws the model with a second time
   */
  overcoat?: string | null
  /**
   * A `.cdf` whose cloth attachments (capes, skirts) come with the model: an armor appearance's `AppearanceCDF`
   */
  clothFrom?: string | null
  /**
   * The `.chr` skeleton of an armor piece shown alone
   */
  skeleton?: string | null
}

const PLAYER_SKELETONS: Record<string, string> = {
  male: 'objects/characters/player/male/player_male.chr',
  female: 'objects/characters/player/female/player_female.chr',
}

/**
 * An armor piece alone, as the `nwbt models` armor collector converts it: the skin, its material, the cloth of the
 * appearance's character and the gender's skeleton
 */
export function armorSource(item: ArmorAppearanceDefinitions): ModelSource | null {
  if (!item?.Skin1) {
    return null
  }
  return {
    model: item.Skin1,
    material: item.Material1 || null,
    clothFrom: item.AppearanceCDF || null,
    skeleton: PLAYER_SKELETONS[item.Gender?.toLowerCase()] ?? null,
  }
}
