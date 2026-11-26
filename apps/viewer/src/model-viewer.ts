import {
  BoundsComponent,
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  MeshComponent,
  ModelComponent,
  MouseInputSystem,
  OccTree,
  SchedulerSystem,
  SpatialComponent,
  TimeSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { GetComponent, type GameEntity } from '@gglib/ecs'
import { KeyboardListener, MouseListener } from '@gglib/game'
import {
  BoundingBox,
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4Copy,
  mat4CreateFromQuat,
  mat4Identity,
  mat4Multiply,
  SpaceBasis,
  vec3,
  vec3Copy,
  type IVec4,
  type Mat4,
  type Transform,
} from '@gglib/math'
import type { Model, NodeData } from '@gglib/model'
import { Renderer, type RenderPass } from '@gglib/render'
import { ViewerConfig } from './config'
import { ContentService } from './content'
import { DEFAULT_PROBE_CUBE_RGB9E5, ProbeCubeLoader } from './content/ProbeCubeLoader'
import {
  addCoreSystems,
  createViewerCamera,
  createViewerRenderer,
  getViewerExposure,
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
import { DebugLayer, DebugShapeComponent } from './game/debug/DebugShapeComponent'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { HitShapes } from './game/character/mannequin/HitShapes'
import { gltfHitShapeJoints } from './game/gltf/mannequin/hitShapeJoints'
import { GltfAnimationComponent } from './game/gltf/GltfAnimationComponent'
import { collectFragmentActions } from './game/gltf/mannequin/actions'
import { readAnimationList } from './game/gltf/mannequin/animationList'
import { loadAdbFiles } from './game/gltf/mannequin/database'
import { GltfMannequin } from './game/gltf/mannequin/GltfMannequin'
import { GltfMannequinComponent } from './game/gltf/mannequin/GltfMannequinComponent'
import { GltfAnimationSystem } from './game/gltf/GltfAnimationSystem'
import { GltfSockets, GltfSocketsComponent, type GltfAttachment, type GltfSocketOffset } from './game/gltf/GltfSockets'
import { SkyLightSystem } from './game/level/SkyLightSystem'
import { createSkySphere, updateSkySphere } from './game/level/SkySphere'
import { LightComponent } from './game/light/LightComponent'
import { LightSystem } from './game/light/LightSystem'
import { getModelLights } from './game/light/modelLights'
import { EnvProbeSystem } from './game/probes/EnvProbeSystem'
import { MeshLoaderComponent } from './game/slice/MeshLoaderComponent'
import type { FilmMappingPass } from './graphics/passes/filmmapping/FilmMappingPass'
import { RenderSizeSystem } from './graphics/RenderSizeSystem'
import type { SkyMaterial } from './material'
import {
  isParamsMaterial,
  type appearanceParams,
  type dyedAppearanceParams,
  type MaterialParams,
  type ParamsMaterial,
} from './material/appearance'
export interface ModelViewerOptions {
  /**
   * The canvas to render into. It must be in the document before {@link ModelViewer.run}: its parent is observed for
   * the render size. The host sizes the parent.
   */
  canvas: HTMLCanvasElement
}

export interface ModelShowOptions {
  /**
   * The up axis of the file: glTF files are Y-up (default), the nwbt exports without `?yup` keep the game's Z-up
   */
  upAxis?: 'y' | 'z'
  /**
   * The url that the buffer and image uris of the file resolve against, e.g. `https://cdn.nw-buddy.de/models/` for the
   * CDN models. Default: the folder of the file.
   */
  rootUrl?: string
  /**
   * Rotation of the model in the viewer's world (Z-up), a quaternion. Applied after the up axis.
   */
  rotation?: IVec4 | null
  /**
   * The opening angles of the orbit camera, default: the front, a bit from above
   */
  camera?: ModelCamera | null
  /**
   * Public params for the model's materials, e.g. the mask colors of an appearance row ({@link appearanceParams},
   * {@link dyedAppearanceParams}). Change them later with {@link ModelViewer.setMaterialParams}.
   */
  materialParams?: MaterialParams | null
  /**
   * The character's animation database and default tags (e.g. a vital model's `adb` and `tags`): its fragments become
   * playable through {@link ModelViewer.mannequin}. The model must be an nwbt character export with
   * `extras.animationList`; the database (a game path) and the clip files resolve against {@link rootUrl}.
   */
  mannequin?: ModelMannequinOptions | null
}

/**
 * The opening angles of the orbit camera, in radians
 */
export interface ModelCamera {
  /**
   * Orbit angle around the model: 0 looks along -Y, at the model's +Y side. Positive shows that side turned to the left
   */
  heading: number
  /**
   * Positive looks up at the model, negative down
   */
  pitch: number
}

export interface ModelMannequinOptions {
  /**
   * Game path of the `.adb`, e.g. `animations/mannequin/adb/npc_alligator_anims.adb`
   */
  database: string
  /**
   * The tags the character plays its fragments with, e.g. `['Alligator']`
   */
  tags?: string[]
}

/**
 * Shows one model (a glTF file) with the viewer's renderer: the time of day light, the default environment probe and
 * an orbit camera (drag to rotate, wheel to zoom). The background is transparent (the page shows through), or the sky
 * with {@link sky}. The exposure is fixed, see {@link exposure}.
 *
 * @remarks
 * Driven by the host: nothing loads, frames or moves the camera until the host calls it. No url state, no persisted
 * settings, no levels, no audio.
 *
 * ```ts
 * const viewer = new ModelViewer({ canvas })
 * await viewer.run()
 * await viewer.show(url)
 * viewer.frame()
 * ```
 */
export class ModelViewer extends EcsGame {
  /**
   * The orbit camera of the main view
   */
  public camera: CameraComponent

  /**
   * The content of {@link show}: the model below its root, null when nothing is shown
   */
  private root: GameEntity | null = null
  private model: GameEntity | null = null
  /**
   * The sky sphere while {@link sky} is on and the viewer is initialized
   */
  private skyEntity: GameEntity | null = null
  private skyEnabled = false
  /**
   * The animation of the shown model, null without one
   */
  private animation: GltfAnimationComponent | null = null
  /**
   * The fragments of the shown character, see {@link mannequin}
   */
  private shownMannequin: GltfMannequin | null = null
  private mannequinComponent: GltfMannequinComponent | null = null
  private hitboxesEnabled = false
  /**
   * The models on the sockets of the shown model, see {@link setSocket}
   */
  private readonly socketModels = new GltfSockets((it) => this.loadAttachment(it))
  private filmMapping: FilmMappingPass | null = null
  private shownOutput: ViewerOutput = 'final'
  private passes: RenderPass[] | null = null
  /**
   * The url of {@link show}, its base url is registered while it is shown
   */
  private shownUrl: string | null = null
  /**
   * The material params of the shown model, see {@link setMaterialParams}
   */
  private materialParams: MaterialParams = {}
  /**
   * Rejects the pending {@link show} when other content replaces it
   */
  private cancelShow: (() => void) | null = null
  private screenshots = new ScreenshotQueue()

  /**
   * Whether this browser can run the viewer (WebGPU and the limits it needs). Check before creating one, the host
   * shows a message otherwise.
   */
  public static isSupported(): Promise<boolean> {
    return isViewerSupported()
  }

  public constructor(options: ModelViewerOptions) {
    super(viewerDeviceOptions(options.canvas))
  }

  /**
   * The runtime settings, see {@link ViewerConfig}. Not persisted.
   */
  public get config(): ViewerConfig {
    return this.world.getSystem(ViewerConfig)
  }

  /**
   * The clocks, see {@link NwViewer.clock}
   */
  public get clock(): TimeSystem {
    return this.world.getSystem(TimeSystem)
  }

  /**
   * The orbit movement of the camera: center, distance and angles
   */
  public get orbit(): WASDComponent {
    return this.camera.entity.component(WASDComponent)
  }

  /**
   * Draws the sky behind the model, exposed by the game's eye adaptation. Off (default), the background is
   * transparent and the page shows through the canvas.
   */
  public get sky(): boolean {
    return this.skyEnabled
  }
  public set sky(value: boolean) {
    this.skyEnabled = value
    // before the device is ready, onInitialize creates it
    if (this.camera) {
      this.updateSkyEntity()
    }
  }

  /**
   * The exposure of the tone mapping, fixed by default: the HDR color is multiplied by it. A single model does not
   * adapt to the scene luminance, the background would change the brightness of the model. `auto` adapts like the
   * game, for scenes.
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

  protected override onCreate(): void {
    const config = new ViewerConfig({ persist: false })
    config.set('exposure', 'fixed')
    config.set('fixedExposure', MODEL_VIEWER_EXPOSURE)
    // models have no water, snow or clouds, their engine textures are BC (no BC on mobile)
    addCoreSystems(this, { config, nwbtUrl: null, environmentTextures: false })
    const canvas = this.device.canvas as HTMLCanvasElement
    // keys only while the canvas has the focus: the page's other inputs keep theirs
    this.world.addSystem(new KeyboardInputSystem({ provider: new KeyboardListener({ eventTarget: canvas }) }))
    this.world.addSystem(
      new MouseInputSystem({
        provider: new MouseListener({
          captureTarget: canvas,
          eventTarget: canvas,
        }),
      }),
    )
    this.world.addSystem(new CharacterAnimationSystem())
    this.world.addSystem(new GltfAnimationSystem())
    this.world.addSystem(new SkyLightSystem())
    this.world.addSystem(new LightSystem())
    // the default cube only, as RGB9E5 (no BC on mobile)
    this.world.addSystem(
      new ProbeCubeLoader({
        atlas: { format: 'rgb9e5ufloat', slots: 1 },
        defaultCube: DEFAULT_PROBE_CUBE_RGB9E5,
      }),
    )
    this.world.addSystem(new EnvProbeSystem())
    this.world.addSystem(new SchedulerSystem({ viewAlignment: 0 }))
    const debugShapes = new DebugShapeSystem()
    debugShapes.activeLayers = DebugLayer.Hitboxes
    this.world.addSystem(debugShapes)
    // pixels without the model stay transparent when the sky is off
    const { renderer, passes, filmMapping } = createViewerRenderer(this.device, config, { transparentBackground: true })
    this.filmMapping = filmMapping
    this.passes = passes
    this.world.addSystem(renderer)
    this.applyOutput()
  }

  protected override onInitialize(): void {
    super.onInitialize()
    registerViewerContent(this.content)
    this.camera = createViewerCamera(this, {
      far: MODEL_VIEWER_FAR,
      components: [new WASDComponent()],
    })
    const orbit = this.orbit
    orbit.orbitMode = true
    orbit.radiusMin = 0.05
    orbit.radiusMax = MODEL_VIEWER_FAR / 4
    orbit.targetRadius = 3
    this.updateSkyEntity()
  }

  private updateSkyEntity() {
    if (this.filmMapping) {
      this.filmMapping.premultiplyAlpha = !this.skyEnabled
      this.filmMapping.backgroundAdaptedExposure = this.skyEnabled
    }
    if (this.skyEnabled && !this.skyEntity) {
      this.skyEntity = this.createEntity(createSkySphere(this.scene.entity, this.device))
      // the sky stays background: the film mapping exposes it with the adapted luminance
      const material = this.skyEntity.component(MeshComponent).mesh.materials[0] as SkyMaterial
      material.OutputAlpha = 0
    }
    if (!this.skyEnabled && this.skyEntity) {
      this.skyEntity.destroy()
      this.skyEntity.setParent(null)
      this.skyEntity = null
    }
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
    updateSkySphere(this.skyEntity, this.world.getSystem(SkyLightSystem))
  }

  protected override onEndDraw(time: number, dt: number): void {
    super.onEndDraw(time, dt)
    this.screenshots.flush(this.device.canvas, null)
  }

  /**
   * Shows a model in place of the current one, at the origin. Resolves once it is loaded (its bounds are known, see
   * {@link frame}), rejects when it failed, or with an `AbortError` when other content replaced it first.
   *
   * @param url - url of a `.glb` / `.gltf` file
   */
  public async show(url: string, options: ModelShowOptions = {}): Promise<void> {
    this.clear()
    let cancelled = false
    this.cancelShow = () => (cancelled = true)
    await this.ready
    await this.world.getSystem(ContentService).whenLoaded
    if (cancelled) {
      throw abortError()
    }

    // an orbit heading of 180° looks along -Y
    const { heading, pitch } = options.camera ?? DEFAULT_CAMERA
    this.orbit.setRotation(Math.PI + heading, pitch)
    this.shownUrl = url
    this.materialParams = { ...options.materialParams }
    this.world.getSystem(ContentService).setGltfBaseUrl(url, options.rootUrl ?? null)
    const root = this.createEntity({
      name: 'Model Viewer',
      parent: this.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-2048, -2048, -2048),
            max: vec3(2048, 2048, 2048),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
      ],
    })
    this.root = root
    const loader = new MeshLoaderComponent(
      {
        type: 'Mesh',
        mesh: url,
        alwaysRender: true,
      },
      // own material instances (params, even empty), so setMaterialParams changes only this model
      { materialParams: { ...this.materialParams } },
    )
    // per draw instance data, the skin offset of glTF animations
    loader.skinned = true
    const model = this.createEntity({
      name: url,
      parent: root,
      transform: new TransformComponent({
        keepWorld: true,
        world: this.modelTransform(options),
      }),
      components: [loader],
    })
    this.model = model

    return new Promise<void>((resolve, reject) => {
      this.cancelShow = () => reject(abortError())
      model.events.on(MeshLoaderComponent.onLoad, async () => {
        // params set while loading
        this.applyMaterialParams()
        try {
          if (options.mannequin) {
            await this.attachMannequin(model, loader, options.mannequin, options.rootUrl ?? baseFolder(url))
          } else {
            this.attachAnimation(model, loader)
          }
        } catch (error) {
          if (this.model === model) {
            this.cancelShow = null
          }
          reject(error)
          return
        }
        if (this.model !== model) {
          reject(abortError())
          return
        }
        this.attachLights(model)
        this.attachSockets(model)
        // the bounds update with the next frame
        requestAnimationFrame(() => {
          if (this.model !== model) {
            reject(abortError())
            return
          }
          this.cancelShow = null
          resolve()
        })
      })
      model.events.on(MeshLoaderComponent.onError, () => {
        if (this.model === model) {
          this.cancelShow = null
        }
        reject(new Error(`model not loaded: ${url}`))
      })
    })
  }

  /**
   * Removes the shown model. A pending {@link show} rejects with an `AbortError`.
   */
  public clear() {
    const cancel = this.cancelShow
    this.cancelShow = null
    cancel?.()
    if (this.shownUrl) {
      this.world.getSystem(ContentService).setGltfBaseUrl(this.shownUrl, null)
      this.shownUrl = null
    }
    this.model = null
    this.animation = null
    this.shownMannequin = null
    this.mannequinComponent = null
    this.socketModels.clear()
    if (this.root) {
      this.root.destroy()
      this.root.setParent(null)
      this.root = null
    }
  }

  /**
   * Points the orbit camera at the shown model so it fills the view
   *
   * @returns whether a model was there to frame
   */
  /**
   * Replaces the public params of the shown model's materials, e.g. other dye colors
   * ({@link dyedAppearanceParams}). Params of the previous call that are not given again keep their values. Applies
   * to the materials that read params at runtime (Illum, HumanSkin, Hair, see {@link ParamsMaterial}).
   */
  public setMaterialParams(params: MaterialParams | null) {
    this.materialParams = { ...params }
    this.applyMaterialParams()
  }

  /**
   * The fragments of the shown character (see {@link ModelShowOptions.mannequin}): its action list and playback, null
   * when the shown model has none
   */
  public get mannequin(): GltfMannequin | null {
    return this.shownMannequin
  }

  /**
   * The sockets of the shown model: the bone attachments of its character file (e.g. `righthandattach`)
   */
  public get sockets(): string[] {
    return this.socketModels.names
  }

  /**
   * Places models on a socket of the shown model (e.g. the weapon in its hand), replacing the socket's models. They
   * follow the socket's joint and do not count for {@link frame} and {@link bounds}. An empty list empties the socket,
   * a socket the model lacks is replaced by its first one.
   *
   * @remarks
   * {@link show} empties all sockets: call this after it, without waiting for the model. A later call for the same
   * socket replaces a pending one, which rejects with an `AbortError`.
   */
  public setSocket(socket: string, attachments: GltfAttachment[], offset: GltfSocketOffset = {}): Promise<void> {
    return this.socketModels.set(socket, attachments, offset)
  }

  private async loadAttachment(attachment: GltfAttachment): Promise<Model> {
    await this.ready
    const content = this.world.getSystem(ContentService)
    await content.whenLoaded
    content.setGltfBaseUrl(attachment.url, attachment.rootUrl ?? null)
    return content.loadModel(attachment.url, '', content.scopeOf(this.scene.entity))
  }

  /**
   * Draws the melee hit shapes of the playing fragment's damage bars (see {@link mannequin}) on top of the model, at
   * the fragment time. Off by default.
   */
  public get hitboxes(): boolean {
    return this.hitboxesEnabled
  }
  public set hitboxes(value: boolean) {
    this.hitboxesEnabled = value
    const component = this.mannequinComponent
    if (component?.hitShapes) {
      component.hitShapes.enabled = value
      component.updateHitShapes()
    }
  }

  /**
   * Whether the playing fragment has hit shapes to draw (see {@link hitboxes}): melee damage with a shape on a joint
   * of the model or its root
   */
  public get hasHitboxes(): boolean {
    const component = this.mannequinComponent
    return !!component?.hitShapes?.has(component.player.fragment)
  }

  /**
   * The animation clips of the shown model, empty without animations
   */
  public get animations(): string[] {
    return this.animation?.clips ?? []
  }

  /**
   * Plays an animation clip of the shown model in a loop, null shows the rest pose
   */
  public playAnimation(name: string | null) {
    this.animation?.play(name)
  }

  /**
   * Whether the animation advances, off keeps the current pose
   */
  public get animationPlaying(): boolean {
    return !!this.animation?.player.playing
  }
  public set animationPlaying(value: boolean) {
    const player = this.animation?.player
    if (player?.clip) {
      player.playing = value
    }
  }

  /**
   * The first model below the entity (the loader creates it on a child entity) and the entity that renders it
   */
  private findModel(entity: GameEntity): { entity: GameEntity; model: Model } | null {
    const component = entity.component(ModelComponent, GetComponent.Optional)
    if (component?.model) {
      return { entity, model: component.model }
    }
    for (const child of entity.getTransform().children) {
      const found = this.findModel(child.entity)
      if (found) {
        return found
      }
    }
    return null
  }

  /**
   * Turns the lights of the model (glTF KHR_lights_punctual) into scene lights below the entity that renders it
   */
  private attachLights(entity: GameEntity) {
    const found = this.findModel(entity)
    if (!found) {
      return
    }
    for (const light of getModelLights(found.model)) {
      this.createEntity({
        name: light.name,
        parent: found.entity,
        transform: new TransformComponent({ local: light.local }),
        components: [new LightComponent(light.config)],
      })
    }
  }

  /**
   * Shows the models of {@link setSocket} on the model. The joints are in world space, their entity keeps the identity
   * world.
   */
  private attachSockets(entity: GameEntity) {
    const model = this.findModel(entity)?.model
    if (!model) {
      return
    }
    model.updateScene(entity.getTransform().world)
    const holder = this.createEntity({
      name: 'Sockets',
      parent: this.root,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [new GltfSocketsComponent(this.socketModels)],
    })
    this.socketModels.attach(model, holder)
  }

  private attachAnimation(entity: GameEntity, loader: MeshLoaderComponent) {
    const model = this.findModel(entity)?.model
    if (model && GltfAnimationComponent.canAnimate(model)) {
      const draws = loader.skinnedDraws.map((it) => it.data)
      this.animation = new GltfAnimationComponent({ model, draws })
      this.createEntity({
        name: 'glTF Animation',
        parent: entity,
        transform: new TransformComponent(),
        components: [this.animation],
      })
    }
  }

  /**
   * Loads the character's databases and skins the model through a {@link GltfMannequinComponent}. Without a skin or an
   * animation list the model stays in its rest pose (no mannequin), a database that does not load fails the show.
   */
  private async attachMannequin(
    entity: GameEntity,
    loader: MeshLoaderComponent,
    options: ModelMannequinOptions,
    rootUrl: string,
  ) {
    const model = this.findModel(entity)?.model
    if (!model || !GltfMannequinComponent.canAnimate(model)) {
      return
    }
    const animations = readAnimationList(model)
    const files = await loadAdbFiles(options.database, async (file) => {
      const response = await fetch(new URL(file, rootUrl))
      if (!response.ok) {
        throw new Error(`${response.status} ${file}`)
      }
      return response.text()
    })
    if (this.model !== entity) {
      return
    }
    const component = new GltfMannequinComponent({ model, draws: loader.skinnedDraws.map((it) => it.data) })
    this.createEntity({
      name: 'glTF Mannequin',
      parent: entity,
      transform: new TransformComponent(),
      components: [component],
    })
    this.mannequinComponent = component
    // the hit shapes are world matrices, their entity keeps the identity world
    const debug = new DebugShapeComponent()
    this.createEntity({
      name: 'Hit Shapes',
      parent: this.root,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [debug],
    })
    const nodes = model.transformNodes as ReadonlyArray<Transform<NodeData>>
    component.hitShapes = new HitShapes(
      debug,
      gltfHitShapeJoints(nodes, () => model.rootWorld),
    )
    component.hitShapes.enabled = this.hitboxesEnabled
    const content = this.world.getSystem(ContentService)
    const scope = content.scopeOf(entity)
    this.shownMannequin = new GltfMannequin({
      component,
      animations,
      actions: collectFragmentActions(files, (name) => animations.has(name.toLowerCase())),
      tags: [...(options.tags ?? [])],
      loadClip: (file) => content.loadModel(new URL(file, rootUrl).href, '', scope),
    })
  }

  private applyMaterialParams() {
    if (!this.model) {
      return
    }
    const params = this.materialParams
    const visit = (entity: GameEntity) => {
      const model = entity.component(ModelComponent, GetComponent.Optional)?.model
      for (const mesh of model?.meshes ?? []) {
        for (const material of mesh.materials) {
          if (isParamsMaterial(material)) {
            material.setParams(params)
          }
        }
      }
      for (const child of entity.getTransform().children) {
        visit(child.entity)
      }
    }
    visit(this.model)
  }

  public frame(): boolean {
    const sphere = BoundingSphere.create()
    this.forEachModelBounds((bounds) => {
      if (bounds.world?.sphere) {
        sphere.mergeSphere(bounds.world.sphere)
      }
    })
    if (sphere.isEmpty) {
      return false
    }
    const orbit = this.orbit
    vec3Copy(sphere.center, orbit.orbitCenter)
    // the sphere fits the 90° field of view (half angle 45°) at radius / sin(45°)
    orbit.targetRadius = Math.max(orbit.radiusMin, sphere.radius * Math.SQRT2)
    return true
  }

  /**
   * The world space bounding box of the shown model (Z-up), null while nothing is loaded
   */
  public bounds(): BoundingBox | null {
    let box: BoundingBox | null = null
    this.forEachModelBounds((bounds) => {
      if (bounds.world?.box) {
        box = box ? box.merge(bounds.world.box) : BoundingBox.createFrom(bounds.world.box)
      }
    })
    return box
  }

  /**
   * The bounds of the models below the shown model's entity
   */
  private forEachModelBounds(callback: (bounds: BoundsComponent) => void) {
    const visit = (entity: GameEntity) => {
      if (entity.component(ModelComponent, GetComponent.Optional)) {
        const bounds = entity.component(BoundsComponent, GetComponent.Optional)
        if (bounds) {
          callback(bounds)
        }
      }
      for (const child of entity.getTransform().children) {
        visit(child.entity)
      }
    }
    if (this.model) {
      visit(this.model)
    }
  }

  /**
   * Captures the next rendered frame as PNG, null if it failed
   */
  public screenshot(): Promise<Blob | null> {
    return this.screenshots.request()
  }

  /**
   * Destroys the viewer: the systems (with their workers) and the GPU device. The canvas stays with the host.
   */
  public dispose() {
    this.clear()
    this.destroy()
    this.device.dispose()
  }

  /**
   * World matrix of the shown model: its up axis to the Z-up world, then the rotation
   */
  private modelTransform(options: ModelShowOptions): Mat4 {
    const upAxis = this.upAxisTransform(options.upAxis ?? 'y')
    if (!options.rotation) {
      return upAxis
    }
    return mat4Multiply(mat4CreateFromQuat(options.rotation), upAxis)
  }

  /**
   * World matrix of a file with the given up axis in the Z-up world
   */
  private upAxisTransform(upAxis: 'y' | 'z'): Mat4 {
    if (upAxis === 'z') {
      return mat4Identity()
    }
    // the glTF space is the view space convention (Y-up), see SpaceBasis.fromViewSpace
    return mat4Copy(this.world.getSystem(SpaceBasis).fromViewSpace)
  }
}

/**
 * Far plane of the model viewer's camera in meters, the sky sphere is drawn at it
 */
const MODEL_VIEWER_FAR = 1000

/**
 * Default of {@link ModelShowOptions.camera}
 */
const DEFAULT_CAMERA: ModelCamera = { heading: 0, pitch: -15 * DEGREE_TO_RAD }

/**
 * Default of {@link ModelViewer.exposure}
 */
const MODEL_VIEWER_EXPOSURE = 1

function abortError() {
  return new DOMException('replaced by other content', 'AbortError')
}

/**
 * The folder of a file url, with a trailing slash
 */
function baseFolder(url: string): string {
  return new URL('.', new URL(url, location.href)).href
}
