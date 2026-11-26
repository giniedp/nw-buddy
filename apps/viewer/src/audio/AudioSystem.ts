import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import {
  mat4GetTranslation,
  mat4Invert,
  SpaceBasis,
  vec3,
  vec3$normalize,
  vec3ApplyMat4Rotation,
  type Mat4,
} from '@gglib/math'
import { lfmt } from '@gglib/utils'
import {
  assetReferenceKey,
  isViewerPrefabReferencerComponent,
  isViewerTerritoryComponent,
  type LevelInfo,
} from '../api'
import { ViewerConfig } from '../config'
import { ContentService } from '../content'
import { LevelSystem } from '../game/level/LevelSystem'
import { SkyLightSystem } from '../game/level/SkyLightSystem'
import { AudioEmitterComponent, AudioScriptComponent } from './AudioEmitterComponent'
import { AudioOutput, type AudioOutputStats } from './AudioOutput'
import { DEFAULT_AUDIO_CONFIG, type AudioConfig } from './engine/config'
import type {
  AudioOverrides,
  AudioStats,
  EmitterInfo,
  MainToWorker,
  ScriptInfo,
  TerritoryInfo,
  WorkerToMain,
} from './engine/protocol'

const LISTENER_INTERVAL = 0.1
const EMITTER_SYNC_INTERVAL = 0.5

/**
 * Ambient audio of the viewer. The Wwise logic runs in a worker ({@link AudioEngine}), this system feeds it with the
 * camera (trigger and listener), the time of day, territories and slice emitters and renders its voices.
 *
 * @remarks
 * Audio starts disabled, enabling must happen in a user gesture (autoplay policy), e.g. the debug panel toggle.
 */
export class AudioSystem extends GameSystem {
  public config: AudioConfig = structuredClone(DEFAULT_AUDIO_CONFIG)
  public overrides: AudioOverrides = {}
  public engineStats: AudioStats | null = null
  public outputStats: AudioOutputStats | null = null
  public log: string[] = []

  private game: EcsGame
  private content: ContentService
  private level: LevelSystem
  private sky: SkyLightSystem
  private space: SpaceBasis
  private query: GameQuery
  private scriptQuery: GameQuery
  private sentScripts = new Set<number>()
  private output = new AudioOutput(DEFAULT_AUDIO_CONFIG.pcmBudgetMB)
  private worker: Worker | null = null
  private workerLevel: LevelInfo | null = null
  private sentEmitters = new Map<number, AudioEmitterComponent>()
  private listenerTimer = 0
  private emitterTimer = 0
  private _enabled = false
  private viewerConfig: ViewerConfig | null = null
  private offConfig: (() => void) | null = null

  private position = vec3()
  private forward = vec3()
  private up = vec3()
  private logTag = lfmt.badge('#76B7B2', 'AudioSystem')

  public get enabled() {
    return this._enabled
  }

  /**
   * Enables audio, through the viewer config (audioEnabled), which is the source of truth.
   * Call from a user gesture, the audio context is resumed synchronously.
   */
  public set enabled(value: boolean) {
    if (this.viewerConfig) {
      this.viewerConfig.set('audioEnabled', value)
    } else {
      this.applyEnabled(value)
    }
  }

  private applyEnabled = (value: boolean) => {
    this._enabled = value
    if (value) {
      // the autoplay policy needs a user gesture, a saved value is applied at page load without one
      if (navigator.userActivation?.isActive) {
        this.output.unlock()
      } else {
        this.unlockOnGesture()
      }
    }
    this.post({ type: 'enable', enabled: value })
  }

  private gestureListener: (() => void) | null = null

  /**
   * Unlocks the audio output with the next click or key press, if audio is still enabled then
   */
  private unlockOnGesture() {
    if (this.gestureListener) {
      return
    }
    this.gestureListener = () => {
      this.removeGestureListener()
      if (this._enabled) {
        this.output.unlock()
      }
    }
    window.addEventListener('pointerdown', this.gestureListener, { capture: true })
    window.addEventListener('keydown', this.gestureListener, { capture: true })
  }

  private removeGestureListener() {
    if (!this.gestureListener) {
      return
    }
    window.removeEventListener('pointerdown', this.gestureListener, { capture: true })
    window.removeEventListener('keydown', this.gestureListener, { capture: true })
    this.gestureListener = null
  }

  public get masterDb() {
    return this.config.masterDb
  }

