import type { GameComponent, GameEntity } from '@gglib/ecs'
import {
  boxPointIntersects,
  mat4GetTranslationX,
  mat4GetTranslationY,
  mat4GetTranslationZ,
  spherePointIntersects,
  vec3,
  vec3$init,
  type IVec3,
} from '@gglib/math'
import type { ViewerTimeOfDayComponent } from '../../api'
import { TimeOfDayPreset } from './TimeOfDayPreset'

export class TimeOfDayComponent implements GameComponent {
  public config: ViewerTimeOfDayComponent
  public preset: TimeOfDayPreset
  public readonly entity: GameEntity

  public constructor(config: ViewerTimeOfDayComponent) {
    this.config = config
    this.preset = new TimeOfDayPreset(config.preset)
  }

  public isPointInside(point: IVec3) {
    const world = this.entity.getTransform().world
    const px = mat4GetTranslationX(world)
    const py = mat4GetTranslationY(world)
    let pz = mat4GetTranslationZ(world)

    const config = this.config
    switch (config.shape) {
      case 'box': {
        const min = vec3$init(vec3.$1, px - config.width / 2, py - config.depth / 2, pz - config.height / 2)
        const max = vec3$init(vec3.$2, px + config.width / 2, py + config.depth / 2, pz + config.height / 2)
        if (boxPointIntersects(min, max, point)) {
          return true
        }
        break
      }
      case 'sphere': {
        if (spherePointIntersects(vec3$init(vec3.$0, px, py, pz), config.radius, point)) {
          return true
        }
        break
      }
      case 'cylinder': {
        pz = point.z
        if (spherePointIntersects(vec3$init(vec3.$0, px, py, pz), config.radius, point)) {
          return true
        }
        break
      }
    }
    return false
  }
}
