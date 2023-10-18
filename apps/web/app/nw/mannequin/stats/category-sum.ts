import { Statuseffectcategories } from '@nw-data/generated'
import { eachModifier, ModifierKey, ModifierResult, ModifierValue } from '../modifier'
import { ActiveMods } from '../types'
import { cappedValue } from './capped-value'

export function categorySum({
  categories,
  key,
  mods,
  base,
}: {
  categories: Map<string, Statuseffectcategories>
  key: ModifierKey<number>
  mods: ActiveMods
  base: number
}): ModifierResult {
  const value = cappedValue()
  const modifiers = Array.from(eachModifier<number>(key, mods)).map((mod) => {
    const limit = getLimit(key, mod.source.effect?.EffectCategories, categories)
    return {
      mod,
      category: limit?.category,
      limit: limit?.limit,
    }
  })

  for (const { mod, limit } of modifiers) {
    if (!limit) {
      value.add(mod.value * mod.scale)
    }
  }
  for (const { mod, limit } of modifiers) {
    if (limit) {
      value.add(mod.value * mod.scale, limit - base)
    }
  }

  const capped: Array<ModifierValue<number> & { category: string; limit: number; capped: boolean }> = []
  const uncapped: Array<ModifierValue<number> & { capped: false }> = []
  for (const { mod, category, limit } of modifiers) {
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

function getLimit(key: ModifierKey<number>, categoryIds: string[], categories: Map<string, Statuseffectcategories>) {
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
