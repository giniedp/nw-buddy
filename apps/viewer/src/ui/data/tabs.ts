import { createTabList, type TabBase } from '../common/tabs/tabList'
import { dataHref } from '../app/urls'

/**
 * A row type (family) opened in the Data tool, with its selected row
 */
export interface DataTab extends TabBase {
  family: string
  /**
   * The selected row by its key
   */
  key?: string
  /**
   * The selected row by its index, for rows without a key
   */
  row?: number
}

/**
 * The open row types of the Data tool, one tab per family (see {@link createTabList})
 */
export type DataTabs = ReturnType<typeof createDataTabs>

export function createDataTabs() {
  return createTabList<DataTab>({
    key: (tab) => familyKey(tab.family),
    storageKey: 'nw-viewer.data.tabs',
  })
}

/**
 * The tab key of a family: names are matched without case, like the schema does
 */
export function familyKey(family: string) {
  return family.toLowerCase()
}

/**
 * The url of a tab: its family and selected row, relative to the router base
 */
export function dataTabHref(tab: Pick<DataTab, 'family' | 'key' | 'row'>) {
  if (tab.key) {
    return dataHref(tab.family, tab.key)
  }
  return tab.row != null ? `${dataHref(tab.family)}?row=${tab.row}` : dataHref(tab.family)
}
