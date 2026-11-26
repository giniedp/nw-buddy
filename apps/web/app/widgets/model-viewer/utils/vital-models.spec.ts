import type { ScannedEquipType, ScannedVitalModel } from '@nw-data/generated'
import { mergeVitalModels, relatedVitalId, vitalModelLabel, vitalModelSockets, vitalModelTags } from './vital-models'

const CLEAVER = { item: 'Cleaver', mesh: 'objects/cleaver.cdf', equipType: 'RHand', offHand: false }

function model(id: string, values: Partial<ScannedVitalModel> = {}): ScannedVitalModel {
  return {
    id,
    model: 'vitals/cook.cdf',
    cdf: 'cook.cdf',
    mtl: '',
    overcoat: '',
    adb: 'cook.adb',
    tags: ['Cook'],
    weaponTags: ['Cleaver'],
    weapons: [CLEAVER],
    spawnAction: 'Spawn',
    table: 'cook.xml',
    vitalIds: [],
    ...values,
  }
}

const RHAND: ScannedEquipType = {
  id: 'RHand',
  drawn: { name: 'righthandattach', position: [1, 2, 3], rotation: [0, 90, 0] },
  sheathed: null,
  offHandDrawn: { name: 'lefthandattach', position: [0, 0, 0], rotation: [0, 0, 0] },
  offHandSheathed: null,
}
const SHIELD: ScannedEquipType = { ...RHAND, id: 'Shield', drawn: null }
const TYPES = new Map([
  ['RHand', RHAND],
  ['Shield', SHIELD],
])

describe('mergeVitalModels', () => {
  it('merges the slices of the same state, the first one stays', () => {
    const merged = mergeVitalModels([model('a'), model('b'), model('c', { weaponTags: ['Ladle'] })])
    expect(merged.map((it) => it.id)).toEqual(['a', 'c'])
  })

  it('keeps models with other weapons, databases and damage tables', () => {
    const models = [model('a'), model('b', { weapons: [] }), model('c', { adb: 'x' }), model('d', { table: 'x' })]
    expect(mergeVitalModels(models).length).toBe(4)
  })
})

describe('vitalModelTags', () => {
  it('joins the default and the weapon tags', () => {
    expect(vitalModelTags(model('a', { tags: ['A', 'B'], weaponTags: ['B', 'C'] }))).toEqual(['A', 'B', 'C'])
  })
})

describe('vitalModelLabel', () => {
  it('is the slice name', () => {
    expect(vitalModelLabel(model('slices/characters/damned_villager_cleaver'))).toBe('Damned Villager Cleaver')
  })
})

describe('vitalModelSockets', () => {
  it('places the weapons on the sockets of their hands', () => {
    const sockets = vitalModelSockets([CLEAVER, { ...CLEAVER, offHand: true }], TYPES)
    expect(sockets.map((it) => it.name)).toEqual(['righthandattach', 'lefthandattach'])
    expect(sockets[0].models).toEqual([{ url: '/objects/cleaver.cdf.glb', source: { model: 'objects/cleaver.cdf' } }])
    expect(sockets[0].offset).toEqual({ position: [1, 2, 3], rotation: [0, 90, 0] })
  })

  it('takes the socket of the other hand when the equip type has none', () => {
    const [socket] = vitalModelSockets([{ ...CLEAVER, equipType: 'Shield' }], TYPES)
    expect(socket.name).toBe('lefthandattach')
  })

  it('leaves out weapons without a mesh', () => {
    expect(vitalModelSockets([{ ...CLEAVER, mesh: '' }], TYPES)).toEqual([])
  })

  it('takes the first socket without an equip type', () => {
    expect(vitalModelSockets([{ ...CLEAVER, equipType: '' }], TYPES)).toEqual([
      {
        name: '',
        models: [{ url: '/objects/cleaver.cdf.glb', source: { model: 'objects/cleaver.cdf' } }],
        offset: {},
      },
    ])
  })
})

describe('relatedVitalId', () => {
  const vitals = new Map([
    ['Other_15', { BaseVitalsId: 'Other' }],
    ['Bison_15', { BaseVitalsId: 'Bison' }],
  ])

  it('is the vital with the same base row', () => {
    expect(relatedVitalId(model('a', { vitalIds: ['Other_15', 'Bison_15'] }), 'bison', vitals)).toBe('Bison_15')
  })
})
