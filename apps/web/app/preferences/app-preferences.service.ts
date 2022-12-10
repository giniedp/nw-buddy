import { Injectable } from '@angular/core'
import { PreferencesService } from './preferences.service'
import { StorageProperty } from './storage'

@Injectable({ providedIn: 'root' })
export class AppPreferencesService {

  public readonly language: StorageProperty<string>
  public readonly theme: StorageProperty<string>
  public readonly tooltipProvider: StorageProperty<'nwdb' | 'nwguide'>
  public readonly nwmpServer: StorageProperty<string>
  public readonly mapActive: StorageProperty<boolean>
  public readonly mapCollapsed: StorageProperty<boolean>

  public constructor(preferences: PreferencesService) {
    const storage = preferences.storage.storageObject('app')
    this.language = storage.storageProperty('language', 'en-us')
    this.theme = storage.storageProperty('theme', 'helloween')
    this.nwmpServer = storage.storageProperty('nwmpServer', null)
    this.tooltipProvider = storage.storageProperty('tooltipProvider', null)

    const session = preferences.session.storageObject('app')
    this.mapActive = session.storageProperty('mapActive', false)
    this.mapCollapsed = session.storageProperty('mapCollapsed', false)
  }
}
