import {
  BlendState,
  CullState,
  DepthState,
  Effect,
  MaterialWithSchema,
  RenderVariant,
  SamplerState,
  ShaderConstants,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { vec2, vec4 } from '@gglib/math'
import { FoamMapKey, FoamNormalMapKey, GlossMapKey } from '../content'
import { getShaderConstants, InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import type { NwMaterialProps } from './GltfExtension'
import { MtlUtil, paramValue, paramVec4 } from './utils'
import SCHEMA from './WaterPatchMaterial.meta'
import WGSL from './WaterPatchMaterial.wgsl'

export function waterPatchShaderOptions(constants: Record<string, number>): ShaderModuleOptions {
  return {
    name: 'Water Shader',
    wgsl: {
      source: WGSL,
      fragmentConstants: ShaderConstants.get(constants),
      vertexConstants: ShaderConstants.get(constants),
    },
    glsl: null,
  }
}

export function waterPatchEffectOptions(constants: Record<string, number>): EffectOptions {
  return {
    name: 'Water Effect',
    meta: {},
    program: {
      shader: waterPatchShaderOptions(constants),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
    },
  }
}

interface PublicParams {
  FoamCrestAmount: string //            | number | 9 |
  SoftIntersectionFactor: string //     | number | 9 |
  SubSurfaceScatteringScale: string //  | number | 9 |
  RainTilling: string //                | number | 9 |
  DetailNormalsScale: string //         | number | 9 |
  DetailTilling: string //              | number | 9 |
  FresnelGloss: string //               | number | 9 |
  HeightScale: string //                | number | 9 |
  FoamSoftIntersectionFactor: string // | number | 9 |
  ReflectionBumpScale: string //        | number | 9 |
  NormalsScale: string //               | number | 9 |
  FoamAmount: string //                 | number | 9 |
  RefractionBumpScale: string //        | number | 9 |
  FoamTilling: string //                | number | 9 |
  Tilling: string //                    | number | 9 |
  GradientScale: string //              | number | 9 |
  FoamNormalScale: string //            | number | 7 |
  FoamNormalSeparation: string //       | number | 7 |
  FoamTransitionSpeed: string //        | number | 7 |
  FoamNormalFade: string //             | number | 7 |
  ReflectionScale: string //            | number | 7 |
  FoamNormalTiling: string //           | number | 7 |
  EnvCubeReflMul: string //             | number | 6 |
  EnvCubeScale: string //               | number | 6 |
  RealtimeReflMul: string //            | number | 6 |
}

const water = new MtlUtil('Water', {
  knowsDeform: true,
  knownMaps: [],
  knownMods: [],
  knownFlags: [],
})

/**
 * Ocean animation, from the WaterOceanComponent or the mission `<OceanAnimation>` attributes
 */
export interface OceanAnimationParams {
  windDirection?: string | number
  windSpeed?: string | number
  wavesAmount?: string | number
  wavesSize?: string | number
  wavesSpeed?: string | number
}

export class WaterPatchMaterial extends MaterialWithSchema(SCHEMA) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Water Patch Material',
      effect: null,
      meta: options,
    })

    const { params, attrs, texMaps, texMods, shaderFlags, deformWave0, deformWave1 } = water.resolve<PublicParams>(
      options?.properties,
    )
    this.name = `${attrs.Shader} (${attrs.Name})`

    const shaderConst = getShaderConstants(shaderFlags)

    this.setEffect(RenderVariant.Forward, new Effect(this.device, waterPatchEffectOptions(shaderConst)))
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha

    this.isTransparent = true
    this.layer = MaterialLayerMasks.Terrain
    this.setDefaults()
    // this.setTextures(texMaps)
    // this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)

    this.applyOceanAnimation({})
  }

  private setDefaults() {
    // ocean plane only, rivers and water volumes render their own meshes (WaterVolumeMaterial)
    this.WaterLevel = 40.0
    this.SpecularColor = vec4(0.42, 0.42, 0.42, 1.0)
    this.FoamMap = this.device.acquireTexture({ key: FoamMapKey, throwIfMissing: true })
    this.GlossMap = this.device.acquireTexture({ key: GlossMapKey, throwIfMissing: true })
    this.FoamNormalMap = this.device.acquireTexture({ key: FoamNormalMapKey, throwIfMissing: true })

    // this.AnimAmplitudeWav0 = 0.0
    // this.AnimAmplitudeWav2 = 0.0
    // this.AnimFrequency = 0.0
    // this.AnimPhase = 1.0
    // this.BendDetailBranchAmplitude = -
    // this.BendDetailFrequency = 1.0
    // this.BendDetailLeafAmplitude = 0.2
    // this.DepthFixupThreshold = 0.05
    this.DetailNormalsScale = 0.5
    // this.EnvCubeReflMul = 1.0
    // this.EnvCubeScale = 20.0
    // this.FakeCameraSpeed = 0.0
    this.FoamAmount = 1.0
    this.FoamCrestAmount = 1.0
    this.FoamNormalFade = 0.7
    this.FoamNormalScale = 1.0
    this.FoamNormalSeparation = 0.15
    this.FoamNormalTiling = 2.0
    this.FoamSoftIntersectionFactor = 0.75
    this.FoamTransitionSpeed = 1.75
    this.FresnelGloss = 0.95
    this.GradientScale = 0.1
    this.HeightScale = 0.2
    this.NormalsScale = 1.25
    // this.RealtimeReflMul = 1.0
    this.ReflectionBumpScale = 0.15
    this.ReflectionScale = 1.0
    this.RefractionBumpScale = 0.1
    this.SoftIntersectionFactor = 0.75
    // this.SubSurfaceScatteringScale = 10.0

    this.Tiling = 10.0
    this.DetailTiling = 2.5
    this.FoamTiling = 1.0

    this.SamplerClamp = SamplerState.LinearClamp
    this.SamplerLinear = SamplerState.LinearWrap
  }

  private setAttributes(attrs: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    if (attrs.Diffuse) {
      //
    }

    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular)
    }

    if (attrs.Emissive) {
      //
    }

    if (attrs.Emittance) {
      //
    }

    if (attrs.AlphaTest < 1) {
      //
    }

    if (attrs.Opacity < 1) {
      //
    }

    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
  }

  private setPublicParams(params: PublicParams) {
    this.Tiling = paramValue(params.Tilling, this.Tiling)
    this.DetailTiling = paramValue(params.DetailTilling, this.DetailTiling)
    // this.RainTiling = paramValue(params.RainTilling, this.RainTiling)
    this.FoamTiling = paramValue(params.FoamTilling, this.FoamTiling)

    // this.AnimAmplitudeWav0 = paramValue(params.AnimAmplitudeWav0, this.AnimAmplitudeWav0)
    // this.AnimAmplitudeWav2 = paramValue(params.AnimAmplitudeWav2, this.AnimAmplitudeWav2)
    // this.AnimFrequency = paramValue(params.AnimFrequency, this.AnimFrequency)
    // this.AnimPhase = paramValue(params.AnimPhase, this.AnimPhase)
    // this.BendDetailBranchAmplitude = paramValue(params.bendDetailBranchAmplitude, this.BendDetailBranchAmplitude)
    // this.BendDetailFrequency = paramValue(params.bendDetailFrequency, this.BendDetailFrequency)
    // this.BendDetailLeafAmplitude = paramValue(params.bendDetailLeafAmplitude, this.BendDetailLeafAmplitude)
    // this.DepthFixupThreshold = paramValue(params.DepthFixupThreshold, this.DepthFixupThreshold)
    this.DetailNormalsScale = paramValue(params.DetailNormalsScale, this.DetailNormalsScale)
    // this.EnvCubeReflMul = paramValue(params.EnvCubeReflMul, this.EnvCubeReflMul)
    // this.EnvCubeScale = paramValue(params.EnvCubeScale, this.EnvCubeScale)
    // this.FakeCameraSpeed = paramValue(params.FakeCameraSpeed, this.FakeCameraSpeed)
    this.FoamAmount = paramValue(params.FoamAmount, this.FoamAmount)
    this.FoamCrestAmount = paramValue(params.FoamCrestAmount, this.FoamCrestAmount)
    this.FoamNormalFade = paramValue(params.FoamNormalFade, this.FoamNormalFade)
    this.FoamNormalScale = paramValue(params.FoamNormalScale, this.FoamNormalScale)
    this.FoamNormalSeparation = paramValue(params.FoamNormalSeparation, this.FoamNormalSeparation)
    this.FoamNormalTiling = paramValue(params.FoamNormalTiling, this.FoamNormalTiling)
    this.FoamSoftIntersectionFactor = paramValue(params.FoamSoftIntersectionFactor, this.FoamSoftIntersectionFactor)
    this.FoamTransitionSpeed = paramValue(params.FoamTransitionSpeed, this.FoamTransitionSpeed)
    this.FresnelGloss = paramValue(params.FresnelGloss, this.FresnelGloss)
    this.GradientScale = paramValue(params.GradientScale, this.GradientScale)
    this.HeightScale = paramValue(params.HeightScale, this.HeightScale)
    this.NormalsScale = paramValue(params.NormalsScale, this.NormalsScale)
    // this.RealtimeReflMul = paramValue(params.RealtimeReflMul, this.RealtimeReflMul)
    this.ReflectionBumpScale = paramValue(params.ReflectionBumpScale, this.ReflectionBumpScale)
    this.ReflectionScale = paramValue(params.ReflectionScale, this.ReflectionScale)
    this.RefractionBumpScale = paramValue(params.RefractionBumpScale, this.RefractionBumpScale)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    // this.SubSurfaceScatteringScale = paramValue(params.SubSurfaceScatteringScale, this.SubSurfaceScatteringScale)
  }

  public applyOceanAnimation(params: OceanAnimationParams) {
    const angle = paramValue(params.windDirection, 0)
    this.WindDirection = vec2(Math.sin(angle), Math.cos(angle))
    this.WindSpeed = paramValue(params.windSpeed, 4)
    this.WavesAmount = paramValue(params.wavesAmount, 1.5)
    this.WavesSize = paramValue(params.wavesSize, 0.75)
    this.WavesSpeed = paramValue(params.wavesSpeed, 1)
  }
}
