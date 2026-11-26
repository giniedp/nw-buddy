import {
  CameraComponent,
  EcsGame,
  ModelComponent,
  OccTree,
  SchedulerSystem,
  SpatialComponent,
  TimeSystem,
  TransformComponent,
} from '@gglib/components'
import { GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import {
  mat4Copy,
  mat4CreateAxisAngle,
  mat4CreateTranslation,
  mat4Decompose,
  mat4Identity,
  mat4CreateFromArray,
  DEGREE_TO_RAD,
  mat4Multiply,
  SpaceBasis,
  vec3,
  type IVec3,
  type Mat4,
  type Transform,
} from '@gglib/math'
import type { AssetContainer } from '@gglib/content'
import type { Model } from '@gglib/model'
import { Renderer, type RenderPass } from '@gglib/render'
import type { ViewerFogVolumeComponent, ViewerLightConfig, ViewerTimeOfDayComponent } from './api'
import { ViewerConfig, viewerConfigSchema, type ViewerConfigValues } from './config'
import { ContentService } from './content'
import { DEFAULT_PROBE_CUBE_RGB9E5, ProbeCubeLoader } from './content/ProbeCubeLoader'
import {
  addCoreSystems,
  createViewerCamera,
  createViewerRenderer,
  getViewerExposure,
  isMobileGpu,
  isViewerSupported,
  registerViewerContent,
  ScreenshotQueue,
  setViewerExposure,
  setViewerOutput,
  viewerDeviceOptions,
  type ViewerExposure,
  type ViewerOutput,
} from './core'
import { CharacterAnimationSystem } from './game/character/CharacterAnimationSystem'
import { FogVolumeComponent } from './game/fog/FogVolumeComponent'
import { FogVolumeSystem } from './game/fog/FogVolumeSystem'
import { GAME_TO_GLTF } from './game/gltf/gameAxes'
import { GltfCharacterComponent } from './game/gltf/GltfCharacterComponent'
import { GltfAnimationSystem } from './game/gltf/GltfAnimationSystem'
import { createGltfParts, destroyGltfParts, setGltfPartParams, type GltfPart } from './game/gltf/gltfParts'
import { GltfSockets, GltfSocketsComponent, type GltfAttachment, type GltfSocketOffset } from './game/gltf/GltfSockets'
import { SkyLightSystem } from './game/level/SkyLightSystem'
import { TimeOfDayComponent } from './game/level/TimeOfDayComponent'
import { LightComponent } from './game/light/LightComponent'
import { LightSystem } from './game/light/LightSystem'
import { getModelLights } from './game/light/modelLights'
import { EnvProbeComponent } from './game/probes/EnvProbeComponent'
import { EnvProbeSystem } from './game/probes/EnvProbeSystem'
import { MeshLoaderComponent } from './game/slice/MeshLoaderComponent'
import { RenderSizeSystem } from './graphics/RenderSizeSystem'
import type { MaterialParams } from './material/appearance'
import { CharacterControls } from './character-controls'

export interface CharacterViewerOptions {
  /**
   * The canvas to render into, its parent is observed for the render size (see ModelViewer)
   */
  canvas: HTMLCanvasElement
  /**
   * Mouse and touch input on the canvas ({@link CharacterControls}), on by default
   */
  controls?: boolean
  /**
   * See {@link CharacterViewer.quality}, default `high`
   */
  quality?: CharacterViewerQuality
}

/**
 * `low` renders at half the resolution without screen space effects and froxel fog, for slow (mobile) GPUs
 */
export type CharacterViewerQuality = 'low' | 'high'

type QualitySettings = Pick<ViewerConfigValues, 'renderScale' | 'reflections' | 'ambientOcclusion' | 'fog'>

const QUALITY_SETTINGS: Record<CharacterViewerQuality, QualitySettings> = {
  low: {
    renderScale: '50%',
    reflections: false,
    ambientOcclusion: 'off',
    fog: 'volumetric',
  },
  high: {
    renderScale: viewerConfigSchema.renderScale.default,
    reflections: viewerConfigSchema.reflections.default,
    ambientOcclusion: viewerConfigSchema.ambientOcclusion.default,
    fog: viewerConfigSchema.fog.default,
  },
}

/**
 * The stage description, in the stage file as `extras.nwStage` of a node (see {@link CharacterStageOptions})
 */
export interface CharacterStage {
  /**
   * Where the character stands, in the coordinates of the stage file (glTF, Y-up)
   */
  spot: [number, number, number]
  /**
   * The camera position the view starts from, in the coordinates of the stage file. The camera looks horizontally from
   * there at the spot, see {@link CharacterView}.
   */
  camera: [number, number, number]
  /**
   * Hour of the time of day
   */
  time: number
  /**
   * The fixed exposure the stage starts with, see {@link CharacterViewer.exposure}
   */
  exposure: number
  /**
   * The view the stage starts with, see {@link CharacterViewer.view}
   */
  view?: Partial<CharacterView>
}

/**
 * Overrides of the stage file's description (`extras.nwStage`)
 */
export interface CharacterStageOptions extends Partial<CharacterStage> {
  /**
   * The root the file's buffer, image and game file uris (the probe cubes) resolve against, default the folder of the
   * file
   */
  rootUrl?: string
}

const DEFAULT_STAGE: CharacterStage = {
  spot: [0, 0, 0],
  camera: [0, 1.2, 3],
  time: 12,
  exposure: 1,
}

/**
 * The fixed camera: it faces the character from the stage's camera position, moves up and down, zooms out and shifts
 * the character to the side. The character turns instead of the camera ({@link CharacterViewer.characterRotation}).
 *
 * @remarks
 * The stage's trim covers height -0.4…0.5, back 0…2, side 0…1, views beyond show the
 * cut off parts of the scene.
 */
export interface CharacterView {
  /**
   * Meters above (below) the stage's camera position
   */
  height: number
  /**
   * Meters behind the stage's camera position, along the view direction, at least: the camera moves further back when
   * {@link fit} needs it
   */
  back: number
  /**
   * Height of the look target above the character's feet
   */
  look: number
  /**
   * Meters the look target shifts to the camera's left: the character appears right of the image center
   */
  side: number
  /**
   * Width and height in meters (around the look target) that stay in the frame whatever the canvas aspect, null keeps
   * the distance of {@link back}. The camera moves back up to {@link maxBack}.
   */
  fit: { width: number; height: number } | null
  /**
   * The farthest {@link back} the fit may use
   */
  maxBack: number
  /**
   * Radians the camera turns around the character's up axis, positive counterclockwise seen from above. The ship
   * stage's trim holds about ±8°, beyond it cut off parts of the scene show
   */
  orbit: number
  /**
   * Magnification: above 1 the field of view narrows (the camera stays where the fit puts it), below 1 the fit grows
   * and the camera moves back up to {@link maxBack}
   */
  zoom: number
}

/**
 * The ranges the controls keep the view in (see CharacterControls), the stage's trim
 */
export interface CharacterViewLimits {
  zoom: [number, number]
  /**
   * {@link CharacterView.look} and {@link CharacterView.height} from the lowest to the highest framing, they move
   * together (through the stage's default view in between)
   */
  look: [number, number]
  height: [number, number]
}

/**
 * The default view: the character centered and in full, within the stage's trim
 */
const DEFAULT_VIEW: CharacterView = {
  height: 0,
  back: 0,
  look: 1,
  side: 0,
  fit: { width: 1.9, height: 2.1 },
  maxBack: 2,
  orbit: 0,
  zoom: 1,
}

/**
 * The trim (stage/blender_frame.py): height -0.4…0.5, look 0.6…1.7 (knees to head)
 */
const DEFAULT_VIEW_LIMITS: CharacterViewLimits = {
  zoom: [0.7, 3],
  look: [0.6, 1.7],
  height: [-0.4, 0.5],
}

/**
 * A model attached to the character (e.g. an armor piece), its skinned parts follow the character's joints by name
 */
export type CharacterAttachment = GltfAttachment

/**
 * A clip of an animation sequence: a clip file (nodes by controller id, e.g. an nwbt `.caf` export) played on the
 * character's joints. The last clip of a sequence may loop.
 */
export interface CharacterClip {
  url: string
  loop?: boolean
}

/**
 * A loaded clip of the playing sequence, kept for a new character
 */
interface LoadedClip {
  url: string
  loop: boolean
  model: Model
}

interface SlotModel {
  url: string
  model: Model
  parts: GltfPart[]
  materialParams: MaterialParams
}

interface CharacterSlot {
  models: SlotModel[]
  /**
   * Increments with each {@link CharacterViewer.setSlot}, loads of an older call are dropped
   */
  generation: number
}

/**
 * The character scene of the transmog editor: a stage (a glTF scene with the game's lights, time of day and fog), a
 * glTF character on its spot and armor attachments skinned by the character's joints, seen through a fixed camera.
 *
 * @remarks
 * Host driven like the ModelViewer: nothing loads or moves until the host calls it. No persistence.
 *
 * ```ts
 * const viewer = new CharacterViewer({ canvas })
 * await viewer.run()
 * await viewer.showStage(stageUrl)
 * await viewer.showCharacter(playerUrl)
 * await viewer.setSlot('chest', [{ url: armorUrl, rootUrl, materialParams }])
 * viewer.setHiddenParts(['shirt1'])
 * ```
 */
export class CharacterViewer extends EcsGame {
  public camera: CameraComponent

  /**
   * The fixed camera, see {@link CharacterView}. The stage sets its own, changes apply with the next frame.
   */
  public readonly view: CharacterView = { ...DEFAULT_VIEW }

  /**
   * The ranges the controls keep {@link view} in
   */
  public readonly viewLimits: CharacterViewLimits = { ...DEFAULT_VIEW_LIMITS }

  /**
   * The view the stage starts with, see {@link resetView}
   */
  public get stageView(): CharacterView {
    return { ...DEFAULT_VIEW, ...this.stageInfo?.view }
  }

  /**
   * Rotation of the character around the up axis in radians, 0 faces the camera
   */
  public characterRotation = 0

  private stage: GameEntity | null = null
  private stageUrl: string | null = null
  private stageInfo: CharacterStage | null = null
  private readonly characterLights: LightComponent[] = []
  private characterLightScale = 1
  private readonly backgroundLights: LightComponent[] = []
  private readonly stageLights: Array<{ component: LightComponent; position: IVec3 }> = []
  private backgroundLightScale = 1
  private stageAbort: (() => void) | null = null
  private stageGeneration = 0
  private characterGeneration = 0
  private animationGeneration = 0
  /**
   * The clips of the playing sequence, see {@link playAnimation}
   */
  private sequence: LoadedClip[] = []
  private spot = vec3(0, 0, 0)
  private cameraOrigin = vec3(0, 0, -3)
  private character: GameEntity | null = null
  private rig: GltfCharacterComponent | null = null
  private bodyParts: GltfPart[] = []
  private readonly slots = new Map<string, CharacterSlot>()
  private readonly socketModels = new GltfSockets((it) => this.loadAttachment(it))
  private readonly hidden = new Set<string>()
  private sunEnabled = false
  private shownOutput: ViewerOutput = 'final'
  private passes: RenderPass[] | null = null
  private screenshots = new ScreenshotQueue()
  private currentQuality: CharacterViewerQuality

  public static isSupported(): Promise<boolean> {
    return isViewerSupported()
  }

  /**
   * The quality that suits the GPU
   */
  public static async suggestedQuality(): Promise<CharacterViewerQuality> {
    return (await isMobileGpu()) ? 'low' : 'high'
  }

  /**
   * The input on the canvas, null when turned off ({@link CharacterViewerOptions.controls})
   */
  public readonly controls: CharacterControls | null

  public constructor(options: CharacterViewerOptions) {
    super(viewerDeviceOptions(options.canvas))
    this.controls = options.controls === false ? null : new CharacterControls(this, options.canvas)
    this.currentQuality = options.quality ?? 'high'
  }

  /**
   * The render quality, changes apply right away
   */
  public get quality(): CharacterViewerQuality {
    return this.currentQuality
  }
  public set quality(value: CharacterViewerQuality) {
    this.currentQuality = value
    // before run, onCreate applies it
    if (this.passes) {
      this.applyQuality(this.config)
    }
  }

  private applyQuality(config: ViewerConfig) {
    const settings = QUALITY_SETTINGS[this.currentQuality]
    config.set('renderScale', settings.renderScale)
    config.set('reflections', settings.reflections)
    config.set('ambientOcclusion', settings.ambientOcclusion)
    config.set('fog', settings.fog)
  }

  public get config(): ViewerConfig {
    return this.world.getSystem(ViewerConfig)
  }

  public get clock(): TimeSystem {
    return this.world.getSystem(TimeSystem)
  }

  /**
   * Multiplier of the stage's character lights, the lights a cutscene switches on (`extras.nwSequence`, e.g. the key
   * and fill lights of the character creation). 1 is the game's light. Unlike {@link exposure}, the rest of the
   * stage (lamps, fog, glow) keeps its light.
   */
  public get characterLight(): number {
    return this.characterLightScale
  }
  public set characterLight(value: number) {
    this.characterLightScale = value
    for (const light of this.characterLights) {
      light.scale = value
    }
  }

  /**
   * Multiplier of the stage's background lights: the lights behind the character (seen from the stage's camera) that
   * light the back of the stage, e.g. the teal accents on the ship's back wall. Ambient lights and probes keep their
   * light. 1 is the editor's default, {@link BACKGROUND_LIGHT} times the game's light.
   */
  public get backgroundLight(): number {
    return this.backgroundLightScale
  }
  public set backgroundLight(value: number) {
    this.backgroundLightScale = value
    for (const light of this.backgroundLights) {
      light.scale = BACKGROUND_LIGHT.base * value
    }
  }

  /**
   * Whether the stage has character lights, see {@link characterLight}
   */
  public get hasCharacterLights(): boolean {
    return this.characterLights.length > 0
  }

  /**
   * The exposure of the tone mapping: a fixed exposure (the HDR color is multiplied by it), the stage sets its own
   * ({@link CharacterStage.exposure}); `auto` adapts to the scene luminance like the game
   */
  public get exposure(): ViewerExposure {
    return getViewerExposure(this.config)
  }
  public set exposure(value: ViewerExposure) {
    setViewerExposure(this.config, value)
  }

  /**
   * What the viewer shows instead of the final image, for debugging
   */
  public get output(): ViewerOutput {
    return this.shownOutput
  }
  public set output(value: ViewerOutput) {
    this.shownOutput = value
    this.applyOutput()
  }

  private applyOutput() {
    // before run, onCreate applies it
    if (this.passes) {
      setViewerOutput(this.world.getSystem(Renderer), this.passes, this.shownOutput)
    }
  }

  /**
   * Hour of the stage's time of day, the stage sets its own ({@link CharacterStage.time})
   */
  public get time(): number {
    return this.world.getSystem(SkyLightSystem).timeOfDay.time
  }
  public set time(value: number) {
    const tod = this.world.getSystem(SkyLightSystem).timeOfDay
    tod.time = value
    tod.animate = false
  }

  /**
   * The sun of the stage's time of day. Off by default: the renderer has no shadows yet, the sun would shine through
   * the walls of an interior.
   */
  public get sun(): boolean {
    return this.sunEnabled
  }
  public set sun(value: boolean) {
    this.sunEnabled = value
  }

  /**
   * The parts of the character and its attachments by node name, see {@link setHiddenParts}
   */
  public get parts(): string[] {
    return [...this.allParts()].map((it) => it.name)
  }

  /**
   * The parts of the character file that the game hides by default (e.g. the players' sleeveless torso `shirt2`). The
   * viewer shows them unless they are in {@link setHiddenParts}, the app decides.
   */
  public get defaultHiddenParts(): string[] {
    return this.bodyParts.filter((it) => it.hiddenByDefault).map((it) => it.name)
  }

  /**
   * The description of the shown stage (with the options of {@link showStage}), null without a stage
   */
  public get stageDescription(): CharacterStage | null {
    return this.stageInfo
  }

  protected override onCreate(): void {
    const config = new ViewerConfig({ persist: false })
    // a fixed exposure the user controls, the stage sets its own
    config.set('exposure', 'fixed')
    config.set('fixedExposure', DEFAULT_STAGE.exposure)
    this.applyQuality(config)
    // stage and characters have no water, snow or clouds, their engine textures are BC (no BC on mobile)
    addCoreSystems(this, { config, nwbtUrl: null, environmentTextures: false })
    this.world.addSystem(new FogVolumeSystem())
    this.world.addSystem(new CharacterAnimationSystem())
    this.world.addSystem(new GltfAnimationSystem())
    this.world.addSystem(new SkyLightSystem())
    this.world.addSystem(new LightSystem())
    // the stage embeds its cubes as RGB9E5 (no BC on mobile), a few slots: the default cube and the stage's
    this.world.addSystem(
      new ProbeCubeLoader({
        atlas: { format: 'rgb9e5ufloat', slots: STAGE_PROBE_SLOTS },
        defaultCube: DEFAULT_PROBE_CUBE_RGB9E5,
      }),
    )
    this.world.addSystem(new EnvProbeSystem())
    this.world.addSystem(new SchedulerSystem({ viewAlignment: 0 }))
    const { renderer, passes } = createViewerRenderer(this.device, config, { transparentBackground: false })
    this.passes = passes
    this.world.addSystem(renderer)
    this.applyOutput()
  }

  protected override onInitialize(): void {
    super.onInitialize()
    registerViewerContent(this.content)
    this.camera = createViewerCamera(this, { far: CHARACTER_VIEWER_FAR })
    this.camera.perspectiveFov = CHARACTER_VIEWER_FOV
  }

  protected override onBeginRun(): void {
    this.world.initialize()
    this.world.getSystem(ContentService).whenLoaded.then(() => {
      this.scene.entity.activate()
    })
  }

  protected override onBeginUpdate(time: number, dt: number): void {
    super.onBeginUpdate(time, dt)
    this.camera.aspect = this.world.getSystem(RenderSizeSystem).aspectRatio
    this.world.getSystem(SchedulerSystem).updatePriorities(this.camera, time)
    this.world.getSystem(SkyLightSystem).timeOfDay.sunMultiplier = this.sunEnabled ? 1 : 0
    this.updateCamera()
    this.updateCharacterTransform()
  }

  protected override onEndDraw(time: number, dt: number): void {
    super.onEndDraw(time, dt)
    this.screenshots.flush(this.device.canvas, null)
  }

  /**
   * Shows a stage in place of the current one. Its lights (KHR_lights_punctual), time of day zones and fog volumes
   * (the game's, in node extras) become scene components.
   */
  public async showStage(url: string, options: CharacterStageOptions = {}): Promise<void> {
    this.clearStage()
    const generation = ++this.stageGeneration
    await this.ready
    await this.world.getSystem(ContentService).whenLoaded
    if (generation !== this.stageGeneration) {
      throw abortError(url)
    }
    const content = this.world.getSystem(ContentService)
    this.stageUrl = url
    content.setGltfBaseUrl(url, options.rootUrl ?? null)
    const rootUrl = new URL(options.rootUrl ?? '.', url).href
    const world = mat4Copy(this.world.getSystem(SpaceBasis).fromViewSpace)

    const root = this.createEntity({
      name: 'Stage',
      parent: this.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-512, -512, -512),
            max: vec3(512, 512, 512),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
      ],
    })
    this.stage = root
    // shares the model's loading container, for the probe cubes the stage file embeds
    const container = content.loadGltfContainer(url)
    container.catch(() => undefined)
    const loader = new MeshLoaderComponent({ type: 'Mesh', mesh: url, alwaysRender: true })
    const entity = this.createEntity({
      name: url,
      parent: root,
      transform: new TransformComponent({ keepWorld: true, world }),
      components: [loader],
    })
    return new Promise<void>((resolve, reject) => {
      // a later showStage destroys the entity before it loads
      this.stageAbort = () => reject(abortError(url))
      entity.events.on(MeshLoaderComponent.onLoad, () => {
        this.stageAbort = null
        const { rootUrl: _, ...overrides } = withoutUndefined(options)
        const stage: CharacterStage = {
          ...DEFAULT_STAGE,
          ...this.attachStageContent(entity, world, rootUrl, container),
          ...overrides,
        }
        this.stageInfo = stage
        this.spot = transformPoint(world, stage.spot)
        this.cameraOrigin = transformPoint(world, stage.camera)
        this.addKeyLight(root)
        this.collectBackgroundLights()
        this.time = stage.time
        this.exposure = stage.exposure
        Object.assign(this.view, DEFAULT_VIEW, stage.view)
        resolve()
      })
      entity.events.on(MeshLoaderComponent.onError, () => {
        this.stageAbort = null
        reject(new Error(`stage not loaded: ${url}`))
      })
    })
  }

  /**
   * Shows a character (a glTF file with skinned parts) on the stage's spot, in place of the current one. The
   * attachments are kept and bound to the new character.
   */
  public async showCharacter(url: string, options: { rootUrl?: string } = {}): Promise<void> {
    const generation = ++this.characterGeneration
    await this.ready
    const content = this.world.getSystem(ContentService)
    content.setGltfBaseUrl(url, options.rootUrl ?? null)
    const model = await content.loadModel(url, '', content.scopeOf(this.scene.entity))
    if (generation !== this.characterGeneration) {
      throw abortError(url)
    }
    this.clearCharacter()
    this.rig = new GltfCharacterComponent(model)
    this.character = this.createEntity({
      name: 'Character',
      parent: this.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: this.characterTransform() }),
      components: [this.rig, new GltfSocketsComponent(this.socketModels)],
    })
    this.bodyParts = this.createParts(model, null)
    // the attachments bind to the new joints
    for (const slot of this.slots.values()) {
      for (const it of slot.models) {
        destroyGltfParts(it.parts)
        it.parts = this.createParts(it.model, it.materialParams)
      }
    }
    this.socketModels.attach(model, this.character)
    // the playing sequence continues on the new character
    this.applySequence()
  }

  /**
   * Plays a sequence of clips on the character (e.g. the start and the loop of an emote), in place of the playing
   * one; null or an empty list restores the rest pose. The sequence stays for a new character.
   *
   * @remarks
   * A later call replaces a pending one, which rejects with an `AbortError`.
   */
  public async playAnimation(clips: CharacterClip[] | null): Promise<void> {
    const generation = ++this.animationGeneration
    await this.ready
    const content = this.world.getSystem(ContentService)
    const models = await Promise.all(
      (clips ?? []).map((it) => content.loadModel(it.url, '', content.scopeOf(this.scene.entity))),
    )
    if (generation !== this.animationGeneration) {
      throw abortError('animation')
    }
    this.sequence = models.map((model, index) => {
      return { url: clips[index].url, loop: !!clips[index].loop, model }
    })
    this.applySequence()
  }

  /**
   * Whether the sequence plays, false pauses it (the pose stays)
   */
  public get animationPlaying(): boolean {
    return !!this.rig?.clips.playing
  }
  public set animationPlaying(value: boolean) {
    if (this.rig?.clips.active) {
      this.rig.clips.playing = value
    }
  }

  /**
   * A sequence without a loop played to its end and stopped. Playing it again starts it over.
   */
  public get animationEnded(): boolean {
    return !!this.rig?.clips.ended
  }

  /**
   * Time in the sequence in seconds, setting it scrubs (also while paused)
   */
  public get animationTime(): number {
    return this.rig?.clips.time ?? 0
  }
  public set animationTime(value: number) {
    if (this.rig) {
      this.rig.clips.time = value
    }
  }

  /**
   * Duration of the sequence in seconds, a looping last clip counts once
   */
  public get animationDuration(): number {
    return this.rig?.clips.duration ?? 0
  }

  /**
   * The character's current pose: the local joint transforms by controller id (translation xyz, rotation xyzw) in the
   * axes of the character file (glTF), e.g. for a posed export (nwbt `/characters/compose`). Empty without a character.
   */
  public characterPose(): Record<string, number[]> {
    return this.rig?.pose() ?? {}
  }

  /**
   * Sets the models of a slot (e.g. the two skins of a chest armor), replacing the slot's models. Their skinned parts
   * follow the character's joints by name. An empty list empties the slot.
   *
   * @remarks
   * Idempotent: models of the same urls stay and only take the new material params (dye changes don't reload). A
   * later call for the same slot replaces a pending one, which rejects with an `AbortError`.
   */
  public async setSlot(slot: string, attachments: CharacterAttachment[]): Promise<void> {
    const current = this.slots.get(slot) ?? { models: [], generation: 0 }
    this.slots.set(slot, current)
    const generation = ++current.generation
    if (sameUrls(current.models, attachments)) {
      current.models.forEach((it, index) => this.applyMaterialParams(it, attachments[index].materialParams))
      return
    }
    const models = await Promise.all(attachments.map((it) => this.loadAttachment(it)))
    if (generation !== current.generation) {
      throw abortError(slot)
    }
    for (const it of current.models) {
      destroyGltfParts(it.parts)
    }
    current.models = models.map((model, index) => {
      const materialParams = { ...attachments[index].materialParams }
      return { url: attachments[index].url, model, materialParams, parts: this.createParts(model, materialParams) }
    })
  }

  /**
   * The sockets of the character: the bone attachments of its file (e.g. `righthandattach`, `left_sword`)
   */
  public get sockets(): string[] {
    return this.socketModels.names
  }

  /**
   * Places models on a socket (e.g. a weapon in a hand or a sheath), replacing the socket's models. A model keeps its
   * own skeleton, its root sits on the socket and follows the socket's joint. An empty list empties the socket.
   *
   * @remarks
   * Idempotent like {@link setSlot}: models of the same urls stay and take the new material params and offset. A
   * later call for the same socket replaces a pending one, which rejects with an `AbortError`.
   */
  public setSocket(socket: string, attachments: CharacterAttachment[], offset: GltfSocketOffset = {}): Promise<void> {
    return this.socketModels.set(socket, attachments, offset)
  }

  private async loadAttachment(attachment: CharacterAttachment): Promise<Model> {
    await this.ready
    const content = this.world.getSystem(ContentService)
    content.setGltfBaseUrl(attachment.url, attachment.rootUrl ?? null)
    return content.loadModel(attachment.url, '', content.scopeOf(this.scene.entity))
  }

  /**
   * Hides the parts with these node names, of the character and of the attachments (e.g. the naked `shirt1` under a
   * chest armor), shows all others
   */
  public setHiddenParts(names: Iterable<string>) {
    this.hidden.clear()
    for (const name of names) {
      this.hidden.add(name)
    }
    for (const part of this.allParts()) {
      this.applyVisibility(part)
    }
  }

  public screenshot(): Promise<Blob | null> {
    return this.screenshots.request()
  }

  /**
   * Back to the stage's view, the character faces the camera
   */
  public resetView() {
    Object.assign(this.view, this.stageView)
    this.characterRotation = 0
  }

  public dispose() {
    this.controls?.dispose()
    this.clearCharacter()
    this.clearStage()
    this.destroy()
    this.device.dispose()
  }

  private clearStage() {
    this.stageAbort?.()
    this.stageAbort = null
    this.stageInfo = null
    this.characterLights.length = 0
    this.backgroundLights.length = 0
    this.stageLights.length = 0
    if (this.stageUrl) {
      this.world.getSystem(ContentService).setGltfBaseUrl(this.stageUrl, null)
      this.stageUrl = null
    }
    if (this.stage) {
      this.stage.destroy()
      this.stage.setParent(null)
      this.stage = null
    }
  }

  private clearCharacter() {
    destroyGltfParts(this.bodyParts)
    this.bodyParts = []
    for (const slot of this.slots.values()) {
      for (const it of slot.models) {
        destroyGltfParts(it.parts)
        it.parts = []
      }
    }
    this.socketModels.detach()
    if (this.character) {
      this.character.destroy()
      this.character.setParent(null)
      this.character = null
    }
    this.rig = null
  }

  /**
   * Hands the playing sequence to the character's rig
   */
  private applySequence() {
    this.rig?.setClips(
      this.sequence
        .filter((it) => it.model.animations.length > 0)
        .map((it) => ({ data: it.model.animations[0], nodes: it.model.transformNodes, loop: it.loop })),
    )
  }

  private *allParts(): Iterable<GltfPart> {
    yield* this.bodyParts
    for (const slot of this.slots.values()) {
      for (const it of slot.models) {
        yield* it.parts
      }
    }
  }

  /**
   * Replaces the public params of a slot model's materials (e.g. dye colors)
   */
  private applyMaterialParams(slotModel: SlotModel, params: MaterialParams | null | undefined) {
    slotModel.materialParams = { ...params }
    setGltfPartParams(slotModel.parts, slotModel.materialParams)
  }

  /**
   * The parts of a model below the character, skinned by the character's joints
   */
  private createParts(model: Model, materialParams: MaterialParams | null): GltfPart[] {
    if (!this.character || !this.rig) {
      return []
    }
    const parts = createGltfParts({ model, rig: this.rig, parent: this.character, materialParams })
    for (const part of parts) {
      this.applyVisibility(part)
    }
    return parts
  }

  private applyVisibility(part: GltfPart) {
    const visible = !this.hidden.has(part.name)
    if (visible && part.entity.canActivate) {
      part.entity.activate()
    } else if (!visible && part.entity.canDeactivate) {
      part.entity.deactivate()
    }
  }

  /**
   * Lights, time of day zones, fog volumes and env probes of the stage, below the entity that renders it
   */
  private attachStageContent(
    entity: GameEntity,
    world: Mat4,
    rootUrl: string,
    container: Promise<AssetContainer>,
  ): Partial<CharacterStage> {
    const found = findModel(entity)
    if (!found) {
      return {}
    }
    let stage: Partial<CharacterStage> = {}
    const embedded = new Set<string>()
    for (const light of getModelLights(found.model)) {
      const component = new LightComponent(light.config)
      if (light.sequence) {
        component.scale = this.characterLightScale
        this.characterLights.push(component)
      } else if (!light.config.ambient && !light.config.hidden) {
        const local = light.local
        this.stageLights.push({ component, position: transformPoint(world, [local[12], local[13], local[14]]) })
      }
      this.createEntity({
        name: light.name,
        parent: found.entity,
        transform: new TransformComponent({ local: light.local }),
        components: [component],
      })
    }
    found.model.update(mat4Identity())
    for (const node of found.model.transformNodes) {
      const extras = node.data?.extras
      if (extras?.['nwStage']) {
        stage = extras['nwStage'] as Partial<CharacterStage>
        continue
      }
      const tod = extras?.['nwTimeOfDay'] as ViewerTimeOfDayComponent | undefined
      const fog = extras?.['nwFogVolume'] as ViewerFogVolumeComponent | undefined
      const config = extras?.['nwEnvProbe'] as ViewerLightConfig | undefined
      const probe = config && withCubemapUrl(config, rootUrl)
      if (probe && hasEmbeddedCube(probe) && !embedded.has(probe.cubemap)) {
        embedded.add(probe.cubemap)
        this.provideEmbeddedCube(probe, container)
      }
      const component = stageComponent(tod, fog, probe)
      if (!component) {
        continue
      }
      // the game data (zone, volume and probe boxes, fog falloff) is in the game's local axes
      this.createEntity({
        name: node.name,
        parent: found.entity,
        transform: new TransformComponent({ local: mat4Multiply(node.world, GAME_TO_GLTF) }),
        components: [component],
      })
    }
    return stage
  }

  /**
   * The cubes of a probe embedded in the stage file: they load from the stage's container, the probe requests them by
   * its cubemap url
   */
  private provideEmbeddedCube(probe: ViewerLightConfig, container: Promise<AssetContainer>) {
    const content = this.world.getSystem(ContentService)
    const sources = container.then(async (it) => {
      const [specular, diffuse] = await Promise.all([
        content.loadGltfTextureData(it, probe.cubemapTexture),
        content.loadGltfTextureData(it, probe.cubemapDiffuseTexture),
      ])
      return { specular, diffuse }
    })
    this.world.getSystem(ProbeCubeLoader).provide(probe.cubemap, sources)
  }

  /**
   * The character stands on the spot, turned by {@link characterRotation} from facing the camera
   */
  /**
   * The editor's own key light for the whole character: the game's creation rig lights only the face (its camera is
   * a close-up). A soft projector from the camera's side, above the head, aimed at the middle of the body. It is a
   * character light, {@link characterLight} scales it.
   */
  private addKeyLight(root: GameEntity) {
    const basis = this.world.getSystem(SpaceBasis)
    const up = [basis.up.x, basis.up.y, basis.up.z]
    const toCamera = normalize(horizontal(basis, sub(this.cameraOrigin, this.spot)))
    // the horizontal direction turned about up (Rodrigues, the vector is perpendicular to up)
    const side = cross(up, toCamera)
    const angle = KEY_LIGHT.angle * DEGREE_TO_RAD
    const out = [0, 1, 2].map((i) => toCamera[i] * Math.cos(angle) + side[i] * Math.sin(angle))
    const position = [0, 1, 2].map((i) => {
      const spot = [this.spot.x, this.spot.y, this.spot.z][i]
      return spot + out[i] * KEY_LIGHT.distance + up[i] * KEY_LIGHT.height
    })
    const target = [
      this.spot.x + up[0] * KEY_LIGHT.target,
      this.spot.y + up[1] * KEY_LIGHT.target,
      this.spot.z + up[2] * KEY_LIGHT.target,
    ]
    // the light emits along its local +X (LightComponent)
    const x = normalize([target[0] - position[0], target[1] - position[1], target[2] - position[2]])
    const y = normalize(cross(up, x))
    const z = cross(x, y)
    // column major: the axes, then the position
    const local = mat4CreateFromArray([
      ...[x[0], x[1], x[2], 0],
      ...[y[0], y[1], y[2], 0],
      ...[z[0], z[1], z[2], 0],
      ...[position[0], position[1], position[2], 1],
    ])
    const light = new LightComponent({
      type: 'Projector',
      color: KEY_LIGHT.color,
      diffuseMultiplier: KEY_LIGHT.diffuse,
      specMultiplier: 1,
      attenuation: KEY_LIGHT.bulb,
      range: KEY_LIGHT.range,
      ambient: false,
      areaWidth: 0,
      areaHeight: 0,
      areaFOV: 0,
      projectorDistance: KEY_LIGHT.range,
      projectorFOV: KEY_LIGHT.fov,
      projectorNearPlane: 0,
      maxViewDistance: 0,
      viewDistanceEnabled: false,
      viewDistanceMultiplier: 0,
    })
    light.scale = this.characterLightScale
    this.characterLights.push(light)
    this.createEntity({
      name: 'Character Key Light',
      parent: root,
      transform: new TransformComponent({ local }),
      components: [light],
    })
  }

  /**
   * The background lights ({@link backgroundLight}): the stage's lights (not ambient, not character lights) between
   * {@link BACKGROUND_LIGHT} `near` and `far` behind the spot, along the horizontal view of the stage's camera
   */
  private collectBackgroundLights() {
    const basis = this.world.getSystem(SpaceBasis)
    const view = normalize(horizontal(basis, sub(this.spot, this.cameraOrigin)))
    for (const { component, position } of this.stageLights) {
      const depth = dot(sub(position, this.spot), view)
      if (depth > BACKGROUND_LIGHT.near && depth < BACKGROUND_LIGHT.far) {
        component.scale = BACKGROUND_LIGHT.base * this.backgroundLightScale
        this.backgroundLights.push(component)
      }
    }
  }

  private characterTransform(): Mat4 {
    const basis = this.world.getSystem(SpaceBasis)
    // facing the camera: the character's forward turns onto the horizontal direction from the spot to the camera
    const toCamera = horizontal(basis, sub(this.cameraOrigin, this.spot))
    const forward = [basis.forward.x, basis.forward.y, basis.forward.z]
    const up = [basis.up.x, basis.up.y, basis.up.z]
    const facing = Math.atan2(dot(cross(forward, toCamera), up), dot(forward, toCamera))
    // the character's front is the basis backward (glTF +Z), a half turn from the forward
    const placement = mat4Multiply(
      mat4CreateTranslation(this.spot),
      mat4CreateAxisAngle(basis.up, facing + Math.PI + this.characterRotation),
    )
    // the character file is glTF (Y-up)
    return mat4Multiply(placement, basis.fromViewSpace)
  }

  private updateCharacterTransform() {
    if (this.character) {
      setTransform(this.character.component(TransformComponent), this.characterTransform())
    }
  }

  /**
   * The {@link CharacterView.back} that keeps {@link CharacterView.fit} (grown by a zoom below 1) in the frame at the
   * current aspect and the base field of view, from the horizontal distance of the stage's camera position to the spot
   */
  private fitBack(distance: number): number {
    const view = this.view
    if (!view.fit) {
      return view.back
    }
    const scale = 1 / Math.min(view.zoom, 1)
    const tanHalfY = Math.tan(CHARACTER_VIEWER_FOV / 2)
    const tanHalfX = tanHalfY * this.camera.aspect
    const needed = Math.max((view.fit.height * scale) / 2 / tanHalfY, (view.fit.width * scale) / 2 / tanHalfX)
    return Math.min(Math.max(view.back, needed - distance), view.maxBack)
  }

  /**
   * Places the camera by {@link view}: from the stage's camera position, looking horizontally at the spot, turned
   * around the spot by the orbit
   */
  private updateCamera() {
    if (!this.camera) {
      return
    }
    const basis = this.world.getSystem(SpaceBasis)
    const up = [basis.up.x, basis.up.y, basis.up.z]
    // the horizontal view direction from the camera origin to the spot, and the camera's left
    const forward = horizontal(basis, sub(this.spot, this.cameraOrigin))
    const left = cross(up, forward)
    const view = this.view
    const origin = [this.cameraOrigin.x, this.cameraOrigin.y, this.cameraOrigin.z]
    const spot = [this.spot.x, this.spot.y, this.spot.z]
    const back = this.fitBack(Math.hypot(...horizontalVector(basis, sub(this.spot, this.cameraOrigin))))
    const eye = [0, 1, 2].map((i) => origin[i] - forward[i] * back + up[i] * view.height)
    const target = [0, 1, 2].map((i) => spot[i] + left[i] * view.side + up[i] * view.look)
    const zoom = Math.max(view.zoom, 1)
    this.camera.perspectiveFov = 2 * Math.atan(Math.tan(CHARACTER_VIEWER_FOV / 2) / zoom)
    setTransform(
      this.camera.entity.component(TransformComponent),
      lookFrom(basis, orbitPoint(eye, spot, up, view.orbit), orbitPoint(target, spot, up, view.orbit)),
    )
  }
}

