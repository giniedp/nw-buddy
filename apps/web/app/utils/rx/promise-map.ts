type PlainObj = Record<string, unknown>
export type PromisesMap<T extends PlainObj> = {
  [P in keyof T]: Promise<T[P]> | T[P]
}
export type PromiseOutcomesMap<T extends PlainObj> = {
  [P in keyof T]: PromiseSettledResult<T[P]>
}

export async function promiseMap<T extends PlainObj>(promisesMap: PromisesMap<T>): Promise<T> {
  const entries = await Promise.all(
    Object.entries(promisesMap).map(async ([key, value]) => {
      return [key, await value]
    }),
  )
  return Object.fromEntries(entries) as T
}
