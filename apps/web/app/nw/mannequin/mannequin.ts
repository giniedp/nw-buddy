import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import {
  selectActiveAbilities,
  selectActiveConsumables,
  selectActivePerks,
  selectActiveWeapon,
  selectActveEffects,
  selectAttributes,
  selectWeaponAttacks,
  selectConsumableEffects,
  selectEquppedArmor,
  selectEquppedConsumables,
  selectEquppedTools,
  selectEquppedWeapons,
  selectGearScore,
  selectPlacedHousings,
  selectTotalWeight,
  selectWeaponAbilities,
  selectDamageTableRow,
} from './selectors'
import { selectElementalRating, selectModsArmor, selectPhysicalRating } from './stats/armoring'
import { selectWeaponDamage, selectDamageMods } from './stats/mods-damage'
import { selectModsEFF, selectModsMULT } from './stats/mods-eff'
import { selectModsEXP } from './stats/mods-exp'
import { selectMaxHealth, selectMaxMana, selectMaxStamina } from './stats/vitality'
import { selectModsABS } from './stats/mods-abs'
import { selectModsDMG } from './stats/mods-dmg'
import { ActiveMods, AttributeModsSource, DbSlice, MannequinState, SelectorOf } from './types'
import { selectModsROL } from './stats/mods-rol'
import { selectModsCraftingGS } from './stats/mods-gs-crafting'
import { tapDebug } from '~/utils'

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
    effectCategories: this.db.statusEffectCategoriesMap,
    abilities: this.db.abilitiesMap,
    affixes: this.db.affixStatsMap,
    attrStr: this.db.attrStr,
    attrDex: this.db.attrDex,
    attrInt: this.db.attrInt,
    attrFoc: this.db.attrFoc,
    attrCon: this.db.attrCon,
    damagaTable: this.db.damageTable0,
  })

  public readonly level$ = this.select(({ level }) => level)
  public readonly myHpPercent$ = this.select(({ myHealthPercent }) => myHealthPercent)
  public readonly myManaPercent$ = this.select(({ myManaPercent }) => myManaPercent)
  public readonly myStaminaPercent$ = this.select(({ myStaminaPercent }) => myStaminaPercent)
  public readonly numAroundMe$ = this.select(({ numAroundMe }) => numAroundMe)
  public readonly numHits$ = this.select(({ numHits }) => numHits)
  public readonly gearScore$ = this.select(({ equippedItems, level }) => selectGearScore(equippedItems, level))
  public readonly equippedItems$ = this.select(({ equippedItems }) => equippedItems)

  public readonly equippedArmor$ = this.select(this.db$, this.state$, selectEquppedArmor)
  public readonly equippedWeapons$ = this.select(this.db$, this.state$, selectEquppedWeapons)
  public readonly equippedConsumables$ = this.select(this.db$, this.state$, selectEquppedConsumables)
  public readonly equippedTools$ = this.select(this.db$, this.state$, selectEquppedTools)
  public readonly equippedTrophies$ = this.select(this.db$, this.state$, selectPlacedHousings)

  public readonly totalWeight$ = this.select(this.db$, this.state$, selectTotalWeight)
  public readonly activeConsumables$ = this.select(this.db$, this.state$, selectActiveConsumables)
  public readonly consumableEffects$ = this.select(this.db$, this.state$, selectConsumableEffects)

  public readonly activeWeapon$ = this.select(this.db$, this.state$, selectActiveWeapon)
  public readonly activeWeaponAttacks$ = this.select(this.db$, this.activeWeapon$, this.state$, selectWeaponAttacks)
  public readonly activeWeaponAbilities$ = this.select(this.db$, this.activeWeapon$, this.state$, selectWeaponAbilities)
  public readonly activeDamageTableRow$ = this.select(this.activeWeaponAttacks$, this.state$, selectDamageTableRow)

  public readonly activePerks$ = this.select(this.db$, this.state$, selectActivePerks)

  public readonly activeAttributes$ = this.select(
    this.db$,
    combineLatest<SelectorOf<AttributeModsSource>>({
      perks: this.activePerks$,
      effects: this.consumableEffects$,
    }),
    this.state$,
    selectAttributes
  )

  public readonly activeAbilities$ = this.select(
    this.db$,
    this.activeAttributes$,
    this.activeWeapon$,
    this.activeDamageTableRow$,
    this.activePerks$,
    this.state$,
    selectActiveAbilities
  )

  public readonly activeEffects$ = this.select(this.db$, this.activePerks$, this.state$, selectActveEffects)

  public readonly activeMods$ = combineLatest<SelectorOf<ActiveMods>>({
    // damageRow: this.activeDamageTableRow$,
    attributes: this.activeAttributes$,
    abilities: this.activeAbilities$,
    effects: this.activeEffects$,
    perks: this.activePerks$,
    consumables: this.activeConsumables$,
  })

  public readonly statRatingElemental$ = this.select(this.db$, this.activeMods$, this.state$, selectElementalRating)

  public readonly statRatingPhysical$ = this.select(this.db$, this.activeMods$, this.state$, selectPhysicalRating)

  public readonly statHealth$ = this.select(this.db$, this.activeMods$, this.state$, selectMaxHealth)

  public readonly statMana$ = this.select(this.activeMods$, selectMaxMana)

  public readonly statStamina$ = this.select(this.activeMods$, selectMaxStamina)

  public readonly statExperienceBonus$ = this.select(this.activeMods$, this.state$, selectModsEXP)

  public readonly statEffectivenessBonus$ = this.select(this.activeMods$, this.state$, selectModsEFF)

  public readonly statYieldBonus$ = this.select(this.activeMods$, this.state$, selectModsMULT)

  public readonly statDamageBase$ = this.select(
    this.activeMods$,
    this.activeWeapon$,
    this.activeDamageTableRow$,
    this.state$,
    selectWeaponDamage
  )

  public readonly statDamageMods$ = this.select(this.activeMods$, this.activeWeapon$, this.state$, selectDamageMods)

  public readonly statDmg$ = this.select(this.activeMods$, this.state$, selectModsDMG)

  public readonly statAbs$ = this.select(this.activeMods$, this.state$, selectModsABS)
  public readonly statArmor$ = this.select(this.db$, this.activeMods$, this.state$, selectModsArmor)

  public readonly statRol$ = this.select(this.activeMods$, this.state$, selectModsROL)

  public readonly statCraftGS$ = this.select(this.activeMods$, selectModsCraftingGS)

  public constructor(private db: NwDbService) {
    super({
      level: 1,
      equippedItems: [],
      weaponActive: 'primary',
      weaponUnsheathed: true,
      myHealthPercent: 1,
      myManaPercent: 1,
      myStaminaPercent: 1,
      numAroundMe: 1,
      numHits: 1,
    })
  }
}
