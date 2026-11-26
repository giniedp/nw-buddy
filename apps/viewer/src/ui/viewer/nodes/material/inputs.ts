import { CommonBlocks, type InputSlot } from '@gglib/graphics'
import meta from './material-meta.json'
import type { InputBlock, InputWidget, ScalarRange } from './types'

interface ParamMeta {
  min?: number
  max?: number
  step?: number
  widget?: string
}

const params = meta as Record<string, ParamMeta>

/**
 * The vector components by input type
 */
export const VECTOR_KEYS: Record<string, string[]> = {
  vec2: ['x', 'y'],
  vec3: ['x', 'y', 'z'],
  vec4: ['x', 'y', 'z', 'w'],
}

/**
 * The inputs of a material schema by block, in order. Only the material block and the inputs without a block: the
 * other blocks are set by the engine.
 */
export function inputBlocks(schema: Record<string, InputSlot> | null | undefined): InputBlock[] {
  const groups = new Map<string, InputSlot[]>()
  for (const slot of Object.values(schema ?? {})) {
    if (slot.block !== CommonBlocks.Material && slot.block !== '') {
      continue
    }
    if (!groups.has(slot.block)) {
      groups.set(slot.block, [])
    }
    groups.get(slot.block).push(slot)
  }
  return [...groups].map(([name, inputs]) => ({ name, inputs }))
}

/**
 * The widget of an input, null for input types without one (e.g. samplers). Vectors named like a color are colors.
 */
export function inputWidget(slot: Pick<InputSlot, 'type' | 'input'>): InputWidget | null {
  if (slot.type === 'scalar') {
    return 'scalar'
  }
  if ((slot.type === 'vec3' || slot.type === 'vec4') && /color/i.test(slot.input)) {
    return 'color'
  }
  if (VECTOR_KEYS[slot.type]) {
    return 'vector'
  }
  if (slot.type === 'texture') {
    return 'texture'
  }
  return null
}

/**
 * The range of a scalar input by its name, unbounded for inputs the game has no params for
 */
export function scalarRange(name: string): ScalarRange {
  const it = params[name.toLowerCase()]
  return { min: it?.min, max: it?.max, step: it?.step, range: it?.widget === 'slider' }
}
