import { Injectable } from '@angular/core'

import { xFromLng, xToLng, xyFromLngLat, xyToLngLat, yFromLat, yToLat } from './map-projection'

@Injectable({ providedIn: 'root' })
export class GameMapService {
  public xyToLngLat = xyToLngLat
  public xyFromLngLat = xyFromLngLat
  public xToLng = xToLng
  public xFromLng = xFromLng
  public yToLat = yToLat
  public yFromLat = yFromLat
}
