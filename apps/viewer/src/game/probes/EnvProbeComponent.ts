import { BoundsComponent } from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { BoundingBox, mat4CreateScaleXYZ, vec3, type IVec3 } from '@gglib/math'
import type { ViewerLightConfig } from '../../api'
import type { ProbeCube } from '../../content/ProbeCubeLoader'
import { DebugLayer, type DebugShapeComponent } from '../debug/DebugShapeComponent'

/**
 * Probes at least this large on all axes cover the whole level, like the 100000 x 100000 x 10000 mission probes.
 * The engine has no such concept, they simply sort last. The viewer needs to know them to skip bounds and culling.
 */
const GLOBAL_PROBE_MIN_AREA = 10000

/**
 * Marks an entity as an environment probe. Picked up by the {@link EnvProbeSystem} while the entity is active.
 *
 * @remarks
 * The probe is placed and oriented by the entity world transform, its influence box follows that rotation.
 * The parallax box (config.boxProject) does not, it is aligned to the world axes (shadeLib.cfi).
 */
export class EnvProbeComponent implements GameComponent {
  public entity: GameEntity
  public readonly config: ViewerLightConfig
  public enabled = true
  /**
   * Half size of the influence box along the local axes (LightInstance.cpp: m_ProbeExtents = area / 2)
   */
  public readonly extents: IVec3
  /**
   * Length of the extents, used as tie breaker when sorting (m_fRadius)
   */
  public readonly radius: number
  public readonly isGlobal: boolean
  /**
   * The baked cubes of this probe, set by the {@link EnvProbeSystem} once the probe is active
   */
  public cube: ProbeCube | null = null

  public get priority() {
    return this.config.sortPriority ?? 0
  }

  public constructor(config: ViewerLightConfig) {
    const area = config.probeArea ?? [20, 20, 20]
    this.config = config
    this.extents = vec3(area[0] * 0.5, area[1] * 0.5, area[2] * 0.5)
    this.radius = Math.hypot(this.extents.x, this.extents.y, this.extents.z)
    this.isGlobal = Math.min(area[0], area[1], area[2]) >= GLOBAL_PROBE_MIN_AREA
  }
}

/**
 * Sort order of the tiled shading (CubemapsCompareInv in D3DDeferredShading.cpp): highest priority first,
 * then smallest first. Probes are blended front to back, so the global probe gets what the others leave.
 */
export function compareEnvProbes(a: EnvProbeComponent, b: EnvProbeComponent) {
  return b.priority - a.priority || a.radius - b.radius
}

/**
 * Creates the components of a probe entity. Hidden probes and probes without a cubemap are not rendered by the engine,
 * they only get the debug shape.
 */
export function createEnvProbeComponents(config: ViewerLightConfig, debug: DebugShapeComponent): GameComponent[] {
  const probe = new EnvProbeComponent(config)
  const result: GameComponent[] = []
  if (config.cubemap && !config.hidden) {
    result.push(probe)
  }
  // a global probe covers everything: nothing to see, and no use in the spatial index
  if (!probe.isGlobal) {
    const { x, y, z } = probe.extents
    // not a bounds-box: that draws the world aligned box, the influence box follows the probe rotation
    debug.add({
      type: 'box',
      color: vec3(config.color),
      alpha: 0.125,
      solid: true,
      layer: DebugLayer.LightProbe,
      instances: [mat4CreateScaleXYZ(x * 2, y * 2, z * 2)],
    })
    result.push(new BoundsComponent({ box: BoundingBox.create(-x, -y, -z, x, y, z) }))
  }
  return result
}
