import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  MouseInputSystem,
  SchedulerSystem,
  SpatialSystem,
  TimeSystem,
  TransformComponent,
  WASDComponent,
  type SceneStats,
  type SchedulerStats,
} from '@gglib/components'
import { type GameEntity } from '@gglib/ecs'
import { GameLoop, MouseListener } from '@gglib/game'
import { Color, type DeviceStats } from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4,
  mat4$initScaleUniform,
  mat4$premultiply,
  mat4CreateFromArray,
  mat4CreateFromRTS,
  mat4GetTranslation,
  mat4Identity,
  RAD_TO_DEGREE,
  SpaceBasis,
  vec3,
  vec3Add,
  vec3ApplyMat4Rotation,
  vec3Dot,
  vec3MultiplyScalar,
  vec3Normalize,
  vec3Subtract,
  vec4,
  type Mat4,
} from '@gglib/math'
import { RenderChannel, Renderer, RenderPipeline, type RendererStats, type RenderView } from '@gglib/render'
import { brand, lfmt, type EventType } from '@gglib/utils'
import { isViewerCameraComponent, type LevelInfo, type ViewerSlice } from './api'
import { AudioSystem } from './audio/AudioSystem'
import { ViewerConfig } from './config'
import { REGION_SIZE } from './constants'
import { ContentService } from './content'
import { ProbeCubeLoader } from './content/ProbeCubeLoader'
import {
  addCoreSystems,
  createViewerCamera,
  createViewerRenderer,
  registerViewerContent,
  ScreenshotQueue,
  viewerDeviceOptions,
} from './core'
import { CollisionSystem } from './game/collision/CollisionSystem'
import { CullingSystem } from './game/culling/CullingSystem'
import { DebugLayer, DebugShapeComponent } from './game/debug/DebugShapeComponent'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { RaycastSystem, type RaySelection } from './game/debug/RaycastSystem'
import { DistributionSystem } from './game/distribution/DistributionSystem'
import { InstancedRenderSystem } from './game/instancing/InstancedRenderSystem'
import type { DungeonMap } from './game/catacombs/load'
import { levelSpawnPosition } from './game/level/LevelComponent'
import { LevelSystem, type PreviewPart } from './game/level/LevelSystem'
import { SkyLightSystem } from './game/level/SkyLightSystem'
import { LightSystem } from './game/light/LightSystem'
import { EnvProbeDebugSystem } from './game/probes/EnvProbeDebugSystem'
import { EnvProbeSystem } from './game/probes/EnvProbeSystem'
import { ParticleSystem } from './game/particles'
import { OrbitFollowComponent } from './game/player/OrbitFollowComponent'
import { PlayerMovementComponent } from './game/player/PlayerMovementComponent'
import { DeferredDestroySystem } from './game/region/DeferredDestroySystem'
import { RegionSystem } from './game/region/RegionSystem'
import { RoadSystem } from './game/road/RoadSystem'
import { DecalSystem } from './game/decal/DecalSystem'
import { FogVolumeSystem } from './game/fog/FogVolumeSystem'
import { CharacterAnimationSystem } from './game/character/CharacterAnimationSystem'
import { PatrolSystem } from './game/patrol/PatrolSystem'
import { CharacterComponent } from './game/character/CharacterComponent'
import { SnowSystem } from './game/snow/SnowSystem'
import { RangeActivationSystem } from './game/slice/RangeActivationSystem'
import { MeshLoadState } from './game/slice/MeshLoaderComponent'
import { SliceSystem } from './game/slice/SliceSystem'
import { TerrainSystem } from './game/terrain/TerrainSystem'
import { VegetationSystem } from './game/vegetation/VegetationSystem'
import { type LuminancePass } from './graphics/passes/exposure/LuminancePass'
import { TexturePreview, type TexturePreviewOptions } from './graphics/passes/texture/TexturePreview'
import { TexturePreviewPass } from './graphics/passes/texture/TexturePreviewPass'
import { RenderSizeSystem } from './graphics/RenderSizeSystem'
import { InputSlots, MATERIAL_LAYER_FLAGS, MaterialLayerMasks } from './material'

export interface NwViewerOptions {
  /**
   * The canvas to render into. It must be in the document before {@link NwViewer.run}: its parent is
   * observed for the render size. The viewer styles the canvas to fill its parent (inline). The host sizes the parent
   * and lets it clip (`overflow: hidden`, positioned): a fixed render resolution may center the canvas larger than its
   * parent.
   */
  canvas: HTMLCanvasElement
  /**
   * The nwbt server: empty for the same origin (default), an url (e.g. `https://localhost:8443` for HTTP/2), or null
   * without a server. Without a server, levels and game files can't be loaded, see {@link ContentServiceOptions}.
   */
  nwbtUrl?: string | null
  /**
   * Whether the page url drives the engine: the game clock (`?clock`), the start position of the camera (`x`, `y`,
   * `z`, `w`) and the file name of screenshots. Default false, the viewer app turns it on.
   */
  urlState?: boolean
  /**
   * Whether the level audio plays (the audio system). Default true.
   */
  audio?: boolean
  /**
   * Whether the settings are saved to the localStorage, see {@link ViewerConfig}. Default true.
   */
  persistConfig?: boolean
}

