import { MaterialWithSchema, type EffectOptions, type ShaderModuleOptions } from '@gglib/graphics'
import SCHEMA from './TerrainPackMaterial.meta'
import WGSL from './TerrainPackMaterial.wgsl'

export function terrainPackShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Terrain Pack Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function terrainPackEffectOptions(): EffectOptions {
  return {
    name: 'Terrain Pack Effect',
    meta: {},
    program: {
      shader: terrainPackShaderOptions(),
      sharedBlocks: [],
    },
  }
}

export class SplatPackMaterial extends MaterialWithSchema(SCHEMA) {
  protected override configure(): void {
    super.configure({
      name: 'Terrain Pack Material',
      effect: terrainPackEffectOptions(),
      meta: {},
    })
  }
}
