import { cageBool, cageChild, cageNumber, cageString, cageVec3, type CageNode } from '../../../formats/cage'
import type { CageInput } from './CageInput'
import { approach, type LocalVec } from './CageMotion'
import { bindCondition } from './conditions'
import type { CageBinder, CageRuntime, CageTest } from './types'

/**
 * A bound activity of an action (CAGE `ExecutionActivity`): `install` before the action's fragment is queried (tags
 * and fragment changes pick the variant), `enter` once the fragment installed, `update` every step while the action
 * is installed, `exit` as it leaves (also for an install that never entered). Each action holds its own tree, so an
 * activity keeps its per-run state.
 */
export interface CageActivity {
  install(rt: CageRuntime): void
  enter(rt: CageRuntime): void
  update(rt: CageRuntime): void
  exit(rt: CageRuntime): void
}

const NONE: CageActivity = { install() {}, enter() {}, update() {}, exit() {} }

/**
 * Activities that change only what the viewer does not have (audio, UI, stamina, status effects, abilities, camera
 * lock, weapon accuracy, …): they bind to no-ops without a log
 */
const IGNORED = new Set(
  [
    'ModifyStatusEffects',
    'DisableInteractor',
    'DisableInteractions',
    'BlockEnteringStore',
    'AIAudioTriggerActivity',
    'SetAudioSwitchState',
    'ItemAudioTrigger',
    'ExecuteAudioTrigger',
    'ResetGrit',
    'SetToggleInput',
    'SetHaltMotionOnCollision',
    'ClearAbilityHits',
    'SetWeaponAccuracyBonus',
    'ApplyMoveSpeedMultiplier',
    'ApplyEquipLoadMoveSpeedMultiplier',
    'SetHomingTargetTargetable',
    'HomingOverrideTargetClear',
    'ForceCameraLock',
    'DisableCameraLock',
    'ShowUINotification',
    'SendUIEvent',
    'DisableStaminaRegen',
    'SetStaminaRegenDelay',
    'ModifyStaminaRegen',
    'PayStaminaCost',
    'TrackTimeInAction',
    'RunFxScript',
    'StopFxScript',
    'ResetReactionCount',
    'SetLoadedAmmo',
    'PerformActiveAbility',
    'ClearActiveAbilityMoveInput',
    'SetCooldownTimer',
    'ModifyGravity',
    'DisableCollision',
    'ToggleLimbIK',
    'SetCameraLockTargetTargetable',
    'SetTargetFriendliesFallbackForReEnteringCameraLock',
    'DisableCameraLockTargetChange',
    'DisableCameraHits',
    'DisableCameraControls',
    'SuppressVerticalCameraMovement',
    'CombatStatus',
    'SetInUsePaperdollItem',
    'CancelLookingThroughLoadout',
    'CancelPlacingStructure',
    'SendMessageToOwnedSlices',
  ].map((it) => it.toLowerCase()),
)

/**
 * Binds an activity element (CAGE `ActionActivityRegistry`, the classes the viewer needs). Unknown classes bind to a
 * no-op and are logged once.
 */
export function bindActivity(node: CageNode, binder: CageBinder): CageActivity {
  const type = node.type.toLowerCase()
  const factory = ACTIVITIES[type]
  if (factory) {
    return factory(node, binder)
  }
  if (!IGNORED.has(type)) {
    binder.unknown('activity', node.type)
  }
  return NONE
}

type ActivityFactory = (node: CageNode, binder: CageBinder) => CageActivity

/**
 * The entries of an activity (CAGE `ActivityDataHandler`): the `Default` child and the `Conditional` children, each
 * named by a named condition; a selection takes the first conditional whose condition holds, else the default. Tags
 * match without regard to case, a second `Default` reads over the first.
 */
class Entries {
  private readonly fallback: CageNode
  private readonly conditionals: Array<{ test: CageTest; node: CageNode }> = []

