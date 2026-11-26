import {
  BlendState,
  CullState,
  DepthState,
  MaterialWithSchema,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './GridMaterial.meta'
import WGSL from './GridMaterial.wgsl'
import { InputBlocks, MaterialLayerMasks } from './common'

function gridShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Grid Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

function gridEffectOptions(): EffectOptions {
  return {
    name: 'Grid Effect',
    meta: {},
    program: {
      shader: gridShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View, InputBlocks.Frame, InputBlocks.Lights],
    },
  }
}

/**
 * The ground grid (see GridMaterial.wgsl.ts): anti aliased lines on a flat quad in the XY plane, blended over the
 * scene without writing depth. `Color` tints the lines, its alpha is the opacity.
 */
export class GridMaterial extends MaterialWithSchema(Schema) {
  protected override configure(): void {
    super.configure({
      name: 'Grid Material',
      effect: gridEffectOptions(),
      meta: {},
    })
    this.layer = MaterialLayerMasks.Common
    this.isTransparent = true
    this.effect.blendState = BlendState.Alpha
    this.effect.cullState = CullState.None
    this.effect.depthState = DepthState.GreaterEqualNoWrite
  }
}
