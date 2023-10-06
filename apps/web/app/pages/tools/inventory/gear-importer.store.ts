import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  EQUIP_SLOTS,
  EquipSlotId,
  EquipSlotItemType,
  NW_MAX_GEAR_SCORE,
  getItemMaxGearScore,
  getItemPerkInfos,
  getPerkMultiplier,
  getPerksInherentMODs,
  isItemArmor,
  isItemJewelery,
  isItemSwordOrShield,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkGem,
  isPerkGenerated,
  isPerkInherent,
} from '@nw-data/common'
import { Affixstats, ItemClass, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { diceCoefficient } from 'dice-coefficient'
import { sortBy, sum } from 'lodash'
import { of } from 'rxjs'
import { ItemInstance } from '~/data'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive } from '~/utils'

export interface GearImporterState {
  file: File
  slotId: EquipSlotId
  recognition: string[]
  selection: number
  filter: string
}

export interface Item {
  name: string
  item: ItemDefinitionMaster
  perkInfos: Array<{ key: string; perkId?: string; bucketId?: string }>
}

export interface Perk {
  name: string
  perk: Perks
  suffix?: string
  prefix?: string
  mods?: Array<{ label: string; value: number }>
}

@Injectable()
export class GearImporterStore extends ComponentStore<GearImporterState> {
  public readonly itemType$ = this.select(({ slotId }) => EQUIP_SLOTS.find((it) => it.id === slotId)?.itemType)
  public readonly imageFile$ = this.select(({ file }) => file)
  public readonly imageUrl$ = this.select(this.imageFile$, (it) => (it ? URL.createObjectURL(it) : null))
  public readonly recognition$ = this.select(({ recognition }) => recognition || [])
  public readonly selection$ = this.select(({ selection }) => selection)
  public readonly filter$ = this.select(({ filter }) => filter)
  public readonly working$ = this.select(({ file, recognition }) => !!file && !recognition?.length)
  private items$ = this.select(this.db.items, this.itemType$, of(this.tl8), selectItems)
  private perks$ = this.select(this.db.perks, of(this.tl8), selectPerks)
  private inherentPerks$ = this.select(this.db.perks, this.db.affixstatsMap, of(this.tl8), selectInherentPerks)

  public readonly itemCandidates$ = this.select(this.items$, this.recognition$, selectItemCandidates)
  public readonly inherentCandidates$ = this.select(this.inherentPerks$, this.recognition$, selectInherentCandidates)
  public readonly perkCandidates$ = this.select(this.perks$, this.recognition$, selectPerkCandidates)
  public readonly result$ = this.select(this.recognition$, this.items$, this.inherentPerks$, this.perks$, selectResult)

  public readonly filteredResult$ = this.select(this.filter$, this.result$, (query, results) => {
    if (!query) {
      return results
    }
    query = query.toLowerCase()
    return results.filter((it) => it.name.toLowerCase().includes(query))
  })
  public constructor(private db: NwDbService, private tl8: TranslateService) {
    super({
      file: null,
      slotId: null,
      recognition: null,
      selection: 0,
      filter: null,
    })
  }
}

function selectItems(items: ItemDefinitionMaster[], type: EquipSlotItemType, tl8: TranslateService) {
  return items
    .filter((it) => it.ItemClass?.includes(type as ItemClass))
    .map((it): Item => {
      return {
        item: it,
        name: tl8.get(it.Name),
        perkInfos: getItemPerkInfos(it),
      }
    })
}

function selectInherentPerks(perks: Perks[], affixMap: Map<string, Affixstats>, tl8: TranslateService) {
  return perks
    .filter((it) => isPerkInherent(it))
    .map(
      (perk): Perk => ({
        name: tl8.get(perk.DisplayName),
        suffix: perk.AppliedSuffix ? tl8.get(perk.AppliedSuffix) : null,
        perk: perk,
        mods: getPerksInherentMODs(perk, affixMap.get(perk.Affix), getPerkMultiplier(perk, NW_MAX_GEAR_SCORE))
          .map((it) => ({
            label: tl8.get(it.label),
            value: Math.floor(it.value),
          }))
          .sort((a, b) => b.value - a.value),
      })
    )
}