/**
 * The first model below the entity and the entity that renders it
 */
function findModel(entity: GameEntity): { entity: GameEntity; model: Model } | null {
  const component = entity.component(ModelComponent, GetComponent.Optional)
  if (component?.model) {
    return { entity, model: component.model }
  }
  for (const child of entity.getTransform().children) {
    const found = findModel(child.entity)
    if (found) {
      return found
    }
  }
  return null
}

function transformPoint(m: Mat4, p: ArrayLike<number>): IVec3 {
  return vec3(
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  )
}

/**
 * Sets the transform (no parent transform, keepWorld) to a world matrix
 */
function setTransform(transform: Transform, world: Mat4) {
  mat4Decompose(world, transform.scale, transform.rotation, transform.translation)
  transform.markAsChanged()
}

function sub(a: IVec3, b: IVec3): number[] {
  return [a.x - b.x, a.y - b.y, a.z - b.z]
}

function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * The probe with its cubemap (a game file path) as an url below the stage's root: the cubes travel with the stage
 * (`<root>/<game path>` and its `_diff` sibling), the CharacterViewer has no game file server
 */
function withCubemapUrl(probe: ViewerLightConfig, rootUrl: string): ViewerLightConfig {
  if (!probe.cubemap) {
    return probe
  }
  return { ...probe, cubemap: new URL(probe.cubemap, rootUrl).href }
}

