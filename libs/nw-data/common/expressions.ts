import { catchError, combineLatest, map, Observable, of, startWith } from 'rxjs'
import { TextReader } from './text-reader'

export function parseNwExpression(text: string, skipPreprocess = false): NwExp {
  const expr: NwExp[] = []
  walkNwExpression(text, {
    disablePatch: skipPreprocess,
    onText: (text) => expr.push(parseText(text)),
    onExpression: (lParen, text, rParen) => expr.push(new NwExpEval(parseExpression(text))),
  })
  return new NwExpJoin(expr, '')
}

export function walkNwExpression(text: string, options: {
  disablePatch?: boolean
  onText: (text: string) => void
  onExpression: (lParen: string, text: string, rParen: string) => void
}): void {
  text = text || ''
  if (!options.disablePatch) {
    text = preprocessExpression(text)
  }
  let outside = true
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (outside && exprBegin(text, i)) {
      const value = text.substring(start, i)
      start = i + 2
      outside = !outside
      options.onText(value)
    }
    if (!outside && exprEnd(text, i)) {
      const value = text.substring(start, i)
      start = i + 2
      outside = !outside
      options.onExpression('{[', value, ']}')
    }
  }
  options.onText(text.substring(start, text.length))
}


function exprBegin(text: string, i: number) {
  return text[i] === '{' && text[i + 1] === '['
}
function exprEnd(text: string, i: number) {
  return text[i] === ']' && text[i + 1] === '}'
}

function parseExpression(text: string): NwExp {
  const reader = new TextReader(text)
  const expr: NwExp[] = []
  while (reader.canRead) {
    const position = reader.position
    if (reader.substr(2) === '{[') {
      throw new Error(`invalid expresssion. Nested '{[' detected`)
    } else {
      switch (reader.char) {
        case '{': {
          const block = reader.nextBlock('{', '}')
          const node = parseExpression(block)
          expr.push(new NwExpParen('(', ')', node))
          break
        }
        case '(': {
          const block = reader.nextBlock('(', ')')
          const node = parseExpression(block)
          expr.push(new NwExpParen('(', ')', node))
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
          let token = reader.readUntil(' \t{(*/+-=')
          if (reader.char === '=') {
            console.warn(`skipped assigmnet operation "${token}=" in "${text}"`)
            token = ''
            reader.next()
          }
          else if (reader.char === '-' && reader.peek(-1)?.toLowerCase() === 'e' && reader.peek(1)?.match(/\d/)) {
            token += '-'
            reader.next()
            token += reader.readUntil(' \t{(*/+-')
          }

          if (/^\s*\d+(\.\d+)?([eE]-\d+)?\s*$/.test(token)) {
            // Integer and Floating
            expr.push(new NwExpValue(token))
          } else if (/^\s*.\d+([eE]-\d+)?\s*$/.test(token)) {
            // Floating without leading 0 e.g. .001
            expr.push(new NwExpValue(token))
          } else if (token) {
            expr.push(new NwExpLookup(token))
          } else {
            // skipped
          }
        }
      }
    }
    if (position === reader.position) {
      throw new Error(`expression could not be parsed: "${text}" at position ${reader.position}`)
    }
  }

  return new NwExpJoin(expr, '')
}

function parseText(text: string): NwExp {
  let start = 0
  let outside = true
  const expr: NwExp[] = []
  for (let i = 0; i < text.length; i++) {
    if (outside && text[i] === '{') {
      const value = text.substring(start, i)
      start = i + 1
      outside = !outside
      expr.push(new NwExpValue(value))
    }
    if (!outside && text[i] === '}') {
      const value = text.substring(start, i)
      start = i + 1
      outside = !outside
      expr.push(new NwExpLookup(value))
    }
  }
  expr.push(new NwExpValue(text.substring(start, text.length)))
  return new NwExpJoin(expr, '')
}

