import { SamplerState } from '@gglib/graphics'
import { vec4, type IVec3 } from '@gglib/math'
import type { Renderer } from '@gglib/render'
import type { ViewerLightConfig } from '../../api'
import type { ProbeCube, ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { InputSlots } from '../../material'
import type { TimeOfDay } from '../level/TimeOfDay'
import type { EnvProbeComponent } from './EnvProbeComponent'

/**
 * Writes the environment probe state to the global shader inputs.
 *
 * @remarks
 * Falls back to the default probe while the global cube loads. Without a global probe (model and material previews)
 * or in the `sky` mode the shaders use the dynamic sky cube.
 */
export class EnvProbeInputs {
  private global = vec4(0)
  private diffuse = vec4(1)
  private specular = vec4(1)
  private fog = vec4(0)

  private renderer: Renderer
  private cubes: ProbeCubeLoader
  private timeOfDay: TimeOfDay

  public constructor(renderer: Renderer, cubes: ProbeCubeLoader, timeOfDay: TimeOfDay) {
    this.renderer = renderer
    this.cubes = cubes
    this.timeOfDay = timeOfDay
    renderer.inputs.set(InputSlots.Global.ProbeSpecularCubes, cubes.atlas.specular)
    renderer.inputs.set(InputSlots.Global.ProbeDiffuseCubes, cubes.atlas.diffuse)
    renderer.inputs.set(InputSlots.Global.ProbeSampler, SamplerState.LinearClamp)
  }

  public write(probe: EnvProbeComponent | null) {
    const cube = probe ? this.resolveCube(probe) : null
    this.global.x = cube?.slot ?? 0
    this.global.y = cube ? 1 : 0
    if (cube) {
      this.writeColors(probe, cube === probe.cube)
    }
    this.writeFog(!!cube)
    const inputs = this.renderer.inputs
    inputs.set(InputSlots.Global.ProbeGlobal, this.global)
    inputs.set(InputSlots.Global.ProbeDiffuseColor, this.diffuse)
    inputs.set(InputSlots.Global.ProbeSpecularColor, this.specular)
    inputs.set(InputSlots.Global.VolFog2Probe, this.fog)
  }

  /**
   * Fog in-scattering of the global probe (CVolumetricFog::PrepareLightList): the probe light color times the
   * entities fog albedo. Attenuation is 1, the global probe box spans the level.
   */
  private writeFog(enabled: boolean) {
    const albedo = this.timeOfDay.volFog2EntityAlbedo
    this.fog.x = this.diffuse.x * albedo.x
    this.fog.y = this.diffuse.y * albedo.y
    this.fog.z = this.diffuse.z * albedo.z
    this.fog.w = enabled ? 1 : 0
  }

  private resolveCube(probe: EnvProbeComponent): ProbeCube | null {
    if (probe.cube?.state === 'ready') {
      return probe.cube
    }
    return this.cubes.defaultCube?.state === 'ready' ? this.cubes.defaultCube : null
  }

  private writeColors(probe: EnvProbeComponent, ownCube: boolean) {
    const specular = envProbeColor(ownCube ? probe.config : null, this.timeOfDay, this.diffuse)
    this.diffuse.w = 1
    this.specular.x = this.diffuse.x * specular
    this.specular.y = this.diffuse.y * specular
    this.specular.z = this.diffuse.z * specular
    this.specular.w = 1
  }
}

/**
 * The light color of a probe with the time of day multipliers (the probe's todInfluence), written to `diffuse`
 *
 * @param config - the probe, null for the default cube (white, no multipliers)
 * @returns the specular factor, the specular color is diffuse × factor
 */
export function envProbeColor(config: ViewerLightConfig | null, tod: TimeOfDay, diffuse: IVec3): number {
  const color = config ? config.color : DEFAULT_COLOR
  const diffuseMultiplier = config?.diffuseMultiplier ?? 1
  const specularMultiplier = config?.specMultiplier ?? 1
  const influence = config?.todInfluence ?? 0

  const tint = tod.envProbeMultiplier
  const todDiffuse = tod.envProbeDiffuseMultiplier
  diffuse.x = color[0] * diffuseMultiplier * influenced(tint.x * todDiffuse, influence)
  diffuse.y = color[1] * diffuseMultiplier * influenced(tint.y * todDiffuse, influence)
  diffuse.z = color[2] * diffuseMultiplier * influenced(tint.z * todDiffuse, influence)
  return specularMultiplier * influenced(tod.envProbeSpecularMultiplier, influence)
}

const DEFAULT_COLOR: [number, number, number, number] = [1, 1, 1, 1]

function influenced(value: number, influence: number) {
  return 1 + (value - 1) * influence
}
