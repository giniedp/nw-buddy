import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core'
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  ReplaySubject,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs'
import { LocaleService } from '../i18n'
import { NwService } from './nw.service'
import { TextReader } from './text-reader'

interface TextContext {
  text: string
  itemId: string
  charLevel: number
}

@Directive({
  selector: '[nwText]',
})
export class NwTextDirective implements OnInit, OnChanges, OnDestroy {
  @Input()
  public nwText: string

  @Input()
  public itemId: string

  @Input()
  public charLevel: number = 60

  private destroy$ = new Subject()
  private change$ = new ReplaySubject<TextContext>(1)

  public constructor(
    private elRef: ElementRef<HTMLElement>,
    private nw: NwService,
    private utils: NwService,
    private locale: LocaleService
  ) {}

  public ngOnInit(): void {
    combineLatest([this.change$.pipe(distinctUntilChanged()), this.locale.change])
      .pipe(
        map(([context]) => {
          return {
            ...context,
            text: this.utils.translate(context.text),
          }
        })
      )
      .pipe(
        switchMap((context) => {
          return parseExpression(context.text, true)
            .eval((key) => this.lookup(key, context))
            .pipe(
              catchError((err) => {
                console.error(err)
                return of(context.text)
              })
            )
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.elRef.nativeElement.textContent = String(res)
      })
  }

  public ngOnChanges(): void {
    this.change$.next({
      text: this.nwText,
      itemId: this.itemId,
      charLevel: this.charLevel,
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private lookup(expression: string, context: TextContext): Observable<string | number> {
    if (expression.includes('.')) {
      const [resource, id, attr] = expression.split('.')
      return this.solveResource(resource).pipe(map((it) => it?.get(id)?.[attr]))
    }
    switch (expression) {
      case 'ConsumablePotency': {
        return this.nw.db.statusEffectsMap.pipe(
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
        return this.nw.db.perksMap.pipe(
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
        return this.nw.db.statusEffectsMap
      }
      case 'DamageTable': {
        return this.nw.db.damageTableMap
      }
      case 'ConsumableItemDefinitions': {
        return this.nw.db.itemsConsumablesMap
      }
      case 'GlobalAbilityTable': {
        return this.nw.db.abilitiesMap
      }
      case 'AffixStatDataTable': {
        return this.nw.db.affixStatsMap
      }
    }
    return throwError(() => new Error(`unknown resource: ${resource}`))
  }
}

function parseExpression(text: string, root: boolean = false): NwExp {
  const reader = new TextReader(text)
  const expr: NwExp[] = []

  while (reader.canRead) {
    const position = reader.position

    if (reader.substr(2) === '{[') {
      const block = reader.nextBlock('{[', ']}')
      const node = parseExpression(block, false)
      if (!root) {
        throw new Error(`invalid expresssion. Nested '{[' detected`)
      }
      expr.push(new NwExpEval(new NwExpParen('', '', node)))
    } else {
      switch (reader.char) {
        case '{': {
          const block = reader.nextBlock('{', '}')
          const node = parseExpression(block, root)
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
          const node = parseExpression(block, root)
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
            maximumFractionDigits: 2
          }).format(Number(eval(String(value))))
        })
      )
      .pipe(startWith('⟳'))
  }
}
