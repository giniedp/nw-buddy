import { Injectable } from '@angular/core'
import { PreferencesService } from './preferences.service'
import { ScopedStorage, StorageProperty } from './storage'

@Injectable({ providedIn: 'root' })
export class AppPreferencesService {

  public readonly language: StorageProperty<string>
  public readonly theme: StorageProperty<string>

  public constructor(preferences: PreferencesService) {
    const storage = new ScopedStorage(preferences.storage, 'app:')
    this.language = storage.createProperty('language', 'de-de')
    this.theme = storage.createProperty('theme', 'helloween')

  }
}
