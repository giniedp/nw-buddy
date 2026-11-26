import {
  CommonInputs,
  CullState,
  Effect,
  RenderVariant,
  inputSlotSampler,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec4,
  MaterialWithSchema,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import { vec4 } from '@gglib/math'
import { TERRAIN_PATCH_SHADER as WGSL } from './TerrainPatchMaterial.wgsl'
import { createDebugEffect, InputBlocks, MaterialLayerMasks, NwRenderVariant } from './common'

/**
 * @param fragmentEntry - `fs_gbuffer` (default, opaque terrain is only drawn into the GBuffer) or `fs_debug`
 */
export function terrainPatchShaderOptions(fragmentEntry: string = 'fs_gbuffer'): ShaderModuleOptions {
  return {
    name: `Terrain Patch Shader (${fragmentEntry})`,
    wgsl: {
      source: WGSL,
      fragmentEntry,
    },
    glsl: null,
  }
}

export function terrainPatchEffectOptions(fragmentEntry?: string): EffectOptions {
  return {
    name: 'Terrain Patch Effect',
    meta: {},
    program: {
      shader: terrainPatchShaderOptions(fragmentEntry),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
    },
  }
}

export const TerrainPatchMaterialSchema = {
  World: CommonInputs.Object.ModelMatrix,

  View: CommonInputs.View.ViewMatrix,
  Projection: CommonInputs.View.ProjectionMatrix,
  CameraPosition: CommonInputs.View.CameraPosition,

  Lines: inputSlotScalar('material', 'lines'),

  MountainHeight: inputSlotScalar('material', 'mountainHeight'),

  HeightMapUvTransform: inputSlotVec4('material', 'heightMapUvTransform'),
  HeightMapUvTransformCoarse: inputSlotVec4('material', 'heightMapUvTransformCoarse'),

  HeightMap: inputSlotTexture('material', 'heightMap'),
  // terrain virtual texture: page cache, indirection and region macro maps, all 2d arrays
  PageMap1: inputSlotTexture('material', 'pageMap1'),
  PageMap2: inputSlotTexture('material', 'pageMap2'),
  IndirectionMap: inputSlotTexture('material', 'indirectionMap'),
  MacroColorMap: inputSlotTexture('material', 'macroColorMap'),
  MacroNormalMap: inputSlotTexture('material', 'macroNormalMap'),
  MacroGlossMap: inputSlotTexture('material', 'macroGlossMap'),

  HeightMapSampler: inputSlotSampler('material', 'heightMapSampler'),
  ColorMapSampler: inputSlotSampler('material', 'colorMapSampler'),
}

export class TerrainPatchMaterial extends MaterialWithSchema(TerrainPatchMaterialSchema) {
  protected override configure(): void {
    // no forward effect: opaque terrain is drawn into the GBuffer and lit by the deferred lighting
    super.configure({
      name: 'Terrain Patch Material',
      effect: null,
      meta: {},
    })

    this.layer = MaterialLayerMasks.Terrain
    this.HeightMapSampler = SamplerState.LinearClamp
    this.ColorMapSampler = SamplerState.LinearClamp
    this.MountainHeight = 2048

    this.HeightMapUvTransform = vec4(1, 1, 0, 0)
    this.HeightMapUvTransformCoarse = vec4(1, 1, 0, 0)

    const gbuffer = new Effect(this.device, terrainPatchEffectOptions('fs_gbuffer'))
    gbuffer.cullState = CullState.None
    this.setEffect(RenderVariant.GBuffer, gbuffer)
    this.setEffect(
      NwRenderVariant.Debug,
      createDebugEffect(this.device, terrainPatchEffectOptions('fs_debug'), gbuffer),
    )
  }
}
