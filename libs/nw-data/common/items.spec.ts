import { getItemRarity } from './item'

describe('item', () => {
  describe('getItemRarity', () => {
    const table = [
      {
        item: { ForceRarity: 0 },
        expect: 0,
      },
      {
        item: { ItemID: '' },
        expect: 0,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1' },
        expect: 1,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', ForceRarity: 0 },
        expect: 1,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2' },
        expect: 1,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2', ForceRarity: 0 },
        expect: 1,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2', ForceRarity: 1 },
        expect: 1,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2', Perk3: 'Perk3' },
        expect: 2,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2', Perk3: 'Perk3', Perk4: 'Perk4' },
        expect: 3,
      },
      {
        item: { ItemID: '', Perk1: 'Perk1', Perk2: 'Perk2', Perk3: 'Perk3', Perk4: 'Perk4', Perk5: 'Perk5' },
        expect: 3,
      },
      {
        item: {
          ItemID: '',
          Perk1: 'Perk1',
          Perk2: 'Perk2',
          Perk3: 'Perk3',
          Perk4: 'Perk4',
          Perk5: 'Perk5',
          Tier: 5,
          GearScoreOverride: 589,
        },
        expect: 3,
      },
      {
        item: {
          ItemID: '',
          Perk1: 'Perk1',
          Perk2: 'Perk2',
          Perk3: 'Perk3',
          Perk4: 'Perk4',
          Perk5: 'Perk5',
          Tier: 4,
          GearScoreOverride: 590,
        },
        expect: 3,
      },
      {
        item: {
          ItemID: '',
          Perk1: 'Perk1',
          Perk2: 'Perk2',
          Perk3: 'Perk3',
          Perk4: 'Perk4',
          Perk5: 'Perk5',
          Tier: 5,
          GearScoreOverride: 590,
        },
        expect: 4,
      },
    ]

    for (const test of table) {
      it(`should return ${test.expect} when ${JSON.stringify(test.item)}`, async () => {
        expect(getItemRarity(test.item as any)).toEqual(test.expect)
      })
    }
  })
})
