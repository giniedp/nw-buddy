import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core'
import { Location } from '@angular/common'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router'
import type { MountedViewerApp } from '@nw-buddy/viewer/app'
import { environment } from 'apps/web/environments'
import { DesktopService, type DesktopNwbtState } from '~/desktop'
import { EXTERNAL_URL_CHANGES } from '~/utils/injection/current-url'
import { viewerLibUrl } from '~/widgets/nw-viewer'
import { NwbtService } from '~/widgets/nwbt-setup'
import {
  PakOnboardingComponent,
  PakOnboardingDesktopComponent,
  PakOnboardingWebComponent,
  watchLocalNetworkPermission,
} from './onboarding'

/**
 * How often nwbt is asked again while it does not answer
 */
const POLL_MS = 3000

/**
 * nwbt of the desktop app, on the page's origin through the app's proxy (apps/desktop/proxy.go): the requests skip
 * the limit of 6 connections per host of HTTP/1.1
 */
const DESKTOP_NWBT_URL = '/nwbt'

type PakState = 'checking' | 'offline' | 'mounted' | 'failed'

/**
 * The asset tools of nwbt: the viewer app (apps/viewer: Viewer, Browser and Data) mounted below this route. The app
 * owns the url below `/pak` (`/pak/viewer`, `/pak/browser`, `/pak/data/<family>`, the state in the query), this route
 * matches all of it. Angular's own navigations below `/pak` (the menu link) are handed to the app's router.
 *
 * In the desktop app (apps/desktop), nwbt is the app's child process and the app names its url.
 *
 * Asks nwbt for `/health` first. Without an answer it shows how to start nwbt and asks again until it answers, then
 * mounts the app without a reload.
 */
@Component({
  selector: 'nwb-pak-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PakOnboardingComponent, PakOnboardingDesktopComponent, PakOnboardingWebComponent],
  host: {
    class: 'ion-page',
  },
  template: `
    <!-- the app's root: it fills the page, the app lays out its tools in it -->
    <div #mount class="absolute inset-0" [class.hidden]="state() !== 'mounted'"></div>
    @if (state() !== 'mounted') {
      <nwb-pak-onboarding
        class="absolute inset-0"
        [checking]="state() === 'checking'"
        [error]="error()"
        (retry)="retry()"
      >
        @if (desktop.isDesktop) {
          <nwb-pak-onboarding-desktop
            [state]="desktopState()"
            [checking]="state() === 'checking'"
            [foundGameDir]="foundGameDir()"
            [searching]="searching()"
            (retry)="retry()"
            (pickGameDir)="pickGameDir()"
            (findGameDir)="findGameDir()"
            (useGameDir)="useGameDir($event)"
          />
        } @else {
          <nwb-pak-onboarding-web
            [nwbtUrl]="nwbtUrl()"
            [checking]="state() === 'checking'"
            [permission]="permission()"
            (retry)="retry()"
          />
        }
      </nwb-pak-onboarding>
    }
  `,
})
export class PakPageComponent {
  protected readonly desktop = inject(DesktopService)
  private readonly nwbt = inject(NwbtService)
  protected readonly nwbtUrl = signal(environment.nwbtUrl)
  protected readonly state = signal<PakState>('checking')
  protected readonly error = signal<string | null>(null)
  /**
   * The desktop app's nwbt and New World folder, null outside of the app and while it is asked
   */
  protected readonly desktopState = signal<DesktopNwbtState | null>(null)
  /**
   * Desktop app: the New World folder the Steam search found on request, not stored yet. Null before a search, empty
   * when it found none.
   */
  protected readonly foundGameDir = signal<string | null>(null)
  /**
   * Desktop app: the Steam search runs
   */
  protected readonly searching = signal(false)
  /**
   * Browser: the permission to reach nwbt on this device (local network access), null when the browser has none
   */
  protected readonly permission = signal<PermissionState | null>(null)

  private readonly mountElement = viewChild.required<ElementRef<HTMLElement>>('mount')
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly urlChanges = inject(EXTERNAL_URL_CHANGES)
  private app: MountedViewerApp | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private abort: AbortController | null = null
  private destroyed = false

  public constructor() {
    afterNextRender(() => {
      void this.check()
    })
    this.forwardNavigations()
    const watching = new AbortController()
    if (!this.desktop.isDesktop) {
      watchLocalNetworkPermission((state) => this.permission.set(state), watching.signal)
    }
    inject(DestroyRef).onDestroy(() => {
      watching.abort()
      this.destroyed = true
      this.stopPolling()
      this.app?.dispose()
      this.app = null
    })
  }

