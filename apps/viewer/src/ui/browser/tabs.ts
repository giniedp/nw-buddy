import { createSignal } from 'solid-js'
import type { NwbtClient } from '../../api/browse'
import type { HexRange } from '../common/hex/types'
import { createTabList, type TabBase } from '../common/tabs/tabList'
import type { FileContents } from '../../api/files'

/**
 * A file opened in the browser
 */
export interface Tab extends TabBase {
  path: string
  /**
   * Type id (index into the asset types), -1 until known
   */
  type: number
  /**
   * The display mode the user picked, see views/registry.ts. The first mode that applies if unset.
   */
  mode?: string
}

export interface OpenOptions {
  /**
   * Opens the file in the temporary tab, which replaces the previous temporary tab. An open tab of the file is
   * activated as it is.
   */
  preview?: boolean
}

/**
 * The open files of the browser (a {@link createTabList} by path). App state: the tabs stay while another tool is
 * shown. They are restored from the local storage when the app starts.
 */
export type BrowserTabs = ReturnType<typeof createBrowserTabs>

export function createBrowserTabs(nwbt: NwbtClient, files: FileContents) {
  const list = createTabList<Tab>({
    key: (tab) => tab.path,
    storageKey: 'nw-viewer.browser.tabs',
    onRemoved: (tab) => files.releaseContent(tab.path),
  })
  const [marks, setMarks] = createSignal<ReadonlyMap<string, HexRange>>(new Map())

  const tabsApi = {
    ...list,

    /**
     * Opens a file, or activates its tab if it is open. A split mip part (`.dds.N`, `.dds.Na`) opens its texture.
     * Without a type, the type is looked up.
     */
    open(file: { path: string; type?: number }, options?: OpenOptions) {
      const base = splitPartBase(file.path)
      const path = base ?? file.path
      const { tab, created } = list.open({ path, type: base ? -1 : (file.type ?? -1) }, options)
      if (created && tab.type < 0) {
        nwbt.statFile(path).then(
          (stat) => list.update(tab.id, { type: stat.type }),
          () => {
            // unknown file: the tab shows the error when its content loads
          },
        )
      }
    },

    /**
     * Remembers the display mode of a tab
     */
    setMode(id: number, mode: string) {
      list.update(id, { mode })
    },

    /**
     * Activates the tab of a path, or opens it. For a url that names a file.
     */
    openPath(path: string) {
      tabsApi.open({ path })
    },

    /**
     * The range marked in the Hex mode of a file, see {@link showBytes}
     */
    hexMark(path: string): HexRange | undefined {
      return marks().get(path)
    },

    /**
     * Shows a byte range of a file in its Hex mode: opens the file's tab (or activates it), switches it to Hex and
     * marks the range. E.g. the "bytes" links of the Inspect mode, also for the `.cgfheap` of a model.
     */
    showBytes(path: string, range: HexRange) {
      setMarks((current) => new Map(current).set(path, { ...range }))
      tabsApi.open({ path })
      const tab = list.find(path)
      if (tab) {
        tabsApi.setMode(tab.id, 'hex')
      }
    },
  }

  return tabsApi
}

/**
 * The texture of a split mip part: `x.dds.3` and `x.dds.3a` belong to `x.dds`. `x.dds.a` is a full alpha texture.
 */
function splitPartBase(path: string): string | null {
  const match = /^(.*\.dds)\.\d+a?$/.exec(path)
  return match ? match[1] : null
}
