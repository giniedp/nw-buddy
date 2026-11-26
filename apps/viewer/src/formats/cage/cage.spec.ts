import { describe, expect, it } from 'vitest'
import { parseActionList } from './actionList'
import { CageGridCells, parseActionGrid } from './grid'
import { inputProfileIncludePath, parseInputProfile } from './inputProfile'
import { cageAttr, cageBool, cageChild, cageNumber, cageVec3 } from './nodes'

// sharedassets/springboardentitites/playerdata/cage/player.grid (shortened)
const GRID = `<Grid>
	<Aliases>
		<Alias Name="Idle"/>
		<Alias Name="Nav"/>
		<Alias Name="Fall"/>
		<Alias Name="TurnInPlace"/>
		<Alias Name="Dodge"/>
		<Alias Name="Attack"/>
	</Aliases>
	<TransitionRules>
		<Rule From="*" To="*" Transition="Never"/>
		<Rule From="Idle" To="*" Transition="Always" ScopeBehavior="Moderate"/>
		<Rule From="Idle" To="Idle,FallingAttack" Transition="Never"/>
		<Rule From="Idle" To="TurnInPlace" ScopeBehavior="Moderate">
			<Condition>
				<Not>
					<IfMannequinMarker MarkerName="PreventTurnInPlace"/>
				</Not>
			</Condition>
		</Rule>
		<Rule From="Nav" To="*" Transition="Always" ScopeBehavior="Moderate"/>
		<Rule From="Nav" To="Idle,TurnInPlace" Transition="Never"/>
		<Rule From="Attack" To="Dodge" ScopeBehavior="Aggressive">
			<Condition>
				<IfMannequinMarker MarkerName="CanTransition"/>
			</Condition>
			<BufferCondition>
				<IfMannequinMarker MarkerName="CanBuffer"/>
			</BufferCondition>
		</Rule>
	</TransitionRules>
	<ActionLists>
		<ActionList WeaponRequirements="Ranged+Magic+Spear+Hatchet" Path="SharedAssets/SpringboardEntitites/PlayerData/CAGE/PlayerActions_Aim.actionlist">
			<AliasMap>
				<Action ActionName="AimPose" Alias="AimPose" IsIgnoredByGrid="false"/>
			</AliasMap>
		</ActionList>
		<ActionList Path="SharedAssets/SpringboardEntitites/PlayerData/CAGE/PlayerActions_Idle.actionlist">
			<AliasMap>
				<Action ActionName="Idle" Alias="Idle" IsIgnoredByGrid="false"/>
				<Action ActionName="Turn_InPlace" Alias="TurnInPlace" IsIgnoredByGrid="true"/>
			</AliasMap>
		</ActionList>
	</ActionLists>
	<VirtualInputLists>
		<ActionList Path="SharedAssets/SpringboardEntitites/PlayerData/CAGE/PlayerInput_Combat.actionlist"/>
	</VirtualInputLists>
	<ReactionTables>
		<ActionList Path="SharedAssets/SpringboardEntitites/PlayerData/CAGE/PlayerReactionTableHarness.actionlist"/>
	</ReactionTables>
</Grid>`

// playeractions_idle.actionlist (shortened) and the conditions of playerinput_combat.actionlist
const LIST = `<ActionList>
	<Actions>
		<Action Name="Idle" FragmentName="Idle">
			<ActivationCondition>
				<And>
					<True/>
					<Not>
						<IsMounted/>
					</Not>
				</And>
			</ActivationCondition>
			<Activities>
				<CameraRelativeMotion Decel="40,40,0"/>
				<SetMannequinTag>
					<Default TagName="Idle" OnEnter="Set" OnExit="Unset"/>
				</SetMannequinTag>
				<ClearMotion/>
			</Activities>
		</Action>
		<Action Name="Dodge" FragmentName="Dodge_Roll" Priority="-2" Predictive="true">
			<ActivationCondition>
				<IfInput InputName="dodge"/>
			</ActivationCondition>
			<DeactivationCondition>
				<IfFragmentDone UseHostActionFragment="true" ExitOffsetSeconds="0"/>
			</DeactivationCondition>
		</Action>
		<Action Name="Sprint_TravelMode">
			<Activities/>
		</Action>
	</Actions>
	<Conditions>
		<True Name="Test_AlwaysTrue"/>
		<Or Name="ForwardNav">
			<IfInput InputName="moveforward"/>
			<IfMannequinTag TagName="AutoRun"/>
		</Or>
	</Conditions>
</ActionList>`

