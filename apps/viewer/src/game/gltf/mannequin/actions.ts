import type { AdbFragment } from '../../../formats/mannequin'
import { sameName } from '../../character/sameName'
import type { AdbFile } from './database'

/**
 * A variant of a fragment in a character's databases
 */
export interface FragmentVariant {
  /**
   * The fragment name (the action)
   */
  action: string
  /**
   * The tags the variant needs: its own and those of its sub database
   */
  tags: string[]
  /**
   * The database file the variant is in
   */
  file: string
  /**
   * The animation names its layers play, each once
   */
  animations: string[]
  /**
   * Every animation is in the character's animation list
   */
  playable: boolean
  /**
   * The animations the character's list lacks (no clip file, e.g. blend spaces): why it is not playable
   */
  missing: string[]
  fragment: AdbFragment
}

/**
 * A fragment (Mannequin action) with its variants of all database files
 */
export interface FragmentAction {
  name: string
  variants: FragmentVariant[]
  /**
   * Every variant is playable
   */
  playable: boolean
}

/**
 * The fragments of a character's databases, sorted by name. Variants without animation layers are left out, and
 * fragments without variants.
 *
 * @param has - whether the character's animation list has an animation (by name)
 */
export function collectFragmentActions(
  files: ReadonlyArray<AdbFile>,
  has: (name: string) => boolean,
): FragmentAction[] {
  const actions = new Map<string, FragmentAction>()
  for (const file of files) {
    for (const [name, fragments] of file.document.fragments) {
      for (const fragment of fragments) {
        if (!fragment.animLayers.length) {
          continue
        }
        const key = name.toLowerCase()
        let action = actions.get(key)
        if (!action) {
          action = { name, variants: [], playable: true }
          actions.set(key, action)
        }
        const animations = variantAnimations(fragment)
        const missing = animations.filter((it) => !has(it))
        const playable = animations.length > 0 && !missing.length
        action.variants.push({
          action: action.name,
          tags: uniqueNames([...file.tags, ...fragment.tags]),
          file: file.file,
          animations,
          playable,
          missing,
          fragment,
        })
        action.playable = action.playable && playable
      }
    }
  }
  return [...actions.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Whether all tags of a variant are in a tag set (e.g. the model's tags), compared without regard to case
 */
export function variantMatches(variant: FragmentVariant, tags: ReadonlyArray<string>): boolean {
  return variant.tags.every((tag) => tags.some((it) => sameName(it, tag)))
}

/**
 * The variant the game would choose under the tags: of the matching ones the one with the most tags, the first of
 * equal ones. Playable variants only.
 */
export function bestVariant(action: FragmentAction, tags: ReadonlyArray<string>): FragmentVariant | null {
  let result: FragmentVariant | null = null
  for (const variant of action.variants) {
    if (!variant.playable || !variantMatches(variant, tags)) {
      continue
    }
    if (!result || variant.tags.length > result.tags.length) {
      result = variant
    }
  }
  return result
}

/**
 * The idle fragment: `Idle`, else the first fragment named like an idle
 */
export function findIdleAction(actions: ReadonlyArray<FragmentAction>): FragmentAction | null {
  return actions.find((it) => sameName(it.name, 'Idle')) ?? actions.find((it) => /idle/i.test(it.name)) ?? null
}

/**
 * The names without repeats (case-insensitive), the first spelling kept
 */
function uniqueNames(names: string[]): string[] {
  const result: string[] = []
  for (const name of names) {
    if (!result.some((it) => sameName(it, name))) {
      result.push(name)
    }
  }
  return result
}

function variantAnimations(fragment: AdbFragment): string[] {
  const result: string[] = []
  for (const layer of fragment.animLayers) {
    for (const item of layer.sequence) {
      const name = item.animation?.name
      if (name && !result.some((it) => sameName(it, name))) {
        result.push(name)
      }
    }
  }
  return result
}
