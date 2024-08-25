import { Component, Injector, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core'
import { environment } from 'apps/web/environments'
import { FeatureCollection } from 'geojson'
import {
  AJAXError,
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  MapMouseEvent,
  Popup,
  RequestTransformFunction,
  StyleSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import { NW_MAP_TILE_SIZE } from './constants'
import { GameMapProxyService } from './game-map.proxy'
import { MaplibreDirective } from './maplibre.directive'
import {
  attachLayerHover,
  convertTileUrl,
  getGeometryCenter,
  rasterTileSource,
  xyFromLngLat,
  xyToLngLat,
} from './utils'
import { DomPortalOutlet } from '@angular/cdk/portal'
@Component({
  standalone: true,
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
      (mapLoad)="handleMapLoad()"
      (mapError)="handleMapError($event)"
      (mapMouseMove)="handleMapMouseMove($event)"
      (mapZoom)="handleMapZoom()"
      class="w-full h-full"
      id="game-map-element"
    ></div>
    <div class="absolute top-2 left-2">{{ zoom() }} | {{ info() || '' }}</div>
    <ng-content />
  `,
  host: {
    class: 'block overflow-hidden bg-[#859594]',
  },
  imports: [MaplibreDirective],
})
export class GameMapComponent {
  protected mapDirective = viewChild(MaplibreDirective)
  public get map() {
    return this.mapDirective().map
  }
  protected info = signal<string>(null)
  protected zoom = signal<number>(null)
  protected minZoom = signal<number>(1)
  protected maxZoom = signal<number>(8)
  protected styleSpec: StyleSpecification = {
    version: 8,
    sources: {
      newworld_vitaeeterna: rasterTileSource('newworld_vitaeeterna'),
      outpostrush: rasterTileSource('outpostrush'),
    },
    layers: [
      {
        id: 'tiles0',
        type: 'raster',
        source: 'newworld_vitaeeterna',
      },
      {
        id: 'tiles1',
        type: 'raster',
        source: 'outpostrush',
      },
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  }

  protected transformRequest: RequestTransformFunction = (url, resourceType) => {
    if (resourceType === 'Tile') {
      url = convertTileUrl({
        baseUrl: environment.cdnDataUrl,
        encodedUrl: url,
      })
    }
    return {
      url,
    }
  }

  public mapId = input<string>('newworld_vitaeeterna')
  public territories = input<FeatureCollection>()
  public areas = input<FeatureCollection>()
  public pois = input<FeatureCollection>()
  public zoneClick = output<string>()

  private injector = inject(Injector)

  public constructor() {
    inject(GameMapProxyService, { optional: true })?.provide(() => this.map)
  }

  protected handleMapLoad() {
    this.map.resize()
    this.attachSignals()
  }

  protected handleMapError(e: ErrorEvent) {
    if (!(e.error instanceof AJAXError)) {
      // dont print ajax errors, they are visible in the network tab
      console.error(e)
    }
  }

  protected handleMapMouseMove(e: MapMouseEvent) {
    const [x, y] = xyFromLngLat([e.lngLat.lng, e.lngLat.lat])

    this.info.set(`x:${x.toFixed(2)} y:${y.toFixed(2)} | lng:${e.lngLat.lng} lat:${e.lngLat.lat}`)
  }
  protected handleMapZoom() {
    this.zoom.set(this.map.getZoom())
  }

  private attachSignals() {
    this.effect(() => {
      const mapId = this.mapId()
      untracked(() => this.updateTiles(mapId))
      const bounds = mapMaxBounds(mapId)
      this.map.setMaxBounds(bounds)
    })
    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.territories() : null
      untracked(() => this.updateTerritories(data))
    })
    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.areas() : null
      untracked(() => this.updateAreas(data))
    })
    this.effect(() => {
      const isOpenWorld = isMapOpenWorld(this.mapId())
      const data = isOpenWorld ? this.pois() : null
      untracked(() => this.updatePois(data))
    })
  }

  private effect(fn: () => void) {
    effect(fn, { injector: this.injector })
  }

  private updateTerritories(features: FeatureCollection) {
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
        getId: (feature) => feature.id as string | number,
      })
      this.map.on('click', layerFillId, (e) => {
        const feature = e.features[0]
        this.zoneClick.emit(String(feature.id))
        const geometry = feature.geometry
        const center = getGeometryCenter(geometry)
        this.map.flyTo({
          center: center,
          zoom: 4.9,
          essential: true,
        })
      })
    }
    const source = this.map.getSource(sourceId) as GeoJSONSource
    source.setData(features || { type: 'FeatureCollection', features: [] })
  }

  private updateAreas(features: FeatureCollection) {
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
        getId: (feature) => feature.id as string | number,
      })
      this.map.on('click', layerFillId, (e) => {
        const feature = e.features[0]
        this.zoneClick.emit(String(feature.id))
        const geometry = feature.geometry
        const center = getGeometryCenter(geometry)
        this.map.flyTo({
          center: center,
          zoom: 5.9,
          essential: true,
        })
      })
    }
    const source = this.map.getSource(sourceId) as GeoJSONSource
    source.setData(features || { type: 'FeatureCollection', features: [] })
  }

  private updatePois(features: FeatureCollection) {
    const sourceId = 'pois'
    const layerFillId = 'poisFill'
    const layerOutlineId = 'poisOutline'
    const layerIconsId = 'poisIcons'
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
      attachLayerHover({
        map: this.map,
        sourceId,
        layerId: layerFillId,
        getId: (feature) => feature.id as string | number,
      })
      this.map.on('click', layerFillId, (e) => {
        const feature = e.features[0]
        this.zoneClick.emit(String(feature.id))
        const geometry = feature.geometry
        const center = getGeometryCenter(geometry)
        this.map.flyTo({
          center: center,
          zoom: 7,
          essential: true,
        })
      })
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

      if (!source) {
        this.map.addSource(id, rasterTileSource(id))
      }
      const tile = tiles[index]
      if (tile?.type === 'raster') {
        tile.source = id
        tile.visibility = 'visible'
      }
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
    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0, 0.1],
  },
}
const territoryOutlineLayout: LineLayerSpecification = {
  id: null,
  source: null,
  type: 'line',
  layout: {},
  paint: {
    'line-color': '#FFFFFF',
    'line-width': 5,
  },
}
const territorySymbolLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 20,
  },
  paint: {
    'text-color': '#FFFFFF',
    'text-halo-color': '#000000',
    'text-halo-width': 2,
  },
}
const areaFillLayout: FillLayerSpecification = {
  id: null,
  source: null,
  type: 'fill',
  layout: {},
  paint: {
    'fill-color': '#FFFFFF',
    'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.1, 0],
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
    'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1],
  },
}
const areaSymbolLayout: SymbolLayerSpecification = {
  id: null,
  source: null,
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 16,
  },
  paint: {
    'text-color': '#FFFFFF',
    'text-halo-color': '#000000',
    'text-halo-width': 1,
  },
}
const poisFillLayout: FillLayerSpecification = {
  id: null,
  source: null,
  type: 'fill',
  layout: {},
  paint: {
    'fill-opacity': 0,
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
    'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
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
