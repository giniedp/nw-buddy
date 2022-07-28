import { catchError, combineLatest, map, Observable, of, startWith } from "rxjs"
import { TextReader } from "./text-reader"

export function parseNwExpression(text: string, root: boolean = false): NwExp {
  text = text
    // ensure operators and operands have a space separator
    // .replace(/[+-*\/]/g, (it) => ` ${it} `) TODO: does not compile, why?
    .split('*')
    .join(' * ')
    .split('+')
    .join(' + ')
    .split('-')
    .join(' - ')
    // .split('/')
    // .join(' / ')
    // patch bug in expressions, where multiply operator is missing
    .replace(/100\s*\{/, '100 * {')
    // patch bad expressions
    .replace('Type_StatusEffectData.Type_StatusEffectData.', 'Type_StatusEffectData.')
    // collapse spaces
    .replace(/\s+/g, ' ')

  // example:
  //  Base damage is increased by {[GlobalAbilityTable.GlobalPerk_Ability_Sword_WhirlingBlade.BaseDamage * 100] * {perkMultiplier}]}% while performing a Whirling Blade attack if 3 or more enemies are within the radius of the attack.
  if (text.includes(']') && !text.includes('[')) {
    text = text.replace(/\]/, '')
  }
  if (text.includes('[') && !text.includes(']')) {
    text = text.replace(/\[/, '')
  }

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
      .pipe(map((value) => Number(eval(String(value)))))
      .pipe(
        map((value) => {
          if (globalThis.navigator) {
            return Intl.NumberFormat(navigator.language || 'en', {
              maximumFractionDigits: 2,
            }).format(value)
          }
          return value
        })
      )
      .pipe(startWith('⟳'))
      .pipe(
        catchError((e) => {
          console.error(e)
          return '⚠'
        })
      )
  }
}
