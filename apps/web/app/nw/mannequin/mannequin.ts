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
  selectAllAbilities,
  selectAttributes,
  selectConsumableEffects,
  selectDamageTableRow,
  selectEquipLoad,
  selectEquppedArmor,
  selectEquppedConsumables,
  selectEquppedTools,
  selectEquppedWeapons,
  selectGearScore,
  selectPlacedHousings,
  selectPlacingMods,
  selectWeaponAbilities,
  selectWeaponAttacks,
} from './selectors'
import { selectElementalRating, selectModsArmor, selectPhysicalRating } from './stats/armoring'
import { selectModsABS } from './stats/mods-abs'
import { selectDamageMods, selectWeaponDamage } from './stats/mods-damage'
import { selectModsDMG } from './stats/mods-dmg'
import { selectModsEFF, selectModsMULT } from './stats/mods-eff'
import { selectModsEXP } from './stats/mods-exp'
import { selectModsCraftingGS } from './stats/mods-gs-crafting'
import { selectModsROL } from './stats/mods-rol'
import { selectMaxHealth, selectMaxMana, selectMaxStamina } from './stats/vitality'
import { ActiveMods, AttributeModsSource, DbSlice, MannequinState, Observed } from './types'
import { selectStatusEffectReduction } from './stats/mods-effect-reduction'
import { selectCooldownMods } from './stats/mods-cooldowns'

const config = {
  debounce: true,
}

@Injectable()
export class Mannequin extends ComponentStore<MannequinState> {
  public readonly db$ = this.select<Observed<DbSlice>>(
    {
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
      cooldowns: this.db.cooldownsPlayerMap,
      damagaTable: this.db.damageTable0,
      pvpBalanceArena: this.db.data.pvpbalancetablesPvpbalanceArena(),
      pvpBalanceOpenworld: this.db.data.pvpbalancetablesPvpbalanceOpenworld(),
      pvpBalanceOutpostrush: this.db.data.pvpbalancetablesPvpbalanceOutpostrush(),
      pvpBalanceWar: this.db.data.pvpbalancetablesPvpbalanceWar(),
    },
    config
  )

  public readonly dbReady$ = this.select(this.db$, () => true)

  public readonly level$ = this.select(({ level }) => level)
  public readonly myHpPercent$ = this.select(({ myHealthPercent }) => myHealthPercent)
  public readonly myManaPercent$ = this.select(({ myManaPercent }) => myManaPercent)
  public readonly myStaminaPercent$ = this.select(({ myStaminaPercent }) => myStaminaPercent)
  public readonly numAroundMe$ = this.select(({ numAroundMe }) => numAroundMe)
  public readonly numHits$ = this.select(({ numHits }) => numHits)
  public readonly combatMode$ = this.select(({ combatMode }) => combatMode || 'pve')
  public readonly isPvP$ = this.select(this.combatMode$, (it) => it !== 'pve')
  public readonly isPvE$ = this.select(this.combatMode$, (it) => it === 'pve')
  public readonly gearScore$ = this.select(({ equippedItems, level }) => selectGearScore(equippedItems, level))
  public readonly equippedItems$ = this.select(({ equippedItems }) => equippedItems)

  public readonly equippedArmor$ = this.select(this.db$, this.state$, selectEquppedArmor, config)
  public readonly equippedWeapons$ = this.select(this.db$, this.state$, selectEquppedWeapons, config)
  public readonly equippedConsumables$ = this.select(this.db$, this.state$, selectEquppedConsumables, config)
  public readonly equippedTools$ = this.select(this.db$, this.state$, selectEquppedTools, config)
  public readonly equippedTrophies$ = this.select(this.db$, this.state$, selectPlacedHousings, config)

  public readonly activeConsumables$ = this.select(this.db$, this.state$, selectActiveConsumables, config)
  public readonly consumableEffects$ = this.select(this.db$, this.state$, selectConsumableEffects, config)

  public readonly activeWeapon$ = this.select(this.db$, this.state$, selectActiveWeapon, config)
  public readonly activeWeaponAttacks$ = this.select(
    this.db$,
    this.activeWeapon$,
    this.state$,
    selectWeaponAttacks,
    config
  )
  public readonly activeWeaponAbilities$ = this.select(
    this.db$,
    this.activeWeapon$,
    this.state$,
    selectWeaponAbilities,
    config
  )
  public readonly activeDamageTableRow$ = this.select(
    this.activeWeaponAttacks$,
    this.state$,
    selectDamageTableRow,
    config
  )

