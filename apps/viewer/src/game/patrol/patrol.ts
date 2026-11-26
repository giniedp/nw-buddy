import { PatrolPolicy } from '../../api'

/**
 * The walk state of a patrol: the waypoint it heads to and, for {@link PatrolPolicy.Bounce}, its direction
 */
export interface PatrolStep {
  index: number
  /**
   * 1 forward, -1 back (Bounce only)
   */
  direction: number
}

/**
 * Steps a patrol to its next waypoint by the path's policy:
 *
 * - Loop and Undefined: the next index, wrapping to the first
 * - Bounce: on in the current direction, turning back at either end (0, 1, 2, 1, 0, …)
 * - Random: any waypoint but the current one
 *
 * A one waypoint path stays put.
 *
 * @param random - a number in [0, 1)
 */
export function nextWaypoint(policy: number, count: number, step: PatrolStep, random: () => number): PatrolStep {
  const out = step
  if (count < 2) {
    out.index = 0
    return out
  }
  if (policy === PatrolPolicy.Bounce) {
    let next = out.index + out.direction
    if (next < 0 || next >= count) {
      out.direction = -out.direction
      next = out.index + out.direction
    }
    out.index = next
    return out
  }
  if (policy === PatrolPolicy.Random) {
    // one of the others: draw among count - 1 and skip the current
    const pick = Math.min(Math.floor(random() * (count - 1)), count - 2)
    out.index = pick >= out.index ? pick + 1 : pick
    return out
  }
  out.index = (out.index + 1) % count
  return out
}

/**
 * Seconds a patrol stays at a waypoint (the game's `Waypoint_Duration`): none without a task, -1 (stays) when the
 * minimum is negative, the minimum when the range is empty, else a draw between minimum and maximum
 *
 * @param random - a number in [0, 1)
 * @returns 0 for no wait, -1 to stay, else seconds
 */
export function waypointWait(
  task: string | undefined,
  minDuration: number,
  maxDuration: number,
  random: () => number,
): number {
  if (!task) {
    return 0
  }
  if (minDuration < 0) {
    return -1
  }
  if (maxDuration - minDuration <= Number.EPSILON) {
    return minDuration
  }
  return random() * (maxDuration - minDuration) + minDuration
}

/**
 * Turns a heading toward a target heading by at most `maxTurn` radians, the short way around
 */
export function turnToward(heading: number, target: number, maxTurn: number): number {
  let delta = target - heading
  delta -= Math.round(delta / (2 * Math.PI)) * 2 * Math.PI
  if (Math.abs(delta) <= maxTurn) {
    return target
  }
  return heading + Math.sign(delta) * maxTurn
}
