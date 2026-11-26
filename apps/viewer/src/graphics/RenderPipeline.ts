import {
  BlendState,
  Color,
  CommonInputs,
  FALSE,
  RenderVariant,
  StencilState,
  TextureUsage,
  TRUE,
  type Device,
  type TextureDescriptor,
} from '@gglib/graphics'
import {
  FunctionPass,
  FxaaPass,
  groupPass,
  RenderChannel,
  renderChannel,
  renderInputsPass,
  RenderItemFlags,
  RenderListMode,
  RenderSortPriority,
  type RenderContext,
  type RenderPass,
  type RenderPipelineOptions,
} from '@gglib/render'
import {
  InputSlots,
  MaterialLayerFlags,
  MaterialLayerMasks,
  NON_PROJECTED_DECAL_LAYERS,
  NwRenderVariant,
} from '../material'
import { getWhiteTexture } from '../material/utils'
import { GBUFFER_DESCRIPTORS, GBufferChannel } from './GBufferChannels'
import { describePass, optionalPass } from './PassInfo'
import { DecalReceiverDebugPass } from './passes/gbuffer/DecalReceiverDebugPass'
import { BloomPass } from './passes/bloom/BloomPass'
import { FilterGBufferPass } from './passes/gbuffer/FilterGBufferPass'
import { GBufferDebugPass } from './passes/gbuffer/GBufferDebugPass'
import { CopyPass, NwCopyChannel } from './passes/CopyPass'
import { GeometryPass } from './passes/GeometryPass'
import { LightingPass } from './passes/lighting/LightingPass'
import { MaterialDebugPass, OPAQUE_SURFACE_LIST } from './passes/MaterialDebugPass'
import { SmaaPass } from './passes/smaa/SmaaPass'
import { Cmaa2Pass } from './passes/cmaa2/Cmaa2Pass'
import { FilmMappingPass } from './passes/filmmapping/FilmMappingPass'
import { LuminancePass } from './passes/exposure/LuminancePass'
import { FogPass } from './passes/fog/FogPass'
import { FroxelFogPass } from './passes/fog/FroxelFogPass'
import { PreviousColorPass } from './passes/history/PreviousColorPass'
import { SnowPass } from './passes/snow/SnowPass'
import { SsrChannel, SsrPass } from './passes/ssr/SsrPass'
import { SunShaftsPass } from './passes/sunshafts/SunShaftsPass'
import { UpscalePass } from './passes/upscale/UpscalePass'
import { NwRenderChannel, XeGtaoPass } from './passes/ssao/XeGtaoPass'

const WATER_VOLUME_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  includeLayers: MaterialLayerMasks.WaterVolume,
})
const TRANSPARENT_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  includeLayers: NON_PROJECTED_DECAL_LAYERS,
  excludeLayers: MaterialLayerMasks.WaterVolume,
})

/**
 * Surfaces that receive projected decals: terrain and mesh components with acceptDecals (plan 7.4)
 */
const DECAL_RECEIVER_LAYERS = MaterialLayerFlags.DecalReceiver | MaterialLayerMasks.Terrain
/**
 * Stencil bit of the decal receivers, written by the GBuffer pass, tested by the decal passes
 */
export const DECAL_RECEIVER_STENCIL = 1

/**
 * Surfaces that receive the snow layer: terrain and mesh components with acceptSnow (NW's own flag instead of the
 * decal receivers, it keeps snow off the corruption props)
 */
const SNOW_RECEIVER_LAYERS = MaterialLayerFlags.SnowReceiver | MaterialLayerMasks.Terrain
/**
 * Stencil bit of the snow receivers, written by the GBuffer pass, tested by the snow pass
 */
export const SNOW_RECEIVER_STENCIL = 2

/**
 * Stencil reference of a GBuffer draw from its layer: the decal and snow receiver bits
 */
