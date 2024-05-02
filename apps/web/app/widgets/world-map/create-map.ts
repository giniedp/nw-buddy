import { signal } from '@angular/core'
import { groupBy } from 'lodash'
import { Feature } from 'ol'
import Map from 'ol/Map'
import View from 'ol/View'
import { getCenter } from 'ol/extent'
import { Point, Polygon } from 'ol/geom'
import LayerGroup from 'ol/layer/Group'
import VectorLayer from 'ol/layer/Vector'
import WebGLPointsLayer from 'ol/layer/WebGLPoints'
import TileLayer from 'ol/layer/WebGLTile'
import { Projection } from 'ol/proj'
import { Vector as VectorSource, Zoomify } from 'ol/source'
import Icon from 'ol/style/Icon'
import Style from 'ol/style/Style'
import { TileCoord } from 'ol/tilecoord'
import { crc32 } from '~/utils'
import { MapMarker, MapPointMarker, MapZoneMarker, MarkerEventData } from './types'

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

export interface WorldMapOptions {
  el: HTMLElement
  tileBaseUrl: string
}
export type WorldMap = Awaited<ReturnType<typeof createMap>>
export function createMap({ el, tileBaseUrl }: WorldMapOptions) {
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
    if (!min || !max) {
      return
    }
    const padding = 48

    map.getView().fit(new Polygon([[min, [max[0], min[1]], max, [min[0], max[1]], min]]), {
      duration: 300,
      padding: [padding, padding, padding, padding],
      maxZoom: levels - 1,
    })
  }
  const tileSource = new Zoomify({
    extent: extent,
    size: [worldWidth, worldHeight],
    url: '',
    tilePixelRatio: 1,
    tileSize: tileSize,
    projection: projection,
  })
  function setMapId(mapId: string) {
    tileSource.clear()
    map.removeLayer(tileLayer)

    if (!mapId) {
      tileSource.setTileUrlFunction(() => null)
      return
    }

    tileSource.setTileUrlFunction((coord) => {
      const [level, addrX, addrY] = getTileAddress(coord)
      return `${tileBaseUrl}${mapId}/map_l${level}_y${addrY}_x${addrX}.webp`
    })
    map.getLayers().insertAt(0, tileLayer)
  }
  const tileLayer = new TileLayer({
    source: tileSource,
  })
  map.addLayer(tileLayer)

  const zoneLayers = new LayerGroup({
    layers: [],
  })
  map.addLayer(zoneLayers)

  const iconLayer = new VectorLayer({
    zIndex: 100,
    source: new VectorSource({ features: [] }),
    minZoom: levels - 3,
    maxZoom: levels + 1,
  })
  map.addLayer(iconLayer)

  let pointTag: number =  1
  const pointLayers = new LayerGroup({
    layers: [],
  })
  map.addLayer(pointLayers)

  function clearZoneLayers() {
    zoneLayers.getLayers().clear()
    iconLayer.getSource().clear()
  }
  function setTag(tag: string) {
    pointTag = tag ? tagToNumber(tag) : 1
    pointLayers.getLayers().forEach((layer: WebGLPointsLayer<any>) => {
      layer.updateStyleVariables({
        tag: pointTag,
      })
    })
  }

  function setZoneMarkers(markers: MapZoneMarker[]) {
    clearZoneLayers()
    if (!markers) {
      return
    }
    for (const items of Object.values(groupBy(markers, (it) => it.layer))) {
      let zIndex = 1
      if (items[0].layer === 'Area') {
        zIndex = 2
      }
      if (items[0].layer === 'POI') {
        zIndex = 3
      }
      zoneLayers.getLayers().push(createZoneLayer(items, zIndex))
    }
    iconLayer.getSource().addFeatures(createIconFeatures(markers))
  }

  function clearPointLayers() {
    pointLayers.getLayers().clear()
  }

  function setPointMarkers(markers: MapPointMarker[]) {
    clearPointLayers()
    if (!markers) {
      return
    }

    for (const items of Object.values(groupBy(markers, (it) => it.layer ?? 'default'))) {
      const layer = createColoredPointsLayer(items)
      layer.updateStyleVariables({
        tag: pointTag,
      })
      pointLayers.getLayers().push(layer)
    }
  }

  const hover = signal<MarkerEventData>(null)
  const click = signal<MarkerEventData>(null)

  let hoverMarker: Feature[]
  map.on('pointermove', (e) => {
    const pixel = map.getEventPixel(e.originalEvent)
    const coords = map.getEventCoordinate(e.originalEvent)
    const features = map.getFeaturesAtPixel(pixel)
    const markers = features.map((it) => it.get('item') as MapMarker)
    if (hoverMarker) {
      hoverMarker.forEach((it) => it.set?.('hover', 0))
    }
    hoverMarker = features as any
    if (hoverMarker) {
      hoverMarker.forEach((it) => it.set?.('hover', 1))
    }
    hover.set({ pixel, coords, markers })
  })

  map.on('click', (e) => {
    const pixel = map.getEventPixel(e.originalEvent)
    const coords = map.getEventCoordinate(e.originalEvent)
    const features = map.getFeaturesAtPixel(pixel)
    const markers = features.map((it) => it.get('item') as MapMarker)

    click.set({ pixel, coords, markers })
  })
  return {
    setMapId,
    setTag,
    setZoneMarkers,
    setPointMarkers,
    clearPointLayers,
    clearZoneLayers,
    fitView,
    // clear,
    hover,
    click,
  }
}

