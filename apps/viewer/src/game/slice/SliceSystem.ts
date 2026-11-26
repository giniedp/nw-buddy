import { BoundsComponent, EcsGame, LifeCycleFlags, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4$invert,
  mat4$premultiply,
  mat4$rotateY,
  mat4$rotateZ,
  mat4$scaleUniform,
  mat4CreateFromArray,
  mat4CreatePerspectiveFieldOfView,
  mat4CreateScaleUniform,
  mat4CreateScaleXYZ,
  mat4CreateTranslation,
  mat4GetTranslation,
  mat4Identity,
  mat4Invert,
  mat4Multiply,
  vec3,
  vec3Copy,
  vec3DistanceSquared,
  type IVec3,
  type Mat4,
} from '@gglib/math'
import {
  assetReferenceKey,
  CharacterComponentName,
  characterPartMesh,
  isTimeOfDayComponent,
  isViewerAreaSpawnerComponent,
  isViewerAudioAmbienceComponent,
  isViewerAudioAreaComponent,
  isViewerAudioTriggerComponent,
  isViewerCharacterComponent,
  isViewerColliderComponent,
  isViewerDecalComponent,
  isViewerFogVolumeComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  isViewerParticleComponent,
  isViewerPointSpawnerComponent,
  isViewerPrefabSpawnerComponent,
  isViewerRoadComponent,
  isViewerSnowComponent,
  isViewerVolumeComponent,
  isViewerWaterVolumeComponent,
  type ViewerAreaSpawnerComponent,
  type ViewerCharacterComponent,
  type ViewerRoadComponent,
  type ViewerWaterVolumeComponent,
} from '../../api'
import { AudioEmitterComponent, AudioScriptComponent } from '../../audio/AudioEmitterComponent'
import { ViewerConfig } from '../../config'
import {
  CHUNK_MESH_RANGE,
  GDE_DESPAWN_MARGIN,
  IMPOSTOR_HOLD_CHUNK_SIZES,
  OBJECT_DETAIL_TIERS,
  ROAD_VIEW_DISTANCE,
  SPAWNER_ACTIVATION_BUDGET_MS,
  type ObjectDetailTier,
  type ObjectDetailValues,
} from '../../constants'
import { ContentService } from '../../content'
import { MaterialLayerMasks } from '../../material'
import { CollisionComponent } from '../collision/CollisionComponent'
import { CollisionSystem } from '../collision/CollisionSystem'
import { CharacterComponent } from '../character/CharacterComponent'
import { CharacterWeapon } from '../character/CharacterWeapon'
import { DebugLayer, DebugShapeComponent, type DebugShapeOptions } from '../debug/DebugShapeComponent'
import { DecalComponent, decalMatrix } from '../decal/DecalComponent'
import { DECAL_BOX_FROM_UNIT_BOX } from '../decal/DecalSystem'
import { FogVolumeComponent, fogVolumeLocalScale } from '../fog/FogVolumeComponent'
import { SkyLightSystem } from '../level/SkyLightSystem'
import { TimeOfDayComponent } from '../level/TimeOfDayComponent'
import { LightComponent } from '../light/LightComponent'
import { ParticleComponent, particleRange } from '../particles/ParticleComponent'
import { createEnvProbeComponents } from '../probes/EnvProbeComponent'
import { RegionComponent } from '../region/RegionComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { RoadComponent } from '../road/RoadComponent'
import { SnowComponent } from '../snow/SnowComponent'
import { WaterVolumeComponent } from '../water/WaterVolumeComponent'
import { shapeOutline } from '../water/WaterVolumeMesh'
import { capitalReach, chunkReach } from './gdeReach'
import { MeshLoaderComponent } from './MeshLoaderComponent'
import { RangeActivationSystem } from './RangeActivationSystem'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'
import { PatrolComponent } from '../patrol/PatrolComponent'
import { findSkippingRule, type SpawnRuleInput } from './spawnRules'

/**
 * View distance of decals without one (LmbrCentral DecalConfiguration m_maxViewDist default is 8000, nwbt delivers
 * the automatic or override distance, so this is only a fallback)
 */
