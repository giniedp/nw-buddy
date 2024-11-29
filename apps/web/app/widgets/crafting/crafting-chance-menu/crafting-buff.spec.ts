import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { CraftingBuffGroup, CraftingBuffStore } from './crafting-buff.store'
import { CraftingTradeskill } from '@nw-data/generated'

fdescribe('CraftingBuffStore', () => {
  let store: CraftingBuffStore = null
  beforeAll(async () => {
    TestBed.configureTestingModule({
      providers: [CraftingBuffStore, provideExperimentalZonelessChangeDetection()],
    })
    store = TestBed.inject(CraftingBuffStore)
    store.load()
    await store.whenDoneLoading()
  })

  describe('Engineering', () => {
    let groups: CraftingBuffGroup[]
    beforeEach(() => {
      groups = store.buffs().Engineering
    })

    it('resolves 5 categories', () => {
      expect(groups.length).toBe(5)
    })

    it('resolves food, 1 stack, 1 variant', () => {
      const group = groups.find((it) => it.id === 'food')
      expect(group).toBeDefined()
      expect(group.stack).toBe(1)
      expect(group.buffs.length).toBe(1)
      expect(group.buffs[0].effect).toBe('FoodEngineerT5')
    })

    it('resolves townBuff, 1 stack, 1 variant', () => {
      const group = groups.find((it) => it.id === 'townBuff')
      expect(group).toBeDefined()
      expect(group.stack).toBe(1)
      expect(group.buffs.length).toBe(1)
      expect(group.buffs[0].effect).toBe('EngineersPatienceLSB')
    })

    it('resolves trophy, 3 stacks, 4 variants', () => {
      const group = groups.find((it) => it.id === 'trophy')
      expect(group).toBeDefined()
      expect(group.stack).toBe(3)
      expect(group.buffs.length).toBe(4)
      expect(group.buffs[0].effect).toBe('HousingMinGearBonus_AllCraftingT3')
      expect(group.buffs[1].effect).toBe('HousingMinGearBonusEngineeringT1')
      expect(group.buffs[2].effect).toBe('HousingMinGearBonusEngineeringT2')
      expect(group.buffs[3].effect).toBe('HousingMinGearBonusEngineeringT3')
    })

    it('resolves armor, 10 stacks, 1 variant', () => {
      const group = groups.find((it) => it.id === 'Armor')
      expect(group).toBeDefined()
      expect(group.stack).toBe(10)
      expect(group.buffs.length).toBe(1)
      expect(group.buffs[0].effect).toBe('Status_Perk_Armor_Engineer')
    })

    it('resolves earring, 10 stacks, 1 variant', () => {
      const group = groups.find((it) => it.id === 'EquippableToken')
      expect(group).toBeDefined()
      expect(group.stack).toBe(10)
      expect(group.buffs.length).toBe(1)
      expect(group.buffs[0].effect).toBe('Status_Perk_Earring_Engineer')
    })
  })
})
