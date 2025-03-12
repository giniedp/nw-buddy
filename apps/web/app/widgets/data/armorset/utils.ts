import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { groupBy, sortBy } from 'lodash'
import { TranslateService } from '~/i18n'
import { getItemRarity, getItemSetFamilyName } from '@nw-data/common'
import { Armorset, ArmorsetGroup } from './types'

export function findSets(
  items: MasterItemDefinitions[],
  source: string,
  perksMap: Map<string, PerkData>,
  i18n: TranslateService,
): ArmorsetGroup[] {
  const groups1 = groupBy(items, (item) => {
    const family = getItemSetFamilyName(item)
    const weight = getItemClass(item)
    const rarity = getItemRarity(item)
    const tier = item.Tier
    return `${family}-${weight}-${tier}-${rarity}`
  })

  const sets: Record<string, Armorset[]> = {}
  Object.entries(groups1).forEach(([key, items]) => {
    if (items.length < 5) {
      return
    }

    const sharedPerks = getPerkInfos(items)
      .samePerks.map((it) => perksMap.get(it))
      .filter((it) => it.PerkType !== 'Gem' && it.PerkType !== 'Inherent')

    const naming = buildSetName(items, i18n)

    const groupKey = sharedPerks
      .map((it) => it.PerkID)
      .sort()
      .join('-')
    sets[groupKey] = sets[groupKey] || []
    sets[groupKey].push({
      key: getGearsetFamilyName(items[0]),
      name: naming.name,
      source: source,
      tier: items[0].Tier,
      weight: getItemClass(items[0]),
      perks: sharedPerks,
      items: items,
      itemNames: naming.names,
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
    'Chestguard',
    'Chest',
    'Hands',
    'Legs',
    'Feet',
    'Feets',
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
    //
    'Masque',
  ].join('|')})`,
  'gi',
)

export function getGearsetFamilyName(item: MasterItemDefinitions) {
  return item.ItemID.replace(FAMILY_OGNORE_TOKENS, '')
}

export function getItemClass(item: MasterItemDefinitions) {
  return item.ItemClass?.find((token) => token === 'Medium' || token === 'Light' || token === 'Heavy')
}

export function getPerkIds(item: MasterItemDefinitions) {
  return [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)
}

export function getPerkInfos(items: MasterItemDefinitions[]) {
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

export function buildSetName(items: MasterItemDefinitions[], i18n: TranslateService) {
  const names = items.map((it) => i18n.get(it.Name))
  const i0 = commonPrefixLength(names)
  const i1 = commonPrefixLength(names.map((it) => it.split('').reverse().join('')))
  const data = names.map((name) => {
    return {
      prefix: name.substring(0, i0),
      midname: name.substring(i0, Math.max(i0, name.length - i1)),
      suffix: name.substring(Math.max(i0, name.length - i1), name.length),
    }
  })
  if (data[0].prefix && data[0].suffix) {
    return {
      name: [data[0].prefix, '…', data[0].suffix]
        .map((it) => it.trim())
        .filter((it) => !!it)
        .join(' '),
      names: data.map((it) => {
        return [it.prefix.trim() ? '…' : '', it.midname.trim(), it.suffix.trim() ? '…' : '']
          .filter((it) => !!it)
          .join(' ')
      }),
    }
  }

  const common = names.reduce((res, name) => longestCommonSubstring(res, name), names[0])
  return {
    name: common,
    names: names.map((it) => it.replace(common, '…')),
  }
}

function commonPrefixLength(names: string[]) {
  const limit = Math.min(...names.map((it) => it.length))
  let i = 0
  for (; i < limit; i++) {
    if (names.some((it) => it[i] !== names[0][i])) {
      break
    }
  }
  return i
}

export function longestCommonSubstring(string1: string, string2: string) {
  // Convert strings to arrays to treat unicode symbols length correctly.
  // For example:
  // '𐌵'.length === 2
  // [...'𐌵'].length === 1
  const s1 = string1 // .split(' ')
  const s2 = string2 // .split(' ')

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
    longestSubstring = s1[longestSubstringColumn - 1] + longestSubstring
    longestSubstringRow -= 1
    longestSubstringColumn -= 1
  }

  return longestSubstring.trim()
}
