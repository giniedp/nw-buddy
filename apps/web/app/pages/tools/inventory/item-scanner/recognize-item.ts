import {
  ItemPerkSlot,
  NW_MAX_GEAR_SCORE,
  getItemMaxGearScore,
  getItemPerkSlots,
  getPerkMultiplier,
  getPerksInherentMODs,
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
import { Affixstats, ItemClass, ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { diceCoefficient } from 'dice-coefficient'
import { sortBy } from 'lodash'
import { ItemInstance } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { ImageLike, useTesseract } from '~/utils/use-tesseract'

export interface PerkData {
  name: string
  perk: Perks
  suffix?: string
  prefix?: string
  mods?: Array<{ label: string; value: number }>
  rating?: number
}

export interface ItemData {
  item: ItemDefinitionMaster
  name: string
  slots: ItemPerkSlot[]
}

export interface ItemRecognitionResult {
  name: string
  instance: ItemInstance
}

export type TranslateFn = (key: string) => string

export async function recognizeItemFromImage(options: {
  image: ImageLike
  itemClass: ItemClass[]
  items: ItemDefinitionMaster[]
  affixMap: Map<string, Affixstats>
  perksMap: Map<string, Perks>
  tl8: TranslateFn
}) {
  const items = selectItems(options)
  const perkList = Array.from(options.perksMap.values()).map((it) => getPerkData(it, options.affixMap, options.tl8))
  const perksAttrs = perkList.filter((it) => isPerkInherent(it.perk))
  const perksOther = perkList.filter((it) => !isPerkInherent(it.perk))

  const lines = await recognizeTextFromImage(options.image)
  const scanInfo = await scanRecognizedText(lines, options.tl8)

  const scannedAttributes = getAttributeCandidates(perksAttrs, scanInfo.attrNames)
  const scannedPerks = scanInfo.perkNames.map((scannedName) => getBestMatchingPerk(perksOther, scannedName))

  const results: Array<ItemRecognitionResult> = []
  for (const item of items) {
    const result = buildItem(item, scannedAttributes, scannedPerks)
    if (result.attrConsumed && result.gemConsumed && result.perksConsumed) {
      results.push(result)
    }
  }

  const result = sortBy(results, (it) => {
    return 1 - diceCoefficient(it.name, scanInfo.itemName)
  })

  return result
}

export async function recognizeTextFromImage(image: ImageLike) {
  const processedImage = await processAndTransformImage(image)
  const minConfidence = 10
  const tesseract = await useTesseract()
  const result = await tesseract.recognize(processedImage)
  const lines = result.data.lines.map((line) => {
    return line.words
      .filter((it) => it.confidence >= minConfidence)
      .map((it) => it.text.trim())
      .join(' ')
  })
  return lines
}

export async function scanRecognizedText(lines: string[], tl8: TranslateFn) {
  // Find the rarity line index and use it to get entire item name
  const LOCALIZED_ITEM_RARITIES = [
    tl8('RarityLevel0_DisplayName'),
    tl8('RarityLevel1_DisplayName'),
    tl8('RarityLevel2_DisplayName'),
    tl8('RarityLevel3_DisplayName'),
    tl8('RarityLevel4_DisplayName'),
    tl8('ui_artifact'),
  ]
  const rarity = LOCALIZED_ITEM_RARITIES.find((r) => lines.find((it) => it.includes(r)))
  const rarityIndex = lines.indexOf(rarity)
  let itemName = rarityIndex > -1 ? lines.slice(0, rarityIndex).join(' ').trim() : lines[0].trim()

  // Remove "of the" suffix if it exists
  // TODO: handle other languages that have translated "of the" suffixes
  const indexOfOfThe = itemName.indexOf('of the')
  if (indexOfOfThe !== -1) {
    itemName = itemName.slice(0, indexOfOfThe).trim()
  }

  // attributes names from text like "+26 Dexterity"
  const attrNames = lines.map((it) => it.match(/\+\s*\d+\s*(\w+)?/)?.[1]).filter((it) => !!it && !it.includes('%'))

  // perk names usually follow the pattern: "name: description" but ignore magnify "highest attribute:"
  // TODO: find a better way to exclude "highest attribute:" from perk names, this would only work for English
  const perkNames = lines
    .filter((it) => it.includes(':') && !it.includes('highest')) // take only lines with ':' and ignore "highest attribute:"
    .map((it) => it.split(':')[0]) // take only name
    .filter((it) => !!it) // remove empty lines

  return {
    itemName,
    attrNames,
    perkNames,
  }
}

function selectItems(options: {
  items: ItemDefinitionMaster[]
  itemClass: ItemClass[]
  perksMap: Map<string, Perks>
  tl8: TranslateFn
}): ItemData[] {
  return options.items
    .filter((it) => isItemOfAnyClass(it, options.itemClass))
    .map((it): ItemData => {
      const name = [options.tl8(it.Name)]
      const perkSlots = getItemPerkSlots(it)

      if (!it.IgnoreNameChanges) {
        for (const slot of perkSlots) {
          const perk = options.perksMap.get(slot.perkId)
          if (!perk) {
            continue
          }
          if (perk.AppliedPrefix) {
            name.unshift(options.tl8(perk.AppliedPrefix))
          }
          if (perk.AppliedSuffix) {
            name.push(options.tl8(perk.AppliedSuffix))
          }
        }
      }

      return {
        item: it,
        name: name.join(' '),
        slots: perkSlots,
      }
    })
}

function getPerkData(perk: Perks, affixMap: Map<string, Affixstats>, tl8: TranslateFn): PerkData {
  return {
    name: tl8(perk.DisplayName),
    prefix: perk.AppliedPrefix ? tl8(perk.AppliedPrefix) : null, // Arboreal ...
    suffix: perk.AppliedSuffix ? tl8(perk.AppliedSuffix) : null, // ... of the Ranger
    perk: perk,
    mods: !isPerkInherent(perk)
      ? null
      : getPerksInherentMODs(perk, affixMap.get(perk.Affix), getPerkMultiplier(perk, NW_MAX_GEAR_SCORE))
          .map((it) => ({
            label: tl8(it.label),
            value: Math.floor(it.value),
          }))
          .sort((a, b) => b.value - a.value),
  }
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

function getAttributeCandidates(perks: PerkData[], attrNames: string[]) {
  const result: PerkData[] = []
  for (const perk of perks) {
    let rating = 0
    for (let i = 0; i < perk.mods.length; i++) {
      const mod = perk.mods[i]
      rating += (attrNames[i] ? diceCoefficient(mod.label, attrNames[i]) : -1) / attrNames.length
    }
    result.push({
      ...perk,
      rating: rating,
    })
  }
  return (
    result
      .sort((a, b) => b.rating - a.rating)
      // e.g. DEX/CON and CON/DEX have same rating, keep all of them
      .filter((it, _, list) => it.rating === list[0].rating)
  )
}

function getBestMatchingPerk(perks: PerkData[], scannedName: string) {
  let rating: number = null
  let result: PerkData = null
  for (const perk of perks) {
    const r = diceCoefficient(perk.name, scannedName)
    if (r > rating) {
      rating = r
      result = perk
    }
  }
  return result
}

function buildItem(item: ItemData, attrPerks: PerkData[], otherPerks: PerkData[]) {
  const result: ItemInstance = {
    itemId: item.item.ItemID,
    gearScore: getItemMaxGearScore(item.item),
    perks: {},
  }

  const gemPerk = otherPerks.find((it) => isPerkGem(it.perk))
  const gemSlot = item.slots.find((it) => isGemPerkIdOrBucket(it.perkId || it.bucketId))
  let gemConsumed = !gemPerk
  if (gemPerk && gemSlot) {
    gemConsumed = true
    if (gemSlot.bucketId || !eqCaseInsensitive(gemSlot.perkId, gemPerk.perk.PerkID)) {
      result.perks[gemSlot.bucketKey || gemSlot.perkKey] = gemPerk.perk.PerkID
    }
  }

  const attrPerk = attrPerks.find((perk) => isAplicable(item.item, perk.perk))
  const attrSlot = item.slots.find((it) => isAttributePerkIdOrBucket(it.perkId || it.bucketId))
  let attrConsumed = !attrPerk
  if (attrPerk && attrSlot) {
    attrConsumed = true
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
      restPerks.splice(index, 1)
    }
  }
  for (const slot of sortBy(craftSlots, (it) => it.bucketId)) {
    const perk = restPerks.shift()
    if (perk) {
      result.perks[slot.bucketKey || attrSlot.perkKey] = perk.perk.PerkID
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

// Takes in the image and does some processing to make it easier for Tesseract to recognize the text we want
async function processAndTransformImage(imageBlob: ImageLike) {
  // Check if imageBlob is Blob or MediaSource, if not, return it early without processing it
  if (!(imageBlob instanceof Blob) && !(imageBlob instanceof MediaSource)) {
    return imageBlob
  }

  // Create an in-memory canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Create and load image from the blob
  const img = new Image()
  const imageUrl = URL.createObjectURL(imageBlob)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve()
    }
    img.onerror = reject
    img.src = imageUrl
  })

  // Resize canvas to maintain aspect ratio with a max width of 480
  const shrinkRatio = 480 / img.width
  canvas.width = img.width * shrinkRatio
  canvas.height = img.height * shrinkRatio

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0)

  // Grayscale conversion and curves effect
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const brightnessMin = 89 // Adjust this to tweak the how extreme the curve effect is, 89 seems to be a consistent min

  // Loop through each pixel and apply the effects
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = data[i + 1] = data[i + 2] = avg

    // Apply curves effect
    const brightness = avg
    if (brightness > brightnessMin) {
      const increase = (255 - brightness) * 1
      data[i] = data[i + 1] = data[i + 2] = Math.min(255, avg + increase)
    } else {
      const decrease = brightness * 1
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, avg - decrease)
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // Draw black squares on the canvas to cover up icons that can confuse Tesseract
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, 135, 135)
  ctx.fillRect(0, 0, 58, canvas.height)

  // Convert canvas to a data URL and then to a blob
  const dataURL = canvas.toDataURL('image/jpeg', 1.0)
  // For debugging, copy this to your browser to see what the image looks like
  // console.log(dataURL)

  const processedBlob = await fetch(dataURL).then((res) => res.blob())
  return processedBlob
}
