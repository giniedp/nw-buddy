import { Injectable } from '@angular/core'
import { catchError, combineLatest, map, Observable, of, startWith, throwError } from 'rxjs'
import { NwDbService } from './nw-db.service'
import { TextReader } from './text-reader'

export interface NwExpressionContext {
  text: string
  itemId: string
  charLevel: number
  gearScore: number
}

type Expressionresource =
  | 'AffixStatDataTable'
  | 'Afflictions'
  | 'ConsumableItemDefinitions'
  | 'DamageTable'
  | 'ManaCosts_Player'
  | 'StaminaCosts_Player'
  | 'Type_AbilityData'
  | 'StatusEffect'
  | 'StatusEffects'
  | 'Type_StatusEffectData'
  | 'BlunderbussAbilityTable'
  | 'BowAbilityTable'
  | 'FireMagicAbilityTable'
  | 'GlobalAbilityTable'
  | 'GreatAxeAbilityTable'
  | 'HatchetAbilityTable'
  | 'IceMagicAbilityTable'
  | 'LifeMagicAbilityTable'
  | 'MusketAbilityTable'
  | 'RapierAbilityTable'
  | 'SpearAbilityTable'
  | 'SwordAbilityTable'
  | 'VoidGauntletAbilityTable'
  | 'WarHammerAbilityTable'
  | 'SpellDataTable_Bow'
  | 'SpellDataTable_Global'
  | 'SpellDataTable_GreatAxe'
  | 'SpellDataTable_Hatchet'
  | 'SpellDataTable_IceMagic'
  | 'SpellDataTable_Musket'
  | 'SpellDataTable_VoidGauntlet'
  | 'SpellDataTable_WarHammer'
  | 'SpellDataTable_FireMagic'
  | 'SpellDataTable_LifeMagic'
  | 'ConsumablePotency'
  | 'perkMultiplier'

@Injectable({ providedIn: 'root' })
export class NwExpressionService {
  public constructor(private db: NwDbService) {}

