import { LngLatBounds, Map, MapGeoJSONFeature, RasterSourceSpecification } from 'maplibre-gl'
import { NW_MAP_LEVELS, NW_MAP_TILE_SIZE } from './constants'
import {
  latFromMercatorY,
  lngFromMercatorX,
  mercatorXfromLng,
  mercatorYfromLat,
  nwXFromMercator,
  nwXToMercator,
  nwYFromMercator,
  nwYToMercator,
} from './projection'
import { Geometry, Position } from 'geojson'

export type TileAddress = {
  mapId: string
  x: number
  y: number
  z: number
}

export const TILE_URL_TEMPLATE = `x:{x}_y:{y}_z:{z}`

export function removeLayer(map: Map, layerId: string) {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId)
  }
}

export function removeSource(map: Map, layerId: string) {
  if (map.getSource(layerId)) {
    map.removeSource(layerId)
  }
}

export function withLayer(map: Map, layerId: string, callback: (layer: ReturnType<Map['getLayer']>) => void) {
  const layer = map.getLayer(layerId)
  if (layer) {
    callback(layer)
  }
}

export function encodedTileUrl(mapId: string) {
  return `id=${mapId}&x={x}&y={y}&z={z}`
}

export function rasterTileSource(newWorldMapId: string): RasterSourceSpecification {
  return {
    type: 'raster',
    tiles: [encodedTileUrl(newWorldMapId)],
    tileSize: NW_MAP_TILE_SIZE,
    bounds: [0, 0, 90, 90],
  }
}

export function decodeTileUrl(encodedUrl: string): TileAddress {
  const params = new URLSearchParams(encodedUrl)
  const mapId = params.get('id')
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const z = Number(params.get('z'))
  return { mapId, x, y, z }
}

export function convertTileUrl({ encodedUrl, baseUrl }: { encodedUrl: string; baseUrl: string }) {
  const tile = decodeTileUrl(encodedUrl)
  const address = getTileAddress(tile)
  const file = `map_l${address.l}_y${address.y}_x${address.x}.webp`
  //return renderDebugTile({ text: `${tile.x}/${tile.y}/${tile.z} => (${address.x},${address.y},${address.l})`, tileSize: NW_TILES.tileSize })
  return `${baseUrl}/lyshineui/worldtiles/${tile.mapId}/${file}`
}

let canvas: HTMLCanvasElement
function getCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas')
  }
  return canvas
}
function getContext() {
  return getCanvas().getContext('2d')
}

export function renderDebugTile({ text, tileSize }: { text: string; tileSize: number }): string {
  const canvas = getCanvas()
  const context = getContext()
  canvas.width = tileSize
  canvas.height = tileSize
  context.fillStyle = 'white'
  context.clearRect(0, 0, tileSize, tileSize)
  context.strokeRect(0, 0, tileSize, tileSize)
  //context.rect(0, 0, tileSize, tileSize)
  context.font = '20px Arial'
  //context.fillStyle = 'red'
  context.fillText(text, 50, 50)
  return canvas.toDataURL()
}

export function getTileAddress({ x, y, z }: TileAddress) {
  const level = NW_MAP_LEVELS - z + 1
  const step = Math.pow(2, level - 1)
  const shift = Math.pow(2, z - 1)
  x -= shift
  y += shift

  const adrX = (x * step).toString().padStart(3, '0')
  const adrY = ((Math.pow(2, z) - y - 1) * step).toString().padStart(3, '0')
  return {
    l: level,
    x: adrX,
    y: adrY,
  }
}

export function xToLng(x: number) {
  return lngFromMercatorX(nwXToMercator(x))
}
export function yToLat(y: number) {
  return latFromMercatorY(nwYToMercator(y))
}

export function xFromLng(lng: number) {
  return nwXFromMercator(mercatorXfromLng(lng))
}
export function yFromLat(lat: number) {
  return nwYFromMercator(mercatorYfromLat(lat))
}

export function xyFromLngLat([lng, lat]: [number, number]) {
  return [xFromLng(lng), yFromLat(lat)]
}

export function xyToLngLat([x, y]: [number, number]) {
  return [xToLng(x), yToLat(y)]
}

export function attachLayerHover({
  map,
  sourceId,
  layerId,
  //getId,
}: {
  map: Map
  sourceId: string
  layerId: string
  getId: (feature: MapGeoJSONFeature) => string | number
}) {
  const hoverIds: Array<string | number> = []
  const toAdd: Array<string | number> = []
  const toRemove: Array<string | number> = []
  map.on('mousemove', layerId, (e) => {
    if (!e.features?.length) {
      return
    }
    toAdd.length = 0
    toRemove.length = 0
    for (const item of e.features) {
      if (item.id == null) {
        continue
      }
      if (!hoverIds.includes(item.id)) {
        toAdd.push(item.id)
      }
    }
    for (const id of hoverIds) {
      if (e.features.every((it) => it.id !== id)) {
        toRemove.push(id)
      }
    }

    for (const id of toAdd) {
      map.setFeatureState({ source: sourceId, id }, { hover: true })
      hoverIds.push(id)
    }
    for (const id of toRemove) {
      map.setFeatureState({ source: sourceId, id }, { hover: false })
      const index = hoverIds.indexOf(id)
      if (index >= 0) {
        hoverIds.splice(index, 1)
      }
    }
  })
  map.on('mouseleave', layerId, (e) => {
    for (const id of hoverIds) {
      map.setFeatureState({ source: sourceId, id }, { hover: false })
    }
    hoverIds.length = 0
  })
}

export function* eachGeometryPoint(geometry: Geometry): Generator<Position> {
  switch (geometry.type) {
    case 'Point': {
      yield geometry.coordinates
      break
    }
    case 'Polygon':
    case 'MultiLineString': {
      for (const item of geometry.coordinates) {
        for (const point of item) {
          yield point
        }
      }
      break
    }
    case 'GeometryCollection': {
      for (const item of geometry.geometries) {
        yield* eachGeometryPoint(item)
      }
      break
    }
    case 'LineString':
    case 'MultiPoint': {
      for (const point of geometry.coordinates) {
        yield point
      }
      break
    }
    case 'MultiPolygon': {
      for (const item of geometry.coordinates) {
        for (const item2 of item) {
          for (const point of item2) {
            yield point
          }
        }
      }
    }
  }
}

export function getGeometryBounds(geometry: Geometry): [number, number, number, number] {
  let min: Position
  let max: Position
  for (const [x, y] of eachGeometryPoint(geometry)) {
    if (!min) {
      min = [x, y]
      max = [x, y]
    } else {
      min[0] = Math.min(min[0], x)
      min[1] = Math.min(min[1], y)
      max[0] = Math.max(max[0], x)
      max[1] = Math.max(max[1], y)
    }
  }
  return [min[0], min[1], max[0], max[1]]
}

export function getGeometryCenter(geometry: Geometry): [number, number] {
  const [minX, minY, maxX, maxY] = getGeometryBounds(geometry)
  return [(minX + maxX) / 2, (minY + maxY) / 2]
}
