import { Geometry, Position } from 'geojson'
import { Map, RasterDEMSourceSpecification, RasterSourceSpecification } from 'maplibre-gl'
import { eqCaseInsensitive, humanize } from '~/utils'
import { NW_MAPS, NW_MAP_LEVELS, NW_MAP_TILE_SIZE } from './constants'
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

export type TileAddress = {
  mapId: string
  type: string
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

export function encodedTileUrl(mapId: string, type: string) {
  return `id=${mapId}&x={x}&y={y}&z={z}&type=${type || 'nw'}`
}

export function rasterTileSource(
  newWorldMapId: string,
  type: string = null,
): RasterSourceSpecification | RasterDEMSourceSpecification {
  if (type === 'nw' || type === 'ocean') {
    return {
      type: 'raster',
      tiles: [encodedTileUrl(newWorldMapId, type)],
      tileSize: NW_MAP_TILE_SIZE,
      bounds: [0, 0, 90, 90],
    }
  }
  return {
    type: 'raster-dem',
    tiles: [encodedTileUrl(newWorldMapId, type)],
    tileSize: NW_MAP_TILE_SIZE,
    bounds: [0, 0, 90, 90],
    encoding: 'custom',
    redFactor: 255 * 255,
    greenFactor: 255,
    blueFactor: 0,
    baseShift: 0,
  }
}

export function decodeTileUrl(encodedUrl: string): TileAddress {
  const params = new URLSearchParams(encodedUrl)
  const mapId = params.get('id')
  const x = Number(params.get('x'))
  const y = Number(params.get('y'))
  const z = Number(params.get('z'))
  const type = params.get('type')
  return { mapId, x, y, z, type }
}

const oceanTile =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALklEQVR42u3OMQEAAAQAMMJrQF5ieLYEy5reeJQCAgICAgICAgICAgICAgLfgQND2FXBysQXQQAAAABJRU5ErkJggg=='
export function convertTileUrl({ encodedUrl, baseUrl }: { encodedUrl: string; baseUrl: string }) {
  const tile = decodeTileUrl(encodedUrl)
  const address = getTileAddress(tile)

  // return renderDebugTile({
  //   text: [
  //     `x:${tile.x} y:${tile.y} z:${tile.z}`,
  //     `${address.x},${address.y},${address.l}`,
  //     `${address2.x},${address2.y},${address2.l}`,
  //   ],
  //   tileSize: 256,
  // })
  if (tile.type === 'ocean') {
    return oceanTile
  }
  if (Number(address.x) < 0 || Number(address.y) < 0) {
    return null
  }

  if (tile.type === 'nw') {
    const file = `map_l${address.l}_y${address.y}_x${address.x}.webp`
    return `${baseUrl}/lyshineui/worldtiles/${tile.mapId}/${file}`
  }
  const file = `${tile.type}_l${address.l}_y${address.y}_x${address.x}.png`
  return `${baseUrl}/lyshineui/worldtiles/${tile.mapId}/${tile.type}/${address.l}/${file}`
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

export function getTileAddress({ x, y, z }: TileAddress) {
  const level = NW_MAP_LEVELS - z + 1
  const step = Math.max(Math.pow(2, level - 1), 1)
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

export function gameMapOptionsForMapIds(values: string[]) {
  return values.map((mapId) => {
    for (const map of NW_MAPS) {
      if (eqCaseInsensitive(map.id, mapId)) {
        return {
          value: map.id,
          label: map.name,
        }
      }
    }
    return {
      value: mapId,
      label: humanize(mapId),
    }
  })
}
