import {
  CageGridCells,
  type CageActionDefinition,
  type CageActionListDocument,
  type CageGridDocument,
  type CageNode,
} from '../../../formats/cage'
import type { MannequinScopeDefinition } from '../../../formats/mannequin'
import type { MannequinAction, MannequinController } from '../mannequin/MannequinController'
import { fragmentScopes } from '../mannequin/setup'
import { bindActivity, type CageActivity } from './activities'
import { CageInput } from './CageInput'
import { CageMotion } from './CageMotion'
import { CagePaperdoll } from './CagePaperdoll'
import { bindCondition } from './conditions'
import { CageTransitionClips } from './transitionClips'
import type { CageActionState, CageActionStatus, CageBinder, CageRuntime, CageTest } from './types'

/**
 * A grid with every list it names, loaded
 */
export interface CageGraph {
  grid: CageGridDocument
  cells: CageGridCells
  /**
   * The documents by lower case path, a list that failed to load is missing
   */
  lists: Map<string, CageActionListDocument>
}

/**
 * Loads a grid and the action, virtual input and reaction table lists it names. A list that fails to load is skipped
 * (logged).
 */
export async function loadCageGraph(
  load: {
    actionGrid(path: string): Promise<CageGridDocument>
    actionList(path: string): Promise<CageActionListDocument>
  },
  gridPath: string,
): Promise<CageGraph> {
  const grid = await load.actionGrid(gridPath)
  const paths = [...grid.actionLists.map((it) => it.path), ...grid.virtualInputLists, ...grid.reactionTables]
  const lists = new Map<string, CageActionListDocument>()
  await Promise.all(
    paths.map(async (path) => {
      try {
        lists.set(path.toLowerCase(), await load.actionList(path))
      } catch (err) {
        console.warn(`cage: ${path}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }),
  )
  return { grid, cells: new CageGridCells(grid), lists }
}

/**
 * An action as the runtime holds it
 */
class ActionState implements CageActionState {
  public status: CageActionStatus = 'None'
  public fragment: string | null
  public mannequin: MannequinAction | null = null
  public activeTime = 0
  public activation: CageTest = () => false
  public deactivation: CageTest | null = null
  public activities: CageActivity[] = []
  /**
   * The scopes a pending request installs on
   */
  public pendingScopes: MannequinScopeDefinition[] = []
  /**
   * The id of the newest controller request, 0 for none
   */
  public request = 0
  /**
   * The playing action whose grid cell buffered this one: it is tried again on later steps
   */
  public bufferedBy: ActionState | null = null
  /**
   * The activities ran their enter edge in this run
   */
  public entered = false

  public readonly definition: CageActionDefinition
  public readonly alias: number
  public readonly ignoredByGrid: boolean
  public readonly weaponRequirements: string[]

  public constructor(
    definition: CageActionDefinition,
    alias: number,
    ignoredByGrid: boolean,
    weaponRequirements: string[],
  ) {
    this.definition = definition
    this.alias = alias
    this.ignoredByGrid = ignoredByGrid
    this.weaponRequirements = weaponRequirements
    this.fragment = definition.fragment
  }

  public get name() {
    return this.definition.name
  }

  public get running() {
    return this.status === 'Pending' || this.status === 'Installed'
  }
}

/**
 * The answer of the grid for an action that would replace another
 */
type Rank = 'higher' | 'lower' | 'buffered'

const NO_SCOPES: MannequinScopeDefinition[] = []

/**
 * The player's CAGE action list, the parts the viewer needs: the actions a grid reaches, started by their activation
 * and the grid's cells, each owning the Mannequin fragment it plays, with the activities that set tags, clear inputs
 * and drive the motion.
 *
 * @remarks
 * Each {@link step}:
 * 1. the physical inputs, then the virtual inputs (the named conditions of the virtual input lists)
 * 2. the grid step in list order: an installed action whose deactivation holds finishes (its activities exit, its
 *    fragment holds until another action takes the scopes); an installed action that lost its scopes leaves; any other
 *    action whose weapon requirements hold starts when its activation holds, or when the cell that buffered it lets it
 *    go now
 * 3. the activities of the pending and installed actions update
 *
 * An action starts when, against every running action on its scopes, the grid ranks it higher: an `Always` cell, a
 * conditional cell whose condition holds, an action the grid ignores, or a playing action that is still pending
 * (the newer wins). A finished action, or one the list does not own (the character's own idle), gives way to any.
 * Starting runs the activities' install edge (tags, `ChangeActionFragment`) before the fragment is queued, so the
 * variant sees the tags; the enter edge runs once the fragment installed (`IfThenElse` chooses its branch there),
 * updates run while the action is installed.
 *
 * Not ported: priorities outside the grid, the self-requeue of an installed action, scope behaviours, reinstall edges,
 * predictive/server actions, AI requested actions, reaction tables, input requirements of the grid filter.
 */
export class CageActionList implements CageRuntime {
  public readonly graph: CageGraph
  public readonly input = new CageInput()
  public readonly motion: CageMotion
  public readonly paperdoll: CagePaperdoll
  public controller: MannequinController | null = null
  public host: ActionState | null = null
  public dt = 0
  public stamina = 100

  /**
   * The actions in grid order
   */
  public readonly actions: ActionState[] = []
  private readonly actionsByName = new Map<string, number>()
  private readonly namedNodes = new Map<string, CageNode>()
  private readonly namedTests = new Map<string, CageTest>()
  private readonly virtualInputs: Array<{ name: string; test: CageTest }> = []
  /**
   * The bound conditions of the grid's cells, by rule node
   */
  private readonly cellTests = new Map<CageNode, CageTest>()
  /**
   * The transition clips of the fragments the controller plays
   */
  private readonly transitions = new CageTransitionClips({
    testNamed: (name) => {
      const host = this.host
      this.host = null
      const result = this.binder.named(name)(this)
      this.host = host
      return result
    },
    isHeld: (input) => this.input.isHeld(input),
    wasPressed: (input, backTicks) => this.input.wasPressed(input, backTicks),
    ownerOf: (action) => this.ownerOf(action),
    queueNamed: (name) => this.queueNamed(name),
    changeFragment: (action, fragment) => this.changeFragment(action, fragment),
  })
  private readonly unknownTypes = new Set<string>()
  /**
   * Unknown classes bound since the last log line (named conditions bind on their first test)
   */
  private readonly unknownPending: string[] = []
  private readonly binder: CageBinder
  private request = 0

  public constructor(graph: CageGraph, motion: CageMotion, paperdoll = new CagePaperdoll()) {
    this.graph = graph
    this.motion = motion
    this.paperdoll = paperdoll
    this.binder = this.createBinder()
    this.build()
    this.logUnknown()
  }

  /**
   * The controller the actions play on (null detaches; the actions keep their state)
   */
  public bind(controller: MannequinController | null) {
    this.controller = controller
    if (controller) {
      // the list decides when actions end
      controller.autoFinish = false
      controller.idleFragment = ''
      controller.proceduralHandler = this.transitions
      // an `AutoReinstall` fragment installed again under new tags stays the action's
      controller.onReinstalled = (previous, next) => {
        const owner = this.ownerOf(previous)
        if (owner) {
          owner.mannequin = next
        }
      }
    }
  }

  /**
   * Queues an action by its exact name, without its activation or the grid (a transition clip's `NewAction`); an action
   * pending or installed is left alone
   */
  public queueNamed(name: string) {
    const controller = this.controller
    const action = this.actions.find((it) => it.name === name)
    if (!controller || !action || action.running) {
      return
    }
    const scopes = action.fragment ? fragmentScopes(controller.setup, action.fragment, controller.tags) : []
    if (action.fragment && !scopes.length) {
      return
    }
    const host = this.host
    this.start(action, scopes)
    this.host = host
  }

  /**
   * One step of the list
   *
   * @param physical - the input names active this step (lower case)
   */
  public step(dt: number, physical: Iterable<string>) {
    this.dt = dt
    this.input.begin(physical)
    this.host = null
    for (const it of this.virtualInputs) {
      this.input.setVirtual(it.name, it.test(this))
    }
    this.motion.beginStep()
    const controller = this.controller
    if (controller) {
      this.gridStep(controller)
    }
    for (const action of this.actions) {
      if (action.status !== 'Installed') {
        continue
      }
      action.activeTime += dt
      this.host = action
      for (const activity of action.activities) {
        activity.update(this)
      }
    }
    this.host = null
    this.logUnknown()
  }

  /**
   * Leaves every running action (e.g. before the character despawns)
   */
  public stop() {
    for (const action of this.actions) {
      if (action.running) {
        const mannequin = action.mannequin
        this.leave(action)
        if (mannequin) {
          this.controller?.release(mannequin)
        }
      }
    }
  }

  public action(index: number): CageActionState | null {
    return this.actions[index] ?? null
  }

  /**
   * The action that owns a Mannequin action, null for none
   */
  public ownerOf(mannequin: MannequinAction): ActionState | null {
    for (const action of this.actions) {
      if (action.mannequin === mannequin) {
        return action
      }
    }
    return null
  }

  public installedOfAlias(alias: number): CageActionState | null {
    for (const action of this.actions) {
      if (action.alias === alias && action.status === 'Installed') {
        return action
      }
    }
    return null
  }

  /**
   * The running actions, for display
   */
  public running(): CageActionState[] {
    return this.actions.filter((it) => it.running)
  }

  public changeFragment(target: CageActionState, fragment: string | null) {
    const action = target as ActionState
    const next = fragment ?? action.definition.fragment
    if (next === action.fragment) {
      return
    }
    action.fragment = next
    // a request already sent plays the new fragment instead (`IAction::SetFragment`)
    if (action.request && action.running) {
      this.queue(action)
    }
  }

  private build() {
    const { grid, cells, lists } = this.graph
    for (const reference of grid.actionLists) {
      if (reference.stackVar) {
        // configuration flags read false in the viewer
        continue
      }
      const list = lists.get(reference.path.toLowerCase())
      if (!list) {
        continue
      }
      for (const definition of list.actions) {
        if (definition.disabled) {
          continue
        }
        const name = definition.name.toLowerCase()
        const entry = reference.aliasMap.find((it) => it.action.toLowerCase() === name)
        if (!entry) {
          continue
        }
        const alias = cells.aliasIndex(entry.alias)
        if (alias < 0 && !entry.ignoredByGrid) {
          continue
        }
        if (!this.actionsByName.has(name)) {
          this.actionsByName.set(name, this.actions.length)
        }
        this.actions.push(new ActionState(definition, alias, entry.ignoredByGrid, reference.weaponRequirements))
      }
    }
    // named conditions of every list, a later definition wins
    const paths = [...grid.actionLists.map((it) => it.path), ...grid.virtualInputLists, ...grid.reactionTables]
    for (const path of paths) {
      for (const named of lists.get(path.toLowerCase())?.conditions ?? []) {
        this.namedNodes.set(named.name.toLowerCase(), named.condition)
      }
    }
    const binder = this.binder
    for (const path of grid.virtualInputLists) {
      for (const named of lists.get(path.toLowerCase())?.conditions ?? []) {
        this.virtualInputs.push({ name: named.name.toLowerCase(), test: binder.named(named.name) })
      }
    }
    for (const rule of grid.rules) {
      for (const node of [rule.condition, rule.bufferCondition]) {
        if (node) {
          this.cellTests.set(node, bindCondition(node, binder))
        }
      }
    }
    for (const action of this.actions) {
      action.activation = bindCondition(action.definition.activation, binder)
      action.deactivation = action.definition.deactivation
        ? bindCondition(action.definition.deactivation, binder)
        : null
      action.activities = action.definition.activities.map((it) => bindActivity(it, binder))
    }
  }

  private createBinder(): CageBinder {
    return {
      actionIndex: (name) => this.actionsByName.get(name.toLowerCase()) ?? -1,
      aliasIndex: (name) => this.graph.cells.aliasIndex(name),
      named: (name) => {
        const key = name.toLowerCase()
        let test = this.namedTests.get(key)
        if (!test) {
          const node = this.namedNodes.get(key)
          if (!node) {
            test = () => false
            this.namedTests.set(key, test)
          } else {
            // bound on first test: named conditions may name each other
            let bound: CageTest | null = null
            let binding = false
            test = (rt) => {
              if (!bound) {
                if (binding) {
                  return false
                }
                binding = true
                bound = bindCondition(node, this.binder)
                binding = false
              }
              return bound(rt)
            }
            this.namedTests.set(key, test)
          }
        }
        return test
      },
      unknown: (kind, type) => {
        const key = `${kind}:${type}`
        if (!this.unknownTypes.has(key)) {
          this.unknownTypes.add(key)
          this.unknownPending.push(`${kind} ${type}`)
        }
      },
    }
  }

  /**
   * One line for the classes bound since the last line that the viewer does not implement (they read false or do
   * nothing)
   */
  private logUnknown() {
    const pending = this.unknownPending
    if (!pending.length) {
      return
    }
    console.info(`cage: ${pending.length} classes not implemented: ${pending.join(', ')}`)
    pending.length = 0
  }

  private gridStep(controller: MannequinController) {
    for (const action of this.actions) {
      if (action.status === 'Installed') {
        if (action.mannequin && !controller.actions.includes(action.mannequin)) {
          // another fragment took its scopes
          this.leave(action)
          continue
        }
        this.host = action
        if (action.deactivation?.(this)) {
          // the activities exit, the controller releases the fragment (layer 0 holds until another action comes)
          const mannequin = action.mannequin
          this.leave(action)
          if (mannequin) {
            controller.release(mannequin)
          }
        }
        continue
      }
      if (action.status === 'Pending') {
        continue
      }
      if (!this.meetsRequirements(action)) {
        action.bufferedBy = null
        continue
      }
      this.host = action
      if (action.bufferedBy || action.activation(this)) {
        this.tryStart(controller, action)
      }
    }
    this.host = null
  }

  private meetsRequirements(action: ActionState): boolean {
    const requirements = action.weaponRequirements
    if (!requirements.length) {
      return true
    }
    for (const it of requirements) {
      if (this.paperdoll.hasActiveClass(it)) {
        return true
      }
    }
    return false
  }

  private tryStart(controller: MannequinController, action: ActionState) {
    const scopes = action.fragment ? fragmentScopes(controller.setup, action.fragment, controller.tags) : []
    if (action.fragment && !scopes.length) {
      action.bufferedBy = null
      return
    }
    let buffered: ActionState | null = null
    for (const playing of this.actions) {
      if (playing === action || !playing.running || !this.overlaps(playing, scopes)) {
        continue
      }
      const rank = this.rank(playing, action)
      if (rank === 'lower') {
        action.bufferedBy = null
        return
      }
      if (rank === 'buffered') {
        buffered = playing
      }
    }
    if (buffered) {
      action.bufferedBy = buffered
      return
    }
    this.start(action, scopes)
  }

  /**
   * How the grid ranks an incoming action against a running one on its scopes (`GameAction::DoComparePriority`)
   */
  private rank(playing: ActionState, incoming: ActionState): Rank {
    if (playing.ignoredByGrid || incoming.ignoredByGrid || playing.status === 'Pending') {
      return 'higher'
    }
    const cell = this.graph.cells.cell(playing.alias, incoming.alias)
    if (cell.kind === 'always') {
      return 'higher'
    }
    if (cell.kind === 'never') {
      return 'lower'
    }
    this.host = playing
    const allowed = this.testCell(cell.condition)
    const buffer = !allowed && this.testCell(cell.bufferCondition)
    this.host = incoming
    if (allowed) {
      return 'higher'
    }
    return buffer ? 'buffered' : 'lower'
  }

  private testCell(node: CageNode | null): boolean {
    const test = node ? this.cellTests.get(node) : null
    return !!test && test(this)
  }

  private overlaps(playing: ActionState, scopes: MannequinScopeDefinition[]): boolean {
    let own = playing.pendingScopes
    if (playing.status === 'Installed') {
      own = playing.mannequin?.scopes ?? NO_SCOPES
    }
    for (const scope of own) {
      if (scopes.includes(scope)) {
        return true
      }
    }
    return false
  }

  private start(action: ActionState, scopes: MannequinScopeDefinition[]) {
    action.bufferedBy = null
    action.status = 'Pending'
    action.activeTime = 0
    action.pendingScopes = scopes
    action.request = 0
    this.host = action
    action.entered = false
    // the install edge runs before the query: its tags pick the variant, `ChangeActionFragment` the fragment
    for (const activity of action.activities) {
      activity.install(this)
    }
    if (!action.fragment) {
      action.status = 'Installed'
      this.enter(action)
      return
    }
    this.queue(action)
  }

  /**
   * The enter edge, once per run: a fragment the action changes to reinstalls without entering again
   */
  private enter(action: ActionState) {
    if (action.entered) {
      return
    }
    action.entered = true
    const host = this.host
    this.host = action
    for (const activity of action.activities) {
      activity.enter(this)
    }
    this.host = host
  }

  private queue(action: ActionState) {
    const controller = this.controller
    const fragment = action.fragment
    if (!controller || !fragment) {
      return
    }
    const request = ++this.request
    action.request = request
    controller
      .queueAction(fragment)
      .then((installed) => {
        if (action.request !== request || !action.running) {
          return
        }
        if (!installed) {
          this.leave(action)
          return
        }
        action.mannequin = installed
        action.status = 'Installed'
        // the actions whose fragments it replaced leave now, not on the next step
        for (const other of this.actions) {
          if (other.status === 'Installed' && other.mannequin && !controller.actions.includes(other.mannequin)) {
            this.leave(other)
          }
        }
        this.enter(action)
      })
      .catch((err) => {
        console.warn(`cage: ${action.name}: ${err instanceof Error ? err.message : String(err)}`)
        if (action.request === request && action.running) {
          this.leave(action)
        }
      })
  }

  private leave(action: ActionState) {
    const host = this.host
    this.host = action
    for (const activity of action.activities) {
      activity.exit(this)
    }
    this.host = host
    action.status = 'None'
    action.mannequin = null
    action.pendingScopes = []
    action.request = 0
    action.bufferedBy = null
  }
}
