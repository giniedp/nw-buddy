import { Geometry, Position } from 'geojson'
import { Map, RasterDEMSourceSpecification, RasterSourceSpecification } from 'maplibre-gl'
import { MapBounds, MapConfig } from './map-configs'
import { boundsToLatLong, projectTileAddress } from './map-projection'

export const STATIC_TILE_OCEAN =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNsnTrlPwAGBAKvyzjVtgAAAABJRU5ErkJggg=='
export const STATIC_TILE_TRANSPARENT =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export type TileLayer = 'map1' | 'map2' | 'tractmap' | 'heightmap'
export type TileConfig = {
  map: MapConfig
  layer: TileLayer
  x: number
  y: number
  z: number
}

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

export function encodedTileUrl(config: MapConfig, layer: TileLayer) {
  const template = 'x={x}&y={y}&z={z}'
  const params = new URLSearchParams()
  params.set('layer', layer)
  params.set('config', JSON.stringify(config))
  return template + '&' + params.toString()
}

export function decodeTileUrl(encodedUrl: string): TileConfig {
  const params = new URLSearchParams(encodedUrl)
  const map = JSON.parse(params.get('config')) as MapConfig
  const layer = params.get('layer') as any
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const z = Number(params.get('z'))
  if (!map) {
    return null
  }
  return { map, x, y, z, layer }
}

export function tileSourceEmpty(): RasterSourceSpecification {
  return rasterSource({
    tiles: [STATIC_TILE_TRANSPARENT],
  })
}

export function tileSourceOcean(): RasterSourceSpecification {
  return rasterSource({
    tiles: [STATIC_TILE_OCEAN],
  })
}

export function tileSource(config: MapConfig, layer: TileLayer): RasterSourceSpecification {
  let bounds: MapBounds = config.bounds ? boundsToLatLong(config.bounds) : [0, 0, 90, 45]
  if (config.map2Bounds && layer === 'map2') {
    bounds = boundsToLatLong(config.map2Bounds)
  }
  return rasterSource({
    tiles: [encodedTileUrl(config, layer)],
    bounds,
  })
}

export function heightSourceEmpty(): RasterDEMSourceSpecification {
  return rasterDemSource({
    tiles: [STATIC_TILE_TRANSPARENT],
  })
}

export function heightSource(config: MapConfig): RasterDEMSourceSpecification {
  let bounds: MapBounds = config.bounds ? boundsToLatLong(config.bounds) : [0, 0, 90, 45]
  return rasterDemSource({
    tiles: [encodedTileUrl(config, 'heightmap')],
    bounds,
  })
}

function rasterSource(data: Partial<RasterSourceSpecification>): RasterSourceSpecification {
  return {
    type: 'raster',
    tiles: [],
    tileSize: 1024,
    bounds: [0, 0, 90, 45],
    ...data,
  }
}

function rasterDemSource(data: Partial<RasterDEMSourceSpecification>): RasterDEMSourceSpecification {
  return {
    type: 'raster-dem',
    tiles: [],
    tileSize: 1024,
    bounds: [0, 0, 90, 45],
    encoding: 'custom',
    redFactor: 1 << 16,
    greenFactor: 1 << 8,
    blueFactor: 0,
    baseShift: 0,
    ...data,
  }
}

export function convertTileUrl({ encodedUrl, baseUrl }: { encodedUrl: string; baseUrl: string }) {
  const tile = decodeTileUrl(encodedUrl)
  if (!tile) {
    return encodedUrl
  }

  console.log('convertTileUrl', {
    encodedUrl,
    baseUrl,
    tile
  })

  const address = projectTileAddress(tile)
  const x = String(address.x).padStart(3, '0')
  const y = String(address.y).padStart(3, '0')
  const z = address.z

  if (address.x < 0 || address.y < 0 || address.z <= 0) {
    return null
  }

  const config = tile.map
  if (!config.mapId) {
    return null
  }
  switch (tile.layer) {
    case 'map1': {
      return `${baseUrl}/lyshineui/worldtiles/${config.mapId}/map_l${z}_y${y}_x${x}.webp`
    }
    case 'map2': {
      return `${baseUrl}/lyshineui/worldtiles/${config.map2}/map_l${z}_y${y}_x${x}.webp`
    }
    case 'tractmap': {
      return `${baseUrl}/lyshineui/worldtiles/${config.mapId}/tractmap/${z}/tractmap_l${z}_y${y}_x${x}.webp`
    }
    case 'heightmap': {
      return `${baseUrl}/lyshineui/worldtiles/${config.mapId}/heightmap/${z}/heightmap_l${z}_y${y}_x${x}.png`
    }
    default: {
      return renderDebugTile({
        text: [`x:${tile.x} y:${tile.y} z:${tile.z}`, `${x},${y},${z}`],
        tileSize: 256,
      })
    }
  }
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

export function renderDebugTile({ text, tileSize }: { text: string[]; tileSize: number }): string {
  const canvas = getCanvas()
  const context = getContext()
  canvas.width = tileSize
  canvas.height = tileSize
  context.fillStyle = 'white'
  context.clearRect(0, 0, tileSize, tileSize)
  context.strokeRect(0, 0, tileSize, tileSize)
  context.font = '20px Arial'
  text.forEach((line, index) => {
    context.fillText(line, 50, 20 + 20 * index)
  })
  return canvas.toDataURL()
}

export function attachLayerHover({ map, sourceId, layerId }: { map: Map; sourceId: string; layerId: string }) {
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
