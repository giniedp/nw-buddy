import { ItemRarity, getItemIconPath, getItemRarity, isHousingItem } from '@nw-data/common'
import { GameEventData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwLinkResource } from '~/nw'

export interface GameEventReward {
  label: string
  icon: string
  quantity: number
  link?: [NwLinkResource, string]
  rarity?: ItemRarity
}

export function selectGameEventItemReward(event: GameEventData) {
  const itemReward = event?.ItemReward
  if (!itemReward) {
    return null
  }
  if (itemReward.startsWith('[LTID]')) {
    return {
      lootTableId: itemReward.replace('[LTID]', ''),
    }
  }
  if (itemReward.includes('HousingItem')) {
    return {
      housingItemId: itemReward,
    }
  }
  return {
    itemId: itemReward,
  }
}

export function selectGameEventRewards(event: GameEventData, item: MasterItemDefinitions | HouseItems) {
  const result: GameEventReward[] = []
  if (!event) {
    return null
  }

  if (Number(event.AzothReward) > 0) {
    result.push({
      label: 'Azoth',
      icon: 'assets/icons/rewards/azoth.png',
      quantity: Number(event.AzothReward),
    })
  }
  if (event.AzothSalt > 0) {
    result.push({
      label: 'Azoth Salt',
      icon: 'assets/icons/rewards/azoth-salt.png',
      quantity: event.AzothSalt,
    })
  }
  if (Number(event.CurrencyReward) > 0) {
    result.push({
      label: 'Coin',
      icon: 'assets/icons/rewards/coin.png',
      quantity: Number(event.CurrencyReward) / 100,
    })
  }
  if (event.FactionInfluenceAmount > 0) {
    result.push({
      label: 'Faction Influence',
      icon: 'assets/icons/rewards/faction-influence.png',
      quantity: event.FactionInfluenceAmount,
    })
  }
  if (event.FactionReputation > 0) {
    result.push({
      label: 'Faction Reputation',
      icon: 'assets/icons/rewards/faction-reputation.png',
      quantity: event.FactionReputation,
    })
  }
  if (event.FactionTokens > 0) {
    result.push({
      label: 'Faction Tokens',
      icon: 'assets/icons/rewards/faction-tokens.png',
      quantity: event.FactionTokens,
    })
  }

  if (event.PvpXp || event.PVPXP) {
    result.push({
      label: 'PvP XP',
      icon: 'assets/icons/rewards/pvp-xp.png',
      quantity: event.PvpXp || event.PVPXP,
    })
  }

  if (event.SeasonsXp > 0) {
    result.push({
      label: 'Seasons XP',
      icon: 'assets/icons/rewards/season.png',
      quantity: event.SeasonsXp,
    })
  }
  if (Number(event.TerritoryStanding) > 0) {
    result.push({
      label: 'Territory Standing',
      icon: 'assets/icons/rewards/standing.png',
      quantity: Number(event.TerritoryStanding),
    })
  }
  if (Number(event.UniversalExpAmount) > 0) {
    result.push({
      label: 'XP',
      icon: 'assets/icons/rewards/xp.png',
      quantity: Number(event.UniversalExpAmount),
    })
  }
  if (event.ItemReward && item) {
    result.push({
      label: item.Name,
      icon: getItemIconPath(item),
      rarity: getItemRarity(item),
      quantity: event.ItemRewardQty,
      link: [isHousingItem(item) ? 'housing' : 'item', event.ItemReward],
    })
  }
  if (result.length) {
    return result
  }
  return null
}
