import { Feature, FeatureCollection, Geometry, Point } from 'geojson'
import { ExpressionSpecification, GeoJSONSource, Map, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl'

/**
 * Point features at exactly the same position form a stack. Its members get these properties, single points none.
 */
export interface StackProperties {
  /**
   * Number of members, filters not applied
   */
  stackSize: number
  /**
   * Index of the member in its stack
   */
  stackIndex: number
  /**
   * The position of the stack, `lng,lat`
   */
  stackKey: string
}

/**
 * Rings drawn per member: more members share the outermost ring
 */
export const STACK_RING_COUNT = 5
const STACK_RING_GAP = 3

/**
 * A position of a point or multi point feature
 */
interface StackEntry {
  feature: number
  point: number
}

/**
 * Splits the stacked positions out of the point and multi point features of the collection: each becomes a point
 * feature with {@link StackProperties}. Positions that are not stacked stay in their features.
 */
export function withStacks<G extends Geometry, P>(data: FeatureCollection<G, P>): FeatureCollection<G, P> {
  if (!data?.features?.length) {
    return data
  }
  const groups = new globalThis.Map<string, StackEntry[]>()
  let maxId = 0
  data.features.forEach((feature, index) => {
    if (typeof feature.id === 'number') {
      maxId = Math.max(maxId, feature.id)
    }
    const geometry = feature.geometry
    if (geometry?.type === 'Point') {
      addEntry(groups, geometry.coordinates, { feature: index, point: -1 })
    } else if (geometry?.type === 'MultiPoint') {
      geometry.coordinates.forEach((position, point) => {
        addEntry(groups, position, { feature: index, point })
      })
    }
  })

  // positions per feature that move into stack features
  const stacked = new globalThis.Map<number, Set<number>>()
  const stackFeatures: Array<Feature<G, P>> = []
  for (const [key, group] of groups) {
    if (group.length < 2) {
      continue
    }
    group.forEach((entry, stackIndex) => {
      const source = data.features[entry.feature]
      const points = stacked.get(entry.feature) ?? stacked.set(entry.feature, new Set()).get(entry.feature)
      points.add(entry.point)
      const coordinates =
        entry.point < 0 ? (source.geometry as Point).coordinates : source.geometry['coordinates'][entry.point]
      stackFeatures.push({
        type: 'Feature',
        id: ++maxId,
        geometry: { type: 'Point', coordinates } as Point as G,
        properties: {
          ...source.properties,
          stackSize: group.length,
          stackIndex,
          stackKey: key,
        } satisfies StackProperties,
      })
    })
  }
  if (!stackFeatures.length) {
    return data
  }

  const features: Array<Feature<G, P>> = []
  data.features.forEach((feature, index) => {
    const points = stacked.get(index)
    if (!points) {
      features.push(feature)
      return
    }
    if (feature.geometry.type !== 'MultiPoint') {
      return
    }
    const remaining = feature.geometry.coordinates.filter((_, point) => !points.has(point))
    if (remaining.length) {
      features.push({ ...feature, geometry: { ...feature.geometry, coordinates: remaining } })
    }
  })
  features.push(...stackFeatures)
  return { ...data, features }
}

function addEntry(groups: globalThis.Map<string, StackEntry[]>, position: number[], entry: StackEntry) {
  const key = `${position[0]},${position[1]}`
  const group = groups.get(key)
  if (group) {
    group.push(entry)
  } else {
    groups.set(key, [entry])
  }
}

/**
 * Ring radius of a stack member: one ring per member index, the last ring for all further members
 */
export function stackRingRadius(base: number | ExpressionSpecification): ExpressionSpecification {
  return [
    '+',
    base,
    STACK_RING_GAP,
    ['*', STACK_RING_GAP, ['min', ['coalesce', ['get', 'stackIndex'], 0], STACK_RING_COUNT - 1]],
  ]
}

/**
 * Only stack members draw rings
 */
export const STACK_RING_FILTER: ExpressionSpecification = ['>', ['coalesce', ['get', 'stackSize'], 0], 1]

/**
 * Pixel offsets of fanned out members around their stack: a circle for few members, a spiral for many
 */
export function fanOffsets(count: number): Array<[number, number]> {
  const result: Array<[number, number]> = []
  if (count <= 8) {
    const radius = Math.max(40, (count * 26) / (2 * Math.PI))
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count
      result.push([Math.cos(angle) * radius, Math.sin(angle) * radius])
    }
    return result
  }
  let leg = 30
  let angle = 0
  for (let i = 0; i < count; i++) {
    angle += 26 / leg + i * 0.0005
    result.push([Math.cos(angle) * leg, Math.sin(angle) * leg])
    leg += (2 * Math.PI * 4) / angle
  }
  return result
}

export interface StackFanOptions {
  map: Map
  /**
   * Id of the fan source, the fan layers derive their ids from it
   */
  id: string
  /**
   * Circle color, `color` property of the members when not set
   */
  color: string | null
  /**
   * Draws the members with their icons
   */
  icons: boolean
  /**
   * Receives the mouse events on the fanned out members
   */
  onMouseEnter: (e: MapLayerMouseEvent) => void
  onMouseMove: (e: MapLayerMouseEvent) => void
  onMouseLeave: (e: MapLayerMouseEvent) => void
  onClick: (e: MapLayerMouseEvent) => void
}

