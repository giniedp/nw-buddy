import { Injectable } from '@angular/core'
import { catchError, combineLatest, map, Observable, of, startWith, throwError } from 'rxjs'
import { NwDbService } from './nw-db.service'
import { TextReader } from './text-reader'

export interface NwExpressionContext {
  text: string
  itemId: string
  charLevel: number
}

@Injectable({ providedIn: 'root'})
export class NwExpressionService {
  public constructor(private db: NwDbService) {}

  public parse(expression: string) {
    return parsNwExpression(expression, true)
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
      return this.solveResource(resource).pipe(map((it) => it?.get(id)?.[attr]))
    }
    switch (expression) {
      case 'ConsumablePotency': {
        return this.db.statusEffectsMap.pipe(
          map((it) => {
            const effect = it.get(context.itemId)
            if (!effect) {
              console.warn(`ConsumablePotency not resolved for ID ${context.itemId} (${context.text})`)
              return 1
            }
            return effect.PotencyPerLevel * context.charLevel
          })
        )
      }
      case 'perkMultiplier':
        return this.db.perksMap.pipe(
          map((it) => {
            const perk = it.get(context.itemId)
            if (!perk) {
              console.warn(`perkMultiplier not resolved for ID ${context.itemId} (${context.text})`)
              return 1
            }
            return perk.ScalingPerGearScore * context.charLevel
          })
        )
      case 'perkMultip': {
        console.warn(`${expression} not yet known. (${context.text})`)
        return of(1)
      }
      default: {
        return throwError(() => new Error(`unknown lookup expression: ${expression}`))
      }
    }
  }

  private solveResource(resource: string): Observable<Map<string, unknown>> {
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
      case 'GlobalAbilityTable': {
        return this.db.abilitiesMap
      }
      case 'AffixStatDataTable': {
        return this.db.affixStatsMap
      }
    }
    return throwError(() => new Error(`unknown resource: ${resource}`))
  }
}

export function parsNwExpression(text: string, root: boolean = false): NwExp {
  const reader = new TextReader(text)
  const expr: NwExp[] = []

  while (reader.canRead) {
    const position = reader.position

    if (reader.substr(2) === '{[') {
      const block = reader.nextBlock('{[', ']}')
      const node = parsNwExpression(block, false)
      if (!root) {
        throw new Error(`invalid expresssion. Nested '{[' detected`)
      }
      expr.push(new NwExpEval(new NwExpParen('', '', node)))
    } else {
      switch (reader.char) {
        case '{': {
          const block = reader.nextBlock('{', '}')
          const node = parsNwExpression(block, root)
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
          const node = parsNwExpression(block, root)
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
          return Intl.NumberFormat(navigator.language || 'en', {
            maximumFractionDigits: 2,
          }).format(Number(eval(String(value))))
        })
      )
      .pipe(startWith('⟳'))
  }
}
