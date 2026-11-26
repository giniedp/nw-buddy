import { useLocation, useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, on, onMount, untrack } from 'solid-js'
import type { SheetFamily } from '../../api/browse'
import { useApp } from '../app/ViewerApp'
import { segmentValue } from '../app/urls'
import type { TabMenuItem, TabStripItem } from '../common/tabs/types'
import svgTableList from '../icons/table-list.svg?raw'
import type { DataSchema } from './families'
import { dataTabHref, familyKey, type DataTab, type DataTabs } from './tabs'

export type DataToolStore = ReturnType<typeof createDataToolStore>

/**
 * The state and actions of the Data tool: the schema of the datasheets, the languages of the texts, the open row types
 * in tabs, and the active tab with its row in the url (`/data/<family>?key=…`)
 */
export function createDataToolStore() {
  const app = useApp()
  const tabs = app.dataTabs
  const [schema] = createResource(() => app.datasheets.loadSchema())
  const [languages] = createResource(() => app.loc.languages())
  onMount(() => app.loc.ensure())
  syncActiveTabWithUrl()

  return {
    tabs,
    loc: app.loc,
    /**
     * The row types and their sheets. Not part of a state: the datasheets service owns it.
     */
    schema: () => (schema.error ? undefined : schema()),
    schemaError: () => (schema.error ? String(schema.error) : null),
    languages: () => (languages.error ? [] : (languages() ?? [])),
    tabItems: createMemo(() => tabItems(tabs.tabs(), schema.error ? undefined : schema())),
    setLanguage(language: string) {
      app.loc.setLanguage(language)
    },
    /**
     * A row selected in the grid of a tab: the tab keeps it, the url of the active tab shows it (no history entry)
     */
    selectRow(tab: DataTab, key: string | null, row: number) {
      if (key) {
        tabs.update(tab.id, { key, row: undefined })
      } else {
        tabs.update(tab.id, { key: undefined, row })
      }
    },
    isActive(tab: DataTab) {
      return tab.id === tabs.active()
    },
    /**
     * The menu of a row type tab: the close actions and the name to the clipboard
     */
    tabMenu(id: number): TabMenuItem[] {
      return tabMenu(tabs, id)
    },
  }
}

/**
 * The url and the active tab follow each other: a url with a family (a link, back and forward) opens or activates its
 * tab and selects the row of the url; activating a tab or selecting a row replaces the url.
 *
 * @remarks
 * A link with the state `{ keep: true }` (a reference in a row) opens a kept tab, other links (the row type list) the
 * temporary tab. The url effect is created first, so a family of the url wins over the restored active tab.
 */
function syncActiveTabWithUrl() {
  const app = useApp()
  const tabs = app.dataTabs
  const route = useParams<{ family?: string }>()
  const [params] = useSearchParams<{ key?: string; row?: string }>()
  const location = useLocation<{ keep?: boolean }>()
  const navigate = useNavigate()
  createEffect(
    on([() => route.family, () => params.key, () => params.row], ([family, key, row]) => {
      if (!family) {
        return
      }
      const selection = urlSelection(key, row)
      const keep = !!untrack(() => location.state)?.keep
      const { tab, created } = tabs.open({ family: segmentValue(family), ...selection }, { preview: !keep })
      // a url without a row (the row type list) keeps the row the open tab has
      const named = selection.key != null || selection.row != null
      if (!created && named && (tab.key !== selection.key || tab.row !== selection.row)) {
        tabs.update(tab.id, selection)
      }
    }),
  )
  createEffect(() => {
    const tab = tabs.activeTab()
    const href = tab ? dataTabHref(tab) : '/data'
    const current = untrack(() => location.pathname.slice(app.base.length) + location.search)
    if (decodeURIComponent(href) !== decodeURIComponent(current)) {
      navigate(href, { replace: true })
    }
  })
}

/**
 * The row of a url: by its key, else by its index
 */
export function urlSelection(key: string | undefined, row: string | undefined): Pick<DataTab, 'key' | 'row'> {
  if (key) {
    return { key, row: undefined }
  }
  return { key: undefined, row: row != null ? Number(row) : undefined }
}

export function tabItems(tabs: DataTab[], schema: DataSchema | undefined): TabStripItem[] {
  return tabs.map((tab) => ({
    id: tab.id,
    title: tab.family,
    tooltip: familyTooltip(schema?.byName.get(familyKey(tab.family)), tab.family),
    icon: svgTableList,
    preview: tab.preview,
  }))
}

/**
 * The name of a row type and its sheets, one per line
 */
export function familyTooltip(family: SheetFamily | undefined, name: string) {
  if (!family) {
    return name
  }
  return [family.name, ...family.sheets.map((sheet) => sheet.name)].join('\n')
}

function tabMenu(tabs: DataTabs, id: number): TabMenuItem[] {
  const list = tabs.tabs()
  const index = list.findIndex((tab) => tab.id === id)
  const family = list[index]?.family ?? ''
  return [
    { label: 'Close', onSelect: () => tabs.close(id) },
    { label: 'Close others', disabled: list.length < 2, onSelect: () => tabs.closeOthers(id) },
    { label: 'Close to the right', disabled: index === list.length - 1, onSelect: () => tabs.closeToRight(id) },
    { label: 'Close all', onSelect: () => tabs.closeAll() },
    { label: 'Copy name', onSelect: () => void navigator.clipboard.writeText(family) },
  ]
}
