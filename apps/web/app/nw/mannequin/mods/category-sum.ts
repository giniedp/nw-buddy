import { StatusEffectCategoryData } from '@nw-data/generated'
import { eachModifier, ModifierKey, ModifierResult, ModifierValue } from '../modifier'
import { ActiveMods } from '../types'
import { cappedValue } from './capped-value'

export function categorySum({
  categories,
  key,
  mods,
  base,
}: {
  categories: Map<string, StatusEffectCategoryData>
  key: ModifierKey<number>
  mods: ActiveMods
  base: number
}): ModifierResult {
  return categorySumFromList({
    base,
    modifiers: Array.from(eachModifier<number>(key, mods)),
    categoryLimit: (mod) => getCategoryLimit(key, mod.source.effect?.EffectCategories, categories),
  })
}

export function categorySumFromList({
  base,
  modifiers,
  categoryLimit,
}: {
  base: number
  modifiers: Array<ModifierValue<number>>
  categoryLimit: (mod: ModifierValue<number>) => { category: string; limit: number }
}): ModifierResult {
  const value = cappedValue()
  const mods = modifiers.map((mod) => {
    const limit = categoryLimit(mod)
    return {
      mod,
      category: limit?.category,
      limit: limit?.limit,
    }
  })

  for (const { mod, limit } of mods) {
    if (!limit) {
      value.add(mod.value * mod.scale)
    }
  }
  for (const { mod, limit } of mods) {
    if (limit) {
      value.add(mod.value * mod.scale, limit - base)
    }
  }

  const capped: Array<ModifierValue<number> & { category: string; limit: number; capped: boolean }> = []
  const uncapped: Array<ModifierValue<number> & { capped: false }> = []
  for (const { mod, category, limit } of mods) {
    if (limit) {
      capped.push({
        ...mod,
        ...{ category, limit: limit - base, capped: true },
      })
    } else {
      uncapped.push({
        ...mod,
        ...{ capped: false },
      })
    }
  }

  return {
    value: value.total,
    source: [...uncapped, ...capped],
  }
}

export function getCategoryLimit(
  key: string,
  categoryIds: string[],
  categories: Map<string, StatusEffectCategoryData>,
) {
  if (!categoryIds?.length) {
    return null
  }
  for (const id of categoryIds) {
    const limit = categories.get(id)?.ValueLimits?.[key]
    if (typeof limit === 'number') {
      return {
        category: id,
        limit: limit,
      }
    }
  }
  return null
}
