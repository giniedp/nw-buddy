import { eqCaseInsensitive } from '~/utils'

export function isBlank(a: unknown, b: string): boolean {
  return !a
}

export function equals(a: unknown, b: string): boolean {
  if (typeof a === 'string') {
    return eqCaseInsensitive(a, b)
  }
  return a == b // HINT: == is intentional
}

export function notEquals(a: unknown, b: string): boolean {
  return !equals(a, b)
}

export function greaterThan(a: unknown, b: string): boolean {
  if (typeof a === 'string') {
    return a.toLocaleLowerCase() > b
  }
  if (typeof a === 'number') {
    return a > Number(b)
  }
  return a > b
}

export function greaterThanOrEquals(a: unknown, b: string): boolean {
  if (typeof a === 'string') {
    return a.toLocaleLowerCase() >= b
  }
  if (typeof a === 'number') {
    return a >= Number(b)
  }
  return a >= b
}

export function lessThan(a: unknown, b: string): boolean {
  if (typeof a === 'string') {
    return a.toLocaleLowerCase() < b
  }
  if (typeof a === 'number') {
    return a < Number(b)
  }
  return a < b
}

export function lessThanOrEquals(a: unknown, b: string): boolean {
  if (typeof a === 'string') {
    return a.toLocaleLowerCase() <= b
  }
  if (typeof a === 'number') {
    return a <= Number(b)
  }
  return a <= b
}

export function isIn(a: unknown, b: string): boolean {
  if (a == null || Array.isArray(a)) {
    return false
  }
  return b.includes(String(a))
}

export function contains(a: unknown, b: string): boolean {
  if (Array.isArray(a)) {
    return a.some((it) => eqCaseInsensitive(it, b))
  }
  if (typeof a === 'string') {
    return a.toLocaleLowerCase().includes(b)
  }
  return false
}

export function startsWith(a: unknown, b: string): boolean {
  if (a == null || a == '') {
    return false
  }
  if (Array.isArray(a)) {
    return a.some((it) => String(it).toLocaleLowerCase().startsWith(b.toLocaleLowerCase()))
  }
  return String(a).toLocaleLowerCase().startsWith(b.toLocaleLowerCase())
}

export function endsWith(a: unknown, b: string): boolean {
  if (a == null || a == '') {
    return false
  }
  if (Array.isArray(a)) {
    return a.some((it) => String(it).toLocaleLowerCase().endsWith(b.toLocaleLowerCase()))
  }
  return String(a).toLocaleLowerCase().endsWith(b.toLocaleLowerCase())
}

export function matches(a: unknown, b: string): boolean {
  if (a == null) {
    return false
  }
  if (Array.isArray(a)) {
    return a.some((it) => String(it).match(b))
  }
  return !!String(a).match(b)
}

export const EXPRESSION_OPERATORS = [
  {
    id: 'eq',
    label: '==',
    apply: equals,
  },
  {
    id: 'gt',
    label: '>',
    apply: greaterThan,
  },
  {
    id: 'gte',
    label: '>=',
    apply: greaterThanOrEquals,
  },
  {
    id: 'lt',
    label: '<',
    apply: lessThan,
  },
  {
    id: 'lte',
    label: '<=',
    apply: lessThanOrEquals,
  },
  {
    id: 'blank',
    label: 'blank',
    apply: isBlank,
  },
  {
    id: 'in',
    label: 'in',
    apply: isIn,
  },
  {
    id: 'contains',
    label: 'contains',
    apply: contains,
  },
  {
    id: 'startsWith',
    label: 'starts with',
    apply: startsWith,
  },
  {
    id: 'endsWith',
    label: 'ends with',
    apply: endsWith,
  },
  {
    id: 'matches',
    label: 'matches',
    apply: matches,
  },
]