export class NwViewer extends EcsGame {
  public static readonly onRaySelection = brand<EventType<GameEntity>>(Symbol('raySelection'))
  public static readonly onModeChanged = brand<EventType<NwViewer>>(Symbol('mode'))

  public camera: CameraComponent
  /**
   * What the engine shows. `texture` is a texture preview of the browser, see {@link NwViewer.showTexture}
   */
  public mode?: 'level' | 'model' | 'character' | 'material' | 'slice' | 'particles' | 'texture' = null

  public deviceStats: DeviceStats
  public schedulerStats: SchedulerStats
  public sceneStats: SceneStats
  public renderStats: RendererStats
  public scheduler: SchedulerSystem
  /**
   * Scene luminance of the eye adaptation, for debugging and scripts (`await nwViewer.luminance.read()`)
   */
  public luminance: LuminancePass | null = null
  public levelSelection: string

  public logTag = lfmt.badge('#4E79A7', 'NwViewer')

  public onRaySelection = this.events.channel(NwViewer.onRaySelection)
  /**
   * Emitted when a level, model or preview scene was opened, see {@link NwViewer.mode}
   */
  public onModeChanged = this.events.channel(NwViewer.onModeChanged)

  public selection: GameEntity

  public debug: number = 0

  private readonly options: NwViewerOptions

  public constructor(options: NwViewerOptions) {
    super(viewerDeviceOptions(options.canvas))
    this.options = options
  }

  /**
   * The runtime settings, see {@link ViewerConfig}
   */
  public get config(): ViewerConfig {
    return this.world.getSystem(ViewerConfig)
  }

  /**
   * The clocks. The game clock drives everything that animates: shaders (ElapsedTime), material updates, particles,
   * fog volume noise and the animated time of day. Scripts pin it for comparable shots:
   * `nwViewer.clock.setFixed(10)`, `nwViewer.clock.pause()`, `nwViewer.clock.resume()`, or the url `?clock=10`.
   * Camera movement, eye adaptation, POI blends, audio and loading budgets stay on the wall clock.
   */
  public get clock(): TimeSystem {
    return this.world.getSystem(TimeSystem)
  }

  protected override onCreate(): void {
    const config = new ViewerConfig({ persist: this.options.persistConfig })
    config.load()
    // config, clock (see `clock`), render size, space and content
    addCoreSystems(this, { config, nwbtUrl: this.options.nwbtUrl })
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(
      new MouseInputSystem({
        provider: new MouseListener({
          captureTarget: this.device.canvas as HTMLCanvasElement,
          eventTarget: this.device.canvas as HTMLCanvasElement,
        }),
      }),
    )
    this.world.addSystem(new TerrainSystem())
    this.world.addSystem(new RegionSystem())
    // destroys the content of unloaded regions over several frames
    this.world.addSystem(new DeferredDestroySystem())
    this.world.addSystem(new DistributionSystem())
    this.world.addSystem(new VegetationSystem())
    this.world.addSystem(new InstancedRenderSystem())
    this.world.addSystem(new SliceSystem())
    this.world.addSystem(new RoadSystem())
    this.world.addSystem(new DecalSystem())
    this.world.addSystem(new FogVolumeSystem())
    this.world.addSystem(new CharacterAnimationSystem())
    // after the animation: patrols read the root motion of this frame
    this.world.addSystem(new PatrolSystem())
    this.world.addSystem(new SnowSystem())
    this.world.addSystem(new CollisionSystem())
    this.world.addSystem(new CullingSystem())
    this.world.addSystem(new RangeActivationSystem())
    this.world.addSystem(new SkyLightSystem())
    this.world.addSystem(new LightSystem())
    this.world.addSystem(new ProbeCubeLoader())
    this.world.addSystem(new EnvProbeSystem())
    this.world.addSystem(new EnvProbeDebugSystem())
    this.world.addSystem(new LevelSystem())
    if (this.options.audio !== false) {
      this.world.addSystem(new AudioSystem())
    }
    this.world.addSystem(new ParticleSystem())
    this.world.addSystem(new DebugShapeSystem())
    this.world.addSystem(new RaycastSystem())
    this.world.addSystem(new SpatialSystem())
    // nearest first, the game builds by distance without the view direction
    this.world.addSystem(new SchedulerSystem({ viewAlignment: 0 }))
    const { renderer, luminance } = createViewerRenderer(this.device, config)
    this.luminance = luminance
    this.world.addSystem(renderer)
  }

