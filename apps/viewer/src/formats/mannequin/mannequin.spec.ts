import { describe, expect, it } from 'vitest'
import { adbFragmentVariants, parseAnimationDatabase } from './animationDatabase'
import { parseControllerDefinition } from './controllerDefinition'
import { adbSubDatabases, selectFragmentOptions, selectFragmentVariant, type FragmentCandidate } from './selectFragment'
import { parseTagDefinition, tagDefinitionTags } from './tagDefinition'
import { splitTags } from './tags'

const BOAR_CONTROLLER = `<ControllerDef>
 <Tags filename="Animations/Mannequin/ADB/NPC_Monster/Boar_Family/Boar_Tags.xml"/>
 <Fragments filename="Animations/Mannequin/ADB/NPC_Monster/Boar_Family/Boar_Actions.xml"/>
 <FragmentDefs>
  <Idle scopes="FullBody" flags="AutoReinstall">
   <Override tags="Armadillo+CurledBall" scopes="FullBody+Weapon"/>
  </Idle>
  <r_R0_F scopes="Additive"/>
 </FragmentDefs>
 <ScopeContextDefs>
  <Char3P />
  <WeaponContext />
 </ScopeContextDefs>
 <ScopeDefs>
  <FullBody layer="0" numLayers="3" context="Char3P"/>
  <Additive layer="3" numLayers="1" context="Char3P"/>
  <Audio layer="8" numLayers="0" context="Audio"/>
  <Weapon layer="0" numLayers="2" context="WeaponContext"/>
 </ScopeDefs>
</ControllerDef>`

const BOAR_TAGS = `<TagDefinition version="2">
 <Tags>
  <Group name="Variant">
   <Tag name="Pig"/>
   <Tag name="Boar"/>
  </Group>
  <Tag name="Alerted"/>
  <Tag name="Stunned" priority="2"/>
 </Tags>
</TagDefinition>`

const ADB = `<AnimDB FragDef="actions.xml" TagDef="tags.xml">
 <SubADBs>
  <SubADB Tags="Elite" File="sub.adb">
   <FragmentID Name="Attack"/>
  </SubADB>
  <SubADB Tags="Pick" File="Player_Pick.adb"/>
 </SubADBs>
 <FragmentList>
  <Spawn>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop" flags="Loop"/>
     <Blend ExitTime="1.5333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name=""/>
    </AnimLayer>
   </Fragment>
  </Spawn>
  <Idle>
   <Fragment BlendOutDuration="0.3" Tags="Armadillo+CurledBall" FragTags="Heavy">
    <AnimLayer>
     <Animation name="armadillo_ambient_idle" flags="Loop" speed="1.25" weight="0.75" channel2="0.5"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="ParticleEffect" contextType="ParticleEffectContext">
      <ProceduralParams>
       <EffectName value="cFX_npc_Armadillo.Dust_charge01"/>
       <PosOffset>
        <Element value="1"/>
        <Element value="2"/>
        <Element value="3"/>
       </PosOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
   <Fragment Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.4" CurveType="0" flags="TimeWarping"/>
     <Animation name="boar_idle" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Idle>
 </FragmentList>
 <FragmentBlendList>
  <Blend from="Idle" to="Attack">
   <Variant from="" to="Elite" fromFrag="Light" toFrag="Heavy">
    <Fragment selectTime="0" enterTime="0.1">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     </AnimLayer>
    </Fragment>
   </Variant>
  </Blend>
 </FragmentBlendList>
</AnimDB>`

describe('splitTags', () => {
  it('splits tag expressions and drops empty parts', () => {
    expect(splitTags('Armadillo+CurledBall')).toEqual(['Armadillo', 'CurledBall'])
    expect(splitTags('')).toEqual([])
    expect(splitTags(null)).toEqual([])
    expect(splitTags(' A + B+')).toEqual(['A', 'B'])
  })
})