function selectPerks(perks: Perks[], tl8: TranslateService) {
  return perks
    .filter((it) => !isPerkInherent(it))
    .map(
      (perk): Perk => ({
        name: tl8.get(perk.DisplayName),
        prefix: perk.AppliedPrefix ? tl8.get(perk.AppliedPrefix) : null,
        perk: perk,
      })
    )
}

function selectItemCandidates(items: Item[], recognition: string[]) {
  if (!recognition?.length) {
    return []
  }
  return items
    .map((it) => {
      return {
        item: it,
        rating: diceCoefficient(recognition[0], it.name),
      }
    })
    .sort((a, b) => b.rating - a.rating)
}

function selectInherentCandidates(perks: Perk[], recognition: string[]) {
  // get attribute lines (starting with a "+")
  // primary attribute is always on top (highest value)
  recognition = recognition.map((it) => it.match(/\+\s*\d+\s*(.*)/)?.[1]).filter((it) => !!it && !it.includes('%'))
  if (!recognition?.length) {
    return []
  }
  // console.debug('selectInherentCandidates', recognition)
  return perks
    .map((perk) => {
      const mods = perk.mods.map((mod, i) => {
        return {
          mod,
          rating: (recognition[i] ? diceCoefficient(mod.label, recognition[i]) : -1) / recognition.length,
        }
      })
      return {
        perk,
        rating: sum(mods.map((mod) => mod.rating)),
      }
    })
    .sort((a, b) => b.rating - a.rating)
}

function selectPerkCandidates(perks: Perk[], recognition: string[]) {
  // get perk lines (including a colo ":")
  recognition = recognition.filter((it) => it.includes(':')).map((it) => it.split(':')[0])
  if (!recognition?.length) {
    return []
  }
  // console.debug('selectPerkCandidates', recognition)
  return recognition.map((label) => {
    return {
      label,
      perks: perks
        .map((perk) => {
          return {
            perk,
            rating: diceCoefficient(perk.name, label),
          }
        })
        .sort((a, b) => b.rating - a.rating),
    }
  })
}

function selectResult(
  recognition: string[],
  items: Item[],
  inherent: Perk[],
  perks: Perk[]
): Array<{ name: string; instance: ItemInstance }> {
  if (!recognition.length) {
    return []
  }
  const cItems = selectItemCandidates(items, recognition).map((it) => it.item)
  const cInherent = selectInherentCandidates(inherent, recognition)
    .filter((it, _, list) => it.rating === list[0].rating)
    .map((it) => it.perk)
  const cPerks = selectPerkCandidates(perks, recognition).map((it) => it.perks[0].perk)
  // console.debug({
  //   cItems,
  //   cInherent,
  //   cPerks,
  // })
  const results: Array<{ name: string; instance: ItemInstance }> = []
  for (const item of cItems) {
    // if (item.item.ItemID === "2hDemoHammerT5") {
    //   debugger
    // }
    const attrPerk = cInherent.find((perk) => isAplicable(item.item, perk.perk))
    // if (!attrPerk) {
    //   debugger
    // }
    const result = createResult(item, [attrPerk, ...cPerks])
    if (result.attrConsumed && result.gemConsumed && result.perksConsumed) {
      results.push(result)
    }
  }
  return results
}

// function isPerkEquipableToItem(perk: Perk, item: Item) {
//   const info = item.perkInfos.find(({ perkId }) => {
//     return eqCaseInsensitive(perkId, perk.perk.PerkID)
//   })
//   if (info) {
//     return true
//   }
//   if (item.item.ItemClass.some((iClass) => perk.perk.ItemClass.some((pClass) => eqCaseInsensitive(iClass, pClass)))) {
//     return true
//   }
//   return false
// }

