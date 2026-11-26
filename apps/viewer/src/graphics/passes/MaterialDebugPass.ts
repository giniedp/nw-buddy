import {
  RenderChannel,
  RenderItemFlags,
  RenderListMode,
  RenderSortPriority,
  type FrameGraph,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { InputSlots, NON_PROJECTED_DECAL_LAYERS, NwRenderVariant } from '../../material/common'
import { GeometryPass } from './GeometryPass'

/**
 * Opaque surfaces without the decal boxes, shared by the EmissivePass and the MaterialDebugPass (one list collection)
 */
export const OPAQUE_SURFACE_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  includeLayers: NON_PROJECTED_DECAL_LAYERS,
})

/**
 * Draws the material debug views (`global.debug`, the "Output" select) of opaque surfaces over the lit color, with
 * the {@link NwRenderVariant.Debug} effects (`fs_debug`). Only runs while a debug mode is selected. Shading modes
 * have no material view, their `fs_debug` discards and the lighting pass shows them.
 */
export class MaterialDebugPass extends GeometryPass {
  public constructor() {
    super({
      name: 'MaterialDebugPass',
      list: OPAQUE_SURFACE_LIST,
      variant: NwRenderVariant.Debug,
      depth: RenderChannel.Depth,
      clearDepth: false,
      channels: [{ clear: null, render: RenderChannel.Color }],
    })
  }

  public override setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!ctx.renderInputs.get(InputSlots.Global.Debug)) {
      return
    }
    super.setup(frame, ctx)
  }
}