describe('parseControllerDefinition', () => {
  it('reads tag and fragment files, fragments with overrides and scopes', () => {
    const def = parseControllerDefinition(BOAR_CONTROLLER)
    expect(def.tags).toBe('Animations/Mannequin/ADB/NPC_Monster/Boar_Family/Boar_Tags.xml')
    expect(def.fragments).toBe('Animations/Mannequin/ADB/NPC_Monster/Boar_Family/Boar_Actions.xml')
    expect(def.fragmentDefinitions[0]).toEqual({
      name: 'Idle',
      scopes: ['FullBody'],
      flags: ['AutoReinstall'],
      overrides: [{ tags: ['Armadillo', 'CurledBall'], fragTags: [], scopes: ['FullBody', 'Weapon'] }],
    })
    expect(def.fragmentDefinitions[1]).toMatchObject({ name: 'r_R0_F', scopes: ['Additive'], flags: [] })
    expect(def.scopeContexts.map((it) => it.name)).toEqual(['Char3P', 'WeaponContext'])
    expect(def.scopes.map((it) => [it.name, it.layer, it.numLayers, it.context])).toEqual([
      ['FullBody', 0, 3, 'Char3P'],
      ['Additive', 3, 1, 'Char3P'],
      ['Audio', 8, 0, 'Audio'],
      ['Weapon', 0, 2, 'WeaponContext'],
    ])
  })
})

describe('parseTagDefinition', () => {
  it('reads version 2 tags and groups in document order', () => {
    const def = parseTagDefinition(BOAR_TAGS)
    expect(def.version).toBe(2)
    expect(def.entries.map((it) => [it.kind, it.name])).toEqual([
      ['group', 'Variant'],
      ['tag', 'Alerted'],
      ['tag', 'Stunned'],
    ])
    expect(tagDefinitionTags(def).map((it) => [it.name, it.priority])).toEqual([
      ['Pig', 0],
      ['Boar', 0],
      ['Alerted', 0],
      ['Stunned', 2],
    ])
  })

  it('reads imports and sub tag definitions', () => {
    const def = parseTagDefinition(`<TagDefinition version="2">
      <Imports><Import filename="shared_tags.xml"/></Imports>
      <Tags><Tag name="Attack" subTagDef="attack_fragtags.xml"/></Tags>
    </TagDefinition>`)
    expect(def.imports).toEqual(['shared_tags.xml'])
    expect(def.entries[0]).toMatchObject({ name: 'Attack', subTagDef: 'attack_fragtags.xml' })
  })

  it('reads version 1 with tags as element names', () => {
    const def = parseTagDefinition(
      `<TagDefinition><Stance><Crouch/><Stand priority="1"/></Stance><Swim/></TagDefinition>`,
    )
    expect(def.version).toBe(1)
    expect(def.entries.map((it) => [it.kind, it.name])).toEqual([
      ['group', 'Stance'],
      ['tag', 'Swim'],
    ])
    expect(tagDefinitionTags(def).map((it) => [it.name, it.priority])).toEqual([
      ['Crouch', 0],
      ['Stand', 1],
      ['Swim', 0],
    ])
  })
})

