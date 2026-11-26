import type { Device } from '@gglib/graphics'
import { FxaaPass, GroupPass, Renderer, type RenderPass } from '@gglib/render'
import type { ViewerConfig, ViewerConfigValues } from '../config'
import { createRenderPipeline, type ViewerPipelineOptions } from '../graphics'
import { Cmaa2Pass } from '../graphics/passes/cmaa2/Cmaa2Pass'
import { LuminancePass } from '../graphics/passes/exposure/LuminancePass'
import { FilmMappingPass } from '../graphics/passes/filmmapping/FilmMappingPass'
import { FroxelFogPass } from '../graphics/passes/fog/FroxelFogPass'
import { PreviousColorPass } from '../graphics/passes/history/PreviousColorPass'
import { SmaaPass } from '../graphics/passes/smaa/SmaaPass'
import { XeGtaoPass } from '../graphics/passes/ssao/XeGtaoPass'
import { SsrPass } from '../graphics/passes/ssr/SsrPass'
import { UpscalePass } from '../graphics/passes/upscale/UpscalePass'

export interface ViewerRenderer {
  renderer: Renderer
  /**
   * The passes of the pipeline
   */
  passes: RenderPass[]
  /**
   * Scene luminance of the eye adaptation, null if the pipeline has none
   */
  luminance: LuminancePass | null
  filmMapping: FilmMappingPass | null
}

/**
 * The renderer with the viewer's pipeline. The passes follow the config: antialiasing, upscaler, froxel fog,
 * ambient occlusion and reflections. Add the renderer to the world last, in `onCreate`.
 */
export function createViewerRenderer(
  device: Device,
  config: ViewerConfig,
  options: ViewerPipelineOptions = {},
): ViewerRenderer {
  const pipeline = createRenderPipeline(device, options)
  bindAntialiasing(pipeline.passes, config)
  bindUpscaleConfig(pipeline.passes, config)
  bindFogConfig(pipeline.passes, config)
  bindReflectionConfig(pipeline.passes, config)
  bindAoConfig(pipeline.passes, config)

  return {
    renderer: new Renderer(device, {
      linearToSrgb: false,
      pipeline,
    }),
    passes: pipeline.passes,
    luminance: pipeline.passes.find((it): it is LuminancePass => it instanceof LuminancePass) ?? null,
    filmMapping: pipeline.passes.find((it): it is FilmMappingPass => it instanceof FilmMappingPass) ?? null,
  }
}

function bindUpscaleConfig(passes: RenderPass[], config: ViewerConfig) {
  const pass = findPasses(passes, (it): it is UpscalePass => it instanceof UpscalePass)[0]
  if (!pass) {
    return
  }

  const sharpnessStops = (value: number) => 2 * (1 - value)

  pass.mode = config.value.upscaler
  pass.sharpness = sharpnessStops(config.value.upscaleSharpness)
  config.onChange('upscaler', (value) => {
    pass.mode = value
  })
  config.onChange('upscaleSharpness', (value) => {
    pass.sharpness = sharpnessStops(value)
  })
}

function bindFogConfig(passes: RenderPass[], config: ViewerConfig) {
  const pass = findPasses(passes, (it): it is FroxelFogPass => it instanceof FroxelFogPass)[0]
  if (!pass) {
    return
  }

  pass.enabled = config.value.fog === 'froxel'
  config.onChange('fog', (value) => {
    pass.enabled = value === 'froxel'
  })
}

function bindReflectionConfig(passes: RenderPass[], config: ViewerConfig) {
  const ssrPasses = findPasses(passes, (it) => {
    return it instanceof SsrPass || it instanceof PreviousColorPass
  })

  function applyConfig(value: boolean) {
    for (const pass of ssrPasses) {
      pass.enabled = value
    }
  }
  applyConfig(config.value.reflections)
  config.onChange('reflections', applyConfig)
}

function bindAoConfig(passes: RenderPass[], config: ViewerConfig) {
  const aoPasses = findPasses(passes, (it) => {
    return it instanceof XeGtaoPass
  })
  function applyConfig(value: ViewerConfigValues['ambientOcclusion']) {
    for (const pass of aoPasses) {
      if (value === 'off') {
        pass.enabled = false
      } else {
        pass.enabled = true
        pass.quality = value
      }
    }
  }
  applyConfig(config.value.ambientOcclusion)
  config.onChange('ambientOcclusion', applyConfig)
}

function bindAntialiasing(passes: RenderPass[], config: ViewerConfig) {
  const smaa = findPasses(passes, (it): it is SmaaPass => it instanceof SmaaPass)[0]
  const fxaa = findPasses(passes, (it): it is FxaaPass => it instanceof FxaaPass)[0]
  const cmaa2 = findPasses(passes, (it): it is Cmaa2Pass => it instanceof Cmaa2Pass)[0]
  const apply = (value: string) => {
    if (smaa) {
      smaa.enabled = value === 'smaa'
    }
    if (fxaa) {
      fxaa.enabled = value === 'fxaa'
    }
    if (cmaa2) {
      cmaa2.enabled = value === 'cmaa2'
    }
  }
  apply(config.value.antialiasing)
  config.onChange('antialiasing', apply)
}

export function findPasses<T extends RenderPass>(
  passes: RenderPass[],
  match: (pass: RenderPass) => pass is T,
  out: T[] = [],
): T[] {
  for (const pass of passes) {
    if (match(pass)) {
      out.push(pass)
    }
    if (pass instanceof GroupPass) {
      findPasses(pass.passes, match, out)
    }
  }
  return out
}