  protected override onInitialize(): void {
    super.onInitialize()

    registerViewerContent(this.content)

    this.scheduler = this.world.getSystem(SchedulerSystem)

    this.camera = createViewerCamera(this, {
      far: 2 * REGION_SIZE,
      components: [
        new WASDComponent(),
        // after WASD, places its orbit center in third person mode
        new PlayerMovementComponent(),
        // before WASD (behavior order), keeps the orbit center on a previewed character
        new OrbitFollowComponent(),
      ],
    })
    // runtime inactive entities are hidden by default, the layer can be toggled in the camera UI. The flags are no
    // layers, an item with a hidden layer must not be visible because of them.
    this.camera.visibilityMask &= ~(MaterialLayerMasks.Inactive | MATERIAL_LAYER_FLAGS)

    this.selection = this.world.createEntity({
      name: 'Selection',
      parent: this.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new DebugShapeComponent({
          type: 'box',
          color: Color.DarkMagenta.toVec3(),
          layer: DebugLayer.Selection,
          instances: [],
        }),
      ],
    })

    const raycast = this.world.getSystem(RaycastSystem)
    raycast.camera = this.camera
    raycast.onSelect.add((selection) => {
      this.updateSelection(selection)
    })

    this.world.getSystem(LevelSystem).camera = this.camera
  }

  override onBeginRun() {
    this.world.initialize()
    // ?clock=<seconds> fixes the game clock from the start, for comparable shots of time dependent effects
    const clock = this.urlParams().get('clock')
    if (clock != null && Number.isFinite(Number(clock))) {
      this.clock.setFixed(Number(clock))
    }
    this.world.getSystem(ContentService).whenLoaded.then(() => {
      this.scene.entity.activate()
      // a preview (e.g. the browser opened first) keeps its start view, the level viewer places the camera when shown
      if (!this.previewing) {
        this.teleportFromUrl()
      }
    })
  }

  override onBeginUpdate(time: number, dt: number): void {
    super.onBeginUpdate(time, dt)
    // the main view, letterboxed for a fixed resolution + fit
    this.camera.aspect = this.world.getSystem(RenderSizeSystem).aspectRatio
    this.scheduler.updatePriorities(this.camera, time)
    this.world.getSystem(Renderer).inputs.set(InputSlots.Global.Debug, this.debug)
  }

  /**
   * The texture view: one pass, no scene. Created with the first texture preview.
   */
  private textureView: RenderView | null = null
  private texturePass: TexturePreviewPass | null = null

  /**
   * The texture preview shown instead of the scene, see {@link NwViewer.showTexture}
   */
  public get texturePreview(): TexturePreview | null {
    return this.texturePass?.preview ?? null
  }

  /**
   * Uploads a texture for {@link NwViewer.showTexture}. The caller owns it and disposes it.
   */
  public createTexturePreview(options: TexturePreviewOptions): TexturePreview {
    return new TexturePreview(this.device, options)
  }

  /**
   * Shows a texture preview instead of the scene, or the scene again with null.
   *
   * @remarks
   * The engine shows one content at a time: showing a texture unloads the level (or model). The viewer
   * opens it again from its url when it is shown again (see ViewerTool).
   */
  public showTexture(preview: TexturePreview | null) {
    if (!preview) {
      if (this.texturePass) {
        this.texturePass.preview = null
      }
      if (this.mode === 'texture') {
        this.mode = null
        this.onModeChanged.emit(this)
      }
      return
    }
    this.previewing = true
    this.previewKey = null
    if (this.mode !== 'texture') {
      this.world.getSystem(LevelSystem).clear()
      this.levelSelection = null
      this.mode = 'texture'
      this.onModeChanged.emit(this)
    }
    if (!this.texturePass) {
      const renderer = this.world.getSystem(Renderer)
      this.texturePass = new TexturePreviewPass(this.device)
      this.textureView = renderer.createView({
        name: 'Texture Preview',
        present: RenderChannel.Color,
        pipeline: new RenderPipeline({ name: 'Texture Preview', passes: [this.texturePass] }),
        // no scene: the camera only satisfies the renderer
        camera: this.camera,
      })
    }
    this.texturePass.preview = preview
  }

  /**
   * The engine shows content of the browser (a texture or a model preview), not what the viewer opened. The viewer
   * opens its level again from the url, see {@link NwViewer.endPreview}.
   */
  public previewing = false

  /**
   * What the scene preview of the browser shows: `model:<path>`, `material:<path>`, `particles:<library>|<effect>`
   * or `slice:<path>`, null for none (or a texture preview)
   */
  public previewKey: string | null = null

  /**
   * Shows content of the browser in the scene: the level (or other content) is unloaded first. Showing the same
   * content again keeps it and the camera as they are.
   */
  private showScenePreview(key: string, mode: NwViewer['mode'], load: () => void) {
    this.showTexture(null)
    if (this.previewing && this.previewKey === key) {
      return
    }
    this.previewing = true
    this.previewKey = key
    this.levelSelection = null
    load()
    this.mode = mode
    this.onModeChanged.emit(this)
  }

  /**
   * Shows a model (`.cgf`, `.skin`) of the browser, the camera orbits it
   */
  public showModel(path: string) {
    this.showScenePreview(`model:${path}`, 'model', () => this.loadModel(path))
  }

  /**
   * Allows the third person mode (key `T`), only while the level viewer shows the engine. Off leaves third person:
   * the other tools show their previews with the same camera, and the viewer comes back in free mode.
   */
  public setThirdPersonAvailable(available: boolean) {
    this.camera.entity.component(PlayerMovementComponent).thirdPersonAvailable = available
  }

  /**
   * Shows a character (`.cdf`) of the browser: its skins and cloth with their materials, the camera orbits it
   */
  public showCharacter(path: string) {
    this.showScenePreview(`character:${path}`, 'character', () => {
      this.world
        .getSystem(LevelSystem)
        .loadCharacter(path)
        .catch((err) => {
          // cancelled by another preview, or the .cdf did not load
          if (err?.name !== 'AbortError') {
            console.error('character not loaded:', path, String(err))
          }
        })
    })
  }

  /**
   * Shows models of the Data tool (an appearance row, a mount): `.cgf`, `.skin` and `.cdf` parts with optional
   * material params, the camera orbits them. `key` names the content: the same key again keeps it and the camera.
   *
   * @param materialParams - replace the public params of the parts' materials (the blend masks of an appearance)
   */
  public showParts(key: string, parts: PreviewPart[], materialParams?: Record<string, string | number> | null) {
    this.showScenePreview(`parts:${key}`, 'character', () => {
      this.world
        .getSystem(LevelSystem)
        .loadParts(key, parts, materialParams)
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            console.error('preview not loaded:', key, String(err))
          }
        })
    })
  }

  /**
   * The parts shown by {@link NwViewer.showCharacter} or {@link NwViewer.showParts}: attachment name, mesh, material,
   * load state. `hidden`: an attachment the game hides by default, `visible`: whether the part is drawn (hidden
   * attachments start invisible, see {@link setPreviewPartVisible}).
   */
  public previewCharacterParts(): Array<{
    name: string
    mesh: string
    material: string
    state: 'loading' | 'loaded' | 'failed'
    hidden: boolean
    visible: boolean
  }> {
    if (!this.previewKey?.startsWith('character:') && !this.previewKey?.startsWith('parts:')) {
      return []
    }
    return this.world.getSystem(LevelSystem).characterParts.map((part) => ({
      name: part.name,
      mesh: part.mesh,
      material: part.material,
      state: loadStateName(part.loader.state),
      hidden: part.hidden,
      visible: part.loader.visible,
    }))
  }

  /**
   * Draws or hides a part of {@link previewCharacterParts} by its index. It stays loaded either way.
   */
  public setPreviewPartVisible(index: number, visible: boolean) {
    const part = this.world.getSystem(LevelSystem).characterParts[index]
    if (part) {
      part.loader.visible = visible
    }
  }

  /**
   * The animated character of {@link NwViewer.showCharacter} or {@link NwViewer.showParts} (the first `.cdf`), null
   * for none. Its animations can be played by name (CharacterComponent.play).
   */
  public previewCharacter(): CharacterComponent | null {
    if (!this.previewKey?.startsWith('character:') && !this.previewKey?.startsWith('parts:')) {
      return null
    }
    return this.world.getSystem(LevelSystem).previewCharacter
  }

  /**
   * Draws the joints and bones of the preview character
   */
  public showPreviewSkeleton(show: boolean) {
    const character = this.previewCharacter()
    if (character) {
      character.showSkeleton = show
    }
    if (show) {
      this.world.getSystem(DebugShapeSystem, { optional: true })?.setLayerEnabled(DebugLayer.Skeleton, true)
    }
  }

  /**
   * Draws the melee hit shapes of the preview character's playing fragment
   */
  public showPreviewHitboxes(show: boolean) {
    const character = this.previewCharacter()
    if (character) {
      character.showHitboxes = show
    }
    if (show) {
      this.world.getSystem(DebugShapeSystem, { optional: true })?.setLayerEnabled(DebugLayer.Hitboxes, true)
    }
  }

  /**
   * Whether the preview character's playing fragment has hit shapes to draw
   */
  public get previewHasHitboxes(): boolean {
    return !!this.previewCharacter()?.hasHitboxes
  }

  /**
   * Keeps the orbit camera on the preview character's body (its hips) until the user moves the camera, or stops
   */
  public followPreviewCharacter(follow: boolean) {
    const component = this.camera.entity.component(OrbitFollowComponent)
    component.follow(follow ? this.previewCharacter() : null)
  }

  /**
   * Whether the orbit camera follows the preview character, see {@link followPreviewCharacter}
   */
  public get followingPreviewCharacter(): boolean {
    return this.camera.entity.component(OrbitFollowComponent).following
  }

  /**
   * Shows the sub materials of a `.mtl` of the browser on a cylinder, a box and a sphere each
   */
  public showMaterial(path: string) {
    this.showScenePreview(`material:${path}`, 'material', () => this.loadMaterial(path))
  }

  /**
   * The sub materials shown by {@link NwViewer.showMaterial}, in the order of their shader balls. Empty while loading.
   */
  public previewMaterialNames(): string[] {
    return this.previewKey?.startsWith('material:') ? this.world.getSystem(LevelSystem).materialNames : []
  }

  /**
   * Points the orbit camera at the shader ball of a sub material, null frames all of them
   */
  public framePreviewMaterial(index: number | null) {
    this.world.getSystem(LevelSystem).frameMaterial(index)
  }

  /**
   * Shows one particle effect of a library of the browser
   */
  public showParticleEffect(library: string, effect: string) {
    this.showScenePreview(`particles:${library}|${effect}`, 'particles', () =>
      this.world.getSystem(LevelSystem).loadParticleEffect(library, effect),
    )
  }

  /**
   * Shows a slice of the browser at the origin: `slices` holds the slice (`root`) and every slice it spawns
   */
  public showSlice(path: string, root: string, slices: Record<string, ViewerSlice>) {
    this.showScenePreview(`slice:${path}`, 'slice', () =>
      this.world.getSystem(LevelSystem).loadSlicePreview(root, slices, path.split('/').pop() ?? path),
    )
  }

  /**
   * The particle effect shown by {@link NwViewer.showParticleEffect}: emitters and live particles, null if none
   */
  public particlePreviewStats(): { state: string; emitters: number; particles: number } | null {
    const particles = this.world.getSystem(LevelSystem).particlePreview()
    return particles
      ? { state: particles.state, emitters: particles.emitterCount, particles: particles.particleCount }
      : null
  }

  /**
   * Ends the preview of the browser: the engine shows the scene again, empty until the viewer opens its content
   */
  public endPreview() {
    this.releaseGltfObjectUrl()
    this.showTexture(null)
    this.previewing = false
    this.previewKey = null
    this.world.getSystem(LevelSystem).clear()
    this.camera.entity.component(WASDComponent).orbitMode = false
    this.mode = null
  }

  /**
   * The levels of detail of the shown model: the highest one that may exist (0 without levels) and the one rendered
   * (of the first instance)
   */
  public previewModelLod(): { maxLevel: number; rendered: number; forced: number | null } {
    const models = this.world.getSystem(LevelSystem).modelComponents()
    const first = models.find((it) => it.model?.lod) ?? models[0]
    return {
      maxLevel: first?.model?.lod?.maxLevel ?? 0,
      rendered: first?.lodRendered ?? 0,
      forced: first?.model?.lod?.forcedLevel ?? null,
    }
  }

  /**
   * Shows a level of detail of the shown model regardless of the distance, null selects by distance again
   */
  public forcePreviewModelLod(level: number | null) {
    for (const it of this.world.getSystem(LevelSystem).modelComponents()) {
      if (it.model?.lod) {
        it.model.lod.forcedLevel = level
      }
    }
  }

  /**
   * Points the orbit camera at the shown model (or the models of a shown slice) again
   *
   * @returns whether there was a model to frame
   */
  public framePreviewModel(): boolean {
    return this.world.getSystem(LevelSystem).frameModel()
  }

  /**
   * The scene, or the texture view while a texture preview is shown
   */
  protected override onDraw(time: number, dt: number): void {
    if (!this.texturePass?.preview) {
      super.onDraw(time, dt)
      return
    }
    this.world.render(time, dt)
    const renderer = this.world.getSystem(Renderer)
    renderer.update(this.renderClock?.total ?? time, this.renderClock?.delta ?? dt)
    renderer.renderView(this.textureView)
  }

  override onEndDraw(time: number, dt: number): void {
    if (this.texturePass?.preview) {
      this.world.getSystem(Renderer).present([this.textureView])
    } else {
      super.onEndDraw(time, dt)
    }
    this.deviceStats = this.device.stats(this.deviceStats)
    this.schedulerStats = this.scheduler.instance.getStats(this.schedulerStats)
    this.sceneStats = this.scene.stats(this.sceneStats)
    this.renderStats = this.world.getSystem(Renderer).stats(this.renderStats)
    // opaque image, the output may contain transparent pixels
    this.screenshots.flush(this.device.canvas, '#000')
  }

  private screenshots = new ScreenshotQueue()

  /**
   * Captures the next rendered frame as PNG: the canvas, so the upscaled image at the output resolution (or the
   * render resolution for a fixed resolution + `none`)
   *
   * @remarks
   * A WebGPU canvas can only be read in the task that renders the frame, so the capture runs after the next draw.
   */
  public captureScreenshot(): Promise<Blob | null> {
    return this.screenshots.request()
  }

  /**
   * Captures the next rendered frame and downloads it as PNG
   */
  public async downloadScreenshot() {
    const image = await this.captureScreenshot()
    if (!image) {
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(image)
    link.download = screenshotFileName(this.urlParams(), this.device.canvas.width, this.device.canvas.height)
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  /**
   * Destroys the engine for good: the systems (with their workers) and the GPU device. The canvas stays with the
   * caller. Use {@link suspend} to pause instead.
   */
  public dispose() {
    this.releaseGltfObjectUrl()
    this.destroy()
    this.device.dispose()
  }

  /**
   * Stops rendering, updates and sound, e.g. while no tool shows the canvas. {@link NwViewer.resume}
   * continues, the clocks skip the time in between.
   */
  public suspend() {
    this.stop()
    this.world.getSystem(AudioSystem, { optional: true })?.suspend()
  }

  /**
   * Continues after {@link NwViewer.suspend}. Only call it once the engine runs ({@link NwViewer.run}
   * resolved), before that the boot starts the loop.
   */
  public resume() {
    this.world.getSystem(GameLoop).run()
    this.world.getSystem(AudioSystem, { optional: true })?.resume()
  }

  /**
   * Moves the canvas into a container, the render size follows that container from then on
   */
  public placeCanvas(container: HTMLElement) {
    const canvas = this.device.canvas as HTMLCanvasElement
    if (canvas.parentElement !== container) {
      container.prepend(canvas)
    }
    this.world.getSystem(RenderSizeSystem, { optional: true })?.observeContainer()
  }

  private updateSelection(selection: RaySelection) {
    const shape = this.selection.component(DebugShapeComponent).entries[0]
    if (!selection) {
      shape.transforms.length = 0
      return
    }

    const boxScale = vec3Subtract(selection.box.max, selection.box.min)
    const boxCenter = vec3MultiplyScalar(vec3Add(selection.box.min, selection.box.max), 0.5)
    const boxTransform = mat4CreateFromRTS(vec4(0, 0, 0, 1), boxCenter, boxScale)
    const nodeTransform = selection.node.world

    shape.transforms[0] ||= mat4()
    mat4$initScaleUniform(shape.transforms[0], 1.001)
    mat4$premultiply(shape.transforms[0], boxTransform)
    mat4$premultiply(shape.transforms[0], nodeTransform)
    shape.transforms.length = 1

    console.log(...this.logTag, 'Selected entity', selection)
    this.onRaySelection.emit(selection.entity)
  }

  /**
   * Opens a level: the coatlicue `name`, with the mission of the level folder `options.mission` when it differs from
   * the coatlicue (main menus). With `levelCamera`, the camera starts at the level's own camera placement once the
   * level info is loaded (see {@link findLevelCamera}), e.g. when the url names no position. `seed`: the generated
   * dungeon of a dungeon level (the catacombs).
   */
  public async loadLevel(
    name: string,
    options?: { mission?: string | null; levelCamera?: boolean; seed?: number | null },
  ) {
    this.mode = 'level'
    this.levelSelection = name
    await this.world.getSystem(ContentService).whenLoaded
    const level = this.world.getSystem(LevelSystem)
    const loading = level.loadLevel(name, options?.mission, options?.seed)
    this.onModeChanged.emit(this)
    if (!options?.levelCamera) {
      return
    }
    try {
      await loading
    } catch {
      // cancelled by another load, or failed: nothing to place
      return
    }
    if (level.levelInfo?.name === name) {
      this.placeLevelCamera()
    }
  }

  /**
   * Moves the camera to the camera placement of the loaded level (see {@link findLevelCamera}), else to the spawn
   * position of its game mode, if it has one
   */
  public placeLevelCamera() {
    const info = this.world.getSystem(LevelSystem).levelInfo
    const camera = info ? findLevelCamera(info) : null
    if (camera) {
      this.placeCamera(camera)
      return
    }
    // levels without a camera placement: the spawn position of the game mode (e.g. the start room of the catacombs)
    const spawn = info ? levelSpawnPosition(info) : null
    if (spawn) {
      this.teleport(spawn.x, spawn.y, spawn.z + SPAWN_EYE_HEIGHT)
    }
  }

  /**
   * Moves the camera to a camera placement of a level, looking where the placement looks
   */
  public placeCamera(world: Mat4) {
    const space = this.world.getSystem(SpaceBasis)
    const position = mat4GetTranslation(world, vec3())
    const look = vec3Normalize(vec3ApplyMat4Rotation(space.forward, world, vec3()))
    // the inverse of WASDComponent.setRotation: rotation about up by the heading, then about right by the pitch
    const pitch = Math.asin(Math.max(-1, Math.min(1, vec3Dot(look, space.up))))
    const heading = Math.atan2(-vec3Dot(look, space.right), vec3Dot(look, space.forward))
    this.teleport(position.x, position.y, position.z, heading)
    this.camera.entity.component(WASDComponent).setRotation(heading, pitch)
    this.cameraPlaced = true
  }

  public teleport(x: number, y: number, z: number, rot: number = 0) {
    this.camera.entity
      .component(TransformComponent)
      .setPosition(x, y, z)
      .setRotationAxisAngle(0, 0, 1, rot)
      .updateIfNeeded()
    this.camera.entity.component(WASDComponent).setRotation(rot || 0, 0)
    this.camera.entity.component(PlayerMovementComponent).teleport()
    this.camera.updateBehavior()
  }

  /**
   * The info of the loaded level, null while no level is shown
   */
  public get levelInfo(): LevelInfo | null {
    if (this.mode !== 'level') {
      return null
    }
    return this.world.getSystem(LevelSystem).levelInfo
  }

  /**
   * The generated dungeon of the loaded level (the catacombs), null for other levels or while it loads
   */
  public get dungeonMap(): DungeonMap | null {
    if (this.mode !== 'level') {
      return null
    }
    return this.world.getSystem(LevelSystem).dungeonMap
  }

  /**
   * The camera position in world space, its heading in radians, and the world direction it looks along
   */
  public cameraLocation() {
    const t = mat4GetTranslation(this.camera.world, vec3.$0)
    const space = this.world.getSystem(SpaceBasis)
    const look = vec3ApplyMat4Rotation(space.forward, this.camera.world, vec3.$1)
    return {
      x: t.x,
      y: t.y,
      z: t.z,
      heading: this.camera.entity.component(WASDComponent).getRotationHorizontal(),
      look: { x: look.x, y: look.y, z: look.z },
    }
  }

  /**
   * The parameters of the page url, empty without {@link NwViewerOptions.urlState}
   */
  private urlParams(): URLSearchParams {
    return this.options.urlState ? new URLSearchParams(location.search) : new URLSearchParams()
  }

  /**
   * Moves the camera to the position of the url parameters `x`, `y`, `z` and the heading `w` (degrees), the default
   * position without {@link NwViewerOptions.urlState}
   */
  public teleportFromUrl() {
    const params = this.urlParams()
    this.teleport(
      Number(params.get('x') ?? 1024) || 0,
      Number(params.get('y') ?? 1024) || 0,
      Number(params.get('z') ?? 256) || 0,
      (Number(params.get('w') ?? 0) || 0) * DEGREE_TO_RAD,
    )
    this.cameraPlaced = true
  }

  /**
   * Whether the camera was placed from the url parameters, before that its position is the default
   */
  private cameraPlaced = false

  /**
   * Writes the camera position (`x`, `y`, `z`) and heading (`w`, degrees) into url parameters,
   * the inverse of the parameters read at start. Returns false, and writes nothing, until the camera
   * was placed from the url.
   */
  public writeCameraParams(params: URLSearchParams): boolean {
    if (!this.cameraPlaced) {
      return false
    }
    const camera = this.camera
    const t = mat4GetTranslation(camera.world, vec3.$0)
    const r = camera.entity.component(WASDComponent).getRotationHorizontal()
    params.set('x', t.x.toFixed(1))
    params.set('y', t.y.toFixed(1))
    params.set('z', t.z.toFixed(1))
    params.set('w', (r * RAD_TO_DEGREE).toFixed(1))
    return true
  }

  /**
   * Shows a model at the origin, with the sky, the grid and the orbit camera
   *
   * @param model - game file path of a `.cgf` / `.skin`, or the path or url of a glTF file (`.glb`, `.gltf`)
   * @param material - path of an `.mtl` file that replaces the material of a `.cgf`
   * @param transform - world matrix (16 numbers). glTF files are Y-up, they are placed Z-up by default.
   */
  public loadModel(model: string, material?: string, transform?: number[]) {
    if (model !== this.gltfObjectUrl) {
      this.releaseGltfObjectUrl()
    }
    this.mode = 'model'
    // from the level only: between previews the orbit angle stays, the framing is the one camera movement. Before the
    // load, which turns the camera to the start view (teleport resets the angles).
    if (!this.camera.entity.component(WASDComponent).orbitMode) {
      this.teleport(0, 0, 0)
    }
    this.world.getSystem(LevelSystem).loadModel(model, material, transform ?? this.gltfTransform(model))
    this.onModeChanged.emit(this)
  }

  /**
   * Shows a glTF file at the origin, like {@link loadModel}
   *
   * @param source - url of a `.glb` / `.gltf` file, or its data (e.g. a dropped file, a `.gltf` must not reference
   *   other files then)
   * @param options.type - the file type of data, `.glb` by default
   * @param options.upAxis - the up axis of the file. glTF files are Y-up (default). The nwbt exports keep the game's
   *   Z-up unless they are converted with `?yup`.
   */
  public showGltf(source: string | Blob | ArrayBuffer, options: { type?: '.glb' | '.gltf'; upAxis?: 'y' | 'z' } = {}) {
    this.releaseGltfObjectUrl()
    let url = source as string
    if (typeof source !== 'string') {
      url = this.world.getSystem(ContentService).createObjectUrl(source, options.type)
      this.gltfObjectUrl = url
    }
    const transform = options.upAxis === 'z' ? Array.from(mat4Identity()) : undefined
    this.loadModel(url, undefined, transform)
  }

  /**
   * The object url of the glTF data shown by {@link showGltf}, revoked when other content is shown
   */
  private gltfObjectUrl: string | null = null

  private releaseGltfObjectUrl() {
    if (this.gltfObjectUrl) {
      this.world.getSystem(ContentService).revokeObjectUrl(this.gltfObjectUrl)
      this.gltfObjectUrl = null
    }
  }

  /**
   * World matrix of a glTF file: glTF is Y-up, the viewer's world is Z-up. Undefined for other models.
   */
  private gltfTransform(model: string): number[] | undefined {
    const type = this.world.getSystem(ContentService).modelType(model)
    if (type !== '.glb' && type !== '.gltf') {
      return undefined
    }
    // the glTF space is the view space convention (Y-up), see SpaceBasis.fromViewSpace
    return Array.from(this.world.getSystem(SpaceBasis).fromViewSpace)
  }

  public loadMaterial(asset: string) {
    this.mode = 'material'
    // from the level only: between previews the orbit angle stays, the framing is the one camera movement. Before the
    // load, which turns the camera to the start view (teleport resets the angles).
    if (!this.camera.entity.component(WASDComponent).orbitMode) {
      this.teleport(0, 0, 0)
    }
    this.world.getSystem(LevelSystem).loadMaterial(asset)
    this.onModeChanged.emit(this)
  }
}

/**
 * File name of a screenshot: level, position, size and time, e.g. `nw-viewer_newworld_vitaeeterna_5500_600_1920x1080_2026-10-11T12-00-00.png`
 */
/**
 * Mission cameras by role, the first found starts the view: the main menu's establishing shot, the menu camera of
 * older menus, the vista of FTUE levels. Else the first camera of the mission.
 */
const LEVEL_CAMERA_NAMES = ['EstablishingCameraPlacement', 'MainCamera', 'VistaCamera']

/**
 * Camera height above a spawn position, about the eyes of a player
 */
const SPAWN_EYE_HEIGHT = 1.8

/**
 * The camera a level starts with (see {@link LEVEL_CAMERA_NAMES}). Null without one. Returns the world matrix.
 */
function loadStateName(state: MeshLoadState): 'loading' | 'loaded' | 'failed' {
  if (state === MeshLoadState.loaded) {
    return 'loaded'
  }
  if (state === MeshLoadState.failed) {
    return 'failed'
  }
  return 'loading'
}

export function findLevelCamera(info: LevelInfo): Mat4 | null {
  const cameras = (info.missionEntities ?? []).filter((it) => it.components?.some(isViewerCameraComponent))
  const named = LEVEL_CAMERA_NAMES.map((name) => cameras.find((it) => it.name === name)).find((it) => !!it)
  const camera = named ?? cameras[0]
  return camera?.transform ? mat4CreateFromArray(camera.transform) : null
}

function screenshotFileName(params: URLSearchParams, width: number, height: number) {
  const parts = ['nw-viewer']
  if (params.get('level')) {
    parts.push(params.get('level'))
  }
  if (params.get('x') && params.get('y')) {
    parts.push(String(Math.round(Number(params.get('x')))), String(Math.round(Number(params.get('y')))))
  }
  parts.push(`${width}x${height}`, new Date().toISOString().slice(0, 19).replace(/:/g, '-'))
  return parts.join('_') + '.png'
}
