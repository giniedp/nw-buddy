import { CdkMenuModule } from '@angular/cdk/menu'
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import type {
  AppearanceDyes,
  FragmentAction,
  FragmentSummary,
  FragmentVariant,
  GltfMannequin,
  MaterialParams,
  ModelViewer,
  MountedTrackBar,
  TimelineBar,
  TrackBarLink,
  TrackBarSource,
} from '@nw-buddy/viewer'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgBurst,
  svgCamera,
  svgCircleExclamation,
  svgCubes,
  svgDownload,
  svgExpand,
  svgEye,
  svgFilms,
  svgMoon,
  svgPause,
  svgPersonRunningFast,
  svgPlay,
  svgSun,
  svgXmark,
} from '~/ui/icons/svg'
import { FullscreenService, ModalRef } from '~/ui/layout'
import { TranslateService } from '../../i18n'
import { DyePanelComponent } from '../model-viewer/dye-panel.component'
import type { ModelItemInfo, ModelSocketInfo } from '../model-viewer/model-viewer.service'
import { ModelViewerStore } from '../model-viewer/model-viewer.store'
import { viewerLibUrl } from '../nw-viewer'
import { ScreenshotService } from '../screenshot'
import { ViewerOutputComponent, ViewerOutputService } from '../viewer-output'
import { characterDisplay, itemDisplay } from './model-display'
import { ModelDownloadService } from './model-download.service'
import { ModelViewActionsComponent } from './model-view-actions.component'
import { modelUrls, rowText } from './utils'

type ViewerLib = typeof import('@nw-buddy/viewer')

/**
 * Session preference key of the hitboxes toggle
 */
const HITBOXES_PREFERENCE = 'model-view-hitboxes'

/**
 * Shows the 3D models of an item with `ModelViewer`, one viewer per component. Characters with an animation database
 * (vitals) play their idle; their fragments can be listed ({@link actions}) and the procedural layers of the playing
 * one shown ({@link tracks}).
 */
@Component({
  selector: 'nwb-model-view',
  templateUrl: './model-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NwModule,
    IconsModule,
    CdkMenuModule,
    RouterLink,
    DyePanelComponent,
    ModelViewActionsComponent,
    ViewerOutputComponent,
  ],
  providers: [ModelViewerStore],
  host: {
    class: 'layout-col bg-gradient-to-b from-base-300 to-black relative z-0 group',
  },
})
export class ModelViewComponent {
  public readonly models = input<ModelItemInfo[]>()
  /**
   * The fragment list of a character with an animation database (a toolbar button opens it)
   */
  public readonly actions = input(false)
  /**
   * The track bar of the playing fragment (procedural layers: damage, spells, homing, …)
   */
  public readonly tracks = input(false)
  /**
   * The link of a track bar's details, e.g. a damage row
   */
  public readonly trackLink = input<((bar: TimelineBar) => TrackBarLink | null) | null>(null)
  /**
   * The ids of the character's own damage rows and spells (lower case): the fragment list leaves out the fragments of
   * other creatures (shared animation databases). Null: unknown, all are listed.
   */
  public readonly ownIds = input<ReadonlySet<string> | null>(null)
  /**
   * A toolbar button opens the downloads of the shown model (see {@link ModelDownloadDialogComponent})
   */
  public readonly downloads = input(false)
  public readonly close = output()
  /**
   * The selected one of the models, null without models
   */
  public readonly modelSelected = output<ModelItemInfo | null>()

  protected store = inject(ModelViewerStore)
  private preferences = inject(PreferencesService)
  private modalRef = inject(ModalRef, { optional: true })
  private modelDownloads = inject(ModelDownloadService)
  private host = inject<ElementRef<HTMLElement>>(ElementRef)
  private zone = inject(NgZone)
  private screenshots = inject(ScreenshotService)
  private i18n = inject(TranslateService)
  private fullscreen = inject(FullscreenService)
  private router = inject(Router)
  private viewerOutput = inject(ViewerOutputService)
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas')
  private trackHost = viewChild<ElementRef<HTMLDivElement>>('track')
  private actionsPanel = viewChild('actionsPanel', { read: ElementRef<HTMLElement> })
  private actionsToggle = viewChild<ElementRef<HTMLElement>>('actionsToggle')

