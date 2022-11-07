import { Injectable } from '@angular/core'
import { StorageApiNode, StorageScopeNode } from './storage'

const PREFIX = 'nwb:'
const PREFIX_OLD = [
  'dungeons:',
  'items:',
  'recipes:',
  'grid:',
  'crafting:',
  'tradeskill:',
  'tradeskills'
]

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
        this.storage.set(key.replace(PREFIX, ''), data[key])
        continue
      }
      if (PREFIX_OLD.some((it) => key.startsWith(it))) {
        this.storage.set(key, data[key])
      }
    }
  }
}
