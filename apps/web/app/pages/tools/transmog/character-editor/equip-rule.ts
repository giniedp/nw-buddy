import type { ArmorAppearanceDefinitions } from '@nw-data/generated'

export type EquipSlotId = 'head' | 'chest' | 'hands' | 'legs' | 'feet'

export const EQUIP_SLOTS: EquipSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet']

/**
 * The attachment names of a slot on the player (`visual_slot_name` of the game): a row binds its `Skin1` to
 * `{part}2` and its `Skin2` to `{part}1`
 */
export const EQUIP_PARTS: Record<EquipSlotId, string> = {
  head: 'hat',
  chest: 'shirt',
  hands: 'gloves',
  legs: 'pants',
  feet: 'boots',
}

/**
 * The armor appearance row of each slot, for the character's gender (null: nothing worn)
 */
export type EquipInput = Partial<Record<EquipSlotId, ArmorAppearanceDefinitions | null>>

/**
 * A model to show in a slot: the row's armor skin (dyeable with the row) or a bare skin of the player
 */
export interface EquipModel {
  /**
   * The player attachment the model binds to, e.g. `shirt2`
   */
  attachment: string
  url: string
  /**
   * The root the model's resource uris resolve against, default the folder of the model
   */
  rootUrl?: string
  /**
   * The row whose materials and dyes the model takes, null for bare skins
   */
  appearance: ArmorAppearanceDefinitions | null
  /**
   * The game files of the model, for the export: the skin, its material (null: the character's body material, bare
   * skins) and the character whose cloth comes with it (the row's `AppearanceCDF`)
   */
  source: { skin: string; material: string | null; clothFrom: string | null }
}

/**
 * The location of a model file
 */
export interface EquipModelUrl {
  url: string
  rootUrl?: string
}

/**
 * What hides a part: a slot's row, or the character file (a part the game hides by default)
 */
export type HiddenBy = EquipSlotId | 'character'

export interface EquipResult {
  slots: Record<EquipSlotId, EquipModel[]>
  /**
   * The player's default parts (node names) that the worn rows replace or hide
   */
  hiddenParts: string[]
  /**
   * What hides a part of {@link hiddenParts}: the slot whose row hides it (the chest for the legs of `HideLegs`) or the
   * character file
   */
  hiddenBy: Record<string, HiddenBy>
  /**
   * The models the rule took away (the legs under a chest with `HideLegs`), a body part override brings them back
   */
  dropped: EquipModel[]
}

export interface EquipUrls {
  /**
   * The model of a row's `Skin1` (the armor models of the CDN)
   */
  armor: (row: ArmorAppearanceDefinitions) => EquipModelUrl | null
  /**
   * The model of a skin file (the bare skins of a row's `Skin2`, e.g. `male_naked_chest_sleeveless.skin`)
   */
  skin: (file: string) => EquipModelUrl | null
}

/**
 * What the character wears for the rows of its slots, after the game's paperdoll:
 *
 * - a row replaces both attachments of its part: `Skin1` (the armor) binds `{part}2`, `Skin2` binds `{part}1`. An
 *   empty `Skin2` empties `{part}1`: the player's default there (e.g. the bare chest under a chest armor) is gone.
 *   `Skin2` is mostly a bare skin that stays visible (e.g. the arms of a sleeveless chest)
 * - `ShowBaseModelOnly`: the row keeps the player's defaults of its part
 * - a chest row's `HideLegs` empties the legs (the legs row and the bare thighs, e.g. under a long robe)
 * - a head row's `HideHead` hides the player's head
 * - `defaultHidden`: the parts the character file hides (the players' sleeveless torso `shirt2`)
 *
 * Not applied: hair (the player models have none), the one hand skins (weapons), and the columns of other game
 * versions (`ForceHideForearms`, `ForceShortsleeves`, cape and skirt cloth).
 */
export function equipCharacter(input: EquipInput, urls: EquipUrls, defaultHidden: string[] = []): EquipResult {
  const hidden = new Map<string, HiddenBy>()
  const slots = {} as Record<EquipSlotId, EquipModel[]>
  const dropped: EquipModel[] = []
  // the parts the character file hides, a row hiding them too takes over
  for (const name of defaultHidden) {
    hidden.set(name, 'character')
  }
  for (const slot of EQUIP_SLOTS) {
    slots[slot] = equipSlot(slot, input[slot], urls, hidden)
  }
  if (input.chest?.HideLegs && !input.chest.ShowBaseModelOnly) {
    dropped.push(...slots.legs)
    slots.legs = []
    hidden.set(`${EQUIP_PARTS.legs}1`, 'chest')
    hidden.set(`${EQUIP_PARTS.legs}2`, 'chest')
  }
  if (input.head?.HideHead) {
    hidden.set('head1', 'head')
  }
  return { slots, hiddenParts: [...hidden.keys()], hiddenBy: Object.fromEntries(hidden), dropped }
}

