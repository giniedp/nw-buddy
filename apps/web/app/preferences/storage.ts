import { isEqual } from 'lodash'
import { distinctUntilChanged, filter, map, Observable, startWith, Subject } from 'rxjs'

export interface StorageNode<T = any> {
  clear(): void
  keys(): string[]
  get<R = T>(key: string): R
  set(key: string, value: T): void
  delete(key: string): void
  observe<R = T>(key: string): Observable<{ key: string; value: R }>
}

export class StorageProperty<T> {
  public constructor(
    private storage: StorageNode,
    private key: string,
    private defaultValue?: T,
  ) {
    //
  }

  public get value(): T {
    return this.get()
  }
  public set value(v: T) {
    this.set(v)
  }

  public get(): T {
    return this.storage.get<T>(this.key) ?? this.defaultValue
  }

  public set(value: T) {
    this.storage.set(this.key, value)
  }

  public observe() {
    return this.storage
      .observe(this.key)
      .pipe(map((it) => (it.value as T) ?? this.defaultValue))
      .pipe(distinctUntilChanged())
  }
}

export function nullStorage(): Storage {
  return {
    length: 0,
    clear() {
      //
    },
    getItem() {
      return null
    },
    key() {
      return null
    },
    removeItem() {
      //
    },
    setItem() {
      //
    },
  }
}

export function memStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key: string) {
      return data.get(key) ?? null
    },
    key(index: number) {
      return Array.from(data.keys())[index]
    },
    removeItem(key: string) {
      data.delete(key)
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  }
}

export class StorageApiNode implements StorageNode {
  private cache = new Map<string, any>()
  private change$ = new Subject<{ key: string; value: any }>()

  public constructor(private storage: Storage) {
    //
  }

  public clear(): void {
    this.storage.clear()
  }

  public keys(): string[] {
    return new Array(this.storage.length).fill(null).map((_, i) => this.storage.key(i))
  }

  public get<T = any>(key: string): T {
    if (this.cache.has(key)) {
      return JSON.parse(JSON.stringify(this.cache.get(key)))
    }
    return JSON.parse(this.storage.getItem(key))
  }

  public set(key: string, value: any): void {
    this.trackChange(key, () => {
      if (isEqual({}, value) || isEqual([], value) || value == null) {
        this.cache.delete(key)
        this.storage.removeItem(key)
      } else {
        const json = JSON.stringify(value)
        this.cache.set(key, JSON.parse(json))
        this.storage.setItem(key, json)
      }
    })
  }

  public delete(key: string): void {
    this.trackChange(key, () => {
      this.cache.delete(key)
      this.storage.removeItem(key)
    })
  }

  public observe<T>(key: string): Observable<{ key: string; value: T }> {
    return this.change$.pipe(filter((it) => it.key === key)).pipe(
      startWith({
        key: key,
        value: this.get(key),
      }),
    )
  }

  private trackChange(key: string, fn: () => void) {
    const oldValue = this.get(key)
    fn()
    const newValue = this.get(key)
    if (!isEqual(newValue, oldValue)) {
      this.change$.next({ key, value: newValue })
    }
  }
}

export class StorageScopeNode implements StorageNode {
  public constructor(
    private node: StorageNode,
    private scope: string,
  ) {
    //
  }

  public storageScope(scope: string) {
    return new StorageScopeNode(this, scope)
  }

  public storageObject(scope: string) {
    return new StorageObjectNode(this, scope)
  }

  public storageProperty<T>(key: string, defaultValue?: T) {
    return new StorageProperty<T>(this, key, defaultValue)
  }

  public clear(): void {
    for (const key of this.keys()) {
      this.delete(key)
    }
  }

  public delete(key: string) {
    this.node.delete(this.makeKey(key))
  }

  public keys(): string[] {
    return this.node
      .keys()
      .filter((it) => it.startsWith(this.scope))
      .map((it) => it.substring(this.scope.length))
  }

  public get<T>(key: string): T {
    return this.node.get<T>(this.makeKey(key))
  }

  public set(key: string, value: any): void {
    return this.node.set(this.makeKey(key), value)
  }

  public observe<T>(key: string): Observable<{ key: string; value: T }> {
    return this.node
      .observe(this.makeKey(key))
      .pipe(
        map((it) => ({
          key,
          value: it.value,
        })),
      )
      .pipe(distinctUntilChanged(isEqual))
  }

  private makeKey(key: string): string {
    return this.scope ? `${this.scope}${key}` : key
  }
}

export class StorageObjectNode implements StorageNode {
  public constructor(
    private node: StorageNode,
    private scope: string,
  ) {
    //
  }

  public storageScope(scope: string) {
    return new StorageObjectNode(this, scope)
  }

  public storageObject(scope: string) {
    return new StorageObjectNode(this, scope)
  }

  public storageProperty<T>(key: string, defaultValue?: T) {
    return new StorageProperty<T>(this, key, defaultValue)
  }

  public clear(): void {
    for (const key of this.keys()) {
      this.delete(key)
    }
  }

  public delete(key: string) {
    const obj = this.readObject()
    delete obj[key]
    this.writeObject(obj)
  }

  public keys(): string[] {
    return Object.keys(this.readObject())
  }

  public get<T>(key: string): T {
    return this.readObject()[key]
  }

  public set(key: string, value: any): void {
    return this.writeObject({
      ...this.readObject(),
      [key]: value,
    })
  }

  public observe<T>(key: string): Observable<{ key: string; value: T }> {
    return this.node
      .observe(this.scope)
      .pipe(
        map(() => ({
          key,
          value: this.get(key),
        })),
      )
      .pipe(distinctUntilChanged(isEqual))
  }

  private readObject() {
    return this.node.get(this.scope) || {}
  }

  private writeObject(obj: any) {
    this.node.set(this.scope, obj)
  }
}
