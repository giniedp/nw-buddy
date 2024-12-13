import { computed, inject, Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { injectNwData } from '~/data'
import { AppPreferencesService } from '~/preferences'
import { DiffResource } from './types'

@Injectable({
  providedIn: 'root',
})
export class DiffToolService {
  private db = injectNwData()
  private pref = inject(AppPreferencesService)
  private token = toSignal(this.pref.gitAccessToken.observe())

  public isAvailable = computed(() => !!this.token())

  public async getResourceVersions<T>(resource: DiffResource<T>) {
    const token = this.token()
    if (!token || !resource) {
      return []
    }
    const versions = await this.db.listRecordVersions<T>({
      gitToken: token,
      uri: resource.uri,
      index: resource.index,
      indexKeys: resource.indexKeys,
    })
    return versions
  }
}