function receiverStencil(layer: number): number {
  const decal = layer & DECAL_RECEIVER_LAYERS ? DECAL_RECEIVER_STENCIL : 0
  const snow = layer & SNOW_RECEIVER_LAYERS ? SNOW_RECEIVER_STENCIL : 0
  return decal | snow
}

/**
 * Opaque items of the GBuffer pass, each draw sets the receiver stencil reference from its layer
 */
const GBUFFER_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  // the decal boxes have Illum materials with a GBuffer effect. Unlayered items (LayerMask.All) were excluded by the
  // MeshDecal bit already, the ProjectedDecal bit changes nothing for them.
  excludeLayers: MaterialLayerMasks.MeshDecal | MaterialLayerMasks.ProjectedDecal,
  stencilReference: receiverStencil,
})

/**
 * %DECAL meshes (roads, patches), blended into the GBuffer after all opaque surfaces like the game's ZPass decal list.
 * The game sorts that list by object sort priority, then state; the viewer has no sort priority yet, so by state.
 */
const MESH_DECAL_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  // the boxes of projected decals have the same %DECAL materials, but their entity layer is ProjectedDecal alone
  includeLayers: MaterialLayerMasks.MeshDecal,
})

/**
 * Boxes of projected decals (DecalComponent), blended into the GBuffer by the DecalPass and their emittance added by
 * the DecalEmissivePass, like the game's FX_DeferredDecals / FX_DeferredDecalsEmissive.
 * Sorted like the game: by the entity render order (normal map flag + sort priority, see decalRenderOrder), then state.
 * Both flags: a decal material with an opacity below 1 makes a transparent item.
 */
const PROJECTED_DECAL_LIST = new RenderListMode(
  RenderSortPriority.Order,
  (RenderItemFlags.Opaque | RenderItemFlags.Transparent) as RenderItemFlags,
  {
    includeLayers: MaterialLayerMasks.ProjectedDecal,
    stencilReference: () => DECAL_RECEIVER_STENCIL,
  },
)

/**
 * Projected decals blend only into decal receivers (game: stencil EQUAL on BIT_STENCIL_RESERVED)
 */
const DECAL_RECEIVER_TEST = StencilState.get({
  enable: true,
  readMask: DECAL_RECEIVER_STENCIL,
  writeMask: 0,
  frontFunction: 'equal',
  frontDepthPass: 'keep',
  backFunction: 'equal',
  backDepthPass: 'keep',
})

/**
 * Writes the stencil reference of each draw (the decal and snow receiver bits) where the depth test passes
 */
const DECAL_RECEIVER_WRITE = StencilState.get({
  enable: true,
  writeMask: DECAL_RECEIVER_STENCIL | SNOW_RECEIVER_STENCIL,
  frontFunction: 'always',
  frontDepthPass: 'replace',
  backFunction: 'always',
  backDepthPass: 'replace',
})

/**
 * LinearDepth is cleared to the camera far plane, the value the sky writes where it covers. Pixels without geometry
 * then read as far away everywhere, also where the sky dome does not cover (below the horizon): materials that fade
 * against the scene depth (fog planes, particles, beams, water) would vanish against 0. Passes before the sky
 * (lighting, AO, decals) treat depth >= far as "no geometry".
 */
const LINEAR_DEPTH_CLEAR = { x: 0, y: 0, z: 0, w: 0 }
function linearDepthClear(ctx: RenderContext) {
  LINEAR_DEPTH_CLEAR.x = ctx.view.camera.far
  return LINEAR_DEPTH_CLEAR
}

/**
 * Binds a neutral texture as the scene depth input. Programs whose module declares `sceneDepthMap` bind it in every
 * variant (e.g. the FxMeshAdvanced GBuffer effect), and the view block keeps the last value, which is the pooled
 * LinearDepth texture of the previous frame. A pass that renders into LinearDepth (GBuffer, forward opaque) must not
 * have it bound: WebGPU rejects a texture used as attachment and binding in one render pass.
 */
