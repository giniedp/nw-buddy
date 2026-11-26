import { For, Match, Show, Suspense, Switch } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { ExportButton } from '../../../common/export/ExportButton'
import { ModeBar } from '../../../common/ModeBar'
import type { Tab } from '../../tabs'
import { createTabViewStore } from './TabView.store'

/**
 * The content of a tab: the display modes that apply to its file, the chosen one shown. A mode mounts
 * when it is first shown and stays mounted, it keeps its state (scroll position, editor) while another
 * mode is shown.
 */
export function TabView(props: { tab: Tab }) {
  const store = createTabViewStore(props)
  const { state } = store
  // a new element per use: one element can only be in one place
  const reading = () => (
    <div class="nw-empty">
      <p class="nw-note">Reading…</p>
    </div>
  )

  return (
    <Switch fallback={reading()}>
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">The file could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={store.context()}>
        {(context) => (
          <>
            {/* the modes only when there is a choice, the export for every file */}
            <ModeBar
              modes={store.modes()}
              active={state.mode}
              onSelect={store.selectMode}
              tools={<ExportButton ghost path={props.tab.path} />}
            />
            <For each={store.views()}>
              {(view) => (
                <Show when={store.isMounted(view)}>
                  <div class="nw-view" classList={{ 'nw-hidden': view.id !== state.mode }}>
                    {/* views may be lazy, e.g. the ones with ag-grid */}
                    <Suspense fallback={reading()}>
                      <Dynamic component={view.component} ctx={context()} shown={store.isShown(view)} />
                    </Suspense>
                  </div>
                </Show>
              )}
            </For>
          </>
        )}
      </Match>
    </Switch>
  )
}
