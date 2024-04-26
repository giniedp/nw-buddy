import { signal } from '@angular/core'
import { groupBy } from 'lodash'
import { Feature } from 'ol'
import Map from 'ol/Map'
import View from 'ol/View'
import { getCenter } from 'ol/extent'
import { Point, Polygon, Circle } from 'ol/geom'
import BaseLayer from 'ol/layer/Base'
import VectorLayer from 'ol/layer/Vector'
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import TileLayer from 'ol/layer/WebGLTile'
import { Projection } from 'ol/proj'
import { Vector as VectorSource, Zoomify } from 'ol/source'
import { TileCoord } from 'ol/tilecoord'
import { Landmark, LandmarkPoint, LandmarkZone } from '../land-map'

export interface MarkerEventData {
  pixel: number[]
  coords: number[]
  markers: Landmark[]
}
const tileSize = 1024
const regionSize = 2048
const regionsX = 8
const regionsY = 8
const levels = 7
const worldWidth = regionsX * regionSize
const worldHeight = regionsY * regionSize
const extent = [0, 0, worldWidth, worldHeight]

export function getTileAddress([z, x, y]: TileCoord) {
  const level = levels - z
  const step = Math.pow(2, level) / 2
  if (level < 1 || level > levels) {
    return null
  }
  const adrX = (x * step).toString().padStart(3, '0')
  const adrY = ((Math.pow(2, z) - y - 1) * step).toString().padStart(3, '0')
  return [level, adrX, adrY]
}

export type WorldMap = Awaited<ReturnType<typeof createMap>>
export function createMap(el: HTMLElement) {
  const projection = new Projection({
    code: 'pixel-map',
    units: 'pixels',
    extent: extent,
  })

  const map = new Map({
    target: el,
    layers: [],
    controls: [],
    view: new View({
      projection,
      center: getCenter(extent),
      zoom: 2,
      minZoom: 0,
      maxZoom: levels + 1,
    }),
  })
  function fitView(min: number[], max: number[]) {
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2]
    const radius = Math.max(max[0] - min[0], max[1] - min[1]) / 2
    const circle = new Circle(center, radius)
    map.getView().fit(circle)
  }
  const tileSource = new Zoomify({
    extent: extent,
    size: [worldWidth, worldHeight],
    url: '',
    tilePixelRatio: 1,
    tileSize: tileSize,
    projection: projection,
  })
  function useMapId(mapId: string) {
    tileSource.clear()
    map.removeLayer(tileLayer)

    if (!mapId) {
      tileSource.setTileUrlFunction(() => null)
      return
    }

    tileSource.setTileUrlFunction((coord) => {
      const [level, addrX, addrY] = getTileAddress(coord)
      return `https://cdn.nw-buddy.de/worldtiles/${mapId}/map_l${level}_y${addrY}_x${addrX}.webp`
    })
    map.getLayers().insertAt(0, tileLayer)
  }
  const tileLayer = new TileLayer({
    source: tileSource,
  })
  map.addLayer(tileLayer)

  const dataLayers: BaseLayer[] = []
  function clear() {
    for (const layer of dataLayers) {
      map.removeLayer(layer)
    }
    dataLayers.length = 0
  }

  function useLandmarks(landmarks: Landmark[]) {
    clear()
    if (!landmarks) {
      return
    }
    const zoneMarks = landmarks.filter((landmark) => 'shape' in landmark) as LandmarkZone[]
    const pointMarks = landmarks.filter((landmark) => 'point' in landmark) as LandmarkPoint[]

    for (const items of Object.values(groupBy(zoneMarks, (it) => [it.color, it.opacity, it.layer].join('-')))) {
      const layer = new VectorLayer({
        source: new VectorSource({
          features: items.map((item) => {
            const poly = new Polygon([item.shape])
            return new Feature({
              geometry: poly,
              item: item,
              payload: item.payload,
            })
          }),
        }),
        style: {
          'fill-color': getFillColor(items[0]),
          'stroke-color': items[0].outlineColor ?? '#000',
          'stroke-width': 1,
        },
      })
      dataLayers.push(layer)
      map.addLayer(layer)
    }

    for (const items of Object.values(
      groupBy(pointMarks, (it) => [it.color, it.outlineColor, it.opacity, it.layer].join('-')),
    )) {
      const source = new VectorSource({
        features: items.map((item) => {
          return new Feature({
            geometry: new Point(item.point),
            item: item,
            payload: item.payload,
          })
        }),
      })
      const layer = new WebGLPointsLayer({
        source,
        style: {
          'circle-opacity': items[0].opacity ?? 0.75,
          'circle-radius': items[0].radius ?? 10,
          'circle-fill-color': items[0].color ?? '#fff',
          'circle-stroke-color': items[0].outlineColor ?? '#000',
          'circle-stroke-width': 1,
        },
      })
      dataLayers.push(layer)
      map.addLayer(layer)
    }
  }
  const hover = signal<MarkerEventData>(null)
  const click = signal<MarkerEventData>(null)

  map.on('pointermove', (e) => {
    const pixel = map.getEventPixel(e.originalEvent)
    const coords = map.getEventCoordinate(e.originalEvent)
    const markers = map.getFeaturesAtPixel(pixel).map((it) => it.get('item') as Landmark)
    hover.set({ pixel, coords, markers })
  })

  map.on('click', (e) => {
    const pixel = map.getEventPixel(e.originalEvent)
    const coords = map.getEventCoordinate(e.originalEvent)
    const markers = map.getFeaturesAtPixel(pixel).map((it) => it.get('item') as Landmark)
    click.set({ pixel, coords, markers })
  })
  return {
    useMapId,
    useLandmarks,
    fitView,
    clear,
    hover,
    click,
  }
}

function getFillColor(mark: Landmark) {
  const rgb = hexToRgb(mark.color ?? '#ffffff')
  const opacity = mark.opacity ?? 1
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: 255,
        g: 255,
        b: 255,
      }
}
