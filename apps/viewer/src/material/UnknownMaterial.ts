import { Color, MaterialWithSchema, type EffectOptions, type ShaderModuleOptions } from '@gglib/graphics'
import { InputBlocks } from './common'
import Schema from './UnknownMaterial.meta'
import WGSL from './UnknownMaterial.wgsl'

export function unknownShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Shape Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function unknownEffectOptions(): EffectOptions {
  return {
    name: 'Shape Effect',
    meta: {},
    program: {
      shader: unknownShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
      perInstanceTransformBlock: 'object',
    },
  }
}

export class UnknownMaterial extends MaterialWithSchema(Schema) {
  protected override configure(): void {
    super.configure({
      name: 'Shape Material',
      effect: unknownEffectOptions(),
      meta: {},
    })
    this.Color = Color.Red.toVec4()
  }
}
