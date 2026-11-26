import { getWwiseBankMedia, wwiseShortId } from '../wwise'
import { BankManager } from './banks'
import { loadAudioCatalog, type AudioCatalog } from './catalog'
import { checkTrigger, DEFAULT_AUDIO_CONFIG, type AudioConfig } from './config'
import type { VgmstreamDecoder } from './decoder'
import { evaluateEvent, type EvaluateResult, type MediaNeed, type MusicStream, type WwiseValues } from './evaluate'
import type {
  AudioOverrides,
  AudioStats,
  EmitterInfo,
  MainToWorker,
  ScriptInfo,
  TerritoryInfo,
  Vec3Like,
  VoiceSpec,
  WorkerToMain,
} from './protocol'
import { pointInPolygon, TerritoryIndex } from './territories'
import { TractLookup } from './tracts'

/**
 * Tracts the game never switches the ambience to (rootplayer_audio.lua `nonAmbientTracts`), the previous tract stays
 */
const NON_AMBIENT_TRACTS = new Set([
  'roads',
  'cliffs',
  'forest_erosion',
  'forest_erosion_fall01',
  'forest_erosion_fall02',
  'forest_erosion_spri01',
  'forest_erosion_wint01',
  'desert_oasis_erosion',
  'desert_plains_erosion',
  'desert_sulfur_erosion',
  'mystic_forest_erosion',
  'forest_tropical_erosion',
  'jungle_erosion',
  'invasive_erosion',
])

/**
 * PvP arena maps: MX_Arena music state and crowd bed (musicmanager.lua, rootplayer_audio.lua ArenaMapCrowdSounds)
 */
const PVP_ARENAS: Record<string, { arena: string; crowd: string; preload: string }> = {
  arena3v3: { arena: 'PvP_Arena01', crowd: 'Play_AMB_Crowd_Arena01', preload: 'arena01' },
  arena3v3_02: { arena: 'PvP_Arena02', crowd: 'Play_AMB_Crowd_Arena01', preload: 'arena01' },
  arena_3v3_04: { arena: 'PvP_Arena04', crowd: 'Play_AMB_Crowd_Arena04', preload: 'arena04' },
}

const BED_FADE = 2
const EMITTER_FADE = 0.75
const DEFAULT_EMITTER_RADIUS = 40
/**
 * emitters activate slightly before their radius and deactivate slightly after (hysteresis)
 */
const EMITTER_MARGIN = 5
/**
 * max preloads kept for tracts (rootplayer_audio.lua `maxLoadedTractPreloads`)
 */
const MAX_TRACT_PRELOADS = 4

interface Layer {
  key: string
  trigger: string
  events: string[]
  banks: string[]
  banksReady: boolean
  signature: string | null
  voices: number[]
  starting: boolean
  /**
   * added to all voices of the layer (music volume)
   */
  gainDb: number
  /**
   * streamed music voices, segments are appended ahead of playback
   */
  streams: StreamState[]
}

interface StreamState {
  voiceId: number
  stream: MusicStream
  /**
   * seconds of segments sent to the main thread
   */
  queued: number
  startedAt: number
  pulling: boolean
}

/**
 * music segments are sent this many seconds ahead of playback
 */
const STREAM_LOOKAHEAD = 45
/**
 * at least this many seconds are queued before a streamed voice starts
 */
const STREAM_INITIAL = 15

interface Emitter {
  info: EmitterInfo
  maxRadius: number
  active: boolean
  layer: Layer | null
  blocked: boolean
}

export interface AudioEngineOptions {
  post: (message: WorkerToMain, transfer?: Transferable[]) => void
  loadDecoder: () => Promise<VgmstreamDecoder>
}

/**
 * Wwise playback logic of the viewer, runs in a worker. Loads banks as they are, evaluates the event hierarchies with
 * the current game state and drives voices on the main thread ({@link AudioOutput}) by messages.
 */
export class AudioEngine {
  private options: AudioEngineOptions
  private config: AudioConfig = DEFAULT_AUDIO_CONFIG
  private baseUrl = ''
  private level = ''
  private enabled = false
  private catalog: AudioCatalog | null = null
  private banks: BankManager | null = null
  private decoder: VgmstreamDecoder | null = null
  private tracts: TractLookup | null = null
  private territories = new TerritoryIndex()
  private overrides: AudioOverrides = {}