  public readonly activePerks$ = this.select(this.db$, this.state$, selectActivePerks, config)
  public readonly equipLoad$ = this.select(this.db$, this.state$, this.activePerks$, selectEquipLoad, config)

  public readonly activeAttributes$ = this.select(
    this.db$,
    combineLatest<Observed<AttributeModsSource>>({
      perks: this.activePerks$,
      effects: this.consumableEffects$,
    }),
    this.state$,
    selectAttributes,
    config
  )

  public readonly activeMagnify$ = this.select(
    this.db$,
    combineLatest<Observed<AttributeModsSource>>({
      perks: this.activePerks$,
      effects: this.consumableEffects$,
    }),
    this.state$,
    selectPlacingMods,
    config
  )

  public readonly activeAbilities$ = this.select(
    this.db$,
    this.activeAttributes$,
    this.activeWeapon$,
    this.activeDamageTableRow$,
    this.activePerks$,
    this.state$,
    selectActiveAbilities,
    config
  )

  public readonly allAbilities$ = this.select(
    this.db$,
    this.activeAttributes$,
    this.activeWeapon$,
    this.activeDamageTableRow$,
    this.activePerks$,
    this.state$,
    selectAllAbilities,
    config
  )

  public readonly activeEffects$ = this.select(this.db$, this.activePerks$, this.state$, selectActveEffects)

  public readonly activeMods$ = this.select<Observed<ActiveMods>>(
    {
      // damageRow: this.activeDamageTableRow$,
      attributes: this.activeAttributes$,
      abilities: this.activeAbilities$,
      effects: this.activeEffects$,
      perks: this.activePerks$,
      consumables: this.activeConsumables$,
    },
    config
  )

  public readonly allMods$ = this.select<Observed<ActiveMods>>(
    {
      // damageRow: this.activeDamageTableRow$,
      attributes: this.activeAttributes$,
      abilities: this.allAbilities$,
      effects: this.activeEffects$,
      perks: this.activePerks$,
      consumables: this.activeConsumables$,
    },
    config
  )

  public readonly statRatingElemental$ = this.select(
    this.db$,
    this.activeMods$,
    this.state$,
    selectElementalRating,
    config
  )

  public readonly statRatingPhysical$ = this.select(
    this.db$,
    this.activeMods$,
    this.state$,
    selectPhysicalRating,
    config
  )

  public readonly statCooldown$ = this.select(this.db$, this.allMods$, selectCooldownMods, config)
  public readonly statHealth$ = this.select(this.db$, this.activeMods$, this.state$, selectMaxHealth, config)
  public readonly statMana$ = this.select(this.activeMods$, selectMaxMana, config)
  public readonly statStamina$ = this.select(this.activeMods$, selectMaxStamina, config)
  public readonly statExperienceBonus$ = this.select(this.activeMods$, this.state$, selectModsEXP, config)
  public readonly statEffectivenessBonus$ = this.select(this.activeMods$, this.state$, selectModsEFF, config)
  public readonly statYieldBonus$ = this.select(this.activeMods$, this.state$, selectModsMULT, config)

  public readonly statDamageBase$ = this.select(
    this.activeMods$,
    this.activeWeapon$,
    this.activeDamageTableRow$,
    this.equipLoad$,
    this.db$,
    this.state$,
    selectWeaponDamage,
    { debounce: true }
  )

  public readonly statDamageMods$ = this.select(
    this.activeMods$,
    this.activeWeapon$,
    this.state$,
    selectDamageMods,
    config
  )

  public readonly statDmg$ = this.select(this.db$, this.activeMods$, this.state$, selectModsDMG, config)
  public readonly statAbs$ = this.select(this.db$, this.activeMods$, this.state$, selectModsABS, config)
  public readonly statArmor$ = this.select(this.db$, this.activeMods$, this.state$, selectModsArmor, config)
  public readonly statRol$ = this.select(this.activeMods$, this.state$, selectModsROL, config)
  public readonly statCraftGS$ = this.select(this.activeMods$, selectModsCraftingGS, config)
  public readonly statEffectReduction$ = this.select(
    this.db$,
    this.allMods$,
    selectStatusEffectReduction,
    { debounce: true }
  )

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

  public reset() {
    this.patchState({
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
