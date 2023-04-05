import { Ability, Affixstats, Housingitems, ItemDefinitionMaster, Perks, Statuseffect } from '@nw-data/types'
import { sumBy } from 'lodash'
import { EquipSlotId } from '../utils/equip-slot'
import { getItemGsBonus, getPerkMultiplier } from '../utils/perks'
import { ActiveMods } from './types'

export interface ModifierSource {
  label?: string
  icon?: string
  perk?: Perks
  ability?: Ability
  item?: ItemDefinitionMaster | Housingitems
  slot?: EquipSlotId
  effect?: Statuseffect
}

export interface ModifierValue<T extends string | number> {
  value: T
  scale: number
  source: ModifierSource
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

export type ModifierKey<T> = ObjectKey<Ability, T> | ObjectKey<Statuseffect, T> | ObjectKey<Affixstats, T>

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
  const stack = new Map<string, number>()
  for (const it of abilities) {
    if (it.ability.IsStackableAbility || !stack.has(it.ability.AbilityID)) {
      yield it
    }
    stack.set(it.ability.AbilityID, 1)
  }
}

export function* eachPerk({ perks }: ActiveMods) {
  for (const it of perks) {
    yield it
  }
}

export function* eachModifier<T extends number | string>(
  key: ModifierKey<T>,
  mods: ActiveMods
): Generator<ModifierValue<T>> {
  for (const { effect, perk, ability, item } of eachEffect(mods)) {
    let value = effect[key as any]
    let scale = 1
    if (!value) {
      continue
    }
    if (perk) {
      scale = getPerkMultiplier(perk.perk, perk.gearScore)
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

    let value = affix[key as any]
    let scale = 1
    if (!value) {
      continue
    }

    if (perk) {

      scale = getPerkMultiplier(perk, gearScore + getItemGsBonus(perk, item))
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
    let value = ability[key as any]
    let upscale = 1
    if (!value) {
      continue
    }
    if (perk) {
      upscale *= getPerkMultiplier(perk.perk, perk.gearScore)
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
      let value = effect[key as any]
      let upscale = 1
      if (!value) {
        continue
      }
      if (perk) {
        upscale *= getPerkMultiplier(perk.perk, perk.gearScore)
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
  if (key === 'DMGVitalsCategory') {
    for (const { item, consumable } of mods.consumables) {
      if (!consumable?.[key]) {
        continue
      }
      let value = consumable[key as any]
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

export function modifierSum(key: ModifierKey<number>, mods: ActiveMods): ModifierResult {
  const result = modifierResult()
  for (const value of eachModifier<number>(key, mods)) {
    modifierAdd(result, value)
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
