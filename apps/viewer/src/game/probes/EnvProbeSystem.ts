import { PriorityLane } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { vec3, vec3$init, vec3$initFrom, vec3$normalize } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { SkyLightSystem } from '../level/SkyLightSystem'
import type { TimeOfDay } from '../level/TimeOfDay'
import type { LightClusterProbe, LightClusterShader } from '../light/LightClusterShader'
import { compareEnvProbes, EnvProbeComponent } from './EnvProbeComponent'
import { envProbeColor, EnvProbeInputs } from './EnvProbeInputs'

/**
 * Tracks the active environment probes in blend order and requests their cubes.
 *
 * @remarks
 * Probes activate with their slice, so the list only holds probes around the camera.
 * GPU resources are handled by the {@link ProbeCubeLoader}, shading is handled elsewhere.
 */
export class EnvProbeSystem extends GameSystem {
  /**
   * Active probes, in blend order
   */
  public readonly active: EnvProbeComponent[] = []
  /**
   * The global probe the placed probes blend over, the last one in blend order
   */
  public global: EnvProbeComponent | null = null

  private query: GameQuery
  private cubes: ProbeCubeLoader
  private inputs: EnvProbeInputs
  private timeOfDay: TimeOfDay
  private record: LightClusterProbe = {
    position: vec3(),
    axisX: vec3(),
    axisY: vec3(),
    axisZ: vec3(),
    extents: vec3(),
    falloff: 0,
    slot: 0,
    color: vec3(),
    specular: 0,
  }

  public initialize(world: GameWorld): void {
    this.query = world.query({ scope: 'active', required: [EnvProbeComponent] })
    this.cubes = world.getSystem(ProbeCubeLoader)
    this.timeOfDay = world.getSystem(SkyLightSystem).timeOfDay
    this.inputs = new EnvProbeInputs(world.getSystem(Renderer), this.cubes, this.timeOfDay)
  }

  public override update(): void {
    const active = this.active
    active.length = 0
    this.global = null
    for (const entity of this.query) {
      const probe = entity.component(EnvProbeComponent)
      if (probe.enabled) {
        // the global probe is visible everywhere, it must not wait for placed probes
        probe.cube ??= this.cubes.request(
          probe.config.cubemap,
          probe.isGlobal ? PriorityLane.High : PriorityLane.Medium,
          entity,
        )
        active.push(probe)
      }
    }
    active.sort(compareEnvProbes)
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].isGlobal) {
        this.global = active[i]
        break
      }
    }
  }

  public override render(): void {
    this.inputs.write(this.global)
  }

  /**
   * Adds the placed probes with a loaded cube to the cluster light list, in blend order. The global probes are not
   * in the list, the shading gives the global probe what the placed probes leave.
   */
  public addClusterProbes(shader: LightClusterShader) {
    const record = this.record
    for (const probe of this.active) {
      if (probe.isGlobal || probe.cube?.state !== 'ready') {
        continue
      }
      // the box follows the probe rotation: the axes are the columns of the world matrix
      const world = probe.entity.getTransform().world
      vec3$init(record.position, world[12], world[13], world[14])
      vec3$normalize(vec3$init(record.axisX, world[0], world[1], world[2]))
      vec3$normalize(vec3$init(record.axisY, world[4], world[5], world[6]))
      vec3$normalize(vec3$init(record.axisZ, world[8], world[9], world[10]))
      vec3$initFrom(record.extents, probe.extents)
      record.falloff = probe.config.falloff ?? 0
      record.slot = probe.cube.slot
      record.specular = envProbeColor(probe.config, this.timeOfDay, record.color)
      shader.addProbe(record)
    }
  }

  public destroy(): void {
    this.active.length = 0
    this.global = null
  }
}
