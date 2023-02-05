import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NwDbService } from '../nw-db.service'
import {
  selectActiveEncumbrance,
  selectActiveWeapon,
  selectActveEffects,
  selectActivePerks,
  selectAttributes,
  selectEquppedArmor,
  selectEquppedConsumables,
  selectEquppedTools,
  selectEquppedWeapons,
  selectPlacedHousings,
  selectWeaponAbilities,
  selectConsumableEffects,
  selectActiveAbilities,
} from './selectors'
import { ActiveMods, DbSlice, MannequinState, SelectorOf } from './types'

@Injectable()
export class Mannequin extends ComponentStore<MannequinState> {
  public readonly db$ = this.select<SelectorOf<DbSlice>>({
    items: this.db.itemsMap,
    housings: this.db.housingItemsMap,
    weapons: this.db.weaponsMap,
    runes: this.db.runesMap,
    armors: this.db.armorsMap,
    ammos: this.db.ammosMap,
    consumables: this.db.consumablesMap,
    perks: this.db.perksMap,
    effects: this.db.statusEffectsMap,
    abilities: this.db.abilitiesMap,
    affixes: this.db.affixStatsMap,
    attrStr: this.db.attrStr,
    attrDex: this.db.attrDex,
    attrInt: this.db.attrInt,
    attrFoc: this.db.attrFoc,
    attrCon: this.db.attrCon,
  })

  public readonly level$ = this.select(({ level }) => level)

  public readonly equippedItems$ = this.select(({ equippedItems }) => equippedItems)
  public readonly equippedArmor$ = this.select(this.db$, this.state$, selectEquppedArmor)
  public readonly equippedWeapons$ = this.select(this.db$, this.state$, selectEquppedWeapons)
  public readonly equippedConsumables$ = this.select(this.db$, this.state$, selectEquppedConsumables)
  public readonly equippedTools$ = this.select(this.db$, this.state$, selectEquppedTools)
  public readonly equippedTrophies$ = this.select(this.db$, this.state$, selectPlacedHousings)

  public readonly activeWeapon$ = this.select(this.db$, this.state$, selectActiveWeapon)
  public readonly activeWeight$ = this.select(this.db$, this.state$, selectActiveEncumbrance)
  public readonly activePerks = this.select(this.db$, this.state$, selectActivePerks)
  public readonly consumableEffects$ = this.select(this.db$, this.state$, selectConsumableEffects)
  public readonly activeAttributes$ = this.select(
    this.db$,
    this.select<SelectorOf<ActiveMods>>({
      perks: this.activePerks,
      effects: this.consumableEffects$,
    }),
    this.state$,
    selectAttributes
  )
  public readonly activeAbilities$ = this.select(this.db$, this.activeAttributes$, this.state$, selectActiveAbilities)
  public readonly activeEffects$ = this.select(this.db$, this.activeAbilities$, this.state$, selectActveEffects)
  // public readonly activeMods$ = this.select<SelectorOf<ActiveMods>>({
  //   perks: this.activePerks,
  //   effects: this.activeEffects$,
  // })

  public readonly weaponAbilities$ = this.select(this.db$, this.activeWeapon$, this.state$, selectWeaponAbilities)

  public constructor(private db: NwDbService) {
    super({})
  }
}
