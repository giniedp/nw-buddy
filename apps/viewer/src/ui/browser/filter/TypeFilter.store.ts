import { createMemo } from 'solid-js'
import type { AssetType, TypeGroup } from '../../../api/browse'
import type { TypeGroupEntry } from './types'

const GROUP_LABEL: Partial<Record<TypeGroup, string>> = { ui: 'UI', ai: 'AI' }

export interface TypeFilterProps {
  types: AssetType[]
  selected: ReadonlySet<number>
  onChange: (selected: ReadonlySet<number>) => void
}

export type TypeFilterStore = ReturnType<typeof createTypeFilterStore>

/**
 * The type filter: the types by group, and turning types on and off. The selection is the caller's.
 */
export function createTypeFilterStore(props: TypeFilterProps) {
  const groups = createMemo(() => groupTypes(props.types))

  const set = (indices: number[], on: boolean) => {
    const next = new Set(props.selected)
    for (const index of indices) {
      if (on) {
        next.add(index)
      } else {
        next.delete(index)
      }
    }
    props.onChange(next)
  }

  return {
    /**
     * The groups by file count, hidden last. Not part of a state: they hold the types of the app.
     */
    groups,
    title: () => filterTitle(props.types, props.selected),
    active: () => props.selected.size > 0,
    isSelected(index: number) {
      return props.selected.has(index)
    },
    isGroupSelected(group: TypeGroupEntry) {
      return group.entries.every((it) => props.selected.has(it.index))
    },
    setType(index: number, on: boolean) {
      set([index], on)
    },
    setGroup(group: TypeGroupEntry, on: boolean) {
      set(
        group.entries.map((it) => it.index),
        on,
      )
    },
    clear() {
      props.onChange(new Set())
    },
  }
}

/**
 * The types by group, groups by file count with the hidden group last, types by file count
 */
export function groupTypes(types: AssetType[]): TypeGroupEntry[] {
  const byGroup = new Map<TypeGroup, TypeGroupEntry>()
  types.forEach((type, index) => {
    let group = byGroup.get(type.group)
    if (!group) {
      group = { group: type.group, entries: [], count: 0 }
      byGroup.set(type.group, group)
    }
    group.entries.push({ index, type })
    group.count += type.count
  })
  const list = [...byGroup.values()]
  for (const group of list) {
    group.entries.sort((a, b) => b.type.count - a.type.count)
  }
  return list.sort((a, b) => Number(a.group === 'hidden') - Number(b.group === 'hidden') || b.count - a.count)
}

export function groupLabel(group: TypeGroup): string {
  return GROUP_LABEL[group] ?? group
}

/**
 * The title of the filter button: what it filters by
 */
export function filterTitle(types: AssetType[], selected: ReadonlySet<number>): string {
  if (selected.size === 0) {
    return 'Filter by type: all types'
  }
  if (selected.size === 1) {
    return `Filter by type: ${types[[...selected][0]]?.label ?? '1 type'}`
  }
  return `Filter by type: ${selected.size} types`
}