/**
 * Whether the stage file embeds the probe's cubes, see {@link ViewerLightConfig.cubemapTexture}
 */
function hasEmbeddedCube(probe: ViewerLightConfig): boolean {
  return !!probe.cubemap && probe.cubemapTexture != null && probe.cubemapDiffuseTexture != null
}

/**
 * Whether the slot shows the models of these attachments, in the same order
 */
function sameUrls(models: SlotModel[], attachments: CharacterAttachment[]): boolean {
  if (models.length !== attachments.length) {
    return false
  }
  return models.every((it, index) => it.url === attachments[index].url)
}

/**
 * The rejection of a load that a later call replaced
 */
function abortError(what: string): DOMException {
  return new DOMException(`replaced: ${what}`, 'AbortError')
}

/**
 * The defined values of the options, so that they override defaults only where set
 */
function withoutUndefined<T extends object>(options: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in options) {
    if (options[key] !== undefined) {
      result[key] = options[key]
    }
  }
  return result
}

/**
 * The component of a stage node with game data in its extras
 */
function stageComponent(
  tod: ViewerTimeOfDayComponent | undefined,
  fog: ViewerFogVolumeComponent | undefined,
  probe: ViewerLightConfig | undefined,
): GameComponent | null {
  if (tod) {
    return new TimeOfDayComponent(tod)
  }
  if (fog) {
    return new FogVolumeComponent(fog)
  }
  if (probe) {
    return new EnvProbeComponent(probe)
  }
  return null
}

