import { describe, expect, it } from 'vitest'
import { parseAtlControls, parseAtlPreloads, TriggerBankMap } from './atl'
import { getWwiseBankMedia, parseWwiseBank } from './bank'
import { azCrc32, wwiseShortId } from './hash'
import { parseHircObject, WwiseHircType } from './hirc'
import { WwiseLibrary } from './library'

class Writer {
  public bytes: number[] = []
  private view = new DataView(new ArrayBuffer(8))

  public u8(...values: number[]) {
    for (const value of values) {
      this.bytes.push(value & 0xff)
    }
    return this
  }
  public u16(value: number) {
    this.view.setUint16(0, value, true)
    return this.u8(this.view.getUint8(0), this.view.getUint8(1))
  }
  public u32(value: number) {
    this.view.setUint32(0, value, true)
    for (let i = 0; i < 4; i++) {
      this.bytes.push(this.view.getUint8(i))
    }
    return this
  }
  public f32(value: number) {
    this.view.setFloat32(0, value, true)
    for (let i = 0; i < 4; i++) {
      this.bytes.push(this.view.getUint8(i))
    }
    return this
  }
  public tag(value: string) {
    for (const c of value) {
      this.bytes.push(c.charCodeAt(0))
    }
    return this
  }
  public append(other: Writer | number[]) {
    this.bytes.push(...(other instanceof Writer ? other.bytes : other))
    return this
  }
  public toArray() {
    return new Uint8Array(this.bytes)
  }
}

/**
 * empty v150 NodeBaseParams (31 bytes) with optional props
 */
function nodeBase(parent: number, props: [number, number][] = []) {
  const w = new Writer()
  w.u8(0, 0) // fx override + count
  w.u8(0, 0) // metadata override + count
  w.u32(0) // override bus
  w.u32(parent)
  w.u8(0) // priority bits
  w.u8(props.length)
  for (const [id] of props) {
    w.u8(id)
  }
  for (const [, value] of props) {
    w.u32(value)
  }
  w.u8(0) // ranged props
  w.u8(0) // positioning bits
  w.u8(0) // aux bits
  w.u32(0) // reflections aux bus
  w.u8(0, 0).u16(0).u8(0, 0) // adv settings
  w.u8(0) // state props
  w.u8(0) // state groups
  w.u16(0) // rtpc curves
  return w
}

function object(type: number, id: number, body: Writer) {
  return new Writer()
    .u8(type)
    .u32(body.bytes.length + 4)
    .u32(id)
    .append(body)
}

function sound(id: number, mediaId: number, parent: number, loop?: number) {
  const body = new Writer().u32(0x00040001).u8(0).u32(mediaId).u32(4).u8(0)
  body.append(nodeBase(parent, loop === undefined ? [] : [[84, loop]]))
  return object(WwiseHircType.Sound, id, body)
}

function action(id: number, actionType: number, target: number) {
  return object(WwiseHircType.Action, id, new Writer().u16(actionType).u32(target).u8(0))
}

function event(id: number, actions: number[]) {
  const body = new Writer().u8(actions.length)
  for (const a of actions) {
    body.u32(a)
  }
  return object(WwiseHircType.Event, id, body)
}

function ranSeq(id: number, playlist: number[]) {
  const body = nodeBase(0)
  body.u16(1).u16(0).u16(0).f32(1000).f32(0).f32(0) // loop, transition
  body.u16(1) // avoid repeat
  body.u8(0, 1, 0, 0) // transition mode, random mode (shuffle), mode (random), flags
  const children = [...playlist].sort((a, b) => a - b)
  body.u32(children.length)
  for (const c of children) {
    body.u32(c)
  }
  body.u16(playlist.length)
  for (const p of playlist) {
    body.u32(p).u32(50000)
  }
  return object(WwiseHircType.RanSeqCntr, id, body)
}

function bank(objects: Writer[], media: [number, number[]][] = []) {
  const w = new Writer().tag('BKHD').u32(8).u32(150).u32(wwiseShortId('test'))
  if (media.length) {
    const didx = new Writer()
    const data = new Writer()
    for (const [id, bytes] of media) {
      didx.u32(id).u32(data.bytes.length).u32(bytes.length)
      data.append(bytes)
    }
    w.tag('DIDX').u32(didx.bytes.length).append(didx)
    w.tag('DATA').u32(data.bytes.length).append(data)
  }
  const hirc = new Writer().u32(objects.length)
  for (const o of objects) {
    hirc.append(o)
  }
  w.tag('HIRC').u32(hirc.bytes.length).append(hirc)
  return w.toArray()
}

describe('wwise hashes', () => {
  it('computes wwise short ids (FNV-1, lower cased)', () => {
    // event id found in sounds/wwise/ambiences.bnk
    expect(wwiseShortId('Play_QuadAmb_Wildlife')).toBe(289113846)
    expect(wwiseShortId('play_quadamb_wildlife')).toBe(289113846)
  })
  it('computes AZ::Crc32 over the lower cased name', () => {
    expect(azCrc32('ABC')).toBe(0x352441c2)
  })
})