function getFillColor(mark: MapMarker) {
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

function createColoredPointsLayer(items: MapPointMarker[], zIndex = 1000) {
  const exprC1 = ['color', ['get', 'c1r'], ['get', 'c1g'], ['get', 'c1b'], ['get', 'opacity']]
  const exprC2 = ['color', ['get', 'c2r'], ['get', 'c2g'], ['get', 'c2b']]
  return new WebGLPointsLayer({
    zIndex,
    source: new VectorSource({
      features: items.map((item) => {
        const c1 = hexToRgb(item.color ?? '#ffffff')
        const c2 = hexToRgb(item.outlineColor ?? '#000000')
        const tags = item.tags || []
        return new Feature({
          geometry: new Point(item.point),
          item: item,
          payload: item.payload,
          c1r: c1.r,
          c1g: c1.g,
          c1b: c1.b,
          c2r: c2.r,
          c2g: c2.g,
          c2b: c2.b,
          opacity: item.opacity ?? 0.75,
          radius: item.radius ?? 10,
          tag1: tagToNumber(tags[0] || ''),
          tag2: tagToNumber(tags[1] || ''),
          tag3: tagToNumber(tags[2] || ''),
        })
      }),
    }),
    style: {
      variables: {
        tag: '',
      },
      'circle-radius': ['get', 'radius'],
      'circle-fill-color': exprC1,
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'hover'], 1],
        '#ffffff',
        ['==', ['var', 'tag'], ['get', 'tag1']],
        '#ffffff',
        ['==', ['var', 'tag'], ['get', 'tag2']],
        '#ffffff',
        ['==', ['var', 'tag'], ['get', 'tag3']],
        '#ffffff',
        exprC2,
      ],
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'hover'], 1],
        2,
        ['==', ['var', 'tag'], ['get', 'tag1']],
        2,
        ['==', ['var', 'tag'], ['get', 'tag2']],
        2,
        ['==', ['var', 'tag'], ['get', 'tag3']],
        2,
        1,
      ],
    },
  })
}

function createZoneLayer(items: MapZoneMarker[], zIndex = 1) {
  let minZoom = -1
  if (zIndex === 3) {
    minZoom = 3
  }
  if (zIndex === 2) {
    minZoom = 1
  }
  return new VectorLayer({
    zIndex,
    style: zIndex ===3 ? {
      'fill-color': ['get', 'color1'],
      'stroke-color': ['get', 'color2'],
      'stroke-width': ['get', 'strokeWidth'],
      'stroke-line-dash': [5, 5],

    } : {
      'fill-color': ['get', 'color1'],
      'stroke-color': ['get', 'color2'],
      'stroke-width': ['get', 'strokeWidth'],
    },
    minZoom,
    source: new VectorSource({

      features: items.map((item) => {
        const shape = [...item.shape]
        if (shape[0][0] !== shape[shape.length - 1][0] || shape[0][1] !== shape[shape.length - 1][1]) {
          shape.push(shape[0])
        }
        const poly = new Polygon([shape])
        return new Feature({
          geometry: poly,
          item: item,
          payload: item.payload,
          color1: getFillColor(item),
          color2: item.outlineColor ?? '#000000',
          strokeWidth: item.outlineWidth ?? 1,
        })
      }),
    }),
  })
}

function createIconFeatures(items: MapZoneMarker[]) {
  const features: Feature[] = []
  for (const item of items) {
    if (!item.icon) {
      continue
    }
    const iconFeature = new Feature({
      geometry: new Polygon([item.shape]).getInteriorPoint(),
    })
    iconFeature.setStyle(
      new Style({
        image: new Icon({
          width: 48,
          height: 48,
          src: item.icon,
        }),
      }),
    )
    features.push(iconFeature)
  }
  return features
}

function tagToNumber(tag: string) {
  return tag ? crc32(tag) : -1
}