  public set masterDb(value: number) {
    this.config.masterDb = value
    this.output.setMasterDb(value)
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
    this.level = world.getSystem(LevelSystem)
    this.sky = world.getSystem(SkyLightSystem)
    this.space = world.getSystem(SpaceBasis)
    this.query = world.query({ scope: 'active', required: [AudioEmitterComponent] })
    this.scriptQuery = world.query({ scope: 'active', required: [AudioScriptComponent] })
    this.output.onEvicted = (mediaIds) => this.post({ type: 'evicted', mediaIds })

    // the config value wins
    this.viewerConfig = world.getSystem(ViewerConfig)
    this.offConfig = this.viewerConfig.onChange('audioEnabled', this.applyEnabled)
    if (this.viewerConfig.value.audioEnabled) {
      this.applyEnabled(true)
    }
  }

  /**
   * Applies changes of {@link config} (lists, budgets), blocked banks and triggers are retried
   */
  public applyConfig() {
    this.output.setBudget(this.config.pcmBudgetMB)
    this.output.setMasterDb(this.config.masterDb)
    this.post({ type: 'config', config: structuredClone(this.config) })
  }

  public setOverrides(overrides: AudioOverrides) {
    this.overrides = overrides
    this.post({ type: 'overrides', overrides })
  }

  public override update(time: number, dt: number): void {
    const levelInfo = this.level?.levelInfo ?? null
    if (levelInfo !== this.workerLevel) {
      this.resetWorker(levelInfo)
    }
    if (!this.worker) {
      return
    }

    const camera = this.level.camera
    if (camera?.entity) {
      const world = camera.entity.getTransform().world as Mat4
      mat4GetTranslation(world, this.position)
      vec3$normalize(vec3ApplyMat4Rotation(this.space.forward, world, this.forward))
      vec3$normalize(vec3ApplyMat4Rotation(this.space.up, world, this.up))
      this.output.tick(this.position, this.forward, this.up)
    }

    this.listenerTimer += dt
    if (this.listenerTimer >= LISTENER_INTERVAL) {
      this.listenerTimer = 0
      this.post({
        type: 'listener',
        position: { x: this.position.x, y: this.position.y, z: this.position.z },
        forward: { x: this.forward.x, y: this.forward.y, z: this.forward.z },
        hour: this.sky?.timeOfDay?.time ?? 12,
      })
      this.outputStats = this.output.stats(this.outputStats)
    }

    this.emitterTimer += dt
    if (this.emitterTimer >= EMITTER_SYNC_INTERVAL) {
      this.emitterTimer = 0
      this.syncEmitters()
      this.syncScripts()
    }
  }

  /**
   * Pauses all sound, e.g. while the viewer is not shown
   */
  public suspend() {
    this.output.suspend()
  }

  /**
   * Continues the sound after {@link AudioSystem.suspend}
   */
  public resume() {
    this.output.resume()
  }

  public destroy(): void {
    this.offConfig?.()
    this.removeGestureListener()
    this.worker?.terminate()
    this.worker = null
    this.output.dispose()
  }

  private resetWorker(levelInfo: LevelInfo | null) {
    this.worker?.terminate()
    this.worker = null
    this.output.reset(0.5)
    this.sentEmitters.clear()
    this.sentScripts.clear()
    this.workerLevel = levelInfo
    this.engineStats = null
    if (!levelInfo) {
      return
    }
    this.worker = new Worker(new URL('./engine/worker.ts', import.meta.url), { type: 'module', name: 'audio-engine' })
    this.worker.addEventListener('message', (event: MessageEvent<WorkerToMain>) => this.handle(event.data))
    this.worker.addEventListener('error', (event) => console.error(...this.logTag, 'worker error', event))
    const baseUrl = this.content.nwbtUrl || self.location.origin
    this.post({
      type: 'init',
      baseUrl: new URL(baseUrl, self.location.href).href.replace(/\/$/, ''),
      level: levelInfo.name,
      regionSize: levelInfo.regionSize || 2048,
      config: structuredClone(this.config),
      gameModes: (levelInfo.gameModeMaps ?? []).map((it) => ({ mode: it.gameModeId, map: it.gameModeMapId })),
    })
    this.post({ type: 'territories', territories: collectTerritories(levelInfo) })
    if (Object.keys(this.overrides).length) {
      this.post({ type: 'overrides', overrides: this.overrides })
    }
    if (this._enabled) {
      this.post({ type: 'enable', enabled: true })
    }
  }

  private syncEmitters() {
    const current = new Set<number>()
    const add: EmitterInfo[] = []
    for (const entity of this.query) {
      const emitter = entity.component(AudioEmitterComponent)
      current.add(emitter.id)
      if (this.sentEmitters.has(emitter.id)) {
        continue
      }
      this.sentEmitters.set(emitter.id, emitter)
      add.push(emitterInfo(emitter))
    }
    const remove: number[] = []
    for (const id of this.sentEmitters.keys()) {
      if (!current.has(id)) {
        remove.push(id)
        this.sentEmitters.delete(id)
      }
    }
    if (add.length || remove.length) {
      this.post({ type: 'emitters', add, remove })
    }
  }