  private listener: Vec3Like = { x: 0, y: 0, z: 0 }
  private hour = 12
  private tract: string | null = null
  private territory: string | null = null
  private poi: string | null = null
  private tod: 'Day' | 'Night' = 'Day'
  private tractPreloads: string[] = []

  private values: WwiseValues = { states: new Map(), switches: new Map() }
  private beds: Layer[] = []
  private emitters = new Map<number, Emitter>()
  /**
   * instance audio scripts: ambience loaders and audio areas
   */
  private scripts = new Map<number, ScriptInfo>()
  private insideAreas = new Set<number>()
  /**
   * states, switches and rtpcs set by audio areas, ATL group to value
   */
  private areaValues = new Map<string, string>()
  /**
   * the level has territories (open world), overworld beds and territory music only play there
   */
  private openWorld = false
  private gameModes: Array<{ mode: string; map: string }> = []

  private nextVoiceId = 1
  private voiceCount = 0
  /**
   * media ids whose PCM lives on the main thread
   */
  private sent = new Map<number, number>()
  private pcmBytes = 0
  private mediaTasks = new Map<number, Promise<boolean>>()
  private mediaFailed = new Set<number>()
  private blocked = new Set<string>()
  private errors: string[] = []
  private updateTimer: ReturnType<typeof setInterval> | null = null
  private dirty = true
  private ready = false

  public constructor(options: AudioEngineOptions) {
    this.options = options
  }

  public handle(message: MainToWorker) {
    switch (message.type) {
      case 'init':
        this.gameModes = message.gameModes ?? []
        this.init(message.baseUrl, message.level, message.regionSize, message.config)
        break
      case 'config':
        this.config = message.config
        this.banks?.resetBlocked()
        this.blocked.clear()
        this.restartAll()
        break
      case 'enable':
        this.setEnabled(message.enabled)
        break
      case 'listener':
        this.listener = message.position
        this.hour = message.hour
        this.dirty = true
        break
      case 'emitters':
        for (const id of message.remove) {
          this.removeEmitter(id)
        }
        for (const info of message.add) {
          this.addEmitter(info)
        }
        this.dirty = true
        break
      case 'territories':
        this.territories.set(message.territories)
        this.openWorld = message.territories.some((t) => t.audioGroup === 'MX_Territory')
        this.dirty = true
        break
      case 'scripts':
        for (const id of message.remove) {
          this.scripts.delete(id)
          this.insideAreas.delete(id)
        }
        for (const info of message.add) {
          this.scripts.set(info.id, info)
        }
        this.dirty = true
        break
      case 'overrides':
        this.overrides = message.overrides
        this.dirty = true
        break
      case 'evicted':
        for (const id of message.mediaIds) {
          this.pcmBytes -= this.sent.get(id) ?? 0
          this.sent.delete(id)
        }
        break
    }
  }

  private async init(baseUrl: string, level: string, regionSize: number, config: AudioConfig) {
    this.baseUrl = baseUrl
    this.level = level
    this.config = config
    this.tracts = new TractLookup(baseUrl, level, regionSize)
    this.tracts.onLoad = () => (this.dirty = true)
    this.banks = new BankManager(
      baseUrl,
      () => this.config,
      (bank, reason) => this.block(`bank ${bank}: ${reason}`),
    )
    try {
      const [catalog, decoder] = await Promise.all([loadAudioCatalog(baseUrl), this.options.loadDecoder()])
      this.catalog = catalog
      this.decoder = decoder
      this.ready = true
      this.options.post({ type: 'ready' })
    } catch (err) {
      this.error(`init failed: ${err}`)
      return
    }
    this.updateTimer = setInterval(() => this.update(), 250)
  }

  private setEnabled(enabled: boolean) {
    if (this.enabled === enabled) {
      return
    }
    this.enabled = enabled
    if (!enabled) {
      for (const layer of this.beds) {
        this.stopLayer(layer, 0.25)
      }
      for (const emitter of this.emitters.values()) {
        this.deactivateEmitter(emitter, 0.25)
      }
      this.beds = []
    }
    this.dirty = true
  }

  private restartAll() {
    for (const layer of this.beds) {
      this.stopLayer(layer, BED_FADE)
    }
    this.beds = []
    for (const emitter of this.emitters.values()) {
      this.deactivateEmitter(emitter, EMITTER_FADE)
      emitter.blocked = false
    }
    this.dirty = true
  }

