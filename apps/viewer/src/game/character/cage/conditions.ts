import { cageAttr, cageBool, cageNumber, cageString, type CageNode } from '../../../formats/cage'
import { sameName } from '../sameName'
import type { CageActionStatus, CageBinder, CageRuntime, CageTest } from './types'

const TRUE: CageTest = () => true
const FALSE: CageTest = () => false

/**
 * Answers of the classes whose state the viewer does not model: the stand-in world is on the ground, dry, not mounted,
 * not encumbered, not stunned, has no status effects, abilities, cooldowns or camera lock, and every player setting is
 * off. Gates the first playable actions need open answer true (`IfCanDodge`, `IfCanResizeCharacterController`,
 * `IfCanNav`/`IfCanRun`/`IfCanSprint`). A class neither bound nor listed answers false and is logged once.
 */
export const CAGE_WORLD_ANSWERS: Record<string, boolean> = {
  ifcandodge: true,
  ifcanresizecharactercontroller: true,
  ifcannav: true,
  ifcanrun: true,
  ifcansprint: true,
  ifmanacost: true,
  ismounted: false,
  ifshouldbemounted: false,
  ifencumbered: false,
  actionconditionequiploadcategory: false,
  ifwaterdepth: false,
  heighttoground: false,
  iftraversal: false,
  ifhasstatuseffect: false,
  ifcameralockactive: false,
  ifcamerastickylockactive: false,
  ifcamerafreelookactive: false,
  isoverridecamactive: false,
  isrequestinginteraction: false,
  caninteract: false,
  ifp2ptrading: false,
  ifisloadoutopen: false,
  iffasttravelteleporting: false,
  ifteleportpending: false,
  isstunned: false,
  issilenced: false,
  ifabilityactive: false,
  ifactiveabilitymovename: false,
  ifcooldowntimer: false,
  ifdamaged: false,
  ifdamagedbyangle: false,
  ifdamagedbypowerlevel: false,
  ifdead: false,
  ifdeathsdoor: false,
  ifcanbreakreaction: false,
  ifplayersetting: false,
  ifstackconfigvar: false,
  ifactionstateflag: false,
  ifammotypeinslot: false,
  ifammoloaded: false,
  ifcombatstatus: false,
  ifingamemode: false,
  ifinwar: false,
  ifincutscene: false,
  ifmountchangeopen: false,
  ifisplacingbuilding: false,
  ifisgathering: false,
  ifisinteractingwithstorage: false,
  ifunstuckteleporting: false,
  ifspectatormode: false,
  ifflymode: false,
  ifhealthpercentage: false,
  ifgritvalue: false,
  ifchargeamount: false,
  ifonroad: false,
  ifonslope: false,
  ifslope: false,
  ishomingdone: false,
  ifhomingoverridetargetset: false,
  ifconsumablecooldowntimer: false,
  isinstore: false,
  ifisrequestingloreitem: false,
  ifmusicalperformancestate: false,
  iftransmogopen: false,
  ispreviewingskin: false,
  isemoteenabled: false,
  isemotepreviewenabled: false,
  actionconditionspellspawnlocationstate: false,
  ifcameralocktargetinspellrange: false,
  ifspelllosfailclient: false,
}

/**
 * Binds a condition element to its test (CAGE `ActionConditionRegistry`, the classes the viewer needs). Class names
 * match without regard to case and with or without their `ActionCondition` prefix.
 */
export function bindCondition(node: CageNode | null, binder: CageBinder): CageTest {
  if (!node) {
    return FALSE
  }
  const type = node.type.toLowerCase().replace(/^actioncondition(?=.)/, '')
  const bind = CONDITIONS[type]
  if (bind) {
    return bind(node, binder)
  }
  const fixed = CAGE_WORLD_ANSWERS[type] ?? CAGE_WORLD_ANSWERS[node.type.toLowerCase()]
  if (fixed !== undefined) {
    return fixed ? TRUE : FALSE
  }
  binder.unknown('condition', node.type)
  return FALSE
}

type ConditionFactory = (node: CageNode, binder: CageBinder) => CageTest

