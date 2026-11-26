import type { FragmentAction, FragmentCategory, FragmentSummary, FragmentVariant } from '@nw-buddy/viewer'
import { availableTags, buildActionList, variantLabel } from './model-view-actions.model'

function variant(action: string, tags: string[], options: Partial<FragmentVariant> = {}): FragmentVariant {
  return {
    action,
    tags,
    file: 'npc.adb',
    animations: [`${action.toLowerCase()}_clip`],
    playable: true,
    missing: [],
    fragment: { tags, fragTags: [], blendOutDuration: 0.2, animLayers: [], procLayers: [] },
    ...options,
  }
}

function summary(
  name: string,
  category: FragmentCategory,
  options: { own?: boolean; variants?: FragmentVariant[]; types?: string[]; references?: string[]; loops?: boolean },
): FragmentSummary {
  const variants = options.variants ?? [variant(name, [])]
  const action: FragmentAction = { name, variants, playable: variants.every((it) => it.playable) }
  const chosen = variants.find((it) => it.playable) ?? variants[0] ?? null
  return {
    action,
    category,
    variant: options.own === false ? null : chosen,
    matching: options.own === false ? [] : variants,
    facts: { types: options.types ?? [], references: options.references ?? [], loops: !!options.loops },
    own: options.own ?? true,
  }
}

const label = (name: string) => name.replace(/_/g, ' ')

const SUMMARIES: FragmentSummary[] = [
  summary('Attack_Bite', 'attack', {
    types: ['CAGE-Damage', 'Homing'],
    references: ['Attack_Bite'],
    variants: [variant('Attack_Bite', ['Bow']), variant('Attack_Bite', [])],
  }),
  summary('Cast_Fireball', 'attack', { types: ['CAGE-CastSpell'], references: ['Fireball_Spell'] }),
  summary('Undead_Torch_Swing', 'attack', { own: false, types: ['CAGE-Damage'], references: ['Torch'] }),
  summary('Idle', 'idle', { loops: true, variants: [variant('Idle', ['Young'])] }),
  summary('Move', 'movement', {
    variants: [variant('Move', [], { playable: false, missing: ['move_bspace'] })],
  }),
]

describe('model view actions', () => {
  it('groups the rows in category order and leaves out other creatures', () => {
    const list = buildActionList(SUMMARIES, { search: '', showForeign: false, label })
    expect(list.groups.map((it) => it.category)).toEqual(['attack', 'idle', 'movement'])
    expect(list.groups[0].rows.map((it) => it.label)).toEqual(['Attack Bite', 'Cast Fireball'])
    expect(list.foreign).toBe(1)
    expect(list.rows.length).toBe(4)
  })

  it('describes a row by its facts', () => {
    const list = buildActionList(SUMMARIES, { search: '', showForeign: false, label })
    const [bite, cast] = list.groups[0].rows
    expect([bite.damage, bite.spell, bite.homing, bite.loops]).toEqual([true, false, true, false])
    expect([cast.damage, cast.spell]).toEqual([false, true])
    expect(bite.others.map(variantLabel)).toEqual(['default'])
    const move = list.rows.find((it) => it.id === 'Move')
    expect(move.playable).toBe(false)
    expect(move.missing).toEqual(['move_bspace'])
    expect(list.rows.find((it) => it.id === 'Idle').loops).toBe(true)
  })

  it('shows other creatures on demand, playing their first playable variant', () => {
    const list = buildActionList(SUMMARIES, { search: '', showForeign: true, label })
    const torch = list.rows.find((it) => it.id === 'Undead_Torch_Swing')
    expect(torch.variant?.action).toBe('Undead_Torch_Swing')
    expect(torch.playable).toBe(true)
  })

  it('searches names and referenced ids', () => {
    expect(buildActionList(SUMMARIES, { search: 'bite', showForeign: false, label }).rows.map((it) => it.id)).toEqual([
      'Attack_Bite',
    ])
    expect(
      buildActionList(SUMMARIES, { search: 'fireball_spell', showForeign: false, label }).rows.map((it) => it.id),
    ).toEqual(['Cast_Fireball'])
    const torch = buildActionList(SUMMARIES, { search: 'torch', showForeign: false, label })
    expect(torch.rows.length).toBe(0)
    expect(torch.foreign).toBe(1)
  })

  it('offers the tags of the variants that are not set', () => {
    expect(availableTags(SUMMARIES, ['bow'])).toEqual(['Young'])
  })
})
