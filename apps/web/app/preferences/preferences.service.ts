import { Injectable } from '@angular/core'
import { StorageApiNode, StorageScopeNode } from './storage'

const PREFIX = 'nwb:'
// TODO: remove after deprecation period
const OLD_UNPREFIXED = [
  'dungeons:',
  'items:',
  'recipes:',
  'grid:',
  'crafting:'
]
// TODO: remove after deprecation period
const OLD_IGNORE = [
  /^nwb:tradeskill/,
  /^tradeskill/
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
      if (OLD_IGNORE.some((it) => it.test(key))) {
        continue
      }
      if (key.startsWith(PREFIX)) {
        const keyIntern = key.replace(PREFIX, '')
        this.storage.set(keyIntern, data[key])
        continue
      }
      if (OLD_UNPREFIXED.some((it) => key.startsWith(it))) {
        this.storage.set(key, data[key])
      }
    }
  }
}
