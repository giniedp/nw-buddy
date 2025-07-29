import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, combineLatest, defer, exhaustMap, map, of, timer } from 'rxjs'
import { deployUrl, shareReplayRefCount } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'

@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient)
  private platform = inject(PlatformService)

  public readonly currentVersion$ = of(this.platform.env.version)
  public readonly latestVersion$ = defer(() => timer(0, 1000 * 60 * 15))
    .pipe(exhaustMap(() => this.fetchVersion()))
    .pipe(shareReplayRefCount(1))

  public versionChanged$ = combineLatest({
    current: this.currentVersion$,
    latest: this.latestVersion$,
  })
    .pipe(map(({ current, latest }) => !!current && !!latest && current !== latest))
    .pipe(shareReplayRefCount(1))

  private fetchVersion() {
    if (this.platform.env.standalone) {
      return this.fetchStandaloneVersion()
    } else {
      return this.fetchWebVersion()
    }
  }

  private fetchWebVersion() {
    return this.http
      .get(deployUrl('version'), {
        responseType: 'text',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      .pipe(map((it) => it.trim()))
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(null)
        }),
      )
  }

  private fetchStandaloneVersion() {
    return this.http
      .get<Release>('https://api.github.com/repos/giniedp/nw-buddy/releases/latest')
      .pipe(map((it) => it.tag_name.replace(/^v/, '')))
      .pipe(map((it) => it.trim()))
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(null)
        }),
      )
  }
}

export interface Release {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  author: Author
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: Date
  published_at: Date
  assets: Asset[]
  tarball_url: string
  zipball_url: string
  body: string
}

export interface Asset {
  url: string
  id: number
  node_id: string
  name: string
  label: null
  uploader: Author
  content_type: string
  state: string
  size: number
  download_count: number
  created_at: Date
  updated_at: Date
  browser_download_url: string
}

export interface Author {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}
