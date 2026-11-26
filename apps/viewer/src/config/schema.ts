import { THIRD_PERSON_ENABLED } from '../constants'
import { boolean, choice, defineConfig, integer, number } from './properties'

/**
 * Whether the image is upscaled to the window (RenderSizeSystem): a render scale below native, or a fixed resolution
 * fitted into the window
 */
function isUpscaled(values: Readonly<Record<string, unknown>>): boolean {
  if (values.renderResolution === 'window') {
    return values.renderScale !== 'native'
  }
  return values.renderScaling === 'fit'
}

/**
 * Runtime settings of the viewer
 *
 * @remarks
 * Constants of `constants.ts` are moved here one by one. Constants that are not really configurable,
 * or are hard to pass through the config, stay constants.
 */
export const viewerConfigSchema = defineConfig({
  audioEnabled: boolean({
    label: 'Enabled',
    description: 'Plays the ambient audio.',
    editable: true,
    default: false,
    group: 'Audio',
  }),

  renderResolution: choice({
    label: 'Resolution',
    description: 'Render size in pixels',
    editable: true,
    options: ['window', '1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'],
    default: 'window',
    group: 'Display',
  }),

  renderScaling: choice({
    label: 'Framing',
    description: 'Display of a fixed resolution: fit scales it into the window, none shows it unscaled and centered.',
    editable: true,
    options: [
      'none', // unscaled, centered and cropped if larger than the window
      'fit', // scales the image into the window and keeps the aspect ratio
    ],
    default: 'fit',
    display: 'buttons',
    group: 'Display',
    available: (values) => values.renderResolution !== 'window',
  }),

  renderScale: choice({
    label: 'Scale',
    description:
      'Render resolution relative to the window, upscaled to the window size. ' +
      'The presets of FSR: 77% ultra quality (1.3x), 67% quality (1.5x), 59% balanced (1.7x), 50% performance (2x).',
    editable: true,
    options: ['50%', '59%', '67%', '77%', 'native'],
    default: 'native',
    display: 'buttons',
    group: 'Display',
    available: (values) => values.renderResolution === 'window',
  }),

  upscaler: choice({
    label: 'Upscaler',
    description:
      'Upscale to the window, after the post AA (a scale below native or a fitted resolution): fsr1 is AMD FSR 1 ' +
      '(edge adaptive upsampling + RCAS sharpening), bicubic the B-spline of the game (soft, no ringing), bilinear the ' +
      'plain filter.',
    editable: true,
    options: ['bilinear', 'bicubic', 'fsr1'],
    default: 'fsr1',
    display: 'buttons',
    group: 'Display',
    available: isUpscaled,
  }),

  /**
   * RCAS sharpening of fsr1, higher is sharper. Applied as `2 * (1 - value)` stops (UpscalePass.sharpness): 1 is the
   * strongest, 0 is 2 stops (a quarter), 0.9 is the AMD default of 0.2 stops.
   */
  upscaleSharpness: number({
    label: 'Sharpness',
    description: 'RCAS sharpening of fsr1, higher is sharper. 0.9 is the AMD default.',
    editable: true,
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Display',
    available: (values) => isUpscaled(values) && values.upscaler === 'fsr1',
  }),
  /**
   * Object detail tier of the game (sys_spec_ObjectDetail). The values of each tier are in constants.ts
   * (OBJECT_DETAIL_TIERS): impostor range, spawn radius scale (g_GDE_AOIScale), LOD target size
   * (e_LodFaceAreaTargetSize) and slices spawned per frame. The game does not thin out meshes on lower tiers.
   */
  objectDetail: choice({
    label: 'View distance',
    description:
      'Object detail tier of the game: impostor range (600/800/1200/1400 m), spawn radius scale and LOD target size. ' +
      'The LOD target size needs reload.',
    editable: true,
    options: ['low', 'medium', 'high', 'veryHigh'],
    default: 'high',
    group: 'Details',
  }),
  /**
   * Distance up to which particle emitters are active, multiplied by the emitter view distance multiplier.
   * The engine derives it from the emitter bounds and e_ViewDistRatio, see SliceSystem.
   */
  particleViewDistance: integer({
    label: 'Particle distance',
    description: 'Distance up to which particle emitters are active (times the emitter multiplier). Needs reload.',
    editable: true,
    default: 60,
    min: 20,
    max: 100,
    group: 'Details',
  }),
  particleCountScale: number({
    label: 'Particle count',
    description: 'Scales the particle count of all emitters. Needs reload.',
    editable: true,
    default: 1,
    min: 0.1,
    max: 4,
    step: 0.1,
    group: 'Details',
  }),
  /**
   * One shot effects (demolish, loot, impacts …) are triggered by game events. Shown, they play once on activation.
   * Set by scripts, not a setting. Applies to the effects that load after the change.
   */
  particleOneShots: boolean({
    description: 'Also plays one shot effects (game event effects) once when they come into range.',
    editable: true,
    hidden: true,
    default: false,
    group: 'Details',
  }),

  /**
   * Distance up to which characters animate, further characters keep their last pose. Not the game's animation LOD
   * distance, which is not ported.
   */
  animationDistance: integer({
    label: 'Animation distance',
    description: 'Distance up to which characters animate, further characters keep their last pose.',
    editable: true,
    default: 60,
    min: 20,
    max: 100,
    group: 'Details',
  }),

  fog: choice({
    label: 'Fog',
    description: 'The fog modes',
    editable: true,
    default: 'froxel',
    options: ['off', 'volumetric', 'froxel'],
    display: 'buttons',
    group: 'Lighting',
  }),

  antialiasing: choice({
    label: 'Anti-aliasing',
    description: 'Post-process anti-aliasing of the final image.',
    editable: true,
    options: ['off', 'fxaa', 'cmaa2', 'smaa'],
    default: 'smaa',
    display: 'buttons',
    group: 'Display',
  }),

  ambientOcclusion: choice({
    label: 'Ambient occlusion',
    description:
      'Screen space ambient occlusion (XeGTAO, always denoised) of the probe light. The quality is the number of directions and steps per pixel: higher is smoother and costs more.',
    editable: true,
    options: ['off', 'medium', 'high', 'ultra'],
    default: 'high',
    display: 'buttons',
    group: 'Lighting',
  }),

  reflections: boolean({
    label: 'Reflections',
    description:
      'Screen space reflections (Hi-Z traced, cone traced gloss) on glossy surfaces and water, blended over the probe ' +
      'and env reflections like the game. Off keeps the probe and env reflections only.',
    editable: true,
    default: true,
    display: 'buttons',
    group: 'Lighting',
  }),

  /**
   * Set by the code, not a setting: the level viewer adapts like the game, the model and character viewers fix it
   */
  exposure: choice({
    description:
      'Exposure of the film tone mapping. auto adapts to the scene luminance like the game (EV mode), fixed uses the fixed exposure.',
    editable: true,
    hidden: true,
    options: ['auto', 'fixed'],
    default: 'auto',
    group: 'Lighting',
  }),

  fixedExposure: number({
    description: 'Exposure of the film tone mapping while exposure is fixed: the HDR color is multiplied by it.',
    editable: true,
    hidden: true,
    default: 1,
    min: 0.05,
    // the character stage starts at 8.14 and its control goes 3 stops up
    max: 100,
    step: 0.05,
    group: 'Lighting',
  }),

  playerCollision: boolean({
    label: 'Player collision',
    description:
      'Walls block the third person character (key T). When off, it walks through walls but stays on the ground.',
    editable: true,
    hidden: !THIRD_PERSON_ENABLED,
    default: true,
    group: 'Movement',
  }),
})
