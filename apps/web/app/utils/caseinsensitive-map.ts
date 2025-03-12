function transformKey<T>(key: T) {
  if (typeof key === 'string') {
    return key.toLowerCase() as any as T
  }
  return key
}

export class CaseInsensitiveMap<T, U> extends Map<T, U> {
  public override set(key: T, value: U): this {
    return super.set(transformKey(key), value)
  }

  public override get(key: T): U | undefined {
    return super.get(transformKey(key))
  }

  public override has(key: T): boolean {
    return super.has(transformKey(key))
  }
}
