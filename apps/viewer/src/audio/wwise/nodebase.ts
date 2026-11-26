import type { WwiseReader } from './reader'

/**
 * Parsed `NodeBaseParams` of bank version 150 (sounds, containers, music nodes).
 */
export interface WwiseNodeBase {
  overrideBusId: number
  parentId: number
  /**
   * `AkPropBundle` values by prop id, raw 32 bit pattern as float (most props are floats)
   */
  props: Map<number, number>
  /**
   * `AkPropBundle` raw 32 bit values by prop id, for integer props like `AttenuationID`
   */
  propsRaw: Map<number, number>
  /**
   * ranged modifiers (randomization) by prop id
   */
  rangedProps: Map<number, { min: number; max: number }>
  positioning: WwisePositioning
  auxBits: number
  auxIds: number[]
  maxInstances: number
  /**
   * state groups that drive this node
   */
  stateGroups: number[]
  rtpcs: WwiseRtpcCurve[]
}

export interface WwisePositioning {
  /**
   * positioning overrides the parent
   */
  override: boolean
  /**
   * 3D positioning (listener relative or emitter)
   */
  is3d: boolean
  bits: number
  bits3d: number
}

export interface WwiseRtpcCurve {
  rtpcId: number
  rtpcType: number
  accum: number
  paramId: number
  curveId: number
  scaling: number
  points: WwiseGraphPoint[]
}

export interface WwiseGraphPoint {
  from: number
  to: number
  interp: number
}

export const WwisePropId = {
  Volume: 0x00,
  Pitch: 0x02,
  LPF: 0x03,
  HPF: 0x04,
  BusVolume: 0x05,
  MakeUpGain: 0x06,
  Priority: 0x07,
} as const

export function readNodeBase(r: WwiseReader): WwiseNodeBase {
  // NodeInitialFxParams
  r.u8() // bIsOverrideParentFX
  const numFx = r.u8()
  if (numFx > 0) {
    r.u8() // bBypassAll
    r.skip(r.count(numFx, 6, 'fx') * 6)
  }
  // NodeInitialMetadataParams
  r.u8()
  const numMeta = r.u8()
  r.skip(r.count(numMeta, 6, 'metadata fx') * 6)

  const overrideBusId = r.u32()
  const parentId = r.u32()
  r.u8() // priority / midi bit vector

  const props = new Map<number, number>()
  const propsRaw = new Map<number, number>()
  {
    const count = r.count(r.u8(), 5, 'props')
    const ids: number[] = []
    for (let i = 0; i < count; i++) {
      ids.push(r.u8())
    }
    for (const id of ids) {
      const raw = r.view.getUint32(r.offset, true)
      propsRaw.set(id, raw)
      props.set(id, r.f32())
    }
  }
  const rangedProps = new Map<number, { min: number; max: number }>()
  {
    const count = r.count(r.u8(), 9, 'ranged props')
    const ids: number[] = []
    for (let i = 0; i < count; i++) {
      ids.push(r.u8())
    }
    for (const id of ids) {
      rangedProps.set(id, { min: r.f32(), max: r.f32() })
    }
  }

  const positioning = readPositioning(r)

  // AuxParams
  const auxBits = r.u8()
  const auxIds: number[] = []
  if ((auxBits >> 3) & 1) {
    for (let i = 0; i < 4; i++) {
      auxIds.push(r.u32())
    }
  }
  r.u32() // reflectionsAuxBus

  // AdvSettingsParams
  r.u8() // bit vector
  r.u8() // eVirtualQueueBehavior
  const maxInstances = r.u16()
  r.u8() // eBelowThresholdBehavior
  r.u8() // bit vector

  // StateChunk
  const stateGroups: number[] = []
  {
    const numProps = r.var()
    for (let i = 0; i < numProps; i++) {
      r.var() // prop id
      r.u8() // accumType
      r.u8() // inDb
    }
    const numGroups = r.count(r.var(), 6, 'state groups')
    for (let i = 0; i < numGroups; i++) {
      stateGroups.push(r.u32())
      r.u8() // eStateSyncType
      const numStates = r.count(r.var(), 6, 'states')
      for (let j = 0; j < numStates; j++) {
        r.u32() // state id
        const count = r.count(r.u16(), 6, 'state props')
        r.skip(count * 6)
      }
    }
  }

  const rtpcs = readInitialRtpc(r)

  return {
    overrideBusId,
    parentId,
    props,
    propsRaw,
    rangedProps,
    positioning,
    auxBits,
    auxIds,
    maxInstances,
    stateGroups,
    rtpcs,
  }
}

function readPositioning(r: WwiseReader): WwisePositioning {
  const bits = r.u8()
  const override = (bits & 1) !== 0
  const is3d = override && ((bits >> 1) & 1) !== 0
  let bits3d = 0
  if (is3d) {
    bits3d = r.u8()
    const positionType = (bits >> 5) & 3
    if (positionType !== 0) {
      r.u8() // ePathMode
      r.i32() // TransitionTime
      const vertices = r.count(r.u32(), 16, 'path vertices')
      r.skip(vertices * 16)
      const playlist = r.count(r.u32(), 20, 'path playlist')
      r.skip(playlist * 8)
      r.skip(playlist * 12)
    }
  }
  return { override, is3d, bits, bits3d }
}

export function readInitialRtpc(r: WwiseReader): WwiseRtpcCurve[] {
  const count = r.count(r.u16(), 14, 'rtpc curves')
  const result: WwiseRtpcCurve[] = []
  for (let i = 0; i < count; i++) {
    const rtpcId = r.u32()
    const rtpcType = r.u8()
    const accum = r.u8()
    const paramId = r.var()
    const curveId = r.u32()
    const scaling = r.u8()
    const numPoints = r.count(r.u16(), 12, 'rtpc points')
    const points: WwiseGraphPoint[] = []
    for (let j = 0; j < numPoints; j++) {
      points.push({ from: r.f32(), to: r.f32(), interp: r.u32() })
    }
    result.push({ rtpcId, rtpcType, accum, paramId, curveId, scaling, points })
  }
  return result
}