/**
 * Fans out the visible members of a stack when the cursor is on it. Which members are visible comes from the hovered
 * features, so layer filters apply. The fan closes when the cursor leaves it or the camera moves.
 */
export class StackFan {
  private sourceId: string
  private lineLayerId: string
  private circleLayerId: string
  private iconLayerId: string
  private openKey: string = null
  private center: [number, number] = null
  private reach = 0

  public constructor(private options: StackFanOptions) {
    this.sourceId = `fan-${options.id}`
    this.lineLayerId = `fan-line-${options.id}`
    this.circleLayerId = `fan-circle-${options.id}`
    this.iconLayerId = `fan-icon-${options.id}`
  }

  /**
   * Opens the fan for the stack of the hovered features, if two or more of them share the position. Returns the key
   * of the open stack, null without one.
   */
  public hover(features: Array<Feature>): string | null {
    const key = features?.find((it) => it.properties?.['stackKey'])?.properties['stackKey'] as string
    if (key && key !== this.openKey) {
      const members = features.filter((it) => it.properties?.['stackKey'] === key)
      if (members.length >= 2) {
        this.open(key, members)
      }
    }
    return this.openKey
  }

  public close() {
    if (!this.openKey) {
      return
    }
    this.openKey = null
    this.center = null
    this.hoveredMember = null
    const map = this.options.map
    map.off('mousemove', this.handleMapMove)
    map.off('movestart', this.handleCameraMove)
    this.removeLayers()
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId)
    }
  }

  public dispose() {
    this.close()
  }

  private open(key: string, members: Array<Feature>) {
    this.close()
    const map = this.options.map
    const [lng, lat] = key.split(',').map(Number)
    const center = map.project([lng, lat])
    const offsets = fanOffsets(members.length)
    const features: Feature[] = []
    members.forEach((member, index) => {
      const [dx, dy] = offsets[index]
      const position = map.unproject([center.x + dx, center.y + dy])
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[lng, lat], position.toArray()] },
        properties: { color: member.properties['color'] },
      })
      features.push({
        type: 'Feature',
        id: index + 1,
        geometry: { type: 'Point', coordinates: position.toArray() } satisfies Point,
        properties: member.properties,
      })
    })
    this.openKey = key
    this.center = [center.x, center.y]
    this.reach = Math.max(...offsets.map(([x, y]) => Math.hypot(x, y))) + 24

    map.addSource(this.sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features } })
    this.addLayers()
    map.on('mousemove', this.handleMapMove)
    map.on('movestart', this.handleCameraMove)
  }

  private addLayers() {
    const { map, color, icons } = this.options
    map.addLayer({
      id: this.lineLayerId,
      source: this.sourceId,
      type: 'line',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': color ?? ['get', 'color'],
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    })
    map.addLayer({
      id: this.circleLayerId,
      source: this.sourceId,
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 8,
        'circle-color': color ?? ['get', 'color'],
        'circle-stroke-color': '#000000',
        'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1],
      },
    })
    const interactive = [this.circleLayerId]
    if (icons) {
      map.addLayer({
        id: this.iconLayerId,
        source: this.sourceId,
        type: 'symbol',
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['number', ['get', 'iconSize'], 1],
          'icon-allow-overlap': true,
        },
      })
      interactive.push(this.iconLayerId)
    }
    for (const layerId of interactive) {
      map.on('mouseenter', layerId, this.handleMemberEnter)
      map.on('mousemove', layerId, this.handleMemberMove)
      map.on('mouseleave', layerId, this.handleMemberLeave)
      map.on('click', layerId, this.options.onClick)
    }
  }

  private removeLayers() {
    const map = this.options.map
    for (const layerId of [this.iconLayerId, this.circleLayerId, this.lineLayerId]) {
      if (!map.getLayer(layerId)) {
        continue
      }
      map.off('mouseenter', layerId, this.handleMemberEnter)
      map.off('mousemove', layerId, this.handleMemberMove)
      map.off('mouseleave', layerId, this.handleMemberLeave)
      map.off('click', layerId, this.options.onClick)
      map.removeLayer(layerId)
    }
  }

  private hoveredMember: string | number = null

  private setMemberHover(id: string | number) {
    const map = this.options.map
    if (this.hoveredMember != null && map.getSource(this.sourceId)) {
      map.setFeatureState({ source: this.sourceId, id: this.hoveredMember }, { hover: false })
    }
    this.hoveredMember = id
    if (id != null) {
      map.setFeatureState({ source: this.sourceId, id }, { hover: true })
    }
  }

  private handleMemberEnter = (e: MapLayerMouseEvent) => {
    this.setMemberHover(e.features?.[0]?.id ?? null)
    this.options.onMouseEnter(e)
  }

  private handleMemberMove = (e: MapLayerMouseEvent) => {
    this.setMemberHover(e.features?.[0]?.id ?? null)
    this.options.onMouseMove(e)
  }

  private handleMemberLeave = (e: MapLayerMouseEvent) => {
    this.setMemberHover(null)
    this.options.onMouseLeave(e)
  }

  private handleMapMove = (e: MapMouseEvent) => {
    if (!this.center) {
      return
    }
    const distance = Math.hypot(e.point.x - this.center[0], e.point.y - this.center[1])
    if (distance > this.reach) {
      this.close()
    }
  }

  private handleCameraMove = () => {
    this.close()
  }
}