  /**
   * Asks nwbt for its health and mounts the app when it answers, polls otherwise
   */
  protected async check() {
    if (this.app || this.destroyed) {
      return
    }
    this.stopPolling()
    this.error.set(null)
    this.state.set('checking')
    const abort = new AbortController()
    this.abort = abort
    const desktop = await this.desktop.nwbt()
    if (abort.signal.aborted || this.destroyed) {
      return
    }
    if (desktop) {
      this.desktopState.set(desktop)
      if (!desktop.url) {
        this.abort = null
        this.state.set('offline')
        this.timer = setTimeout(() => this.check(), POLL_MS)
        return
      }
      // reached through the desktop app's proxy, not at desktop.url
      this.nwbtUrl.set(DESKTOP_NWBT_URL)
    }
    const healthy = await isHealthy(this.nwbtUrl(), abort.signal)
    if (abort.signal.aborted || this.destroyed) {
      return
    }
    this.abort = null
    if (!healthy) {
      this.state.set('offline')
      this.timer = setTimeout(() => this.check(), POLL_MS)
      return
    }
    if (this.nwbtUrl() === environment.nwbtUrl) {
      this.nwbt.markAvailable()
    }
    await this.mount().catch((err) => {
      console.error('viewer app not mounted:', String(err))
      this.error.set(String(err instanceof Error ? err.message : err))
      this.state.set('failed')
    })
  }

  /**
   * Asks nwbt again. In the desktop app, the app first starts nwbt again with the folder of the `.env` (e.g. edited by
   * hand, or a drive that is connected now).
   */
  protected async retry() {
    if (this.desktop.isDesktop) {
      await this.desktop.retry().catch((err) => {
        this.error.set(String(err instanceof Error ? err.message : err))
      })
    }
    void this.check()
  }

  /**
   * Desktop app: asks for the New World folder, the app writes it to the `.env` and restarts nwbt with it
   */
  protected async pickGameDir() {
    await this.desktop.pickGameDir().catch((err) => {
      this.error.set(String(err instanceof Error ? err.message : err))
    })
    void this.check()
  }

  /**
   * Desktop app: looks for New World in the Steam libraries on the user's request. The found folder is only shown,
   * the user confirms it with {@link useGameDir}.
   */
  protected async findGameDir() {
    this.searching.set(true)
    try {
      this.foundGameDir.set(await this.desktop.findGameDir())
    } catch (err) {
      this.error.set(String(err instanceof Error ? err.message : err))
    } finally {
      this.searching.set(false)
    }
  }

  /**
   * Desktop app: the user confirmed the found folder, the app writes it to the `.env` and restarts nwbt with it
   */
  protected async useGameDir(dir: string) {
    await this.desktop.setGameDir(dir).catch((err) => {
      this.error.set(String(err instanceof Error ? err.message : err))
    })
    this.foundGameDir.set(null)
    void this.check()
  }

  private async mount() {
    const lib: typeof import('@nw-buddy/viewer/app') = await import(
      /* @vite-ignore */ viewerLibUrl('nw-viewer-app.module.js')
    )
    if (this.destroyed || this.app) {
      return
    }
    this.app = lib.mountViewerApp(this.mountElement().nativeElement, {
      base: this.basePath(),
      nwbtUrl: this.nwbtUrl(),
      // the app writes the history itself, e.g. the viewer's camera and level: the address bar of the desktop app
      // follows the current url (CURRENT_URL)
      onUrlChange: (url) => this.urlChanges.next(this.location.normalize(url)),
    })
    this.state.set('mounted')
  }

  /**
   * The path of this route in the page (`/pak`, `/de-de/pak` with a locale), the base of the app's router
   */
  private basePath() {
    // the segments consumed by the routes above the `**` route: the locale and `pak`. (createUrlTree with empty
    // commands gives the current url, e.g. `/pak/data`, not the path of the route)
    const segments = this.route.snapshot.pathFromRoot
      .slice(0, -1)
      .flatMap((it) => it.url.map((segment) => segment.path))
    return this.location.prepareExternalUrl('/' + segments.join('/'))
  }

  /**
   * Hands Angular's own navigations below this route (e.g. the menu link to `/pak`) to the app: its router does not
   * see Angular's history entries. Back and forward are not handed over, the app's router follows them itself.
   */
  private forwardNavigations() {
    let imperative = false
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        imperative = event.navigationTrigger === 'imperative'
      } else if (event instanceof NavigationEnd && imperative && this.app) {
        // Angular already added the history entry: the app replaces it with its own location (e.g. a redirect)
        this.app.navigate(this.location.prepareExternalUrl(event.urlAfterRedirects), { replace: true })
      }
    })
  }

  private stopPolling() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.abort?.abort()
    this.abort = null
  }
}

async function isHealthy(nwbtUrl: string, signal: AbortSignal) {
  try {
    const res = await fetch(`${nwbtUrl}/health`, { cache: 'no-store', signal })
    return res.ok
  } catch {
    return false
  }
}
