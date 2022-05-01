import { Injectable } from '@angular/core'
import { StorageApiNode, StorageScopeNode } from './storage'

@Injectable({ providedIn: 'root' })
export class PreferencesService {

  public readonly storage: StorageScopeNode
  public readonly session: StorageScopeNode

  public constructor() {
    this.storage = new StorageScopeNode(StorageApiNode.localStorage(), 'nwb:')
    this.session = new StorageScopeNode(StorageApiNode.sessionStorage(), 'nwb:')
  }

  public export() {
    const result: Record<string, any> = {}
    for (const key of this.storage.keys()) {
      result[key] = this.storage.get(key)
    }
    return result
  }

  public import(data: Record<string, any>) {
    for (const key of Array.from(Object.keys(data))) {
      this.storage.set(key, data[key])
    }
  }
}
