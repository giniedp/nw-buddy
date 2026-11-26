import { For, Show } from 'solid-js'
import { TextInput } from 'tweak-ui'
import type { CharacterDatabase } from '../../../../api'
import { createAdbSearchStore } from './AdbSearch.store'
import { ADB_FOLDER } from './CharacterAdbFragments.store'
import './AdbSearch.css'

/**
 * Searches the animation databases by path, a click chooses one
 */
export default function AdbSearch(props: { databases: CharacterDatabase[] | null; onChoose: (path: string) => void }) {
  const store = createAdbSearchStore(props)
  const { state } = store

  return (
    <div class="nw-dialog-content nw-dialog-content-wide nw-adb-dialog">
      <TextInput
        class="nw-adb-search"
        placeholder="Search animation databases"
        value={state.query}
        onInput={store.setQuery}
      />
      <p class="nw-note nw-adb-sorting">
        Sorted by how many fragments this character can play, shown as playable / fragments with animations. Databases
        it cannot play follow by name, those without numbers have no animations.
      </p>
      <div class="nw-adb-results">
        <For each={store.results()}>
          {(it) => (
            <button
              class="nw-adb-result"
              classList={{ 'nw-adb-result-compatible': it.playable > 0 }}
              title={it.file}
              onClick={() => props.onChoose(it.file)}
            >
              <span class="nw-adb-result-name">{it.file.replace(ADB_FOLDER, '')}</span>
              <Show when={it.fragments}>
                <span class="nw-muted" title="Fragments the character can play / fragments with animations">
                  {it.playable} / {it.fragments}
                </span>
              </Show>
            </button>
          )}
        </For>
        <Show when={!store.ready()}>
          <p class="nw-note">Reading…</p>
        </Show>
        <Show when={store.ready() && !store.results().length}>
          <p class="nw-note">No animation database matches.</p>
        </Show>
      </div>
    </div>
  )
}
