import { Injectable } from '@angular/core'
import { Map } from 'maplibre-gl'

@Injectable()
export class GameMapProxyService {
  public get map(): Map {
    return this.provider()
  }

  private provider: () => Map
  public provide(fn: () => Map) {
    this.provider = fn
  }
}
