import { Directive, ElementRef, Input, OnDestroy, inject, input, output } from '@angular/core'
import {
  Map,
  MapEventType,
  MapLibreEvent,
  MapMouseEvent,
  RequestTransformFunction,
  StyleSpecification,
} from 'maplibre-gl'
import { GameMapHost } from './game-map-host'
import { missingImageHandler } from './missing-image-hander'

@Directive({
  standalone: true,
  selector: '[nwbMaplibre]',
  providers: [GameMapHost],
})
export class MaplibreDirective implements OnDestroy {
  private mapHost = inject(GameMapHost, { self: true })
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

  private handleErrors = (e: MapEventType['error']) => this.mapError.emit(e)
  private handleMouseMove = (e: MapEventType['mousemove']) => this.mapMouseMove.emit(e)
  private handleZoom = (e: MapEventType['zoom']) => this.mapZoom.emit(e)
  private handleLoad = (e: MapEventType['load']) => {
    this.map.resize()
    this.mapLoad.emit(e)
    this.mapHost.setReady()
  }
  private handleStyleImageMissing = missingImageHandler({ iconSize: 64 })

  public constructor() {
    this.mapHost.setMap(this.map)
    this.map.on('load', this.handleLoad)
    this.map.on('error', this.handleErrors)
    this.map.on('mousemove', this.handleMouseMove)
    this.map.on('zoom', this.handleZoom)
    this.map.on('styleimagemissing', this.handleStyleImageMissing)
  }

  public ngOnDestroy() {
    this.map.off('load', this.handleLoad)
    this.map.off('error', this.handleErrors)
    this.map.off('mousemove', this.handleMouseMove)
    this.map.off('zoom', this.handleZoom)
    this.map.off('styleimagemissing', this.handleStyleImageMissing)
    setTimeout(() => {
      this.map.remove()
    })
  }
}