/**
 * The attachments the user may hide or show per slot, by bit of the slot's `flag` and `show` (bit 1 the first, bit 2
 * the second), the bare parts of the transmog sets: the chest has two, the hands, legs and feet one, the head none
 */
export const HIDE_FLAG_ATTACHMENTS: Record<EquipSlotId, string[]> = {
  head: [],
  chest: ['shirt1', 'shirt2'],
  hands: ['gloves1'],
  legs: ['pants1'],
  feet: ['boots1'],
}

/**
 * The user's choices per slot: `hide` (the record's `flag`) hides parts the rule shows, `show` shows parts the rule
 * hides, by the bits of {@link HIDE_FLAG_ATTACHMENTS}
 */
export interface BodyPartFlags {
  hide: Partial<Record<EquipSlotId, number>>
  show: Partial<Record<EquipSlotId, number>>
}

/**
 * A body part the user may hide or show, see {@link HIDE_FLAG_ATTACHMENTS}
 */
export interface BodyPart {
  slot: EquipSlotId
  attachment: string
  bit: 1 | 2
  /**
   * An armor model is bound there: it always shows, the flags don't apply
   */
  armor: boolean
  /**
   * What hides the part, null when the rule shows it
   */
  hiddenBy: HiddenBy | null
  /**
   * Whether the part is hidden, after the rule and the user's flags
   */
  hidden: boolean
  /**
   * The user's flags decide against the rule
   */
  override: boolean
}

/**
 * The body parts of each slot: what the rule does with them and what the user's flags make of it
 */
export function bodyParts(result: EquipResult, flags: BodyPartFlags): Record<EquipSlotId, BodyPart[]> {
  const parts = {} as Record<EquipSlotId, BodyPart[]>
  for (const slot of EQUIP_SLOTS) {
    parts[slot] = HIDE_FLAG_ATTACHMENTS[slot].map((attachment, index) => {
      const bit = (1 << index) as 1 | 2
      const bound = result.slots[slot].filter((it) => it.attachment === attachment)
      const armor = bound.some((it) => !!it.appearance)
      const ruleHidden = !bound.length && result.hiddenParts.includes(attachment)
      let hidden = false
      if (!armor && ruleHidden) {
        hidden = (Number(flags.show[slot]) & bit) === 0
      } else if (!armor) {
        hidden = (Number(flags.hide[slot]) & bit) !== 0
      }
      return {
        slot,
        attachment,
        bit,
        armor,
        hiddenBy: ruleHidden ? (result.hiddenBy[attachment] ?? slot) : null,
        hidden,
        override: !armor && hidden !== ruleHidden,
      }
    })
  }
  return parts
}

/**
 * The user's flags on top of the rule ({@link bodyParts}): a hidden part hides the player's default there and drops a
 * bare skin bound to it; a part shown against the rule brings back the player's default or the model the rule dropped.
 * Armor models always stay.
 */
export function applyBodyParts(result: EquipResult, flags: BodyPartFlags): EquipResult {
  const hidden = new Set(result.hiddenParts)
  const slots = { ...result.slots }
  for (const part of Object.values(bodyParts(result, flags)).flat()) {
    if (!part.override) {
      continue
    }
    if (part.hidden) {
      hidden.add(part.attachment)
      slots[part.slot] = slots[part.slot].filter((it) => !!it.appearance || it.attachment !== part.attachment)
    } else {
      const back = result.dropped.filter((it) => it.attachment === part.attachment)
      slots[part.slot] = [...slots[part.slot], ...back]
      // without a dropped model the player's default shows
      if (!back.length) {
        hidden.delete(part.attachment)
      }
    }
  }
  return { ...result, slots, hiddenParts: [...hidden] }
}

function equipSlot(
  slot: EquipSlotId,
  row: ArmorAppearanceDefinitions | null | undefined,
  urls: EquipUrls,
  hidden: Map<string, HiddenBy>,
): EquipModel[] {
  if (!row || row.ShowBaseModelOnly) {
    return []
  }
  const part = EQUIP_PARTS[slot]
  hidden.set(`${part}1`, slot)
  hidden.set(`${part}2`, slot)
  const result: EquipModel[] = []
  const armor = row.Skin1 ? urls.armor(row) : null
  if (armor) {
    result.push({
      attachment: `${part}2`,
      ...armor,
      appearance: row,
      source: { skin: row.Skin1, material: row.Material1 || null, clothFrom: row.AppearanceCDF || null },
    })
  }
  const skin = row.Skin2 ? urls.skin(row.Skin2) : null
  if (skin) {
    result.push({
      attachment: `${part}1`,
      ...skin,
      appearance: null,
      source: { skin: row.Skin2, material: null, clothFrom: null },
    })
  }
  return result
}
