const cache = new Map<string, Promise<any>>()

export async function cached<T>(key: string, task: (key: string) => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(key, task(key))
  }
  return cache.get(key)
}
