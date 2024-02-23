import { Injectable, computed, inject } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { NwDataService } from '~/data'
import { selectSignal } from '~/utils'
import { selectElementalArmor, selectModsArmor, selectPhysicalArmor } from './mods/armoring'
import { selectModsABS } from './mods/mods-abs'
import { selectModsArmorPenetration } from './mods/mods-armor-penetration'
import { selectModsCooldown } from './mods/mods-cooldowns'
import { selectModsCraftingGS } from './mods/mods-crafting-gs'
import { selectModsCrit } from './mods/mods-crit'
import {
  selectDamageCoef,
  selectModAmmo,
  selectModBaseDamage,
  selectModBaseDamageConversion,
  selectPvpBalance,
} from './mods/mods-damage'
import { selectModsDMG } from './mods/mods-dmg'
import { selectModsEFF, selectModsMULT } from './mods/mods-eff'
import { selectModsEffectReduction } from './mods/mods-effect-reduction'
import { selectModsEXP } from './mods/mods-exp'
import { selectModMaxHealth } from './mods/mods-max-health'
import { selectModMaxMana } from './mods/mods-max-mana'
import { selectModMaxStamina } from './mods/mods-max-stamina'
import { selectModsROL } from './mods/mods-rol'
import { selectModsThreat } from './mods/mods-threat'
import { selectModsWKN } from './mods/mods-wkn'
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
  selectEquipLoadBonus,
  selectEquipLoadCategory,
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
import { ActiveMods, DbSlice, MannequinState } from './types'

@Injectable()
export class Mannequin {
  private db = inject(NwDataService)