function preprocessExpression(text: string) {
  text = text
    // ensure operators and operands have a space separator
    // .replace(/[+-*\/]/g, (it) => ` ${it} `) TODO: does not compile, why?
    // .split('*')
    // .join(' * ')
    // .split('+')
    // .join(' + ')
    // .split('-')
    // .join(' - ')
    // .split('/')
    // .join(' / ')
    // patch bug in expressions, where multiply operator is missing: 100 { => 100 * {
    .replace(/100\s*\{/, '100 * {')
    // patch bug in expressions with random square bracket: * 100] * => * 100 *
    .replace(/ \* 100] \* /, ' * 100 * ')
    // patch bad expression (TODO: does no longer exist?)
    .replace('Type_StatusEffectData.Type_StatusEffectData.', 'Type_StatusEffectData.')
    // patch bad expression with missing dot
    .replace(
      'Type_StatusEffectDataAI_Evil_Knight_Fire_Champion_DangerTick',
      'Type_StatusEffectData.AI_Evil_Knight_Fire_Champion_DangerTick'
    )
    // collapse {[{[ ]}]} to {[ ]}
    .replace(/(\{\[)+/g, '{[')
    .replace(/(\]\})+/, ']}')
    // collapse {{ }} to {}
    .replace(/\{+/g, '{')
    .replace(/\}+/, '}')
    // collapse spaces
    .replace(/\s+/g, ' ')

  if (text.includes('Mut_Voi_Stacks') && text.includes('Mut_Lig_Stacks')) {
    // example:
    //  Filled with dread for {[Type_StatusEffectData.Mut_Lig_Stacks_1_Effect.BaseDuration]} seconds. At {[Type_StatusEffectData.Mut_Voi_Stacks_1_Effect.AddOnStackSize]} stacks, causes a void burst to appear at your location.
    //  (TODO: does no longer exist?)
    text = text.replace('Mut_Lig_Stacks', 'Mut_Voi_Stacks')
  }

  return text
}

export type NwExpSolveFn = (key: string) => Observable<string | number>
export interface NwExp {
  eval: (solve: NwExpSolveFn) => Observable<string | number>
  print: () => string
}

export class NwExpJoin implements NwExp {
  public constructor(public readonly children: NwExp[], private separator = '') {
    //
  }
  public eval(solve: NwExpSolveFn) {
    if (this.children.length) {
      return combineLatest(this.children.map((it) => it.eval(solve))).pipe(map((it) => it.join(this.separator)))
    }
    return of('')
  }
  public print() {
    if (this.children.length) {
      return this.children.map((it) => it.print()).join(this.separator)
    }
    return ''
  }
}

export class NwExpParen implements NwExp {
  public constructor(private lParen: string, private rParen: string, private node: NwExp) {
    //
  }
  public eval(solve: NwExpSolveFn) {
    return this.node.eval(solve).pipe(map((value) => this.lParen + value + this.rParen))
  }
  public print() {
    return this.lParen + this.node.print() + this.rParen
  }
}

export class NwExpValue<T extends string | number> implements NwExp {
  public constructor(private value: T) {
    //
  }
  public eval(solve: NwExpSolveFn) {
    return of(this.value)
  }
  public print() {
    return String(this.value)
  }
}

export class NwExpLookup implements NwExp {
  public constructor(private value: string) {
    //
  }
  public eval(solve: NwExpSolveFn) {
    return solve(this.value?.trim()).pipe(
      catchError((e) => {
        console.error(e)
        return '⚠'
      })
    )
  }
  public print() {
    return String(this.value)
  }
}

export class NwExpEval implements NwExp {
  public constructor(private node: NwExp) {
    //
  }
  public eval(solve: NwExpSolveFn) {
    return this.node
      .eval(solve)
      .pipe(
        map((value) => {
          return Number(eval(String(value)))
        })
      )
      .pipe(
        map((value) => {
          if (globalThis.navigator && typeof value === 'number') {
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
  public print() {
    return this.node.print()
  }
}
