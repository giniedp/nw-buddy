import { Observable, of } from 'rxjs'
import { ExpressionResource } from './types'
import { NwDataService } from '~/data'

export function resourceLookup(
  resource: ExpressionResource,
  db: NwDataService
): Observable<Map<string | number, unknown>> {
  switch (resource) {
    case 'AttributeThresholdAbilityTable': {
      return db.abilitiesMap
    }
    case 'Type_StatusEffectData': {
      return db.statusEffectsMap
    }
    case 'DamageTable': {
      return db.damageTableMap
    }
    case 'Type_DamageData': {
      return db.dmgTableEliteAffixMap
    }
    case 'ConsumableItemDefinitions': {
      return db.itemsConsumablesMap
    }
    case 'AffixStatDataTable':
    case 'Type_AffixStatData': {
      return db.affixStatsMap
    }
    case 'Afflictions': {
      return db.afflictionsMap
    }
    case 'ManaCosts_Player': {
      return db.manacostsMap
    }
    case 'StaminaCosts_Player': {
      return db.staminacostsPlayerMap
    }
    case 'SpellDataTable_Bow':
    case 'SpellDataTable_FireMagic':
    case 'SpellDataTable_Global':
    case 'SpellDataTable_GreatAxe':
    case 'SpellDataTable_Greatsword':
    case 'SpellDataTable_Sword':
    case 'SpellDataTable_Hatchet':
    case 'SpellDataTable_IceMagic':
    case 'SpellDataTable_LifeMagic':
    case 'SpellDataTable_Musket':
    case 'SpellDataTable_Runes':
    case 'SpellDataTable_VoidGauntlet':
    case 'SpellDataTable_WarHammer':
    case 'SpellDataTable_Flail': {
      return db.spellsMap
    }
    case 'ArtifactsAbilityTable':
    case 'BlunderbussAbilityTable':
    case 'BowAbilityTable':
    case 'FireMagicAbilityTable':
    case 'GlobalAbilityTable':
    case 'GreatAxeAbilityTable':
    case 'GreatswordAbilityTable':
    case 'HatchetAbilityTable':
    case 'IceMagicAbilityTable':
    case 'LifeMagicAbilityTable':
    case 'MusketAbilityTable':
    case 'RapierAbilityTable':
    case 'SpearAbilityTable':
    case 'SwordAbilityTable':
    case 'FlailAbilityTable':
    case 'PerksAbilityTable':
    case 'Type_AbilityData':
    case 'VoidGauntletAbilityTable':
    case 'WarHammerAbilityTable': {
      return db.abilitiesMap
    }
    case 'LootLimits': {
      return db.lootLimitsMap
    }
    case 'HouseItems': {
      return db.housingItemsMap
    }
    case 'Vitals_Player': {
      return db.vitalsMap
    }
  }
  return of(null)
}
