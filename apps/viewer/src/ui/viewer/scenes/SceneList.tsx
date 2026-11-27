import { For, Show } from 'solid-js'
import { Icon, Tabs, TextInput } from 'tweak-ui'
import { DUNGEON_LEVELS } from '../../../game/catacombs/dungeon'
import type { LevelEntry } from '../../../levels/catalog'
import svgSearch from '../../icons/magnifying-glass.svg?raw'
import svgSpinner from '../../icons/spinner-third.svg?raw'
import { createSceneListStore } from './SceneList.store'
import { SceneRow } from './SceneRow'
import './SceneList.css'

/**
 * Levels with a generated dungeon (the catacombs): their rows open a new random dungeon too
 */
function isDungeonLevel(entry: LevelEntry) {
  return !!DUNGEON_LEVELS[entry.coatlicue]
}

/**
 * The levels and game modes of the level catalog in tabs, filtered by text. It opens on the tab of the shown scene.
 */
export function SceneList(props: {
  onSelect: (entry: LevelEntry) => void
  /**
   * Opens a dungeon level (the catacombs) with a new random dungeon
   */
  onSelectNewSeed: (entry: LevelEntry) => void
}) {
  const store = createSceneListStore()
  return (
    <div class="nw-dialog-content nw-dialog-content-wide nw-scenes">
      <TextInput
        class="nw-scenes-filter"
        placeholder="Filter levels and game modes"
        slotBefore={<Icon svg={svgSearch} />}
        onInput={store.setFilter}
      />
      <Show
        when={!store.state.loading}
        fallback={
          <div class="nw-scenes-loading" role="status">
            <Icon svg={svgSpinner} />
            Reading the levels…
          </div>
        }
      >
        <Show when={!store.state.failed} fallback={<p class="nw-note">The levels could not be loaded.</p>}>
          <Tabs
            class="nw-scenes-tabs"
            defaultActive={store.state.initialTab}
            tabs={store.state.groups.map((group) => ({
              title: `${group.label} (${group.entries.length})`,
              content: () => (
                <div class="nw-scene-rows">
                  <For each={group.entries}>
                    {(entry) => (
                      <SceneRow
                        entry={entry}
                        thumbnail={store.thumbnail(entry)}
                        current={entry.id === store.state.currentId}
                        onClick={() => props.onSelect(entry)}
                        onNewSeed={isDungeonLevel(entry) ? () => props.onSelectNewSeed(entry) : undefined}
                      />
                    )}
                  </For>
                </div>
              ),
            }))}
          />
        </Show>
      </Show>
    </div>
  )
}