/**
 * The vector without its part along the world up
 */
function horizontalVector(basis: SpaceBasis, v: number[]): number[] {
  const up = [basis.up.x, basis.up.y, basis.up.z]
  const d = dot(v, up)
  return [v[0] - up[0] * d, v[1] - up[1] * d, v[2] - up[2] * d]
}

/**
 * The vector without its part along the world up, normalized
 */
function horizontal(basis: SpaceBasis, v: number[]): number[] {
  return normalize(horizontalVector(basis, v))
}

/**
 * World matrix of a camera at the eye looking at the target: the basis axes (right, forward, up) turned onto the
 * view's axes
 */
function lookFrom(basis: SpaceBasis, eye: number[], target: number[]): Mat4 {
  const f = normalize([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]])
  const r = normalize(cross(f, [basis.up.x, basis.up.y, basis.up.z]))
  const u = cross(r, f)
  // rotation R with R * basis.right = r, R * basis.forward = f, R * basis.up = u: R = [r f u] * [br bf bu]^T
  const a = [r, f, u]
  const b = [basis.right, basis.forward, basis.up].map((it) => [it.x, it.y, it.z])
  const m = mat4Identity()
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0
      for (let k = 0; k < 3; k++) {
        sum += a[k][row] * b[k][col]
      }
      m[col * 4 + row] = sum
    }
  }
  m[12] = eye[0]
  m[13] = eye[1]
  m[14] = eye[2]
  return m
}