  // ---------------------------------------------------------------------------
  // update loop

  private lastStats = 0

  private update() {
    if (!this.ready) {
      return
    }
    const now = Date.now()
    if (now - this.lastStats > 1000) {
      this.lastStats = now
      this.postStats()
    }
    if (!this.enabled) {
      return
    }
    this.pumpStreams()
    if (!this.dirty) {
      return
    }
    this.dirty = false
    this.updateAreas()
    this.updateState()
    this.updateBeds()
    this.updateEmitters()
  }

  private updateState() {
    const { x, y } = this.listener
    const tod = this.overrides.tod ?? (this.hour < 6 || this.hour > 18 ? 'Night' : 'Day')
    let tract = this.overrides.tract ?? this.tracts.tractAt(x, y)
    if (tract && NON_AMBIENT_TRACTS.has(tract.toLowerCase())) {
      // keep the previous ambience, without one probe around for the nearest ambient tract (GetNearbyNonAmbientTract)
      tract = this.tract ?? this.nearbyAmbientTract(x, y)
    }
    const territory = this.overrides.territory ?? this.territories.stateAt('MX_Territory', x, y)
    const poi = this.territories.stateAt('POI_State', x, y)

    if (tract !== this.tract || tod !== this.tod) {
      this.tract = tract
      this.tod = tod
      this.loadTractPreload()
    }
    this.territory = territory
    this.poi = poi

    const states = new Map<number, number>()
    const switches = new Map<number, number>()
    const set = (group: string, value: string) => this.setValue(states, switches, group, value)
    set('Ext_Int', 'Amb_Ext')
    set('Weather', 'Clear')
    set('Mix_state', 'Default')
    set('TOD_state', tod)
    set('MX_Territory', territory ?? 'None')
    set('POI_State', poi ?? 'None')
    set('Music_Combat', 'None')
    set('Music_PvP', 'None')
    const instance = this.instanceMusic()
    if (this.openWorld) {
      // music manager defaults for exploring (musicmanager.lua musicData.Ambient)
      set('MX_Context', 'Territory')
      set('MX_Gameplay', 'Ambient')
    } else if (instance) {
      // OnDungeon_Started: dungeon or arena music context
      set('MX_Context', instance.isArena ? 'ArenaPvE' : 'Dungeon')
      set(instance.isArena ? 'MX_Arena' : 'MX_Dungeon', instance.name)
      set(instance.isArena ? 'Music_ArenaPvE' : 'Music_Dungeon', instance.isArena ? 'ArenaPvE_Start' : 'MX_Start')
    } else if (this.pvpArena()) {
      // ArenaPvP game mode (musicmanager.lua musicData.ArenaPvP)
      set('MX_Context', 'ArenaPvP')
      set('MX_Arena', this.pvpArena().arena)
      set('Music_ArenaPvP', 'ArenaPvP_Rnd1_Start')
    } else {
      set('MX_Context', 'None')
    }
    // audio areas override (Dungeon_Amb, Music_Dungeon, ...)
    for (const [group, value] of this.areaValues) {
      set(group, value)
    }
    if (tract) {
      set('Tract_state', tract)
      set('Tract_switch', tract)
    }
    this.values = { states, switches }
  }

  /**
   * PvP arena of the level, from its game mode maps (instances without audio scripts)
   */
  private pvpArena() {
    for (const it of this.gameModes) {
      const arena = PVP_ARENAS[it.map?.toLowerCase()]
      if (arena && it.mode?.toLowerCase().includes('arena')) {
        return arena
      }
    }
    return null
  }

  /**
   * Instance music of the level, from the audio areas (dungeon_audio.lua startMusic, dungeon_name, isArena)
   */
  private instanceMusic(): { name: string; isArena: boolean } | null {
    let result: { name: string; isArena: boolean } | null = null
    for (const script of this.scripts.values()) {
      if (script.kind !== 'area') {
        continue
      }
      const name = script.values.dungeonName as string
      if (!name) {
        continue
      }
      if (!result || script.values.startMusic) {
        result = { name, isArena: !!script.values.isArena }
      }
    }
    return result
  }

