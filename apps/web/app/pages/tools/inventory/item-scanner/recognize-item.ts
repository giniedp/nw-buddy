import {
  getItemMaxGearScore,
  isItemArmor,
  isItemJewelery,
  isItemOfAnyClass,
  isItemSwordOrShield,
  isItemWeapon,
  isPerkApplicableToItem,
  isPerkGem,
  isPerkGenerated,
  isPerkInherent,
} from '@nw-data/common'
import { AffixStatData, ItemClass, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { diceCoefficient } from 'dice-coefficient'
import { sortBy } from 'lodash'
import { ItemInstance } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { ImageLike } from '~/utils/use-tesseract'
import { findAttributeCandidates, findPerkCandidates } from './find-perk-candidates'
import { recognizeItemDetails } from './recognize-item-details'
import { recognizeTextFromImage } from './recognize-text-from-image'
import { selectItemPool } from './select-item-pool'
import { selectPerkPool } from './select-perk-pool'
import { PoolItem, PoolPerk, TranslateFn } from './types'

export interface ItemRecognitionResult {
  rating: number
  name: string
  instance: ItemInstance
}

export async function recognizeItemFromImage(options: {
  image: ImageLike
  itemClass: ItemClass[]
  items: MasterItemDefinitions[]
  affixMap: Map<string, AffixStatData>
  perksMap: Map<string, PerkData>
  tl8: TranslateFn
}) {
  const itemPool = selectItemPool(options)
  const perkPool = selectPerkPool(options)

  const lines = await recognizeTextFromImage(options.image)
  const detail = await recognizeItemDetails(lines, options.tl8)

  const attrCandidates = findAttributeCandidates({
    perks: perkPool.attributes,
    names: detail.attributes,
    itemClass: options.itemClass,
  })
  const perkCandidates = findPerkCandidates({
    perks: perkPool.perksAndGems,
    names: detail.perks,
    itemClass: options.itemClass,
  })

  const results: Array<ItemRecognitionResult> = []
  for (const item of itemPool) {
    const result = buildItem({
      item,
      name: detail.name,
      gearScore: detail.gearScore,
      attrPerks: attrCandidates,
      otherPerks: perkCandidates,
    })
    if (result) {
      results.push(result)
    }
  }

  const result = sortBy(results, (it) => it.rating).reverse()

  // console.debug({
  //   lines,
  //   scanInfo: detail,
  //   scannedAttributes: attrCandidates,
  //   scannedPerks: perkCandidates,
  //   results,
  //   result,
  // })
  return result
}

function isAplicable(item: MasterItemDefinitions, perk: PerkData) {
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
      result = isItemOfAnyClass(perk, ['EquippableChest'])
    }
    if (isWeapon && !result && !isSwordOrShield) {
      // if perk has item class 'Hatchet' then it has all the classes
      //   Hatchet Rapier Spear 2HHammer 2hAxe Bow Musket FireStaff LifeStaff IceMagic VoidGauntlet Blunderbuss GreatSword
      result = isItemOfAnyClass(perk, ['Hatchet'])
    }
    if (isWeapon && !result && isSwordOrShield) {
      // if perk has item class 'Sword' then it has all the classes
      //   Sword Shield
      // HINT: should not enter this case, as 'Sword Shield' intersects with
      result = isItemOfAnyClass(perk, ['Sword', 'Flail'])
    }
  } else {
    if (isArmor && !result) {
      result = isItemOfAnyClass(perk, ['Armor'])
    }
    if (isWeapon && !result) {
      result = isItemOfAnyClass(perk, ['EquippableMainHand', 'EquippableTwoHand'])
    }
  }
  return result
}

function buildItem({
  item,
  gearScore,
  attrPerks,
  otherPerks,
  name,
}: {
  item: PoolItem
  name: string
  gearScore: number
  attrPerks: PoolPerk[]
  otherPerks: PoolPerk[]
}) {
  const result: ItemInstance = {
    itemId: item.item.ItemID,
    gearScore: gearScore ?? getItemMaxGearScore(item.item),
    perks: {},
  }

  let rating = 0

  const gemPerk = otherPerks.find((it) => isPerkGem(it.perk))
  const gemSlot = item.slots.find((it) => isGemPerkIdOrBucket(it.perkId || it.bucketId))
  if (gemPerk && gemSlot) {
    rating += gemPerk.rating
    if (gemSlot.bucketId || !eqCaseInsensitive(gemSlot.perkId, gemPerk.perk.PerkID)) {
      result.perks[gemSlot.bucketKey || gemSlot.perkKey] = gemPerk.perk.PerkID
    }
  }

  const attrPerk = attrPerks.find((perk) => isAplicable(item.item, perk.perk))
  const attrSlot = item.slots.find((it) => isAttributePerkIdOrBucket(it.perkId || it.bucketId))
  if (attrPerk && attrSlot) {
    rating += attrPerk.rating
    if (attrSlot.bucketId || !eqCaseInsensitive(attrSlot.perkId, attrPerk.perk.PerkID)) {
      result.perks[attrSlot.bucketKey || attrSlot.perkKey] = attrPerk.perk.PerkID
    }
  }

  const restPerks = otherPerks.filter((it) => isPerkGenerated(it.perk))
  const fixedSlots = item.slots
    .filter((it) => !!it.perkId)
    .filter((it) => !isGemPerkIdOrBucket(it.perkId) && !isAttributePerkIdOrBucket(it.perkId))
  const craftSlots = item.slots
    .filter((it) => !!it.bucketId)
    .filter((it) => !isGemPerkIdOrBucket(it.bucketId) && !isAttributePerkIdOrBucket(it.bucketId))

  for (const slot of fixedSlots) {
    const index = restPerks.findIndex((it) => eqCaseInsensitive(slot.perkId, it.perk.PerkID))
    if (index >= 0) {
      const perk = restPerks[index]
      rating += perk.rating
      restPerks.splice(index, 1)
    }
  }
  for (const slot of sortBy(craftSlots, (it) => it.bucketId)) {
    const perk = restPerks.shift()
    if (perk) {
      rating += perk.rating
      result.perks[slot.bucketKey || attrSlot.perkKey] = perk.perk.PerkID
    }
  }

  let itemName = [item.name]
  if (!item.item.IgnoreNameChanges) {
    if (gemPerk?.prefix) {
      itemName.unshift(gemPerk.prefix)
    }
    if (attrPerk?.suffix) {
      itemName.push(attrPerk.suffix)
    }
  }
  rating += diceCoefficient(itemName.join(' '), name)

  return {
    rating: rating,
    name: itemName.join(' '),
    instance: result,
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
