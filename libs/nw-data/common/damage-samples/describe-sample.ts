import type { calculateDamage } from '../damage'
export function descriveSample(arg: Parameters<typeof calculateDamage>[0]) {
  return collectValues(arg)
}

function collectValues(it: object) {
  const values: any[] = []
  for (const key in it) {
    const value = it[key]
    if (typeof value === 'object') {
      values.push('{' + collectValues(value) + '}')
    } else {
      values.push(it[key])
    }
  }
  return values.join(' ')
}
