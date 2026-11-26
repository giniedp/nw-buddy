import {
  childGroupData,
  emptyGroupData,
  isImmortal,
  readParticleParams,
  type ParticleGroupData,
  type ParticleParams,
} from './params'
import { findParticleEffect, type ParticleEffectNode, type ParticleLibraryDocument } from './parse'

/**
 * A resolved particle effect with typed params
 */
export interface ParticleEffect {
  name: string
  fullName: string
  /**
   * Null for folders and disabled effects. Children of disabled effects still run.
   */
  params: ParticleParams | null
  children: ParticleEffect[]
}

/**
 * Resolves an effect of a library by its full name, null if it does not exist
 */
export function resolveParticleEffect(lib: ParticleLibraryDocument, fullName: string): ParticleEffect | null {
  const node = findParticleEffect(lib, fullName)
  return node ? buildEffect(node, emptyGroupData()) : null
}

function buildEffect(node: ParticleEffectNode, group: ParticleGroupData): ParticleEffect {
  // Enabled="false" effects are skipped by the game (not by the editor)
  const params = node.attrs && node.attrs.Enabled !== 'false' ? readParticleParams(node.attrs, group) : null
  const childGroup = childGroupData(node.attrs, group)
  return {
    name: node.name,
    fullName: node.fullName,
    params,
    children: node.children.map((it) => buildEffect(it, childGroup)),
  }
}

/**
 * Calls the visitor for each effect of the tree with params, parents first
 */
export function forEachParticleEffect(
  effect: ParticleEffect,
  visit: (effect: ParticleEffect, parent: ParticleEffect | null) => void,
  parent: ParticleEffect | null = null,
) {
  visit(effect, parent)
  for (const child of effect.children) {
    forEachParticleEffect(child, visit, effect)
  }
}

/**
 * Whether any emitter of the effect runs forever (ambient effects like fires and candles),
 * as opposed to one shot effects that are triggered by game events
 */
export function isParticleEffectImmortal(effect: ParticleEffect): boolean {
  let result = false
  forEachParticleEffect(effect, (it) => {
    const p = it.params
    if (p && p.count.base > 0 && p.spawnIndirection === 'Direct' && isImmortal(p)) {
      result = true
    }
  })
  return result
}
