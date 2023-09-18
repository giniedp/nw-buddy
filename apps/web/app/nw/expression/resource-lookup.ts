import { Observable, of } from 'rxjs'
import { ExpressionResource } from './types'
import { NwDbService } from '../nw-db.service'

export function resourceLookup(
  resource: ExpressionResource,
  db: NwDbService
): Observable<Map<string | number, unknown>> {
  switch (resource) {
    case ExpressionResource.AttributeThresholdAbilityTable: {
      return db.abilitiesMap
    }
    case ExpressionResource.Type_StatusEffectData: {
      return db.statusEffectsMap
    }
    case ExpressionResource.DamageTable: {
      return db.damageTableMap
    }
    case ExpressionResource.ConsumableItemDefinitions: {
      return db.itemsConsumablesMap
    }
    case ExpressionResource.AffixStatDataTable: {
      return db.affixStatsMap
    }
    case ExpressionResource.Afflictions: {
      return db.afflictionsMap
    }
    case ExpressionResource.ManaCosts_Player: {
      return db.manacostsMap
    }
    case ExpressionResource.StaminaCosts_Player: {
      return db.staminacostsPlayerMap
    }
    case ExpressionResource.SpellDataTable_Bow:
    case ExpressionResource.SpellDataTable_FireMagic:
    case ExpressionResource.SpellDataTable_Global:
    case ExpressionResource.SpellDataTable_GreatAxe:
    case ExpressionResource.SpellDataTable_Greatsword:
    case ExpressionResource.SpellDataTable_Sword:
    case ExpressionResource.SpellDataTable_Hatchet:
    case ExpressionResource.SpellDataTable_IceMagic:
    case ExpressionResource.SpellDataTable_LifeMagic:
    case ExpressionResource.SpellDataTable_Musket:
    case ExpressionResource.SpellDataTable_Runes:
    case ExpressionResource.SpellDataTable_VoidGauntlet:
    case ExpressionResource.SpellDataTable_WarHammer:
    case ExpressionResource.SpellDataTable_Flail: {
      return db.spellsMap
    }
    case ExpressionResource.ArtifactsAbilityTable:
    case ExpressionResource.BlunderbussAbilityTable:
    case ExpressionResource.BowAbilityTable:
    case ExpressionResource.FireMagicAbilityTable:
    case ExpressionResource.GlobalAbilityTable:
    case ExpressionResource.GreatAxeAbilityTable:
    case ExpressionResource.GreatswordAbilityTable:
    case ExpressionResource.HatchetAbilityTable:
    case ExpressionResource.IceMagicAbilityTable:
    case ExpressionResource.LifeMagicAbilityTable:
    case ExpressionResource.MusketAbilityTable:
    case ExpressionResource.RapierAbilityTable:
    case ExpressionResource.SpearAbilityTable:
    case ExpressionResource.SwordAbilityTable:
    case ExpressionResource.FlailAbilityTable:
    case ExpressionResource.PerksAbilityTable:
    case ExpressionResource.Type_AbilityData:
    case ExpressionResource.VoidGauntletAbilityTable:
    case ExpressionResource.WarHammerAbilityTable: {
      return db.abilitiesMap
    }
    case ExpressionResource.LootLimits: {
      return db.lootLimitsMap
    }
    case ExpressionResource.HouseItems: {
      return db.housingItemsMap
    }
    case ExpressionResource.Vitals_Player: {
      return db.vitalsPlayerMap
    }
  }
  return of(null)
}