  public parse(expression: string) {
    return parseNwExpression(expression, true)
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

  private lookup(expression: string, context: NwExpressionContext): Observable<string | number> {
    if (expression.includes('.')) {
      const [resource, id, attr] = expression.split('.')
      return this.solveResource(resource as any).pipe(
        map((data) => {
          if (!data) {
            throw new Error(`Unknown resource "${resource}" (for expression "${expression}")`)
          }
          let object: any
          if (data.has(id)) {
            object = data.get(id)
          } else if (data.has(Number(id))) {
            object = data.get(Number(id))
          }
          if (!object) {
            throw new Error(`Object for ID "${id}" not found (for expression "${expression}")`)
          }
          if (attr in object) {
            return object[attr]
          }
          for (const key of Object.keys(object)) {
            if (key.toLocaleLowerCase() === attr.toLocaleLowerCase()) {
              return object[key]
            }
          }
          console.log(object)
          throw new Error(`Object has no attribute "${attr}" (for expression "${expression}")`)
        })
      ).pipe(map((it) => {
        if (attr.endsWith('VitalsCategory') && String(it).includes('=')) {
          return String(it).split('=')[1]
        } else {
          return it
        }

      }))
    }
    switch (expression) {
      case 'ConsumablePotency': {
        return this.db.statusEffectsMap.pipe(
          map((it) => {
            if (it.has(context.itemId)) {
              return it.get(context.itemId).PotencyPerLevel * context.charLevel
            }
            console.error(`ConsumablePotency not resolved (for expression "${expression}" and id "${context.itemId}")`)
            return 1
          })
        )
      }
      case 'perkMultiplier':
        return this.db.perksMap.pipe(
          map((it) => {
            if (it.has(context.itemId)) {
              return it.get(context.itemId).ScalingPerGearScore * Math.max(0, context.gearScore - 100) + 1
            }
            throw new Error(`perkMultiplier not resolved (for expression "${expression}" and id "${context.itemId}")`)
          })
        )
      default: {
        return throwError(() => new Error(`unknown lookup expression: "${expression}"`))
      }
    }
  }

  private solveResource(resource: Expressionresource): Observable<Map<string | number, unknown>> {
    switch (resource) {
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
      case 'SpellDataTable_Global':
      case 'SpellDataTable_GreatAxe':
      case 'SpellDataTable_Hatchet':
      case 'SpellDataTable_IceMagic':
      case 'SpellDataTable_Musket':
      case 'SpellDataTable_VoidGauntlet':
      case 'SpellDataTable_WarHammer':
      case 'SpellDataTable_FireMagic':
      case 'SpellDataTable_LifeMagic': {
        return this.db.spellTableMap
      }
      case 'Type_AbilityData':
      case 'BlunderbussAbilityTable':
      case 'BowAbilityTable':
      case 'FireMagicAbilityTable':
      case 'GlobalAbilityTable':
      case 'GreatAxeAbilityTable':
      case 'HatchetAbilityTable':
      case 'IceMagicAbilityTable':
      case 'LifeMagicAbilityTable':
      case 'MusketAbilityTable':
      case 'RapierAbilityTable':
      case 'SpearAbilityTable':
      case 'SwordAbilityTable':
      case 'VoidGauntletAbilityTable':
      case 'WarHammerAbilityTable': {
        return this.db.abilitiesMap
      }
      case 'StatusEffect':
      case 'StatusEffects':
      case 'Type_StatusEffectData': {
        return this.db.statusEffectsMap
      }
    }
    return throwError(() => new Error(`unknown resource: ${resource}`))
  }
}

export function parseNwExpression(text: string, root: boolean = false): NwExp {
  text = text
    // ensure operators and operands have a space separator
    // .replace(/[+-*\/]/g, (it) => ` ${it} `) TODO: does not compile, why?
    .split('*').join(' * ')
    .split('+').join(' + ')
    .split('-').join(' - ')
    .split('/').join(' / ')
    // patch bug in expressions, where multiply operator is missing
    .replace(/100\s*\{/, '100 * {')
    // patch bad expressions
    .replace('Type_StatusEffectData.Type_StatusEffectData.', 'Type_StatusEffectData.')
    // collapse spaces
    .replace(/\s+/g, ' ')


  if (text.includes('Mut_Voi_Stacks') && text.includes('Mut_Lig_Stacks')) {
    // example:
    //  Filled with dread for {[Type_StatusEffectData.Mut_Lig_Stacks_1_Effect.BaseDuration]} seconds. At {[Type_StatusEffectData.Mut_Voi_Stacks_1_Effect.AddOnStackSize]} stacks, causes a void burst to appear at your location.
    text = text.replace('Mut_Lig_Stacks', 'Mut_Voi_Stacks')
  }

  const reader = new TextReader(text)
  const expr: NwExp[] = []

  while (reader.canRead) {
    const position = reader.position

    if (reader.substr(2) === '{[') {
      const block = reader.nextBlock('{[', ']}')
      const node = parseNwExpression(block, false)
      if (!root) {
        throw new Error(`invalid expresssion. Nested '{[' detected`)
      }
      expr.push(new NwExpEval(new NwExpParen('', '', node)))
    } else {
      switch (reader.char) {
        case '{': {
          const block = reader.nextBlock('{', '}')
          const node = parseNwExpression(block, root)
          if (root) {
            expr.push(new NwExpParen('{', '}', node))
          } else {
            expr.push(new NwExpParen('(', ')', node))
          }
          reader.next()
          break
        }
        case '(': {
          const block = reader.nextBlock('(', ')')
          const node = parseNwExpression(block, root)
          expr.push(new NwExpParen('(', ')', node))
          reader.next()
          break
        }
        case '*':
        case '/':
        case '+':
        case '-':
        case ' ':
          expr.push(new NwExpValue(reader.char))
          reader.next()
          break
        default: {
          const token = reader.nextToken()
          if (root || /^\d+(\.\d+)?$/.test(token)) {
            expr.push(new NwExpValue(token))
          } else {
            expr.push(new NwExpLookup(token))
          }
        }
      }
    }
    if (position === reader.position) {
      throw new Error(`expression could not be parsed: "${text}" at position ${reader.position}`)
    }
  }
  return new NwExpJoin(expr, ' ')
}

type solveFn = (key: string) => Observable<string | number>
interface NwExp {
  eval: (solve: solveFn) => Observable<string | number>
}

class NwExpJoin implements NwExp {
  public constructor(private children: NwExp[], private separator = '') {
    //
  }
  public eval(solve: solveFn) {
    return combineLatest(this.children.map((it) => it.eval(solve))).pipe(map((it) => it.join(this.separator)))
  }
}

class NwExpParen implements NwExp {
  public constructor(private lParen: string, private rParen: string, private node: NwExp) {
    //
  }
  public eval(solve: solveFn) {
    return this.node.eval(solve).pipe(map((value) => this.lParen + value + this.rParen))
  }
}

class NwExpValue<T extends string | number> implements NwExp {
  public constructor(private value: T) {
    //
  }
  public eval(solve: solveFn) {
    return of(this.value)
  }
}

class NwExpLookup implements NwExp {
  public constructor(private value: string) {
    //
  }
  public eval(solve: solveFn) {
    return solve(this.value)
  }
}

class NwExpEval implements NwExp {
  public constructor(private node: NwExp) {
    //
  }
  public eval(solve: solveFn) {
    return this.node
      .eval(solve)
      .pipe(
        map((value) => {

          if (globalThis.navigator) {
            try {
              return Intl.NumberFormat(navigator.language || 'en', {
                maximumFractionDigits: 2,
              }).format(Number(eval(String(value))))
            } catch (e) {
              console.log(value)
              throw e
            }
          }
          return value
        })
      )
      .pipe(startWith('⟳'))
  }
}
