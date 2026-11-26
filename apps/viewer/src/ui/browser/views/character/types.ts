import type { CharacterAnimationFile } from '../../../../api'
import type { FragmentVariant } from '../../../../game/character/CharacterAssets'
import type { NwViewer } from '../../../../viewer'

/**
 * A skin or cloth of the character, as the engine reports it
 */
export type CharacterPart = ReturnType<NwViewer['previewCharacterParts']>[number]

/**
 * The settings of the character mode, kept for the session
 */
export interface CharacterSettings {
  list: 'animations' | 'fragments'
  filter: string
  fragmentFilter: string
  /**
   * The animation database per character file
   */
  databases: Record<string, string>
  speed: number
  loop: boolean
  skeleton: boolean
  hitboxes: boolean
  inPlace: boolean
  /**
   * The width of the list pane in pixels as the user dragged it, null for the default
   */
  listWidth: number | null
}

/**
 * A dimension of the blend space that plays
 */
export interface BlendDimension {
  name: string
  param: number
  min: number
  max: number
  value: number
}

/**
 * What plays on the character
 */
export interface PlayState {
  name: string | null
  seconds: number
  duration: number
  paused: boolean
  /**
   * The dimensions of the blend space that plays, null for a clip
   */
  blend: BlendDimension[] | null
  /**
   * The weighted animations of that blend space, heaviest first
   */
  blendWeights: string
}

export interface CharacterModeState {
  settings: CharacterSettings
  /**
   * The parts of the character, polled
   */
  parts: CharacterPart[]
  /**
   * What plays, polled. Null until the character has its animations.
   */
  play: PlayState | null
  /**
   * The checked animation names, they go into the export
   */
  selected: string[]
  /**
   * The camera follows the character
   */
  following: boolean
  /**
   * The playing fragment has melee hit shapes, polled
   */
  hasHitboxes: boolean
  /**
   * Counts the polls: the lists that read the engine read again
   */
  tick: number
  /**
   * The animation database of the character, empty for none
   */
  readonly database: string
}

/**
 * The animations of a folder of the animation set
 */
export interface AnimationGroup {
  folder: string
  animations: CharacterAnimationFile[]
}

export interface CharacterAnimationsState {
  /**
   * The folders opened by hand, all are open while a filter is set
   */
  open: Record<string, boolean>
}

/**
 * A fragment of an animation database (Idle, Sprint, …) with its variants
 */
export interface AdbFragment {
  name: string
  variants: AdbVariant[]
  /**
   * One of the variants plays on the character
   */
  playable: boolean
}

export interface AdbVariant {
  variant: FragmentVariant
  /**
   * The animations of the variant that the character's set has: what its check box adds to the export
   */
  clips: string[]
  /**
   * The character's set has all animations of the variant
   */
  playable: boolean
}

export interface CharacterAdbFragmentsState {
  /**
   * The fragments opened by hand
   */
  open: Record<string, boolean>
  error: string
  /**
   * The database dialog is open
   */
  choosing: boolean
  /**
   * The fragment and tags of the variant that plays, see `variantKey`
   */
  readonly current: string
}

export interface AdbSearchState {
  query: string
}
