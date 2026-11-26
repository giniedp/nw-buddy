import { describe, expect, it } from 'vitest'
import type { ParticleEffectNode, ParticleLibraryDocument } from '../../../../formats/particles/parse'
import { describeEffect, effectInfo, filterEffects, playableEffects } from './ParticleMode.store'

function node(
  fullName: string,
  attrs: Record<string, string> | null,
  children: ParticleEffectNode[] = [],
): ParticleEffectNode {
  return { name: fullName.split('.').pop() ?? fullName, fullName, attrs, children } as ParticleEffectNode
}

describe('playableEffects', () => {
  it('keeps effects with params or sub emitters, drops empty folders', () => {
    const library = {
      effects: [
        node('Lib.Fire', { Count: '4' }),
        node('Lib.Empty', null),
        node('Lib.Folder', null, [node('Lib.Folder.Spark', {})]),
      ],
    } as unknown as ParticleLibraryDocument
    expect(playableEffects(library).map((it) => it.fullName)).toEqual(['Lib.Fire', 'Lib.Folder'])
    expect(playableEffects(undefined)).toEqual([])
  })
})

describe('filterEffects', () => {
  const effects = [node('Lib.Candle_Flame', {}), node('Lib.Torch', {})]

  it('matches the full name, case ignored', () => {
    expect(filterEffects(effects, 'CANDLE').map((it) => it.fullName)).toEqual(['Lib.Candle_Flame'])
    expect(filterEffects(effects, '')).toBe(effects)
  })
})

describe('labels', () => {
  it('counts all sub emitters of an effect', () => {
    const effect = node('Lib.Fire', {}, [
      node('Lib.Fire.Glow', {}, [node('Lib.Fire.Glow.Core', {})]),
      node('Lib.Fire.Smoke', {}),
    ])
    expect(describeEffect(effect)).toBe('+3')
    expect(describeEffect(node('Lib.Spark', {}))).toBe('')
  })

  it('tells the shown effect with its stats', () => {
    expect(effectInfo(null, null)).toBe('no effect · one shots restart every 3 s')
    expect(effectInfo('Lib.Fire', { state: 'playing', emitters: 2, particles: 40 })).toBe(
      'Lib.Fire · playing · 2 emitters · 40 particles · one shots restart every 3 s',
    )
  })
})
