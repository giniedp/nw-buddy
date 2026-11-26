import { For, onCleanup, Show } from 'solid-js'
import { Icon, Split, TextInput } from 'tweak-ui'
import { AppBar } from '../app/bar/AppBar'
import { TabStrip } from '../common/tabs/TabStrip'
import svgSearch from '../icons/magnifying-glass.svg?raw'
import { createBrowserToolStore } from './BrowserTool.store'
import { TypeFilter } from './filter/TypeFilter'
import { SearchResults } from './search/SearchResults'
import { FolderInfo, SelectionInfo } from './SelectionInfo'
import { AssetTree } from './tree/AssetTree'
import { TabView } from './views/tab/TabView'
import './BrowserTool.css'

/**
 * The asset browser tool: the archive on the left, the open files in tabs on the right.
 * The active file is in the url (`?file=`), the open tabs are kept while other tools are shown.
 * It must not import the engine statically (see ui/app/engine.ts), engine views load it on demand.
 */
export default function BrowserTool() {
  const store = createBrowserToolStore()
  const { state, tabs } = store

  // Alt+W closes the active tab. Ctrl+W is the browser's own and can not be taken by a page.
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyW' && store.closeActive()) {
      e.preventDefault()
    }
  }
  window.addEventListener('keydown', onKey)
  onCleanup(() => window.removeEventListener('keydown', onKey))

  return (
    <div class="tweak-ui nw-tool nw-tool-page nw-browser">
      <AppBar />
      {/* the sidebar needs about a path's width, the tabs get the rest */}
      <Split row class="nw-browser-split" fluid={1} minSize={200} defaultSizes={['clamp(18rem, 24%, 30rem)']}>
        <aside class="nw-browser-sidebar">
          <div class="nw-search">
            <TextInput
              placeholder="Search path or asset id"
              defaultValue={store.storedQuery}
              slotBefore={<Icon svg={svgSearch} />}
              onInput={store.typeQuery}
              onChange={store.submitQuery}
            />
            <TypeFilter types={store.types()} selected={store.filter()} onChange={store.setFilter} />
          </div>
          {/* the tree stays mounted while searching, it keeps its open folders */}
          <div class="nw-browser-list" classList={{ 'nw-hidden': !!state.query }}>
            <AssetTree
              types={store.filterTypes()}
              selected={state.selectedPath}
              onSelect={store.select}
              onSelectFolder={store.selectFolder}
              onOpen={store.open}
            />
          </div>
          <Show when={state.query}>
            <div class="nw-browser-list">
              <SearchResults
                query={state.query}
                types={store.filterTypes()}
                selected={store.file()?.path ?? null}
                onSelect={store.select}
                onOpen={store.open}
              />
            </div>
          </Show>
          <Show when={store.file()}>{(file) => <SelectionInfo file={file()} />}</Show>
          <Show when={state.folder}>{(folder) => <FolderInfo path={folder()} />}</Show>
        </aside>
        <main class="nw-browser-main">
          <Show
            when={tabs.tabs().length}
            fallback={
              <div class="nw-empty">
                <p class="nw-note">Click a file to open it, double click to keep its tab.</p>
              </div>
            }
          >
            <TabStrip
              items={store.tabItems()}
              active={tabs.active()}
              onActivate={tabs.activate}
              onClose={tabs.close}
              onPersist={tabs.persist}
              menu={store.tabMenu}
            />
            {/* every tab stays mounted, inactive ones are hidden: views keep their state */}
            <div class="nw-tab-panes">
              <For each={tabs.tabs()}>
                {(tab) => (
                  <div class="nw-tab-pane" classList={{ 'nw-hidden': tab.id !== tabs.active() }}>
                    <TabView tab={tab} />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </main>
      </Split>
    </div>
  )
}
