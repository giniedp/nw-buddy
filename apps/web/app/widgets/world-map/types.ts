
export type MapMarker<T = unknown> = MapPointMarker<T> | MapZoneMarker<T>

export interface MapPointMarker<T = unknown> extends MapMarkerBase {
  point: number[]
  payload?: T
}

export interface MapZoneMarker<T = unknown> extends MapMarkerBase {
  shape: number[][]
  icon?: string
  payload?: T
}

export interface MapMarkerBase {
  id?: string
  title?: string
  color: string
  outlineColor?: string
  radius?: number
  opacity?: number
  layer?: string
  outlineWidth?: number
  tags?: string[]
}

export interface MapView {
  x: number
  y: number
  zoom: number
}

export interface MapViewBounds {
  min: number[]
  max: number[]
}

export interface MarkerEventData {
  pixel: number[]
  coords: number[]
  markers: MapMarker[]
}
