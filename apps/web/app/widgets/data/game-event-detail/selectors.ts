import { ItemRarity, getItemIconPath, getItemRarity, isHousingItem } from '@nw-data/common'
import { GameEvent, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export interface GameEventReward {
  label: string
  icon: string
  quantity: number
  link?: string | any[]
  rarity?: ItemRarity
}

export function selectGameEventRewards(event: GameEvent, item: ItemDefinitionMaster | Housingitems) {
  const result: GameEventReward[] = []
  if (!event) {
    return null
  }

  if (Number(event.AzothReward)) {
    result.push({
      label: 'Azoth',
      icon: 'assets/icons/rewards/azoth.png',
      quantity: Number(event.AzothReward),
    })
  }
  if (event.AzothSalt) {
    result.push({
      label: 'Azoth Salt',
      icon: 'assets/icons/rewards/azoth-salt.png',
      quantity: event.AzothSalt,
    })
  }
  if (Number(event.CurrencyReward)) {
    result.push({
      label: 'Coin',
      icon: 'assets/icons/rewards/coin.png',
      quantity: Number(event.CurrencyReward) / 100,
    })
  }
  if (event.FactionInfluenceAmount) {
    result.push({
      label: 'Faction Influence',
      icon: 'assets/icons/rewards/faction-influence.png',
      quantity: event.FactionInfluenceAmount,
    })
  }
  if (event.FactionReputation) {
    result.push({
      label: 'Faction Reputation',
      icon: 'assets/icons/rewards/faction-reputation.png',
      quantity: event.FactionReputation,
    })
  }
  if (event.FactionTokens) {
    result.push({
      label: 'Faction Tokens',
      icon: 'assets/icons/rewards/faction-tokens.png',
      quantity: event.FactionTokens,
    })
  }

  // if (item.PvpXp || item.PVPXP) {
  //   result.push({
  //     label: 'PvP XP',
  //     icon: 'pvp',
  //     quantity: item.PvpXp || item.PVPXP,
  //   })
  // }
  if (event.SeasonsXp) {
    result.push({
      label: 'Seasons XP',
      icon: 'seasons',
      quantity: event.SeasonsXp,
    })
  }
  if (Number(event.TerritoryStanding)) {
    result.push({
      label: 'Territory Standing',
      icon: 'assets/icons/rewards/standing.png',
      quantity: Number(event.TerritoryStanding),
    })
  }
  if (Number(event.UniversalExpAmount)) {
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
      link: [isHousingItem(item) ? '/housing' : '/items', 'table', event.ItemReward],
    })
  }
  if (result.length) {
    return result
  }
  return null
}
