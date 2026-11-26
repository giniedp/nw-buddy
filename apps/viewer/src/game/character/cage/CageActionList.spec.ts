import { AnimationMixer, AnimationPose, AnimationRig, type AnimationSource } from '@gglib/model'
import { SpaceBasis } from '@gglib/math'
import { describe, expect, it, vi } from 'vitest'
import { CageGridCells, parseActionGrid, parseActionList } from '../../../formats/cage'
import {
  adbFragmentVariants,
  parseAnimationDatabase,
  parseControllerDefinition,
  parseTagDefinition,
  type FragmentCandidate,
} from '../../../formats/mannequin'
import { MannequinController } from '../mannequin/MannequinController'
import { MannequinTags, type MannequinSetup } from '../mannequin/setup'
import { CageActionList, type CageGraph } from './CageActionList'
import { CageInput } from './CageInput'
import { CageMotion } from './CageMotion'
import { CAGE_SWORD, CagePaperdoll } from './CagePaperdoll'

const CONTROLLER = `<ControllerDef>
 <Tags filename="tags.xml"/>
 <Fragments filename="actions.xml"/>
 <FragmentDefs>
  <Idle scopes="FullBody" flags="AutoReinstall+TimewarpAutoReinstall"/>
  <Strafe scopes="FullBody"/>
  <Dodge_Roll scopes="FullBody"/>
  <Dodge_Roll_Fast scopes="FullBody"/>
  <Unsheathe_UpperBody scopes="UpperBody"/>
  <Nav_Stop scopes="FullBody"/>
  <Attack_Start scopes="FullBody"/>
  <Attack_Light scopes="FullBody"/>
  <Attack_Heavy scopes="FullBody"/>
 </FragmentDefs>
 <ScopeContextDefs><Char3P/></ScopeContextDefs>
 <ScopeDefs>
  <FullBody layer="0" numLayers="2" context="Char3P"/>
  <UpperBody layer="4" numLayers="1" context="Char3P"/>
 </ScopeDefs>
</ControllerDef>`

const TAGS = `<TagDefinition version="2">
 <Tags>
  <Tag name="Idle"/>
  <Tag name="Dodging"/>
  <Tag name="Moving"/>
  <Tag name="Unarmed"/>
  <Tag name="1H_Melee"/>
  <Tag name="Sword"/>
  <Group name="NavDirection"><Tag name="ForwardNav"/><Tag name="BackNav"/></Group>
 </Tags>
</TagDefinition>`

// the dodge holds `CanTransition` from 0.5 s to 0.8 s (a CAGE-Named clip, ended by an empty one)
const ADB = `<AnimDB FragDef="actions.xml" TagDef="tags.xml">
 <FragmentList>
  <Idle>
   <Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="idle" flags="Loop"/></AnimLayer></Fragment>
   <Fragment BlendOutDuration="0.2" Tags="Sword"><AnimLayer><Animation name="idle_sword" flags="Loop"/></AnimLayer></Fragment>
  </Idle>
  <Strafe><Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="run" flags="Loop"/></AnimLayer></Fragment></Strafe>
  <Dodge_Roll>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer><Animation name="roll"/></AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.5" StartTime="0" Duration="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext"><ProceduralParams><Name value="CanTransition"/></ProceduralParams></Procedural>
     <Blend ExitTime="0.3" StartTime="0" Duration="0"/>
     <Procedural type=""/>
    </ProcLayer>
   </Fragment>
  </Dodge_Roll>
  <Dodge_Roll_Fast><Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="roll_fast"/></AnimLayer></Fragment></Dodge_Roll_Fast>
  <Unsheathe_UpperBody><Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="draw"/></AnimLayer></Fragment></Unsheathe_UpperBody>
  <Attack_Start>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer><Animation name="windup"/></AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0"/>
     <Procedural type="CAGE-TransitionInstant"><ProceduralParams><Input value=""/><BackTicks value="0"/><Condition value="Released"/><NewAction value="Attack_Light"/><HoldTimeRequired value="-1"/></ProceduralParams></Procedural>
     <Blend ExitTime="0.3" StartTime="0" Duration="0"/>
     <Procedural type=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0"/>
     <Procedural type="CAGE-TransitionBuffered"><ProceduralParams><Input value="attack"/><BackTicks value="0"/><Condition value=""/><NewAction value="Attack_Heavy"/><HoldTimeRequired value="-1"/></ProceduralParams></Procedural>
     <Blend ExitTime="0.3" StartTime="0" Duration="0"/>
     <Procedural type=""/>
    </ProcLayer>
   </Fragment>
  </Attack_Start>
  <Attack_Light><Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="light"/></AnimLayer></Fragment></Attack_Light>
  <Attack_Heavy><Fragment BlendOutDuration="0.2" Tags=""><AnimLayer><Animation name="heavy"/></AnimLayer></Fragment></Attack_Heavy>
  <Nav_Stop><Fragment BlendOutDuration="0.2" Tags="ForwardNav"><AnimLayer><Animation name="stop"/></AnimLayer></Fragment></Nav_Stop>
 </FragmentList>
</AnimDB>`