  private syncScripts() {
    const current = new Set<number>()
    const add: ScriptInfo[] = []
    for (const entity of this.scriptQuery) {
      const script = entity.component(AudioScriptComponent)
      current.add(script.id)
      if (this.sentScripts.has(script.id)) {
        continue
      }
      const info = scriptInfo(script)
      if (!info) {
        continue
      }
      this.sentScripts.add(script.id)
      add.push(info)
    }
    const remove: number[] = []
    for (const id of this.sentScripts) {
      if (!current.has(id)) {
        remove.push(id)
        this.sentScripts.delete(id)
      }
    }
    if (add.length || remove.length) {
      this.post({ type: 'scripts', add, remove })
    }
  }

  private handle(message: WorkerToMain) {
    switch (message.type) {
      case 'ready':
        console.log(...this.logTag, 'audio engine ready')
        break
      case 'pcm':
        this.output.addPcm(message.pcm)
        break
      case 'start':
        this.output.start(message.id, message.voice, message.fadeIn)
        break
      case 'update':
        this.output.update(message.id, message.gainDb, message.spatial)
        break
      case 'stop':
        this.output.stop(message.id, message.fadeOut)
        break
      case 'append':
        this.output.append(message.id, message.segments)
        break
      case 'stats':
        this.engineStats = message.stats
        break
      case 'log':
        this.log.push(`[${message.level}] ${message.message}`)
        if (this.log.length > 200) {
          this.log.shift()
        }
        if (message.level !== 'info') {
          console.warn(...this.logTag, message.message)
        }
        break
    }
  }

  private post(message: MainToWorker) {
    this.worker?.postMessage(message)
  }
}

function emitterInfo(emitter: AudioEmitterComponent): EmitterInfo {
  const world = emitter.entity.getTransform().world as Mat4
  const config = emitter.config
  const info: EmitterInfo = {
    id: emitter.id,
    playTrigger: config.playTrigger,
    stopTrigger: config.stopTrigger,
    preloads: config.preloads,
    position: { x: world[12], y: world[13], z: world[14] },
  }
  if (config.followShape && config.spline?.vertices?.length >= 2) {
    info.path = config.spline.vertices.map((v) => transformPoint(world, v[0], v[1], v[2]))
    info.closed = !!config.spline.closed
  }
  return info
}

function scriptInfo(script: AudioScriptComponent): ScriptInfo | null {
  const config = script.config
  if (config.type === 'AudioAmbience') {
    return { id: script.id, kind: 'ambience', playTrigger: config.playTrigger, preload: config.preload }
  }
  if (!config.shape) {
    return null
  }
  const world = script.entity.getTransform().world as Mat4
  return {
    id: script.id,
    kind: 'area',
    shape: config.shape as any,
    toLocal: Array.from(mat4Invert(world)),
    values: { ...config.values },
  }
}

function transformPoint(m: ArrayLike<number>, x: number, y: number, z: number) {
  return {
    x: m[0] * x + m[4] * y + m[8] * z + m[12],
    y: m[1] * x + m[5] * y + m[9] * z + m[13],
    z: m[2] * x + m[6] * y + m[10] * z + m[14],
  }
}

/**
 * World space territory, zone and POI polygons from the level territory system and its referenced slices
 */
export function collectTerritories(levelInfo: LevelInfo): TerritoryInfo[] {
  const result: TerritoryInfo[] = []
  const slices = levelInfo.slices ?? {}
  for (const entity of levelInfo.territorySystem?.entities ?? []) {
    for (const component of entity.components) {
      if (!isViewerPrefabReferencerComponent(component)) {
        continue
      }
      for (const ref of component.slices) {
        for (const item of slices[assetReferenceKey(ref)]?.entities ?? []) {
          for (const c of item.components) {
            if (!isViewerTerritoryComponent(c) || !c.shape?.vertices?.length) {
              continue
            }
            const m = item.transform
            const polygon = c.shape.vertices.map(([x, y]) => {
              const p = transformPoint(m, x, y, 0)
              return [p.x, p.y] as [number, number]
            })
            result.push({
              id: c.territoryId,
              audioGroup: c.audioGroup,
              audioState: c.audioState,
              polygon,
              minZ: m[14],
              maxZ: m[14] + (c.shape.height || 0),
            })
          }
        }
      }
    }
  }
  return result
}
