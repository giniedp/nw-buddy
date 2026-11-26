import { EcsGame, TimeSystem } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import { BufferUsage, Device, type Buffer, type Texture } from '@gglib/graphics'
import { mat4Invert, vec4, type Mat4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { InputSlots } from '../../material/common'
import { SkyLightSystem } from '../level/SkyLightSystem'
import type { FogVolumeComponent } from './FogVolumeComponent'

/**
 * Floats per packed fog volume, see `FogVolume` in graphics/passes/fog/FroxelFog.wgsl.ts
 */
export const FROXEL_FOG_VOLUME_FLOATS = 48
/**
 * Fog volumes injected per frame (vfInternal::MaxNumFogVolumes of the engine)
 */
export const MAX_FROXEL_FOG_VOLUMES = 64

const DEG_TO_RAD = Math.PI / 180
/**
 * The noise wraps every 1000 units of wind offset (windOffsetSpan in CFogVolumeRenderNode::Render and the shader)
 */
const WIND_OFFSET_SPAN = 1000

interface VolumeState {
  windOffset: [number, number, number]
  noiseElapsedTime: number
}

/**
 * Active fog volumes of the loaded slices, the input of the froxel fog injection (plan phase 8).
 *
 * Each frame the active volumes are packed into a storage buffer like CVolumetricFog::PrepareFogVolumeList with the
 * render node values of CFogVolumeRenderNode (scaled density, offset, falloff, ramp and noise), published as
 * the global inputs {@link InputSlots.Global.FogVolumes} and {@link InputSlots.Global.FogVolumeCount}. There is no global wind in the viewer, the wind offset stays at its random start.
 */
export class FogVolumeSystem extends GameSystem {
  public readonly volumes = new Set<FogVolumeComponent>()

  private game: EcsGame
  private renderer: Renderer
  private world: GameWorld
  private sky: SkyLightSystem | null = null
  private buffer: Buffer | null = null
  private emptyVolume: Texture | null = null
  private data = new Float32Array(FROXEL_FOG_VOLUME_FLOATS * MAX_FROXEL_FOG_VOLUMES)
  private state = new WeakMap<FogVolumeComponent, VolumeState>()
  private matrix = new Float32Array(16) as unknown as Mat4
  private inverse = new Float32Array(16) as unknown as Mat4
  private time: TimeSystem

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.time = world.getSystem(TimeSystem)
    this.renderer = world.getSystem(Renderer)
    this.world = world
    const device = world.getSystem(Device)
    if (device.isWebGPU) {
      this.buffer = device.createBuffer({
        name: 'Froxel fog volumes',
        usage: BufferUsage.STORAGE,
        size: this.data.byteLength,
      })
      this.renderer.inputs.set(InputSlots.Global.FogVolumes, this.buffer)
      this.renderer.inputs.set(InputSlots.Global.FogVolumeCount, 0)
      // materials bind the global froxel volume (getSceneFog), disabled until the FroxelFogPass publishes one
      this.emptyVolume = device.createTexture({
        name: 'Froxel default volume',
        type: '3d',
        format: 'rgba16float',
        width: 1,
        height: 1,
        depth: 1,
        mipLevelCount: 1,
        generateMipmap: false,
      })
      this.renderer.inputs.set(InputSlots.Global.FroxelVolume, this.emptyVolume)
      this.renderer.inputs.set(InputSlots.Global.FroxelEnabled, vec4(0))
      this.renderer.inputs.set(InputSlots.Global.FroxelDepth, vec4(0))
    }
  }

  public add(volume: FogVolumeComponent) {
    this.volumes.add(volume)
  }

  public remove(volume: FogVolumeComponent) {
    this.volumes.delete(volume)
  }

  public override render(): void {
    const camera = this.game.scene?.getView(0)?.camera
    if (!this.buffer || !camera) {
      return
    }
    // the game clock, so a paused or fixed time freezes the density noise
    const dt = Math.min(this.time.game.delta, 0.25)

    // looked up late, the sky system may be added after this one
    this.sky ??= this.world.getSystem(SkyLightSystem, { optional: true })
    const view = mat4Invert(camera.view, this.inverse)
    const eye: [number, number, number] = [view[12], view[13], view[14]]
    const tod = this.sky?.timeOfDay
    const entityAlbedo = tod?.volFog2EntityAlbedo
    let count = 0
    for (const volume of this.volumes) {
      if (count >= MAX_FROXEL_FOG_VOLUMES) {
        break
      }
      this.pack(volume, count * FROXEL_FOG_VOLUME_FLOATS, eye, dt, entityAlbedo)
      count++
    }
    if (count) {
      this.buffer.setData(this.data, 0, count * FROXEL_FOG_VOLUME_FLOATS)
    }
    this.renderer.inputs.set(InputSlots.Global.FogVolumeCount, count)
  }

  public destroy(): void {
    this.volumes.clear()
    this.buffer?.dispose()
    this.buffer = null
    this.emptyVolume?.dispose()
    this.emptyVolume = null
  }

  private pack(
    volume: FogVolumeComponent,
    offset: number,
    eye: [number, number, number],
    dt: number,
    entityAlbedo: { x: number; y: number; z: number } | undefined,
  ) {
    const data = volume.data
    const out = this.data
    let state = this.state.get(volume)
    if (!state) {
      // CFogVolumeRenderNode: random wind offset, noise time starts at -5000
      state = {
        windOffset: [
          Math.random() * WIND_OFFSET_SPAN,
          Math.random() * WIND_OFFSET_SPAN,
          Math.random() * WIND_OFFSET_SPAN,
        ],
        noiseElapsedTime: -5000,
      }
      this.state.set(volume, state)
    }
    if ((data.densityNoiseScale ?? 0) > 0) {
      state.noiseElapsedTime += (data.densityNoiseTimeFrequency ?? 0) * dt
    }

    // object space: unit sphere / cube [-1, 1], m_matWS = axes × size / 2 at the entity position
    const world = volume.world
    const m = this.matrix
    for (let c = 0; c < 3; c++) {
      const s = data.size[c] * 0.5
      m[c * 4 + 0] = world[c * 4 + 0] * s
      m[c * 4 + 1] = world[c * 4 + 1] * s
      m[c * 4 + 2] = world[c * 4 + 2] * s
      m[c * 4 + 3] = 0
    }
    m[12] = world[12]
    m[13] = world[13]
    m[14] = world[14]
    m[15] = 1
    const inv = mat4Invert(m, this.inverse)
    for (let i = 0; i < 16; i++) {
      out[offset + i] = inv[i]
    }
    const px = world[12]
    const py = world[13]
    const pz = world[14]

    // center, w = volume type (0 ellipsoid, 1 box)
    out[offset + 16] = px
    out[offset + 17] = py
    out[offset + 18] = pz
    out[offset + 19] = data.volumeType === 1 ? 1 : 0

    // eye position in object space, w = 1 / soft edge lerp
    out[offset + 20] = inv[0] * eye[0] + inv[4] * eye[1] + inv[8] * eye[2] + inv[12]
    out[offset + 21] = inv[1] * eye[0] + inv[5] * eye[1] + inv[9] * eye[2] + inv[13]
    out[offset + 22] = inv[2] * eye[0] + inv[6] * eye[1] + inv[10] * eye[2] + inv[14]
    out[offset + 23] = 1 / Math.max(data.softEdges ?? 0, 0.0001)

    // fog color (GetFogColor: the global fog albedo of the entities with UseGlobalFogColor), w = density scaled to
    // the volumetric fog (× 0.1)
    const useGlobal = data.useGlobalFogColor && entityAlbedo
    out[offset + 24] = useGlobal ? entityAlbedo.x : data.color[0]
    out[offset + 25] = useGlobal ? entityAlbedo.y : data.color[1]
    out[offset + 26] = useGlobal ? entityAlbedo.z : data.color[2]
    out[offset + 27] = Math.max(data.globalDensity, 0.01) * 0.1

    // height falloff (SetFogVolumeProperties): direction from latitude / longitude
    const lati = (90 - (data.fallOffDirLatitude ?? 0)) * DEG_TO_RAD
    const long = (data.fallOffDirLong ?? 0) * DEG_TO_RAD
    const dx = Math.sin(lati) * Math.cos(long)
    const dy = Math.sin(lati) * Math.sin(long)
    const dz = Math.cos(lati)
    const shift = data.fallOffShift ?? 0
    out[offset + 28] = px + dx * shift
    out[offset + 29] = py + dy * shift
    out[offset + 30] = pz + dz * shift
    // density offset scaled to a useful range (× 0.001 with volumetric fog)
    out[offset + 31] = (data.densityOffset ?? 0) * 0.001
    const scale = (data.fallOffScale ?? 0) * 0.015625
    out[offset + 32] = dx * scale
    out[offset + 33] = dy * scale
    out[offset + 34] = dz * scale
    // noise scale with the normalization factor 1 / (1 + 0.5)
    out[offset + 35] = (data.densityNoiseScale ?? 0) / 1.5

    // depth ramp: 1 / dist, -start / dist, influence, 1 - influence
    const rampStart = data.rampStart ?? 0
    const rampDist = Math.max((data.rampEnd ?? 0) - rampStart, 0.1)
    const influence = data.rampInfluence ?? 0
    out[offset + 36] = 1 / rampDist
    out[offset + 37] = -rampStart / rampDist
    out[offset + 38] = influence
    out[offset + 39] = 1 - influence

    // wind offset, w = noise offset (+ 1, SetFogVolumeProperties)
    out[offset + 40] = state.windOffset[0]
    out[offset + 41] = state.windOffset[1]
    out[offset + 42] = state.windOffset[2]
    out[offset + 43] = (data.densityNoiseOffset ?? 0) + 1

    // noise frequency (× 0.01), w = noise elapsed time
    const freq = data.densityNoiseFrequency ?? [0, 0, 0]
    out[offset + 44] = freq[0] * 0.01
    out[offset + 45] = freq[1] * 0.01
    out[offset + 46] = freq[2] * 0.01
    out[offset + 47] = state.noiseElapsedTime
  }
}
