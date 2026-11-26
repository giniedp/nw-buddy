import { createMemo, createResource } from 'solid-js'
import { useApp } from '../../app/ViewerApp'
import type { DataSchema } from '../families'
import { familyKey, type DataTab } from '../tabs'

export interface FamilyPaneProps {
  tab: DataTab
  schema: DataSchema | undefined
  /**
   * The active tab: a hidden pane's 3D preview releases the engine canvas
   */
  shown: boolean
  onSelect: (key: string | null, row: number) => void
}

export type FamilyPaneStore = ReturnType<typeof createFamilyPaneStore>

/**
 * The row type of a tab and its rows, loaded once the schema names it
 */
export function createFamilyPaneStore(props: FamilyPaneProps) {
  const app = useApp()
  const family = createMemo(() => props.schema?.byName.get(familyKey(props.tab.family)))
  const [loaded] = createResource(family, (it) => app.datasheets.loadFamily(it))

  return {
    /**
     * The schema is read and has no row type of the tab's name
     */
    unknown: () => !!props.schema && !family(),
    loadError: () => (loaded.error ? String(loaded.error) : null),
    /**
     * The rows of the family. Not part of a state: the datasheets service owns them.
     */
    rows: () => (loaded.error ? undefined : loaded()),
    /**
     * The number of sheets that load, empty while the schema loads
     */
    sheetCount: () => family()?.sheets.length ?? '',
  }
}
