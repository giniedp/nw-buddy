import {
  ItemRarity,
  PerkBucket,
  buildBackstoryItemInstance,
  getBackstoryItems,
  getItemPerkInfos,
  getItemRarity,
  getTradeSkillLabel,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { BackstoryDefinition, HouseItems, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { NW_TRADESKILLS_INFOS } from '~/nw/tradeskill'
import { InventoryItem } from './types'

const BACKGROUND_IMAGES = {
  Faction1: 'url(assets/backstories/backstory_image_marauders.png)',
  Faction2: 'url(assets/backstories/backstory_image_covenant.png)',
  Faction3: 'url(assets/backstories/backstory_image_syndicate.png)',
  Default: 'url(assets/backstories/backstory_image_level.png)',
}

export type BackstoryTradeskillData = ReturnType<typeof selectBackstoryTradeSkills>
export function selectBackstoryTradeSkills(backstory: BackstoryDefinition) {
  return NW_TRADESKILLS_INFOS.map((it) => {
    return {
      ...it,
      level: backstory?.[it.ID] || 0,
      label: getTradeSkillLabel(it.ID),
    }
  })
}

export function selectBackstoryProps(backstory: BackstoryDefinition) {
  if (!backstory) {
    return null
  }
  const result: Array<{ icon: string; value: number; label: string }> = []
  if (backstory.Currency) {
    result.push({
      icon: 'assets/icons/rewards/coin.png',
      value: backstory.Currency / 100,
      label: `Gold`,
    })
  }
  // if (backstory.RepairParts) {
  //   result.push({
  //     icon: 'assets/icons/repair_parts.png',
  //     label: `${backstory.RepairParts} Repair Parts`,
  //   })
  // }
  if (backstory.Azoth) {
    result.push({
      icon: 'assets/icons/rewards/azoth.png',
      value: backstory.Azoth,
      label: `Azoth`,
    })
  }
  if (backstory.FactionReputation) {
    result.push({
      icon: 'assets/icons/rewards/faction-reputation.png',
      value: backstory.FactionReputation,
      label: `Faction Reputation`,
    })
  }
  if (backstory.FactionTokens) {
    result.push({
      icon: 'assets/icons/rewards/faction-tokens.png',
      value: backstory.FactionTokens,
      label: `Faction Tokens`,
    })
  }
  return result
}

export function selectBackstoryItems(
  backstory: BackstoryDefinition,
  options: {
    itemsMap: Map<string, MasterItemDefinitions>
    housingMap: Map<string, HouseItems>
    perksMap: Map<string, PerkData>
    bucketsMap: Map<string, PerkBucket>
  },
) {
  if (!backstory?.InventoryItem?.length) {
    return null
  }
  return getBackstoryItems(backstory).map((it): InventoryItem => {
    const item = options.itemsMap.get(it.itemId) || options.housingMap.get(it.itemId)
    const instance = buildBackstoryItemInstance(it, options)
    let isNamed: boolean = false
    let rarity: ItemRarity = null
    if (isMasterItem(item)) {
      const perkIds = getItemPerkInfos(item, instance.perks)
        .map((it) => it.perkId)
        .filter((it) => !!it)
      rarity = getItemRarity(item, perkIds)
      isNamed = isItemNamed(item)
    }
    return {
      ...instance,
      item,
      isNamed,
      rarity,
    }
  })
}

export function selectBackgroundImage(data: BackstoryDefinition) {
  return BACKGROUND_IMAGES[data?.FactionOverride] || BACKGROUND_IMAGES.Default
}
