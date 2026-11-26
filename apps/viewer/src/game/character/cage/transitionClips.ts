import type { AdbProcedural } from '../../../formats/mannequin'
import type {
  MannequinAction,
  MannequinProceduralClip,
  MannequinProceduralHandler,
} from '../mannequin/MannequinController'
import type { CageActionState } from './types'

/**
 * What the transition clips need from their action list
 */
export interface CageTransitionHost {
  /**
   * Tests a named condition with no host action (the game passes none)
   */
  testNamed(name: string): boolean
  isHeld(input: string): boolean
  wasPressed(input: string, backTicks: number): boolean
  /**
   * The list's action that owns a Mannequin action, null for none
   */
  ownerOf(action: MannequinAction): CageActionState | null
  /**
   * Queues an action by exact name, without its activation or the grid (skipped while pending or installed)
   */
  queueNamed(name: string): void
  changeFragment(action: CageActionState, fragment: string | null): void
}

interface TransitionParams {
  buffered: boolean
  input: string
  backTicks: number
  condition: string
  key: string
  newFragment: string
  newAction: string
  holdTime: number
}

interface TransitionState {
  params: TransitionParams
  activated: boolean
  dispatched: boolean
}

const INSTANT = 'CAGE-TransitionInstant'
const BUFFERED = 'CAGE-TransitionBuffered'

/**
 * The CAGE transition clips of an action list's fragments
 * while a clip runs, its `Input` (pressed within `BackTicks` steps, or held)
 * or else its named `Condition` (tested without a host action) activates it; an activated clip with a target becomes the
 * one pending clip, which is ready once held `HoldTimeRequired` seconds. An instant clip dispatches as it is ready, a
 * buffered clip as it exits at its full duration. Dispatch: `NewFragment` plays another fragment for the owning action,
 * else `NewAction` queues that action by name.
 *
 * Not ported: the lockouts (`SingleActivationLockout`, `SingleActivationKeyLockout`), mount aliases, timing overrides
 * (the game never applies them either).
 */
export class CageTransitionClips implements MannequinProceduralHandler {
  private readonly host: CageTransitionHost
  private pending: MannequinProceduralClip | null = null
  private elapsed = 0
  private key = ''

  public constructor(host: CageTransitionHost) {
    this.host = host
  }

  public enter(clip: MannequinProceduralClip) {
    const type = clip.procedural.type
    if (type !== INSTANT && type !== BUFFERED) {
      return
    }
    const state: TransitionState = { params: readParams(clip.procedural), activated: false, dispatched: false }
    clip.state = state
  }

  public update(clip: MannequinProceduralClip, dt: number) {
    const state = clip.state as TransitionState | null
    if (!state || !this.host.ownerOf(clip.action)) {
      return
    }
    if (this.pending === clip) {
      this.elapsed += dt
    }
    const params = state.params
    const holds = this.test(params)
    if (!state.activated) {
      if (holds) {
        state.activated = true
        if (params.newAction || params.newFragment) {
          if (!params.key || params.key !== this.key) {
            this.elapsed = 0
          }
          this.key = params.key
          this.pending = clip
        }
      }
    } else if (!holds && params.holdTime > 0) {
      // a released hold cancels the pending clip, its key and elapsed time stay
      if (this.pending === clip) {
        this.pending = null
      }
      state.activated = false
    }
    if (!params.buffered && this.ready(clip)) {
      this.dispatch(clip, state)
    }
  }

  public exit(clip: MannequinProceduralClip, completed: boolean) {
    const state = clip.state as TransitionState | null
    if (!state) {
      return
    }
    if (state.params.buffered && completed && this.ready(clip)) {
      this.dispatch(clip, state)
    }
    if (this.pending === clip) {
      this.pending = null
    }
  }

  private test(params: TransitionParams): boolean {
    if (params.input) {
      const input =
        params.backTicks > 0 ? this.host.wasPressed(params.input, params.backTicks) : this.host.isHeld(params.input)
      if (input) {
        return true
      }
    }
    return !!params.condition && this.host.testNamed(params.condition)
  }

  private ready(clip: MannequinProceduralClip): boolean {
    const hold = (clip.state as TransitionState).params.holdTime
    return this.pending === clip && (hold < 0 || this.elapsed >= hold)
  }

  private dispatch(clip: MannequinProceduralClip, state: TransitionState) {
    if (state.dispatched) {
      return
    }
    state.dispatched = true
    const params = state.params
    if (params.newFragment) {
      const owner = this.host.ownerOf(clip.action)
      if (owner) {
        this.host.changeFragment(owner, params.newFragment)
      }
      this.key = ''
      this.elapsed = 0
      return
    }
    if (params.newAction) {
      this.host.queueNamed(params.newAction)
    }
  }
}

function readParams(procedural: AdbProcedural): TransitionParams {
  const text = (name: string) => {
    const value = procedural.params[name]
    return typeof value === 'string' ? value : ''
  }
  const number = (name: string, fallback: number) => {
    const value = parseFloat(text(name))
    return Number.isFinite(value) ? value : fallback
  }
  return {
    buffered: procedural.type === BUFFERED,
    input: text('Input').toLowerCase(),
    // read as a float, used as an integer
    backTicks: Math.trunc(number('BackTicks', 0)),
    condition: text('Condition'),
    key: text('TransitionKey').toLowerCase(),
    newFragment: text('NewFragment'),
    newAction: text('NewAction'),
    holdTime: number('HoldTimeRequired', -1),
  }
}