describe('parseAnimationDatabase', () => {
  const adb = parseAnimationDatabase(ADB)

  it('reads the definitions and sub databases', () => {
    expect(adb.fragDef).toBe('actions.xml')
    expect(adb.tagDef).toBe('tags.xml')
    expect(adb.subDatabases).toEqual([
      { tags: ['Elite'], file: 'sub.adb', fragments: ['Attack'] },
      { tags: ['Pick'], file: 'Player_Pick.adb', fragments: [] },
    ])
  })

  it('reads a layer as a sequence of blends and clips, a trailing empty clip included', () => {
    const [spawn] = adbFragmentVariants(adb, 'spawn')
    const sequence = spawn.animLayers[0].sequence
    expect(sequence.map((it) => [it.blend.exitTime, it.animation.name, it.animation.flags])).toEqual([
      [0, 'baby_sandworm_submerge_loop', []],
      [-1, 'baby_sandworm_submerge_loop', ['Loop']],
      [1.5333333, '', []],
    ])
  })

  it('reads variants with tags, the engine defaults and procedural parameters', () => {
    const [armadillo, plain] = adbFragmentVariants(adb, 'Idle')
    expect(armadillo.tags).toEqual(['Armadillo', 'CurledBall'])
    expect(armadillo.fragTags).toEqual(['Heavy'])
    expect(armadillo.blendOutDuration).toBe(0.3)
    const [clip] = armadillo.animLayers[0].sequence
    expect(clip.blend).toEqual({ exitTime: 0, startTime: 0, duration: 0.2, curveType: 0, flags: [], terminal: false })
    expect(clip.animation).toEqual({
      name: 'armadillo_ambient_idle',
      flags: ['Loop'],
      speed: 1.25,
      weight: 0.75,
      weightList: 0,
      channels: [0, 0, 0.5, 0],
    })
    const [procedural] = armadillo.procLayers[0].sequence
    expect(procedural.procedural).toEqual({
      type: 'ParticleEffect',
      contextType: 'ParticleEffectContext',
      params: { EffectName: 'cFX_npc_Armadillo.Dust_charge01', PosOffset: ['1', '2', '3'] },
    })

    expect(plain.tags).toEqual([])
    expect(plain.blendOutDuration).toBe(0.2)
    expect(plain.animLayers[0].sequence[0].blend).toMatchObject({ duration: 0.4, flags: ['TimeWarping'] })
    expect(plain.animLayers[0].sequence[0].animation).toMatchObject({ speed: 1, weight: 1 })
  })

  it('reads transitions', () => {
    expect(adb.blends.length).toBe(1)
    const [blend] = adb.blends
    expect(blend.from).toBe('Idle')
    expect(blend.to).toBe('Attack')
    const [variant] = blend.variants
    expect(variant).toMatchObject({ fromTags: [], toTags: ['Elite'], fromFragTags: ['Light'], toFragTags: ['Heavy'] })
    expect(variant.fragments[0].enterTime).toBe(0.1)
    expect(variant.fragments[0].fragment.animLayers[0].sequence).toEqual([
      {
        blend: { exitTime: 0, startTime: 0, duration: 0.2, curveType: 0, flags: [], terminal: false },
        animation: null,
      },
    ])
  })

  it('has no variants for an unknown fragment', () => {
    expect(adbFragmentVariants(adb, 'Missing')).toEqual([])
  })
})

describe('selectFragmentVariant', () => {
  const variant = (tags: string[], fragTags: string[] = []): FragmentCandidate => ({
    tags,
    fragment: { tags, fragTags, blendOutDuration: 0.2, animLayers: [], procLayers: [] },
  })

  it('takes the variant with the most tags that are all set, without regard to case', () => {
    const plain = variant([])
    const sailor = variant(['1H_Melee', 'Sailor'])
    const melee = variant(['1H_Melee'])
    const ranged = variant(['1H_Ranged', 'Pistol', 'Undead'])
    const candidates = [melee, sailor, ranged, plain]
    expect(selectFragmentVariant(candidates, ['sailor', '1h_melee'])).toBe(sailor)
    expect(selectFragmentVariant(candidates, ['1H_Melee'])).toBe(melee)
    expect(selectFragmentVariant(candidates, ['Miner', 'Undead', 'Grenade'])).toBe(plain)
    expect(selectFragmentVariant([sailor], ['Undead'])).toBeNull()
  })

  it('breaks ties by document order and ranks frag tags after plain variants', () => {
    const first = variant(['A'])
    const second = variant(['A'])
    const tagged = variant(['A'], ['Fast'])
    expect(selectFragmentVariant([tagged, first, second], ['A'])).toBe(first)
  })

  it('lists the variants with the same tags as options', () => {
    const first = variant(['A', 'B'])
    const second = variant(['b', 'a'])
    const fewer = variant(['A'])
    const tagged = variant(['A', 'B'], ['Fast'])
    expect(selectFragmentOptions([fewer, first, tagged, second], ['A', 'B'])).toEqual([first, second])
    expect(selectFragmentOptions([fewer], ['C'])).toEqual([])
  })
})

describe('adbSubDatabases', () => {
  const adb = parseAnimationDatabase(ADB)

  it('applies sub databases whose tags are set and that list the fragment or none', () => {
    expect(adbSubDatabases(adb, 'Idle', ['Pick']).map((it) => it.file)).toEqual(['Player_Pick.adb'])
    expect(adbSubDatabases(adb, 'attack', ['elite', 'Pick']).map((it) => it.file)).toEqual([
      'sub.adb',
      'Player_Pick.adb',
    ])
    expect(adbSubDatabases(adb, 'Idle', ['Elite'])).toEqual([])
  })
})
