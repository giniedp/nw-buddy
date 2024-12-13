export function diffResourceFor<T>(record: T, indexKeys: Array<keyof T>): DiffResource<T> {
  const uri = record?.['$uri']
  if (!uri) {
    return null
  }
  return {
    uri,
    record,
    index: indexKeys.map((key) => record[key] as any),
    indexKeys,
  }
}

export type DiffResource<T> = {
  uri: string
  record: T
  index: Array<string | number>
  indexKeys: Array<keyof T>
}