const DECAL_VIEW_DISTANCE = 100

/**
 * Camera movement that triggers a new update pass
 */
const MOVE_THRESHOLD_SQ = 1 * 1

export class SliceSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private collision: CollisionSystem
  private content: ContentService
  private rangeSystem: RangeActivationSystem
  private activeRegions: GameQuery

  /**
   * Collision chunks are spawned only while collision is shown
   */
  private collisionEnabled = false

  private camPosition = vec3()
  private lastPosition = vec3(Infinity, Infinity, Infinity)
  /**
   * Set when the last pass left work behind, e.g. loaded or spawned slices
   */
  private hasPendingWork = true
  private topLevelCount = 0
  /**
   * Time spent initializing and activating spawner entities in the current update, see SPAWNER_ACTIVATION_BUDGET_MS
   */
  private activationSpent = 0
  /**
   * Spawners outside of regions, e.g. the slice preview of the browser, updated like the slices of a region
   */
  private previewSpawners: SliceSpawnerComponent[] = []
  private config: ViewerConfig | null = null
  private tierName: ObjectDetailTier = 'high'
  private tier: ObjectDetailValues = OBJECT_DETAIL_TIERS.high
  /**
   * Slices in reach this frame, spawned nearest first within the budget
   */
  private spawnQueue: SliceSpawnerComponent[] = []
  /**
   * Spawned slices beyond their reach this frame, despawned farthest first within the budget
   */
  private despawnQueue: SliceSpawnerComponent[] = []

  /**
   * Spawned slices the spawn rules left out, by rule name (spawnRules.ts). Counts every spawn, despawned slices count
   * again when they spawn again.
   */
  public readonly ruleSkips = new Map<string, number>()

  public countRuleSkip(rule: string) {
    this.ruleSkips.set(rule, (this.ruleSkips.get(rule) ?? 0) + 1)
  }

  /**
   * Spawns a slice outside of a region (no impostor cells), until its entity is destroyed
   */
  public addPreviewSpawner(spawner: SliceSpawnerComponent) {
    this.previewSpawners.push(spawner)
    this.hasPendingWork = true
  }

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
    this.rangeSystem = world.getSystem(RangeActivationSystem)
    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
    this.config = world.getSystem(ViewerConfig, { optional: true })
  }

  public destroy(): void {
    //
  }

  public update() {
    const view = this.game.scene.getView(0)
    mat4GetTranslation(view.camera.world, this.camPosition)

    for (let i = this.previewSpawners.length - 1; i >= 0; i--) {
      if (this.previewSpawners[i].entity.isDestroyed) {
        this.previewSpawners.splice(i, 1)
      }
    }
    let topLevelCount = this.previewSpawners.length
    for (const entity of this.activeRegions) {
      topLevelCount += entity.component(RegionComponent).slices.length
    }

    // systems are added after this one, resolved lazily
    this.collision ??= this.world.getSystem(CollisionSystem, { optional: true })
    const collisionEnabled = !!this.collision?.collidersNeeded
    const collisionChanged = collisionEnabled !== this.collisionEnabled
    this.collisionEnabled = collisionEnabled

    const tierName = this.config?.value.objectDetail ?? 'high'
    const tierChanged = tierName !== this.tierName
    this.tierName = tierName
    this.tier = OBJECT_DETAIL_TIERS[tierName]

    const moved = vec3DistanceSquared(this.camPosition, this.lastPosition) >= MOVE_THRESHOLD_SQ
    if (!moved && !this.hasPendingWork && !collisionChanged && !tierChanged && topLevelCount === this.topLevelCount) {
      return
    }
    if (moved) {
      this.lastPosition.x = this.camPosition.x
      this.lastPosition.y = this.camPosition.y
      this.lastPosition.z = this.camPosition.z
    }
    this.topLevelCount = topLevelCount
    this.hasPendingWork = false
    this.activationSpent = 0

    for (const entity of this.activeRegions) {
      const region = entity.$(RegionComponent)
      this.updateSlices(region.slices, this.camPosition, true)
    }
    if (this.previewSpawners.length) {
      // a preview stays spawned
      this.updateSlices(this.previewSpawners, this.camPosition, false)
    }
    this.processQueues()
  }

  private updateSlices(slices: SliceSpawnerComponent[], camera: IVec3, allowDespawn: boolean) {
    for (const component of slices) {
      const entity = component.entity
      if (!entity.isActive && (entity.canInitialize || entity.canActivate)) {
        if (this.activationSpent >= SPAWNER_ACTIVATION_BUDGET_MS) {
          // a region just added thousands of spawners: the rest is activated in the next frames
          this.hasPendingWork = true
          continue
        }
        // only the activation counts against the budget, not the walk over the active spawners
        const start = performance.now()
        if (entity.canInitialize) {
          entity.initialize()
        }
        if (entity.canActivate) {
          entity.activate()
        }
        this.activationSpent += performance.now() - start
      }
      this.updateSlice(component, camera, allowDespawn)
      if (component.slices.length) {
        // slices held by a loading POI cell keep their nested slices, the cell spawned them
        this.updateSlices(component.slices, camera, allowDespawn && !component.isHeld)
      }
    }
  }

  private updateSlice(component: SliceSpawnerComponent, camera: IVec3, allowDespawn: boolean) {
    if (component.impostor) {
      // chunks owned by impostor are spawned and despawned by impostor
      return
    }
    if (component.isCollision && !this.collisionEnabled) {
      return
    }
    if (!component.isLoaded) {
      resolveSpawnData(component)
      this.hasPendingWork = true
      return
    }
    updateReach(component, this.tierName, this.tier)

    const world = component.entity.getTransform().world
    const dx = world[12] - camera.x
    const dy = world[13] - camera.y
    let distanceSq = dx * dx + dy * dy
    let reach = component.reach
    if (!(reach > 0)) {
      // AOI spawn radius of the slice, in 3D (nested, preview and dynamic slices, levels without slicedata)
      const dz = world[14] - camera.z
      distanceSq += dz * dz
      reach = component.spawnRadius
    }

    if (component.isSpawned) {
      const despawnAt = reach + GDE_DESPAWN_MARGIN
      if (allowDespawn && distanceSq > despawnAt * despawnAt && !component.isHeld) {
        component.queueDistance = distanceSq
        this.despawnQueue.push(component)
      }
      return
    }
    if (distanceSq <= reach * reach) {
      component.queueDistance = distanceSq
      this.spawnQueue.push(component)
    }
  }

  /**
   * Spawns the queued slices nearest first and despawns the queued slices farthest first, each up to the slices per
   * frame of the object detail tier (g_GDE_SlicesCreatedPerFrame)
   */
  private processQueues() {
    const budget = this.tier.slicesPerFrame
    const spawn = this.spawnQueue
    if (spawn.length) {
      spawn.sort(nearestFirst)
      const count = Math.min(spawn.length, budget)
      for (let i = 0; i < count; i++) {
        executeSpawner(spawn[i])
      }
      // spawned slices may contain nested spawners, the rest waits for the next frame
      this.hasPendingWork = true
      spawn.length = 0
    }
    const despawn = this.despawnQueue
    if (despawn.length) {
      despawn.sort(farthestFirst)
      const count = Math.min(despawn.length, budget)
      for (let i = 0; i < count; i++) {
        despawn[i].despawn()
      }
      if (despawn.length > count) {
        this.hasPendingWork = true
      }
      despawn.length = 0
    }
  }
}

