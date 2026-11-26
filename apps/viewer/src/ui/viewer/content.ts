import { createSignal, type Accessor, type Setter } from 'solid-js'
import { entryParams, type LevelEntry } from '../../levels/catalog'
import type { LevelCatalogLoader } from '../../levels/load'
import { VIEWER_MODE_PARAMS } from '../../scenes'
import type { NwViewer } from '../../viewer'

/**
 * The parameters of the url that select the content, without the camera
 */
const CONTENT_PARAMS = ['level', 'mission', 'model', 'material']

/**
 * The opened content after a preview of the browser unloaded it: the next open loads the content again and places the
 * camera of the url
 */
const UNLOADED = 'unloaded'

/**
 * What the viewer tool shows, by the url of the page
 */
export class ViewerContent {
  /**
   * The content parameters of the url that were opened last. Showing the tool again with the same content keeps
   * the scene, other content (e.g. a scene of the dialog) opens that.
   */
  private readonly openedContent: Accessor<string | null>
  private readonly setOpenedContent: Setter<string | null>
  private readonly sceneEntry: Accessor<{ id: string; content: string } | null>
  private readonly setSceneEntry: Setter<{ id: string; content: string } | null>
  private readonly levels: LevelCatalogLoader
  private readonly base: string

  /**
   * @param base - the path of the app, the viewer tool is at `<base>/viewer`
   */
  public constructor(levels: LevelCatalogLoader, base: string) {
    this.levels = levels
    this.base = base
    const [openedContent, setOpenedContent] = createSignal<string | null>(null)
    this.openedContent = openedContent
    this.setOpenedContent = setOpenedContent
    const [sceneEntry, setSceneEntry] = createSignal<{ id: string; content: string } | null>(null)
    this.sceneEntry = sceneEntry
    this.setSceneEntry = setSceneEntry
  }

  /**
   * The id of the catalog entry that is shown, null when the url shows something else (a model, a level from a link)
   */
  public currentSceneId(): string | null {
    const entry = this.sceneEntry()
    return entry && entry.content === this.openedContent() ? entry.id : null
  }

  /**
   * Shows a scene of the level catalog, see {@link showScene}
   */
  public showSceneEntry(viewer: NwViewer, entry: LevelEntry) {
    this.showScene(viewer, entryParams(entry))
    this.setSceneEntry({ id: entry.id, content: this.openedContent() })
  }

  /**
   * Opens what the url names, when it differs from what was opened last. A url without content opens the default scene
   * of the level catalog (the main menu of today, see levels/catalog.ts) and writes it into the url.
   */
  public openUrlContent(viewer: NwViewer) {
    const params = new URLSearchParams(location.search)
    if (viewer.previewing) {
      // a texture or model preview of the browser replaced the content: the engine shows one content at a time (D5),
      // also when the browser was shown first
      viewer.endPreview()
      this.setOpenedContent(UNLOADED)
    }
    if (!hasContent(params)) {
      // opens the default scene asynchronously, through showScene
      void this.openDefault(viewer)
      return
    }
    const content = contentKey(params)
    if (content === this.openedContent()) {
      return
    }
    // the camera of the url, not the one of the previous content (the first time, the engine places it at start)
    if (this.openedContent() != null) {
      viewer.teleportFromUrl()
    }
    this.setOpenedContent(content)
    openFromUrl(viewer, params)
  }

  /**
   * Shows a scene: replaces the content and camera parameters of the url (other parameters such as `clock` stay) and
   * opens it, without a page load
   */
  public showScene(viewer: NwViewer, params: Record<string, string>) {
    const url = new URL(location.href)
    for (const key of VIEWER_MODE_PARAMS) {
      url.searchParams.delete(key)
    }
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    history.replaceState(history.state, '', `${url.pathname}${url.search}`)
    if (!viewer.previewing && contentKey(url.searchParams) === this.openedContent()) {
      // scenes of the same level differ only by their camera
      placeUrlCamera(viewer, url.searchParams)
      return
    }
    this.openUrlContent(viewer)
  }

  private async openDefault(viewer: NwViewer) {
    const catalog = await this.levels.load().catch((err) => {
      console.error('level catalog not loaded:', String(err))
      return null
    })
    const entry = catalog?.defaultEntry
    // the user may have moved on while the catalog loaded
    const shown = location.pathname.startsWith(`${this.base}/viewer`)
    if (!entry || !shown || hasContent(new URLSearchParams(location.search))) {
      return
    }
    console.log('default scene:', entry.id)
    this.showSceneEntry(viewer, entry)
  }
}

/**
 * Moves the camera to the position of the url, or to the level's own camera placement when the url names none
 */
function placeUrlCamera(viewer: NwViewer, params: URLSearchParams) {
  if (params.has('x')) {
    viewer.teleportFromUrl()
  } else if (params.has('level')) {
    viewer.placeLevelCamera()
  }
}

function hasContent(params: URLSearchParams) {
  return CONTENT_PARAMS.some((key) => params.has(key))
}

function contentKey(params: URLSearchParams) {
  return CONTENT_PARAMS.map((key) => `${key}=${params.get(key) ?? ''}`).join('&')
}

function openFromUrl(viewer: NwViewer, params: URLSearchParams) {
  if (params.has('material')) {
    viewer.loadMaterial(params.get('material'))
  } else if (params.has('model')) {
    viewer.loadModel(params.get('model'))
  } else if (params.has('level')) {
    // `mission`: the level folder when it differs from the coatlicue (main menus). Without a position in the url,
    // the camera starts at the level's own camera placement, if it has one.
    viewer.loadLevel(params.get('level'), { mission: params.get('mission'), levelCamera: !params.has('x') })
  }
}
