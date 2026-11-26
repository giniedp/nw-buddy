import { For, Show } from 'solid-js'
import { BoolInput, Icon, TextInput } from 'tweak-ui'
import svgChevron from '../../../icons/chevron-right.svg?raw'
import { createCharacterAnimationsStore, groupNames } from './CharacterAnimations.store'
import type { CharacterModeStore } from './CharacterMode.store'
import './CharacterAnimations.css'

/**
 * The animations of the character's set, grouped by folder (collapsed until opened or filtered). A click plays an
 * animation, the check box adds it to the export; the check box of a folder adds all its animations.
 */
export default function CharacterAnimations(props: { mode: CharacterModeStore }) {
  const store = createCharacterAnimationsStore(props)

  return (
    <>
      <div class="nw-view-bar">
        <TextInput
          class="nw-view-filter"
          placeholder="Filter by name or folder"
          value={store.filter()}
          onInput={store.setFilter}
        />
      </div>
      <div class="nw-character-animations">
        <For each={store.groups()}>
          {(group) => (
            <>
              <div class="nw-character-group-row">
                <BoolInput
                  value={store.isSelected(groupNames(group))}
                  onInput={(on) => store.select(groupNames(group), on)}
                />
                <button
                  class="nw-character-group"
                  classList={{ 'nw-character-group-open': store.isOpen(group.folder) }}
                  onClick={() => store.toggle(group.folder)}
                >
                  <Icon svg={svgChevron} />
                  <span class="nw-character-group-name">{group.folder || '(no folder)'}</span>
                  <span class="nw-muted">{group.animations.length}</span>
                </button>
              </div>
              <Show when={store.isOpen(group.folder)}>
                <For each={group.animations}>
                  {(animation) => (
                    <div
                      class="nw-character-row"
                      classList={{ 'nw-character-row-active': store.isPlaying(animation.name) }}
                    >
                      <BoolInput
                        value={store.isSelected([animation.name])}
                        onInput={(on) => store.select([animation.name], on)}
                      />
                      <button
                        class="nw-character-play"
                        title={animation.file}
                        onClick={() => store.play(animation.name)}
                      >
                        {animation.name}
                        <Show when={animation.type !== 'caf'}>
                          <span class="nw-character-kind"> {animation.type}</span>
                        </Show>
                      </button>
                    </div>
                  )}
                </For>
              </Show>
            </>
          )}
        </For>
        <Show when={store.loading()}>
          <p class="nw-note">Reading…</p>
        </Show>
      </div>
    </>
  )
}
