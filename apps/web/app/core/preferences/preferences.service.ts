import { Injectable } from '@angular/core'
import { LocalStorage, ScopedStorage, StorageBase } from './storage'

@Injectable({ providedIn: 'root' })
export class PreferencesService {

  public readonly storage: StorageBase

  public constructor() {
    this.storage = new ScopedStorage(new LocalStorage(), 'nwb:')
  }

  public export() {
    const result: Record<string, any> = {}
    for (const key of this.storage.keys()) {
      result[key] = this.storage.read(key)
    }
    return result
  }

  public import(data: Record<string, any>) {
    for (const key of Array.from(Object.keys(data))) {
      this.storage.write(key, data[key])
    }
  }
}
