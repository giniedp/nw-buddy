import type { Renderer, RenderPass } from '@gglib/render'
import { GBufferDebugPass, type GBufferDebugMode } from '../graphics/passes/gbuffer/GBufferDebugPass'
import { LightingPass } from '../graphics/passes/lighting/LightingPass'
import type { LightingDebugMode } from '../graphics/passes/lighting/LightingPass.wgsl'
import { DebugOptions, InputSlots } from '../material/common'
import { findPasses } from './renderer'

export type ViewerOutputGroup = 'Image' | 'GBuffer' | 'Ambient occlusion' | 'Lighting'

interface ViewerOutputConfig {
  id: string
  group: ViewerOutputGroup
  label: string
  /**
   * The attribute the GBuffer debug pass shows
   */
  gbuffer?: GBufferDebugMode
  /**
   * The debug mode of the lighting pass
   */
  lighting?: LightingDebugMode
  /**
   * The value of the global debug input, see {@link DebugOptions}
   */
  debug?: number
}

const OUTPUTS = [
  { id: 'final', group: 'Image', label: 'Final' },
  { id: 'normal', group: 'GBuffer', label: 'Normal', gbuffer: 'normal' },
  { id: 'albedo', group: 'GBuffer', label: 'Albedo', gbuffer: 'albedo' },
  { id: 'reflectance', group: 'GBuffer', label: 'Reflectance', gbuffer: 'reflectance' },
  { id: 'smoothness', group: 'GBuffer', label: 'Smoothness', gbuffer: 'smoothness' },
  { id: 'occlusion', group: 'GBuffer', label: 'Material occlusion', gbuffer: 'occlusion' },
  { id: 'lighting-model', group: 'GBuffer', label: 'Lighting model', gbuffer: 'lightingModel' },
  { id: 'transmittance', group: 'GBuffer', label: 'Transmittance', gbuffer: 'transmittance' },
  { id: 'ao', group: 'Ambient occlusion', label: 'Screen space AO', lighting: 'ao' },
  { id: 'diffuse', group: 'Lighting', label: 'Direct diffuse', debug: DebugOptions.DEBUG_SH_DIFFUSE },
  { id: 'specular', group: 'Lighting', label: 'Direct specular', debug: DebugOptions.DEBUG_SH_SPECULAR },
  { id: 'ambient', group: 'Lighting', label: 'Ambient', debug: DebugOptions.DEBUG_SH_AMBIENT },
  { id: 'reflection', group: 'Lighting', label: 'Reflection', debug: DebugOptions.DEBUG_SH_REFLECTION },
  { id: 'fresnel', group: 'Lighting', label: 'Fresnel', debug: DebugOptions.DEBUG_SH_FRESNEL },
  { id: 'ssr', group: 'Lighting', label: 'Screen space reflections', lighting: 'reflections' },
  { id: 'ssr-confidence', group: 'Lighting', label: 'SSR confidence', lighting: 'reflection confidence' },
  { id: 'light-count', group: 'Lighting', label: 'Light count', debug: DebugOptions.DEBUG_SH_COUNT },
] as const satisfies readonly ViewerOutputConfig[]

export type ViewerOutput = (typeof OUTPUTS)[number]['id']

export interface ViewerOutputInfo {
  id: ViewerOutput
  group: ViewerOutputGroup
  label: string
}

/**
 * What a viewer can show instead of the final image, for debugging
 */
export const VIEWER_OUTPUTS: readonly ViewerOutputInfo[] = OUTPUTS

/**
 * Switches the pipeline to an output, an unknown one is the final image
 */
export function setViewerOutput(renderer: Renderer, passes: RenderPass[], output: ViewerOutput) {
  const config: ViewerOutputConfig | undefined = OUTPUTS.find((it) => it.id === output)
  for (const pass of findPasses(passes, (it): it is GBufferDebugPass => it instanceof GBufferDebugPass)) {
    pass.enabled = !!config?.gbuffer
    pass.mode = config?.gbuffer ?? pass.mode
  }
  for (const pass of findPasses(passes, (it): it is LightingPass => it instanceof LightingPass)) {
    pass.debug = config?.lighting ?? 'off'
  }
  renderer.inputs.set(InputSlots.Global.Debug, config?.debug ?? DebugOptions.DEBUG_OFF)
}
