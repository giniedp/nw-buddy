import { azCrc32 } from './hash'

/**
 * CryAudio ATL controls (`libs/gameaudio/wwise/atl_controls.xml`) reduced to what the engine needs.
 * Parsed with a tag scanner since workers have no `DOMParser`. All keys are lower cased.
 */
export interface AtlControls {
  /**
   * ATL trigger name → trigger
   */
  triggers: Map<string, AtlTrigger>
  /**
   * ATL switch (or state) group name → state name → Wwise targets
   */
  switches: Map<string, Map<string, AtlSwitchTarget[]>>
  /**
   * ATL rtpc name → Wwise rtpc names
   */
  rtpcs: Map<string, string[]>
  /**
   * ATL environment name → Wwise aux bus names
   */
  environments: Map<string, string[]>
}

export interface AtlTrigger {
  name: string
  events: string[]
  /**
   * `TriggerPlaybackInfo.MaxRadius`, 0 when not set
   */
  maxRadius: number
  /**
   * `TriggerPlaybackInfo.MaxDuration`, -1 for looping or unknown
   */
  maxDuration: number
}

export interface AtlSwitchTarget {
  kind: 'switch' | 'state' | 'rtpc'
  /**
   * Wwise switch group, state group or rtpc name
   */
  group: string
  /**
   * Wwise switch or state value name, empty for rtpc targets
   */
  value: string
  /**
   * rtpc value for rtpc targets
   */
  rtpcValue?: number
}

export interface AtlPreload {
  name: string
  autoLoad: boolean
  /**
   * bank file names (lower case, e.g. `amb_wildlife_coast_day.bnk`) of the default config group
   */
  files: string[]
}

const TAG = /<(\/?)([A-Za-z]+)((?:\s+[a-zA-Z_]+="[^"]*")*)\s*(\/?)>/g
const ATTR = /([a-zA-Z_]+)="([^"]*)"/g

interface Tag {
  close: boolean
  name: string
  attrs: Record<string, string>
  selfClose: boolean
}

function* scanTags(xml: string): Generator<Tag> {
  TAG.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TAG.exec(xml))) {
    const attrs: Record<string, string> = {}
    if (match[3]) {
      ATTR.lastIndex = 0
      let attr: RegExpExecArray | null
      while ((attr = ATTR.exec(match[3]))) {
        attrs[attr[1]] = attr[2]
      }
    }
    yield { close: match[1] === '/', name: match[2], attrs, selfClose: match[4] === '/' }
  }
}

export function parseAtlControls(xml: string, into?: AtlControls): AtlControls {
  const result: AtlControls = into || {
    triggers: new Map(),
    switches: new Map(),
    rtpcs: new Map(),
    environments: new Map(),
  }
  let trigger: AtlTrigger = null
  let switchStates: Map<string, AtlSwitchTarget[]> = null
  let stateTargets: AtlSwitchTarget[] = null
  let wwiseGroup: { kind: 'switch' | 'state'; name: string } = null
  let rtpc: string[] = null
  let environment: string[] = null

  for (const tag of scanTags(xml)) {
    const name = tag.attrs['atl_name']
    const wwiseName = tag.attrs['wwise_name']
    if (tag.close) {
      switch (tag.name) {
        case 'ATLTrigger':
          trigger = null
          break
        case 'ATLSwitch':
          switchStates = null
          break
        case 'ATLSwitchState':
          stateTargets = null
          break
        case 'WwiseSwitch':
        case 'WwiseState':
          wwiseGroup = null
          break
        case 'ATLRtpc':
          rtpc = null
          break
        case 'ATLEnvironment':
          environment = null
          break
      }
      continue
    }
    switch (tag.name) {
      case 'ATLTrigger': {
        trigger = { name, events: [], maxRadius: 0, maxDuration: -1 }
        result.triggers.set(name.toLowerCase(), trigger)
        break
      }
      case 'WwiseEvent': {
        trigger?.events.push(wwiseName)
        break
      }
      case 'TriggerPlaybackInfo': {
        if (trigger) {
          trigger.maxRadius = Number(tag.attrs['MaxRadius']) || 0
          trigger.maxDuration = Number(tag.attrs['MaxDuration'] ?? -1)
        }
        break
      }
      case 'ATLSwitch': {
        switchStates = new Map()
        result.switches.set(name.toLowerCase(), switchStates)
        break
      }
      case 'ATLSwitchState': {
        stateTargets = []
        switchStates?.set(name.toLowerCase(), stateTargets)
        break
      }
      case 'WwiseSwitch':
      case 'WwiseState': {
        wwiseGroup = { kind: tag.name === 'WwiseSwitch' ? 'switch' : 'state', name: wwiseName }
        break
      }
      case 'WwiseValue': {
        if (stateTargets && wwiseGroup) {
          stateTargets.push({ kind: wwiseGroup.kind, group: wwiseGroup.name, value: wwiseName })
        }
        break
      }
      case 'WwiseRtpc': {
        if (stateTargets) {
          stateTargets.push({
            kind: 'rtpc',
            group: wwiseName,
            value: '',
            rtpcValue: Number(tag.attrs['wwise_value']) || 0,
          })
        } else if (rtpc) {
          rtpc.push(wwiseName)
        }
        break
      }
      case 'ATLRtpc': {
        rtpc = []
        result.rtpcs.set(name.toLowerCase(), rtpc)
        break
      }
      case 'ATLEnvironment': {
        environment = []
        result.environments.set(name.toLowerCase(), environment)
        break
      }
      case 'WwiseAuxBus': {
        environment?.push(wwiseName)
        break
      }
    }
  }
  return result
}

