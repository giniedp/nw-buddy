import { NgTemplateOutlet } from '@angular/common'
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NW_MAP_NEWWORLD_VITAEETERNA } from '@nw-data/common'
import { environment } from 'apps/web/environments'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import {
  AJAXError,
  ControlPosition,
  FitBoundsOptions,
  NavigationControl,
  RasterDEMTileSource,
  RasterTileSource,
  RequestTransformFunction,
  StyleSpecification,
  TerrainControl,
} from 'maplibre-gl'
import { GameMapHost } from './game-map-host'
import { GameMapLayerDirective } from './game-map-layer.component'
import { GameMapMouseAnchorDirective } from './game-map-mouse-anchor.directive'
import { getMapConfig } from './map-configs'
import { boundsToLatLng, NW_MAP_REGION_SIZE, xyToLngLat } from './map-projection'
import {
  convertTileUrl,
  getGeometryCenter,
  heightSource,
  heightSourceEmpty,
  tileSource,
  tileSourceEmpty,
  tileSourceOcean,
} from './map-utils'
import { MaplibreDirective } from './maplibre.directive'

const elevationScale = 0.05

@Component({
  selector: 'nwb-map',
  template: `
    <div
      #map
      [nwbMaplibre]
      [renderWorldCopies]="false"
      [styleSpec]="styleSpec"
      [minZoom]="minZoom()"
      [maxZoom]="maxZoom()"
      [zoom]="4"
      [center]="[180 / 4, 90 / 4]"
      [transformRequest]="transformRequest"
      (mapError)="handleMapError($event)"
      (mapZoom)="handleMapZoom()"
      class="w-full h-full"
      id="game-map-element"
    ></div>

    <div
      [nwbMapLayer]="'territories'"
      [data]="territories()"
      [disabled]="!isOpenWorld()"
      [color]="'#FFFFFF'"
      [outline]="true"
      [outlineDashed]="false"
      [outlinePad]="4"
      [polygons]="true"
      [polyOpacity]="0"
      [labels]="labels()"
      [labelsMinZoom]="0"
      [labelsMaxZoom]="5"
      [labelSize]="20"
      (featureClick)="handleFeatureClick($event, 4.9)"
    ></div>

    <div
      [nwbMapLayer]="'areas'"
      [data]="areas()"
      [disabled]="!isOpenWorld()"
      [color]="'#FFFFFF'"
      [outline]="true"
      [outlineColor]="'#FF0000'"
      [outlineDashed]="false"
      [polygons]="true"
      [polyOpacity]="0"
      [labels]="labels()"
      [labelsMinZoom]="5"
      [labelsMaxZoom]="6"
      [labelSize]="20"
      [minZoom]="5"
      (featureClick)="handleFeatureClick($event, 5.9)"
    ></div>

    <div
      [nwbMapLayer]="'pois'"
      [data]="pois()"
      [disabled]="!isOpenWorld()"
      [color]="'#ceba75'"
      [outline]="true"
      [outlineColor]="'#ceba75'"
      [outlineDashed]="true"
      [polygons]="true"
      [polyOpacity]="0"
      [icons]="true"
      [labels]="labels()"
      [labelsMinZoom]="7"
      [labelsMaxZoom]="10"
      [labelSize]="20"
      [minZoom]="6"
      (featureClick)="handleFeatureClick($event, 7)"
    ></div>

    <ng-content />
    <div nwbGameMapMouseAnchor>
      @if (host.tooltips.length) {
        @for (tooltip of host.tooltips; track $index) {
          <ng-container [ngTemplateOutlet]="tooltip" />
        }
      }
    </div>
  `,
  host: {
    class: 'block overflow-hidden bg-[#859594]',
  },
  providers: [GameMapHost],
  imports: [NgTemplateOutlet, MaplibreDirective, GameMapMouseAnchorDirective, GameMapLayerDirective],
})
export class GameMapComponent {
  protected elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  protected host = inject(GameMapHost, { self: true })
  public get map() {
    return this.host.map
  }
  protected zoom = signal<number>(null)
  protected minZoom = signal<number>(1)
  protected maxZoom = signal<number>(10)
  protected styleSpec: StyleSpecification = {
    version: 8,
    sources: {
      ocean: tileSourceOcean(),
      empty: tileSourceEmpty(),
      emptyHeight: heightSourceEmpty(),
    },

    layers: [
      {
        id: 'ocean',
        type: 'raster',
        source: 'ocean',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'tractmap',
        type: 'raster',
        source: 'empty',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'map1',
        type: 'raster',
        source: 'empty',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'map2',
        type: 'raster',
        source: 'empty',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'hills',
        type: 'hillshade',
        source: 'emptyHeight',
        layout: {
          visibility: 'none', // keep it off. Lighting is baked into the tiles
        },
        paint: {
          'hillshade-shadow-color': '#473B24',
          'hillshade-exaggeration': 0,
        },
      },
    ],
    // sky: {},
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  }

