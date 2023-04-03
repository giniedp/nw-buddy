import { Injectable } from '@angular/core'
import { StorageApiNode, StorageScopeNode } from './storage'

const PREFIX = 'nwb:'

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  public readonly storage: StorageScopeNode
  public readonly session: StorageScopeNode

  public constructor() {
    this.storage = new StorageScopeNode(StorageApiNode.localStorage(), PREFIX)
    this.session = new StorageScopeNode(StorageApiNode.sessionStorage(), PREFIX)
  }

  public export() {
    const result: Record<string, any> = {}
    for (const key of this.storage.keys()) {
      result[PREFIX + key] = this.storage.get(key)
    }
    return result
  }

  public import(data: Record<string, any>) {
    for (const key of Array.from(Object.keys(data))) {
      if (key.startsWith(PREFIX)) {
        const keyIntern = key.replace(PREFIX, '')
        this.storage.set(keyIntern, data[key])
        continue
      }
    }
  }
}