// libs/config/defaultprofile.xml (shortened)
const PROFILE = `<profile validateShiftModifier="1" version="74">
	<include filename="libs/config/includes/debug.inputprofilexml"/>
	<actionmap name="fishing" enable="0">
		<action name="fishing_cast" onPress="1" keyboard="mouse1"/>
	</actionmap>
	<actionmap name="movement">
		<action name="moveforward">
			<keyboard onPress="1" onHold="1" retriggerable="1">
				<inputdata input="w"/>
			</keyboard>
			<azpad>
				<inputdata input="az_thumbl_up"/>
			</azpad>
		</action>
		<action name="sprint" onPress="1" onHold="0" onRelease="0">
			<keyboard>
				<inputdata input="space"/>
			</keyboard>
		</action>
		<action name="quickslot-weaponSwap">
			<keyboard onPress="1">
				<inputdata input=" "/>
			</keyboard>
		</action>
	</actionmap>
	<actionmap name="player">
		<action name="dodge" onPress="1" onHold="0" onRelease="0" keyboard="lshift">
			<azpad>
				<inputdata input="az_b"/>
			</azpad>
		</action>
	</actionmap>
</profile>`

describe('cage grid', () => {
  const grid = parseActionGrid(GRID)

  it('reads aliases, rules and lists', () => {
    expect(grid.aliases).toEqual(['Idle', 'Nav', 'Fall', 'TurnInPlace', 'Dodge', 'Attack'])
    expect(grid.rules).toHaveLength(7)
    expect(grid.rules[0]).toMatchObject({ from: ['*'], to: ['*'], transition: 'Never', scopeBehavior: 'Moderate' })
    expect(grid.rules[2].to).toEqual(['Idle', 'FallingAttack'])
    expect(grid.rules[6].scopeBehavior).toBe('Aggressive')
    expect(grid.rules[6].condition?.type).toBe('IfMannequinMarker')
    expect(grid.rules[6].bufferCondition && cageAttr(grid.rules[6].bufferCondition, 'markername')).toBe('CanBuffer')
    expect(grid.actionLists[0].weaponRequirements).toEqual(['Ranged', 'Magic', 'Spear', 'Hatchet'])
    expect(grid.actionLists[1].aliasMap[1]).toEqual({
      action: 'Turn_InPlace',
      alias: 'TurnInPlace',
      ignoredByGrid: true,
    })
    expect(grid.virtualInputLists).toEqual([
      'SharedAssets/SpringboardEntitites/PlayerData/CAGE/PlayerInput_Combat.actionlist',
    ])
    expect(grid.reactionTables).toHaveLength(1)
  })

  it('fills cells, the last rule wins', () => {
    const cells = new CageGridCells(grid)
    const at = (from: string, to: string) => cells.cell(cells.aliasIndex(from), cells.aliasIndex(to))
    expect(at('Idle', 'Nav').kind).toBe('always')
    expect(at('Idle', 'Idle').kind).toBe('never')
    expect(at('Idle', 'TurnInPlace').kind).toBe('conditional')
    expect(at('Nav', 'Dodge').kind).toBe('always')
    expect(at('Nav', 'Idle').kind).toBe('never')
    expect(at('Fall', 'Idle').kind).toBe('never')
    const attackDodge = at('attack', 'DODGE')
    expect(attackDodge.kind).toBe('conditional')
    expect(attackDodge.scopeBehavior).toBe('Aggressive')
    expect(attackDodge.bufferCondition).not.toBeNull()
    // the rest of the Attack row keeps the `* -> * Never` of the first rule
    expect(at('Attack', 'Nav').kind).toBe('never')
    expect(cells.unknownAliases).toEqual(['FallingAttack'])
    expect(cells.cell(-1, 0).kind).toBe('never')
  })

  it('opens a row on the first rule that touches it', () => {
    const cells = new CageGridCells(
      parseActionGrid(`<Grid>
        <Aliases><Alias Name="A"/><Alias Name="B"/><Alias Name="C"/></Aliases>
        <TransitionRules><Rule From="A" To="B" Transition="Never"/></TransitionRules>
      </Grid>`),
    )
    expect(cells.cell(0, 0).kind).toBe('always')
    expect(cells.cell(0, 1).kind).toBe('never')
    expect(cells.cell(0, 2).kind).toBe('always')
    // a row no rule touches allows nothing
    expect(cells.cell(1, 0).kind).toBe('never')
  })
})

