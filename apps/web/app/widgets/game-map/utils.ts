import { Map, MapGeoJSONFeature, RasterSourceSpecification } from 'maplibre-gl'
import { NW_TILES } from './constants'
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
    tileSize: NW_TILES.tileSize,
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

export function convertTileUrl({
  encodedUrl,
  baseUrl,
  levels,
}: {
  encodedUrl: string
  baseUrl: string
  levels: number
}) {
  const tile = decodeTileUrl(encodedUrl)
  const address = getTileAddress(tile, levels)
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

export function getTileAddress({ x, y, z }: TileAddress, maxLevel: number) {

  const level = (maxLevel - z + 1)
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

const worldWidth = NW_TILES.worldWidth
const worldHeight = NW_TILES.worldHeight
function xToMercator(value: number) {
  return 0.5 * (1 + value / worldWidth)
}
function yToMercator(value: number) {
  return 0.5 * (1 - value / worldHeight)
}
function xFromMercator(value: number) {
  return (value - 0.5) * worldWidth
}
function yFromMercator(value: number) {
  return (1 - value) * worldHeight
}
export function xToLng(x: number) {
  return lngFromMercatorX(xToMercator(x))
}
export function yToLat(y: number) {
  return latFromMercatorY(yToMercator(y))
}

export function xFromLng(lng: number) {
  return xFromMercator(mercatorXfromLng(lng))
}
export function yFromLat(lat: number) {
  return yFromMercator(mercatorYfromLat(lat))
}

export function xyFromLngLat([lng, lat]: [number, number]) {
  return [xFromLng(lng), yFromLat(lat)]
}

export function xyToLngLat([x, y]: [number, number]) {
  return [xToLng(x), yToLat(y)]
}

export function mercatorXfromLng(lng: number) {
  return (180 + lng) / 360
}

export function mercatorYfromLat(lat: number) {
  return (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360
}

export function lngFromMercatorX(x: number) {
  return x * 360 - 180
}

export function latFromMercatorY(y: number) {
  const y2 = 180 - y * 360
  return (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90
}

export function attachLayerHover({
  map,
  sourceId,
  layerId,
  getId,
}: {
  map: Map
  sourceId: string
  layerId: string
  getId: (feature: MapGeoJSONFeature) => string | number
}) {
  let hoverId: string | number
  map.on('mousemove', layerId, (e) => {
    if (e.features.length > 0) {
      if (hoverId) {
        map.setFeatureState({ source: sourceId, id: hoverId }, { hover: false })
      }
      hoverId = getId(e.features[0])
      map.setFeatureState({ source: sourceId, id: hoverId }, { hover: true })
    }
  })
  map.on('mouseleave', layerId, (e) => {
    if (hoverId) {
      map.setFeatureState({ source: sourceId, id: hoverId }, { hover: false })
    }
    hoverId = null
  })
}
