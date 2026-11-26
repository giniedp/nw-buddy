import type { AudioConfig } from './config'

export interface Vec3Like {
  x: number
  y: number
  z: number
}

/**
 * Static ambient emitter from a slice (AudioTriggerComponent), positions are world space
 */
export interface EmitterInfo {
  id: number
  playTrigger: string
  stopTrigger?: string
  preloads?: string[]
  position: Vec3Like
  /**
   * follow the closest point on this world space polyline instead of the position
   */
  path?: Vec3Like[]
  /**
   * the path connects its last point back to the first
   */
  closed?: boolean
}

/**
 * Territory, zone or POI area with a world space polygon
 */
export interface TerritoryInfo {
  id: string
  audioGroup?: string
  audioState?: string
  polygon: [number, number][]
  minZ: number
  maxZ: number
}

/**
 * Instance audio script: an ambience bed on the listener, or an area that sets states while the listener is inside.
 * Area shapes are in entity space, `toLocal` is the inverse entity world matrix (column major).
 */
export type ScriptInfo =
  | { id: number; kind: 'ambience'; playTrigger: string; preload?: string }
  | {
      id: number
      kind: 'area'
      shape: {
        kind: string
        center?: number[]
        halfExtents?: number[]
        radius?: number
        height?: number
        vertices?: number[][]
      }
      toLocal: number[]
      values: Record<string, string | boolean | undefined>
    }

export interface AudioOverrides {
  territory?: string
  tract?: string
  tod?: 'Day' | 'Night'
}

export type MainToWorker =
  | {
      type: 'init'
      baseUrl: string
      level: string
      regionSize: number
      config: AudioConfig
      /**
       * game mode maps of the level (datasheets), e.g. mode `Arena3v3` with map `Arena_3v3_04`
       */
      gameModes?: Array<{ mode: string; map: string }>
    }
  | { type: 'config'; config: AudioConfig }
  | { type: 'enable'; enabled: boolean }
  | { type: 'listener'; position: Vec3Like; forward: Vec3Like; hour: number }
  | { type: 'emitters'; add: EmitterInfo[]; remove: number[] }
  | { type: 'territories'; territories: TerritoryInfo[] }
  | { type: 'scripts'; add: ScriptInfo[]; remove: number[] }
  | { type: 'overrides'; overrides: AudioOverrides }
  | { type: 'evicted'; mediaIds: number[] }

/**
 * Spatialization of a voice or clip
 * - `none`: plain stereo
 * - `quad`: world anchored direction around the listener (QuadAmb layers), unit xy direction
 * - `point`: world position with distance attenuation
 */
export type VoiceSpatial =
  | { kind: 'none' }
  | { kind: 'quad'; dir: [number, number] }
  | { kind: 'point'; position: Vec3Like; maxDistance: number }

export interface SoundVoice {
  kind: 'sound'
  mediaId: number
  /**
   * 0 = infinite, 1 = play once, n = n times
   */
  loopCount: number
  gainDb: number
  pitchCents: number
  spatial: VoiceSpatial
  /**
   * start offset into the buffer in seconds, negative for a random offset (seek action on looping ambiences)
   */
  startOffset?: number
}

export interface MusicClip {
  mediaId: number
  /**
   * seconds on the segment timeline
   */
  playAt: number
  beginTrim: number
  endTrim: number
  srcDuration: number
  gainDb: number
  spatial: VoiceSpatial
}

export interface MusicSegmentSpec {
  /**
   * seconds between segment entry and exit, the next segment starts after this
   */
  duration: number
  clips: MusicClip[]
}

export interface MusicVoice {
  kind: 'music'
  segments: MusicSegmentSpec[]
  loop: boolean
  gainDb: number
  /**
   * start at a random position in the first segment
   */
  randomStart: boolean
}

export type VoiceSpec = SoundVoice | MusicVoice

export interface PcmData {
  mediaId: number
  sampleRate: number
  channels: Float32Array[]
}

export interface AudioStats {
  enabled: boolean
  ready: boolean
  level: string
  tract: string | null
  territory: string | null
  poi: string | null
  tod: string
  banksLoaded: number
  bankBytes: number
  mediaDecoded: number
  pcmBytes: number
  voices: number
  emitters: number
  emittersActive: number
  pending: number
  blocked: string[]
  errors: string[]
}

export type WorkerToMain =
  | { type: 'ready' }
  | { type: 'pcm'; pcm: PcmData }
  | { type: 'start'; id: number; voice: VoiceSpec; fadeIn: number }
  | { type: 'update'; id: number; gainDb?: number; spatial?: VoiceSpatial }
  | { type: 'stop'; id: number; fadeOut: number }
  /**
   * more segments for a streamed music voice
   */
  | { type: 'append'; id: number; segments: MusicSegmentSpec[] }
  | { type: 'stats'; stats: AudioStats }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
