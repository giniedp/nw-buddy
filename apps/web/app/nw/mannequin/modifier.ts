import {
  EquipSlotId,
  getItemGsBonus,
  getItemIconPath,
  getPerkMultiplier,
  getPerkOnlyMultiplier,
} from '@nw-data/common'
import {
  AbilityData,
  AffixStatData,
  HouseItems,
  MasterItemDefinitions,
  PerkData,
  StatusEffectData,
} from '@nw-data/generated'
import { humanize } from '~/utils'
import type { ActiveBonus, ActiveMods } from './types'

export interface ModifierSource {
  label?: string
  icon?: string
  perk?: PerkData
  ability?: AbilityData
  item?: MasterItemDefinitions | HouseItems
  slot?: EquipSlotId
  effect?: StatusEffectData
}

export interface ModifierValue<T extends string | number> {
  value: T
  scale: number
  source: ModifierSource
  capped?: boolean
  limit?: number
}

export interface GroupModifier {
  value: string
  source?: ModifierSource
}

export interface ModifierResult {
  value: number
  source: ModifierValue<any>[]
}

export type ObjectKey<O, T> = { [K in keyof O]: O[K] extends T ? K : never }[keyof O & string]

export type Modifier = AbilityData | StatusEffectData | AffixStatData
export type ModifierKey<T> = ObjectKey<AbilityData, T> | ObjectKey<StatusEffectData, T> | ObjectKey<AffixStatData, T>

export interface ModifierSum {
  key: ModifierKey<number>
  value: number
  source?: ModifierValue<any>[]
}

export function* eachEffect({ effects }: ActiveMods) {
  const stack = new Map<string, number>()
  for (const it of effects) {
    if (it.effect.StackMax) {
      const count = stack.get(it.effect.StatusID) || 0
      stack.set(it.effect.StatusID, count + 1)
      if (count >= it.effect.StackMax) {
        continue
      }
    }
    yield it
  }
}

export function* eachAbility({ abilities }: ActiveMods) {
  const stack: Record<string, number> = {}
  for (const it of abilities) {
    stack[it.ability.AbilityID] = (stack[it.ability.AbilityID] || 0) + 1
    if (
      !it.ability.IsStackableAbility ||
      !it.ability.IsStackableMax ||
      stack[it.ability.AbilityID] <= it.ability.IsStackableMax
    ) {
      yield it
    }
  }
}

export function* eachPerk({ perks }: ActiveMods) {
  for (const it of perks) {
    yield it
  }
}

export function* eachBonus({ bonuses }: ActiveMods) {
  for (const it of bonuses) {
    yield it
  }
}

function modifierMatcher<T>(key: ModifierKey<T>): ModifierMatcherFn<T> {
  return (mod: ActiveBonus | StatusEffectData | AffixStatData | AbilityData): T => {
    if (!mod) {
      return null
    }
    if ('key' in mod) {
      return (mod.key === key ? mod.value : null) as T
    }
    if (key in mod) {
      return mod[key as any] as T
    }
    return null
  }
}