function nearestFirst(a: SliceSpawnerComponent, b: SliceSpawnerComponent) {
  return a.queueDistance - b.queueDistance
}

function farthestFirst(a: SliceSpawnerComponent, b: SliceSpawnerComponent) {
  return b.queueDistance - a.queueDistance
}

/**
 * Computes the GDE reach of a top level spawner for the object detail tier, see {@link SliceSpawnerComponent.reach}
 */
function updateReach(spawner: SliceSpawnerComponent, tierName: ObjectDetailTier, tier: ObjectDetailValues) {
  if (spawner.reachTier === tierName) {
    return
  }
  spawner.reachTier = tierName
  spawner.reach = 0
  if (!spawner.isTopLevel) {
    return
  }
  if (spawner.chunk) {
    spawner.reach = chunkReach(spawner.chunk, tier)
  } else if (spawner.data?.gde && spawner.data.isStaticSlice) {
    // dynamic slices are server entities on AOI grids, they keep the AOI spawn radius
    spawner.reach = capitalReach(spawner.data.gde, spawner.capitalRadius, tier)
  }
}

export function resolveSpawnData(spawner: SliceSpawnerComponent) {
  if (spawner.isLoaded) {
    return
  }
  spawner.isLoaded = true
  const content = spawner.entity.world.getSystem(ContentService)
  const assetKey = assetReferenceKey(spawner.slice)
  spawner.data = content.slices.get(assetKey)
  if (!spawner.data) {
    console.warn(`Slice data not found for ${assetKey}`)
    return
  }

  // the AOI spawn radius, top level slices with GDE data use their reach instead (see updateReach). A slice that leads
  // to characters stands at least as far as the game shows them (actorReach).
  spawner.spawnRadius = Math.max(spawner.data.spawnRadius, spawner.data.actorReach ?? 0)

  const bounds = BoundingSphere.create(0, 0, 0, spawner.spawnRadius)
  spawner.bounds.setLocalBounds(bounds, null)
}