  public readonly state = signalState<MannequinState>({
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

  public readonly data = selectSignal<DbSlice>(
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
      damagaTable: this.db.damageTables0,
      pvpBalanceArena: this.db.data.pvpbalancetablesPvpbalanceArena(),
      pvpBalanceOpenworld: this.db.data.pvpbalancetablesPvpbalanceOpenworld(),
      pvpBalanceOutpostrush: this.db.data.pvpbalancetablesPvpbalanceOutpostrush(),
      pvpBalanceWar: this.db.data.pvpbalancetablesPvpbalanceWar(),
    },
    (it) => {
      return {
        items: it?.items ?? new Map(),
        housings: it?.housings ?? new Map(),
        weapons: it?.weapons ?? new Map(),
        runes: it?.runes ?? new Map(),
        armors: it?.armors ?? new Map(),
        ammos: it?.ammos ?? new Map(),
        consumables: it?.consumables ?? new Map(),
        perks: it?.perks ?? new Map(),
        effects: it?.effects ?? new Map(),
        effectCategories: it?.effectCategories ?? new Map(),
        abilities: it?.abilities ?? new Map(),
        affixes: it?.affixes ?? new Map(),
        attrStr: it?.attrStr ?? [],
        attrDex: it?.attrDex ?? [],
        attrInt: it?.attrInt ?? [],
        attrFoc: it?.attrFoc ?? [],
        attrCon: it?.attrCon ?? [],
        cooldowns: it?.cooldowns ?? new Map(),
        damagaTable: it?.damagaTable ?? [],
        pvpBalanceArena: it?.pvpBalanceArena ?? [],
        pvpBalanceOpenworld: it?.pvpBalanceOpenworld ?? [],
        pvpBalanceOutpostrush: it?.pvpBalanceOutpostrush ?? [],
        pvpBalanceWar: it?.pvpBalanceWar ?? [],
      }
    },
  )

  public readonly dbReady = computed(() => !!this.data())

  public readonly level = computed(() => this.state().level)
  public readonly myHpPercent = computed(() => this.state().myHealthPercent)
  public readonly myManaPercent = computed(() => this.state().myManaPercent)
  public readonly myStaminaPercent = computed(() => this.state().myStaminaPercent)
  public readonly numAroundMe = computed(() => this.state().numAroundMe)
  public readonly numHits = computed(() => this.state().numHits)
  public readonly combatMode = computed(() => this.state().combatMode || 'pve')
  public readonly isPvP = computed(() => this.combatMode() !== 'pve')
  public readonly isPvE = computed(() => this.combatMode() !== 'pve')
  public readonly gearScore = computed(() => selectGearScore(this.equippedItems(), this.level()))
  public readonly equippedItems = computed(() => this.state().equippedItems)

  public readonly equippedArmor = computed(() => selectEquppedArmor(this.data(), this.equippedItems()))
  public readonly equippedWeapons = computed(() => selectEquppedWeapons(this.data(), this.equippedItems()))
  public readonly equippedConsumables = computed(() => selectEquppedConsumables(this.data(), this.equippedItems()))
  public readonly equippedTools = computed(() => selectEquppedTools(this.data(), this.equippedItems()))
  public readonly equippedTrophies = computed(() => selectPlacedHousings(this.data(), this.equippedItems()))

  public readonly activeConsumables = computed(() => selectActiveConsumables(this.data(), this.equippedItems()))
  public readonly consumableEffects = computed(() => selectConsumableEffects(this.data(), this.equippedItems()))

  public readonly activeWeapon = computed(() => {
    return selectActiveWeapon(this.data(), this.state())
  })
  public readonly activeWeaponAttacks = computed(() => {
    return selectWeaponAttacks(this.data(), this.activeWeapon())
  })
  public readonly activeWeaponAbilities = computed(() => {
    return selectWeaponAbilities(this.data(), this.state(), this.activeWeapon())
  })
  public readonly activeDamageTableRow = computed(() => {
    return selectDamageTableRow(this.activeWeaponAttacks(), this.state())
  })
  public readonly activePerks = computed(() => {
    return selectActivePerks(this.data(), this.state(), this.activeWeapon())
  })
  public readonly equipLoad = computed(() => {
    return selectEquipLoad(this.data(), this.state(), this.activePerks())
  })
  public readonly equipLoadCategory = computed(() => {
    return selectEquipLoadCategory(this.equipLoad())
  })
  public readonly activeBonuses = computed(() => {
    return selectEquipLoadBonus(this.equipLoad())
  })
  public readonly activeAttributes = computed(() => {
    return selectAttributes(this.data(), this.state(), {
      perks: this.activePerks(),
      effects: this.consumableEffects(),
    })
  })
  public readonly activeMagnify = computed(() => {
    return selectPlacingMods(this.data(), {
      perks: this.activePerks(),
      effects: this.consumableEffects(),
    })
  })
  public readonly activeAbilities = computed(() => {
    const result = selectActiveAbilities(
      this.data(),
      this.state(),
      this.activeAttributes(),
      this.activeWeapon(),
      this.activeDamageTableRow(),
      this.activePerks(),
      this.equipLoadCategory()
    )
    return result
  })
  public readonly allAbilities = computed(() => {
    const result = selectAllAbilities(
      this.data(),
      this.state(),
      this.activeAttributes(),
      this.activeWeapon(),
      this.activePerks(),
    )

    return result
  })
  public readonly activeEffects = computed(() => {
    const result = selectActveEffects(this.data(), this.state(), this.activePerks())
    return result
  })
  public readonly activeMods = computed<ActiveMods>(() => {
    return {
      bonuses: this.activeBonuses(),
      attributes: this.activeAttributes(),
      abilities: this.activeAbilities(),
      effects: this.activeEffects(),
      perks: this.activePerks(),
      consumables: this.activeConsumables(),
    }
  })
  public readonly allMods = computed<ActiveMods>(() => {
    return {
      bonuses: this.activeBonuses(),
      attributes: this.activeAttributes(),
      abilities: this.allAbilities(),
      effects: this.activeEffects(),
      perks: this.activePerks(),
      consumables: this.activeConsumables(),
    }
  })

  public readonly statRatingElemental = computed(() => {
    return selectElementalArmor(this.data(), this.activeMods(), this.state())
  })

  public readonly statRatingPhysical = computed(() => {
    return selectPhysicalArmor(this.data(), this.activeMods(), this.state())
  })

  public readonly modCooldownReduction = computed(() => selectModsCooldown(this.activeConsumables(), this.allMods()))
  public readonly modEffectReduction = computed(() => selectModsEffectReduction(this.activeMods()))

  public readonly modMaxHealth = computed(() => selectModMaxHealth(this.data(), this.activeMods(), this.state()))
  public readonly modMaxMana = computed(() => selectModMaxMana(this.activeMods()))
  public readonly modMaxStamina = computed(() => selectModMaxStamina(this.activeMods()))

  public readonly modEXP = computed(() => selectModsEXP(this.activeMods()))
  public readonly modEFF = computed(() => selectModsEFF(this.activeMods()))
  public readonly modMULT = computed(() => selectModsMULT(this.activeMods()))
  public readonly modROL = computed(() => selectModsROL(this.activeMods()))
  public readonly modCraftGS = computed(() => selectModsCraftingGS(this.activeMods()))

  public readonly modWKN = computed(() => selectModsWKN(this.activeMods()))
  public readonly modDMG = computed(() => selectModsDMG(this.data(), this.activeMods()))
  public readonly modABS = computed(() => selectModsABS(this.data(), this.activeMods()))
  public readonly modArmor = computed(() => selectModsArmor(this.data(), this.activeMods(), this.state()))

  public readonly modPvP = computed(() => selectPvpBalance(this.data(), this.state(), this.activeWeapon()))
  public readonly modAmmo = computed(() => selectModAmmo(this.activeWeapon()))
  public readonly modCrit = computed(() => selectModsCrit(this.activeMods(), this.activeWeapon()))
  public readonly modBaseDamage = computed(() => selectModBaseDamage(this.activeMods(), this.activeDamageTableRow()))
  public readonly modBaseConversion = computed(() =>
    selectModBaseDamageConversion(this.activeMods(), this.activeWeapon()),
  )

  public readonly modThreat = computed(() => selectModsThreat(this.activeMods()))
  public readonly modArmorPenetration = computed(() => selectModsArmorPenetration(this.activeMods()))
  public readonly modDmgCoef = computed(() => selectDamageCoef(this.activeDamageTableRow()))

  public reset() {
    patchState(this.state, {
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
