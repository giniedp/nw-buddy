import { createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { Navigator } from '@solidjs/router'
import { NwbtClient } from '../../api/browse'
import { AudioNames } from '../../audio/preview/names'
import { LevelCatalogLoader } from '../../levels/load'
import { AssetTypes } from '../browser/assetTypes'
import { createBrowserTabs, type BrowserTabs } from '../browser/tabs'
import { FileContents } from '../../api/files'
import { AssetFinder } from '../data/assets'
import { createDataTabs, type DataTabs } from '../data/tabs'
import { TriggerAudio } from '../data/audio'
import { Datasheets } from '../data/families'
import { Localization } from '../data/loc'
import { RowPreviews } from '../data/preview'
import { ViewerContent } from '../viewer/content'
import { EngineHost } from './engine'
import type { ToolId } from './tools'

export interface ViewerAppOptions {
  /**
   * The nwbt server: empty for the same origin (a proxy), otherwise its origin, e.g. `https://localhost:8443`
   */
  nwbtUrl: string
  /**
   * The path the app is mounted at, e.g. `/pak`. Empty (the default) for the root of the origin.
   */
  base?: string
  /**
   * Called after the app changed the page url: its router's navigations and the parameters it writes without the router
   * (the viewer's camera and content). The host's own router does not see these changes, e.g. nw-buddy's address bar.
   *
   * @param url - path, query and hash of the page
   */
  onUrlChange?: (url: string) => void
}

/**
 * The state of one mounted app: the nwbt client, the engine and what is loaded from the server. Everything ends with
 * {@link dispose}, a new mount starts empty.
 */
export class ViewerApp {
  /**
   * The path the app is mounted at, without a trailing slash (empty at the root)
   */
  public readonly base: string
  public readonly nwbt: NwbtClient
  public readonly engine: EngineHost
  public readonly files: FileContents
  public readonly assetTypes: AssetTypes
  public readonly tabs: BrowserTabs
  /**
   * The open row types of the Data tool
   */
  public readonly dataTabs: DataTabs
  public readonly levels: LevelCatalogLoader
  public readonly viewerContent: ViewerContent
  public readonly audioNames: AudioNames
  public readonly datasheets: Datasheets
  public readonly assets: AssetFinder
  public readonly loc: Localization
  public readonly triggerAudio: TriggerAudio
  public readonly rowPreviews: RowPreviews
  /**
   * The location of each tool when it was left (path and query, relative to {@link base}), so switching back returns
   * to the same state (e.g. the level and camera position of the viewer). A store: the tool switch links follow it.
   */
  public readonly toolLocations: Partial<Record<ToolId, string>>
  public readonly setToolLocation: (tool: ToolId, location: string) => void
  /**
   * The router's navigate while the router is mounted, see {@link navigate}
   */
  private routerNavigate: Navigator | null = null
  private onUrlChange: ((url: string) => void) | null

  public constructor(options: ViewerAppOptions) {
    this.base = (options.base ?? '').replace(/\/+$/, '')
    this.onUrlChange = options.onUrlChange ?? null
    this.nwbt = new NwbtClient(options.nwbtUrl)
    this.engine = new EngineHost(options.nwbtUrl)
    this.files = new FileContents(this.nwbt)
    this.assetTypes = new AssetTypes(this.nwbt)
    this.tabs = createBrowserTabs(this.nwbt, this.files)
    this.dataTabs = createDataTabs()
    this.levels = new LevelCatalogLoader(this.nwbt)
    this.viewerContent = new ViewerContent(this.levels, this.base, () => this.urlChanged())
    this.audioNames = new AudioNames(this.nwbt)
    this.datasheets = new Datasheets(this.nwbt, this.files)
    this.assets = new AssetFinder(this.nwbt)
    this.loc = new Localization(this.nwbt, this.files)
    this.triggerAudio = new TriggerAudio(this.nwbt, this.files)
    this.rowPreviews = new RowPreviews(this.nwbt, this.datasheets, this.assets)
    const [toolLocations, setToolLocations] = createStore<Partial<Record<ToolId, string>>>({})
    this.toolLocations = toolLocations
    this.setToolLocation = (tool, location) => setToolLocations(tool, location)
  }

  /**
   * Destroys the engine and its GPU device
   */
  public dispose() {
    this.engine.dispose()
  }

  /**
   * Tells the host that the page url changed, see {@link ViewerAppOptions.onUrlChange}. Called after the router
   * navigated and after the url was replaced without the router.
   *
   * @param url - the new url (path with the base, query, hash), default: the page's. The router writes the history only
   *   after the route rendered, so it passes its own location.
   */
  public urlChanged(url = `${location.pathname}${location.search}${location.hash}`) {
    this.onUrlChange?.(url)
  }

  /**
   * Connects {@link navigate} to the router, called by the root of the router. Returns the disconnect.
   */
  public connectRouter(navigate: Navigator) {
    this.routerNavigate = navigate
    return () => {
      if (this.routerNavigate === navigate) {
        this.routerNavigate = null
      }
    }
  }

  /**
   * Shows a location of the page that the host navigated to without the router (nw-buddy's Angular router pushes its
   * own history entries, the router only follows its own and back/forward). Locations outside {@link base} are
   * ignored.
   *
   * @param location - path and query of the page, with the base (`/pak/data`)
   */
  public navigate(location: string, options?: { replace?: boolean }) {
    const target = routerLocation(this.base, location)
    if (!this.routerNavigate || target == null) {
      return
    }
    this.routerNavigate(target, { replace: options?.replace })
  }
}

/**
 * A location of the page relative to the base of the app, for the router; null when it is outside the base
 *
 * @param location - path and query of the page, with the base (`/pak/data`)
 */
export function routerLocation(base: string, location: string): string | null {
  const lowerBase = base.toLowerCase()
  const lower = location.toLowerCase()
  if (lowerBase && lower !== lowerBase && !lower.startsWith(`${lowerBase}/`) && !lower.startsWith(`${lowerBase}?`)) {
    return null
  }
  return location.slice(base.length) || '/'
}

export const ViewerAppContext = createContext<ViewerApp>()

/**
 * The app the component is part of
 */
export function useApp(): ViewerApp {
  const app = useContext(ViewerAppContext)
  if (!app) {
    throw new Error('useApp: no ViewerAppContext')
  }
  return app
}