  public constructor(node: CageNode, binder: CageBinder) {
    let fallback: CageNode | null = null
    for (const child of node.children) {
      const type = child.type.toLowerCase()
      if (type === 'default' && !fallback) {
        fallback = child
      } else if (type === 'default') {
        // a second default reads its attributes over the first
        fallback = { ...child, attrs: { ...fallback.attrs, ...child.attrs } }
      } else if (type === 'conditional') {
        this.conditionals.push({ test: binder.named(cageString(child, 'Name')), node: child })
      }
    }
    this.fallback = fallback ?? { type: 'Default', attrs: {}, children: [] }
  }

  public select(rt: CageRuntime): CageNode {
    for (const it of this.conditionals) {
      if (it.test(rt)) {
        return it.node
      }
    }
    return this.fallback
  }
}

/**
 * Per entry values read once (activities select an entry every update)
 */
function cached<T>(read: (node: CageNode) => T): (node: CageNode) => T {
  const cache = new Map<CageNode, T>()
  return (node) => {
    let value = cache.get(node)
    if (value === undefined) {
      value = read(node)
      cache.set(node, value)
    }
    return value
  }
}

function vec(node: CageNode, name: string, fallback: [number, number, number] = [0, 0, 0]): LocalVec {
  const [x, y, z] = cageVec3(node, name, fallback)
  return { x, y, z }
}

/**
 * The four direction inputs of a movement or facing entry
 */
interface DirectionInputs {
  forward: string
  back: string
  left: string
  right: string
}

function directionInputs(node: CageNode): DirectionInputs {
  return {
    forward: cageString(node, 'ForwardInput').toLowerCase(),
    back: cageString(node, 'BackwardInput').toLowerCase(),
    left: cageString(node, 'LeftInput').toLowerCase(),
    right: cageString(node, 'RightInput').toLowerCase(),
  }
}

/**
 * `x` right less left, `y` forward less back, each held input counting one
 */
function readDirection(rt: CageRuntime, inputs: DirectionInputs, out: LocalVec): LocalVec {
  const input = rt.input
  out.x = heldValue(input, inputs.right) - heldValue(input, inputs.left)
  out.y = heldValue(input, inputs.forward) - heldValue(input, inputs.back)
  out.z = 0
  return out
}

function heldValue(input: CageInput, name: string): number {
  if (name && input.isHeld(name)) {
    return 1
  }
  return 0
}

type TagOption = 'set' | 'unset' | 'toggle' | 'noeffect'

function tagOption(node: CageNode, name: string, fallback: TagOption): TagOption {
  const value = cageString(node, name).toLowerCase()
  return value === 'set' || value === 'unset' || value === 'toggle' || value === 'noeffect' ? value : fallback
}

function applyTag(rt: CageRuntime, tag: string, option: TagOption) {
  const tags = rt.controller?.tags
  if (!tags || !tag || option === 'noeffect') {
    return
  }
  if (option === 'toggle') {
    tags.toggle(tag, !tags.has(tag))
  } else {
    tags.toggle(tag, option === 'set')
  }
}

function clearTagGroup(rt: CageRuntime, group: string) {
  const tags = rt.controller?.tags
  if (!tags) {
    return
  }
  const lower = group.toLowerCase()
  const definition = tags.definition.groups.find((it) => it.name.toLowerCase() === lower)
  for (const tag of definition?.tags ?? []) {
    tags.toggle(tag, false)
  }
}

/**
 * `IfThenElse`, `ThenActivity` and `ElseActivity` hold the last child of their wrapper
 */
function wrapped(node: CageNode, type: string, binder: CageBinder): CageActivity | null {
  const wrapper = cageChild(node, type)
  const last = wrapper?.children[wrapper.children.length - 1]
  return last ? bindActivity(last, binder) : null
}