  /**
   * Enter and exit of audio areas, applies their values like dungeon_audio.lua does on trigger area events
   */
  private updateAreas() {
    const { x, y, z } = this.listener
    for (const script of this.scripts.values()) {
      if (script.kind !== 'area') {
        continue
      }
      const inside = insideShape(script.shape, script.toLocal, x, y, z)
      const was = this.insideAreas.has(script.id)
      if (inside === was) {
        continue
      }
      const v = script.values
      const apply = (group: unknown, value: unknown) => {
        if (typeof group === 'string' && group && typeof value === 'string' && value) {
          this.areaValues.set(group, value)
        }
      }
      if (inside) {
        this.insideAreas.add(script.id)
        apply(v.musicGroup, v.enterMusicState)
        apply(v.ambientGroup, v.enterAmbientState)
        apply(v.switchName, v.enterSwitchValue)
      } else {
        this.insideAreas.delete(script.id)
        apply(v.musicGroup, v.exitMusicState)
        apply(v.ambientGroup, v.exitAmbientState)
        apply(v.switchName, v.exitSwitchValue)
      }
    }
  }

  private nearbyAmbientTract(x: number, y: number): string | null {
    for (const radius of [16, 32, 64, 128]) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const tract = this.tracts.tractAt(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
        if (tract && !NON_AMBIENT_TRACTS.has(tract.toLowerCase())) {
          return tract
        }
      }
    }
    return null
  }

  /**
   * Sets an ATL switch/state by its ATL names, mapping to the Wwise targets like the game does
   */
  private setValue(states: Map<number, number>, switches: Map<number, number>, group: string, value: string) {
    const targets = this.catalog.atl.switches.get(group.toLowerCase())?.get(value.toLowerCase())
    if (!targets?.length) {
      states.set(wwiseShortId(group), wwiseShortId(value))
      switches.set(wwiseShortId(group), wwiseShortId(value))
      return
    }
    for (const target of targets) {
      if (target.kind === 'state') {
        states.set(wwiseShortId(target.group), wwiseShortId(target.value))
      }
      if (target.kind === 'switch') {
        switches.set(wwiseShortId(target.group), wwiseShortId(target.value))
      }
    }
  }

  private loadTractPreload() {
    const prefix = this.tract ? this.catalog.tractBanks.get(this.tract.toLowerCase()) : null
    if (!prefix) {
      return
    }
    const name = (prefix + this.tod).toLowerCase()
    const index = this.tractPreloads.indexOf(name)
    if (index >= 0) {
      this.tractPreloads.splice(index, 1)
      this.tractPreloads.unshift(name)
      return
    }
    this.tractPreloads.unshift(name)
    this.acquirePreload(name, 'tract').then(() => (this.dirty = true))
    while (this.tractPreloads.length > MAX_TRACT_PRELOADS) {
      this.releasePreload(this.tractPreloads.pop(), 'tract')
    }
  }

  private acquirePreload(name: string, owner: string) {
    const files = this.catalog.preloads.get(name.toLowerCase())?.files ?? [name.toLowerCase() + '.bnk']
    return Promise.all(files.map((f) => this.banks.acquire(f, `${owner}:${name}`)))
  }

  private releasePreload(name: string, owner: string) {
    const files = this.catalog.preloads.get(name.toLowerCase())?.files ?? [name.toLowerCase() + '.bnk']
    for (const f of files) {
      this.banks.release(f, `${owner}:${name}`)
    }
  }

  // ---------------------------------------------------------------------------
  // beds

  private updateBeds() {
    const wanted: Array<{ key: string; trigger: string; gainDb: number; preloads: string[] }> = [
      // overworld beds only play in the open world, instances bring their own ambience loaders
      ...(this.openWorld ? this.config.beds : []).map((trigger) => ({
        key: `bed:${trigger}`,
        trigger,
        gainDb: 0,
        preloads: [],
      })),
      ...this.config.music.map((trigger) => ({
        key: `music:${trigger}`,
        trigger,
        gainDb: this.config.musicDb,
        preloads: [],
      })),
    ]
    for (const script of this.scripts.values()) {
      if (script.kind !== 'ambience') {
        continue
      }
      wanted.push({
        key: `ambience:${script.playTrigger}`,
        trigger: script.playTrigger,
        gainDb: 0,
        preloads: script.preload ? [script.preload] : [],
      })
    }
    const arena = !this.openWorld ? this.pvpArena() : null
    if (arena) {
      wanted.push({ key: `bed:${arena.crowd}`, trigger: arena.crowd, gainDb: 0, preloads: [arena.preload] })
    }
    const keys = new Set(wanted.map((it) => it.key))
    for (const layer of this.beds.filter((b) => !keys.has(b.key))) {
      this.stopLayer(layer, BED_FADE)
    }
    this.beds = this.beds.filter((b) => keys.has(b.key))
    for (const it of wanted) {
      if (!this.beds.some((b) => b.key === it.key)) {
        const layer = this.createLayer(it.key, it.trigger, it.preloads)
        if (layer) {
          layer.gainDb = it.gainDb
          this.beds.push(layer)
        }
      }
    }
    for (const layer of this.beds) {
      this.refreshLayer(layer, { kind: 'listener' }, BED_FADE)
    }
  }

  // ---------------------------------------------------------------------------
  // emitters

  private addEmitter(info: EmitterInfo) {
    this.removeEmitter(info.id)
    const trigger = this.catalog?.atl.triggers.get(info.playTrigger.toLowerCase())
    const radius = trigger?.maxRadius || DEFAULT_EMITTER_RADIUS
    this.emitters.set(info.id, { info, maxRadius: radius, active: false, layer: null, blocked: false })
  }

  private removeEmitter(id: number) {
    const emitter = this.emitters.get(id)
    if (!emitter) {
      return
    }
    this.deactivateEmitter(emitter, EMITTER_FADE)
    this.emitters.delete(id)
  }

  private updateEmitters() {
    const candidates: Array<{ emitter: Emitter; distance: number }> = []
    for (const emitter of this.emitters.values()) {
      if (emitter.blocked) {
        continue
      }
      const distance = emitterDistance(emitter.info, this.listener)
      const limit = emitter.maxRadius + (emitter.active ? EMITTER_MARGIN : 0)
      if (distance <= limit) {
        candidates.push({ emitter, distance })
      } else if (emitter.active) {
        this.deactivateEmitter(emitter, EMITTER_FADE)
      }
    }
    candidates.sort((a, b) => a.distance - b.distance)
    const max = this.config.maxEmitterVoices
    for (let i = 0; i < candidates.length; i++) {
      const { emitter } = candidates[i]
      if (i >= max) {
        if (emitter.active) {
          this.deactivateEmitter(emitter, EMITTER_FADE)
        }
        continue
      }
      if (!emitter.active) {
        this.activateEmitter(emitter)
      }
      if (emitter.layer) {
        const position = closestPoint(emitter.info, this.listener)
        this.refreshLayer(emitter.layer, { kind: 'emitter', position, maxDistance: emitter.maxRadius }, EMITTER_FADE)
      }
    }
  }

  private activateEmitter(emitter: Emitter) {
    const layer = this.createLayer(`emitter:${emitter.info.id}`, emitter.info.playTrigger, emitter.info.preloads ?? [])
    if (!layer) {
      emitter.blocked = true
      return
    }
    emitter.active = true
    emitter.layer = layer
  }

  private deactivateEmitter(emitter: Emitter, fade: number) {
    if (emitter.layer) {
      this.stopLayer(emitter.layer, fade)
    }
    emitter.active = false
    emitter.layer = null
  }

  // ---------------------------------------------------------------------------
  // layers: one playing trigger with its banks and voices

  private createLayer(key: string, triggerName: string, preloads: string[]): Layer | null {
    const reason = checkTrigger(this.config, triggerName)
    if (reason) {
      this.block(`trigger ${triggerName}: ${reason}`)
      return null
    }
    const trigger = this.catalog.atl.triggers.get(triggerName.toLowerCase())
    if (!trigger) {
      this.block(`trigger ${triggerName}: not in ATL controls`)
      return null
    }
    const banks = new Set<string>()
    for (const event of trigger.events) {
      for (const bank of this.catalog.triggerBanks.banksForEvent(event)) {
        banks.add(bank)
      }
    }
    for (const preload of preloads) {
      for (const file of this.catalog.preloads.get(preload.toLowerCase())?.files ?? []) {
        banks.add(file)
      }
    }
    if (!banks.size) {
      this.block(`trigger ${triggerName}: no banks`)
      return null
    }
    const layer: Layer = {
      key,
      trigger: trigger.name,
      events: trigger.events,
      banks: [...banks],
      banksReady: false,
      signature: null,
      voices: [],
      starting: false,
      gainDb: 0,
      streams: [],
    }
    Promise.all(layer.banks.map((b) => this.banks.acquire(b, key))).then(() => {
      layer.banksReady = true
      this.dirty = true
    })
    return layer
  }

  private stopLayer(layer: Layer, fade: number) {
    for (const id of layer.voices) {
      this.stopVoice(id, fade)
    }
    layer.voices = []
    layer.streams = []
    layer.signature = null
    for (const bank of layer.banks) {
      this.banks.release(bank, layer.key)
    }
    layer.banks = []
  }

  private refreshLayer(layer: Layer, target: Parameters<typeof evaluateEvent>[1]['target'], fade: number) {
    if (!layer.banksReady || layer.starting || !layer.banks.length) {
      return
    }
    const results: EvaluateResult[] = []
    for (const event of layer.events) {
      results.push(
        evaluateEvent(event, { library: this.banks.library, values: this.values, target, random: Math.random }),
      )
    }
    const signature = results.map((r) => r.signature).join('|')
    if (signature === layer.signature) {
      if (target.kind === 'emitter') {
        for (const id of layer.voices) {
          this.options.post({
            type: 'update',
            id,
            spatial: { kind: 'point', position: target.position, maxDistance: target.maxDistance },
          })
        }
      }
      return
    }
    const voices = results.flatMap((r) => r.voices)
    const media = results.flatMap((r) => r.media)
    // streamed music: pull the first segments now, the rest is appended while playing
    const streams = results.flatMap((r) => r.streams)
    const queued = new Map<MusicStream, number>()
    for (const stream of streams) {
      let seconds = 0
      while (seconds < STREAM_INITIAL) {
        const segment = stream.next(media)
        if (!segment) {
          break
        }
        stream.voice.segments.push(segment)
        seconds += segment.duration
      }
      queued.set(stream, seconds)
    }
    layer.starting = true
    this.ensureMediaSet(media).then(({ all, available }) => {
      layer.starting = false
      if (!layer.banks.length) {
        // stopped meanwhile
        return
      }
      if (!all && (this.banks.pendingCount > 0 || !available.size)) {
        // media not available yet (a bank is still loading), keep the current voices and evaluate again later
        return
      }
      // play what is available, branches with media of banks that are not loaded stay silent
      for (const voice of voices) {
        if (voice.kind === 'music') {
          for (const segment of voice.segments) {
            segment.clips = segment.clips.filter((c) => available.has(c.mediaId))
          }
        }
      }
      voices.splice(0, voices.length, ...voices.filter((v) => (v.kind === 'sound' ? available.has(v.mediaId) : true)))
      for (const id of layer.voices) {
        this.stopVoice(id, fade)
      }
      layer.voices = []
      layer.streams = []
      layer.signature = signature
      for (const voice of voices) {
        if (voice.kind === 'sound' && results.some((r) => r.seek) && voice.loopCount === 0) {
          voice.startOffset = -1 // random start
        }
        if (voice.kind === 'music' && !voice.segments.length) {
          continue
        }
        voice.gainDb += layer.gainDb
        const id = this.startVoice(voice, fade)
        layer.voices.push(id)
        const stream = streams.find((it) => it.voice === voice)
        if (stream) {
          layer.streams.push({
            voiceId: id,
            stream,
            queued: queued.get(stream) ?? 0,
            startedAt: Date.now(),
            pulling: false,
          })
        }
      }
    })
  }

  /**
   * Appends music segments to streamed voices before the main thread runs out of them
   */
  private pumpStreams() {
    const now = Date.now()
    for (const layer of this.beds) {
      for (const state of layer.streams) {
        const elapsed = (now - state.startedAt) / 1000
        if (state.pulling || state.queued - elapsed > STREAM_LOOKAHEAD) {
          continue
        }
        const media: MediaNeed[] = []
        const segment = state.stream.next(media)
        if (!segment) {
          layer.streams = layer.streams.filter((it) => it !== state)
          continue
        }
        state.pulling = true
        this.ensureMedia(media).then(() => {
          state.pulling = false
          state.queued += segment.duration
          if (layer.streams.includes(state)) {
            this.options.post({ type: 'append', id: state.voiceId, segments: [segment] })
          }
        })
      }
    }
  }

  private startVoice(voice: VoiceSpec, fadeIn: number) {
    const id = this.nextVoiceId++
    this.voiceCount++
    this.options.post({ type: 'start', id, voice, fadeIn })
    return id
  }

  private stopVoice(id: number, fadeOut: number) {
    this.voiceCount--
    this.options.post({ type: 'stop', id, fadeOut })
  }

  // ---------------------------------------------------------------------------
  // media

  private async ensureMedia(needs: MediaNeed[]): Promise<boolean> {
    return (await this.ensureMediaSet(needs)).all
  }

  /**
   * Makes the media available on the main thread, resolves with the ids that are available
   */
  private async ensureMediaSet(needs: MediaNeed[]): Promise<{ all: boolean; available: Set<number> }> {
    const unique = new Map<number, MediaNeed>()
    for (const need of needs) {
      unique.set(need.mediaId, need)
    }
    const list = [...unique.values()]
    const results = await Promise.all(list.map((need) => this.ensureOne(need)))
    const available = new Set<number>()
    list.forEach((need, i) => results[i] && available.add(need.mediaId))
    return { all: list.length > 0 && available.size === list.length, available }
  }

  private ensureOne(need: MediaNeed): Promise<boolean> {
    if (this.sent.has(need.mediaId)) {
      return Promise.resolve(true)
    }
    if (this.mediaFailed.has(need.mediaId)) {
      return Promise.resolve(false)
    }
    let task = this.mediaTasks.get(need.mediaId)
    if (!task) {
      task = this.loadMedia(need).finally(() => this.mediaTasks.delete(need.mediaId))
      this.mediaTasks.set(need.mediaId, task)
    }
    return task
  }

  private async loadMedia(need: MediaNeed): Promise<boolean> {
    let bytes: Uint8Array | null = null
    const bank = this.banks.library.getMediaBank(need.mediaId)
    if (bank && !need.streamed) {
      bytes = getWwiseBankMedia(bank, need.mediaId)
    }
    if (!bytes && !need.streamed) {
      // embedded media of a bank that is not loaded (yet), e.g. the tract preload is still loading
      return false
    }
    if (!bytes) {
      try {
        const res = await fetch(`${this.baseUrl}/files/sounds/wwise/media/${need.mediaId}.wem`)
        if (res.ok) {
          bytes = new Uint8Array(await res.arrayBuffer())
        }
      } catch {}
    }
    if (!bytes && bank) {
      // streamed with a full copy in the bank
      bytes = getWwiseBankMedia(bank, need.mediaId)
    }
    if (!bytes) {
      this.mediaFailed.add(need.mediaId)
      this.error(`media ${need.mediaId} not found${need.streamed ? ' (streamed)' : ''}`)
      return false
    }
    try {
      const pcm = downmixToStereo(this.decoder.decode(bytes))
      const size = pcm.channels.reduce((sum, c) => sum + c.byteLength, 0)
      this.sent.set(need.mediaId, size)
      this.pcmBytes += size
      this.options.post(
        { type: 'pcm', pcm: { mediaId: need.mediaId, sampleRate: pcm.sampleRate, channels: pcm.channels } },
        pcm.channels.map((c) => c.buffer as ArrayBuffer),
      )
      return true
    } catch (err) {
      this.mediaFailed.add(need.mediaId)
      this.error(`media ${need.mediaId} decode failed: ${err}`)
      return false
    }
  }

  // ---------------------------------------------------------------------------
  // diagnostics

  private block(message: string) {
    if (this.blocked.has(message)) {
      return
    }
    this.blocked.add(message)
    this.options.post({ type: 'log', level: 'info', message: `blocked ${message}` })
  }

  private error(message: string) {
    this.errors.push(message)
    if (this.errors.length > 50) {
      this.errors.shift()
    }
    this.options.post({ type: 'log', level: 'warn', message })
  }

  private postStats() {
    let active = 0
    for (const e of this.emitters.values()) {
      if (e.active) {
        active++
      }
    }
    const stats: AudioStats = {
      enabled: this.enabled,
      ready: this.ready,
      level: this.level,
      tract: this.tract,
      territory: this.territory,
      poi: this.poi,
      tod: this.tod,
      banksLoaded: this.banks?.loadedCount ?? 0,
      bankBytes: this.banks?.loadedBytes ?? 0,
      mediaDecoded: this.sent.size,
      pcmBytes: this.pcmBytes,
      voices: this.voiceCount,
      emitters: this.emitters.size,
      emittersActive: active,
      pending: (this.banks?.pendingCount ?? 0) + this.mediaTasks.size,
      blocked: [...this.blocked].slice(-30),
      errors: this.errors.slice(-10),
    }
    this.options.post({ type: 'stats', stats })
  }

  public dispose() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }
  }
}

