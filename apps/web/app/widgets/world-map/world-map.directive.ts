import { Directive, ElementRef, effect, inject, input, output } from '@angular/core'
import { Landmark, MapView, MapViewBounds } from '../land-map'
import { MarkerEventData, createMap } from './create-map'

@Directive({
  standalone: true,
  selector: '[nwbWorldMap]',
})
export class WorldMapDirective {
  public nwbWorldMap = input<void>()
  public map = input<string>(null)
  public landmarks = input<Landmark[]>(null)
  public fit = input(false)
  public view = input<MapView>(null)
  public bounds = input<MapViewBounds>(null)

  public markerHovered = output<MarkerEventData>()
  public markerClicked = output<MarkerEventData>()

  public constructor() {
    const elRef = inject(ElementRef<HTMLElement>)
    const map = createMap(elRef.nativeElement)

    effect(() => map.useMapId(this.map()))
    effect(() => map.useLandmarks(this.landmarks()))
    effect(() => this.markerHovered.emit(map.hover()))
    effect(() => this.markerClicked.emit(map.click()))
    effect(() => {
      const bounds = this.bounds()
      if(bounds?.min && bounds?.max) {
        map.fitView(bounds.min, bounds.max)
      }
    })
  }
}
