import {
  BlendState,
  CullState,
  DepthState,
  FALSE,
  MaterialWithSchema,
  SamplerState,
  TRUE,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import { FoamMapKey } from '../content'
import { InputBlocks, MaterialLayerMasks, type FeatureFlag } from './common'
import type { NwMaterialProps } from './GltfExtension'
import type { OceanAnimationParams } from './WaterPatchMaterial'
import { MtlUtil, paramValue, paramVec4 } from './utils'
import SCHEMA from './WaterVolumeMaterial.meta'
import WGSL from './WaterVolumeMaterial.wgsl'

export function waterVolumeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Water Volume Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function waterVolumeEffectOptions(): EffectOptions {
  return {
    name: 'Water Volume Effect',
    meta: {},
    program: {
      shader: waterVolumeShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame],
      perInstanceTransformBlock: 'object',
    },
  }
}

interface PublicParams {
  Tilling: string //                    | number | 32 |
  SoftIntersectionFactor: string //     | number | 32 |
  VertexWaveScale: string //            | number | 32 |
  DetailNormalsScale: string //         | number | 32 |
  DetailTilling: string //              | number | 32 |
  EnvCubeReflMul: string //             | number | 32 |
  EnvCubeScale: string //               | number | 32 |
  NormalsScale: string //               | number | 32 |
  RainTilling: string //                | number | 32 |
  RealtimeReflMul: string //            | number | 32 |
  FoamSoftIntersectionFactor: string // | number | 28 |
  FoamTilling: string //                | number | 28 |
  FoamAmount: string //                 | number | 28 |
  WaterFlowSpeed: string //             | number | 27 |
}

const util = new MtlUtil('WaterVolume', {
  knownMaps: ['Environment'],
  knownMods: [],
  knownFlags: ['SSREFL', 'FLOW', 'SUN_SPECULAR', 'FOAM', 'WATER_TESSELLATION_DX11'],
})

/**
 * Surface of rivers and water volumes (WaterVolume shader).
 * The geometry carries the volume fog in the vertex color, see buildRiverMesh.
 */
export class WaterVolumeMaterial extends MaterialWithSchema(SCHEMA) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Water Volume Material',
      effect: waterVolumeEffectOptions(),
      meta: options,
    })

    const { attrs, params, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    this.name = `${attrs.Shader} (${attrs.Name})`

    // composes the refracted scene color itself, which is only available in the transparent pass
    this.isTransparent = true
    this.layer = MaterialLayerMasks.WaterVolume
    // ZFunc = LEqual, CullMode = None, ZWriteEnable = false
    this.effect.depthState = DepthState.GreaterEqualNoWrite
    this.effect.cullState = CullState.None
    this.effect.blendState = BlendState.Alpha

    this.setDefaults()
    this.setAttributes(attrs)
    this.setFlags(shaderFlags)
    this.setPublicParams(params)
    this.applyOceanAnimation({})
  }

  private setDefaults() {
    this.SpecularColor = vec4(0.05, 0.05, 0.05, 1.0)
    this.Tiling = 1.0
    this.DetailTiling = 1.0
    this.NormalsScale = 1.0
    this.DetailNormalsScale = 0.5
    this.SoftIntersectionFactor = 1.0
    this.FoamSoftIntersectionFactor = 0.75
    this.FoamAmount = 1.0
    this.FoamTiling = 1.0
    this.EnvCubeReflMul = 1.0
    // watervolume.cfx default
    this.RealtimeReflMul = 1.0
    this.WaterFlowSpeed = 0.0

    this.FoamMap = this.device.acquireTexture({ key: FoamMapKey, throwIfMissing: true })
    this.SamplerLinear = SamplerState.LinearWrap
    this.SamplerClamp = SamplerState.LinearClamp
  }

  private setAttributes(attrs: NwMaterialProps['attrs']) {
    if (attrs.Specular) {
      this.SpecularColor = paramVec4(attrs.Specular)
    }
    if (attrs.Shininess) {
      this.SpecularColor.w = attrs.Shininess / 255
    }
  }

  private setFlags(flags: Set<FeatureFlag>) {
    this.EnabledFlow = flags.has('FLOW') ? TRUE : FALSE
    this.EnabledFoam = flags.has('FOAM') ? TRUE : FALSE
    this.EnabledSunSpecular = flags.has('SUN_SPECULAR') ? TRUE : FALSE
    this.EnabledSsrefl = flags.has('SSREFL') ? TRUE : FALSE
  }

  private setPublicParams(params: PublicParams) {
    this.Tiling = paramValue(params.Tilling, this.Tiling)
    this.DetailTiling = paramValue(params.DetailTilling, this.DetailTiling)
    this.NormalsScale = paramValue(params.NormalsScale, this.NormalsScale)
    this.DetailNormalsScale = paramValue(params.DetailNormalsScale, this.DetailNormalsScale)
    this.SoftIntersectionFactor = paramValue(params.SoftIntersectionFactor, this.SoftIntersectionFactor)
    this.FoamSoftIntersectionFactor = paramValue(params.FoamSoftIntersectionFactor, this.FoamSoftIntersectionFactor)
    this.FoamAmount = paramValue(params.FoamAmount, this.FoamAmount)
    this.FoamTiling = paramValue(params.FoamTilling, this.FoamTiling)
    // without screen space reflections the env cube is the only reflection (the game's !%SSREFL path)
    this.EnvCubeReflMul = paramValue(params.EnvCubeReflMul, this.EnvCubeReflMul)
    this.WaterFlowSpeed = paramValue(params.WaterFlowSpeed, this.WaterFlowSpeed)
    this.RealtimeReflMul = paramValue(params.RealtimeReflMul, this.RealtimeReflMul)
  }

  /**
   * $WaterVolumeDDN is animated by the ocean settings, see WaterPatchMaterial.applyOceanAnimation
   */
  public applyOceanAnimation(params: OceanAnimationParams) {
    this.WavesAmount = paramValue(params.wavesAmount, 1.5)
    this.WavesSpeed = paramValue(params.wavesSpeed, 1)
  }
}
