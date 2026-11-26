import { Navigate, useParams, useSearchParams } from '@solidjs/router'
import { For, Match, Show, Switch } from 'solid-js'
import { SelectInput, Split } from 'tweak-ui'
import { AppBar } from '../app/bar/AppBar'
import { dataHref } from '../app/urls'
import { TabStrip } from '../common/tabs/TabStrip'
import { createDataToolStore } from './DataTool.store'
import { FamilyPane } from './family/FamilyPane'
import { FamilyList } from './list/FamilyList'

/**
 * The Data tool: the datasheets by family (the row type of the sheet header), not by file. Rows link to the rows they
 * reference, loc keys show their text, audio triggers play, appearances render.
 * The selection is in the url (`/data/<family>?key=…`), so links are history entries: back and forward follow them.
 */
export default function DataRoute() {
  const route = useParams<{ family?: string }>()
  const [params] = useSearchParams<{ family?: string; key?: string; row?: string }>()
  return (
    <Show when={legacyHref(route.family, params)} fallback={<DataTool />}>
      {(href) => <Navigate href={href()} />}
    </Show>
  )
}

/**
 * Links from before the family moved into the path (`/data?family=…`), null for current links
 */
export function legacyHref(family: string | undefined, params: { family?: string; key?: string; row?: string }) {
  if (family || !params.family) {
    return null
  }
  if (params.key) {
    return dataHref(params.family, params.key)
  }
  if (params.row != null) {
    return `${dataHref(params.family)}?row=${params.row}`
  }
  return dataHref(params.family)
}

function DataTool() {
  const store = createDataToolStore()
  const { tabs } = store

  return (
    <div class="tweak-ui nw-tool nw-tool-page nw-browser nw-data">
      <AppBar
        end={
          <Show when={store.languages().length}>
            <span title="Language of the localized texts">
              <SelectInput
                value={store.loc.language() ?? ''}
                options={store.languages()}
                onChange={(value) => store.setLanguage(String(value))}
              />
            </span>
          </Show>
        }
      />
      <Split row class="nw-browser-split" fluid={1} minSize={200} defaultSizes={['clamp(16rem, 18%, 24rem)']}>
        <aside class="nw-browser-sidebar">
          <Switch fallback={<p class="nw-note">Reading the datasheets…</p>}>
            <Match when={store.schemaError()}>
              <p class="nw-note">The datasheets could not be read: {store.schemaError()}</p>
            </Match>
            <Match when={store.schema()}>{(it) => <FamilyList families={it().families} />}</Match>
          </Switch>
        </aside>
        <main class="nw-browser-main">
          <Show
            when={tabs.tabs().length}
            fallback={
              <div class="nw-empty">
                <p class="nw-note">Select a row type on the left. Links in a row open the rows they name.</p>
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
            {/* every tab keeps its grid mounted, the inactive ones are hidden */}
            <div class="nw-tab-panes">
              <For each={tabs.tabs()}>
                {(tab) => (
                  <div class="nw-tab-pane" classList={{ 'nw-hidden': !store.isActive(tab) }}>
                    <FamilyPane
                      tab={tab}
                      schema={store.schema()}
                      shown={store.isActive(tab)}
                      onSelect={(key, row) => store.selectRow(tab, key, row)}
                    />
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
