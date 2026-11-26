import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { CharacterAnimationFile } from '../../../../api'
import type { CharacterModeStore } from './CharacterMode.store'
import type { AnimationGroup, CharacterAnimationsState } from './types'

export type CharacterAnimationsStore = ReturnType<typeof createCharacterAnimationsStore>

/**
 * The animations list of the character mode: the animations of the set by folder, filtered by the filter of the
 * session. A folder is collapsed until opened or filtered.
 */
export function createCharacterAnimationsStore(props: { mode: CharacterModeStore }) {
  const mode = props.mode
  const [state, setState] = createStore<CharacterAnimationsState>({ open: {} })
  const groups = createMemo(() => groupByFolder(mode.animations()))
  const shown = createMemo(() => filterGroups(groups(), mode.state.settings.filter))

  return {
    state,
    /**
     * The folders that match the filter with their animations. Not part of the state: the engine owns the animations.
     */
    groups: shown,
    filter: () => mode.state.settings.filter,
    /**
     * The set has no animations yet
     */
    loading: () => !mode.animations().length,
    setFilter(filter: string) {
      mode.update({ filter })
    },
    isOpen(folder: string) {
      return !!mode.state.settings.filter || !!state.open[folder]
    },
    toggle(folder: string) {
      setState('open', folder, (it) => !it)
    },
    isPlaying(name: string) {
      return mode.isPlaying(name)
    },
    isSelected(names: string[]) {
      return mode.isSelected(names)
    },
    play(name: string) {
      mode.playAnimation(name)
    },
    select(names: string[], on: boolean) {
      mode.select(names, on)
    },
  }
}

export function groupNames(group: AnimationGroup): string[] {
  return group.animations.map((it) => it.name)
}

/**
 * The groups whose folder matches the filter, and the matching animations of the others
 */
export function filterGroups(groups: AnimationGroup[], filter: string): AnimationGroup[] {
  const text = filter.toLowerCase()
  if (!text) {
    return groups
  }
  const result: AnimationGroup[] = []
  for (const group of groups) {
    let animations = group.animations
    if (!group.folder.toLowerCase().includes(text)) {
      animations = animations.filter((it) => it.name.toLowerCase().includes(text))
    }
    if (animations.length) {
      result.push({ folder: group.folder, animations })
    }
  }
  return result
}

/**
 * The animations by folder relative to the folder all of them share, folders sorted by name, game order within
 */
export function groupByFolder(animations: CharacterAnimationFile[]): AnimationGroup[] {
  const prefix = sharedFolder(animations.map((it) => it.file))
  const byFolder = new Map<string, CharacterAnimationFile[]>()
  for (const animation of animations) {
    const slash = animation.file.lastIndexOf('/')
    const folder = slash > prefix.length ? animation.file.slice(prefix.length, slash) : ''
    let list = byFolder.get(folder)
    if (!list) {
      list = []
      byFolder.set(folder, list)
    }
    list.push(animation)
  }
  return [...byFolder.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([folder, list]) => ({ folder, animations: list }))
}

/**
 * The folder path (with its trailing slash) all files start with, empty when they share none
 */
export function sharedFolder(files: string[]): string {
  if (!files.length) {
    return ''
  }
  let prefix = files[0].slice(0, files[0].lastIndexOf('/') + 1)
  for (const file of files) {
    while (prefix && !file.startsWith(prefix)) {
      prefix = prefix.slice(0, prefix.lastIndexOf('/', prefix.length - 2) + 1)
    }
  }
  return prefix
}