describe('wwise bank', () => {
  const eventId = wwiseShortId('Play_Test')
  const data = bank(
    [event(eventId, [10]), action(10, 0x0403, 20), ranSeq(20, [31, 30]), sound(30, 1000, 20, 0), sound(31, 1001, 20)],
    [
      [1000, [1, 2, 3, 4]],
      [1001, [5, 6]],
    ],
  )

  it('parses sections and embedded media', () => {
    const b = parseWwiseBank(data)
    expect(b.version).toBe(150)
    expect(b.hirc.map((h) => h.type)).toEqual([4, 3, 5, 2, 2])
    expect([...getWwiseBankMedia(b, 1001)]).toEqual([5, 6])
  })

  it('parses typed objects and consumes their bodies', () => {
    const b = parseWwiseBank(data)
    const s = parseHircObject(b, b.hirc[3])
    expect(s.type).toBe(WwiseHircType.Sound)
    if (s.type === WwiseHircType.Sound) {
      expect(s.source.mediaId).toBe(1000)
      expect(s.node.parentId).toBe(20)
      expect(s.node.propsRaw.get(84)).toBe(0)
    }
  })

  it('rejects bodies that are not consumed exactly', () => {
    const broken = sound(40, 1, 0)
    broken.bytes[1] += 1 // claim one more byte
    broken.u8(0)
    const b = parseWwiseBank(bank([broken]))
    expect(() => parseHircObject(b, b.hirc[0])).toThrow()
  })

  it('builds an event tree across banks', () => {
    const lib = new WwiseLibrary()
    // events and structure in one bank, media in another
    lib.addBank(
      'test_events.bnk',
      bank([
        event(eventId, [10]),
        action(10, 0x0403, 20),
        ranSeq(20, [31, 30]),
        sound(30, 1000, 20),
        sound(31, 1001, 20),
      ]),
    )
    lib.addBank('test.bnk', bank([], [[1000, [1]]]))
    const tree = lib.buildEventTree('Play_Test')
    const node = tree.actions[0].node
    expect(node.kind).toBe('random')
    if (node.kind === 'random') {
      expect(node.mode).toBe('shuffle')
      expect(node.items.map((i) => (i.node.kind === 'sound' ? i.node.media : null))).toEqual([
        { id: 1001, streamed: false, bank: null },
        { id: 1000, streamed: false, bank: 'test.bnk' },
      ])
    }
    lib.removeBank('test.bnk')
    expect(lib.getMediaBank(1000)).toBeNull()
  })
})

describe('atl', () => {
  it('parses triggers and switch states', () => {
    const atl = parseAtlControls(`
      <ATLConfig>
        <AudioTriggers>
          <ATLTrigger atl_name="Play_AMB_3D_TorchPost_Lp">
            <WwiseEvent wwise_name="Play_AMB_3D_TorchPost_Lp"/>
            <TriggerPlaybackInfo MaxRadius="30" MaxDuration="-1"/>
          </ATLTrigger>
        </AudioTriggers>
        <AudioSwitches>
          <ATLSwitch atl_name="TOD_state">
            <ATLSwitchState atl_name="Day">
              <WwiseState wwise_name="TOD_state">
                <WwiseValue wwise_name="Day"/>
              </WwiseState>
            </ATLSwitchState>
          </ATLSwitch>
        </AudioSwitches>
      </ATLConfig>`)
    expect(atl.triggers.get('play_amb_3d_torchpost_lp')).toEqual({
      name: 'Play_AMB_3D_TorchPost_Lp',
      events: ['Play_AMB_3D_TorchPost_Lp'],
      maxRadius: 30,
      maxDuration: -1,
    })
    expect(atl.switches.get('tod_state').get('day')).toEqual([{ kind: 'state', group: 'TOD_state', value: 'Day' }])
  })

  it('parses preloads', () => {
    const preloads = parseAtlPreloads(`
      <ATLConfig>
        <AudioPreloads>
          <ATLPreloadRequest atl_name="global" atl_type="AutoLoad">
            <ATLConfigGroup atl_name="default"><WwiseFile wwise_name="Global.bnk"/></ATLConfigGroup>
            <ATLConfigGroup atl_name="high"><WwiseFile wwise_name="Global_HQ.bnk"/></ATLConfigGroup>
          </ATLPreloadRequest>
        </AudioPreloads>
      </ATLConfig>`)
    expect(preloads.get('global')).toEqual({ name: 'global', autoLoad: true, files: ['global.bnk'] })
  })

  it('maps events to banks by crc', () => {
    const map = new Uint8Array(16)
    const view = new DataView(map.buffer)
    view.setUint32(0, azCrc32('struct_torches_events'), true)
    view.setUint32(4, azCrc32('Play_AMB_3D_TorchPost_Lp'), true)
    view.setUint32(8, azCrc32('struct_torches'), true)
    const tbm = new TriggerBankMap(map, ['sounds/wwise/struct_torches.bnk', 'sounds/wwise/struct_torches_events.bnk'])
    expect(tbm.banksForEvent('Play_AMB_3D_TorchPost_Lp').sort()).toEqual([
      'struct_torches.bnk',
      'struct_torches_events.bnk',
    ])
    expect(tbm.banksForEvent('Play_Other')).toEqual([])
  })
})
