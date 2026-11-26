import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { CharacterDatabase } from '../../../../api'
import type { FragmentVariant } from '../../../../game/character/CharacterAssets'
import type { ViewContext } from '../registry'
import type { CharacterModeStore } from './CharacterMode.store'
import type { AdbFragment, AdbVariant, CharacterAdbFragmentsState } from './types'

/**
 * The folder prefix the labels drop
 */
export const ADB_FOLDER = 'animations/mannequin/adb/'

export type CharacterAdbFragmentsStore = ReturnType<typeof createCharacterAdbFragmentsStore>

/**
 * The ADB fragments list of the character mode: drives the character by the chosen animation database (Mannequin) and
 * lists its fragments with their variants. Fragments without a variant in the database are left out.
 */
export function createCharacterAdbFragmentsStore(props: { ctx: ViewContext; mode: CharacterModeStore }) {
  const mode = props.mode
  const app = props.ctx.app
  const path = createMemo(() => props.ctx.path)
  const [controllerDefinitions, setControllerDefinitions] = createSignal<string[]>([])
  const [fragments, setFragments] = createSignal<AdbFragment[]>([])
  // cached by the character's assets: not part of the state
  const [databases, setDatabases] = createSignal<CharacterDatabase[] | null>(null)
  const [state, setState] = createStore<CharacterAdbFragmentsState>({
    open: {},
    error: '',
    choosing: false,
    get current() {
      return current()
    },
  })
  const current = createMemo(() => {
    void mode.state.tick
    const action = mode.character()?.mannequin?.current
    return action ? variantKey(action.fragment, action.variantTags) : ''
  })
  const shown = createMemo(() => {
    const filter = mode.state.settings.fragmentFilter.toLowerCase()
    if (!filter) {
      return fragments()
    }
    return fragments().filter((it) => it.name.toLowerCase().includes(filter))
  })
  // the database and file the fragments were read for
  let applied = ''
  let databasesRequested = false

  void app.nwbt.searchFiles('controllerdefs', [], undefined, 2000).then((defs) => {
    setControllerDefinitions(defs.files.map((it) => it.path).filter((it) => it.endsWith('.xml')))
  })

  // the databases with what the character can play of them, once the character is there
  createEffect(() => {
    void mode.state.tick
    const assets = mode.character()?.assets
    if (!assets || databasesRequested) {
      return
    }
    databasesRequested = true
    assets.playableDatabases(path()).then(setDatabases, (err) => {
      setState('error', `Animation databases: ${err instanceof Error ? err.message : String(err)}`)
      setDatabases([])
    })
  })

  /**
   * Drives the character by the database and reads its fragments
   */
  const apply = async (database: string) => {
    const it = mode.character()
    if (!it || !database || !controllerDefinitions().length) {
      return
    }
    applied = `${database}|${path()}`
    setState('error', '')
    setFragments([])
    it.paused = false
    if (!(await it.useDatabase(database, controllerDefinitions()))) {
      setState(
        'error',
        it.mannequin ? 'The database has no Idle for its default tags.' : 'No controller definition matches.',
      )
    }
    const setup = it.mannequin?.setup
    const assets = it.assets
    if (!setup || !assets || setup.database !== database) {
      return
    }
    const set = it.animationSet
    const names = setup.controller.fragmentDefinitions.map((def) => def.name)
    const variants = await Promise.all(names.map((name) => assets.fragmentVariants(database, name).catch(() => [])))
    const result: AdbFragment[] = []
    for (let i = 0; i < names.length; i++) {
      if (!variants[i].length) {
        continue
      }
      const list: AdbVariant[] = []
      for (const variant of variants[i]) {
        const all = variantClips(variant)
        const clips = all.filter((name) => !!set && !!assets.animationByName(set, name))
        list.push({ variant, clips, playable: all.length > 0 && clips.length === all.length })
      }
      result.push({ name: names[i], variants: list, playable: list.some((it) => it.playable) })
    }
    setFragments(result.sort((a, b) => a.name.localeCompare(b.name)))
  }

  // the stored database of the character applies once the character and the lists are there
  createEffect(() => {
    void mode.state.tick
    const database = mode.state.database
    const ready = !!mode.character()?.animationSet && controllerDefinitions().length > 0
    if (ready && database && applied !== `${database}|${path()}`) {
      void apply(database)
    }
  })

  return {
    state,
    /**
     * The fragments that match the filter. Not part of the state: the variants are objects of the character's assets.
     */
    fragments: shown,
    /**
     * Whether the database has fragments at all, the filter shows only then
     */
    hasFragments: () => fragments().length > 0,
    /**
     * The animation databases with what the character can play of them, null until read
     */
    databases,
    filter: () => mode.state.settings.fragmentFilter,
    database: () => mode.state.database,
    setFilter(fragmentFilter: string) {
      mode.update({ fragmentFilter })
    },
    openChooser() {
      setState('choosing', true)
    },
    closeChooser() {
      setState('choosing', false)
    },
    choose(database: string) {
      setState('choosing', false)
      mode.setDatabase(database)
    },
    isOpen(name: string) {
      return !!state.open[name]
    },
    toggle(name: string) {
      setState('open', name, (it) => !it)
    },
    isCurrent(fragment: AdbFragment, variant: FragmentVariant) {
      return state.current === variantKey(fragment.name, variant.tags)
    },
    async play(fragment: AdbFragment, variant: FragmentVariant) {
      const it = mode.character()
      if (!it) {
        return
      }
      const ok = await it.playMove(fragment.name, variant.tags)
      setState('error', ok ? '' : `${fragment.name}: the variant did not install.`)
    },
    /**
     * Whether all clips of a variant are checked
     */
    isSelected(clips: string[]) {
      return mode.isSelected(clips)
    },
    select(clips: string[], on: boolean) {
      mode.select(clips, on)
    },
  }
}

/**
 * The animation names a variant plays, its options' clips included
 */
export function variantClips(variant: FragmentVariant): string[] {
  const result = new Set<string>()
  for (const option of variant.options) {
    for (const layer of option.fragment.animLayers) {
      for (const item of layer.sequence) {
        const name = item.animation?.name
        if (name) {
          result.add(name)
        }
      }
    }
  }
  return [...result]
}

/**
 * A fragment with the tags of a variant, case and order of the tags ignored
 */
export function variantKey(fragment: string, tags: string[]): string {
  const key = tags
    .map((it) => it.toLowerCase())
    .sort()
    .join('+')
  return `${fragment.toLowerCase()}|${key}`
}