function children(node: CageNode, binder: CageBinder): CageTest[] {
  return node.children.map((it) => bindCondition(it, binder))
}

/**
 * `Not` and `Group` hold the last of their children, each replacing the one before; no child never holds
 */
function lastChild(node: CageNode, binder: CageBinder): CageTest | null {
  const last = node.children[node.children.length - 1]
  return last ? bindCondition(last, binder) : null
}

type Comparison = (value: number, reference: number) => boolean

const FLT_EPSILON = 1.1920929e-7

/**
 * The comparison an operator names (`MoveSpeed`, `IfVelocity` and friends
 */
function comparison(op: string): Comparison {
  switch (op.toLowerCase()) {
    case 'greaterthan':
      return (value, reference) => value > reference
    case 'lessthan':
      return (value, reference) => value < reference
    case 'lessthanorequal':
      return (value, reference) => value < reference + FLT_EPSILON
    case 'equal':
    case 'equalto':
      return (value, reference) => Math.abs(value - reference) <= FLT_EPSILON
    case 'notequal':
      return (value, reference) => Math.abs(value - reference) > FLT_EPSILON
    default:
      return (value, reference) => value > reference - FLT_EPSILON
  }
}

const STATUSES: Record<string, CageActionStatus> = {
  none: 'None',
  pending: 'Pending',
  installed: 'Installed',
  finished: 'Finished',
}

/**
 * The status an `IfActionStatus` / `IfAliasStatus` asks for, null for an unknown name (never holds)
 */
function actionStatus(node: CageNode): CageActionStatus | null {
  return STATUSES[cageString(node, 'Status', 'Installed').toLowerCase()] ?? null
}

/**
 * The digital direction of four inputs: `x` right less left, `y` forward less back, each held input counting one
 */
function digitalDirection(
  rt: CageRuntime,
  forward: string,
  back: string,
  left: string,
  right: string,
  out: { x: number; y: number },
) {
  const input = rt.input
  out.x = (right && input.isHeld(right) ? 1 : 0) - (left && input.isHeld(left) ? 1 : 0)
  out.y = (forward && input.isHeld(forward) ? 1 : 0) - (back && input.isHeld(back) ? 1 : 0)
  return out
}

/**
 * Degrees clockwise from forward, 0..360
 */
function clockwiseDegrees(x: number, y: number): number {
  const deg = (Math.atan2(x, y) * 180) / Math.PI
  return deg < 0 ? deg + 360 : deg
}

function angleDifference(a: number, b: number): number {
  let d = (a - b) % 360
  if (d > 180) {
    d -= 360
  } else if (d < -180) {
    d += 360
  }
  return Math.abs(d)
}