export type ModifierMatcherFn<T> = (mod: ActiveBonus | StatusEffectData | AffixStatData | AbilityData) => T
export function eachModifier<T extends number | string>(
  key: ModifierKey<T>,
  mods: ActiveMods,
): Generator<ModifierValue<T>>
export function eachModifier<T extends number | string>(
  match: ModifierMatcherFn<T>,
  mods: ActiveMods,
): Generator<ModifierValue<T>>
export function* eachModifier<T extends number | string>(
  keyOrMatch: ModifierKey<T> | ModifierMatcherFn<T>,
  mods: ActiveMods,
): Generator<ModifierValue<T>> {
  let match: ModifierMatcherFn<T>
  if (typeof keyOrMatch === 'function') {
    match = keyOrMatch
  } else {
    match = modifierMatcher(keyOrMatch)
  }
  for (const bonus of eachBonus(mods)) {
    const value = match(bonus)
    if (value) {
      yield { value: value as any, scale: 1, source: { label: bonus.name } }
    }
  }
  for (const { effect, perk, ability, item } of eachEffect(mods)) {
    let value = match(effect)
    let scale = 1
    if (!value) {
      continue
    }
    if (perk) {
      scale = getPerkOnlyMultiplier(perk.perk, perk.gearScore)
    }
    const source: Required<ModifierSource> = {
      icon: null,
      label: null,
      ability,
      perk: perk?.perk,
      item,
      slot: perk?.slot,
      effect,
    }
    yield { value, scale, source }
  }
  for (const { affix, perk, gearScore, item, slot } of eachPerk(mods)) {
    if (!affix) {
      continue
    }

    let value = match(affix)
    let scale = 1
    if (!value) {
      continue
    }

    if (perk) {
      scale = getPerkOnlyMultiplier(perk, gearScore + getItemGsBonus(perk, item))
    }
    const source: Required<ModifierSource> = {
      icon: null,
      label: null,
      ability: null,
      perk: perk,
      item: item,
      slot: slot,
      effect: null,
    }
    yield { value, scale, source }
  }
  for (const { ability, perk, scale } of eachAbility(mods)) {
    if (!ability) {
      continue
    }
    let value = match(ability)
    let upscale = 1
    if (!value) {
      continue
    }
    if (perk) {
      upscale *= getPerkOnlyMultiplier(perk.perk, perk.gearScore)
    }
    if (scale) {
      upscale *= scale
    }
    const source: Required<ModifierSource> = {
      icon: null,
      label: null,
      ability: ability,
      perk: perk?.perk,
      item: null,
      slot: null,
      effect: null,
    }
    yield { value, scale: upscale, source }
  }
  for (const { ability, perk, selfEffects, scale } of eachAbility(mods)) {
    if (!ability || !selfEffects?.length) {
      continue
    }
    for (const effect of selfEffects) {
      let value = match(effect)
      let upscale = 1
      if (!value) {
        continue
      }
      if (perk) {
        upscale *= getPerkOnlyMultiplier(perk.perk, perk.gearScore)
      }
      if (scale) {
        upscale *= scale
      }
      const source: Required<ModifierSource> = {
        icon: null,
        label: null,
        ability: ability,
        perk: perk?.perk,
        item: null,
        slot: null,
        effect: effect,
      }
      yield { value, scale: upscale, source }
    }
  }
  // TODO:
  if (keyOrMatch === 'DMGVitalsCategory') {
    for (const { item, consumable } of mods.consumables) {
      if (!consumable?.[keyOrMatch]) {
        continue
      }
      let value = consumable[keyOrMatch as any]
      let scale = 1
      const source: Required<ModifierSource> = {
        icon: null,
        label: null,
        ability: null,
        perk: null,
        item: item,
        slot: null,
        effect: null,
      }
      yield { value, scale, source }
    }
  }
}

export function modifierSum(
  key: ModifierKey<number>,
  mods: ActiveMods,
  predicate?: (it: ModifierValue<number>) => boolean,
): ModifierResult {
  predicate = predicate || (() => true)
  const result = modifierResult()
  for (const value of eachModifier<number>(key, mods)) {
    if (predicate(value)) {
      modifierAdd(result, value)
    }
  }
  return result
}

export function modifierAdd(result: ModifierResult, mod: ModifierValue<number>) {
  if (mod.value) {
    result.value += mod.value * mod.scale
    result.source.push(mod)
  }
}

export function modifierMult(result: ModifierResult, mod: ModifierValue<number>) {
  if (mod.value) {
    result.value *= mod.value * mod.scale
    result.source.push(mod)
  }
}

export function modifierResult(base?: ModifierValue<number>): ModifierResult {
  return {
    value: base ? base.value : 0,
    source: base ? [base] : [],
  }
}

export function describeModifierSource(data: ModifierSource) {
  if (data.perk) {
    return {
      icon: data.perk.IconPath || data.icon,
      label: data.perk.DisplayName || data.perk.SecondaryEffectDisplayName || data.label,
    }
  }
  if (data.item) {
    return {
      icon: getItemIconPath(data.item),
      label: data.item.Name,
    }
  }
  if (data.ability) {
    let label = data.ability.DisplayName || data.label || data.ability.AbilityID
    if (data.ability.AbilityID.match(/_Bonus_\d+_\d$/)) {
      label = humanize(data.ability.AbilityID.replace(/_\d$/, ''))
    }
    return {
      icon: data.ability.Icon || data.icon,
      label: label,
    }
  }
  if (data.effect) {
    return {
      icon: data.effect.PlaceholderIcon || data.icon,
      label: data.effect.DisplayName || data.label,
    }
  }
  return {
    icon: data.icon,
    label: data.label,
  }
}
