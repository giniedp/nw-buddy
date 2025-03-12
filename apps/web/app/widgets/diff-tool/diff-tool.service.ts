import { computed, inject, Injectable } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { injectNwData } from '~/data'
import { AppPreferencesService } from '~/preferences'
import { DiffResource } from './types'
import { DATASHEETS } from '@nw-data/generated'
import { map } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class DiffToolService {
  private db = injectNwData()
  private pref = inject(AppPreferencesService)
  private token = toSignal(this.pref.gitAccessToken.observe())
  private repoAndPath = toSignal(this.pref.nwDataRepo.observe())
  private useTags = toSignal(this.pref.nwDataRepoUseTags.observe())
  private useFiles = toSignal(this.pref.nwDataRepoUseFiles.observe())
  private useLimit = toSignal(this.pref.nwDataRepoUseLimit.observe())
  private useYaml = toSignal(this.pref.nwDataRepoFormat.observe().pipe(map((it) => it === 'yaml')))

  public isAvailable = computed(() => !!this.token())

  public async getResourceVersions<T>(resource: DiffResource<T>) {
    const token = this.token()
    if (!token || !resource) {
      return []
    }
    const file = this.transformUri(resource.uri, this.useYaml() ? 'yml' : 'json')
    const params = getRepoParams(this.repoAndPath())
    console.log('Fetching versions for', params, file)
    const versions = await this.db.listRecordVersions<T>({
      gitToken: token,
      useTags: this.useTags(),
      repo: params.repo,
      owner: params.user,
      branch: params.branch,
      limit: this.useLimit(),
      file: [params.path, file].filter((it) => !!it).join('/'),
      index: resource.index,
      indexKeys: resource.indexKeys,
    })
    return versions
  }

  private transformUri(uri: string, format: string) {
    if (this.useFiles()) {
      return uri.replace(/^datatables\//, '')
    }
    for (const type in DATASHEETS) {
      const node = DATASHEETS[type]
      for (const subType in node) {
        if (node[subType].uri === uri) {
          return `${type}/${subType}.${format}`
        }
      }
    }
    throw new Error(`Unknown datasheet uri: ${uri}`)
  }
}

function getRepoParams(repoUrl: string) {
  // https://github.com/giniedp/nw-buddy-data/tree/main/live/datatables
  const pathname = new URL(repoUrl).pathname.split('/').filter((it) => !!it)
  const user = pathname.shift()
  const repo = pathname.shift()
  pathname.shift()
  const branch = pathname.shift()
  return {
    user,
    repo,
    branch,
    path: pathname.join('/'),
  }
}