const GRID = `<Grid>
 <Aliases><Alias Name="Idle"/><Alias Name="Nav"/><Alias Name="Dodge"/><Alias Name="Sheathe"/><Alias Name="Attack"/></Aliases>
 <TransitionRules>
  <Rule From="*" To="*" Transition="Never"/>
  <Rule From="Idle" To="*" Transition="Always"/>
  <Rule From="Idle" To="Idle" Transition="Never"/>
  <Rule From="Nav" To="*" Transition="Always"/>
  <Rule From="Nav" To="Idle,Nav" Transition="Never"/>
  <Rule From="Dodge" To="Nav">
   <Condition><IfMannequinMarker MarkerName="CanTransition"/></Condition>
  </Rule>
  <Rule From="Sheathe" To="*" Transition="Always"/>
 </TransitionRules>
 <ActionLists>
  <ActionList Path="Main.actionlist">
   <AliasMap>
    <Action ActionName="Idle" Alias="Idle"/>
    <Action ActionName="Nav" Alias="Nav"/>
    <Action ActionName="Dodge" Alias="Dodge"/>
    <Action ActionName="Unsheathe" Alias="Sheathe"/>
    <Action ActionName="Nav_Stop" Alias="Nav"/>
    <Action ActionName="Attack_Start" Alias="Attack"/>
    <Action ActionName="Attack_Light" Alias="Attack"/>
    <Action ActionName="Attack_Heavy" Alias="Attack"/>
   </AliasMap>
  </ActionList>
 </ActionLists>
 <VirtualInputLists><ActionList Path="Input.actionlist"/></VirtualInputLists>
</Grid>`

