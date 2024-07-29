export interface PropertyGridEntry<T = any, K extends keyof T = keyof T> {
  key: K
  value: T[K]
  valueType: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function'
}
