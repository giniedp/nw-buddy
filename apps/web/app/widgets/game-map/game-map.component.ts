import { CommonModule } from '@angular/common'
import { Component, ElementRef, Injector, effect, inject, input, output, signal, untracked } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { environment } from 'apps/web/environments'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import {
  AJAXError,
  FillLayerSpecification,
  FitBoundsOptions,
  GeoJSONSource,
  LineLayerSpecification,
  MapLayerEventType,
  NavigationControl,
  RasterTileSource,
  RequestTransformFunction,
  StyleSpecification,
  SymbolLayerSpecification,
  TerrainControl,
} from 'maplibre-gl'
import { NW_MAPS, NW_MAP_TILE_SIZE } from './constants'
import { GameMapHost } from './game-map-host'
import { GameMapMouseAnchorDirective } from './game-map-mouse-anchor.directive'
import { MaplibreDirective } from './maplibre.directive'
import {
  attachLayerHover,
  convertTileUrl,
  getGeometryCenter,
  rasterTileSource,
  xToLng,
  xyToLngLat,
  yToLat,
} from './utils'
const elevationScale = 0.1
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
  imports: [CommonModule, MaplibreDirective, GameMapMouseAnchorDirective],
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
      ocean: rasterTileSource('newworld_vitaeeterna', 'ocean'),
      newworld_vitaeeterna: rasterTileSource('newworld_vitaeeterna', 'nw'),
      outpostrush: rasterTileSource('outpostrush', 'nw'),

      newworld_vitaeeterna_heightmap: rasterTileSource('newworld_vitaeeterna', 'heightmap'),
      newworld_vitaeeterna_hillshade: rasterTileSource('newworld_vitaeeterna', 'heightmap'),
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
        id: 'tiles0',
        type: 'raster',
        source: 'newworld_vitaeeterna',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'tiles1',
        type: 'raster',
        source: 'outpostrush',
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'hills',
        type: 'hillshade',
        source: 'newworld_vitaeeterna_hillshade',
        layout: {
          visibility: 'none', // keep it off. Lighting is baked into the tiles
        },
        paint: {
          'hillshade-shadow-color': '#473B24',
          'hillshade-exaggeration': 0,
        },
      },
    ],
    sky: {},
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

  public mapId = input<string>('newworld_vitaeeterna')
  public fitBounds = input<[number, number, number, number]>(null)
  public fitBoundsOptions = input<FitBoundsOptions>(null)

  public territories = input<FeatureCollection>()
  public areas = input<FeatureCollection>()
  public pois = input<FeatureCollection>()
  public zoneId = input<string | number>()
  public labels = input<boolean>(true)
  public zoneClick = output<string>()

  private injector = inject(Injector)
  private terrainControl = new TerrainControl({
    source: 'newworld_vitaeeterna_heightmap',
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
    this.map.addControl(this.navigationControl)
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
      const maxBounds = mapMaxBounds(mapId)
      const fitBounds = this.fitBounds()
      untracked(() => {
        this.updateTiles(mapId)
        this.map.setMaxBounds(maxBounds)
        this.moveToBounds(fitBounds || maxBounds)
      })
    })

    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.territories() : null
      const showLabels = this.labels()
      untracked(() => this.updateTerritories(data, showLabels))
    })
    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.areas() : null
      const showLabels = this.labels()
      untracked(() => this.updateAreas(data, showLabels))
    })
    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.pois() : null
      untracked(() => this.updatePois(data))
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

  private updateTerritories(features: FeatureCollection, showLabels: boolean) {
    const sourceId = 'territories'
    const layerFillId = 'territoriesFill'
    const layerOutlineId = 'territoriesOutline'
    const layerSymbolId = 'territoriesSymbol'
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })
      this.map.addLayer({
        ...territoryFillLayout,
        id: layerFillId,
        source: sourceId,
      })
      this.map.addLayer({
        ...territoryOutlineLayout,
        id: layerOutlineId,
        source: sourceId,
      })
      this.map.addLayer({
        ...territorySymbolLayout,
        id: layerSymbolId,
        source: sourceId,
        maxzoom: 5,
      })

      attachLayerHover({
        map: this.map,
        sourceId,
        layerId: layerFillId,
      })
      this.map.on('click', layerFillId, (e) => this.handleClick(e, 4.9))
    }
    this.map.getLayer(layerSymbolId).visibility = showLabels ? 'visible' : 'none'
    const source = this.map.getSource(sourceId) as GeoJSONSource
    source.setData(features || { type: 'FeatureCollection', features: [] })
  }

  private updateAreas(features: FeatureCollection, showLabels: boolean) {
    const sourceId = 'areas'
    const layerFillId = 'areasFill'
    const layerOutlineId = 'areasOutline'
    const layerSymbolId = 'areasSymbol'
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })
      this.map.addLayer({
        ...areaFillLayout,
        id: layerFillId,
        source: sourceId,
        minzoom: 5,
      })
      this.map.addLayer({
        ...areaOutlineLayout,
        id: layerOutlineId,
        source: sourceId,
        minzoom: 5,
      })
      this.map.addLayer({
        ...areaSymbolLayout,
        id: layerSymbolId,
        source: sourceId,
        minzoom: 5,
        maxzoom: 6,
      })

      attachLayerHover({
        map: this.map,
        sourceId,
        layerId: layerFillId,
      })
      this.map.on('click', layerFillId, (e) => this.handleClick(e, 5.9))
    }
    this.map.getLayer(layerSymbolId).visibility = showLabels ? 'visible' : 'none'
    const source = this.map.getSource(sourceId) as GeoJSONSource
    source.setData(features || { type: 'FeatureCollection', features: [] })
  }

  private updatePois(features: FeatureCollection) {
    const sourceId = 'pois'
    const layerFillId = 'poisFill'
    const layerOutlineId = 'poisOutline'
    const layerIconsId = 'poisIcons'
    const layerCompassIconsId = 'poisCompassIcons'
    if (!this.map.getSource('pois')) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })
      this.map.addLayer({
        ...poisFillLayout,
        id: layerFillId,
        source: sourceId,
        minzoom: 6,
      })
      this.map.addLayer({
        ...poisOutlineLayout,
        id: layerOutlineId,
        source: sourceId,
        minzoom: 6,
      })
      this.map.addLayer({
        ...poisIconLayout,
        id: layerIconsId,
        source: sourceId,
        minzoom: 6,
      })
      this.map.addLayer({
        ...poisCompassIconLayout,
        id: layerCompassIconsId,
        source: sourceId,
        maxzoom: 6,
      })
      attachLayerHover({
        map: this.map,
        sourceId,
        layerId: layerFillId,
      })
      this.map.on('click', layerFillId, (e) => this.handleClick(e, 7))
      this.map.on('click', layerIconsId, (e) => this.handleClick(e, 7))
      this.map.on('click', layerCompassIconsId, (e) => this.handleClick(e, 7))
    }
    const source = this.map.getSource(sourceId) as GeoJSONSource
    source.setData(features || { type: 'FeatureCollection', features: [] })
  }

  private updateTiles(mapId: string) {
    const tiles = [this.map.getLayer('tiles0'), this.map.getLayer('tiles1')]
    for (const tile of tiles) {
      if (tile.type === 'raster') {
        tile.visibility = 'none'
      }
    }
    mapSourceIds(mapId).forEach((id, index) => {
      const source = this.map.getSource(id)
      if (source instanceof RasterTileSource) {
        source.tileBounds.bounds.setSouthWest([0, 0])
        const bounds = NW_MAPS.find((it) => it.id === id)?.bounds
        if (bounds) {
          source.tileBounds.bounds.setNorthEast([xToLng(bounds.width + bounds.left), yToLat(bounds.top)])
        } else {
          source.tileBounds.bounds.setNorthEast([180, 90])
        }
      }
      if (!source) {
        this.map.addSource(id, rasterTileSource(id, 'nw'))
      }
      const tile = tiles[index]
      if (tile?.type === 'raster') {
        tile.source = id
        tile.visibility = 'visible'
      }
    })

    if (isMapOpenWorld(mapId)) {
      this.map.setMaxPitch(60)
      this.map.setBearing(0)
      this.map.dragRotate.enable()
      this.map.keyboard.enable()
      if (!this.map.hasControl(this.terrainControl)) {
        this.map.addControl(this.terrainControl)
      }
      this.map.getLayer('ocean').visibility = 'visible'
    } else {
      this.map.setMaxPitch(0)
      this.map.setBearing(0)
      this.map.dragRotate.disable()
      this.map.keyboard.disable()
      if (this.map.hasControl(this.terrainControl)) {
        this.map.removeControl(this.terrainControl)
      }
      this.map.getLayer('ocean').visibility = 'none'
    }
  }

  private oldSelection: number
  private updateZoneSelection(zoneId: string | number) {
    const id = zoneId ? Number(zoneId) : null
    for (const source of ['territories', 'areas', 'pois']) {
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
    const center: [number, number] = [bounds[0] + (bounds[2] - bounds[0]) / 2, bounds[1] + (bounds[3] - bounds[1]) / 2]
    this.map.fitBounds(bounds, {
      center,
      ...options,
    })
  }

  private handleClick(e: MapLayerEventType['click'], zoom: number) {
    const feature = e.features?.[0]
    if (!feature) {
      return
    }
    setTimeout(() => {
      if (e.defaultPrevented) {
        return
      }
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

const territoryFillLayout: FillLayerSpecification = {
  id: null,
  source: null,
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#FFFFFF',
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.05,
      ['boolean', ['feature-state', 'selected'], false],
      0.15,
      0,
    ],
  },
}
const territoryOutlineLayout: LineLayerSpecification = {
  id: null,
  source: null,
  type: 'line',
  layout: {},
  paint: {
    'line-color': '#FFFFFF',
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      8,
      ['boolean', ['feature-state', 'hover'], false],
      8,
      5,
    ],
  },
}
const territorySymbolLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 20,
    'text-overlap': 'always',
  },
  paint: {
    'text-color': '#FFFFFF',
    'text-halo-color': '#000000',
    'text-halo-width': 2,
    'text-halo-blur': 2,
  },
}
const areaFillLayout: FillLayerSpecification = {
  id: null,
  source: null,
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#FFFFFF',
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.05,
      ['boolean', ['feature-state', 'selected'], false],
      0.15,
      0,
    ],
  },
}
const areaOutlineLayout: LineLayerSpecification = {
  id: null,
  source: null,
  type: 'line',
  layout: {
    'line-join': 'round',
  },
  paint: {
    'line-color': '#FF0000',
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      4,
      ['boolean', ['feature-state', 'hover'], false],
      4,
      1,
    ],
  },
}
const areaSymbolLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 20,
    'text-overlap': 'always',
  },
  paint: {
    'text-color': '#FFFFFF',
    'text-halo-color': '#000000',
    'text-halo-width': 2,
    'text-halo-blur': 2,
  },
}
const poisFillLayout: FillLayerSpecification = {
  id: null,
  source: null,
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#ceba75',
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.05,
      ['boolean', ['feature-state', 'selected'], false],
      0.15,
      0,
    ],
  },
}
const poisOutlineLayout: LineLayerSpecification = {
  id: null,
  source: null,
  type: 'line',
  layout: {
    'line-join': 'round',
  },
  paint: {
    'line-color': '#ceba75',
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      4,
      ['boolean', ['feature-state', 'hover'], false],
      4,
      1,
    ],
    'line-dasharray': [4, 2],
  },
}

const poisIconLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'icon-image': ['get', 'icon'],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
}

const poisCompassIconLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'icon-image': ['get', 'compassIcon'],
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-overlap': 'always',
  },
}

const OPEN_WORLD_MAPS = ['newworld_vitaeeterna', 'outpostrush']
function mapSourceIds(mapId: string) {
  if (isMapOpenWorld(mapId)) {
    return [...OPEN_WORLD_MAPS]
  }
  if (!mapId) {
    return []
  }
  return [mapId]
}

function isMapOpenWorld(mapId: string) {
  return OPEN_WORLD_MAPS.includes(mapId)
}

function mapMaxBounds(mapId: string): [number, number, number, number] {
  const tileSize = NW_MAP_TILE_SIZE
  if (isMapOpenWorld(mapId)) {
    const [l, b] = xyToLngLat([-12 * tileSize, -4 * tileSize])
    const [r, t] = xyToLngLat([30 * tileSize, 16 * tileSize])
    return [l, b, r, t]
  }
  const [l, b] = xyToLngLat([0, 0])
  const [r, t] = xyToLngLat([2 * tileSize, 2 * tileSize])
  return [l, b, r, t]
}
