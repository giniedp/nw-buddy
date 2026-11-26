import {
  BoundsComponent,
  CameraComponent,
  EcsGame,
  LifeCycleFlags,
  MeshComponent,
  ModelComponent,
  OccTree,
  SpatialComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { AssetType } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld, GetComponent, type CreateEntityOptions } from '@gglib/ecs'
import { Color, Material, Mesh, planeGeometry, type Device, type MaterialOptions } from '@gglib/graphics'
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4CreateFromArray,
  mat4CreateRotationX,
  mat4CreateTranslation,
  mat4Identity,
  vec3,
  vec3Copy,
  vec4,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { Renderer } from '@gglib/render'
import { lfmt } from '@gglib/utils'
import {
  assetReferenceKey,
  CharacterComponentName,
  getLevelInfoUrl,
  isTimeOfDayComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  ParticleComponentName,
  type LevelInfo,
  type ViewerParticleComponent,
  type ViewerEntity,
  type ViewerMannequin,
  type ViewerMeshComponent,
  type ViewerSlice,
} from '../../api'
import { ContentService } from '../../content'
import {
  attachmentMaterial,
  clothMeshReference,
  isHiddenAttachment,
  parseCdf,
  skinAttachments,
} from '../../formats/cdf'
import { InputSlots } from '../../material'
import { GridMaterial } from '../../material/GridMaterial'
import { CharacterComponent } from '../character/CharacterComponent'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { CulledModelComponent } from '../culling/CulledModelComponent'
import { ParticleComponent } from '../particles/ParticleComponent'
import { createEnvProbeComponents } from '../probes/EnvProbeComponent'
import { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { SliceSystem } from '../slice/SliceSystem'
import { TerrainSystem } from '../terrain/TerrainSystem'
import { levelEntityOptions } from './LevelComponent'
import { loadShaderBallGeometries, SHADER_BALL_SIZE } from './ShaderBall'
import { SkyLightSystem } from './SkyLightSystem'
import { createSkySphere, updateSkySphere } from './SkySphere'
import { TimeOfDayComponent } from './TimeOfDayComponent'

/**
 * A model of a preview shown by {@link LevelSystem.loadParts}
 */
export interface PreviewPart {
  /**
   * `.cgf`, `.skin`, or `.cdf` for its skin and cloth attachments
   */
  mesh: string
  /**
   * The `.mtl` of the mesh, for a `.cdf` the material of attachments without their own. Empty or omitted: the
   * mesh's own material.
   */
  material?: string
  /**
   * Shown in the parts list, the file name when omitted (a `.cdf` lists its attachments)
   */
  name?: string
  /**
   * `.cdf` only: just its cloth attachments (the cape and skirt of an armor appearance's character)
   */
  clothOnly?: boolean
}

export class LevelSystem extends GameSystem {
  private content: ContentService
  private sky: SkyLightSystem
  private terrain: TerrainSystem

  public game: EcsGame
  public camera: CameraComponent

  /**
   * Info of the loaded level, null while none is loaded
   */
  public levelInfo: LevelInfo | null = null

  private renderer: Renderer

  private entity: GameEntity
  private skyEntity: GameEntity
  private cloudsEntity: GameEntity
  /**
   * Key of the skybox slice the clouds dome is spawned from, null for the default dome
   */
  private cloudsKey: string | null = null
  private gizmoEntity: GameEntity
  private oceanLevel = -1000

  private logTag = lfmt.badge('#FF9DA7', 'LevelSystem')
  private get timeOfDay() {
    return this.sky.timeOfDay
  }

  public initialize(game: GameWorld): void {
    this.game = game.getSystem(EcsGame)
    this.content = game.getSystem(ContentService)
    this.renderer = game.getSystem(Renderer)

    this.sky = game.getSystem(SkyLightSystem)
    this.terrain = game.getSystem(TerrainSystem)
  }

  public destroy(): void {
    this.unload()
  }

  public override update(time: number, dt: number): void {
    updateSkySphere(this.skyEntity, this.sky)
    this.renderer.inputs.set(InputSlots.Global.OceanLevel, this.oceanLevel)
    this.updateCloudsDome()
  }

  /**
   * Swaps the cloud dome to the skybox slice of the active TimeOfDay POI
   */
  private updateCloudsDome() {
    if (!this.entity) {
      return
    }
    const sky = this.sky.activeSky
    const key = sky ? `${sky.guid}_${sky.subId}` : null
    if (key === this.cloudsKey) {
      return
    }
    this.cloudsKey = key
    if (this.cloudsEntity) {
      this.cloudsEntity.destroy()
      this.cloudsEntity.setParent(null)
    }
    const mesh = key ? findSkyMesh(this.content.slices.get(key)) : null
    if (key && !mesh) {
      console.warn(...this.logTag, `Skybox mesh not found in ${sky.hint || key}, using default clouds`)
    }
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity, mesh))
  }

  /**
   * Loads a level: the coatlicue `name` and the mission of the level folder `mission`, or of the folder with the
   * coatlicue's name. Resolves once the level info is loaded and the level entity exists, the regions stream later.
   */
  public async loadLevel(name: string, mission?: string | null) {
    this.loadCancel()
    // a model (e.g. a preview of the browser) left the camera orbiting
    if (this.camera) {
      this.camera.entity.component(WASDComponent).orbitMode = false
    }

    if (!name) {
      return
    }

    const loadSignal = this.beginLoad()

    console.log(...lfmt.merge(this.logTag, lfmt.green(`Loading level ${name}`)))

    const levelInfo = await this.content.fetchTypedRequest(getLevelInfoUrl(name, mission))
    loadSignal.throwIfAborted()

    // no data objects: with DevTools attached, the console keeps logged objects alive
    console.log(...this.logTag, 'Level data loaded', name)
    this.levelInfo = levelInfo

    this.entity = this.game.createEntity(levelEntityOptions(this.game.scene.entity, levelInfo))
    const scope = this.content.scopeOf(this.entity)

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    // the mission's own entities (a main menu's whole set) spawn like a slice, the global probes are created below
    const missionSlice = createMissionSlice(levelInfo.missionEntities)
    // removed again on unload
    this.content.slices.add(
      this,
      missionSlice ? { ...levelInfo.slices, [MISSION_SLICE_KEY]: missionSlice } : levelInfo.slices,
    )
    for (const options of createSkyboxSystem(this.entity, levelInfo.skyboxSystem)) {
      this.game.createEntity(options)
    }
    for (const options of createMissionProbes(this.entity, levelInfo.missionEntities)) {
      this.game.createEntity(options)
    }
    if (missionSlice) {
      const spawner = this.game.createEntity({
        name: `Mission ${levelInfo.level || levelInfo.name}`,
        parent: this.entity,
        transform: new TransformComponent({
          keepWorld: true,
          world: mat4Identity(),
          // initialized and activated by the SliceSystem
          lifeCycle: LifeCycleFlags.PropagateOnly,
        }),
        components: [new BoundsComponent(), new SliceSpawnerComponent({ slice: MISSION_SLICE_REF })],
      })
      this.game.world.getSystem(SliceSystem).addPreviewSpawner(spawner.component(SliceSpawnerComponent))
    }

    this.oceanLevel = levelInfo.oceanLevel
    this.timeOfDay.setLevelInfo(levelInfo, {
      content: this.content,
      scope: this.content.scopeOf(this.entity),
      signal: loadSignal,
    })

    this.terrain.setLevelInfo(levelInfo, {
      content: this.content,
      scope: this.content.scopeOf(this.entity),
      signal: loadSignal,
    })
  }

  public async loadModel(model: string, material?: string, transform?: number[]) {
    this.loadCancel()

    if (!model) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    // the start view only when the camera comes from the level: between previews it keeps the user's angle
    if (!wasd.orbitMode) {
      wasd.setRotation(PREVIEW_HEADING, PREVIEW_PITCH)
    }
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    this.entity = this.game.createEntity({
      name: `Model: ${model}`,
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
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    // the model on its own entity: its transform (e.g. a Y-up glTF placed Z-up) leaves the sky, clouds and grid as is
    const modelEntity = this.game.createEntity({
      name: model,
      parent: this.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: transform ? mat4CreateFromArray(transform) : mat4Identity(),
      }),
      components: [
        new MeshLoaderComponent({
          type: 'Mesh',
          mesh: model,
          material,
          alwaysRender: true,
        }),
      ],
    })
    modelEntity.events.on(MeshLoaderComponent.onLoad, () => {
      // next frame, when the bounds are updated
      setTimeout(() => this.frameModel())
    })

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * Shows the body of a character (`.cdf`) at the origin: its skin and cloth attachments with their materials, in bind
   * pose, with the sky, the grid and the orbit camera (a preview of the browser). No skeleton, animations or bone
   * attachments. Resolves once the parts are created, their models load later.
   */
  public async loadCharacter(path: string) {
    return this.loadParts(`Character: ${path}`, [{ mesh: path }])
  }

  /**
   * Shows models at the origin, as {@link loadCharacter} shows a character: `.cgf` and `.skin` parts as they are,
   * `.cdf` parts with their skin and cloth attachments. A preview of the Data tool (an appearance row).
   *
   * @param materialParams - replace the public params of the parts' materials (the blend masks of an appearance)
   */
  public async loadParts(name: string, parts: PreviewPart[], materialParams?: Record<string, string | number> | null) {
    this.loadCancel()
    const signal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    // the start view only when the camera comes from the level: between previews it keeps the user's angle
    if (!wasd.orbitMode) {
      wasd.setRotation(PREVIEW_HEADING, PREVIEW_PITCH)
    }
    wasd.orbitMode = true
    wasd.radiusMax = 1000

    const fetchFile = (file: string) => this.content.fetchFile(file, { signal })
    // per part its meshes, for a .cdf its skin and cloth attachments animated as one character
    const groups = await Promise.all(
      parts.map(async (part) => {
        if (!/\.cdf$/i.test(part.mesh)) {
          const name = part.name ?? part.mesh.split('/').pop() ?? ''
          return { character: null, meshes: [{ name, mesh: part.mesh, material: part.material ?? '', hidden: false }] }
        }
        const meshes = await this.characterMeshes(part.mesh, fetchFile, part.clothOnly, part.material)
        return { character: part.mesh, meshes }
      }),
    )
    signal.throwIfAborted()

    this.entity = this.game.createEntity({
      name,
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
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    let pending = 0
    const settled = () => {
      // next frame, when the bounds are updated
      if (--pending === 0) {
        setTimeout(() => this.frameModel())
      }
    }
    this.previewCharacter = null
    for (const group of groups) {
      const parts: Array<{ name: string; loader: MeshLoaderComponent }> = []
      for (const part of group.meshes) {
        if (!part.mesh) {
          console.warn(...this.logTag, 'character part without mesh', part.name)
          continue
        }
        pending++
        const loader = new MeshLoaderComponent(
          { type: 'Mesh', mesh: part.mesh, material: part.material, alwaysRender: true },
          { materialParams },
        )
        // loaded, but drawn only when shown in the parts list (as in the game, until game code shows it)
        loader.visible = !part.hidden
        parts.push({ name: part.name, loader })
        this.characterParts.push({
          name: part.name,
          mesh: part.mesh,
          material: part.material,
          loader,
          hidden: part.hidden,
        })
      }
      // a .cdf: its parts below one entity, skinned and animated by the character component of that entity
      let parent = this.entity
      if (group.character) {
        const character = new CharacterComponent(
          {
            type: CharacterComponentName,
            model: group.character,
            maxViewDistance: 0,
            parts: [],
          },
          parts.map((it) => it.loader),
        )
        parent = this.game.createEntity({
          name: group.character,
          parent: this.entity,
          transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
          components: [character, new DebugShapeComponent()],
        })
        this.previewCharacter ??= character
      }
      // one loader per entity: an entity holds one component per type
      for (const part of parts) {
        const entity = this.game.createEntity({
          name: part.name,
          parent,
          transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
          components: [part.loader],
        })
        entity.events.on(MeshLoaderComponent.onLoad, settled)
        entity.events.on(MeshLoaderComponent.onError, settled)
      }
    }

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The skin and cloth attachments of a `.cdf` with their meshes and materials (a cloth's mesh is referenced inside
   * its binary `.cloth` file; the part material is the fallback of the attachments, nwbt ResolveCgfAndMtl). `hidden`:
   * the game hides the attachment by default.
   */
  private async characterMeshes(
    path: string,
    fetchFile: (file: string) => Promise<Response>,
    clothOnly?: boolean,
    material?: string,
  ) {
    const doc = parseCdf(await (await fetchFile(path)).text())
    const attachments = skinAttachments(doc).filter((it) => !clothOnly || it.type === 'CA_CLOTH')
    return Promise.all(
      attachments.map(async (attachment) => {
        let mesh = attachment.binding
        if (/\.cloth$/i.test(mesh)) {
          const bytes = new Uint8Array(await (await fetchFile(mesh)).arrayBuffer())
          mesh = clothMeshReference(bytes) ?? ''
        }
        return {
          name: attachment.name,
          mesh,
          material: attachmentMaterial(attachment) || material || '',
          hidden: isHiddenAttachment(attachment),
        }
      }),
    )
  }

  /**
   * Spawns an animated character (`.cdf`) into the loaded level, e.g. the third person player: an entity with the
   * {@link CharacterComponent}, one child per part loader, below an entity with a spatial index over the level.
   * Destroy the returned root to remove it; it unloads with the level.
   *
   * @param mannequin - drives the character by Mannequin (its idle fragment plays once loaded)
   */
  public async spawnCharacter(path: string, name: string, mannequin?: ViewerMannequin) {
    const parent = this.entity
    if (!parent) {
      throw new Error('no level loaded')
    }
    const meshes = await this.characterMeshes(path, (file) => this.content.fetchFile(file))
    const root = this.game.createEntity({
      name,
      parent,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-1024, -1024, -1024),
            max: vec3(20480, 20480, 20480),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
      ],
    })
    const loaders = meshes
      .filter((it) => !!it.mesh)
      .map((it) => {
        const loader = new MeshLoaderComponent({
          type: 'Mesh',
          mesh: it.mesh,
          material: it.material,
          alwaysRender: true,
        })
        // as in the game: a hidden attachment loads, but shows only when game code shows it
        loader.visible = !it.hidden
        return loader
      })
    const character = new CharacterComponent(
      { type: CharacterComponentName, model: path, maxViewDistance: 0, parts: [], mannequin },
      loaders,
    )
    const entity = this.game.createEntity({
      name: path,
      parent: root,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      components: [character, new DebugShapeComponent()],
    })
    // one loader per entity: an entity holds one component per type
    for (const loader of loaders) {
      this.game.createEntity({
        parent: entity,
        transform: new TransformComponent({ keepWorld: false }),
        components: [loader],
      })
    }
    return { root, entity, character }
  }

  /**
   * The parts shown by {@link loadCharacter} or {@link loadParts}: the attachment name, its mesh and material, the
   * loader. `hidden`: an attachment the game hides by default, its loader starts invisible (`loader.visible`).
   */
  public characterParts: Array<{
    name: string
    mesh: string
    material: string
    loader: MeshLoaderComponent
    hidden: boolean
  }> = []
  /**
   * The first `.cdf` shown by {@link loadParts}, animated, null for none
   */
  public previewCharacter: CharacterComponent | null = null

  /**
   * Shows one particle effect of a library at the origin, with the sky, the grid and the orbit camera (a preview of
   * the browser). One shot effects restart every few seconds.
   *
   * @param library - path of the library, `libs/particles/<name>.xml`
   * @param effect - the full name of the effect, e.g. `ENV_Bonfires.Medium_01`
   */
  public loadParticleEffect(library: string, effect: string) {
    this.loadCancel()
    this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    wasd.targetRadius = PARTICLE_PREVIEW_RADIUS
    wasd.orbitCenter.x = 0
    wasd.orbitCenter.y = 0
    wasd.orbitCenter.z = PARTICLE_PREVIEW_HEIGHT
    // negative is down
    wasd.setRotation(0, -15 * DEGREE_TO_RAD)

    this.entity = this.game.createEntity({
      name: `Particle effect: ${effect}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    const data: ViewerParticleComponent = {
      type: ParticleComponentName,
      library,
      emitter: effect,
      color: [1, 1, 1, 1],
      alphaScale: 1,
      countScale: 1,
      sizeScale: 1,
      particleSize: [1, 1, 1],
      speedScale: 1,
      timeScale: 1,
      strength: -1,
      viewDistanceMultiplier: 1,
    }
    this.game.createEntity({
      name: effect,
      parent: this.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      // always active around the origin, one shots loop
      components: [new ParticleComponent(data, { oneShots: true, loop: PARTICLE_PREVIEW_LOOP, range: 1000 })],
    })
    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The particle effect shown by {@link loadParticleEffect}, null otherwise
   */
  public particlePreview(): ParticleComponent | null {
    for (const child of this.entity?.getTransform().children ?? []) {
      const particles = child.entity.component(ParticleComponent, GetComponent.Optional)
      if (particles) {
        return particles
      }
    }
    return null
  }

  public async loadMaterial(assetUrl: string) {
    this.loadCancel()

    if (!assetUrl) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    // the start view only when the camera comes from the level: between previews it stays until the balls are
    // framed (MaterialMode), one movement instead of zooming to the start view and back
    if (!wasd.orbitMode) {
      wasd.targetRadius = 6
      wasd.orbitCenter.x = 0
      wasd.orbitCenter.y = 0
      wasd.orbitCenter.z = SHADER_BALL_SIZE.height / 2
      wasd.setRotation(PREVIEW_HEADING, PREVIEW_PITCH)
    }
    wasd.orbitMode = true
    wasd.radiusMax = 1000

    // the materials are loaded into the scope of the entity, it must exist first
    const entity = this.game.createEntity({
      name: `Material: ${assetUrl}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    this.entity = entity
    this.skyEntity = this.game.createEntity(createSkySphere(entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(entity, this.renderer.device))

    const device = this.renderer.device
    const [allMaterials, [baseMaterial], [coreMaterial]] = await Promise.all([
      this.loadMaterialFile(assetUrl, loadSignal),
      this.loadMaterialFile(SHADER_BALL_BASE_MATERIAL, loadSignal),
      this.loadMaterialFile(SHADER_BALL_CORE_MATERIAL, loadSignal),
    ])
    const ball = await loadShaderBallGeometries(device)
    loadSignal.throwIfAborted()
    // NoDraw sub materials (collision) are not drawn, there is nothing to show
    const materials = allMaterials.filter((it) => !it.noRender)

    // one shader ball per sub material, rows of up to SHADER_BALL_COLUMNS along +X, further rows behind (+Y)
    const columns = Math.min(SHADER_BALL_COLUMNS, Math.max(1, materials.length))
    const rows = Math.ceil(materials.length / columns)
    const spacing = SHADER_BALL_SIZE.width + SHADER_BALL_GAP
    materials.forEach((material, i) => {
      const x = ((i % columns) - (columns - 1) / 2) * spacing
      const y = Math.floor(i / columns) * spacing
      this.game.createEntity({
        name: `Shader ball ${i}: ${material.name}`,
        parent: entity,
        transform: new TransformComponent({ keepWorld: true, world: mat4CreateTranslation(vec3(x, y, 0)) }),
        components: [
          new BoundsComponent(),
          new ModelComponent({
            model: new Model(device, {
              meshes: [
                new Mesh(device, {
                  materials: [baseMaterial, material, coreMaterial],
                  partImports: [
                    { geometry: ball.base, materialIndex: 0 },
                    { geometry: ball.shell, materialIndex: 1 },
                    { geometry: ball.core, materialIndex: 2 },
                  ],
                }),
              ],
            }),
          }),
        ],
      })
    })

    this.materialNames = materials.map((it) => it.name)
  }

  /**
   * The sub materials shown by {@link loadMaterial}, in the order of the shader balls
   */
  public materialNames: string[] = []

  /**
   * Points the orbit camera at the shader ball of a sub material, null frames all of them
   */
  public frameMaterial(index: number | null) {
    if (index == null) {
      this.frameModel()
      return
    }
    const ball = this.entity
      ?.getTransform()
      .children.find((it) => it.entity.name?.startsWith(`Shader ball ${index}:`))?.entity
    const bounds = ball?.component(BoundsComponent, GetComponent.Optional)?.world?.sphere
    if (!bounds || !this.camera) {
      return
    }
    const wasd = this.camera.entity.component(WASDComponent)
    vec3Copy(bounds.center, wasd.orbitCenter)
    wasd.targetRadius = bounds.radius * 2.5
  }

  /**
   * Loads all sub materials of a material file
   */
  private async loadMaterialFile(url: string, signal: AbortSignal): Promise<Material[]> {
    const content = this.content
    const scope = content.scopeOf(this.entity)
    const asset = await content.loadAsset(url)
    signal.throwIfAborted()
    const result: Material[] = []
    for (let i = 0; i < asset.count(AssetType.Material); i++) {
      const options = await asset.load<MaterialOptions>(AssetType.Material, i, {
        content: content.loader,
        baseUrl: content.nwbtFileUrl,
      })
      signal.throwIfAborted()
      result.push(scope.adopt(content.loader.createMaterial(options)))
    }
    return result
  }

  /**
   * Cancels a running load and unloads the level, model or preview, e.g. while the engine shows a preview of the
   * browser
   */
  public clear() {
    this.loadCancel()
  }

  private loadCtrl: AbortController
  private beginLoad() {
    this.loadCancel()
    this.loadCtrl = new AbortController()
    return this.loadCtrl.signal
  }

  private loadCancel() {
    if (this.loadCtrl) {
      this.loadCtrl.abort()
      this.loadCtrl = null
    }
    this.unload()
  }

  private unload() {
    this.levelInfo = null
    this.materialNames = []
    this.characterParts = []
    this.previewCharacter = null
    // the next content (a model preview of the browser) starts with the neutral time of day, not the level's preset
    // and POI layers
    this.timeOfDay.reset()
    // loaded into the scope of the level, it is finalized with it
    this.timeOfDay.moonTexture = null
    this.content.slices.remove(this)
    this.skyEntity = null
    this.gizmoEntity = null
    this.cloudsEntity = null
    this.cloudsKey = null
    if (this.entity) {
      this.entity.destroy()
      this.entity.setParent(null)
      this.entity = null
    }
  }

  /**
   * Points the orbit camera at the loaded content again (a model, the models of a slice), e.g. after the user moved
   * away. The bounds of every model below the content count, the sky, the clouds and the grid do not.
   *
   * @returns whether a model was found to frame
   */
  public frameModel(): boolean {
    if (!this.entity || !this.camera) {
      return false
    }
    const skip = new Set([this.skyEntity, this.cloudsEntity, this.gizmoEntity])
    const sphere = BoundingSphere.create()
    const visit = (entity: GameEntity) => {
      if (skip.has(entity)) {
        return
      }
      // static models of slices are drawn by the culling worker (CulledModelComponent), the others directly
      if (
        entity.component(ModelComponent, GetComponent.Optional) ||
        entity.component(CulledModelComponent, GetComponent.Optional)
      ) {
        const bounds = entity.component(BoundsComponent, GetComponent.Optional)
        if (bounds?.world?.sphere) {
          sphere.mergeSphere(bounds.world.sphere)
        }
      }
      for (const child of entity.getTransform().children) {
        visit(child.entity)
      }
    }
    visit(this.entity)
    if (sphere.isEmpty) {
      return false
    }
    const wasd = this.camera.entity.component(WASDComponent)
    vec3Copy(sphere.center, wasd.orbitCenter)
    wasd.targetRadius = sphere.radius * 2
    return true
  }

  /**
   * Shows a slice of the browser at the origin: the slice and the slices it spawns (`slices`, keyed like the level's
   * slice data), with the sky, the grid and the orbit camera. Frame it with {@link frameModel} once models loaded.
   *
   * @param root - key of the slice in `slices`, `guid_subId`
   */
  public loadSlicePreview(root: string, slices: Record<string, ViewerSlice>, name: string) {
    this.loadCancel()
    this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    // the start view only when the camera comes from the level: between previews it stays until the models are
    // framed (SliceMode), one movement instead of zooming to the start view and back
    if (!wasd.orbitMode) {
      wasd.targetRadius = 20
      wasd.orbitCenter.x = 0
      wasd.orbitCenter.y = 0
      wasd.orbitCenter.z = 2
      wasd.setRotation(PREVIEW_HEADING, -20 * DEGREE_TO_RAD)
    }
    wasd.orbitMode = true
    wasd.radiusMax = 2000

    this.entity = this.game.createEntity({
      name: `Slice: ${name}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    // removed again on unload
    this.content.slices.add(this, slices)
    const separator = root.lastIndexOf('_')
    const spawner = this.game.createEntity({
      name,
      parent: this.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4Identity(),
        // initialized and activated by the SliceSystem
        lifeCycle: LifeCycleFlags.PropagateOnly,
      }),
      components: [
        new BoundsComponent(),
        new SliceSpawnerComponent({
          slice: { guid: root.slice(0, separator), subId: Number(root.slice(separator + 1)), hint: name },
        }),
      ],
    })
    this.game.world.getSystem(SliceSystem).addPreviewSpawner(spawner.component(SliceSpawnerComponent))
    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The models of the loaded model (one per instance), to inspect or force their levels of detail
   */
  public modelComponents(): ModelComponent[] {
    const result: ModelComponent[] = []
    // the shown model sits below its own entity (loadModel), the parts of loadParts below theirs
    const visit = (entity: GameEntity) => {
      for (const child of entity.getTransform().children) {
        const model = child.entity.component(ModelComponent, GetComponent.Optional)
        if (model) {
          result.push(model)
        }
        visit(child.entity)
      }
    }
    if (this.entity) {
      visit(this.entity)
    }
    return result
  }
}

/**
 * Size of the ground grid quad in meters; the grid fades out with the distance to the camera long before its edge
 */
const GIZMO_GRID_SIZE = 4096

/**
 * The ground grid: one quad in the XY plane, the {@link GridMaterial} draws the lines
 */
function createGizmoGrid(parent: GameEntity, device: Device): CreateEntityOptions {
  const grid = planeGeometry(device, {
    width: GIZMO_GRID_SIZE,
    depth: GIZMO_GRID_SIZE,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new GridMaterial(device, { properties: {} })
  // the line color, alpha is the opacity of the grid
  material.Color = vec4(0.9, 0.9, 0.9, 1)
  material.Transform = mat4Identity()

  return {
    parent,
    name: 'GizmoGrid',
    transform: new TransformComponent({
      keepWorld: true,
    }),
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: grid,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

/**
 * The material preview: game reference materials for the parts of the shader ball that do not show the material.
 * The balls stand on the grid in rows of up to SHADER_BALL_COLUMNS, SHADER_BALL_GAP meters apart.
 */
const SHADER_BALL_BASE_MATERIAL = 'materials/references/base_colors/grey_01.mtl'
const SHADER_BALL_CORE_MATERIAL = 'materials/references/base_colors/black_01.mtl'
const SHADER_BALL_COLUMNS = 5
const SHADER_BALL_GAP = 0.8

/**
 * The particle preview of the browser: orbit distance and height of the camera target, and the restart interval of
 * one shot effects in seconds
 */
/**
 * Heading of the preview camera's start view: models face forward and a camera at heading 0 looks forward, at 180° it
 * looks at their front (as the ModelViewer)
 */
const PREVIEW_HEADING = Math.PI
const PREVIEW_PITCH = -15 * DEGREE_TO_RAD
const PARTICLE_PREVIEW_RADIUS = 8
const PARTICLE_PREVIEW_HEIGHT = 1.5
const PARTICLE_PREVIEW_LOOP = 3

/**
 * Cloud layer of the sky.
 *
 * The game spawns slices/system/skyboxsystem (not referenced by the level data). Its TimeOfDayPOIComponent
 * (radius 12000 around 7000,7000, libs/timeofday/default.xml) references slices/sky/newworld01_skybox_a, a mesh component
 * with this dome and no material override (uses the cgf material objects/sky/testclouds_sky_a_mtl.mtl, DistanceClouds).
 * Other POIs (zones, events, dungeons) reference other skybox slices, the SkyLightSystem picks the active one.
 *
 * Without a mesh (model / material preview, missing slice data) the default dome is used.
 */
const CLOUDS_DOME_CGF = 'objects/sky/skydome_a.cgf'
function createCloudsDome(parent: GameEntity, mesh?: ViewerMeshComponent | null): CreateEntityOptions {
  mesh ||= {
    type: 'Mesh',
    mesh: CLOUDS_DOME_CGF,
    alwaysRender: true,
  }
  return {
    name: `Clouds`,
    parent: parent,
    components: [new MeshLoaderComponent(mesh)],
  }
}

/**
 * The mesh of a skybox slice (slices/sky/*), each slice holds a single dome mesh
 */
function findSkyMesh(slice: ViewerSlice | undefined): ViewerMeshComponent | null {
  for (const entity of slice?.entities ?? []) {
    const mesh = entity.components.find(isViewerMeshComponent)
    if (mesh) {
      return mesh
    }
  }
  return null
}

/**
 * TimeOfDay POIs of the skybox system slice, the default TimeOfDay and skybox of the open world
 */
function createSkyboxSystem(parent: GameEntity, slice: ViewerSlice | null | undefined): CreateEntityOptions[] {
  const result: CreateEntityOptions[] = []
  for (const item of slice?.entities ?? []) {
    const tod = item.components.find(isTimeOfDayComponent)
    if (!tod) {
      continue
    }
    result.push({
      name: item.name,
      parent,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4CreateFromArray(item.transform),
      }),
      components: [new TimeOfDayComponent(tod)],
    })
  }
  return result
}

/**
 * Environment probes of mission0.entities_xml. Every level has its global probe here, slices do not reference it.
 * The other mission entities (e.g. lights) are not spawned.
 */
/**
 * The slice of the mission's own entities, see {@link createMissionSlice}. Not a catalog asset: the key only joins
 * the spawner and the slice in the slice library.
 */
const MISSION_SLICE_REF = { guid: 'mission', subId: 0 }
const MISSION_SLICE_KEY = assetReferenceKey(MISSION_SLICE_REF)

/**
 * The entities of the level's mission (`mission0.entities_xml`) as a slice in world space, without the global
 * probes ({@link createMissionProbes} creates them). Most levels only have the probes there, a main menu has its whole
 * set (Nighthaven: 6,464 meshes). Null when nothing is left. The spawn radius is unbounded: the entities stream by
 * their own view distances.
 */
function createMissionSlice(entities: ViewerEntity[] | null | undefined): ViewerSlice | null {
  const rest = (entities ?? []).filter(
    (item) => !item.components.some((it) => isViewerLightComponent(it) && it.light.type === 'Probe'),
  )
  if (!rest.length) {
    return null
  }
  return { entities: rest, spawnRadius: MISSION_SPAWN_RADIUS, isStaticSlice: true }
}

/**
 * Covers every level (the open world is about 14 km wide). Finite: the radius is also the spawner's bounding sphere.
 */
const MISSION_SPAWN_RADIUS = 100_000

function createMissionProbes(parent: GameEntity, entities: ViewerEntity[] | null | undefined): CreateEntityOptions[] {
  const result: CreateEntityOptions[] = []
  for (const item of entities ?? []) {
    if (item.inactive) {
      continue
    }
    for (const component of item.components) {
      if (!isViewerLightComponent(component) || component.light.type !== 'Probe') {
        continue
      }
      const debug = new DebugShapeComponent()
      result.push({
        name: item.name,
        parent,
        transform: new TransformComponent({
          keepWorld: true,
          world: mat4CreateFromArray(item.transform),
        }),
        components: [debug, ...createEnvProbeComponents(component.light, debug)],
      })
    }
  }
  return result
}
