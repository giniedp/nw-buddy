import {
  BlendState,
  CullState,
  DepthState,
  MaterialWithSchema,
  SamplerState,
  type EffectOptions,
  type ShaderModuleOptions,
} from '@gglib/graphics'
import Schema from './ProbeMirrorMaterial.meta'
import WGSL from './ProbeMirrorMaterial.wgsl'
import { InputBlocks, MaterialLayerMasks } from './common'

export function probeMirrorShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Probe Mirror Shader',
    wgsl: {
      source: WGSL,
    },
    glsl: null,
  }
}

export function probeMirrorEffectOptions(): EffectOptions {
  return {
    name: 'Probe Mirror Effect',
    meta: {},
    program: {
      shader: probeMirrorShaderOptions(),
      sharedBlocks: [InputBlocks.Global, InputBlocks.View],
    },
  }
}

/**
 * Shows a cube of the probe atlas on a sphere, debug only
 */
export class ProbeMirrorMaterial extends MaterialWithSchema(Schema) {
  protected override configure(): void {
    super.configure({
      name: 'Probe Mirror Material',
      effect: probeMirrorEffectOptions(),
      meta: {},
    })
    this.layer = MaterialLayerMasks.Common
    this.isTransparent = true
    this.SamplerLinear = SamplerState.LinearClamp
    this.effect.blendState = BlendState.Alpha
    this.effect.cullState = CullState.None
    // writes depth, or transparent items drawn later (cloud dome) would show on the sphere
    this.effect.depthState = DepthState.GreaterEqual
  }
}