/**
 * Parses `libs/gameaudio/wwise/preloaddata.xml`, keyed by lower cased preload name
 */
export function parseAtlPreloads(xml: string): Map<string, AtlPreload> {
  const result = new Map<string, AtlPreload>()
  let preload: AtlPreload = null
  let group = ''
  for (const tag of scanTags(xml)) {
    if (tag.close) {
      if (tag.name === 'ATLPreloadRequest') {
        preload = null
      }
      if (tag.name === 'ATLConfigGroup') {
        group = ''
      }
      continue
    }
    switch (tag.name) {
      case 'ATLPreloadRequest': {
        const name = tag.attrs['atl_name']
        preload = { name, autoLoad: tag.attrs['atl_type'] === 'AutoLoad', files: [] }
        result.set(name.toLowerCase(), preload)
        break
      }
      case 'ATLConfigGroup': {
        group = tag.attrs['atl_name']
        break
      }
      case 'WwiseFile': {
        const file = tag.attrs['wwise_name']?.toLowerCase()
        if (preload && group === 'default' && file && !preload.files.includes(file)) {
          preload.files.push(file)
        }
        break
      }
    }
  }
  return result
}

/**
 * The trigger bank map (`libs/gameaudio/wwise/triggerbankmapatlbin.bin`): 16 byte records of four u32 crcs.
 * A record names an event (by `AZ::Crc32` of its name) together with the banks it needs.
 */
export class TriggerBankMap {
  private records: Uint32Array
  private bankByCrc = new Map<number, string>()

  public constructor(data: ArrayBufferLike | Uint8Array, bankFiles: Iterable<string>) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const count = Math.floor(bytes.byteLength / 4)
    this.records = new Uint32Array(count)
    for (let i = 0; i < count; i++) {
      this.records[i] = view.getUint32(i * 4, true)
    }
    for (const file of bankFiles) {
      const stem = file
        .toLowerCase()
        .replace(/^.*\//, '')
        .replace(/\.bnk$/, '')
      this.bankByCrc.set(azCrc32(stem), stem + '.bnk')
    }
  }

  /**
   * Bank file names that the map associates with the given Wwise event name
   */
  public banksForEvent(eventName: string): string[] {
    const crc = azCrc32(eventName)
    const result = new Set<string>()
    for (let i = 0; i + 4 <= this.records.length; i += 4) {
      if (
        this.records[i] !== crc &&
        this.records[i + 1] !== crc &&
        this.records[i + 2] !== crc &&
        this.records[i + 3] !== crc
      ) {
        continue
      }
      for (let k = 0; k < 4; k++) {
        const bank = this.bankByCrc.get(this.records[i + k])
        if (bank) {
          result.add(bank)
        }
      }
    }
    return [...result]
  }
}

/**
 * `sounds/wwise/soundbank_tract_mapping.csv`: tract name → wildlife preload prefix (e.g. `amb_wildlife_coast_`)
 */
export function parseTractMapping(csv: string): Map<string, string> {
  const result = new Map<string, string>()
  const lines = csv.split(/\r?\n/)
  for (let i = 1; i < lines.length; i++) {
    const [tract, bank] = lines[i].split(',')
    if (tract && bank) {
      result.set(tract.trim().toLowerCase(), bank.trim().toLowerCase())
    }
  }
  return result
}