function emitterDistance(info: EmitterInfo, p: Vec3Like) {
  const c = closestPoint(info, p)
  return Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z)
}

/**
 * Emitter position, or the closest point on its path (rivers, AudioShapeComponent)
 */
function closestPoint(info: EmitterInfo, p: Vec3Like): Vec3Like {
  const path = info.path
  if (!path || path.length < 2) {
    return info.position
  }
  let best = path[0]
  let bestD = Infinity
  const segments = info.closed ? path.length : path.length - 1
  for (let s = 0; s < segments; s++) {
    const a = path[s]
    const b = path[(s + 1) % path.length]
    const abx = b.x - a.x
    const aby = b.y - a.y
    const abz = b.z - a.z
    const len = abx * abx + aby * aby + abz * abz || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / len))
    const q = { x: a.x + abx * t, y: a.y + aby * t, z: a.z + abz * t }
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2
    if (d < bestD) {
      bestD = d
      best = q
    }
  }
  return best
}

const SQRT_HALF = Math.SQRT1_2

/**
 * Folds multichannel media down to stereo (ITU-R BS.775, LFE dropped) to cut the PCM memory, e.g. 5.1 music tracks.
 * Wwise channel order: FL FR FC LFE SL SR (5.1), FL FR SL SR (4.0), FL FR FC (3.0).
 */
