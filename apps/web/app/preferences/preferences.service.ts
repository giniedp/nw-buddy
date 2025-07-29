import { Injectable, PLATFORM_ID, inject } from '@angular/core'
import { StorageApiNode, StorageScopeNode, memStorage } from './storage'
import { isPlatformServer } from '@angular/common'
import { PREFERENCES_PREFIX } from '../data/constants'

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  public readonly storage: StorageScopeNode
  public readonly session: StorageScopeNode

  public constructor() {
    const isServer = isPlatformServer(inject(PLATFORM_ID))
    const storage = isServer ? memStorage() : localStorage
    const session = isServer ? memStorage() : sessionStorage
    this.storage = new StorageScopeNode(new StorageApiNode(storage), PREFERENCES_PREFIX)
    this.session = new StorageScopeNode(new StorageApiNode(session), PREFERENCES_PREFIX)
  }

  public export() {
    const result: Record<string, any> = {}
    for (const key of this.storage.keys()) {
      result[PREFERENCES_PREFIX + key] = this.storage.get(key)
    }
    return result
  }

  public import(data: Record<string, any>) {
    for (const key of Array.from(Object.keys(data))) {
      if (key.startsWith(PREFERENCES_PREFIX)) {
        const keyIntern = key.replace(PREFERENCES_PREFIX, '')
        this.storage.set(keyIntern, data[key])
        continue
      }
    }
  }
}
