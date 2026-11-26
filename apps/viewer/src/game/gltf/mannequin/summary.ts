import { sameName } from '../../character/sameName'
import { bestVariant, variantMatches, type FragmentAction, type FragmentVariant } from './actions'

/**
 * The group of a fragment in the action list, see {@link fragmentCategory}
 */
export type FragmentCategory = 'attack' | 'idle' | 'movement' | 'reaction' | 'spawn' | 'death' | 'other'

/**
 * The categories in list order
 */
export const FRAGMENT_CATEGORIES: ReadonlyArray<FragmentCategory> = [
  'attack',
  'idle',
  'movement',
  'reaction',
  'spawn',
  'death',
  'other',
]

/**
 * Name rules, the first match wins
 */
const NAME_RULES: ReadonlyArray<[FragmentCategory, RegExp]> = [
  ['death', /(^|_)(death|die|dead|dying)(_|$)/i],
  ['spawn', /^(spawn|intro|emerge|ambush|unburrow|burrow|awake|wake|summoned|phase_transition)|(_intro|_spawn)$/i],
  [
    'reaction',
    /^(r_|hit|stagger|stun|knock|flinch|react|block|parry|brokenguard|grit|pain|launch|getup|get_up|deflect|panic|flee|dazed)/i,
  ],
  [
    'movement',
    /^(move|walk|run|strafe|sprint|turn|dodge|dash|hop|jump|land|fall|vault|nav|swim|fly|step|evade|retreat|roll|climb|traverse|reset_move|combat_run|combat_turn|combat_strafe)/i,
  ],
  [
    'idle',
    /^(idle|fidget|combat_fidget|alert|quick_alert|poi_|look|ambient|combat_idle|aggro|taunt|emote|sleep|sit|rest|patrol|wander|interact|pray|worship|crouch|victory|wait|outro|gather|use|equip|unsheathe|sheathe|inventory|aim|roar|growl|amb_)/i,
  ],
]

/**
 * Procedural types of attacks: a fragment with one of them deals damage, casts or homes in on a target
 */
const ATTACK_TYPES = ['CAGE-Damage', 'CAGE-RangedAttack', 'CAGE-CastSpell', 'Homing']

/**
 * Attack names that have no attack clip (e.g. the start of a combo)
 */
const ATTACK_NAME =
  /attack|atk|cast|spell|combo|slam|strike|swing|shot|shoot|throw|bite|swipe|charge|aoe|summon|projectile/i

/**
 * The group of a fragment: by its name (death, spawn, reactions, movement, idles), else by its procedural clips or name
 * (attacks), else other
 *
 * @param types - the procedural types of its variants
 */
export function fragmentCategory(name: string, types: ReadonlyArray<string>): FragmentCategory {
  for (const [category, rule] of NAME_RULES) {
    if (rule.test(name)) {
      return category
    }
  }
  if (types.some((it) => ATTACK_TYPES.includes(it)) || ATTACK_NAME.test(name)) {
    return 'attack'
  }
  return 'other'
}

/**
 * What a variant does, read from its layers
 */
export interface VariantFacts {
  /**
   * The procedural types of its proc layers, each once (empty clips left out)
   */
  types: string[]
  /**
   * The ids its clips refer to: damage table rows (`DamageTableRow` of damage, ranged and grit clips) and spells
   * (`SpellName` of cast clips), each once
   */
  references: string[]
  /**
   * The last clip of its first animation layer loops
   */
  loops: boolean
}

/**
 * The facts of a variant
 */
export function variantFacts(variant: FragmentVariant): VariantFacts {
  const types: string[] = []
  const references: string[] = []
  const add = (list: string[], value: string | string[] | undefined) => {
    if (typeof value === 'string' && value && !list.some((it) => sameName(it, value))) {
      list.push(value)
    }
  }
  for (const layer of variant.fragment.procLayers) {
    for (const item of layer.sequence) {
      const procedural = item.procedural
      if (!procedural?.type) {
        continue
      }
      add(types, procedural.type)
      add(references, procedural.params['DamageTableRow'])
      add(references, procedural.params['SpellName'])
    }
  }
  const sequence = variant.fragment.animLayers[0]?.sequence ?? []
  let loops = false
  for (let i = sequence.length - 1; i >= 0; i--) {
    const animation = sequence[i].animation
    if (animation?.name) {
      loops = animation.flags.some((it) => sameName(it, 'Loop'))
      break
    }
  }
  return { types, references, loops }
}

/**
 * A fragment as the action list shows it for a character's tags
 */
export interface FragmentSummary {
  action: FragmentAction
  category: FragmentCategory
  /**
   * The variant the game plays for the tags ({@link bestVariant}); when none of the matching variants is playable,
   * the best of them (not playable, see {@link FragmentVariant.missing}); null when no variant matches the tags
   */
  variant: FragmentVariant | null
  /**
   * The variants matching the tags, the chosen one first
   */
  matching: FragmentVariant[]
  /**
   * The facts of the chosen variant, else of the first variant
   */
  facts: VariantFacts
  /**
   * The fragment belongs to the character, see {@link summarizeFragments}
   */
  own: boolean
}

/**
 * The fragments of a character for its tags: the chosen variant, the category and whether the fragment is the
 * character's own.
 *
 * Own: the chosen variant needs at least one of the tags (a variant made for this kind of creature); or it is a
 * generic one (no tags) whose damage rows and spells are the character's (`ownIds`) or that has none (idles, reactions,
 * deaths). A fragment without a variant for the tags is not own; generic ones that only refer to other creatures' rows
 * and spells neither (shared databases list the attacks of all their creatures).
 *
 * @param ownIds - the character's damage row ids and spell names (lower case), null when unknown: then every
 *   generic fragment counts as own
 */
export function summarizeFragments(
  actions: ReadonlyArray<FragmentAction>,
  tags: ReadonlyArray<string>,
  ownIds: ReadonlySet<string> | null,
): FragmentSummary[] {
  return actions.map((action) => {
    const matching = action.variants.filter((it) => variantMatches(it, tags))
    const variant = bestVariant(action, tags) ?? mostTags(matching)
    if (variant) {
      matching.splice(matching.indexOf(variant), 1)
      matching.unshift(variant)
    }
    const facts = variantFacts(variant ?? action.variants[0])
    const types = new Set<string>()
    for (const it of action.variants) {
      for (const type of variantFacts(it).types) {
        types.add(type)
      }
    }
    let own = !!variant
    if (variant && !variant.tags.length && facts.references.length && ownIds) {
      own = facts.references.some((it) => ownIds.has(it.toLowerCase()))
    }
    return {
      action,
      category: fragmentCategory(action.name, [...types]),
      variant,
      matching,
      facts,
      own,
    }
  })
}

/**
 * The variant with the most tags, the first of equal ones
 */
function mostTags(variants: ReadonlyArray<FragmentVariant>): FragmentVariant | null {
  let result: FragmentVariant | null = null
  for (const it of variants) {
    if (!result || it.tags.length > result.tags.length) {
      result = it
    }
  }
  return result
}
