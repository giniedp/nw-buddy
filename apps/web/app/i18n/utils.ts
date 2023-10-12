export function normalizeDictionary(dict: Record<string, string>) {
  const result: Record<string, string> = {}
  for (const key in dict) {
    result[key.toUpperCase()] = dict[key]
  }
  return result
}

export function normalizeLookupKey(key: string): string
export function normalizeLookupKey(key: string[]): string[]
export function normalizeLookupKey(key: string | string[]): string | string[]
export function normalizeLookupKey(key: string | string[]) {
  if (Array.isArray(key)) {
    return key.map((it) => it?.toUpperCase())
  }
  return key?.toUpperCase()
}

export function normalizeLocale(value: string) {
  return String(value || '').toLocaleLowerCase()
}
