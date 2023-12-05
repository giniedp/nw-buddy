import { ItemClass } from '@nw-data/generated'
import { diceCoefficient } from 'dice-coefficient'
import { PoolPerk } from './types'
import { isItemOfAnyClass } from '@nw-data/common'

export function findAttributeCandidates({
  perks,
  names,
  itemClass,
}: {
  perks: PoolPerk[]
  names: string[]
  itemClass: ItemClass[]
}): PoolPerk[] {
  const result: PoolPerk[] = []
  names = [...names].sort()
  for (const perk of perks) {
    let rating = isItemOfAnyClass(perk.perk, itemClass) ? 0.1 : 0
    const mods = perk.mods.map((it) => it.label).sort()
    for (let i = 0; i < mods.length; i++) {
      rating += (names[i] ? diceCoefficient(mods[i], names[i]) : -1) / names.length
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

export function findPerkCandidates({
  perks,
  names,
  itemClass,
}: {
  perks: PoolPerk[]
  names: string[]
  itemClass: ItemClass[]
}): PoolPerk[] {
  const out: PoolPerk[] = []
  for (const name of names) {
    let rating: number = null
    let result: PoolPerk = null
    for (const perk of perks) {
      const r1 = isItemOfAnyClass(perk.perk, itemClass) ? 0.1 : 0
      const r2 = diceCoefficient(perk.name, name)
      const r = r1 + r2
      if (r > rating) {
        rating = r
        result = perk
      }
    }
    if (result) {
      out.push({
        ...result,
        rating: rating,
      })
    }
  }
  return out
}
