import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { CraftingBuffStore } from './crafting-buff.store'

describe('CraftingBuffStore', () => {
  let store: CraftingBuffStore = null
  beforeAll(async () => {
    TestBed.configureTestingModule({
      providers: [CraftingBuffStore, provideZonelessChangeDetection()],
    })
    store = TestBed.inject(CraftingBuffStore)
    store.load()
    await store.whenDoneLoading()
  })

  describe('Engineering Max GS', () => {
    beforeEach(() => {
      store.clearSettings()
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(0)
    })

    it('has town buff, max stack 1', () => {
      store.setSetting('engineerspatiencelsb', 1)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(5)
      store.setSetting('engineerspatiencelsb', 2)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(5)
    })

    it('has food buff, max stack 1', () => {
      store.setSetting('foodengineert5', 1)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(15)
      store.setSetting('foodengineert5', 2)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(15)
    })

    it('has armor buff, max stack 5', () => {
      store.setSetting('Status_Perk_Armor_Engineer', 1)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(2)
      store.setSetting('Status_Perk_Armor_Engineer', 2)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(4)
      store.setSetting('Status_Perk_Armor_Engineer', 3)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(6)
      store.setSetting('Status_Perk_Armor_Engineer', 4)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(8)
      store.setSetting('Status_Perk_Armor_Engineer', 5)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(10)
      //
      store.setSetting('Status_Perk_Armor_Engineer', 6)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(10)
    })

    it('has earring buff, max stack 1', () => {
      store.setSetting('Status_Perk_Earring_Engineer', 1)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(5)
      store.setSetting('Status_Perk_Earring_Engineer', 2)
      expect(store.getTradeskillBonusForGS('Engineering').total).toBe(5)
    })
  })

  describe('Standing', () => {
    beforeEach(() => {
      store.clearSettings()
      expect(store.getTerritoryBonusForEXP()).toBe(0)
    })
    it('has music buff', () => {
      store.setSetting('musicbuff_territorystanding_t1_bad', 1)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.1)
      store.setSetting('musicbuff_territorystanding_t1_bad', 0)

      store.setSetting('musicbuff_territorystanding_t2_okay', 1)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.15)
      store.setSetting('musicbuff_territorystanding_t2_okay', 0)

      store.setSetting('musicbuff_territorystanding_t3_great', 1)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.2)
      store.setSetting('musicbuff_territorystanding_t3_great', 0)

      store.setSetting('musicbuff_territorystanding_t4_amazing', 1)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.3)
    })

    it('has token buff', () => {
      store.setSetting('token_territory_1', 1)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(1)
    })

    it('has bags buff, stack 3', () => {
      store.setSetting('PerkID_Bags_BonusTown', 1)
      store.setSetting('PerkID_Bags_BonusTown:gs', 700)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.15)

      store.setSetting('PerkID_Bags_BonusTown', 2)
      store.setSetting('PerkID_Bags_BonusTown:gs', 700)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.3)

      store.setSetting('PerkID_Bags_BonusTown', 3)
      store.setSetting('PerkID_Bags_BonusTown:gs', 700)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.45)

      store.setSetting('PerkID_Bags_BonusTown', 4)
      store.setSetting('PerkID_Bags_BonusTown:gs', 700)
      expect(store.getTerritoryBonusForEXP()).toBeCloseTo(0.45) // stays at 3 * 0.15
    })

    xit('has standing cards buff', () => {
      // TODO:
    })
  })
})
