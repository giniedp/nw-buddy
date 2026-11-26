import { describe, expect, it } from 'vitest'
import type { FragmentVariant } from '../../../../game/character/CharacterAssets'
import { variantClips, variantKey } from './CharacterAdbFragments.store'

/**
 * A variant with options, each a list of layers of animation names (null for an item without animation)
 */
function variant(tags: string[], options: Array<Array<Array<string | null>>>): FragmentVariant {
  return {
    tags,
    options: options.map((layers) => ({
      fragment: {
        animLayers: layers.map((names) => ({
          sequence: names.map((name) => ({ animation: name ? { name } : null })),
        })),
      },
    })),
  } as unknown as FragmentVariant
}

describe('variantKey', () => {
  it('ignores case and order of the tags', () => {
    expect(variantKey('Idle', ['Sword', '1H_Melee'])).toBe(variantKey('idle', ['1h_melee', 'SWORD']))
    expect(variantKey('Idle', [])).toBe('idle|')
  })

  it('tells fragments and tag sets apart', () => {
    expect(variantKey('Idle', ['Sword'])).not.toBe(variantKey('Sprint', ['Sword']))
    expect(variantKey('Idle', ['Sword'])).not.toBe(variantKey('Idle', ['Axe']))
  })
})

describe('variantClips', () => {
  it('collects the animations of every option and layer once', () => {
    const it = variant(['Sword'], [[['idle_a', 'idle_b'], ['upper_a']], [['idle_a', null]]])
    expect(variantClips(it)).toEqual(['idle_a', 'idle_b', 'upper_a'])
  })

  it('is empty for a variant without animations', () => {
    expect(variantClips(variant([], [[[null]]]))).toEqual([])
  })
})
