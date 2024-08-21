import { Directive, ElementRef, Input, inject, input, output } from '@angular/core'
import { Map, MapLibreEvent, MapMouseEvent, RequestTransformFunction, StyleSpecification } from 'maplibre-gl'
import { missingImageHandler } from './missing-image-hander'

@Directive({
  standalone: true,
  selector: '[nwbMaplibre]',
})
export class MaplibreDirective {
  public nwbMaplibre = input<void>()

  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  public readonly map: Map = new Map({
    container: this.elRef.nativeElement,
    attributionControl: false,
  })

  @Input()
  public set renderWorldCopies(value: boolean) {
    this.map.setRenderWorldCopies(value)
  }
  public get renderWorldCopies() {
    return this.map.getRenderWorldCopies()
  }

  @Input()
  public set minZoom(value: number) {
    this.map.setMinZoom(value)
  }
  public get minZoom() {
    return this.map.getMinZoom()
  }

  @Input()
  public set maxZoom(value: number) {
    this.map.setMaxZoom(value)
  }
  public get maxZoom() {
    return this.map.getMaxZoom()
  }

  @Input()
  public set zoom(value: number) {
    this.map.setZoom(value)
  }
  public get zoom() {
    return this.map.getZoom()
  }

  @Input()
  public set center(value: [number, number]) {
    this.map.setCenter(value)
  }

  @Input()
  public set styleSpec(value: StyleSpecification) {
    this.map.setStyle(value, {
      diff: false,
    })
  }
  public get styleSpec() {
    return this.map.getStyle()
  }

  @Input()
  public set transformRequest(value: RequestTransformFunction) {
    this.map.setTransformRequest(value)
  }

  public mapLoad = output<MapLibreEvent>()
  public mapError = output<ErrorEvent>()
  public mapMouseMove = output<MapMouseEvent>()
  public mapZoom = output<MapLibreEvent>()
  public constructor() {
    this.map.on('load', (e) => this.mapLoad.emit(e))
    this.map.on('error', (e) => this.mapError.emit(e))
    this.map.on('mousemove', (e) => this.mapMouseMove.emit(e))
    this.map.on('zoom', (e) => this.mapZoom.emit(e))
    this.map.on('styleimagemissing', missingImageHandler({ iconSize: 64 }))
  }
}
