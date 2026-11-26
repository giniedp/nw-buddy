import { For, Show } from 'solid-js'
import { Icon, TextInput } from 'tweak-ui'
import type { SheetFamily } from '../../../api/browse'
import { dataHref } from '../../app/urls'
import { Link } from '../../common/Link'
import svgSearch from '../../icons/magnifying-glass.svg?raw'
import { createFamilyListStore } from './FamilyList.store'
import './FamilyList.css'

/**
 * The row types with a filter over row type and sheet names. A click opens the temporary tab, a double click keeps it.
 */
export function FamilyList(props: { families: SheetFamily[] }) {
  const store = createFamilyListStore(props)
  const { state } = store

  return (
    <>
      <div class="nw-search">
        <TextInput
          placeholder="Filter row types and sheets"
          slotBefore={<Icon svg={svgSearch} />}
          onInput={store.setQuery}
        />
      </div>
      <div class="nw-browser-list nw-family-list">
        <For each={store.entries()}>
          {(it) => (
            <Link
              href={dataHref(it.family.name)}
              class="nw-family"
              activeClass="nw-family-active"
              end
              title={it.family.sheets.map((sheet) => sheet.name).join('\n')}
              onDblClick={() => store.persist(it.family.name)}
            >
              <span class="nw-family-name">{it.family.name}</span>
              <span class="nw-family-count">
                {it.family.sheets.length > 1 ? `${it.family.sheets.length} sheets` : ''}
              </span>
              <Show when={it.sheets.length}>
                <span class="nw-family-sheets">{it.sheets.join(', ')}</span>
              </Show>
            </Link>
          )}
        </For>
      </div>
      <div class="nw-search-summary nw-muted nw-family-summary">{state.count}</div>
    </>
  )
}
