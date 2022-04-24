import { isEqual } from 'lodash'
import { filter, map, Observable, of, startWith, Subject } from 'rxjs'

export interface StorageBase {
  clear(): void
  keys(): string[]
  read<T = any>(key: string): T
  write(key: string, value: any): void
  delete(key: string): void
  observe<T = any>(key: string): Observable<{ key: string; value: T }>
}

export class StorageProperty<T> {
  public constructor(private storage: StorageBase, private key: string, private defaultValue?: T) {
    //
  }

  public get(): T {
    return this.storage.read<T>(this.key) ?? this.defaultValue
  }

  public set(value: T) {
    this.storage.write(this.key, value)
  }

  public observe() {
    return this.storage.observe(this.key).pipe(map((it) => (it.value as T) ?? this.defaultValue))
  }
}

export class LocalStorage implements StorageBase {
  private cache = new Map<string, any>()
  private change$ = new Subject<{ key: string; value: any }>()

  public constructor(private storage?: Storage) {
    if (!storage) {
      this.storage = localStorage
    }
  }

  public clear(): void {
    this.storage.clear()
  }

  public keys(): string[] {
    return new Array(this.storage.length).fill(null).map((_, i) => this.storage.key(i))
  }

  public read<T = any>(key: string): T {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    return JSON.parse(this.storage.getItem(key))
  }

  public write(key: string, value: any): void {
    this.trackChange(key, () => {
      if (isEqual({}, value) || isEqual([], value) || value == null) {
        this.cache.delete(key)
        this.storage.removeItem(key)
      } else {
        this.cache.set(key, value)
        this.storage.setItem(key, JSON.stringify(value))
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
    return this.change$
      .pipe(filter((it) => it.key === key))
      .pipe(startWith({
        key: key,
        value: this.read(key),
      }))
  }

  private trackChange(key: string, fn: () => void) {
    const oldValue = this.read(key)
    fn()
    const newValue = this.read(key)
    if (!isEqual(newValue, oldValue)) {
      this.change$.next({ key, value: newValue })
    }
  }
}

export class ScopedStorage implements StorageBase {
  public constructor(private storage: StorageBase, private scope: string) {
    //
  }

  public createProperty<T>(key: string, defaultValue?: T) {
    return new StorageProperty<T>(this, key, defaultValue)
  }

  public clear(): void {
    for (const key of this.keys()) {
      this.delete(key)
    }
  }

  public delete(key: string) {
    this.storage.delete(this.makeKey(key))
  }

  public keys(): string[] {
    return this.storage
      .keys()
      .filter((it) => it.startsWith(this.scope))
      .map((it) => it.substring(this.scope.length))
  }

  public read<T>(key: string): T {
    return this.storage.read<T>(this.makeKey(key))
  }

  public write(key: string, value: any): void {
    return this.storage.write(this.makeKey(key), value)
  }

  public observe<T>(key: string): Observable<{ key: string; value: T }> {
    return this.storage.observe(this.makeKey(key)).pipe(
      map((it) => ({
        key,
        value: it.value,
      }))
    )
  }

  private makeKey(key: string): string {
    return this.scope ? `${this.scope}${key}` : key
  }
}
