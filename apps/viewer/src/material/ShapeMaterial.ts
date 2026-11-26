import {
  BlendState,
  CullState,
  DepthState,
  MaterialWithSchema,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './ShapeMaterial.meta'
import WGSL from './ShapeMaterial.wgsl'
import { InputBlocks, MaterialLayerMasks } from './common'

export function shapeShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Shape Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function shapeEffectOptions(): EffectOptions {
  return {
    name: 'Shape Effect',
    meta: {},
    program: {
      shader: shapeShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
    },
  }
}

export class ShapeMaterial extends MaterialWithSchema(Schema) {
  protected override configure(): void {
    super.configure({
      name: 'Shape Material',
      effect: shapeEffectOptions(),
      meta: {},
    })
    this.layer = MaterialLayerMasks.Common
    this.isTransparent = true
    this.effect.blendState = BlendState.Alpha
    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite
  }

  public instances() {
    return this.effect.program.get('instances')
  }
}
