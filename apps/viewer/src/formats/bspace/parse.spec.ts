import { describe, expect, it } from 'vitest'
import { parseBlendSpace, type CombinedBlendSpace, type ParaGroupBlendSpace } from './parse'

// animations/gameplay/character/npc/mounts/turkey/blendspace/mount_turkey_movement_walk_blend.bspace (VGrid shortened)
const TURKEY_WALK = `<ParaGroup>
 <Dimensions>
  <Param Name="MoveSpeed" Min="1.5" Max="3.5" Cells="5"/>
  <Param Name="TurnSpeed" Min="-2.5" Max="2.5" Cells="5"/>
 </Dimensions>
 <ExampleList>
  <Example SetPara0="3.5" SetPara1="-2.5" AName="mount_turkey_walk_turn_r" PlaybackScale="2"/>
  <Example SetPara0="3.5" SetPara1="0" AName="mount_turkey_walk" PlaybackScale="2"/>
  <Example SetPara0="3.5" SetPara1="2.5" AName="mount_turkey_walk_turn_l" PlaybackScale="2"/>
  <Example SetPara0="1.6" SetPara1="-2.5" AName="mount_turkey_walk_turn_r"/>
  <Example SetPara0="1.6" SetPara1="0" AName="mount_turkey_walk"/>
  <Example SetPara0="1.6" SetPara1="2.5" AName="mount_turkey_walk_turn_l"/>
 </ExampleList>
 <Blendable>
  <Face p0="0" p1="1" p2="4"/>
  <Face p0="0" p1="4" p2="3"/>
  <Face p0="1" p1="2" p2="4"/>
  <Face p0="2" p1="5" p2="4"/>
 </Blendable>
 <VGrid>
${'  <VExample i0="3" i1="0" i2="0" i3="0" w0="1" w1="0" w2="0" w3="0"/>\n'.repeat(24)}  <VExample i0="2" i1="4" i2="5" i3="0" w0="0.25" w1="0.5" w2="0.25" w3="0"/>
 </VGrid>
</ParaGroup>`

// animations/gameplay/character/npc/natural/chameleon/blendspaces/chameleon_combat_turn_blend_comb.comb
const CHAMELEON_COMB = `<CombinedBlendSpace>
 <Dimensions>
  <Param Name="DesiredFacing" ParaScale="1" ChooseBlendSpace="1" Locked="1"/>
 </Dimensions>
 <AdditionalExtraction>
  <Param Name="MoveSpeed"/>
  <Param Name="TravelAngle"/>
  <Param Name="TurnSpeed"/>
 </AdditionalExtraction>
 <BlendSpaces>
  <BlendSpace AName="animations/gameplay/character/npc/natural/chameleon/blendspaces/chameleon_combat_turn_blend_l.bspace"/>
  <BlendSpace AName="animations/gameplay/character/npc/natural/chameleon/blendspaces/chameleon_combat_turn_blend_r.bspace"/>
 </BlendSpaces>
 <MotionCombination />
 <JointList />
</CombinedBlendSpace>`

describe('parseBlendSpace', () => {
  it('reads dimensions, examples and faces of a ParaGroup', () => {
    const space = parseBlendSpace(TURKEY_WALK) as ParaGroupBlendSpace
    expect(space.kind).toBe('paragroup')
    expect(space.dimensions.map((it) => [it.name, it.min, it.max, it.cells])).toEqual([
      ['MoveSpeed', 1.5, 3.5, 5],
      ['TurnSpeed', -2.5, 2.5, 5],
    ])
    expect(space.examples.length).toBe(6)
    expect(space.examples[0]).toEqual({
      animation: 'mount_turkey_walk_turn_r',
      blendExample: '',
      playbackScale: 2,
      params: [3.5, -2.5, null, null],
    })
    expect(space.examples[4].playbackScale).toBe(1)
    expect(space.faces).toEqual([
      [0, 1, 4],
      [0, 4, 3],
      [1, 2, 4],
      [2, 5, 4],
    ])
    expect(space.threshold).toBeNull()
    expect(space.idleToMove).toBe(false)
  })

  it('keeps the virtual grid when it has one corner per cell', () => {
    const space = parseBlendSpace(TURKEY_WALK) as ParaGroupBlendSpace
    expect(space.virtualGrid.length).toBe(25)
    expect(space.virtualGrid[24]).toEqual({ indices: [2, 4, 5, 0], weights: [0.25, 0.5, 0.25, 0] })
  })

  it('drops a virtual grid that does not match the cells', () => {
    const space = parseBlendSpace(TURKEY_WALK.replace('Cells="5"/>\n </Dimensions>', 'Cells="6"/>\n </Dimensions>'))
    expect((space as ParaGroupBlendSpace).virtualGrid).toBeNull()
  })

  it('reads attributes without regard to case, with the engine minimums', () => {
    const space = parseBlendSpace(`<ParaGroup>
      <Dimensions><Param name="TravelAngle" min="-3.14" max="3.14" cells="1" scale="0" locked="1" skey="0.1" ekey="0.9"/></Dimensions>
      <AdditionalExtraction><Param name="TravelAngle"/></AdditionalExtraction>
      <ExampleList><BlendExample aname="other.bspace"/></ExampleList>
      <THRESHOLD tz="0.5"/><RAMPZ tx="2"/><VEGPARAMS Idle2Move="1"/><TimeWarpGroup name="run"/>
      <JointList><Joint Name="Bip01 Spine"/></JointList>
    </ParaGroup>`) as ParaGroupBlendSpace
    expect(space.dimensions[0]).toMatchObject({
      name: 'TravelAngle',
      cells: 3,
      scale: 0.01,
      locked: true,
      skey: 0.1,
      ekey: 0.9,
    })
    expect(space.additionalExtraction).toEqual(['TravelAngle'])
    expect(space.examples[0]).toMatchObject({ animation: '', blendExample: 'other.bspace' })
    expect(space.threshold).toBe(0.5)
    expect(space.rampZ).toBe(2)
    expect(space.idleToMove).toBe(true)
    expect(space.timewarpGroup).toBe('run')
    expect(space.jointList).toEqual(['Bip01 Spine'])
    expect(space.virtualGrid).toBeNull()
  })

  it('reads a CombinedBlendSpace', () => {
    const space = parseBlendSpace(CHAMELEON_COMB) as CombinedBlendSpace
    expect(space.kind).toBe('combined')
    expect(space.dimensions[0]).toMatchObject({
      name: 'DesiredFacing',
      paraScale: 1,
      chooseBlendSpace: true,
      locked: true,
    })
    expect(space.additionalExtraction).toEqual(['MoveSpeed', 'TravelAngle', 'TurnSpeed'])
    expect(space.blendSpaces).toEqual([
      'animations/gameplay/character/npc/natural/chameleon/blendspaces/chameleon_combat_turn_blend_l.bspace',
      'animations/gameplay/character/npc/natural/chameleon/blendspaces/chameleon_combat_turn_blend_r.bspace',
    ])
    expect(space.jointList).toEqual([])
  })

  it('rejects other documents', () => {
    expect(() => parseBlendSpace('<AnimDB/>')).toThrow(/Not a blend space/)
  })
})
