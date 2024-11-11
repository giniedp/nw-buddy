import { NwData } from '@nw-data/db'
import { Observable, of } from 'rxjs'
import { ExpressionResource } from './types'

export async function resourceLookup(resource: ExpressionResource, db: NwData): Promise<Map<string | number, unknown>> {
  switch (resource) {
    case 'AttributeThresholdAbilityTable': {
      return db.abilitiesByIdMap()
    }
    case 'Type_StatusEffectData': {
      return db.statusEffectsByIdMap()
    }
    case 'DamageTable': {
      return db.damageTablesByIdMap()
    }
    // case 'Type_DamageData': {
    //   return db.dmgTableEliteAffixMap
    // }
    case 'ConsumableItemDefinitions': {
      return db.consumableItemsByIdMap()
    }
    case 'AffixStatDataTable':
    case 'Type_AffixStatData': {
      return db.affixStatsByIdMap()
    }
    case 'Afflictions': {
      return db.afflictionsByIdMap()
    }
    case 'ManaCosts_Player': {
      return db.manaCostsByIdMap()
    }
    case 'StaminaCosts_Player': {
      return db.staminaDataByIdMap()
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
      return db.spellsByIdMap()
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
      return db.abilitiesByIdMap()
    }
    case 'LootLimits': {
      return db.lootLimitsByIdMap()
    }
    case 'HouseItems': {
      return db.housingItemsByIdMap()
    }
    case 'Vitals_Player': {
      return db.vitalsByIdMap()
    }
  }
  return null
}
