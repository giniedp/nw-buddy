import { Injectable } from '@angular/core'

import { xFromLong, xToLong, xyFromLngLat, xyToLongLat, yFromLat, yToLat } from './map-projection'

@Injectable({ providedIn: 'root' })
export class GameMapService {
  public xyToLngLat = xyToLongLat
  public xyFromLngLat = xyFromLngLat
  public xToLng = xToLong
  public xFromLng = xFromLong
  public yToLat = yToLat
  public yFromLat = yFromLat
}
