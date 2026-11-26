import {
  MaterialWithSchema,
  SamplerState,
  type EffectOptions,
  type MaterialOptions,
  type ShaderModuleOptions,
  type Texture,
} from '@gglib/graphics'
import { vec2, vec4 } from '@gglib/math'
import { getShaderConstants, MaterialLayerMasks, type FeatureFlag } from './common'
import type { NwMaterialProps } from './GltfExtension'
import Schema from './TerrainCompositeMaterial.meta'
import WGSL from './TerrainCompositeMaterial.wgsl'
import { MtlUtil, paramValue, paramVec4, getWhiteTexture } from './utils'

export function splatComposeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Composite Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function splatComposeEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Composite Effect',
    meta: {},
    program: {
      shader: splatComposeShaderOptions(),
      sharedBlocks: [],
    },
  }
}

type PublicParams = {
  g_macroBlendStrength: string
  g_macroDiffuseSaturation: string
  g_macroGlossBlendStrength: string
  g_materialLayerBlendFactor: string
  g_materialLayerBlendFalloff: string
  g_materialLayerHeightOffset: string
  g_materialLayerHeightScale: string
}

const util = new MtlUtil('TerrainComposite', {
  knownMaps: ['Diffuse'],
  knownMods: [],
  knownFlags: [],
})
export class TerrainCompositeMaterial extends MaterialWithSchema(Schema) {
  protected override configure(options: Partial<MaterialOptions>): void {
    super.configure({
      name: 'Terrain Composite Material',
      effect: splatComposeEffectOptions(),
      meta: options,
    })

    const { attrs, params, texMaps, texMods, shaderFlags } = util.resolve<PublicParams>(options?.properties)
    const shaderConst = getShaderConstants(shaderFlags)

    this.layer = MaterialLayerMasks.Terrain
    this.setDefaults()
    this.setTextures(texMaps)
    this.setModifiers(texMods)
    this.setAttributes(attrs, shaderFlags)
    this.setPublicParams(params)
  }

  private setDefaults() {
    this.MaterialSampler = SamplerState.LinearWrap
    this.MacroSaturation = 1.0
    this.MacroBlendStrength = 1.0
    this.MacroGlossBlendStrength = 1.0
    this.MaterialBlendFactor = 1.0
    this.MaterialBlendFalloff = 1.0
    this.MaterialHeightOffset = 0
    this.MaterialHeightScale = 1.0
    this.MacroColor = vec4(1, 1, 1, 1)
    this.MacroGlossScale = 1.0
    this.MacroNormalScale = 1.0
  }

  private setTextures(maps: NwMaterialProps['textures']) {
    if (maps.Diffuse) {
      this.BaseMap = maps.Diffuse as Texture
    }
    if (maps.Bumpmap) {
      this.NormalMap = maps.Bumpmap as Texture
    }
    if (maps.Specular) {
      this.SpecularMap = maps.Specular as Texture
    }
    if (maps.Smoothness) {
      this.SmoothnessMap = maps.Smoothness as Texture
    } else {
      this.SmoothnessMap = getWhiteTexture(this.device)
    }
    if (maps.Heightmap) {
      this.HeightMap = maps.Heightmap as Texture
    }
  }

  private setModifiers(mods: NwMaterialProps['mods']) {
    this.Tiling = vec2(mods.Diffuse?.TileU ?? 1, mods.Diffuse?.TileV ?? mods.Diffuse?.TileU ?? 1)
  }

  private setAttributes(attr: NwMaterialProps['attrs'], flags: Set<FeatureFlag>) {
    this.BaseColor = paramVec4(attr.Diffuse, vec4.One)
    this.SpecularColor = paramVec4(attr.Specular, vec4.One)
    if (attr.Emittance) {
      // console.log('Emittance', attr.Emittance)
      // this.EmissiveColor.initFrom(parseColor(attr.Emittance))
    }
    // PerMaterial_SpecularColor.w
    this.Gloss = attr.Shininess >= 0 ? attr.Shininess / 255 : 1
  }

  private setPublicParams(params: PublicParams) {
    this.MacroSaturation = paramValue(params.g_macroDiffuseSaturation, this.MacroSaturation)
    this.MacroBlendStrength = paramValue(params.g_macroBlendStrength, this.MacroBlendStrength)
    this.MacroGlossBlendStrength = paramValue(params.g_macroGlossBlendStrength, this.MacroGlossBlendStrength)
    this.MaterialBlendFactor = paramValue(params.g_materialLayerBlendFactor, this.MaterialBlendFactor)
    this.MaterialBlendFalloff = paramValue(params.g_materialLayerBlendFalloff, this.MaterialBlendFalloff)
    this.MaterialHeightOffset = paramValue(params.g_materialLayerHeightOffset, this.MaterialHeightOffset)
    this.MaterialHeightScale = paramValue(params.g_materialLayerHeightScale, this.MaterialHeightScale)
  }
}
