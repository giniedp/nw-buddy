export type AchievementToken = 'AND' | 'OR' | 'NOT' | 'value' | 'expression'

export interface AchievementExpression {
  type: AchievementToken
  value?: string
  expression?: AchievementExpression[]
}

export function parseAchievementExpression(chars: string): AchievementExpression {
  if (!chars) {
    return null
  }
  const result: AchievementExpression[] = []
  let cursor = 0
  function consume(end: number) {
    if (end > cursor) {
      result.push({
        type: 'value',
        value: chars.slice(cursor, end).trim(),
      })
      cursor = end
    }
  }

  for (let i = 0; i < chars.length; i++) {
    switch (chars[i]) {
      case '(': {
        consume(i)
        const endIndex = findMatchingParenthesis(chars, i)
        const expression = parseAchievementExpression(chars.slice(i + 1, endIndex))
        if (expression) {
          result.push(expression)
        }
        i = endIndex
        cursor = i + 1
        break
      }
      case '&': {
        consume(i)
        if (chars[i + 1] !== '&') {
          throw new Error('Invalid expression')
        }
        i = i + 1
        cursor = i + 1
        result.push({ type: 'AND' })
        break
      }
      case '|': {
        consume(i)
        if (chars[i + 1] !== '|') {
          throw new Error('Invalid expression')
        }
        i = i + 1
        cursor = i + 1
        result.push({ type: 'OR' })
        break
      }
      case '!': {
        consume(i)
        cursor = i + 1
        result.push({ type: 'NOT' })
        break
      }
    }
  }
  consume(chars.length)
  if (result.length === 1) {
    return result[0]
  }
  return {
    type: 'expression',
    expression: result,
  }
}

function findMatchingParenthesis(chars, start) {
  if (chars[start] !== '(') {
    throw new Error('Not a parenthesis')
  }

  let count = 1
  for (let i = start + 1; i < chars.length; i++) {
    if (chars[i] === '(') {
      count++
    } else if (chars[i] === ')') {
      count--
      if (count === 0) {
        return i
      }
    }
  }
  throw new Error('Unmatched parenthesis')
}
