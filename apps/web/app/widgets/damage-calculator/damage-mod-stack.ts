import { patchPrecision } from '@nw-data/common'
import { AttackType } from '@nw-data/generated'
import { ModifierResult, describeModifierSource } from '~/nw/mannequin/modifier'
import { cappedValue } from '~/nw/mannequin/mods/capped-value'

export interface DamageModStack {
  value: number
  stack: Array<DamageModStackItem>
}

export interface DamageModStackItem {
  ref?: string
  value: number
  label?: string
  icon?: string
  cap?: number
  disabled?: boolean
  tags?: Array<AttackType | 'Melee' | 'Ranged'>
}

export function damageModStack() {
  return {
    value: 0,
    stack: [],
  }
}

const ATTACKS: Array<AttackType> = ['Ability', 'Heavy', 'Light', 'Magic']
const KINDS = ['Melee', 'Ranged']
export function damageModStackItemEnabled(
  item: DamageModStackItem,
  context: { type: AttackType; kind: 'Melee' | 'Ranged' },
) {
  if (item.disabled) {
    return false
  }
  if (item.ref || !context?.type || !context?.kind || !item.tags?.length) {
    return true
  }
  if (item.tags && ATTACKS.some((it) => item.tags.includes(it)) && !item.tags.includes(context.type)) {
    return false
  }
  if (item.tags && KINDS.some((it: any) => item.tags.includes(it)) && !item.tags.includes(context.kind)) {
    return false
  }
  return true
}

export function damageModSum(data: DamageModStack, context: { type: AttackType; kind: 'Melee' | 'Ranged' }) {
  const result = cappedValue()
  if (data) {
    // add uncapped values first
    result.add(data.value)

    const stack = data.stack.filter((it) => damageModStackItemEnabled(it, context))

    const uncapped = stack.filter((it) => !it.cap)
    for (const item of uncapped) {
      result.add(item.value)
    }

    // add capped values, starting with the lowest cap
    const capped = stack.filter((it) => !!it.cap).sort((a, b) => a.cap - b.cap)
    for (const item of capped) {
      result.add(item.value, item.cap)
    }
  }

  return {
    value: result.total,
    overflow: result.overflow,
  }
}

export function mergeDamageStacks(mod: ModifierResult | ModifierResult[], oldStack: DamageModStack): DamageModStack {
  const ids: Record<string, number> = {}

  function getId(index: number, label: string, limit: number) {
    const result = `${label} - ${limit ?? ''} - ${index}`
    const count = ids[result] || 0
    ids[result] = count + 1
    return `${result} - ${count}`
  }

  const result: DamageModStack = {
    value: oldStack?.value || 0,
    stack: [],
  }

  let mods: ModifierResult[] = []
  if (Array.isArray(mod)) {
    mods = mod
  } else if (mod) {
    mods = [mod]
  } else {
    mods = []
  }
  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i]
    for (const it of mod?.source || []) {
      const source = describeModifierSource(it.source)
      const id = getId(i, source.label, it.limit)
      result.stack.push({
        value: patchPrecision(it.value * it.scale),
        cap: it.limit ?? null,
        label: source.label,
        icon: source.icon,
        ref: id,
      })
    }
  }

  for (const it of oldStack?.stack || []) {
    if (!it.ref) {
      result.stack.push(it)
      continue
    }
    const found = result.stack.find((it) => it.ref === it.ref)
    if (found) {
      found.disabled = it.disabled
    }
  }

  return result
}
