import { describe, expect, it } from 'vitest'
import { parseAnimationDatabase } from '../../../formats/mannequin'
import { collectFragmentActions } from './actions'
import { fragmentCategory, summarizeFragments, variantFacts } from './summary'

// a shared database: the archer's own variants (tagged), generic ones, and an attack of another creature
const ADB = `<AnimDB FragDef="a.xml" TagDef="t.xml">
 <FragmentList>
  <Idle>
   <Fragment Tags=""><AnimLayer><Animation name="idle" flags="Loop"/></AnimLayer></Fragment>
   <Fragment Tags="Bow"><AnimLayer><Animation name="bow_idle" flags="Loop"/></AnimLayer></Fragment>
  </Idle>
  <Archer_Charged_Melee_Attack>
   <Fragment Tags="Bow">
    <AnimLayer><Animation name="bow_melee"/></AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.7"/>
     <Procedural type="CAGE-Damage"><ProceduralParams><DamageTableRow value="Dryad_Charged_Melee"/></ProceduralParams></Procedural>
     <Blend ExitTime="0.2"/>
     <Procedural type=""/>
    </ProcLayer>
   </Fragment>
  </Archer_Charged_Melee_Attack>
  <Undead_Hunter_Torch_Swing>
   <Fragment Tags="">
    <AnimLayer><Animation name="torch_swing"/></AnimLayer>
    <ProcLayer><Procedural type="CAGE-Damage"><ProceduralParams><DamageTableRow value="Undead_Hunter_Torch_Swing"/></ProceduralParams></Procedural></ProcLayer>
   </Fragment>
  </Undead_Hunter_Torch_Swing>
  <Mage_Arcane_Shield>
   <Fragment Tags="">
    <AnimLayer><Animation name="mage_shield"/></AnimLayer>
    <ProcLayer><Procedural type="CAGE-CastSpell"><ProceduralParams><SpellName value="Archer_Shield"/></ProceduralParams></Procedural></ProcLayer>
   </Fragment>
  </Mage_Arcane_Shield>
  <r_Death>
   <Fragment Tags=""><AnimLayer><Animation name="death"/></AnimLayer></Fragment>
  </r_Death>
  <Move>
   <Fragment Tags=""><AnimLayer><Animation name="move_bspace" flags="Loop"/></AnimLayer></Fragment>
  </Move>
  <Sprint>
   <Fragment Tags="Sword"><AnimLayer><Animation name="sword_sprint" flags="Loop"/></AnimLayer></Fragment>
  </Sprint>
 </FragmentList>
</AnimDB>`

const files = [{ file: 'npc.adb', tags: [], document: parseAnimationDatabase(ADB) }]
const known = new Set(['idle', 'bow_idle', 'bow_melee', 'torch_swing', 'mage_shield', 'death', 'sword_sprint'])
const actions = collectFragmentActions(files, (name) => known.has(name))
const TAGS = ['Archer', 'Bow', 'Dryad']

describe('fragment summary', () => {
  it('sorts fragments into categories by name and procedural clips', () => {
    expect(fragmentCategory('Idle', [])).toBe('idle')
    expect(fragmentCategory('r_Death', [])).toBe('death')
    expect(fragmentCategory('r_R2_F', [])).toBe('reaction')
    expect(fragmentCategory('Sprint', ['Homing'])).toBe('movement')
    expect(fragmentCategory('Mage_Arcane_Shield', ['CAGE-CastSpell'])).toBe('attack')
    expect(fragmentCategory('Attack_Bite', [])).toBe('attack')
    expect(fragmentCategory('Spawn', [])).toBe('spawn')
    expect(fragmentCategory('Phase_2_Enrage', [])).toBe('other')
  })

  it('reads the facts of a variant', () => {
    const melee = actions.find((it) => it.name === 'Archer_Charged_Melee_Attack')
    expect(variantFacts(melee.variants[0])).toEqual({
      types: ['CAGE-Damage'],
      references: ['Dryad_Charged_Melee'],
      loops: false,
    })
    const idle = actions.find((it) => it.name === 'Idle')
    expect(variantFacts(idle.variants[1]).loops).toBe(true)
  })

  it('chooses the variant and tells own from foreign fragments', () => {
    const own = new Set(['dryad_charged_melee', 'archer_shield'])
    const summary = Object.fromEntries(summarizeFragments(actions, TAGS, own).map((it) => [it.action.name, it]))
    expect(summary['Idle'].variant.animations).toEqual(['bow_idle'])
    expect(summary['Idle'].matching.map((it) => it.animations[0])).toEqual(['bow_idle', 'idle'])
    expect(summary['Idle'].own).toBe(true)
    // tagged for the creature
    expect(summary['Archer_Charged_Melee_Attack'].own).toBe(true)
    // generic, the damage row is another creature's
    expect(summary['Undead_Hunter_Torch_Swing'].own).toBe(false)
    // generic, the spell is the creature's
    expect(summary['Mage_Arcane_Shield'].own).toBe(true)
    // generic without references
    expect(summary['r_Death'].own).toBe(true)
    // a matching variant the character cannot play (a blend space without clip): shown, not playable
    expect(summary['Move'].variant.playable).toBe(false)
    expect(summary['Move'].variant.missing).toEqual(['move_bspace'])
    expect(summary['Move'].own).toBe(true)
    expect(summary['Move'].category).toBe('movement')
    // no variant for the tags
    expect(summary['Sprint'].variant).toBeNull()
    expect(summary['Sprint'].own).toBe(false)
    // unknown ids: generic fragments count as own
    const unknown = summarizeFragments(actions, TAGS, null).find((it) => it.action.name === 'Undead_Hunter_Torch_Swing')
    expect(unknown.own).toBe(true)
  })

  it('tells what is missing', () => {
    const partial = collectFragmentActions(files, (name) => name !== 'bow_melee')
    const melee = partial.find((it) => it.name === 'Archer_Charged_Melee_Attack')
    expect(melee.variants[0].playable).toBe(false)
    expect(melee.variants[0].missing).toEqual(['bow_melee'])
  })
})
