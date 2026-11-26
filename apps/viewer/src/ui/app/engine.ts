import type { NwViewer } from '../../viewer'

export interface AttachedEngine {
  viewer: NwViewer
  /**
   * Resolves once the engine runs: booted, content loaded, loop started
   */
  running: Promise<void>
}

/**
 * The one engine of an app, created on first use. The engine code is loaded with it, so a tool that never shows the
 * engine (the browser) does not load it. Use {@link attachSurface} to show it.
 */
export class EngineHost {
  private readonly nwbtUrl: string
  private created: Promise<NwViewer> | null = null
  private instance: NwViewer | null = null
  private started: Promise<void> | null = null
  private running = false
  private disposed = false
  /**
   * The container that shows the canvas, the last attached one
   */
  private surface: HTMLElement | null = null

  /**
   * @param nwbtUrl - empty: same origin (vite proxy), otherwise the nwbt server directly, e.g. https://localhost:8443
   *  for HTTP/2
   */
  public constructor(nwbtUrl: string) {
    this.nwbtUrl = nwbtUrl
  }

  public getEngine(): Promise<NwViewer> {
    this.created ??= this.createEngine()
    return this.created
  }

  private async createEngine(): Promise<NwViewer> {
    const { NwViewer } = await import('../../viewer')
    if (this.disposed) {
      throw new Error('the app is disposed')
    }
    const canvas = document.createElement('canvas')
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    const viewer = new NwViewer({
      canvas,
      nwbtUrl: this.nwbtUrl,
      urlState: true,
    })
    if (import.meta.env.DEV) {
      // handle for measurement scripts attached over CDP
      ;(globalThis as any).nwViewer = viewer
    }
    this.instance = viewer
    return viewer
  }

  /**
   * Shows the engine in the container: moves the canvas into it, then boots the engine on first use or resumes it.
   * Only one container shows the engine, the last attached one.
   *
   * Resolves once the systems of the engine exist (the boot may still run), or with null if the container was
   * detached or another one attached in the meantime.
   */
  public async attachSurface(container: HTMLElement): Promise<AttachedEngine | null> {
    this.surface = container
    const viewer = await this.getEngine()
    if (this.surface !== container) {
      return null
    }
    viewer.placeCanvas(container)
    if (!this.started) {
      // creates the systems synchronously, the boot continues asynchronously
      this.started = viewer.run().then(() => {
        this.running = true
        // detached while booting
        if (!this.surface) {
          viewer.suspend()
        }
      })
    } else if (this.running) {
      viewer.resume()
    }
    return { viewer, running: this.started }
  }

  /**
   * Whether the container shows the engine: it was attached last and not detached since
   */
  public isSurface(container: HTMLElement) {
    return this.surface === container
  }

  /**
   * The container no longer shows the engine. If no other container took over, the engine is suspended: no
   * rendering, no updates, no sound, until a container is attached again.
   */
  public detachSurface(container: HTMLElement) {
    if (this.surface !== container) {
      return
    }
    this.surface = null
    if (this.running) {
      this.instance?.suspend()
    }
  }

  /**
   * Destroys the engine and its GPU device
   */
  public dispose() {
    this.disposed = true
    this.surface = null
    const viewer = this.instance
    this.instance = null
    if (!viewer) {
      return
    }
    if ((globalThis as any).nwViewer === viewer) {
      delete (globalThis as any).nwViewer
    }
    viewer.dispose()
  }
}