const ACTIVITIES: Record<string, ActivityFactory> = {
  group: (node, binder) => {
    const children = node.children.map((it) => bindActivity(it, binder))
    return {
      install: (rt) => {
        for (const child of children) {
          child.install(rt)
        }
      },
      enter: (rt) => {
        for (const child of children) {
          child.enter(rt)
        }
      },
      update: (rt) => {
        for (const child of children) {
          child.update(rt)
        }
      },
      exit: (rt) => {
        for (const child of children) {
          child.exit(rt)
        }
      },
    }
  },

  /**
   * Chooses its branch as it enters (as it installs with `RunDuringInstall`) and again on every update; a changed
   * answer exits the running branch, then installs and enters the chosen one
   */
  ifthenelse: (node, binder) => {
    const wrapper = cageChild(node, 'IfCondition')
    const test = bindCondition(wrapper?.children[wrapper.children.length - 1] ?? null, binder)
    const then = wrapped(node, 'ThenActivity', binder)
    const otherwise = wrapped(node, 'ElseActivity', binder)
    const duringInstall = cageBool(node, 'RunDuringInstall')
    let running: CageActivity | null = null
    let entered = false
    const choose = (rt: CageRuntime) => {
      let next = otherwise
      if (test(rt)) {
        next = then
      }
      if (entered && next === running) {
        return
      }
      running?.exit(rt)
      running = next
      entered = true
      running?.install(rt)
      running?.enter(rt)
    }
    return {
      install: (rt) => {
        entered = false
        running = null
        if (duringInstall) {
          choose(rt)
        }
      },
      enter: (rt) => {
        if (!entered) {
          choose(rt)
        }
      },
      update: (rt) => {
        choose(rt)
        running?.update(rt)
      },
      exit: (rt) => {
        running?.exit(rt)
        running = null
        entered = false
      },
    }
  },

  /**
   * Applies `OnEnter` to the entry's tag as it installs (after `Delay`/`DelayTimer` seconds when authored) and the
   * current entry's `OnExit` to that tag as it exits
   */
  setmannequintag: (node, binder) => {
    const entries = new Entries(node, binder)
    let tag = ''
    let delay = 0
    let pending: TagOption = 'noeffect'
    let applied: TagOption = 'noeffect'
    return {
      install: (rt) => {
        const entry = entries.select(rt)
        tag = cageString(entry, 'TagName')
        pending = tagOption(entry, 'OnEnter', 'set')
        applied = 'noeffect'
        delay = Math.max(cageNumber(entry, 'Delay', 0), cageNumber(entry, 'DelayTimer', 0))
        if (delay <= 0) {
          applyTag(rt, tag, pending)
          applied = pending
          pending = 'noeffect'
        }
      },
      // reapplies the option the install applied: the action it replaced may have changed the tag as it left
      enter: (rt) => applyTag(rt, tag, applied),
      update: (rt) => {
        if (pending === 'noeffect') {
          return
        }
        delay -= rt.dt
        if (delay <= 0) {
          applyTag(rt, tag, pending)
          pending = 'noeffect'
        }
      },
      exit: (rt) => {
        pending = 'noeffect'
        applyTag(rt, tag, tagOption(entries.select(rt), 'OnExit', 'noeffect'))
      },
    }
  },

  clearmannequintaggroup: (node, binder) => {
    const entries = new Entries(node, binder)
    let group = ''
    return {
      enter() {},
      install: (rt) => {
        const entry = entries.select(rt)
        group = cageString(entry, 'TagGroupName')
        if (cageString(entry, 'OnEnter').toLowerCase() === 'clear') {
          clearTagGroup(rt, group)
        }
      },
      update() {},
      exit: (rt) => {
        if (cageString(entries.select(rt), 'OnExit').toLowerCase() === 'clear') {
          clearTagGroup(rt, group)
        }
      },
    }
  },

  clearinput: (node, binder) => {
    const entries = new Entries(node, binder)
    const edge = (rt: CageRuntime, option: string) => {
      const entry = entries.select(rt)
      if (cageString(entry, option).toLowerCase() === 'clear') {
        rt.input.clear(cageString(entry, 'InputName').toLowerCase())
      }
    }
    return {
      enter() {},
      install: (rt) => edge(rt, 'OnEnter'),
      update() {},
      exit: (rt) => edge(rt, 'OnExit'),
    }
  },

  /**
   * Plays another fragment for the action: `UseDefaultFragment` the action's own, else `FragmentName`
   */
  changeactionfragment: (node, binder) => {
    const entries = new Entries(node, binder)
    return {
      enter() {},
      install: (rt) => {
        const host = rt.host
        if (!host) {
          return
        }
        const entry = entries.select(rt)
        if (cageBool(entry, 'UseDefaultFragment')) {
          rt.changeFragment(host, null)
        } else {
          rt.changeFragment(host, cageString(entry, 'FragmentName') || null)
        }
      },
      update() {},
      exit() {},
    }
  },

  /**
   * `OnEnter` (default `Clear`) and `OnExit` (default `NoEffect`) clear the motion
   */
  clearmotion: (node, binder) => {
    const entries = new Entries(node, binder)
    const edge = (rt: CageRuntime, option: string, fallback: string) => {
      if ((cageString(entries.select(rt), option) || fallback).toLowerCase() === 'clear') {
        rt.motion.clear()
      }
    }
    return {
      install() {},
      enter: (rt) => edge(rt, 'OnEnter', 'Clear'),
      update() {},
      exit: (rt) => edge(rt, 'OnExit', 'NoEffect'),
    }
  },

  /**
   * The animation's root motion moves the character, times `MotionMultiplier`, and turns it, times
   * `RotationMultiplier` (default 0); `InheritVelocity` carries the velocity the action entered with on (capped by
   * `InheritVelocityMaxSpeed`), slowed by `Decel` per axis
   */
  animationdrivenmotion: (node, binder) => {
    const entries = new Entries(node, binder)
    const read = cached((entry) => ({
      multiplier: cageNumber(entry, 'MotionMultiplier', 1),
      rotation: cageNumber(entry, 'RotationMultiplier', 0),
      decel: vec(entry, 'Decel', [20, 20, 20]),
      inherit: cageBool(entry, 'InheritVelocity'),
      maxSpeed: cageNumber(entry, 'InheritVelocityMaxSpeed', -1),
    }))
    const local: LocalVec = { x: 0, y: 0, z: 0 }
    const difference: LocalVec = { x: 0, y: 0, z: 0 }
    const step: LocalVec = { x: 0, y: 0, z: 0 }
    return {
      install() {},
      enter: (rt) => {
        const motion = rt.motion
        const entry = read(entries.select(rt))
        const inherited = motion.inherited
        inherited.x = 0
        inherited.y = 0
        inherited.z = 0
        if (entry.inherit) {
          const v = motion.velocity
          const up = motion.space.up
          const along = v.x * up.x + v.y * up.y + v.z * up.z
          inherited.x = v.x - up.x * along
          inherited.y = v.y - up.y * along
          inherited.z = v.z - up.z * along
          const speed = Math.hypot(inherited.x, inherited.y, inherited.z)
          if (entry.maxSpeed >= 0 && speed > entry.maxSpeed && speed > 0) {
            const scale = entry.maxSpeed / speed
            inherited.x *= scale
            inherited.y *= scale
            inherited.z *= scale
          }
        }
      },
      update: (rt) => {
        const motion = rt.motion
        const entry = read(entries.select(rt))
        motion.animationDriven = true
        motion.rootMotionMultiplier = entry.multiplier
        motion.rootRotationMultiplier = entry.rotation
        const inherited = motion.inherited
        if (inherited.x || inherited.y || inherited.z) {
          motion.toLocal(motion.yaw, inherited.x, inherited.y, inherited.z, local)
          difference.x = -local.x
          difference.y = -local.y
          difference.z = -local.z
          approach(difference, entry.decel, rt.dt, step)
          local.x += step.x
          local.y += step.y
          local.z += step.z
          motion.toWorld(motion.yaw, local, inherited)
        }
      },
      exit() {},
    }
  },

  /**
   * Turns the character towards the view (`FaceTheCamera`: away from it; `UseCameraDirOnEnterState`: the view as the
   * activity entered)
   */
  camerarelativefacing: (node, binder) => {
    const entries = new Entries(node, binder)
    const read = cached((entry) => ({
      rate: cageNumber(entry, 'TurnRate', 0),
      exponential: cageBool(entry, 'UseExponentialTurnRate'),
      onEnter: cageBool(entry, 'UseCameraDirOnEnterState'),
      faceCamera: cageBool(entry, 'FaceTheCamera'),
    }))
    let entered = 0
    return {
      install() {},
      enter: (rt) => {
        entered = rt.motion.viewYaw
      },
      update: (rt) => {
        const entry = read(entries.select(rt))
        const base = entry.onEnter ? entered : rt.motion.viewYaw
        rt.motion.turnToward(entry.faceCamera ? base + Math.PI : base, entry.rate, entry.exponential, rt.dt)
      },
      exit() {},
    }
  },

  /**
   * Turns the character towards the direction its inputs point, laid in the view (`RepeatInitialInput`: the first
   * direction read)
   */
  inputrelativefacing: (node, binder) => {
    const entries = new Entries(node, binder)
    const read = cached((entry) => ({
      rate: cageNumber(entry, 'TurnRate', 0),
      exponential: cageBool(entry, 'UseExponentialTurnRate'),
      repeat: cageBool(entry, 'RepeatInitialInput'),
      inputs: directionInputs(entry),
    }))
    const direction: LocalVec = { x: 0, y: 0, z: 0 }
    let initial = NaN
    return {
      install() {},
      enter: () => {
        initial = NaN
      },
      update: (rt) => {
        const entry = read(entries.select(rt))
        const motion = rt.motion
        let target: number
        if (entry.repeat && Number.isFinite(initial)) {
          target = initial
        } else {
          readDirection(rt, entry.inputs, direction)
          target = motion.yawOf(motion.viewYaw, direction.x, direction.y)
          initial = target
        }
        motion.turnToward(target, entry.rate, entry.exponential, rt.dt)
      },
      exit() {},
    }
  },

  camerarelativemotion: (node, binder) => movement(node, binder, 'camera'),
  characterrelativemovement: (node, binder) => movement(node, binder, 'character'),

  /**
   * Sheathes or draws the slot's weapon on the edges whose option is `Set`
   */
  sheatheweapon: (node, binder) => {
    const entries = new Entries(node, binder)
    const edge = (rt: CageRuntime, option: string) => {
      const entry = entries.select(rt)
      if (cageString(entry, option).toLowerCase() !== 'set') {
        return
      }
      const slot = cageString(entry, 'SlotToSheathe', 'ACTIVE_MAIN_HAND_WEAPON')
      rt.paperdoll.setSheathed(slot, cageString(entry, 'SheatheOption', 'Sheathe').toLowerCase() === 'sheathe')
    }
    return {
      enter() {},
      install: (rt) => edge(rt, 'OnEnter'),
      update() {},
      exit: (rt) => edge(rt, 'OnExit'),
    }
  },

  /**
   * `PaperdollSlot`: sets, unsets or toggles the Mannequin tags of the slot's item as it installs; a paperdoll source's
   * `OnExit` changes nothing
   */
  setmannequintagfromsource: (node, binder) => {
    const entries = new Entries(node, binder)
    return {
      enter() {},
      install: (rt) => {
        const entry = entries.select(rt)
        if (cageString(entry, 'TagSource').toLowerCase() !== 'paperdollslot') {
          return
        }
        const item = rt.paperdoll.item(cageString(entry, 'SourceSlot'))
        // `Clear` is no option name: the creator's `Set` stays
        const option = tagOption(entry, 'OnEnter', 'set')
        for (const tag of item?.tags ?? []) {
          applyTag(rt, tag, option)
        }
      },
      update() {},
      exit() {},
    }
  },
}

