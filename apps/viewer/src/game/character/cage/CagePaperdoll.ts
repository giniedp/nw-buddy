import { sameName } from '../sameName'

/**
 * An item the stand-in paperdoll holds
 */
export interface CageItem {
  name: string
  /**
   * The item's Mannequin tags (the weapon row's `MannequinTag` list), set by `SetMannequinTagFromSource`
   */
  tags: string[]
  /**
   * Item classes, matched against a grid list's `WeaponRequirements`
   */
  classes: string[]
}

/**
 * A one-handed sword (stand-in until items come from the datasheets), for a character that should carry one
 */
export const CAGE_SWORD: CageItem = {
  name: 'Sword',
  tags: ['1H_Melee', 'Sword'],
  classes: ['Sword', 'Melee', 'EquippableMainHand'],
}

const MAIN_HAND = ['MAIN_HAND_OPTION_1', 'MAIN_HAND_OPTION_2', 'MAIN_HAND_OPTION_3']

interface Slot {
  item: CageItem | null
  sheathed: boolean
}

/**
 * The weapon slots the CAGE conditions and activities read and write (a stand-in for the game's paperdoll):
 * `MAIN_HAND_OPTION_1..3`, `ACTIVE_MAIN_HAND_WEAPON` (the selected main hand option), `ACTIVE_OFF_HAND_WEAPON` (none),
 * `TOOL_SLOT` (none). Empty by default (unarmed); a weapon starts sheathed.
 */
export class CagePaperdoll {
  private readonly slots = new Map<string, Slot>()
  private activeMain = MAIN_HAND[0]
  /**
   * Upper case slot name per alias as conditions and activities spell it
   */
  private readonly aliases = new Map<string, string>()

  /**
   * @param mainHand - the items of `MAIN_HAND_OPTION_1..3`; none by default: the character fights unarmed (the
   *   `Unarmed` tag with an empty main hand, as the player's action lists expect it)
   */
  public constructor(mainHand: Array<CageItem | null> = []) {
    for (let i = 0; i < MAIN_HAND.length; i++) {
      this.slots.set(MAIN_HAND[i], { item: mainHand[i] ?? null, sheathed: true })
    }
  }

  /**
   * The slot an alias names, null for slots the stand-in does not hold
   */
  public resolve(alias: string): string | null {
    let upper = this.aliases.get(alias)
    if (upper === undefined) {
      upper = alias.toUpperCase()
      this.aliases.set(alias, upper)
    }
    if (upper === 'ACTIVE_MAIN_HAND_WEAPON') {
      return this.activeMain
    }
    return this.slots.has(upper) ? upper : null
  }

  public item(alias: string): CageItem | null {
    const slot = this.slot(alias)
    return slot?.item ?? null
  }

  /**
   * The slot is the selected main hand option (`ACTIVE_MAIN_HAND_WEAPON` always is)
   */
  public isActive(alias: string): boolean {
    const name = this.resolve(alias)
    return name !== null && name === this.activeMain
  }

  /**
   * An item in the slot is sheathed; an empty slot counts as sheathed
   */
  public isSheathed(alias: string): boolean {
    const slot = this.slot(alias)
    return !slot?.item || slot.sheathed
  }

  /**
   * Sheathes or draws the slot's item; drawing a main hand option selects it
   */
  public setSheathed(alias: string, sheathed: boolean) {
    const name = this.resolve(alias)
    const slot = name ? this.slots.get(name) : null
    if (!name || !slot) {
      return
    }
    if (!sheathed && MAIN_HAND.includes(name)) {
      for (const [other, it] of this.slots) {
        if (other !== name && MAIN_HAND.includes(other)) {
          it.sheathed = true
        }
      }
      this.activeMain = name
    }
    slot.sheathed = sheathed
  }

  /**
   * The selected main hand weapon has an item class (without regard to case), false without a weapon
   */
  public hasActiveClass(name: string): boolean {
    const classes = this.slots.get(this.activeMain)?.item?.classes
    if (!classes) {
      return false
    }
    for (const it of classes) {
      if (sameName(it, name)) {
        return true
      }
    }
    return false
  }

  private slot(alias: string): Slot | null {
    const name = this.resolve(alias)
    return name ? (this.slots.get(name) ?? null) : null
  }
}
