import { dimensionRange } from '../../../../game/character/blendSpace'
import type { CharacterComponent } from '../../../../game/character/CharacterComponent'
import { isBlendSpaceSource, type BlendSpaceState } from '../../../../game/character/sources'
import type { BlendDimension, PlayState } from './types'

/**
 * The newest entry of the base layer: the one a new play faded in last
 */
export function newestEntry(character: CharacterComponent) {
  const entries = character.mixer?.entries(0) ?? []
  return entries[entries.length - 1] ?? null
}

/**
 * A non looping entry that played to its end: it holds the last pose, Play starts it over
 */
export function hasEnded(entry: NonNullable<ReturnType<typeof newestEntry>>) {
  return !entry.loop && entry.time >= 1
}

/**
 * What plays on the character, read from its mixer
 */
export function readPlayState(character: CharacterComponent): PlayState {
  const entry = newestEntry(character)
  const source = entry?.source ?? null
  let blend: BlendDimension[] | null = null
  let blendWeights = ''
  if (isBlendSpaceSource(source)) {
    const space = source.space
    const state = entry.state as BlendSpaceState
    blend = space.dimensions.map((it, i) => {
      const [min, max] = dimensionRange(space, i)
      // the value the blend space plays with: a locked dimension latched it at the entry start
      return { name: it.name, param: it.param, min, max, value: state.params[i] }
    })
    blendWeights = space.slots
      .map((slot, i) => ({ name: slot.animation, weight: state.weights[i] }))
      .filter((it) => it.weight !== 0)
      .sort((a, b) => b.weight - a.weight)
      .map((it) => `${it.name} ${it.weight.toFixed(2)}`)
      .join(' · ')
  }
  return {
    name: entry ? character.entryName(entry) || null : null,
    seconds: entry?.seconds ?? 0,
    duration: source?.duration ?? 0,
    // an ended clip shows Play, it does not move
    paused: character.paused || (!!entry && hasEnded(entry)),
    blend,
    blendWeights,
  }
}