  protected transformRequest: RequestTransformFunction = (url, resourceType) => {
    if (resourceType === 'Tile') {
      url = convertTileUrl({
        baseUrl: environment.nwTilesUrl,
        encodedUrl: url,
      })
    }
    return {
      url,
    }
  }

  public mapId = input<string>(NW_MAP_NEWWORLD_VITAEETERNA)
  public fitBounds = input<[number, number, number, number]>(null)
  public fitBoundsOptions = input<FitBoundsOptions>(null)

  public territories = input<FeatureCollection>()
  public areas = input<FeatureCollection>()
  public pois = input<FeatureCollection>()
  public zoneId = input<string | number>()
  public labels = input<boolean>(true)
  public tractmap = input<boolean>(false)
  public zoneClick = output<string>()
  public controlPosition = input<ControlPosition>('top-right')

  public isOpenWorld = computed(() => !!getMapConfig(this.mapId()).isOpenWorld)

  private injector = inject(Injector)
  private terrainControl = new TerrainControl({
    source: 'emptyHeight',
    exaggeration: elevationScale,
  })
  private navigationControl = new NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true,
  })

  public constructor() {
    this.host.ready$.pipe(takeUntilDestroyed()).subscribe(() => this.handleMapLoad())
  }

  public toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected handleMapLoad() {
    this.attachSignals()
    this.map.setMaxPitch(85)
    this.map.addControl(this.navigationControl, this.controlPosition())
  }

  protected handleMapError(e: ErrorEvent) {
    if (!(e.error instanceof AJAXError)) {
      // dont print ajax errors, they are visible in the network tab
      console.error(e)
    }
  }

  protected handleMapZoom() {
    this.zoom.set(this.map.getZoom())
  }

  private attachSignals() {
    this.effect(() => {
      const mapId = this.mapId()
      const tractmap = this.tractmap()
      untracked(() => {
        this.updateTiles(mapId, tractmap)
      })
    })
    this.effect(() => {
      const config = getMapConfig(this.mapId())
      const fitBounds = this.fitBounds() || boundsToLatLng(config.boundsPoi || config.bounds)
      untracked(() => {
        this.moveToBounds(fitBounds)
      })
    })
    this.effect(() => {
      const zoneId = this.zoneId() ? Number(this.zoneId()) : null
      const territory = this.territories()?.features?.find((it) => it.id === zoneId)
      const area = this.areas()?.features?.find((it) => it.id === zoneId)
      const poi = this.pois()?.features?.find((it) => it.id === zoneId)
      untracked(() => {
        this.updateZoneSelection(zoneId)

        if (territory) {
          this.moveToFeature(territory, 4.9)
        } else if (area) {
          this.moveToFeature(area, 5.9)
        } else if (poi) {
          this.moveToFeature(poi, 7)
        }
      })
    })
  }

  private effect(fn: () => void) {
    effect(fn, { injector: this.injector })
  }

  private updateTiles(mapId: string, showTractmap: boolean) {
    const config = getMapConfig(mapId)
    const sourceMap1ID = `${mapId}_map1`
    const sourceMap2ID = `${mapId}_map2`
    const sourceTractID = `${mapId}_tractmap`
    const sourceHeightID = `${mapId}_heightmap`

    let sourceMap1 = this.map.getSource(sourceMap1ID) as RasterTileSource
    let sourceMap2 = this.map.getSource(sourceMap2ID) as RasterTileSource
    let sourceTract = this.map.getSource(sourceTractID) as RasterTileSource
    let sourceHeight = this.map.getSource(sourceHeightID) as RasterDEMTileSource
    if (!sourceMap1) {
      this.map.addSource(sourceMap1ID, tileSource(config, 'map1'))
      sourceMap1 = this.map.getSource(sourceMap1ID) as any
    }
    if (!sourceMap2 && config.map2) {
      this.map.addSource(sourceMap2ID, tileSource(config, 'map2'))
      sourceMap2 = this.map.getSource(sourceMap2ID) as any
    }
    if (!sourceTract && config.tractmap) {
      this.map.addSource(sourceTractID, tileSource(config, 'tractmap'))
      sourceTract = this.map.getSource(sourceTractID) as any
    }
    if (!sourceHeight && config.heightmap) {
      this.map.addSource(sourceHeightID, heightSource(config))
      sourceHeight = this.map.getSource(sourceHeightID) as any
    }

    const layerMap1 = this.map.getLayer('map1')
    const layerMap2 = this.map.getLayer('map2')
    const layerOcean = this.map.getLayer('ocean')
    const layerTract = this.map.getLayer('tractmap')
    const layerHills = this.map.getLayer('hills')

    if (sourceMap1) {
      layerMap1.visibility = 'visible'
      layerMap1.source = sourceMap1ID
    } else {
      layerMap1.visibility = 'none'
      layerMap1.source = 'empty'
    }

    if (sourceMap2) {
      layerMap2.visibility = 'visible'
      layerMap2.source = sourceMap2ID
    } else {
      layerMap2.visibility = 'none'
      layerMap2.source = 'empty'
    }

    if (sourceTract && showTractmap) {
      layerTract.visibility = 'visible'
      layerTract.source = sourceTractID
    } else {
      layerTract.visibility = 'none'
      layerTract.source = 'empty'
    }

    if (sourceHeight) {
      layerHills.source = sourceHeightID
    } else {
      layerHills.source = 'emptyHeight'
    }

    if (config.isOpenWorld || (sourceTract && showTractmap)) {
      layerOcean.visibility = 'visible'
    } else {
      layerOcean.visibility = 'none'
    }

    if (config.heightmap) {
      this.map.setMaxPitch(60)
      this.map.setBearing(0)
      this.map.dragRotate.enable()
      this.map.keyboard.enable()
      this.attachTerrainControl(sourceHeightID)
    } else {
      this.map.setMaxPitch(0)
      this.map.setBearing(0)
      this.map.dragRotate.disable()
      this.map.keyboard.disable()
      this.removeTerrainControl()
    }

    this.map.setMaxBounds(
      boundsToLatLng([
        config.bounds[0] - (config.zoomPad?.[0] ?? 0),
        config.bounds[1] - (config.zoomPad?.[1] ?? 0),
        config.bounds[2] + (config.zoomPad?.[2] ?? 0),
        config.bounds[3] + (config.zoomPad?.[3] ?? 0),
      ]),
    )
  }

  private removeTerrainControl() {
    if (!this.terrainControl) {
      return
    }
    if (this.map.hasControl(this.terrainControl)) {
      this.map.removeControl(this.terrainControl)
    }
    this.terrainControl = null
  }

  private attachTerrainControl(sourceId: string) {
    this.removeTerrainControl()
    this.terrainControl = new TerrainControl({
      source: sourceId,
      exaggeration: elevationScale,
    })
    this.map.addControl(this.terrainControl, 'top-right')
  }

  private oldSelection: number
  private updateZoneSelection(zoneId: string | number) {
    const id = zoneId ? Number(zoneId) : null
    for (const source of [
      //'territories',
      'areas',
      'pois',
    ]) {
      if (this.oldSelection) {
        this.map.setFeatureState({ source, id: this.oldSelection }, { selected: false })
      }
      if (id) {
        this.map.setFeatureState({ source, id }, { selected: true })
      }
    }
    this.oldSelection = id
  }

  private moveToBounds(bounds: [number, number, number, number]) {
    if (!bounds) {
      return
    }
    const options = this.fitBoundsOptions() || {
      essential: true,
      padding: 40,
      duration: 500,
    }
    // prettier-ignore
    const center: [number, number] = [
      bounds[0] + (bounds[2] - bounds[0]) / 2,
      bounds[1] + (bounds[3] - bounds[1]) / 2,
    ]
    this.map.fitBounds(bounds, {
      center,
      ...options,
    })
  }

  protected handleFeatureClick(features: Feature[], zoom: number) {
    const feature = features?.[0]
    if (!feature) {
      return
    }
    setTimeout(() => {
      this.zoneClick.emit(String(feature.id))
      this.moveToFeature(feature, zoom)
    })
  }

  private moveToFeature(feature: Feature<Geometry, unknown>, zoom: number) {
    if (!feature) {
      return
    }
    const geometry = feature.geometry
    const center = getGeometryCenter(geometry)
    this.map.flyTo({
      center: center,
      zoom: zoom,
      essential: true,
    })
  }
}