  /**
   * The fragments of the shown character, empty without an animation database
   */
  protected fragments = signal<ReadonlyArray<FragmentAction>>([])
  protected fragmentTags = signal<string[]>([])
  /**
   * Tags the user added in the fragment list, they choose other variants
   */
  protected customTags = signal<string[]>([])
  protected fragment = signal<FragmentVariant | null>(null)
  /**
   * Seconds of the variants played so far
   */
  protected durations = signal<ReadonlyMap<FragmentVariant, number>>(new Map())
  /**
   * The fragments for the model's and the added tags
   */
  protected summaries = computed((): FragmentSummary[] => {
    const lib = this.lib()
    const fragments = this.fragments()
    if (!lib || !fragments.length) {
      return []
    }
    return lib.summarizeFragments(fragments, [...this.fragmentTags(), ...this.customTags()], this.ownIds())
  })
  protected fragmentPlaying = signal(false)
  /**
   * A fragment plays: the play button and the track bar show
   */
  protected hasTimeline = signal(false)
  /**
   * The playing fragment has melee hit shapes: the hitboxes toggle shows
   */
  protected hasHitboxes = signal(false)
  /**
   * Draws the hit shapes, a session preference (off by default)
   */
  protected hitboxes = signal(!!this.preferences.session.get(HITBOXES_PREFERENCE))
  protected showActions = signal(false)
  /**
   * The debug outputs of the viewer, null in production builds
   */
  protected outputs = computed(() => (this.viewerOutput.isEnabled ? this.lib()?.VIEWER_OUTPUTS : null))
  protected showOutputs = signal(false)

  /**
   * Whether the browser runs the viewer, null until checked
   */
  protected isSupported = signal<boolean | null>(null)
  protected isLoading = signal(false)
  protected hasError = signal(false)
  protected isEmpty = computed(() => !this.store.model()?.url)
  protected showLoading = computed(() => {
    if (this.isEmpty()) {
      return false
    }
    return this.isSupported() === null || this.isLoading()
  })
  protected isLight = computed(() => this.store.mode() === 'light')
  protected isAnimating = signal(false)
  protected canClose = !!this.modalRef

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand
  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation
  protected iconSun = svgSun
  protected iconMoon = svgMoon
  protected iconMore = svgBars
  protected iconEmpty = svgCubes
  protected iconPlay = svgPlay
  protected iconPause = svgPause
  protected iconFilms = svgFilms
  protected iconHitboxes = svgBurst
  protected iconOutput = svgEye
  protected iconDownload = svgDownload
  protected iconActions = svgPersonRunningFast

  private lib = signal<ViewerLib | null>(null)
  private viewer: ModelViewer | null = null
  private destroyed = false
  private trackBar: MountedTrackBar | null = null
  private frame = 0
  /**
   * What the track bar shows, the same object every frame
   */
  private trackSource: TrackBarSource = {
    timeline: null,
    time: 0,
    seek: (time) => {
      const mannequin = this.viewer?.mannequin
      if (mannequin) {
        mannequin.playing = false
        mannequin.time = time
      }
    },
    replay: () => {
      const mannequin = this.viewer?.mannequin
      if (mannequin) {
        mannequin.time = 0
        mannequin.playing = true
      }
    },
  }

  /**
   * The material params of the appearance with the picked dyes, null without an appearance
   */
  private materialParams = computed(() => this.appearanceParams(this.store.dyeDebug()))