/**
 * The point turned around the (unit) axis through the center, counterclockwise looking down the axis
 */
function orbitPoint(point: number[], center: number[], axis: number[], angle: number): number[] {
  if (!angle) {
    return point
  }
  const v = sub3(point, center)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const k = cross(axis, v)
  const d = dot(axis, v) * (1 - cos)
  return [0, 1, 2].map((i) => center[i] + v[i] * cos + k[i] * sin + axis[i] * d)
}

function sub3(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function normalize(v: number[]): number[] {
  const length = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / length, v[1] / length, v[2] / length]
}

function cross(a: number[], b: number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/**
 * The editor's key light ({@link CharacterViewer.addKeyLight}): `angle` (degrees) turns it from the spot-camera
 * direction about up, `distance` from the spot, `height` and `target` (the aim point) above the spot, in meters.
 * The color follows the game's warm key (`Light_Key_warm_right`), the bulb is large for a soft falloff over the body.
 */
const KEY_LIGHT = {
  angle: 35,
  distance: 2.6,
  height: 2.1,
  target: 1.1,
  fov: 70,
  range: 6,
  bulb: 1,
  diffuse: 0.16,
  color: [1, 0.96, 0.88, 1] as [number, number, number, number],
}

/**
 * The background lights ({@link CharacterViewer.backgroundLight}): between `near` and `far` meters behind the spot
 * (the ship's back wall is 3.4 m behind it), `base` times the game's light by default: the game's accents there are
 * faint, the back of the stage would stay black
 */
const BACKGROUND_LIGHT = {
  near: 0.3,
  far: 4,
  base: 8,
}

const CHARACTER_VIEWER_FAR = 500
/**
 * Field of view of the camera, the stage's trim (blender_frame.py) covers 50° vertical at 21:9
 */
const CHARACTER_VIEWER_FOV = (50 * Math.PI) / 180
/**
 * Probe atlas slots: the default cube and the stage's (the ship has two), about 2 MB each as RGB9E5
 */
const STAGE_PROBE_SLOTS = 4
