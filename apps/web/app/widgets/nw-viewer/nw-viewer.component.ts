import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
} from '@angular/core'
import type { NwViewer, NwViewerOptions } from '@nw-buddy/viewer'

/**
 * A module of the viewer lib (apps/viewer, `pnpm viewer build:lib`), copied to `viewer-lib/` by the build (angular.json
 * assets). Loaded at runtime: the lib brings its own workers, styles and assets, which resolve next to the module.
 *
 * @param file - `nw-viewer.module.js`, the engine, or `nw-viewer-app.module.js`, the app with its tools
 */
export function viewerLibUrl(file: 'nw-viewer.module.js' | 'nw-viewer-app.module.js') {
  return new URL(`viewer-lib/${file}`, document.baseURI).href
}

/**
 * The nw-buddy viewer (apps/viewer) on a canvas of its own, without the viewer's UI.
 *
 * @remarks
 * The engine is created once the component rendered in the browser and destroyed with the component (GPU device
 * included). Inputs are read at creation, recreate the component to change them. Use the `ready` event to show content,
 * e.g. `viewer.showGltf(url)`.
 */
@Component({
  selector: 'nwb-viewer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block relative overflow-hidden',
  },
})
export class NwViewerComponent {
  /**
   * The nwbt server, see {@link NwViewerOptions.nwbtUrl}. Null (default) without a server: only glTF files and the
   * viewer's own assets load.
   */
  public readonly nwbtUrl = input<string | null>(null)

  /**
   * Emitted once the engine runs
   */
  public readonly ready = output<NwViewer>()

  /**
   * Emitted when the engine failed to start, e.g. without WebGPU
   */
  public readonly failed = output<unknown>()

  private host = inject<ElementRef<HTMLElement>>(ElementRef)
  private zone = inject(NgZone)
  private viewer: NwViewer | null = null
  private destroyed = false

  public constructor() {
    afterNextRender(() => {
      this.create().catch((err) => {
        console.error('viewer failed', err)
        this.failed.emit(err)
      })
    })
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true
      this.viewer?.dispose()
      this.viewer = null
    })
  }

  private async create() {
    const lib: typeof import('@nw-buddy/viewer') = await import(/* @vite-ignore */ viewerLibUrl('nw-viewer.module.js'))
    if (this.destroyed) {
      return
    }
    // the viewer sizes the canvas to fill the host, the host clips (NwViewerOptions.canvas)
    const canvas = document.createElement('canvas')
    this.host.nativeElement.append(canvas)
    // the render loop runs outside of the change detection
    const viewer = this.zone.runOutsideAngular(() => {
      return new lib.NwViewer({
        canvas,
        nwbtUrl: this.nwbtUrl(),
        urlState: false,
        audio: false,
        persistConfig: false,
      } satisfies NwViewerOptions)
    })
    this.viewer = viewer
    await this.zone.runOutsideAngular(() => viewer.run())
    if (this.destroyed) {
      return
    }
    this.ready.emit(viewer)
  }
}