function createResult(item: Item, perks: Perk[]) {
  perks = perks.filter((it) => !!it)
  const result: ItemInstance = {
    itemId: item.item.ItemID,
    gearScore: getItemMaxGearScore(item.item),
    perks: {},
  }

  // if (item.itemId === 'HeavyLegs_Dungeon6T5') {
  //   debugger
  // }

  const gemPerk = perks.find((it) => isPerkGem(it.perk))
  const gemSlot = item.perkInfos.find((it) => isGemPerkIdOrBucket(it.perkId || it.bucketId))
  let gemConsumed = !gemPerk
  if (gemPerk && gemSlot) {
    gemConsumed = true
    if (gemSlot.bucketId || !eqCaseInsensitive(gemSlot.perkId, gemPerk.perk.PerkID)) {
      result.perks[gemSlot.key] = gemPerk.perk.PerkID
    }
  }

  const attrPerk = perks.find((it) => isPerkInherent(it.perk))
  const attrSlot = item.perkInfos.find((it) => isAttributePerkIdOrBucket(it.perkId || it.bucketId))
  let attrConsumed = !attrPerk
  if (attrPerk && attrSlot) {
    attrConsumed = true
    if (attrSlot.bucketId || !eqCaseInsensitive(attrSlot.perkId, attrPerk.perk.PerkID)) {
      result.perks[attrSlot.key] = attrPerk.perk.PerkID
    }
  }

  const restPerks = perks.filter((it) => isPerkGenerated(it.perk))
  const fixedSlots = item.perkInfos
    .filter((it) => !!it.perkId)
    .filter((it) => !isGemPerkIdOrBucket(it.perkId) && !isAttributePerkIdOrBucket(it.perkId))
  const craftSlots = item.perkInfos
    .filter((it) => !!it.bucketId)
    .filter((it) => !isGemPerkIdOrBucket(it.bucketId) && !isAttributePerkIdOrBucket(it.bucketId))

  for (const slot of fixedSlots) {
    const index = restPerks.findIndex((it) => eqCaseInsensitive(slot.perkId, it.perk.PerkID))
    if (index >= 0) {
      restPerks.splice(index, 1)
    }
  }
  for (const slot of sortBy(craftSlots, (it) => it.bucketId)) {
    const perk = restPerks.shift()
    if (perk) {
      result.perks[slot.key] = perk.perk.PerkID
    }
  }
  return {
    name: item.name,
    instance: result,
    gemConsumed,
    attrConsumed,
    perksConsumed: !restPerks.length,
  }
}

function isGemPerkIdOrBucket(id: string) {
  id = (id || '').toLowerCase()
  return id.includes('gem')
}

function isAttributePerkIdOrBucket(id: string) {
  id = (id || '').toLowerCase()
  return id.includes('attribute') || id.includes('_stat_')
}

function isAplicable(item: ItemDefinitionMaster, perk: Perks) {
  if (
    item.Perk1 === perk.PerkID ||
    item.Perk2 === perk.PerkID ||
    item.Perk3 === perk.PerkID ||
    item.Perk4 === perk.PerkID ||
    item.Perk5 === perk.PerkID
  ) {
    return true
  }
  const isSwordOrShield = isItemSwordOrShield(item)
  const isWeapon = isItemWeapon(item)
  const isArmor = isItemArmor(item) || isItemJewelery(item)
  let result = isPerkApplicableToItem(perk, item)

  if (isPerkInherent(perk)) {
    if (isArmor && !result) {
      // if perk has item class 'EquippableChest' then it has all the classes
      //   EquippableChest EquippableLegs EquippableHead EquippableHands EquippableFeet EquippableAmulet EquippableRing EquippableToken
      result = perk.ItemClass?.includes('EquippableChest')
    }
    if (isWeapon && !result && !isSwordOrShield) {
      // if perk has item class 'Hatchet' then it has all the classes
      //   Hatchet Rapier Spear 2HHammer 2hAxe Bow Musket FireStaff LifeStaff IceMagic VoidGauntlet Blunderbuss GreatSword
      result = perk.ItemClass?.includes('Hatchet')
    }
    if (isWeapon && !result && isSwordOrShield) {
      // if perk has item class 'Sword' then it has all the classes
      //   Sword Shield
      // HINT: should not enter this case, as 'Sword Shield' intersects with
      result = perk.ItemClass?.includes('Sword')
    }
  } else {
    if (isArmor && !result) {
      result = perk.ItemClass?.includes('Armor')
    }
    if (isWeapon && !result) {
      result = perk.ItemClass?.includes('EquippableMainHand') || perk.ItemClass?.includes('EquippableTwoHand')
    }
  }
  return result
}
