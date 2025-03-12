function transformKey<T>(key: T) {
  if (typeof key === 'string') {
    return key.toLowerCase() as any as T
  }
  return key
}

export class CaseInsensitiveSet<T> extends Set<T> {
  public override add(key: T): this {
    return super.add(transformKey(key))
  }

  public override delete(key: T) {
    return super.delete(transformKey(key))
  }

  public override has(key: T): boolean {
    return super.has(transformKey(key))
  }
}
