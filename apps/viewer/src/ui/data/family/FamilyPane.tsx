import { Match, Switch } from 'solid-js'
import { createFamilyPaneStore, type FamilyPaneProps } from './FamilyPane.store'
import { FamilyView } from './FamilyView'

/**
 * The rows of the family of a tab, with its selected row
 */
export function FamilyPane(props: FamilyPaneProps) {
  const store = createFamilyPaneStore(props)
  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading {store.sheetCount()} sheets…</p>
        </div>
      }
    >
      <Match when={store.unknown()}>
        <div class="nw-empty">
          <p class="nw-note">There is no row type {props.tab.family}.</p>
        </div>
      </Match>
      <Match when={store.loadError()}>
        <div class="nw-empty">
          <p class="nw-note">The sheets could not be read: {store.loadError()}</p>
        </div>
      </Match>
      <Match when={store.rows()}>
        {(rows) => (
          <FamilyView
            rows={rows()}
            rowKey={props.tab.key ?? null}
            rowIndex={props.tab.row ?? null}
            shown={props.shown}
            onSelect={props.onSelect}
          />
        )}
      </Match>
    </Switch>
  )
}
