import { Injectable } from '@angular/core'
import { PreferencesService } from './preferences.service'
import { StorageProperty } from './storage'

@Injectable({ providedIn: 'root' })
export class AppPreferencesService {
  public readonly projectName: StorageProperty<string>
  public readonly language: StorageProperty<string>
  public readonly theme: StorageProperty<string>
  public readonly collapseMenuMode: StorageProperty<'auto' | 'always'>
  public readonly nwmpServer: StorageProperty<string>
  public readonly mapActive: StorageProperty<boolean>
  public readonly mapCollapsed: StorageProperty<boolean>
  public readonly ipfsGateway: StorageProperty<string>
  public readonly appMenu: StorageProperty<Record<string, boolean>>
  public readonly highQualityModels: StorageProperty<boolean>
  public readonly gitAccessToken: StorageProperty<string>
  public readonly nwDataRepo: StorageProperty<string>
  public readonly nwDataRepoPreset: StorageProperty<string>
  public readonly nwDataRepoFormat: StorageProperty<'json' | 'yaml'>
  public readonly nwDataRepoUseTags: StorageProperty<boolean>
  public readonly nwDataRepoUseFiles: StorageProperty<boolean>
  public readonly nwDataRepoUseLimit: StorageProperty<number>

  public constructor(preferences: PreferencesService) {
    const storage = preferences.storage.storageObject('app')
    this.projectName = storage.storageProperty('projectName', 'nw-buddy')
    this.language = storage.storageProperty('language', 'en-us')
    this.theme = storage.storageProperty('theme', 'helloween')
    this.nwmpServer = storage.storageProperty('nwmpServer', null)
    this.collapseMenuMode = storage.storageProperty('collapseMenuMode', null)
    this.ipfsGateway = storage.storageProperty('ipfsGateway', null)
    this.appMenu = storage.storageProperty('menu', null)
    this.highQualityModels = storage.storageProperty('highQualityModels', false)
    this.gitAccessToken = storage.storageProperty('gitAccessToken', null)
    this.nwDataRepo = storage.storageProperty(
      'nwDataRepo',
      'https://github.com/giniedp/nw-buddy-data/tree/main/live/datatables',
    )
    this.nwDataRepoPreset = storage.storageProperty('nwDataRepoPreset', '')
    this.nwDataRepoFormat = storage.storageProperty('nwDataRepoFormat', 'json')
    this.nwDataRepoUseTags = storage.storageProperty('nwDataRepoUseTags', true)
    this.nwDataRepoUseFiles = storage.storageProperty('nwDataRepoUseFiles', true)
    this.nwDataRepoUseLimit = storage.storageProperty('nwDataRepoUseLimit', 5)

    const session = preferences.session.storageObject('app')
    this.mapActive = session.storageProperty('mapActive', false)
    this.mapCollapsed = session.storageProperty('mapCollapsed', false)
  }
}