  /**
   * The appearance's colors, dyed where a dye is set; the dye panel's mask debug colors with `debug`
   */
  private appearanceParams(debug: boolean): MaterialParams | null {
    const lib = this.lib()
    const appearance = this.store.appearance()
    if (!lib || !appearance) {
      return null
    }
    const dyes: AppearanceDyes = debug
      ? DEBUG_DYES
      : {
          r: rowText(this.store.dyeR()),
          g: rowText(this.store.dyeG()),
          b: rowText(this.store.dyeB()),
          a: rowText(this.store.dyeA()),
        }
    if (!dyes.r && !dyes.g && !dyes.b && !dyes.a) {
      return lib.appearanceParams(rowText(appearance))
    }
    return lib.dyedAppearanceParams(rowText(appearance), dyes)
  }

  public constructor() {
    effect(() => {
      const models = this.models()
      untracked(() => this.store.setModels(models))
    })
    effect(() => {
      const model = this.store.model()
      const supported = this.isSupported()
      untracked(() => {
        this.store.setAppearance(model?.appearance ?? null)
        if (supported) {
          this.showModel(model)
        }
      })
    })
    effect(() => {
      const model = this.store.model() ?? null
      untracked(() => this.modelSelected.emit(model))
    })
    effect(() => {
      const params = this.materialParams()
      untracked(() => this.viewer?.setMaterialParams(params))
    })
    effect(() => {
      const hitboxes = this.hitboxes()
      untracked(() => {
        if (this.viewer) {
          this.viewer.hitboxes = hitboxes
        }
      })
    })
    effect(() => {
      const light = this.isLight()
      untracked(() => {
        if (this.viewer) {
          this.viewer.sky = light
        }
      })
    })
    effect(() => {
      const output = this.viewerOutput.output()
      untracked(() => {
        if (this.viewer) {
          this.viewer.output = output
        }
      })
    })
    // the track bar mounts once the lib is there, it follows the playing fragment every frame
    effect(() => {
      const lib = this.lib()
      const host = this.trackHost()?.nativeElement
      if (!lib || !host || !this.tracks() || this.trackBar) {
        return
      }
      untracked(() => {
        this.trackBar = this.zone.runOutsideAngular(() => {
          return lib.mountTrackBar(host, { link: (bar) => this.trackLink()?.(bar) ?? null })
        })
        this.zone.runOutsideAngular(() => this.updateTrack())
      })
    })
    afterNextRender(() => {
      this.loadLib().catch((err) => {
        console.error('model viewer not loaded', err)
        this.isSupported.set(false)
      })
    })
    // capture phase: the viewer's pointer controls stop the events on the canvas
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true)
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('pointerdown', this.onDocumentPointerDown, true)
      this.destroyed = true
      cancelAnimationFrame(this.frame)
      this.trackBar?.dispose()
      this.trackBar = null
      this.viewer?.dispose()
      this.viewer = null
    })
  }

  protected playFragment(variant: FragmentVariant) {
    const mannequin = this.viewer?.mannequin
    if (!mannequin) {
      return
    }
    this.zone
      .runOutsideAngular(() => mannequin.play(variant))
      .then(
        () => this.setPlayed(mannequin, variant),
        () => {
          // replaced by the next click
        },
      )
  }

  /**
   * A press outside the open animation list closes it (its toggle button toggles it itself)
   */
  private onDocumentPointerDown = (event: PointerEvent) => {
    if (!this.showActions()) {
      return
    }
    const target = event.target as Node | null
    const panel = this.actionsPanel()?.nativeElement
    const toggle = this.actionsToggle()?.nativeElement
    if (!target || panel?.contains(target) || toggle?.contains(target)) {
      return
    }
    this.zone.run(() => this.showActions.set(false))
  }

  protected addTag(tag: string) {
    this.customTags.update((tags) => (tags.includes(tag) ? tags : [...tags, tag]))
  }

  protected removeTag(tag: string) {
    this.customTags.update((tags) => tags.filter((it) => it !== tag))
  }

  /**
   * A variant plays: it is the current one, its duration is known
   */
  private setPlayed(mannequin: GltfMannequin, variant: FragmentVariant | null) {
    this.fragment.set(variant)
    const seconds = variant ? mannequin.durationOf(variant) : null
    if (variant && seconds != null && this.durations().get(variant) !== seconds) {
      this.durations.update((map) => new Map(map).set(variant, seconds))
    }
  }

  protected toggleHitboxes() {
    const value = !this.hitboxes()
    this.hitboxes.set(value)
    this.preferences.session.set(HITBOXES_PREFERENCE, value)
  }

  protected toggleFragment() {
    const mannequin = this.viewer?.mannequin
    if (mannequin) {
      mannequin.playing = !mannequin.playing
      this.fragmentPlaying.set(mannequin.playing)
    }
  }

  /**
   * Internal links of the track bar's details navigate in the app
   */
  protected onTrackClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement)?.closest?.('a')
    const href = anchor?.getAttribute('href')
    if (!href?.startsWith('/') || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }
    event.preventDefault()
    this.modalRef?.close()
    this.router.navigateByUrl(href)
  }

  /**
   * Hands the playing fragment and its time to the track bar, per animation frame (outside the change detection)
   */
  private updateTrack() {
    const mannequin = this.viewer?.mannequin ?? null
    const timeline = mannequin?.timeline ?? null
    if (timeline) {
      this.trackSource.timeline = timeline
      this.trackSource.time = mannequin.time
      this.trackBar?.update(this.trackSource)
    } else {
      this.trackBar?.update(null)
    }
    const playing = !!mannequin?.playing
    // a fragment without procedural layers still gets play / pause and the track to scrub
    const hasTimeline = !!timeline
    const hasHitboxes = !!this.viewer?.hasHitboxes
    if (
      playing !== this.fragmentPlaying() ||
      hasTimeline !== this.hasTimeline() ||
      hasHitboxes !== this.hasHitboxes()
    ) {
      this.zone.run(() => {
        this.fragmentPlaying.set(playing)
        this.hasTimeline.set(hasTimeline)
        this.hasHitboxes.set(hasHitboxes)
      })
    }
    if (!this.destroyed) {
      this.frame = requestAnimationFrame(() => this.updateTrack())
    }
  }

  protected show(index: number) {
    this.store.setIndex(index)
  }

  protected toggleMode() {
    this.store.toggleMode()
  }

  protected selectAnimation(name: string) {
    this.store.setAnimation(name)
    this.playAnimation(this.store.animation())
  }

  protected toggleAnimation() {
    const viewer = this.viewer
    if (!viewer) {
      return
    }
    viewer.animationPlaying = !viewer.animationPlaying
    this.isAnimating.set(viewer.animationPlaying)
  }

  protected toggleFullscreen() {
    this.fullscreen.toggle(this.host.nativeElement)
  }

  protected closeDialog() {
    this.modalRef?.close()
    this.close.emit()
  }

  /**
   * Opens the downloads of the shown model: as the view shows it (colors, the playing animation) for the nwbt export,
   * the files it loads for the zip
   */
  protected async openDownloads() {
    const model = this.store.model()
    if (!model?.url) {
      return
    }
    await this.modelDownloads.open(model, {
      withLabel: this.models()?.length > 1,
      params: this.appearanceParams(false),
      animations: this.playingAnimations(),
    })
  }

  /**
   * The animation names the view plays: the fragment's, else the GLB animation while it runs
   */
  private playingAnimations(): string[] {
    const fragment = this.fragment()
    if (fragment) {
      return [...fragment.animations]
    }
    const animation = this.store.animation()
    if (animation && this.isAnimating()) {
      return [animation]
    }
    return []
  }

  protected async capturePhoto() {
    const image = await this.viewer?.screenshot()
    if (!image) {
      return
    }
    const name = await this.i18n.getAsync(this.store.model()?.name)
    this.screenshots.saveBlobWithDialog(image, name)
  }

  private async loadLib() {
    const lib: ViewerLib = await import(/* @vite-ignore */ viewerLibUrl('nw-viewer.module.js'))
    const supported = await lib.ModelViewer.isSupported()
    if (this.destroyed) {
      return
    }
    this.lib.set(lib)
    this.isSupported.set(supported)
  }

  /**
   * The viewer, created on first use
   */
  private async getViewer(): Promise<ModelViewer | null> {
    const lib = this.lib()
    const canvas = this.canvas()?.nativeElement
    if (this.viewer || !lib || !canvas) {
      return this.viewer
    }
    // the render loop runs outside of the change detection
    const viewer = this.zone.runOutsideAngular(() => new lib.ModelViewer({ canvas }))
    viewer.sky = this.isLight()
    viewer.hitboxes = this.hitboxes()
    viewer.output = this.viewerOutput.output()
    this.viewer = viewer
    await this.zone.runOutsideAngular(() => viewer.run())
    return this.destroyed ? null : viewer
  }

  private playAnimation(name: string | null) {
    this.viewer?.playAnimation(name ?? null)
    this.isAnimating.set(!!this.viewer?.animationPlaying)
  }

  /**
   * The fragments of the shown character: listed, and its idle plays
   */
  private async showFragments(viewer: ModelViewer) {
    const mannequin = viewer.mannequin
    if (!mannequin) {
      return
    }
    this.fragments.set(mannequin.actions)
    this.fragmentTags.set([...mannequin.tags])
    await this.zone.runOutsideAngular(() => mannequin.playIdle()).catch(() => false)
    if (viewer.mannequin === mannequin) {
      this.setPlayed(mannequin, mannequin.variant)
    }
  }

  private async showModel(model: ModelItemInfo | null) {
    this.fragments.set([])
    this.fragmentTags.set([])
    this.customTags.set([])
    this.durations.set(new Map())
    this.fragment.set(null)
    if (!model?.url) {
      this.viewer?.clear()
      this.isLoading.set(false)
      this.hasError.set(false)
      return
    }
    this.isLoading.set(true)
    this.hasError.set(false)
    try {
      const viewer = await this.getViewer()
      if (!viewer) {
        return
      }
      const { rootUrl, url } = modelUrls(model)
      await this.zone.runOutsideAngular(() => {
        const shown = viewer.show(url, {
          rootUrl,
          ...(model.character ? characterDisplay() : itemDisplay(model.itemClass)),
          materialParams: this.materialParams(),
          mannequin: model.mannequin ?? null,
        })
        // the show has emptied the sockets, the weapons load with the model
        return Promise.all([shown, ...(model.sockets ?? []).map((it) => setSocket(viewer, it))])
      })
      viewer.frame()
      this.store.setAnimations(viewer.animations)
      this.playAnimation(this.store.animation())
      this.isLoading.set(false)
      await this.showFragments(viewer)
    } catch (err) {
      // replaced by the next model
      if ((err as Error)?.name === 'AbortError') {
        return
      }
      console.error('model not shown', String(err))
      this.isLoading.set(false)
      this.hasError.set(true)
    }
  }
}

/**
 * Places the models of a socket. The model shows without one that does not load.
 */
async function setSocket(viewer: ModelViewer, socket: ModelSocketInfo) {
  try {
    await viewer.setSocket(
      socket.name,
      socket.models.map((it) => modelUrls(it)),
      socket.offset,
    )
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('socket models not shown', socket.name, String(err))
    }
  }
}

/**
 * The dye panel's mask debug: each mask layer in a pure color
 */
const DEBUG_DYES: AppearanceDyes = {
  r: rowText({ Color: '#FF0000', ColorAmount: 1, ColorOverride: 1 }),
  g: rowText({ Color: '#00FF00', ColorAmount: 1, ColorOverride: 1 }),
  b: rowText({ Color: '#0000FF', ColorAmount: 1, ColorOverride: 1 }),
  a: rowText({ SpecColor: '#FF00FF', SpecAmount: 1 }),
}
