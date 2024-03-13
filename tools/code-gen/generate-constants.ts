export function generateConstants(input: Record<string, any>) {
  return Object.entries(input).map(([key, value]) => {
    let v = JSON.stringify(value)
    if (typeof value === 'object') {
      v = `Object.freeze(${v})`
    }
    return `export const ${key} = ${v}`
  }).join('\n')
}
