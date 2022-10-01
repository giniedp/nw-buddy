import { Injectable } from '@angular/core'
import { PreferencesService, StorageNode, StorageProperty } from '~/preferences'
import { RecipeState } from './crafting-calculator.service'

@Injectable({ providedIn: 'root' })
export class CraftingPreferencesService {

  public optimize: StorageProperty<boolean>
  public expandAll: StorageProperty<boolean>
  public categories: StorageNode<string>
  public recipes: StorageNode<RecipeState>

  constructor(preferences: PreferencesService) {
    const storage = preferences.storage.storageScope('crafting:')
    const session = preferences.session.storageScope('crafting:')
    this.categories = storage.storageObject('categories')
    this.optimize = storage.storageProperty('optimize')
    this.expandAll = storage.storageProperty('expandAll')
    this.recipes = session.storageScope('recipes:')
  }
}
