import { For, Show } from 'solid-js'
import { Badge, BoolInput, Button, Icon, TextInput } from 'tweak-ui'
import svgChevron from '../../../icons/chevron-right.svg?raw'
import svgSearch from '../../../icons/magnifying-glass.svg?raw'
import { ModalDialog } from '../../../common/ModalDialog'
import type { ViewContext } from '../registry'
import AdbSearch from './AdbSearch'
import { ADB_FOLDER, createCharacterAdbFragmentsStore, variantClips } from './CharacterAdbFragments.store'
import type { CharacterModeStore } from './CharacterMode.store'
import { clipCount } from './format'
import './CharacterAdbFragments.css'

/**
 * The fragments of a Mannequin animation database (ADB) on the character: Idle, Sprint, Attack_Primary, … each with
 * its variants, one per tag set (Unarmed, 1H_Melee+Sword, …). A click on a variant plays it, the check box adds its
 * clips to the export.
 */
export default function CharacterAdbFragments(props: { ctx: ViewContext; mode: CharacterModeStore }) {
  const store = createCharacterAdbFragmentsStore(props)
  const { state } = store

  return (
    <>
      <div class="nw-view-bar">
        <Button
          ghost
          class="nw-character-database"
          title={store.database() || 'Choose the animation database of the character'}
          icon={<Icon svg={svgSearch} />}
          onClick={store.openChooser}
        >
          {store.database() ? store.database().replace(ADB_FOLDER, '') : 'Animation database…'}
        </Button>
      </div>
      <Show when={!store.database()}>
        <p class="nw-note nw-character-note">Pick an ADB with the button above.</p>
      </Show>
      <ModalDialog title="Animation database" open={state.choosing} onClose={store.closeChooser}>
        <Show when={state.choosing}>
          <AdbSearch databases={store.databases()} onChoose={store.choose} />
        </Show>
      </ModalDialog>
      <Show when={state.error}>
        <div class="nw-view-info nw-error nw-character-error">{state.error}</div>
      </Show>
      <Show when={store.hasFragments()}>
        <div class="nw-view-bar">
          <TextInput
            class="nw-view-filter"
            placeholder="Filter fragments"
            value={store.filter()}
            onInput={store.setFilter}
          />
        </div>
      </Show>
      <div class="nw-character-animations">
        <For each={store.fragments()}>
          {(fragment) => (
            <>
              <button
                class="nw-character-group"
                classList={{ 'nw-character-group-open': store.isOpen(fragment.name) }}
                onClick={() => store.toggle(fragment.name)}
              >
                <Icon svg={svgChevron} />
                <span class="nw-character-group-name">{fragment.name}</span>
                <Show when={!fragment.playable}>
                  <UnplayableBadge />
                </Show>
                <span class="nw-muted">{fragment.variants.length}</span>
              </button>
              <Show when={store.isOpen(fragment.name)}>
                <For each={fragment.variants}>
                  {(it) => (
                    <div
                      class="nw-character-row"
                      classList={{ 'nw-character-row-active': store.isCurrent(fragment, it.variant) }}
                    >
                      <Show when={it.clips.length} fallback={<span class="nw-character-check-spacer" />}>
                        <BoolInput value={store.isSelected(it.clips)} onInput={(on) => store.select(it.clips, on)} />
                      </Show>
                      <button
                        class="nw-character-play"
                        title={variantClips(it.variant).join('\n') || 'no animations'}
                        onClick={() => void store.play(fragment, it.variant)}
                      >
                        <Show when={it.variant.tags.length} fallback={<span class="nw-muted">default</span>}>
                          <For each={it.variant.tags}>
                            {(tag) => (
                              <Badge outline class="nw-character-tag">
                                {tag}
                              </Badge>
                            )}
                          </For>
                        </Show>
                        <Show when={it.variant.options.length > 1}>
                          <span class="nw-muted"> ×{it.variant.options.length}</span>
                        </Show>
                        <Show when={!it.playable}>
                          <UnplayableBadge />
                        </Show>
                      </button>
                      <span
                        class="nw-muted nw-character-clips"
                        title={`The check box adds these ${it.clips.length} animations to the export`}
                      >
                        {clipCount(it.clips.length)}
                      </span>
                    </div>
                  )}
                </For>
              </Show>
            </>
          )}
        </For>
      </div>
    </>
  )
}

/**
 * Marks a fragment or variant whose animations the character's set does not have (all of them, or some)
 */
function UnplayableBadge() {
  return (
    <span title="The character's animation set lacks animations of it: it plays nothing or only in part">
      <Badge color="warning" soft class="nw-character-tag">
        unplayable
      </Badge>
    </span>
  )
}