// reused by executeSpawner, the rules only read it while they run
const ruleInput = {} as SpawnRuleInput

export function executeSpawner(spawner: SliceSpawnerComponent) {
  if (spawner.isSpawned || !spawner.isLoaded) {
    return
  }

  spawner.isSpawned = true

  if (!spawner.data?.entities?.length) {
    return
  }

  // spawned slices and slices the level places, previews of the browser show any slice
  if (spawner.source || spawner.isTopLevel) {
    ruleInput.source = spawner.source
    ruleInput.parent = spawner.parent
    ruleInput.target = spawner.data
    ruleInput.phase = spawner.entity.world.getSystem(SkyLightSystem, GetComponent.Optional)?.timeOfDay.phase ?? null
    const rule = findSkippingRule(ruleInput)
    if (rule) {
      spawner.entity.world.getSystem(SliceSystem).countRuleSkip(rule.name)
      return
    }
  }

  // none for a preview spawner (SliceSystem.addPreviewSpawner): no impostor cells
  const region = spawner.entity.$(RegionComponent.Tag, GetComponent.Optional)?.region ?? null
  const rangeSystem = spawner.entity.world.getSystem(RangeActivationSystem)

  for (const item of spawner.data.entities) {
    // entities of an inactive spawner (nested slice) are inactive as well
    const inactive = !!item.inactive || spawner.entity.layer === MaterialLayerMasks.Inactive
    let range = 0

    const debug = new DebugShapeComponent()
    const components: GameComponent[] = [debug]
    const meshLoaders: MeshLoaderComponent[] = []
    const areaSpawners: ViewerAreaSpawnerComponent[] = []
    let character: CharacterComponent | null = null

    for (const comp of item.components) {
      if (isViewerMeshComponent(comp)) {
        const loader = new MeshLoaderComponent(comp)
        meshLoaders.push(loader)
        components.push(loader)
        // the game uses MaxViewDistance as it stands, no multiplier
        let meshRange = comp.maxViewDistance
        if (spawner.isChunk) {
          meshRange = Math.min(meshRange, CHUNK_MESH_RANGE)
        }
        loader.viewRange = meshRange
        range = Math.max(range, meshRange)
        continue
      }
      if (isViewerCharacterComponent(comp)) {
        // the parts are skinned mesh loaders, the character's view distance is theirs
        const parts: MeshLoaderComponent[] = []
        for (const part of comp.parts) {
          const loader = new MeshLoaderComponent(characterPartMesh(comp, part))
          loader.viewRange = comp.maxViewDistance
          // as in the game: a hidden attachment loads, but shows only when game code shows it
          loader.visible = !part.hidden
          parts.push(loader)
          meshLoaders.push(loader)
          components.push(loader)
        }
        character = new CharacterComponent(comp, parts)
        components.push(character)
        range = Math.max(range, comp.maxViewDistance)
        continue
      }
      if (isViewerPrefabSpawnerComponent(comp)) {
        debug.add({
          type: 'bounds-sphere',
          color: vec3Copy(Color.Yellow),
          layer: DebugLayer.Slice,
        })

        components.push(
          new BoundsComponent(),
          new SliceSpawnerComponent({
            slice: comp.slice,
            source: comp,
            parent: spawner.data,
            // cellAt: spawner.cellAt,
          }),
        )
        continue
      }
      if (isViewerPointSpawnerComponent(comp)) {
        debug.add({
          type: 'bounds-sphere',
          color: vec3Copy(Color.Azure),
          layer: DebugLayer.Slice,
        })
        components.push(
          new BoundsComponent(),
          new SliceSpawnerComponent({
            slice: comp.slice,
            source: comp,
            parent: spawner.data,
            // cellAt: spawner.cellAt,
          }),
        )
        // the spawned actor walks the path or stands on the ground, the spawner entity carries it
        if (comp.patrol?.waypoints.length || comp.onGround) {
          const path = comp.patrol ?? { policy: 0, waypoints: [] }
          components.push(new PatrolComponent(path, item.transform, !!comp.onGround))
        }
        continue
      }
      if (isTimeOfDayComponent(comp)) {
        const shape: DebugShapeOptions = {
          type: 'box',
          color: vec3((comp.priority ?? 1) / 10),
          alpha: 0.125,
          layer: DebugLayer.TimeOfDay,
          solid: true,
        }

        if (comp.shape === 'box') {
          shape.type = 'box'
          shape.instances = [mat4CreateScaleXYZ(comp.width, comp.depth, comp.height)]
          components.push(new TimeOfDayComponent(comp))
        } else if (comp.shape === 'sphere') {
          shape.type = 'sphere'
          shape.instances = [mat4CreateScaleUniform(comp.radius)]
          components.push(new TimeOfDayComponent(comp))
        } else if (comp.shape === 'cylinder') {
          shape.type = 'cylinder'
          shape.instances = [mat4CreateScaleXYZ(comp.radius, comp.radius, comp.height)]
          components.push(new TimeOfDayComponent(comp))
        } else {
          console.warn('Unknown TimeOfDay shape', comp.shape)
        }
        debug.add(shape)
        continue
      }
      if (isViewerLightComponent(comp)) {
        if (inactive) {
          // lights are not filtered by layers, an inactive light would always shine
          continue
        }
        const light = comp.light
        switch (light.type) {
          case 'Point': {
            if (light.viewDistanceEnabled) {
              range = Math.max(range, light.maxViewDistance)
            }
            debug.add({
              type: 'sphere',
              color: vec3(light.color),
              alpha: 0.125,
              solid: true,
              layer: DebugLayer.LightPoint,
              instances: [mat4CreateScaleUniform(light.range)],
            })
            components.push(new LightComponent(light))
            break
          }
          case 'Area': {
            if (light.viewDistanceEnabled) {
              range = Math.max(range, light.maxViewDistance)
            }
            debug.add({
              type: 'box',
              color: vec3(light.color),
              alpha: 0.125,
              solid: true,
              layer: DebugLayer.LightArea,
              instances: [mat4CreateScaleXYZ(light.areaWidth * 0.5, light.areaHeight * 0.5, light.range * 0.5)],
            })
            components.push(new LightComponent(light))
            break
          }
          case 'Projector': {
            if (light.viewDistanceEnabled) {
              range = Math.max(range, light.maxViewDistance)
            }

            const proj = mat4CreatePerspectiveFieldOfView(
              light.projectorFOV * DEGREE_TO_RAD,
              1,
              Math.max(0.001, light.projectorNearPlane),
              light.range,
              0,
            )
            mat4$rotateZ(proj, 90 * DEGREE_TO_RAD)
            mat4$rotateY(proj, 90 * DEGREE_TO_RAD)
            mat4$invert(proj)
            mat4$scaleUniform(proj, 2.0)

            debug.add({
              type: 'box',
              color: vec3(light.color),
              alpha: 0.125,
              solid: true,
              layer: DebugLayer.LightSpot,
              instances: [proj],
            })
            components.push(new LightComponent(light))
            break
          }
          case 'Probe': {
            if (light.viewDistanceEnabled) {
              range = Math.max(range, light.maxViewDistance)
            }
            components.push(...createEnvProbeComponents(light, debug))
            break
          }
        }
        continue
      }
      if (isViewerColliderComponent(comp) || isViewerVolumeComponent(comp)) {
        // repeats go onto satellite entities, see below
        components.push(new CollisionComponent(comp))
        continue
      }
      if (isViewerRoadComponent(comp)) {
        components.push(new RoadComponent(comp))
        debug.add({
          type: 'sphere',
          color: vec3(Color.Orange),
          layer: DebugLayer.Roads,
          instances: comp.spline.vertices.map((v) => mat4CreateTranslation(vec3(v))),
        })
        range = Math.max(range, roadRange(comp))
        continue
      }
      if (isViewerDecalComponent(comp)) {
        components.push(new DecalComponent(comp))
        debug.add({
          type: 'box',
          color: vec3(Color.Orange),
          layer: DebugLayer.Decals,
          // in entity space, the decal matrix of an identity entity transform
          instances: [mat4Multiply(decalMatrix(mat4Identity(), comp), DECAL_BOX_FROM_UNIT_BOX)],
        })
        range = Math.max(range, (comp.maxViewDistance || DECAL_VIEW_DISTANCE) * (comp.viewDistanceMultiplier || 1))
        continue
      }
      if (isViewerFogVolumeComponent(comp)) {
        components.push(new FogVolumeComponent(comp))
        const shape = comp.volumeType === 1 ? 'box' : 'sphere'
        debug.add({
          type: shape,
          color: vec3(Color.Cyan),
          layer: DebugLayer.FogVolumes,
          instances: [fogVolumeLocalScale(comp, shape)],
        })
        continue
      }
      if (isViewerSnowComponent(comp)) {
        // like lights, an inactive volume would always snow
        if (inactive) {
          continue
        }
        // active with the slice (its spawn radius covers the snow radius), the SnowSystem picks the global volume
        components.push(new SnowComponent(comp))
        debug.add({
          type: 'sphere',
          color: vec3(Color.White),
          layer: DebugLayer.FogVolumes,
          instances: [mat4CreateScaleUniform(comp.radius)],
        })
        continue
      }
      if (isViewerAudioTriggerComponent(comp)) {
        // like lights, inactive entities would play without being visible
        if (!inactive) {
          components.push(new AudioEmitterComponent(comp))
        }
        continue
      }
      if (isViewerAudioAmbienceComponent(comp) || isViewerAudioAreaComponent(comp)) {
        if (!inactive) {
          components.push(new AudioScriptComponent(comp))
        }
        continue
      }
      if (isViewerParticleComponent(comp)) {
        // like lights, inactive entities are alternative states that scripts or events switch on
        if (!inactive) {
          components.push(new ParticleComponent(comp))
          range = Math.max(range, particleRange(spawner.entity.world, comp))
        }
        continue
      }
      if (isViewerWaterVolumeComponent(comp)) {
        components.push(new WaterVolumeComponent(comp))
        range = Math.max(range, waterVolumeRange(comp))
        continue
      }
      if (isViewerAreaSpawnerComponent(comp)) {
        // the population stands at the locations of the area, spawned once the entity is placed
        areaSpawners.push(comp)
        continue
      }
      // the type only: with DevTools attached, the console keeps logged objects (slice data) alive
      console.log('Component not implemented', (comp as { type?: string }).type)
    }

    for (const loader of meshLoaders) {
      // only the mesh that decides the range of the entity moves it to its bounds once loaded
      if (loader.viewRange < range) {
        loader.viewRange = 0
      }
    }

    let parentWorld = spawner.entity.getTransform().world
    if (spawner.data.transform) {
      // The slice root entity has its own transform (data.transform), e.g. a rotation.
      // Entity transforms are stored relative to the slice origin, not relative to the root.
      // The spawner places the root, not the origin. So we first undo the root transform
      // (multiply by its inverse), then apply the spawner transform:
      //   entityWorld = spawnerWorld * inverse(rootTransform) * entityTransform
      // mat4Multiply returns a new matrix, the spawner world is not modified.
      parentWorld = mat4Multiply(parentWorld, mat4Invert(mat4CreateFromArray(spawner.data.transform)))
    }
    const world = mat4$premultiply(mat4CreateFromArray(item.transform), parentWorld)

    let impostorCell: RegionImpostorComponent | null = null
    if (!meshLoaders.length) {
      //
    } else if (region && meshLoaders.some((it) => region.isImpostorMesh(it.data))) {
      impostorCell = region.poiImpostorAt(world[12], world[13])
    } else if (spawner.impostor && IMPOSTOR_HOLD_CHUNK_SIZES.includes(spawner.chunkSize)) {
      impostorCell = spawner.impostor
    }

    // Lumberyard entities may hold several components of one type (e.g. two decals), a gglib entity holds one per
    // type. The repeats go onto satellite child entities at the same transform, which activate with the entity.
    const unique: GameComponent[] = []
    const satellites: GameComponent[] = []
    const types = new Set<unknown>()
    for (const component of components) {
      if (types.has(component.constructor)) {
        satellites.push(component)
      } else {
        types.add(component.constructor)
        unique.push(component)
      }
    }

    const entity = spawner.entity.world.createEntity({
      parent: spawner.entity,
      name: item.name,
      components: unique,
      transform: new TransformComponent({
        keepWorld: true,
        world,
        lifeCycle: range || impostorCell ? LifeCycleFlags.PropagateOnly : LifeCycleFlags.InheritAndPropagate,
      }),
    })
    if (impostorCell && debug.entries[0]) {
      debug.entries[0].color = Color.Magenta
    }
    if (inactive) {
      // shown only when the Inactive layer is enabled on the camera
      entity.layer = MaterialLayerMasks.Inactive
    }
    for (const component of satellites) {
      const satellite = spawner.entity.world.createEntity({
        name: `${item.name} (${component.constructor.name})`,
        components: [component],
        transform: new TransformComponent({ local: mat4Identity() }),
      })
      // the layer before the parent: attaching to an active entity activates the satellite
      satellite.layer = entity.layer
      satellite.getTransform<TransformComponent>().setParent(entity.getTransform())
    }
    if (character) {
      spawnCharacterWeapons(entity, character)
    }

    if (impostorCell) {
      impostorCell.addMember({ entity, loaders: meshLoaders })
      spawner.memberCells.add(impostorCell)
    } else if (range) {
      rangeSystem.add(entity, range)
      spawner.rangeEntities.push(entity)
    }

    const child = entity.component(SliceSpawnerComponent, GetComponent.Optional)
    if (child) {
      spawner.slices.push(child)
    }
    for (const area of areaSpawners) {
      spawnAreaPopulation(spawner, area, parentWorld, inactive)
    }
  }
}

