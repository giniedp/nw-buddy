export function matchMapTo<T extends string, V>(value: T, map: Partial<Record<T, V>>): V {
  return map?.[value]
}
