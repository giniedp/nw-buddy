import { DestroyRef, inject, Injectable, signal } from '@angular/core'
import { Router } from '@angular/router'
import { injectWindow } from '~/utils/injection/window'

/**
 * What the desktop app knows about its nwbt child process (apps/desktop `NwbtState`)
 */
export interface DesktopNwbtState {
  /**
   * Url of the running nwbt, empty when it does not run
   */
  url: string
  /**
   * Why nwbt does not run, empty while it runs or starts
   */
  error: string
  /**
   * The New World folder of the `.env`, which the app and nwbt read (apps/desktop `GameFolder`)
   */
  folder: DesktopGameFolder
}

/**
 * The New World folder of the desktop app's `.env`
 */
export interface DesktopGameFolder {
  /**
   * The `.env` that names the folder
   */
  envFile: string
  /**
   * The folder, empty when it is not set
   */
  dir: string
  /**
   * Why nwbt cannot use the folder, empty when it can: the `.env` could not be created or read, no folder is set, or
   * the folder does not exist or has no game files
   */
  problem: '' | 'env' | 'unset' | 'unreachable'
  /**
   * The error of `env`
   */
  error: string
}

/**
 * The page origin of the Wails asset server on Windows (apps/desktop)
 */
const DESKTOP_HOST = 'wails.localhost'

type WailsRuntime = typeof import('@wailsio/runtime')

/**
 * The nw-buddy desktop app (apps/desktop, Wails): window controls of the frameless window, deep links and the nwbt
 * child process. The Wails runtime is loaded only inside the desktop app.
 */
@Injectable({ providedIn: 'root' })
export class DesktopService {
  private window = injectWindow()
  private router = inject(Router)
  private runtime: Promise<WailsRuntime> | null = null

  /**
   * Whether the page runs in the desktop app
   */
  public readonly isDesktop = this.window?.location?.hostname === DESKTOP_HOST

  /**
   * Whether the window is maximised
   */
  public readonly maximised = signal(false)

  public constructor() {
    if (!this.isDesktop) {
      return
    }
    const destroyRef = inject(DestroyRef)
    void this.load().then(async ({ Events, Window }) => {
      const update = () => {
        void Window.IsMaximised().then((value) => this.maximised.set(value))
      }
      const off = [
        Events.On(Events.Types.Common.WindowMaximise, update),
        Events.On(Events.Types.Common.WindowUnMaximise, update),
        Events.On(Events.Types.Common.WindowRestore, update),
        // `nw-buddy://items/123` opened while the app runs (apps/desktop deeplink.go)
        Events.On('desktop:open-path', (event) => {
          void this.router.navigateByUrl(String(event.data))
        }),
      ]
      destroyRef.onDestroy(() => off.forEach((it) => it()))
      update()
    })
  }

  public async minimise() {
    const { Window } = await this.load()
    await Window.Minimise()
  }

  public async toggleMaximise() {
    const { Window } = await this.load()
    await Window.ToggleMaximise()
  }

  public async close() {
    const { Window } = await this.load()
    await Window.Close()
  }

  /**
   * Opens the url in the system's browser
   */
  public async openUrl(url: string) {
    const { Browser } = await this.load()
    await Browser.OpenURL(url)
  }

  /**
   * The nwbt of the desktop app, null outside of it
   */
  public async nwbt(): Promise<DesktopNwbtState | null> {
    if (!this.isDesktop) {
      return null
    }
    const { Call } = await this.load()
    return Call.ByName('main.DesktopService.Nwbt')
  }

  /**
   * Asks for the New World folder, a valid one is written to the `.env` and nwbt restarts with it. Returns the folder
   * of the `.env`.
   */
  public async pickGameDir(): Promise<string> {
    if (!this.isDesktop) {
      return ''
    }
    const { Call } = await this.load()
    return Call.ByName('main.DesktopService.PickGameDir')
  }

  /**
   * Looks for New World in the Steam libraries, empty if it is not found. Stores nothing: confirm with
   * {@link setGameDir}.
   */
  public async findGameDir(): Promise<string> {
    if (!this.isDesktop) {
      return ''
    }
    const { Call } = await this.load()
    return Call.ByName('main.DesktopService.FindGameDir')
  }

  /**
   * Writes the New World folder to the `.env`, nwbt restarts with it
   */
  public async setGameDir(dir: string): Promise<void> {
    if (!this.isDesktop) {
      return
    }
    const { Call } = await this.load()
    await Call.ByName('main.DesktopService.SetGameDir', dir)
  }

  /**
   * Starts nwbt again with the folder of the `.env`, e.g. after the user edited the file or connected the drive
   */
  public async retry(): Promise<void> {
    if (!this.isDesktop) {
      return
    }
    const { Call } = await this.load()
    await Call.ByName('main.DesktopService.Retry')
  }

  private load() {
    this.runtime ??= import('@wailsio/runtime')
    return this.runtime
  }
}