/**
 * Creates the weapons a character holds: per weapon a child entity with the weapon's own character (its `.cdf` in
 * bind pose) and skinned parts, repeated part loaders on satellites. The holder moves them onto its sockets.
 */
function spawnCharacterWeapons(holder: GameEntity, character: CharacterComponent) {
  const world = holder.world
  for (const weapon of character.data.weapons ?? []) {
    const data: ViewerCharacterComponent = {
      type: CharacterComponentName,
      model: weapon.model,
      maxViewDistance: character.data.maxViewDistance,
      parts: weapon.parts,
    }
    const loaders = weapon.parts.map((part) => {
      const loader = new MeshLoaderComponent(characterPartMesh(data, part))
      loader.viewRange = data.maxViewDistance
      loader.visible = !part.hidden
      return loader
    })
    if (!loaders.length) {
      continue
    }
    const entity = world.createEntity({
      name: `${holder.name} (${weapon.item})`,
      components: [new CharacterComponent(data, loaders), loaders[0]],
      transform: new TransformComponent({ local: mat4Identity() }),
    })
    for (const loader of loaders.slice(1)) {
      const satellite = world.createEntity({
        name: `${entity.name} (${MeshLoaderComponent.name})`,
        components: [loader],
        transform: new TransformComponent({ local: mat4Identity() }),
      })
      satellite.layer = holder.layer
      satellite.getTransform<TransformComponent>().setParent(entity.getTransform())
    }
    // the layer before the parent: attaching to an active entity activates the weapon
    entity.layer = holder.layer
    entity.getTransform<TransformComponent>().setParent(holder.getTransform())
    character.attachWeapon(new CharacterWeapon(entity, weapon))
  }
}