function neutralSceneDepthPass(name: string): RenderPass {
  return describePass(
    new FunctionPass({
      name,
      render: (ctx) => {
        ctx.renderInputs.set(CommonInputs.View.SceneDepthMap, getWhiteTexture(ctx.device))
      },
    }),
    { note: 'unbinds LinearDepth as scene depth input while passes render into it' },
  )
}

/**
 * Opaque items without a GBuffer effect (sky, unlit, debug), drawn forward after the deferred lighting.
 * No exclude layers: unlayered items (the sky) have LayerMask.All, which any excludeLayers would drop. The decal boxes
 * are skipped by the include mask (and by the variant, their opaque Illum materials have a GBuffer effect).
 */
const FORWARD_OPAQUE_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  includeLayers: NON_PROJECTED_DECAL_LAYERS,
  excludeVariant: RenderVariant.GBuffer,
})

/**
 * Scratch target for the linear depth output of transparent materials.
 * Transparent materials write a second (linear depth) output, which needs an attachment, but nothing reads it.
 * It can't be LinearDepth, which they sample. r8unorm keeps it small, the f32 output is valid for any float format.
 */
const TransparentLinearDepth = renderChannel('nw_transparent_linear_depth')
const TRANSPARENT_LINEAR_DEPTH_DESC: Readonly<TextureDescriptor> = {
  name: 'NwRenderChannel.TransparentLinearDepth',
  type: '2d',
  format: 'r8unorm',
  width: 1,
  height: 1,
  depth: 1,
  sampleCount: 1,
  mipLevelCount: 1,
  usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
}

/**
 * The viewer pipeline in the order of the game's frame:
 * GBuffer → AO → deferred lighting → forward opaque leftovers → fog → transparents → post
 */
export interface ViewerPipelineOptions {
  /**
   * Pixels without geometry stay transparent (alpha 0) for a transparent canvas, see
   * {@link LightingPassOptions.transparentBackground}. Default false.
   */
  transparentBackground?: boolean
}