describe('cage action list', () => {
  const list = parseActionList(LIST)

  it('reads actions', () => {
    expect(list.actions.map((it) => it.name)).toEqual(['Idle', 'Dodge', 'Sprint_TravelMode'])
    const [idle, dodge, travel] = list.actions
    expect(idle).toMatchObject({ fragment: 'Idle', priority: 0, predictive: false, disabled: false })
    expect(idle.activation?.type).toBe('And')
    expect(idle.activation?.children.map((it) => it.type)).toEqual(['True', 'Not'])
    expect(idle.deactivation).toBeNull()
    expect(idle.activities.map((it) => it.type)).toEqual(['CameraRelativeMotion', 'SetMannequinTag', 'ClearMotion'])
    expect(cageVec3(idle.activities[0], 'decel')).toEqual([40, 40, 0])
    const tag = cageChild(idle.activities[1], 'default')
    expect(tag && cageAttr(tag, 'TAGNAME')).toBe('Idle')
    expect(dodge).toMatchObject({ fragment: 'Dodge_Roll', priority: -2, predictive: true })
    expect(dodge.deactivation && cageBool(dodge.deactivation, 'UseHostActionFragment')).toBe(true)
    expect(dodge.deactivation && cageNumber(dodge.deactivation, 'ExitOffsetSeconds', -1)).toBe(0)
    expect(travel.fragment).toBeNull()
    expect(travel.activation).toBeNull()
    expect(travel.activities).toEqual([])
  })

  it('reads named conditions', () => {
    expect(list.conditions.map((it) => it.name)).toEqual(['Test_AlwaysTrue', 'ForwardNav'])
    expect(list.conditions[1].condition.type).toBe('Or')
    expect(list.conditions[1].condition.children).toHaveLength(2)
  })
})

describe('cage node values', () => {
  it('reads as CAGEXmlSerializer reads', () => {
    const node = { type: 'X', attrs: { a: '1', b: 'TRUE', c: '0', d: 'yes', e: '1.5abc', f: '1,2' }, children: [] }
    expect(cageBool(node, 'a')).toBe(true)
    expect(cageBool(node, 'b')).toBe(true)
    expect(cageBool(node, 'c')).toBe(false)
    expect(cageBool(node, 'd', true)).toBe(false)
    expect(cageBool(node, 'missing', true)).toBe(true)
    expect(cageNumber(node, 'e')).toBe(1.5)
    expect(cageNumber(node, 'd', 7)).toBe(7)
    expect(cageVec3(node, 'f', [9, 9, 9])).toEqual([1, 2, 9])
  })
})

describe('input profile', () => {
  const profile = parseInputProfile(PROFILE)

  it('reads keyboard bindings', () => {
    const byName = (name: string) => profile.actions.find((it) => it.name === name)
    expect(byName('moveforward')).toEqual({
      map: 'movement',
      name: 'moveforward',
      keyboard: [{ input: 'w', onPress: true, onHold: true, onRelease: false }],
    })
    expect(byName('sprint')?.keyboard).toEqual([{ input: 'space', onPress: true, onHold: false, onRelease: false }])
    expect(byName('dodge')?.keyboard).toEqual([{ input: 'lshift', onPress: true, onHold: false, onRelease: false }])
    expect(byName('fishing_cast')?.keyboard[0].input).toBe('mouse1')
    // a blank key binds nothing
    expect(byName('quickslot-weaponSwap')?.keyboard).toEqual([])
  })

  it('reads maps and includes', () => {
    expect(profile.maps).toEqual([
      { name: 'fishing', enabled: false },
      { name: 'movement', enabled: true },
      { name: 'player', enabled: true },
    ])
    expect(profile.includes).toEqual(['libs/config/includes/debug.inputprofilexml'])
    expect(inputProfileIncludePath(profile.includes[0])).toBe('libs/config/includes/debug.xml')
  })
})