/**
 * Creates the spawners of an area population. The game spawns liveCount slices at the authored locations, each at a
 * location it draws at random. The viewer takes the first liveCount locations.
 * An area without locations spawns nothing. A spawn stands at the location's world translation and rotation, the
 * location's scale does not apply.
 *
 * @param parentWorld - places the slice space of the spawner's slice, where the locations are authored
 */
function spawnAreaPopulation(
  spawner: SliceSpawnerComponent,
  area: ViewerAreaSpawnerComponent,
  parentWorld: Mat4,
  inactive: boolean,
) {
  const count = Math.min(area.liveCount ?? 1, area.locations.length)
  for (let i = 0; i < count; i++) {
    const entity = spawner.entity.world.createEntity({
      parent: spawner.entity,
      name: `${area.slice.hint} (location ${i})`,
      components: [
        new DebugShapeComponent({
          type: 'bounds-sphere',
          color: vec3Copy(Color.Orange),
          layer: DebugLayer.Slice,
        }),
        new BoundsComponent(),
        new SliceSpawnerComponent({
          slice: area.slice,
          source: area,
          parent: spawner.data,
        }),
      ],
      transform: new TransformComponent({
        keepWorld: true,
        world: withoutScale(mat4$premultiply(mat4CreateFromArray(area.locations[i]), parentWorld)),
        lifeCycle: LifeCycleFlags.InheritAndPropagate,
      }),
    })
    if (inactive) {
      entity.layer = MaterialLayerMasks.Inactive
    }
    spawner.slices.push(entity.component(SliceSpawnerComponent))
  }
}

