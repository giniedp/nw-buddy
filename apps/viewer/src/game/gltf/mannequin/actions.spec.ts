import { describe, expect, it } from 'vitest'
import { bestVariant, collectFragmentActions, findIdleAction, variantMatches } from './actions'
import { loadAdbFiles } from './database'

const FILES: Record<string, string> = {
  'animations/mannequin/adb/npc.adb': `<AnimDB FragDef="a.xml" TagDef="t.xml">
    <FragmentList>
      <Idle>
        <Fragment Tags=""><AnimLayer><Animation name="idle" flags="Loop"/></AnimLayer></Fragment>
        <Fragment Tags="Bow"><AnimLayer><Animation name="bow_idle" flags="Loop"/></AnimLayer></Fragment>
      </Idle>
      <Attack_Shoot>
        <Fragment Tags="Bow"><AnimLayer><Animation name="bow_shoot"/></AnimLayer>
          <AnimLayer><Animation name="lhand_bow_pose"/></AnimLayer></Fragment>
      </Attack_Shoot>
      <Death><Fragment Tags=""><ProcLayer><Procedural type="Audio"/></ProcLayer></Fragment></Death>
    </FragmentList>
    <SubADBs><SubADB Tags="Dryad" File="Animations/Mannequin/ADB/Sub.adb"/><SubADB Tags="X" File="missing.adb"/></SubADBs>
  </AnimDB>`,
  'animations/mannequin/adb/sub.adb': `<AnimDB FragDef="a.xml" TagDef="t.xml">
    <FragmentList>
      <attack_shoot>
        <Fragment Tags="Bow+dryad"><AnimLayer><Animation name="dryad_shoot"/></AnimLayer></Fragment>
      </attack_shoot>
    </FragmentList>
  </AnimDB>`,
}

async function read(file: string) {
  const text = FILES[file]
  if (!text) {
    throw new Error(`404 ${file}`)
  }
  return text
}

describe('mannequin actions', () => {
  it('loads sub databases with their tags, missing ones are left out', async () => {
    const files = await loadAdbFiles('Animations/Mannequin/ADB/NPC.adb', read)
    expect(files.map((it) => [it.file, it.tags])).toEqual([
      ['animations/mannequin/adb/npc.adb', []],
      ['animations/mannequin/adb/sub.adb', ['Dryad']],
    ])
    await expect(loadAdbFiles('nope.adb', read)).rejects.toThrow()
  })

  it('merges the variants of all files by fragment name', async () => {
    const files = await loadAdbFiles('animations/mannequin/adb/npc.adb', read)
    const known = new Set(['idle', 'bow_idle', 'bow_shoot', 'lhand_bow_pose'])
    const actions = collectFragmentActions(files, (name) => known.has(name))
    expect(actions.map((it) => it.name)).toEqual(['Attack_Shoot', 'Idle'])
    const shoot = actions[0]
    expect(shoot.variants.map((it) => it.tags)).toEqual([['Bow'], ['Dryad', 'Bow']])
    expect(shoot.variants[0].animations).toEqual(['bow_shoot', 'lhand_bow_pose'])
    expect(shoot.variants[0].playable).toBe(true)
    expect(shoot.variants[1].playable).toBe(false)
    expect(shoot.playable).toBe(false)

    expect(variantMatches(shoot.variants[1], ['dryad', 'bow', 'archer'])).toBe(true)
    expect(variantMatches(shoot.variants[1], ['Bow'])).toBe(false)
    const idle = findIdleAction(actions)
    expect(bestVariant(idle, ['Bow', 'Archer'])?.animations).toEqual(['bow_idle'])
    expect(bestVariant(idle, ['Alligator'])?.animations).toEqual(['idle'])
    // the playable variant only
    expect(bestVariant(shoot, ['Dryad', 'Bow'])?.tags).toEqual(['Bow'])
  })
})