const CONDITIONS: Record<string, ConditionFactory> = {
  true: () => TRUE,
  false: () => FALSE,
  and: (node, binder) => {
    const tests = children(node, binder)
    return (rt) => {
      for (const test of tests) {
        if (!test(rt)) {
          return false
        }
      }
      return true
    }
  },
  or: (node, binder) => {
    const tests = children(node, binder)
    return (rt) => {
      for (const test of tests) {
        if (test(rt)) {
          return true
        }
      }
      return false
    }
  },
  xor: (node, binder) => {
    const tests = children(node, binder)
    return (rt) => {
      let result = false
      for (const test of tests) {
        result = result !== test(rt)
      }
      return result
    }
  },
  not: (node, binder) => {
    const test = lastChild(node, binder)
    return test ? (rt) => !test(rt) : FALSE
  },
  group: (node, binder) => lastChild(node, binder) ?? FALSE,
  ifexternalcondition: (node, binder) => binder.named(cageString(node, 'ConditionName')),
  ifinput: (node) => {
    const name = cageString(node, 'InputName').toLowerCase()
    const backTicks = cageNumber(node, 'BackTicks', 0)
    const cancel = cageString(node, 'BackTickCancelInput').toLowerCase()
    if (backTicks <= 0) {
      return (rt) => rt.input.isHeld(name)
    }
    return (rt) => {
      if (!rt.input.wasPressed(name, backTicks)) {
        return false
      }
      if (!cancel) {
        return true
      }
      // a cancel press counts after its release: the press succeeds only when it is newer than the cancel press
      const cancelAge = rt.input.pressAge(cancel)
      return cancelAge < 0 || rt.input.pressAge(name) < cancelAge
    }
  },
  iftoggleholdinput: (node) => {
    const press = cageString(node, 'PressInputName').toLowerCase()
    const hold = cageString(node, 'HoldInputName').toLowerCase()
    // the hold behaviour (the toggle option is off): held while either input is held
    return (rt) => rt.input.isHeld(hold) || rt.input.isHeld(press)
  },
  ifanaloginput: (node) => {
    const analog = cageString(node, 'AnalogInput', 'Left Analog').toLowerCase()
    const digital = analog === 'none'
    const forward = cageString(node, 'DigitalForwardInput').toLowerCase()
    const back = cageString(node, 'DigitalBackInput').toLowerCase()
    const left = cageString(node, 'DigitalLeftInput').toLowerCase()
    const right = cageString(node, 'DigitalRightInput').toLowerCase()
    const min = cageNumber(node, 'MinInputMagnitude', 0.1)
    const max = cageNumber(node, 'MaxInputMagnitude', 1)
    const matchAngle = cageBool(node, 'RequireTargetAngleMatch')
    const characterRelative = cageBool(node, 'UseCharacterRelativeAngle')
    const target = cageNumber(node, 'TargetAngle', 0)
    const tolerance = cageNumber(node, 'TargetAngleTolerance', 1)
    const dir = { x: 0, y: 0 }
    return (rt) => {
      // no gamepad: the sticks read zero
      if (digital) {
        digitalDirection(rt, forward, back, left, right, dir)
      } else {
        dir.x = 0
        dir.y = 0
      }
      const magnitude = Math.min(1, Math.hypot(dir.x, dir.y))
      if (magnitude < min || magnitude > max) {
        return false
      }
      if (!matchAngle) {
        return true
      }
      let angle = clockwiseDegrees(dir.x, dir.y)
      if (characterRelative) {
        // the input laid in the view, measured from the character's facing (yaws turn counterclockwise)
        angle += ((rt.motion.yaw - rt.motion.viewYaw) * 180) / Math.PI
      }
      return angleDifference(angle, target) <= tolerance
    }
  },
  ifmannequintag: (node) => {
    const tag = cageString(node, 'TagName')
    return (rt) => !!rt.controller?.tags.has(tag)
  },
  ifmannequinmarker: (node) => {
    const marker = cageString(node, 'MarkerName').toLowerCase()
    return (rt) => !!rt.controller?.hasMarker(marker)
  },
  iffragmentdone: (node) => {
    const useHost = cageBool(node, 'UseHostActionFragment', true)
    const fragment = cageString(node, 'FragmentName')
    const offset = cageNumber(node, 'ExitOffsetSeconds', 0)
    return (rt) => {
      let action = rt.controller?.current
      if (useHost) {
        action = rt.host?.mannequin
      }
      if (!action || (fragment && !sameName(action.fragment, fragment))) {
        return false
      }
      return action.oneShot && action.time >= action.duration - offset
    }
  },
  iffragmentplaying: (node) => {
    const useHost = cageBool(node, 'UseHostActionFragment', true)
    const fragment = cageString(node, 'FragmentName')
    return (rt) => {
      if (useHost) {
        const action = rt.host?.mannequin
        if (!action || rt.host.status !== 'Installed' || !rt.controller?.actions.includes(action)) {
          return false
        }
        return !fragment || sameName(action.fragment, fragment)
      }
      const actions = rt.controller?.actions
      if (!actions) {
        return false
      }
      for (const action of actions) {
        if (action.scopes.length && (!fragment || sameName(action.fragment, fragment))) {
          return true
        }
      }
      return false
    }
  },
  ifactionstatus: (node, binder) => {
    const index = binder.actionIndex(cageString(node, 'ActionName'))
    const status = actionStatus(node)
    const activeTime = cageNumber(node, 'ActiveTime', -1)
    const compare = comparison(cageString(node, 'ActiveTimeComparisonType', 'GreaterThanOrEqual'))
    if (index < 0 || !status) {
      return FALSE
    }
    return (rt) => {
      const action = rt.action(index)
      if (!action || action.status !== status) {
        return false
      }
      return activeTime < 0 || compare(action.activeTime, activeTime)
    }
  },
  ifaliasstatus: (node, binder) => {
    const alias = binder.aliasIndex(cageString(node, 'GridAlias'))
    const status = actionStatus(node)
    const activeTime = cageNumber(node, 'ActiveTime', -1)
    const compare = comparison(cageString(node, 'ActiveTimeComparisonType', 'GreaterThanOrEqual'))
    if (alias < 0 || !status) {
      return FALSE
    }
    return (rt) => {
      const action = rt.installedOfAlias(alias)
      if (!action || action.status !== status) {
        return false
      }
      return activeTime < 0 || compare(action.activeTime, activeTime)
    }
  },
  ifiteminslot: (node) => {
    const slot = cageString(node, 'SlotToCheckAlias')
    const valid = cageBool(node, 'RequireSlotValid', true)
    const active = cageBool(node, 'RequireSlotActive')
    return (rt) => (!valid || !!rt.paperdoll.item(slot)) && (!active || rt.paperdoll.isActive(slot))
  },
  ifiteminslotequippable: (node) => {
    const slot = cageString(node, 'SlotToCheckAlias')
    return (rt) => !!rt.paperdoll.item(slot)
  },
  ifhasweaponprerequisites: (node) => {
    const slot = cageString(node, 'WeaponSlot', 'ACTIVE_MAIN_HAND_WEAPON')
    return (rt) => !!rt.paperdoll.item(slot)
  },
  ifitemsheathed: (node) => {
    const slot = cageString(node, 'SlotToCheckAlias')
    return (rt) => rt.paperdoll.isSheathed(slot)
  },
  ifmannequintaginitemslot: (node) => {
    const slot = cageString(node, 'SlotToCheckAlias')
    const tag = cageString(node, 'TagName')
    return (rt) => {
      const tags = rt.paperdoll.item(slot)?.tags
      if (!tags) {
        return false
      }
      for (const it of tags) {
        if (sameName(it, tag)) {
          return true
        }
      }
      return false
    }
  },
  movespeed: (node) => {
    const compare = comparison(cageAttr(node, 'Comparison') ?? cageString(node, 'ComparisonType', 'GreaterThanOrEqual'))
    const value = cageNumber(node, 'Value', 0)
    return (rt) => compare(rt.motion.horizontalSpeed, value)
  },
  ifvelocity: (node) => {
    const x = velocityAxis(node, 'X')
    const y = velocityAxis(node, 'Y')
    const z = velocityAxis(node, 'Z')
    const local = { x: 0, y: 0, z: 0 }
    return (rt) => {
      const v = rt.motion.velocity
      rt.motion.toLocal(rt.motion.yaw, v.x, v.y, v.z, local)
      return x.test(local.x) && y.test(local.y) && z.test(local.z)
    }
  },
  cameracharacterangle: (node) => {
    const threshold = cageNumber(node, 'AngleThreshold', 0)
    return (rt) => {
      const view = (rt.motion.viewYaw * 180) / Math.PI
      const facing = (rt.motion.yaw * 180) / Math.PI
      return angleDifference(view, facing) > threshold
    }
  },
  ifstaminavalue: (node) => {
    const value = cageNumber(node, 'ComparisonValue', 0)
    const compare = comparison(cageString(node, 'ComparisonType', 'GreaterThanOrEqual'))
    return (rt) => compare(rt.stamina, value)
  },
}

/**
 * The check of one local axis of `IfVelocity`, passing when the axis is not checked
 */
function velocityAxis(node: CageNode, axis: 'X' | 'Y' | 'Z'): { test: (value: number) => boolean } {
  if (!cageBool(node, `Check${axis}Velocity`)) {
    return { test: () => true }
  }
  const reference = cageNumber(node, `${axis}Velocity`, 0)
  const compare = comparison(cageString(node, `${axis}ComparisonType`, 'GreaterThanOrEqual'))
  return { test: (value) => compare(value, reference) }
}