/**
 * Removes the scale of a rotation and translation matrix in place: normalizes the axes
 */
function withoutScale(m: Mat4): Mat4 {
  for (let c = 0; c < 3; c++) {
    const o = c * 4
    const length = Math.hypot(m[o], m[o + 1], m[o + 2])
    if (length > 1e-9) {
      m[o] /= length
      m[o + 1] /= length
      m[o + 2] /= length
    }
  }
  return m
}

/**
 * View range of a road measured from the entity origin: the view distance plus the extent of the spline,
 * long roads have their origin far away from most of their geometry
 */
function roadRange(road: ViewerRoadComponent) {
  let radius = 0
  for (const v of road.spline.vertices) {
    radius = Math.max(radius, Math.hypot(v[0], v[1]))
  }
  return ROAD_VIEW_DISTANCE * (road.viewDistanceMultiplier || 1) + radius + road.width
}

/**
 * View range of a water volume measured from the entity origin: the view distance plus the extent of the surface
 */
function waterVolumeRange(water: ViewerWaterVolumeComponent) {
  let radius = 0
  for (const p of shapeOutline(water.shape) ?? []) {
    radius = Math.max(radius, Math.hypot(p.x, p.y))
  }
  return ROAD_VIEW_DISTANCE * (water.viewDistanceMultiplier || 1) + radius
}