const MAIN = `<ActionList>
 <Actions>
  <Action Name="Idle" FragmentName="Idle">
   <ActivationCondition><Or><True/><IfSomethingNew/></Or></ActivationCondition>
   <Activities>
    <SetMannequinTag><Default TagName="Idle" OnEnter="Set" OnExit="Unset"/></SetMannequinTag>
    <CameraRelativeMotion><Default Decel="20,20,0"/></CameraRelativeMotion>
   </Activities>
  </Action>
  <Action Name="Nav" FragmentName="Strafe">
   <ActivationCondition><IfInput InputName="ForwardNav"/></ActivationCondition>
   <DeactivationCondition><Not><IfInput InputName="ForwardNav"/></Not></DeactivationCondition>
   <Activities>
    <SetMannequinTag><Default TagName="Moving" OnEnter="Set" OnExit="Unset"/></SetMannequinTag>
    <InputRelativeFacing><Default TurnRate="1" UseExponentialTurnRate="true" ForwardInput="ForwardNav" BackwardInput="moveback"/></InputRelativeFacing>
    <CharacterRelativeMovement><Default Forced="true" Speed="0,4,0" Accel="0,100,0" Decel="30,30,30"/></CharacterRelativeMovement>
   </Activities>
  </Action>
  <Action Name="Dodge" FragmentName="Dodge_Roll">
   <ActivationCondition>
    <And><IfInput InputName="dodge"/><Not><IfMannequinTag TagName="Dodging"/></Not></And>
   </ActivationCondition>
   <DeactivationCondition><IfFragmentDone UseHostActionFragment="true" ExitOffsetSeconds="0"/></DeactivationCondition>
   <Activities>
    <ClearInput><Default InputName="dodge" OnEnter="Clear" OnExit="NoEffect"/></ClearInput>
    <SetMannequinTag><Default TagName="Dodging" OnEnter="Set" OnExit="Unset"/></SetMannequinTag>
    <SetMannequinTag><Default TagName="Moving" OnEnter="Set" OnExit="NoEffect"/></SetMannequinTag>
    <IfThenElse>
     <IfCondition><IfExternalCondition ConditionName="Fast"/></IfCondition>
     <ThenActivity><ChangeActionFragment><Default UseDefaultFragment="false" FragmentName="Dodge_Roll_Fast"/></ChangeActionFragment></ThenActivity>
    </IfThenElse>
    <AnimationDrivenMotion><Default MotionMultiplier="1.28"/></AnimationDrivenMotion>
   </Activities>
  </Action>
  <Action Name="Unsheathe" FragmentName="Unsheathe_UpperBody">
   <ActivationCondition>
    <And><IfInput InputName="sheathe"/><IfItemSheathed SlotToCheckAlias="MAIN_HAND_OPTION_1"/></And>
   </ActivationCondition>
   <DeactivationCondition><IfFragmentDone UseHostActionFragment="true"/></DeactivationCondition>
   <Activities>
    <SheatheWeapon><Default SheatheOption="UnSheathe" SlotToSheathe="MAIN_HAND_OPTION_1" OnEnter="Set" OnExit="NoEffect"/></SheatheWeapon>
    <SetMannequinTag><Default TagName="Unarmed" OnEnter="Unset" OnExit="NoEffect"/></SetMannequinTag>
    <SetMannequinTagFromSource><Default TagSource="PaperdollSlot" SourceSlot="MAIN_HAND_OPTION_1" OnEnter="Set" OnExit="Unset"/></SetMannequinTagFromSource>
   </Activities>
  </Action>
  <Action Name="Nav_Stop" FragmentName="Nav_Stop">
   <ActivationCondition><IfInput InputName="stop"/></ActivationCondition>
   <DeactivationCondition><IfFragmentDone/></DeactivationCondition>
   <Activities>
    <SetMannequinTag><Default TagName="ForwardNav" OnEnter="Set" OnExit="Unset"/></SetMannequinTag>
    <IfThenElse>
     <IfCondition><True/></IfCondition>
     <ThenActivity><ClearMannequinTagGroup><Default TagGroupName="NavDirection" OnEnter="Clear" OnExit="Clear"/></ClearMannequinTagGroup></ThenActivity>
    </IfThenElse>
   </Activities>
  </Action>
  <Action Name="Attack_Start" FragmentName="Attack_Start">
   <ActivationCondition><IfInput InputName="attack" BackTicks="1"/></ActivationCondition>
  </Action>
  <Action Name="Attack_Light" FragmentName="Attack_Light">
   <ActivationCondition><Not><True/></Not></ActivationCondition>
   <DeactivationCondition><IfFragmentDone/></DeactivationCondition>
  </Action>
  <Action Name="Attack_Heavy" FragmentName="Attack_Heavy">
   <ActivationCondition><Not><True/></Not></ActivationCondition>
   <DeactivationCondition><IfFragmentDone/></DeactivationCondition>
  </Action>
  <Action Name="NotInGrid" FragmentName="Idle">
   <ActivationCondition><True/></ActivationCondition>
  </Action>
 </Actions>
 <Conditions>
  <IfMannequinTag Name="Fast" TagName="Sword"/>
  <Not Name="Released"><IfInput InputName="attack"/></Not>
 </Conditions>
</ActionList>`

const INPUT = `<ActionList>
 <Conditions>
  <Or Name="ForwardNav"><IfInput InputName="moveforward"/></Or>
 </Conditions>
</ActionList>`

function source(name: string): AnimationSource {
  return { duration: 1, additive: false, createState: () => name, sample: () => {} }
}

