import { Injectable } from '@angular/core'
import { PreferencesService, StorageNode, StorageProperty } from '~/core/preferences'

@Injectable({ providedIn: 'root' })
export class CraftingPreferencesService {

  public optimize: StorageProperty<boolean>
  public expandAll: StorageProperty<boolean>
  public categories: StorageNode<string>

  constructor(preferences: PreferencesService) {
    const storage = preferences.storage.storageScope('crafting:')
    this.categories = storage.storageObject('categories')
    this.optimize = storage.storageProperty('optimize')
    this.expandAll = storage.storageProperty('expandAll')
  }
}