/**
 * `CameraRelativeMotion` (inputs laid in the view) and `CharacterRelativeMovement` (in the character's frame): the
 * velocity approaches the target the inputs ask for at `Accel`, or at `Decel` on the axes it slows down on
 *
 * @remarks
 * Not ported: `AlignVelocity` (the velocity keeps its world heading while the character turns towards it),
 * `UseInitialCameraRotation`, vertical motion, inherited velocity, mount movement, `UseAdditionalVelocity`.
 */
function movement(node: CageNode, binder: CageBinder, frame: 'camera' | 'character'): CageActivity {
  const entries = new Entries(node, binder)
  const read = cached((entry) => ({
    inputs: directionInputs(entry),
    forced: frame === 'camera' ? cageBool(entry, 'ForcedMotion') : cageBool(entry, 'Forced'),
    speed: vec(entry, 'Speed'),
    accel: vec(entry, 'Accel'),
    decel: vec(entry, 'Decel'),
    backwards: cageNumber(entry, 'BackwardsMultiplier', 1),
  }))
  const direction: LocalVec = { x: 0, y: 0, z: 0 }
  const reach: LocalVec = { x: 0, y: 0, z: 0 }
  const target: LocalVec = { x: 0, y: 0, z: 0 }
  const current: LocalVec = { x: 0, y: 0, z: 0 }
  const difference: LocalVec = { x: 0, y: 0, z: 0 }
  const rate: LocalVec = { x: 0, y: 0, z: 0 }
  const step: LocalVec = { x: 0, y: 0, z: 0 }
  return {
    install() {},
    enter() {},
    update: (rt) => {
      const entry = read(entries.select(rt))
      const motion = rt.motion
      const yaw = frame === 'camera' ? motion.viewYaw : motion.yaw
      if (entry.forced) {
        target.x = entry.speed.x
        target.y = entry.speed.y
        target.z = entry.speed.z
        reach.x = entry.speed.x
        reach.y = entry.speed.y
        reach.z = entry.speed.z
      } else {
        readDirection(rt, entry.inputs, direction)
        // keys ask for the full speed (a stick would modulate between `MinSpeed` and `Speed`)
        reach.x = entry.speed.x
        reach.y = entry.speed.y
        reach.z = entry.speed.z
        const length = Math.hypot(direction.x, direction.y)
        let hx = 0
        let hy = 0
        if (length > 1e-7) {
          hx = direction.x / length
          hy = direction.y / length
        } else if (frame === 'character') {
          // the character's movement steers forward without a direction
          hy = 1
        }
        const speed = Math.hypot(hx * reach.x, hy * reach.y)
        target.x = hx * speed
        target.y = hy * speed
        target.z = 0
        if (target.y < 0 && frame === 'camera') {
          const kept = -hy * (1 - entry.backwards)
          target.x *= 1 - kept
          target.y *= 1 - kept
        }
      }
      const v = motion.velocity
      motion.toLocal(yaw, v.x, v.y, v.z, current)
      current.z = 0
      difference.x = target.x - current.x
      difference.y = target.y - current.y
      difference.z = target.z - current.z
      rate.x = Math.abs(reach.x) < Math.abs(current.x) ? entry.decel.x : entry.accel.x
      rate.y = Math.abs(reach.y) < Math.abs(current.y) ? entry.decel.y : entry.accel.y
      rate.z = Math.abs(reach.z) < Math.abs(current.z) ? entry.decel.z : entry.accel.z
      approach(difference, rate, rt.dt, step)
      current.x += step.x
      current.y += step.y
      current.z += step.z
      motion.toWorld(yaw, current, v)
    },
    exit() {},
  }
}