export function createRenderPipeline(device: Device, options: ViewerPipelineOptions = {}): RenderPipelineOptions {
  const sunShafts = new SunShaftsPass(device)
  const luminance = new LuminancePass(device)
  const froxelFog = new FroxelFogPass(device, { linearDepth: RenderChannel.LinearDepth, color: RenderChannel.Color })
  const previousColor = new PreviousColorPass(device)

  const passes: RenderPass[] = [
    groupPass({
      name: 'Opaque',
      passes: createOpaquePasses(device, previousColor, luminance, options),
    }),
    optionalPass(froxelFog),
    describePass(
      renderInputsPass({
        name: 'SceneInputs',
        textures: [
          [CommonInputs.View.SceneColorMap, RenderChannel.Color],
          [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
        ],
      }),
      { note: 'binds Color and LinearDepth as scene inputs' },
    ),
    optionalPass(new FogPass(device, { froxel: froxelFog })),
    describePass(new MaterialDebugPass(), {
      note: 'material debug views of opaque surfaces, runs while a debug output is selected',
    }),
    groupPass({ name: 'Transparent', passes: createTransparentPasses(device) }),
    // the HDR color for the next frame ($HDRTargetPrev, copied after the transparents like the game)
    optionalPass(
      describePass(previousColor, { note: 'keeps the HDR color for the next frame (screen space reflections)' }),
    ),
    // mask and blur from the HDR scene
    optionalPass(sunShafts.generate, sunShafts),
    // scene luminance for the exposure of the film mapping, measured before bloom like the game
    describePass(luminance, { note: 'scene luminance for the film mapping exposure' }),
    // bloom of the game (quarter resolution, no threshold), blended in by the film mapping with the time of day amount
    optionalPass(
      describePass(new BloomPass(device), {
        note: 'quarter resolution bloom of the game, the film mapping blends it in by the time of day bloom amount',
      }),
    ),
    new FilmMappingPass(
      device,
      luminance,
      // fog and bloom add color where the background is transparent
      options.transparentBackground,
    ),
    // blended into the tone mapped image, like the HDR final pass of the original
    describePass(sunShafts.apply, { note: 'blends the sun shafts into the image, toggled with Sun Shafts' }),
    // post AA on the final image, like the game's SMAA after its tonemap. The config `antialiasing` enables one of them.
    describePass(new SmaaPass(device), { note: 'toggled by the config antialiasing' }),
    describePass(new FxaaPass(device, { name: 'FXAA', quality: 0.5 }), { note: 'toggled by the config antialiasing' }),
    describePass(new Cmaa2Pass(device), { note: 'toggled by the config antialiasing' }),
    // shows a decoded attribute of the scene GBuffer in place of the image
    optionalPass(
      new GBufferDebugPass(device, {
        enabled: false,
        a: GBufferChannel.A,
        b: GBufferChannel.B,
        c: GBufferChannel.C,
        linearDepth: RenderChannel.LinearDepth,
      }),
    ),
    // tints the decal receivers (stencil bit of the GBuffer pass)
    optionalPass(new DecalReceiverDebugPass(device, { stencilBit: DECAL_RECEIVER_STENCIL })),
    // tints the snow receivers (stencil bit of the GBuffer pass, tested by the snow pass)
    optionalPass(new DecalReceiverDebugPass(device, { name: 'Snow Receivers', stencilBit: SNOW_RECEIVER_STENCIL })),
    // last, like the game's final UpscaleImage: render size → output size (config renderScale / upscaler)
    describePass(new UpscalePass(device), {
      note: 'upscales to the output size when the render scale is below 1, mode by the config upscaler',
    }),
  ]
  return { passes }
}

/**
 * Deferred opaque stage, in the game's order:
 * 1. GBuffer pass, writes GBuffer A/B/C, LinearDepth (the far plane without geometry) and Depth
 * 2. AO from the depth and the GBuffer normals
 * 3. lighting: lights the GBuffer, applies the AO, writes Color
 * 4. emissive variant
 * 5. forward opaque items: the sky (writes the far plane into LinearDepth where no geometry is), unlit, debug
 */
function createOpaquePasses(
  device: Device,
  previousColor: PreviousColorPass,
  luminance: LuminancePass,
  options: ViewerPipelineOptions,
): RenderPass[] {
  return [
    describePass(
      new FunctionPass({
        name: 'OpaqueInputs',
        render: (ctx) => {
          // fog is applied by the FogPass
          ctx.renderInputs.set(InputSlots.Global.SkipFog, TRUE)
          // the passes render into LinearDepth
          ctx.renderInputs.set(CommonInputs.View.SceneDepthMap, getWhiteTexture(ctx.device))
        },
      }),
      {
        note: 'skips fog (applied by the FogPass), unbinds LinearDepth as scene depth input while passes render into it',
      },
    ),
    new GeometryPass({
      name: 'GBufferPass',
      list: GBUFFER_LIST,
      variant: RenderVariant.GBuffer,
      depth: RenderChannel.Depth,
      clearDepth: true,
      stencil: DECAL_RECEIVER_WRITE,
      descriptors: GBUFFER_DESCRIPTORS,
      channels: [
        { clear: Color.TransparentBlack, render: GBufferChannel.A },
        { clear: Color.TransparentBlack, render: GBufferChannel.B },
        { clear: Color.TransparentBlack, render: GBufferChannel.C },
        { clear: linearDepthClear, render: RenderChannel.LinearDepth },
      ],
    }),
    // %DECAL meshes blend into A/B/C (their effects set the blend and the RGB mask), no stencil test, depth not written
    describePass(
      new GeometryPass({
        name: 'MeshDecalPass',
        list: MESH_DECAL_LIST,
        variant: RenderVariant.GBuffer,
        depth: RenderChannel.Depth,
        clearDepth: false,
        channels: [
          { clear: null, render: GBufferChannel.A, blend: BlendState.Alpha },
          { clear: null, render: GBufferChannel.B, blend: BlendState.Alpha },
          { clear: null, render: GBufferChannel.C, blend: BlendState.Alpha },
        ],
      }),
      { note: 'mesh decals (%DECAL) blended into the GBuffer, like the ZPass decal list of the game' },
    ),
    // projected decals (DecalComponent boxes) blend into A/B/C on the decal receivers (plan 7.7)
    optionalPass(
      groupPass({
        name: 'Projected Decals',
        enabled: true,
        passes: [
          describePass(
            new CopyPass(device, { name: 'DecalNormalCopy', input: GBufferChannel.A, output: NwCopyChannel.GBufferA }),
            {
              note: 'copy of GBuffer A, the receiver normals of the decal angle fade',
            },
          ),
          describePass(
            renderInputsPass({
              name: 'DecalInputs',
              textures: [
                [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
                [InputSlots.View.DecalNormalMap, NwCopyChannel.GBufferA],
              ],
            }),
            { note: 'binds LinearDepth and the GBuffer A copy for the decal shader' },
          ),
          new GeometryPass({
            name: 'DecalPass',
            list: PROJECTED_DECAL_LIST,
            variant: NwRenderVariant.ProjectedDecal,
            depth: RenderChannel.Depth,
            clearDepth: false,
            stencil: DECAL_RECEIVER_TEST,
            inputs: [RenderChannel.LinearDepth, NwCopyChannel.GBufferA],
            channels: [
              { clear: null, render: GBufferChannel.A, blend: BlendState.Alpha },
              { clear: null, render: GBufferChannel.B, blend: BlendState.Alpha },
              { clear: null, render: GBufferChannel.C, blend: BlendState.Alpha },
            ],
          }),
          neutralSceneDepthPass('DecalInputsReset'),
        ],
      }),
    ),
    // snow layer after the decals like the game's FX_DeferredSnowLayer, rewrites A/B/C on the
    // snow receivers inside the snow sphere
    optionalPass(
      describePass(
        new SnowPass(device, {
          a: GBufferChannel.A,
          b: GBufferChannel.B,
          c: GBufferChannel.C,
          linearDepth: RenderChannel.LinearDepth,
          stencilBit: SNOW_RECEIVER_STENCIL,
        }),
        { note: 'snow and frost of the active snow volume on the snow receivers' },
      ),
    ),
    // the game's FilterGBuffer after the decals and the snow: normal variance specular antialiasing on GBuffer C
    optionalPass(
      groupPass({
        name: 'Filter GBuffer',
        enabled: true,
        passes: [
          describePass(
            new CopyPass(device, {
              name: 'FilterGBufferCopy',
              input: GBufferChannel.C,
              output: NwCopyChannel.GBufferC,
            }),
            { note: 'copy of GBuffer C, the input of the filter which rewrites C' },
          ),
          describePass(
            new FilterGBufferPass(device, {
              a: GBufferChannel.A,
              c: GBufferChannel.C,
              cCopy: NwCopyChannel.GBufferC,
              linearDepth: RenderChannel.LinearDepth,
            }),
            { note: 'widens the roughness of smooth surfaces by the normal variance of the pixel and its neighbours' },
          ),
        ],
      }),
    ),
    // AO before the lighting (plan phase 5), from the depth and the GBuffer normals
    optionalPass(new XeGtaoPass(device, { normals: GBufferChannel.A })),
    // screen space reflections before the lighting like the game's SSR_Raytrace, hit colors from the previous frame
    optionalPass(
      describePass(
        new SsrPass(device, { previousColor, luminance, gbufferA: GBufferChannel.A, gbufferC: GBufferChannel.C }),
        { note: 'Hi-Z pyramid + screen space reflections, blended into the probe specular by the lighting' },
      ),
    ),
    new LightingPass(device, {
      a: GBufferChannel.A,
      b: GBufferChannel.B,
      c: GBufferChannel.C,
      linearDepth: RenderChannel.LinearDepth,
      ao: NwRenderChannel.AmbientOcclusion,
      reflections: SsrChannel.Reflections,
      output: RenderChannel.Color,
      transparentBackground: options.transparentBackground,
    }),
    // emittance of the opaque surfaces, the materials with emittance register the variant
    optionalPass(
      new GeometryPass({
        name: 'EmissivePass',
        list: OPAQUE_SURFACE_LIST,
        variant: NwRenderVariant.Emissive,
        depth: RenderChannel.Depth,
        clearDepth: false,
        channels: [{ clear: null, render: RenderChannel.Color, blend: BlendState.AdditivePure }],
      }),
    ),
    // emittance of the projected decals, the angle fade reads GBuffer A (no pass writes it after the decals)
    optionalPass(
      groupPass({
        name: 'Projected Decal Emittance',
        enabled: true,
        passes: [
          describePass(
            renderInputsPass({
              name: 'DecalEmissiveInputs',
              textures: [
                [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
                [InputSlots.View.DecalNormalMap, GBufferChannel.A],
              ],
            }),
            { note: 'binds LinearDepth and GBuffer A for the decal shader' },
          ),
          new GeometryPass({
            name: 'DecalEmissivePass',
            list: PROJECTED_DECAL_LIST,
            variant: NwRenderVariant.ProjectedDecalEmissive,
            depth: RenderChannel.Depth,
            clearDepth: false,
            inputs: [RenderChannel.LinearDepth, GBufferChannel.A],
            channels: [{ clear: null, render: RenderChannel.Color, blend: BlendState.AdditivePure }],
          }),
          // the forward opaque pass renders into LinearDepth next
          neutralSceneDepthPass('DecalEmissiveInputsReset'),
        ],
      }),
    ),
    optionalPass(
      new GeometryPass({
        name: 'ForwardOpaquePass',
        list: FORWARD_OPAQUE_LIST,
        depth: RenderChannel.Depth,
        clearDepth: false,
        channels: [
          { clear: null, render: RenderChannel.Color },
          { clear: null, render: RenderChannel.LinearDepth },
        ],
      }),
    ),
  ]
}

function createTransparentPasses(device: Device): RenderPass[] {
  return [
    // the transparent passes render into Color, so they sample a copy
    describePass(new CopyPass(device, { name: 'SceneColorCopy', input: RenderChannel.Color }), {
      note: 'copy of the scene color that transparent materials sample',
    }),
    describePass(
      renderInputsPass({
        name: 'TransparentInputs',
        values: [[InputSlots.Global.SkipFog, FALSE]],
        textures: [
          [CommonInputs.View.SceneColorMap, NwCopyChannel.SceneColor],
          [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
        ],
      }),
      { note: 'transparent materials apply fog, binds scene color and depth' },
    ),
    // water volumes (rivers) before all other transparent geometry, like the WATER_VOLUMES list of the original
    // that is rendered before the TRANSPARENT_AW list. Waterfalls and other transparent meshes end up on top.
    optionalPass(
      groupPass({
        name: 'Water Volumes',
        enabled: true,
        passes: [createTransparentPass('WaterVolumePass', WATER_VOLUME_LIST)],
      }),
    ),
    createTransparentPass('TransparentPass', TRANSPARENT_LIST),
  ]
}

function createTransparentPass(name: string, list: RenderListMode) {
  return new GeometryPass({
    name,
    list,
    depth: RenderChannel.Depth,
    clearDepth: false, // render on top
    inputs: [NwCopyChannel.SceneColor, RenderChannel.LinearDepth],
    descriptors: { [TransparentLinearDepth]: TRANSPARENT_LINEAR_DEPTH_DESC },
    channels: [
      {
        clear: null, // render on top
        render: RenderChannel.Color,
        blend: BlendState.Alpha,
      },
      {
        // cleared by each pass (content is never read), so the passes don't depend on each other
        clear: Color.TransparentBlack,
        render: TransparentLinearDepth,
        blend: BlendState.Opaque,
      },
    ],
  })
}