function createList() {
  const setup: MannequinSetup = {
    database: 'test.adb',
    controllerDefinition: 'test.xml',
    controller: parseControllerDefinition(CONTROLLER),
    tags: new MannequinTags([parseTagDefinition(TAGS)]),
    context: 'Char3P',
  }
  const rig = new AnimationRig({ names: ['root'], parents: [-1], defaultPose: new AnimationPose(1) })
  const mixer = new AnimationMixer(rig)
  const adb = parseAnimationDatabase(ADB)
  const controller = new MannequinController(setup, {
    mixer,
    source: async (name) => source(name),
    candidates: async (fragment): Promise<FragmentCandidate[]> =>
      adbFragmentVariants(adb, fragment).map((it) => ({ fragment: it, tags: it.tags })),
    transitions: async () => [],
  })
  const grid = parseActionGrid(GRID)
  const graph: CageGraph = {
    grid,
    cells: new CageGridCells(grid),
    lists: new Map([
      ['main.actionlist', parseActionList(MAIN)],
      ['input.actionlist', parseActionList(INPUT)],
    ]),
  }
  const motion = new CageMotion(SpaceBasis.Z_UP_POS_Y)
  const list = new CageActionList(graph, motion, new CagePaperdoll([CAGE_SWORD]))
  list.bind(controller)
  const keys = new Set<string>()
  const step = async (seconds: number, dt = 0.05) => {
    for (let t = 0; t < seconds - 1e-6; t += dt) {
      list.step(dt, keys)
      controller.update(dt)
      mixer.update(dt)
      // the controller's queries resolve
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
  const installed = () => list.running().map((it) => `${it.name}:${it.status}`)
  return { list, controller, motion, keys, step, installed }
}

describe('CageInput', () => {
  it('holds, presses and clears', () => {
    const input = new CageInput()
    input.begin(['dodge'])
    expect(input.isHeld('dodge')).toBe(true)
    expect(input.wasPressed('dodge', 0)).toBe(true)
    input.begin(['dodge'])
    expect(input.pressAge('dodge')).toBe(1)
    expect(input.wasPressed('dodge', 0)).toBe(false)
    expect(input.wasPressed('dodge', 20)).toBe(true)
    input.clear('dodge')
    expect(input.wasPressed('dodge', 20)).toBe(false)
    // cleared, still held: no new press
    input.begin(['dodge'])
    expect(input.isHeld('dodge')).toBe(true)
    expect(input.wasPressed('dodge', 20)).toBe(false)
    input.begin([])
    expect(input.isHeld('dodge')).toBe(false)
    input.setVirtual('forwardnav', true)
    input.begin([])
    expect(input.isHeld('forwardnav')).toBe(true)
  })
})

describe('CageActionList', () => {
  it('builds the actions the grid names', () => {
    const { list } = createList()
    expect(list.actions.map((it) => it.name)).toEqual([
      'Idle',
      'Nav',
      'Dodge',
      'Unsheathe',
      'Nav_Stop',
      'Attack_Start',
      'Attack_Light',
      'Attack_Heavy',
    ])
  })

  it('starts idle, runs while the virtual input holds, returns to idle', async () => {
    const { list, controller, motion, keys, step, installed } = createList()
    await step(0.1)
    expect(installed()).toEqual(['Idle:Installed'])
    expect(controller.tags.has('Idle')).toBe(true)

    keys.add('moveforward')
    await step(0.5)
    expect(installed()).toEqual(['Nav:Installed'])
    // Idle exited
    expect(controller.tags.has('Idle')).toBe(false)
    expect(controller.current?.fragment).toBe('Strafe')
    expect(motion.horizontalSpeed).toBeCloseTo(4, 3)

    keys.delete('moveforward')
    await step(0.2)
    // Nav finished, Idle took the scope (Nav -> Idle is Never, a finished action gives way)
    expect(installed()).toEqual(['Idle:Installed'])
    expect(controller.current?.fragment).toBe('Idle')
    expect(list.input.isHeld('forwardnav')).toBe(false)
  })

  it('plays a dodge with its marker and root motion, then idles', async () => {
    const { controller, motion, keys, step, installed } = createList()
    await step(0.1)
    keys.add('dodge')
    await step(0.05)
    // the query resolved within the step; Idle left as the dodge took its scope
    expect(installed()).toEqual(['Dodge:Installed'])
    expect(controller.tags.has('Idle')).toBe(false)
    await step(0.05)
    expect(controller.tags.has('Dodging')).toBe(true)
    expect(motion.animationDriven).toBe(true)
    expect(motion.rootMotionMultiplier).toBeCloseTo(1.28)
    await step(0.5)
    expect(controller.hasMarker('CanTransition')).toBe(true)
    await step(0.3)
    expect(controller.hasMarker('CanTransition')).toBe(false)
    keys.delete('dodge')
    await step(0.4)
    expect(installed()).toEqual(['Idle:Installed'])
    expect(controller.tags.has('Dodging')).toBe(false)
  })

  it('lets a cell condition decide', async () => {
    const { keys, step, installed } = createList()
    await step(0.1)
    keys.add('dodge')
    await step(0.15)
    keys.delete('dodge')
    // Dodge -> Nav waits for CanTransition (0.5 s into the roll)
    keys.add('moveforward')
    await step(0.2)
    expect(installed()).toEqual(['Dodge:Installed'])
    await step(0.4)
    expect(installed()).toEqual(['Nav:Installed'])
  })

  it('draws the weapon: paperdoll, item tags, then a faster dodge fragment', async () => {
    const { list, controller, keys, step, installed } = createList()
    controller.tags.toggle('Unarmed', true)
    await step(0.1)
    keys.add('sheathe')
    await step(0.1)
    keys.delete('sheathe')
    expect(installed()).toEqual(['Idle:Installed', 'Unsheathe:Installed'])
    expect(list.paperdoll.isSheathed('MAIN_HAND_OPTION_1')).toBe(false)
    expect(controller.tags.has('Sword')).toBe(true)
    expect(controller.tags.has('1H_Melee')).toBe(true)
    expect(controller.tags.has('Unarmed')).toBe(false)
    // the Idle reinstalled itself with the sword variant (AutoReinstall), still the CAGE Idle's
    const idle = controller.actions.find((it) => it.fragment === 'Idle')
    expect(idle?.variantTags).toEqual(['Sword'])
    expect(list.actions.find((it) => it.name === 'Idle')?.mannequin).toBe(idle)
    await step(1.2)
    expect(installed()).toEqual(['Idle:Installed'])
    // the finished draw was released: its upper body fragment no longer plays
    expect(controller.actions.map((it) => it.fragment)).toEqual(['Idle'])
    // ChangeActionFragment under the named condition `Fast` (the Sword tag)
    keys.add('dodge')
    await step(0.15)
    expect(installed()).toEqual(['Dodge:Installed'])
    expect(controller.current?.fragment).toBe('Dodge_Roll_Fast')
  })

  it('reapplies its tags as it enters, after the action it replaced left', async () => {
    const { controller, keys, step, installed } = createList()
    await step(0.1)
    keys.add('moveforward')
    await step(0.3)
    expect(controller.tags.has('Moving')).toBe(true)
    // the dodge sets Moving as it installs, the run unsets it as it leaves, the dodge sets it again as it enters
    keys.add('dodge')
    await step(0.05)
    expect(installed()).toEqual(['Dodge:Installed'])
    expect(controller.tags.has('Moving')).toBe(true)
  })

  it('follows transition clips: a quick release attacks light, a hold heavy', async () => {
    const light = createList()
    await light.step(0.1)
    light.keys.add('attack')
    await light.step(0.1)
    expect(light.installed()).toEqual(['Attack_Start:Installed'])
    light.keys.delete('attack')
    await light.step(0.1)
    expect(light.installed()).toEqual(['Attack_Light:Installed'])
    await light.step(1.2)
    expect(light.installed()).toEqual(['Idle:Installed'])

    const heavy = createList()
    await heavy.step(0.1)
    heavy.keys.add('attack')
    await heavy.step(0.25)
    expect(heavy.installed()).toEqual(['Attack_Start:Installed'])
    await heavy.step(0.15)
    expect(heavy.installed()).toEqual(['Attack_Heavy:Installed'])
  })

  it('installs before the query, enters after it', async () => {
    const { controller, keys, step, installed } = createList()
    await step(0.1)
    // the install edge sets ForwardNav, the variant needs it; the IfThenElse clears the group as the action enters
    keys.add('stop')
    await step(0.05)
    keys.delete('stop')
    expect(installed()).toEqual(['Nav_Stop:Installed'])
    expect(controller.current?.fragment).toBe('Nav_Stop')
    expect(controller.tags.has('ForwardNav')).toBe(false)
  })

  it('logs an unknown class once and reads it false', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    createList()
    expect(info.mock.calls.filter((it) => String(it[0]).includes('IfSomethingNew'))).toHaveLength(1)
    info.mockRestore()
  })
})
