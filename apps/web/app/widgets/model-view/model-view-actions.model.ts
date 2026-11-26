import type { FragmentCategory, FragmentSummary, FragmentVariant } from '@nw-buddy/viewer'

/**
 * The groups of the action list in order, as the viewer lib's `FRAGMENT_CATEGORIES` (the lib loads lazily, its types
 * only are imported here)
 */
export const ACTION_GROUPS: ReadonlyArray<{ category: FragmentCategory; label: string }> = [
  { category: 'attack', label: 'Attacks' },
  { category: 'idle', label: 'Idle & ambient' },
  { category: 'movement', label: 'Movement' },
  { category: 'reaction', label: 'Reactions' },
  { category: 'spawn', label: 'Spawn & intro' },
  { category: 'death', label: 'Death' },
  { category: 'other', label: 'Other' },
]

/**
 * A fragment row of the action list
 */
export interface ActionRow {
  id: string
  /**
   * The fragment name for display
   */
  label: string
  summary: FragmentSummary
  /**
   * What a click plays: the chosen variant, else (other creatures' fragments) the first playable one
   */
  variant: FragmentVariant | null
  playable: boolean
  /**
   * Why it does not play: the animations without clip
   */
  missing: string[]
  damage: boolean
  spell: boolean
  homing: boolean
  loops: boolean
  /**
   * The other variants matching the tags, behind the row's chevron
   */
  others: FragmentVariant[]
}

export interface ActionGroup {
  category: FragmentCategory
  label: string
  rows: ActionRow[]
}

export interface ActionList {
  groups: ActionGroup[]
  /**
   * The rows of all groups in list order
   */
  rows: ActionRow[]
  /**
   * Fragments of other creatures matching the search, left out unless shown
   */
  foreign: number
}

export interface ActionListOptions {
  search: string
  /**
   * Include the fragments of other creatures (see `FragmentSummary.own`)
   */
  showForeign: boolean
  /**
   * The display name of a fragment name
   */
  label: (name: string) => string
}

/**
 * The action list: rows in their groups (empty groups left out), the other creatures' fragments counted and left out
 * unless shown, the search over the fragment names and the ids the fragments refer to (damage rows, spells)
 */
export function buildActionList(summaries: ReadonlyArray<FragmentSummary>, options: ActionListOptions): ActionList {
  const search = options.search.trim().toLowerCase()
  const byCategory = new Map<FragmentCategory, ActionRow[]>()
  let foreign = 0
  for (const summary of summaries) {
    const label = options.label(summary.action.name)
    if (search && !matchesSearch(summary, label, search)) {
      continue
    }
    if (!summary.own) {
      foreign++
      if (!options.showForeign) {
        continue
      }
    }
    const variant = summary.variant ?? summary.action.variants.find((it) => it.playable) ?? null
    const types = summary.facts.types
    const rows = byCategory.get(summary.category) ?? []
    rows.push({
      id: summary.action.name,
      label,
      summary,
      variant,
      playable: !!variant?.playable,
      missing: variant?.missing ?? [],
      damage: types.includes('CAGE-Damage') || types.includes('CAGE-RangedAttack'),
      spell: types.includes('CAGE-CastSpell'),
      homing: types.includes('Homing'),
      loops: summary.facts.loops,
      others: summary.matching.filter((it) => it !== variant),
    })
    byCategory.set(summary.category, rows)
  }
  const groups: ActionGroup[] = []
  for (const group of ACTION_GROUPS) {
    const rows = byCategory.get(group.category)
    if (rows?.length) {
      groups.push({ ...group, rows })
    }
  }
  return { groups, rows: groups.flatMap((it) => it.rows), foreign }
}

/**
 * The label of a variant behind a row's chevron: its tags, or `default` without
 */
export function variantLabel(variant: FragmentVariant): string {
  return variant.tags.length ? variant.tags.join(' + ') : 'default'
}

/**
 * The tags of all variants that are not set yet, sorted: what the tag picker offers
 */
export function availableTags(summaries: ReadonlyArray<FragmentSummary>, set: ReadonlyArray<string>): string[] {
  const taken = new Set(set.map((it) => it.toLowerCase()))
  const result = new Map<string, string>()
  for (const summary of summaries) {
    for (const variant of summary.action.variants) {
      for (const tag of variant.tags) {
        const key = tag.toLowerCase()
        if (!taken.has(key) && !result.has(key)) {
          result.set(key, tag)
        }
      }
    }
  }
  return [...result.values()].sort((a, b) => a.localeCompare(b))
}

function matchesSearch(summary: FragmentSummary, label: string, search: string): boolean {
  if (label.toLowerCase().includes(search) || summary.action.name.toLowerCase().includes(search)) {
    return true
  }
  return summary.facts.references.some((it) => it.toLowerCase().includes(search))
}
