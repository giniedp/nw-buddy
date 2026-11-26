import type { MannequinAction, MannequinController } from '../mannequin/MannequinController'
import type { CageInput } from './CageInput'
import type { CageMotion } from './CageMotion'
import type { CagePaperdoll } from './CagePaperdoll'

/**
 * The status of an action (CAGE `IAction` status as `IfActionStatus` reads it)
 */
export type CageActionStatus = 'None' | 'Pending' | 'Installed' | 'Finished'

/**
 * An action of a list at runtime
 */
export interface CageActionState {
  readonly name: string
  /**
   * The grid alias index, -1 for none
   */
  readonly alias: number
  readonly ignoredByGrid: boolean
  status: CageActionStatus
  /**
   * The fragment the action plays (`ChangeActionFragment` changes it), null for none
   */
  fragment: string | null
  /**
   * The Mannequin action it installed, null while pending or without a fragment
   */
  mannequin: MannequinAction | null
  /**
   * Seconds since the action installed
   */
  activeTime: number
}

/**
 * What conditions and activities run against: the list's state, the action they belong to (`host`), the step
 */
export interface CageRuntime {
  readonly input: CageInput
  readonly motion: CageMotion
  readonly paperdoll: CagePaperdoll
  readonly controller: MannequinController | null
  /**
   * The action whose conditions or activities run, null for grid cells and virtual inputs
   */
  readonly host: CageActionState | null
  /**
   * The step's time, seconds
   */
  readonly dt: number
  /**
   * Stamina, 0..100 (the viewer's stand-in is always full)
   */
  readonly stamina: number
  action(index: number): CageActionState | null
  /**
   * The first installed action under the alias, null for none
   */
  installedOfAlias(alias: number): CageActionState | null
  /**
   * Requests a new fragment for the host action (`ChangeActionFragment`)
   */
  changeFragment(action: CageActionState, fragment: string | null): void
}

/**
 * A bound condition
 */
export type CageTest = (rt: CageRuntime) => boolean

/**
 * What binding needs from the list
 */
export interface CageBinder {
  /**
   * The index of an action the grid builds, -1 when it builds none of that name
   */
  actionIndex(name: string): number
  aliasIndex(name: string): number
  /**
   * The named condition (`IfExternalCondition`, `Conditional` entries), bound on first use; false when no list
   * defines it
   */
  named(name: string): CageTest
  /**
   * A class the viewer does not implement: logged once per type
   */
  unknown(kind: 'condition' | 'activity', type: string): void
}
