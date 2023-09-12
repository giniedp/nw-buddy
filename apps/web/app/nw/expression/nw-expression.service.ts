import { Injectable } from '@angular/core'
import { catchError, map, Observable, of, throwError } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { getPerkMultiplier, parseNwExpression } from '@nw-data/common'
import { NwExpressionContext } from './nw-expression-context.service'

type Expressionresource =
  // | 'AffixStatDataTable'
  // | 'Afflictions'
  // | 'Vitals'
  // //
  // | 'Type_Ability'
  // | 'Type_StatusEffect'
  // | 'StatusEffect'
  // | 'StatusEffects'

  | 'AffixStatDataTable'
  | 'Afflictions'
  | 'ArtifactsAbilityTable' //
  | 'AttributeThresholdAbilityTable'
  | 'BlunderbussAbilityTable'
  | 'BowAbilityTable'
  | 'ConsumableItemDefinitions'
  | 'DamageTable'
  | 'FireMagicAbilityTable'
  | 'FlailAbilityTable' //
  | 'GlobalAbilityTable'
  | 'GreatAxeAbilityTable'
  | 'GreatswordAbilityTable'
  | 'HatchetAbilityTable'
  | 'HouseItems'
  | 'IceMagicAbilityTable'
  | 'LifeMagicAbilityTable'
  | 'LootLimits'
  | 'ManaCosts_Player'
  | 'MusketAbilityTable'
  | 'PerksAbilityTable' //
  | 'RapierAbilityTable'
  | 'SpearAbilityTable'
  | 'SpellDataTable_Bow'
  | 'SpellDataTable_FireMagic'
  | 'SpellDataTable_Flail' //
  | 'SpellDataTable_Global'
  | 'SpellDataTable_GreatAxe'
  | 'SpellDataTable_Greatsword'
  | 'SpellDataTable_Hatchet'
  | 'SpellDataTable_IceMagic'
  | 'SpellDataTable_LifeMagic'
  | 'SpellDataTable_Musket'
  | 'SpellDataTable_Runes'
  | 'SpellDataTable_Sword'
  | 'SpellDataTable_VoidGauntlet'
  | 'SpellDataTable_WarHammer'
  | 'StaminaCosts_Player'
  | 'SwordAbilityTable'
  | 'Type_AbilityData'
  | 'Type_StatusEffectData'
  | 'Type_StatusEffectDataAI_Evil_Knight_Fire_Champion_DangerTick' //+
  | 'Vitals_Player' //
  | 'VoidGauntletAbilityTable'
  | 'WarHammerAbilityTable'
  //
  | 'ConsumablePotency' //-
  | 'perkMultiplier' //-
  | 'Potency' //- unknown
@Injectable({ providedIn: 'root' })
export class NwExpressionService {
  public constructor(private db: NwDbService) {}

  public parse(expression: string) {
    return parseNwExpression(expression)
  }

  public solve(context: NwExpressionContext) {
    return this.parse(context.text)
      .eval((key) => this.lookup(key, context))
      .pipe(map((value) => String(value)))
      .pipe(
        map((value) => {
          return value
            .replace(/\{(amount\d+)\}/gi, (match, key) => {
              console.log(match, key)
              return `<b>${context[key] || ''}</b>`
            })
            .replace(/\{(attribute\d+)\}/gi, (match, key) => {
              console.log(match, key)
              return context[key] || '[TODO]'
            })
        })
      )
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(context.text)
        })
      )
  }

  private lookup(token: string, context: NwExpressionContext): Observable<string | number> {
    if (token.includes('.')) {
      const [resource, id, attr] = token.split('.')
      return this.solveResource(resource as any, token)
        .pipe(
          map((data) => {
            if (!data) {
              throw new Error(`Unknown resource "${resource}" (for token "${token}" in text "${context.text}")`)
            }
            let object: any
            if (data.has(id)) {
              object = data.get(id)
            } else if (data.has(Number(id))) {
              object = data.get(Number(id))
            }
            if (!object) {
              throw new Error(`Object for ID "${id}" not found (for token "${token}" in text "${context.text}")`)
            }
            if (attr in object) {
              return object[attr]
            }
            for (const key of Object.keys(object)) {
              if (key.toLocaleLowerCase() === attr.toLocaleLowerCase()) {
                return object[key]
              }
            }
            throw new Error(`Object has no attribute "${attr}" (for token "${token}" in text "${context.text}")`)
          })
        )
        .pipe(
          map((it) => {
            if (attr.endsWith('VitalsCategory') && String(it).includes('=')) {
              return String(it).split('=')[1]
            } else {
              return it
            }
          })
        )
    }
    switch (token) {
      case 'ConsumablePotency': {
        if (context.ConsumablePotency != null) {
          return of(context.ConsumablePotency)
        }
        return this.db.statusEffectsMap.pipe(
          map((it) => {
            if (it.has(context.itemId)) {
              return it.get(context.itemId).PotencyPerLevel * context.charLevel
            }
            console.error(
              `ConsumablePotency not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`
            )
            return 1
          })
        )
      }
      case 'perkMultiplier':
        if (context.perkMultiplier != null) {
          return of(context.perkMultiplier)
        }
        return this.db.perksMap.pipe(
          map((it) => {
            if (it.has(context.itemId)) {
              return getPerkMultiplier(it.get(context.itemId), context.gearScore)
            }
            throw new Error(
              `perkMultiplier not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`
            )
          })
        )
      default: {
        return throwError(() => new Error(`unknown lookup token: "${token}" in text "${context.text}"`))
      }
    }
  }

  private solveResource(resource: Expressionresource, expression: string): Observable<Map<string | number, unknown>> {
    switch (resource) {
      case 'AttributeThresholdAbilityTable':
        return this.db.abilitiesMap
      case 'Type_StatusEffectData': {
        return this.db.statusEffectsMap
      }
      case 'DamageTable': {
        return this.db.damageTableMap
      }
      case 'ConsumableItemDefinitions': {
        return this.db.itemsConsumablesMap
      }
      case 'AffixStatDataTable': {
        return this.db.affixStatsMap
      }
      case 'Afflictions': {
        return this.db.afflictionsMap
      }
      case 'ManaCosts_Player': {
        return this.db.manacostsMap
      }
      case 'StaminaCosts_Player': {
        return this.db.staminacostsPlayerMap
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
        return this.db.spellsMap
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
        return this.db.abilitiesMap
      }
      case 'LootLimits': {
        return this.db.lootLimitsMap
      }
      case 'HouseItems': {
        return this.db.housingItemsMap
      }
      case 'Vitals_Player': {
        return this.db.vitalsPlayerMap
      }
    }
    return throwError(() => new Error(`unknown resource '${resource}' in expression '${expression}'`))
  }
}
