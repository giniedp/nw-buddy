import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, combineLatest, defer, exhaustMap, map, of, timer } from 'rxjs'
import { deployUrl, shareReplayRefCount } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'

const RELEASES_URL = 'https://api.github.com/repos/giniedp/nw-buddy/releases?per_page=30'

export interface LatestVersion {
  version: string
  /**
   * Page of the release, null for the web deployment
   */
  url: string | null
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  private http = inject(HttpClient)
  private platform = inject(PlatformService)

  public readonly currentVersion$ = of(this.platform.env.version)
  public readonly latest$ = defer(() => timer(0, 1000 * 60 * 15))
    .pipe(exhaustMap(() => this.fetchLatest()))
    .pipe(shareReplayRefCount(1))
  public readonly latestVersion$ = this.latest$.pipe(map((it) => it?.version ?? null))

  public versionChanged$ = combineLatest({
    current: this.currentVersion$,
    latest: this.latest$,
  })
    .pipe(
      map(({ current, latest }) => {
        if (!current || !latest?.version) {
          return false
        }
        if (this.platform.env.standalone) {
          return compareVersions(latest.version, current) > 0
        }
        return current !== latest.version
      }),
    )
    .pipe(shareReplayRefCount(1))

  private fetchLatest() {
    if (this.platform.env.standalone) {
      return this.fetchLatestRelease()
    }
    return this.fetchWebVersion()
  }

  private fetchWebVersion() {
    return this.http
      .get(deployUrl('version'), {
        responseType: 'text',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      .pipe(map((it): LatestVersion => ({ version: it.trim(), url: null })))
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(null)
        }),
      )
  }

  /**
   * The newest release of the desktop app. Its releases are tagged `v<version>` and may be prereleases, which the
   * `releases/latest` endpoint skips. Other tags (e.g. `nwbt-v0.0.2`) are no app releases.
   */
  private fetchLatestRelease() {
    return this.http
      .get<Release[]>(RELEASES_URL)
      .pipe(map((it) => selectLatestRelease(it)))
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(null)
        }),
      )
  }
}

export interface Release {
  html_url: string
  tag_name: string
  draft: boolean
  prerelease: boolean
}

export function selectLatestRelease(releases: Release[]): LatestVersion | null {
  let result: LatestVersion | null = null
  for (const release of releases || []) {
    if (release.draft || !/^v\d/.test(release.tag_name)) {
      continue
    }
    const version = release.tag_name.replace(/^v/, '').trim()
    if (!result || compareVersions(version, result.version) > 0) {
      result = { version, url: release.html_url }
    }
  }
  return result
}

/**
 * Compares versions like `10.0.4-0` (semver order, a build suffix `#<commit>` is ignored).
 * Returns a positive number when `a` is newer than `b`, negative when older, 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const [coreA, preA] = splitVersion(a)
  const [coreB, preB] = splitVersion(b)
  const core = compareParts(coreA, coreB)
  if (core !== 0) {
    return core
  }
  // a version without a prerelease is newer than any of its prereleases
  if (!preA.length || !preB.length) {
    return preB.length - preA.length
  }
  return compareParts(preA, preB)
}

function splitVersion(version: string): [string[], string[]] {
  const value = version.trim().replace(/^v/, '').split('#')[0].split('+')[0]
  const index = value.indexOf('-')
  if (index < 0) {
    return [value.split('.'), []]
  }
  return [value.slice(0, index).split('.'), value.slice(index + 1).split('.')]
}

function compareParts(a: string[], b: string[]): number {
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    const result = comparePart(a[i], b[i])
    if (result !== 0) {
      return result
    }
  }
  return 0
}

function comparePart(a: string | undefined, b: string | undefined): number {
  if (a === b) {
    return 0
  }
  if (a === undefined) {
    return -1
  }
  if (b === undefined) {
    return 1
  }
  const numA = /^\d+$/.test(a) ? Number(a) : null
  const numB = /^\d+$/.test(b) ? Number(b) : null
  if (numA !== null && numB !== null) {
    return numA - numB
  }
  // numeric identifiers are older than alphanumeric ones
  if (numA !== null) {
    return -1
  }
  if (numB !== null) {
    return 1
  }
  return a < b ? -1 : 1
}
