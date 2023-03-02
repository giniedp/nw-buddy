import { Statuseffectcategories } from "@nw-data/types"
import { sumBy } from "lodash"
import { eachModifier, ModifierKey, ModifierResult, ModifierValue } from "../modifier"
import { ActiveMods } from "../types"

export function categorySum(categories: Map<string, Statuseffectcategories>, key: ModifierKey<number>, mods: ActiveMods): ModifierResult {
  const capped: Array<ModifierValue<number> & { capped: true, limit: number}> = []
  const uncapped: Array<ModifierValue<number> & { capped: false }> = []

  for (const mod of eachModifier<number>(key, mods)) {
    const limit = getCategoryLimit(key, mod.source.effect?.EffectCategories, categories)
    if (limit) {
      capped.push({
        ...mod,
        ...{ capped: true, limit },
      })
    } else {
      uncapped.push({
        ...mod,
        ...{ capped: false },
      })
    }
  }

  const cappdSum = sumBy(capped, (it) => it.value * it.scale)
  const uncappedSum = sumBy(uncapped, (it) => it.value * it.scale)
  let total = uncappedSum
  for (const mod of capped) {
    if (mod.value < 0 && total > mod.limit) {
      // assume negative value is associated with lower limit
      total = Math.max(mod.limit, total + mod.value)
    }
    if (mod.value > 0 && total < mod.limit) {
      // assume positive value is associated with upper limit
      total = Math.min(mod.limit, total + mod.value)
    }
  }

  return {
    value: total,
    source: [...uncapped, ...capped],
    ...{
      valueCapped: cappdSum,
      valueUncapped: uncappedSum,
    }
  }
}

function getCategoryLimit(key: ModifierKey<number>, categoryIds: string[], categories: Map<string, Statuseffectcategories>) {
  if (!categoryIds?.length) {
    return null
  }
  for (const id of categoryIds) {
    const limit = categories.get(id)?.ValueLimits?.[key]
    if (typeof limit === 'number') {
      return limit
    }
  }
  return null
}
