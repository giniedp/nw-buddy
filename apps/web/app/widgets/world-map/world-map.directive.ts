import { Directive, ElementRef, effect, inject, input, output } from '@angular/core'
import { environment } from 'apps/web/environments'
import { createMap } from './create-map'
import { MapMarker, MapPointMarker, MapView, MapViewBounds, MapZoneMarker, MarkerEventData } from './types'

@Directive({
  standalone: true,
  selector: '[nwbWorldMap]',
})
export class WorldMapDirective {
  public nwbWorldMap = input<void>()
  public map = input<string>(null)
  public landmarks = input<MapMarker[]>(null)
  public pointMarkers = input<MapPointMarker[]>(null)
  public zoneMarkers = input<MapZoneMarker[]>(null)
  public fit = input(false)
  public view = input<MapView>(null)
  public bounds = input<MapViewBounds>(null)

  public markerHovered = output<MarkerEventData>()
  public markerClicked = output<MarkerEventData>()

  public constructor() {
    const elRef = inject(ElementRef<HTMLElement>)
    const map = createMap({
      el: elRef.nativeElement,
      tileBaseUrl: environment.worldTilesUrl,
    })

    effect(() => map.useMapId(this.map()))
    // effect(() => map.useLandmarks(this.landmarks()))
    effect(() => map.usePointMarkers(this.pointMarkers()))
    effect(() => map.useZoneMarkers(this.zoneMarkers()))
    effect(() => this.markerHovered.emit(map.hover()))
    effect(() => this.markerClicked.emit(map.click()))
    effect(() => {
      const bounds = this.bounds()
      if (bounds?.min && bounds?.max) {
        map.fitView(bounds.min, bounds.max)
      }
    })
  }
}
