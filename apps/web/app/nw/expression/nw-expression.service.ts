import { Injectable } from '@angular/core'
import { catchError, map, Observable, of, throwError } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { getPerkMultiplier, parseNwExpression } from '../utils'

export interface NwExpressionContext {
  text: string
  itemId?: string
  charLevel: number
  gearScore: number
  ConsumablePotency?: number
  perkMultiplier?: number
}

type Expressionresource =
  | 'AffixStatDataTable'
  | 'Afflictions'
  | 'BlunderbussAbilityTable'
  | 'BowAbilityTable'
  | 'ConsumableItemDefinitions'
  | 'DamageTable'
  | 'FireMagicAbilityTable'
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
  | 'RapierAbilityTable'
  | 'SpearAbilityTable'
  | 'SpellDataTable_Bow'
  | 'SpellDataTable_FireMagic'
  | 'SpellDataTable_Global'
  | 'SpellDataTable_GreatAxe'
  | 'SpellDataTable_Greatsword'
  | 'SpellDataTable_Hatchet'
  | 'SpellDataTable_IceMagic'
  | 'SpellDataTable_LifeMagic'
  | 'SpellDataTable_Musket'
  | 'SpellDataTable_Runes'
  | 'SpellDataTable_VoidGauntlet'
  | 'SpellDataTable_WarHammer'
  | 'StaminaCosts_Player'
  | 'SwordAbilityTable'
  | 'Type_AbilityData'
  | 'Type_StatusEffectData'
  | 'VoidGauntletAbilityTable'
  | 'WarHammerAbilityTable'
  //
  | 'Type_Ability'
  | 'Type_StatusEffect'
  | 'StatusEffect'
  | 'StatusEffects'
  | 'ConsumablePotency'
  | 'perkMultiplier'

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
            console.error(`ConsumablePotency not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`)
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
            throw new Error(`perkMultiplier not resolved (for token "${token}" and id "${context.itemId}" in text "${context.text}")`)
          })
        )
      default: {
        return throwError(() => new Error(`unknown lookup token: "${token}" in text "${context.text}"`))
      }
    }
  }

  private solveResource(resource: Expressionresource, expression: string): Observable<Map<string | number, unknown>> {
    switch (resource) {
      case 'Type_StatusEffectData':
      case 'Type_StatusEffect': {
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
      case 'SpellDataTable_Hatchet':
      case 'SpellDataTable_IceMagic':
      case 'SpellDataTable_LifeMagic':
      case 'SpellDataTable_Musket':
      case 'SpellDataTable_Runes':
      case 'SpellDataTable_VoidGauntlet':
      case 'SpellDataTable_WarHammer': {
        return this.db.spellTableMap
      }
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
      case 'Type_Ability':
      case 'Type_AbilityData':
      case 'VoidGauntletAbilityTable':
      case 'WarHammerAbilityTable': {
        return this.db.abilitiesMap
      }
      case 'StatusEffect':
      case 'StatusEffects':
      case 'Type_StatusEffectData': {
        return this.db.statusEffectsMap
      }
      case 'LootLimits': {
        return this.db.lootLimitsMap
      }
      case 'HouseItems': {
        return this.db.housingItemsMap
      }
    }
    return throwError(() => new Error(`unknown resource '${resource}' in expression '${expression}'`))
  }
}
