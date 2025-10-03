import { Directive, effect, ElementRef, inject, input } from '@angular/core'
import { ControlPosition, IControl, Map } from 'maplibre-gl'
import { GameMapHost } from './game-map-host'

@Directive({
  selector: '[nwbGameMapControl]',
  host: {
    '[class.maplibregl-ctrl]': 'true',
    '[style.order]': 'order()',
  },
})
export class GameMapControlDirective implements IControl {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private host = inject(GameMapHost)
  private addedTo: Map

  public position = input.required<ControlPosition>({
    alias: 'nwbGameMapControl',
  })
  public order = input<number>()

  public constructor() {
    effect(() => {
      const map = this.host.mapInstance()
      const isReady = this.host.mapIsReady()
      const position = this.position()

      if (!map || !isReady) {
        return
      }
      if (this.addedTo) {
        map.removeControl(this)
      }
      map.addControl(this, position)
    })
  }

  public onAdd(map: Map): HTMLElement {
    this.addedTo = map
    return this.elRef.nativeElement
  }

  public onRemove(map: Map): void {
    this.addedTo = null
  }

  public getDefaultPosition(): ControlPosition {
    return this.position()
  }
}
