/**
 * Makes a shallow copy of given object and deletes all keys that don't match the predicate
 */
export function filterKeys<T>(item: T | null, predicate: (key: keyof T, object: T) => boolean): Partial<T> | null {
  if (!item) {
    return null
  }
  const result = { ...item }
  for (const key of Object.keys(result)) {
    if (!predicate(key as keyof T, item)) {
      delete result[key]
    }
  }
  return result
}

/**
 * Makes a shallow copy of given object and deletes all keys that match the predicate
 */
export function rejectKeys<T>(item: T | null, predicate: (key: keyof T, object: T) => boolean): Partial<T> | null {
  if (!item) {
    return null
  }
  const result = { ...item }
  for (const key of Object.keys(result)) {
    if (predicate(key as keyof T, item)) {
      delete result[key]
    }
  }
  return result
}
