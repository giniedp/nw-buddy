import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { groupBy, sortBy } from 'lodash'
import { NwService } from '~/core/nw'
import { Armorset, ArmorsetGroup } from './types'

export function findSets(items: ItemDefinitionMaster[], perksMap: Map<string, Perks>, nw: NwService): ArmorsetGroup[] {
  const groups1 = groupBy(items, (item) => {
    const family = getFamilyName(item)
    const weight = getItemClass(item)
    const rarity = nw.itemRarity(item)
    const tier = item.Tier
    return `${family}-${weight}-${tier}-${rarity}`
  })

  const sets: Record<string, Armorset[]> = {}
  Object.entries(groups1).forEach(([key, items]) => {
    if (items.length < 5) {
      return
    }

    const sharedPerks = getPerkInfos(items)
      .samePerks
      .map((it) => perksMap.get(it))
      .filter((it) => it.PerkType !== 'Gem' && it.PerkType !== 'Inherent')

    const groupKey = sharedPerks.map((it) => it.PerkID).sort().join('-')
    sets[groupKey] = sets[groupKey] || []
    sets[groupKey].push({
      key: getFamilyName(items[0]),
      name: getNameForSet(items, nw),
      tier: items[0].Tier,
      weight: getItemClass(items[0]),
      perks: sharedPerks,
      items: items,
    })
  })
  return Object.entries(sets).map(([key, itemSets]) => {
    return {
      key: key,
      perks: itemSets[0].perks,
      sets: sortBy(itemSets, (it) => `${it.name}-${it.weight}-${it.tier}`),
    }
  })
}

const FAMILY_OGNORE_TOKENS = new RegExp(
  `(${[
    //
    'Heavy',
    'Light',
    'Medium',
    '_',
    //
    'Head',
    'Chest',
    'Hands',
    'Legs',
    'Feet',
    //
    'Shirt',
    'Hat',
    'Pants',
    'Shoes',
    'Gloves',
    //
    'Coat',
    'Hat',
    'Pants',
    'Boots',
    'Gloves',
    //
    'Breastplate',
    'Helm',
    'Greaves',
    'Boots',
    'Gauntlets',
    //
    'Sabatons',
    'Shoes',
    'Thighguards',
    'Handcovers',
    'Cowl',
    'Masquet'
  ].join('|')})`,
  'gi'
)

export function getFamilyName(item: ItemDefinitionMaster) {
  return item.ItemID.replace(FAMILY_OGNORE_TOKENS, '')
}

export function getItemClass(item: ItemDefinitionMaster) {
  return item.ItemClass?.split('+')?.find((token) => token === 'Medium' || token === 'Light' || token === 'Heavy')
}

export function getPerkIds(item: ItemDefinitionMaster) {
  return [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)
}

export function getPerkInfos(items: ItemDefinitionMaster[]) {
  const perks0 = getPerkIds(items[0])
  const armorPerk = perks0.find((it) => it.startsWith('PerkID_Armor_')) || ''
  const samePerks = perks0.filter((perk) => {
    return items.every((item) => {
      return getPerkIds(item).includes(perk)
    })
  })
  return {
    armorPerk,
    samePerks,
  }
}

export function getNameForSet(items: ItemDefinitionMaster[], nw: NwService) {
  const names = items.map((it) => nw.translate(it.Name))
  return longestCommonSubstring(names[0], names[1])
}

export function longestCommonSubstring(string1: string, string2: string) {
  // Convert strings to arrays to treat unicode symbols length correctly.
  // For example:
  // '𐌵'.length === 2
  // [...'𐌵'].length === 1
  const s1 = string1.split(' ')
  const s2 = string2.split(' ')

  // Init the matrix of all substring lengths to use Dynamic Programming approach.
  const substringMatrix = Array(s2.length + 1)
    .fill(null)
    .map(() => {
      return Array(s1.length + 1).fill(null)
    })

  // Fill the first row and first column with zeros to provide initial values.
  for (let columnIndex = 0; columnIndex <= s1.length; columnIndex += 1) {
    substringMatrix[0][columnIndex] = 0
  }

  for (let rowIndex = 0; rowIndex <= s2.length; rowIndex += 1) {
    substringMatrix[rowIndex][0] = 0
  }

  // Build the matrix of all substring lengths to use Dynamic Programming approach.
  let longestSubstringLength = 0
  let longestSubstringColumn = 0
  let longestSubstringRow = 0

  for (let rowIndex = 1; rowIndex <= s2.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= s1.length; columnIndex += 1) {
      if (s1[columnIndex - 1] === s2[rowIndex - 1]) {
        substringMatrix[rowIndex][columnIndex] = substringMatrix[rowIndex - 1][columnIndex - 1] + 1
      } else {
        substringMatrix[rowIndex][columnIndex] = 0
      }

      // Try to find the biggest length of all common substring lengths
      // and to memorize its last character position (indices)
      if (substringMatrix[rowIndex][columnIndex] > longestSubstringLength) {
        longestSubstringLength = substringMatrix[rowIndex][columnIndex]
        longestSubstringColumn = columnIndex
        longestSubstringRow = rowIndex
      }
    }
  }

  if (longestSubstringLength === 0) {
    // Longest common substring has not been found.
    return ''
  }

  // Detect the longest substring from the matrix.
  let longestSubstring = ''

  while (substringMatrix[longestSubstringRow][longestSubstringColumn] > 0) {
    longestSubstring = s1[longestSubstringColumn - 1] + ' ' + longestSubstring
    longestSubstringRow -= 1
    longestSubstringColumn -= 1
  }

  return longestSubstring.trim()
}