export function downmixToStereo(pcm: { sampleRate: number; channels: Float32Array[] }) {
  const ch = pcm.channels
  if (ch.length <= 2) {
    return pcm
  }
  const frames = ch[0].length
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  // surround channels: 6 → 4/5, 4 → 2/3, center: 6/3 → 2
  const center = ch.length === 6 || ch.length === 3 ? ch[2] : null
  const sl = ch.length >= 6 ? ch[4] : ch.length === 4 ? ch[2] : null
  const sr = ch.length >= 6 ? ch[5] : ch.length === 4 ? ch[3] : null
  const norm = 1 / (1 + (center ? SQRT_HALF : 0) + (sl ? SQRT_HALF : 0))
  for (let i = 0; i < frames; i++) {
    const c = center ? center[i] * SQRT_HALF : 0
    left[i] = (ch[0][i] + c + (sl ? sl[i] * SQRT_HALF : 0)) * norm
    right[i] = (ch[1][i] + c + (sr ? sr[i] * SQRT_HALF : 0)) * norm
  }
  return { sampleRate: pcm.sampleRate, channels: [left, right] }
}

/**
 * Whether the world position is inside an entity space shape, `toLocal` is the inverse entity world matrix
 */
function insideShape(
  shape: Extract<ScriptInfo, { kind: 'area' }>['shape'],
  m: number[],
  x: number,
  y: number,
  z: number,
) {
  let lx = m[0] * x + m[4] * y + m[8] * z + m[12]
  let ly = m[1] * x + m[5] * y + m[9] * z + m[13]
  let lz = m[2] * x + m[6] * y + m[10] * z + m[14]
  const c = shape.center
  if (c) {
    lx -= c[0]
    ly -= c[1]
    lz -= c[2]
  }
  switch (shape.kind) {
    case 'box': {
      const h = shape.halfExtents ?? [0, 0, 0]
      return Math.abs(lx) <= h[0] && Math.abs(ly) <= h[1] && Math.abs(lz) <= h[2]
    }
    case 'sphere':
      return lx * lx + ly * ly + lz * lz <= (shape.radius ?? 0) ** 2
    case 'cylinder':
      return lx * lx + ly * ly <= (shape.radius ?? 0) ** 2 && Math.abs(lz) <= (shape.height ?? 0) / 2
    case 'capsule': {
      const r = shape.radius ?? 0
      return lx * lx + ly * ly <= r * r && Math.abs(lz) <= (shape.height ?? 0) / 2 + r
    }
    case 'prism':
      return (
        lz >= 0 && lz <= (shape.height ?? 0) && pointInPolygon(lx, ly, (shape.vertices ?? []) as [number, number][])
      )
  }
  return false
}
