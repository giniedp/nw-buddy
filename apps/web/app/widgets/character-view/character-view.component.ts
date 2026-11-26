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
  model,
  NgZone,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import type {
  CharacterAttachment,
  CharacterClip,
  CharacterViewer,
  CharacterViewerQuality,
  MaterialParams,
  RowText,
} from '@nw-buddy/viewer'
import { NwModule } from '~/nw'
import { AppPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgCircleExclamation, svgExpand, svgEye, svgMoon, svgSun } from '~/ui/icons/svg'
import { FullscreenService } from '~/ui/layout'
import { viewerLibUrl } from '../nw-viewer'
import { ScreenshotService } from '../screenshot'
import { ViewerOutputComponent, ViewerOutputService } from '../viewer-output'

type ViewerLib = typeof import('@nw-buddy/viewer')

/**
 * The dye color rows of the four dye channels (`DyeColorData`), null leaves a channel undyed
 */
export interface CharacterDyes {
  r?: object | null
  g?: object | null
  b?: object | null
  a?: object | null
}

/**
 * A model in a slot: its materials take the appearance row's colors and the dyes
 */
export interface CharacterSlotModel {
  url: string
  /**
   * The root the file's buffer and image uris resolve against, default the folder of the file
   */
  rootUrl?: string
  /**
   * The armor appearance row (`ArmorAppearanceDefinitions`) of the model, null for models without one (bare skins)
   */
  appearance?: object | null
  dyes?: CharacterDyes | null
}

/**
 * The models per slot (e.g. `chest`: the two skins of an armor row), see `CharacterViewer.setSlot`
 */
export type CharacterSlots = Record<string, CharacterSlotModel[]>

/**
 * The models on a socket of the character (e.g. a weapon in a sheath) and where they sit on it: meters, degrees about
 * x, y, z. See `CharacterViewer.setSocket`
 */
export interface CharacterSocketModels {
  models: CharacterSlotModel[]
  offset?: { position?: number[]; rotation?: number[] }
}

/**
 * The models per socket name (e.g. `righthandattach`, `left_sword`)
 */
export type CharacterSockets = Record<string, CharacterSocketModels>

/**
 * The default of the character and background light in stops: the stage lights boosted, a double click on a slider
 * returns to it
 */
export const CHARACTER_LIGHT_STOPS_DEFAULT = 1.25
/**
 * How far the light sliders go from the default in stops, both sliders have the same range around it
 */
const LIGHT_STOPS_RANGE = 3

/**
 * The character scene of the character editor (`CharacterViewer`): a stage, a character and its slots. All state comes
 * from the inputs, the host holds it and its rules.
 */
@Component({
  selector: 'nwb-character-view',
  templateUrl: './character-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, IconsModule, ViewerOutputComponent],
  host: {
    class: 'layout-col bg-gradient-to-b from-base-300 to-black relative z-0',
  },
})
export class CharacterViewComponent {
  /**
   * The stage file, it describes the spot, camera, time and exposure (`nwStage`)
   */
  public readonly stageUrl = input.required<string>()
  public readonly characterUrl = input<string | null>(null)
  /**
   * The root the character's textures resolve against, default: the folder of the character file
   */
  public readonly characterRootUrl = input<string | null>(null)
  public readonly slots = input<CharacterSlots>({})
  /**
   * The models on sockets of the character (weapons)
   */
  public readonly sockets = input<CharacterSockets>({})
  /**
   * Node names of the character and slot models to hide
   */
  public readonly hiddenParts = input<string[]>([])
  /**
   * Exposure in stops from the stage's exposure
   */
  public readonly exposureStops = model<number>(0)
  /**
   * Light of the stage's character lights in stops from the game's light, the rest of the stage keeps its light
   */
  public readonly characterLightStops = model<number>(CHARACTER_LIGHT_STOPS_DEFAULT)
  /**
   * Light of the stage's background lights (behind the character) in stops from the editor's default
   */
  public readonly backgroundLightStops = model<number>(CHARACTER_LIGHT_STOPS_DEFAULT)
  /**
   * The clip sequence the character plays (e.g. an emote's start and loop), null or empty: the rest pose
   */
  public readonly animation = input<CharacterClip[] | null>(null)
  /**
   * Pauses the animation, the pose stays
   */
  public readonly animationPaused = input<boolean>(false)
  /**
   * Moves the animation to a time in seconds (a new object for each seek)
   */
  public readonly animationSeek = input<{ time: number } | null>(null)
  /**
   * The node names of the shown character and slot models, after each change
   */
  public readonly partsChange = output<string[]>()
  /**
   * The parts the character file hides by default, after a character loaded (the view shows them unless they are in
   * {@link hiddenParts})
   */
  public readonly defaultHiddenPartsChange = output<string[]>()
  /**
   * The time and duration of the animation in seconds, while it plays (about ten times a second) and after changes
   */
  public readonly animationProgress = output<{ time: number; duration: number }>()
  /**
   * The animation played to its end and stopped (a sequence without a loop): it counts as paused, playing it again
   * starts it over
   */
  public readonly animationEnd = output<void>()

  private host = inject<ElementRef<HTMLElement>>(ElementRef)
  private zone = inject(NgZone)
  private screenshots = inject(ScreenshotService)
  private fullscreen = inject(FullscreenService)
  private viewerOutput = inject(ViewerOutputService)
  private preferences = inject(AppPreferencesService)
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas')

  /**
   * Whether the browser runs the viewer, null until checked
   */
  protected isSupported = signal<boolean | null>(null)
  /**
   * Running viewer loads, see track
   */
  private pending = signal(0)
  protected isLoading = computed(() => this.pending() > 0)
  protected hasError = signal(false)
  protected showLoading = computed(() => this.isSupported() === null || this.isLoading())

  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation
  protected iconFullscreen = svgExpand
  protected iconSun = svgSun
  protected iconMoon = svgMoon
  protected readonly lightDefault = CHARACTER_LIGHT_STOPS_DEFAULT
  protected readonly lightMin = CHARACTER_LIGHT_STOPS_DEFAULT - LIGHT_STOPS_RANGE
  protected readonly lightMax = CHARACTER_LIGHT_STOPS_DEFAULT + LIGHT_STOPS_RANGE
  /**
   * The exposure popover of the toolbar
   */
  protected exposureOpen = signal(false)
  /**
   * The render quality, kept on the device. Auto follows the GPU.
   */
  protected quality = signal(this.preferences.characterViewQuality.get())
  protected qualityOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ] as const
  private suggestedQuality = signal<CharacterViewerQuality>('high')
  private viewerQuality = computed(() => {
    const quality = this.quality()
    return quality === 'auto' ? this.suggestedQuality() : quality
  })
  protected iconOutput = svgEye
  /**
   * The debug outputs of the viewer, null in production builds
   */
  protected outputs = computed(() => (this.viewerOutput.isEnabled ? this.lib()?.VIEWER_OUTPUTS : null))
  protected showOutputs = signal(false)
  /**
   * Whether the loaded stage has character lights, the light slider shows only then
   */
  protected hasCharacterLights = computed(() => {
    const viewer = this.viewer()
    return this.stageReady() && !!viewer?.hasCharacterLights
  })

  private lib = signal<ViewerLib | null>(null)
  /**
   * The viewer, once created and running
   */
  private viewer = signal<CharacterViewer | null>(null)
  /**
   * Set when the stage loaded, the exposure and the slots wait for it
   */
  private stageReady = signal(false)
  private shownSlots = new Set<string>()
  private shownSockets = new Set<string>()
  private destroyed = false

  public constructor() {
    effect(() => {
      const viewer = this.viewer()
      const url = this.stageUrl()
      if (viewer) {
        untracked(() => this.showStage(viewer, url))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const url = this.characterUrl()
      if (viewer) {
        untracked(() => this.showCharacter(viewer, url))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const slots = this.slots()
      if (viewer) {
        untracked(() => this.applySlots(viewer, slots))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const sockets = this.sockets()
      if (viewer) {
        untracked(() => this.applySockets(viewer, sockets))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const hidden = this.hiddenParts()
      if (viewer) {
        untracked(() => viewer.setHiddenParts(hidden))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const stops = this.exposureStops()
      const stage = this.stageReady() ? viewer?.stageDescription : null
      if (viewer && stage) {
        viewer.exposure = stage.exposure * 2 ** stops
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const stops = this.characterLightStops()
      if (viewer && this.stageReady()) {
        viewer.characterLight = 2 ** stops
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const stops = this.backgroundLightStops()
      if (viewer && this.stageReady()) {
        viewer.backgroundLight = 2 ** stops
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const quality = this.viewerQuality()
      if (viewer) {
        viewer.quality = quality
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const output = this.viewerOutput.output()
      if (viewer) {
        viewer.output = output
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const clips = this.animation()
      if (viewer) {
        untracked(() => this.playAnimation(viewer, clips))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const paused = this.animationPaused()
      if (viewer) {
        viewer.animationPlaying = !paused
        untracked(() => this.emitProgress(viewer))
      }
    })
    effect(() => {
      const viewer = this.viewer()
      const seek = this.animationSeek()
      if (viewer && seek) {
        viewer.animationTime = seek.time
        untracked(() => this.emitProgress(viewer))
      }
    })
    afterNextRender(() => {
      this.start().catch((err) => {
        console.error('character viewer not loaded', String(err))
        this.isSupported.set(false)
      })
    })
    // the animation time while it plays, outside the change detection until there is something to report
    let playing = false
    const timer = this.zone.runOutsideAngular(() => {
      return setInterval(() => {
        const viewer = this.viewer()
        const wasPlaying = playing
        playing = !!viewer?.animationPlaying
        if (playing) {
          this.zone.run(() => this.emitProgress(viewer))
        } else if (wasPlaying && viewer?.animationEnded) {
          this.zone.run(() => {
            this.emitProgress(viewer)
            this.animationEnd.emit()
          })
        }
      }, 100)
    })
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer)
      this.destroyed = true
      this.viewer()?.dispose()
      this.viewer.set(null)
    })
  }

  protected selectQuality(value: 'auto' | CharacterViewerQuality) {
    this.quality.set(value)
    this.preferences.characterViewQuality.set(value)
  }

  protected toggleFullscreen() {
    this.fullscreen.toggle(this.host.nativeElement)
  }

  /**
   * The material params the view applies to a slot model (its appearance's colors and dyes), e.g. for an export.
   * Null before the viewer lib loaded or without an appearance.
   */
  public materialParamsOf(model: CharacterSlotModel): MaterialParams | null {
    const lib = this.lib()
    return lib ? materialParams(lib, model) : null
  }

  /**
   * Saves a screenshot of the view
   */
  public async capturePhoto() {
    const image = await this.viewer()?.screenshot()
    if (image) {
      this.screenshots.saveBlobWithDialog(image, 'character')
    }
  }

  private async start() {
    const lib: ViewerLib = await import(/* @vite-ignore */ viewerLibUrl('nw-viewer.module.js'))
    const [supported, suggestedQuality] = await Promise.all([
      lib.CharacterViewer.isSupported(),
      lib.CharacterViewer.suggestedQuality(),
    ])
    if (this.destroyed) {
      return
    }
    this.suggestedQuality.set(suggestedQuality)
    this.lib.set(lib)
    this.isSupported.set(supported)
    const canvas = this.canvas()?.nativeElement
    if (!supported || !canvas) {
      return
    }
    // the render loop runs outside of the change detection
    const quality = this.viewerQuality()
    const viewer = this.zone.runOutsideAngular(() => new lib.CharacterViewer({ canvas, quality }))
    await this.zone.runOutsideAngular(() => viewer.run())
    if (this.destroyed) {
      viewer.dispose()
      return
    }
    this.viewer.set(viewer)
  }

  private async showStage(viewer: CharacterViewer, url: string) {
    this.stageReady.set(false)
    await this.track(() => viewer.showStage(url))
    if (viewer.stageDescription) {
      this.stageReady.set(true)
    }
  }

  private async showCharacter(viewer: CharacterViewer, url: string | null) {
    if (!url) {
      return
    }
    const rootUrl = this.characterRootUrl() ?? undefined
    await this.track(() => viewer.showCharacter(url, { rootUrl }))
    // the new character continues the animation, from its start
    viewer.animationPlaying = !this.animationPaused()
    this.emitProgress(viewer)
    this.partsChange.emit(uniqueParts(viewer))
    this.defaultHiddenPartsChange.emit(viewer.defaultHiddenParts)
  }

  private async playAnimation(viewer: CharacterViewer, clips: CharacterClip[] | null) {
    await this.track(() => viewer.playAnimation(clips))
    viewer.animationPlaying = !this.animationPaused()
    this.emitProgress(viewer)
  }

  private emitProgress(viewer: CharacterViewer) {
    this.animationProgress.emit({ time: viewer.animationTime, duration: viewer.animationDuration })
  }

  /**
   * Sets every slot of the input, empties the slots that left it
   */
  private async applySlots(viewer: CharacterViewer, slots: CharacterSlots) {
    const lib = this.lib()
    if (!lib) {
      return
    }
    const names = new Set([...this.shownSlots, ...Object.keys(slots)])
    this.shownSlots = new Set(Object.keys(slots))
    await this.track(() => {
      return Promise.all(
        [...names].map((name) => {
          const attachments = (slots[name] ?? []).map((it): CharacterAttachment => {
            return { url: it.url, rootUrl: it.rootUrl, materialParams: materialParams(lib, it) }
          })
          return viewer.setSlot(name, attachments)
        }),
      )
    })
    this.partsChange.emit(uniqueParts(viewer))
  }

  /**
   * Sets the sockets of the input and empties the ones it no longer has
   */
  private async applySockets(viewer: CharacterViewer, sockets: CharacterSockets) {
    const lib = this.lib()
    if (!lib) {
      return
    }
    const names = new Set([...this.shownSockets, ...Object.keys(sockets)])
    this.shownSockets = new Set(Object.keys(sockets))
    await this.track(() => {
      return Promise.all(
        [...names].map((name) => {
          const socket = sockets[name]
          const attachments = (socket?.models ?? []).map((it): CharacterAttachment => {
            return { url: it.url, rootUrl: it.rootUrl, materialParams: materialParams(lib, it) }
          })
          return viewer.setSocket(name, attachments, socket?.offset ?? {})
        }),
      )
    })
  }

  /**
   * Runs a viewer load with the loading and error state. Loads replaced by a later one (AbortError) are no errors.
   */
  private async track(task: () => Promise<unknown>) {
    this.pending.update((it) => it + 1)
    this.hasError.set(false)
    try {
      await this.zone.runOutsideAngular(task)
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('character view', String(err))
        this.hasError.set(true)
      }
    } finally {
      this.pending.update((it) => it - 1)
    }
  }
}

function uniqueParts(viewer: CharacterViewer): string[] {
  return [...new Set(viewer.parts)]
}

/**
 * The material params of a slot model: the appearance's colors, dyed where a dye is set (see `nwb-model-view`)
 */
function materialParams(lib: ViewerLib, model: CharacterSlotModel): MaterialParams | null {
  const appearance = rowText(model.appearance)
  if (!appearance) {
    return null
  }
  const dyes = model.dyes
  if (!dyes?.r && !dyes?.g && !dyes?.b && !dyes?.a) {
    return lib.appearanceParams(appearance)
  }
  return lib.dyedAppearanceParams(appearance, {
    r: rowText(dyes.r),
    g: rowText(dyes.g),
    b: rowText(dyes.b),
    a: rowText(dyes.a),
  })
}

/**
 * A data row as the viewer's row accessor: the text of a cell, '' when empty. Null without a row.
 */
function rowText(row: object | null | undefined): RowText | null {
  if (!row) {
    return null
  }
  return (column: string) => {
    const value = (row as Record<string, unknown>)[column]
    return value == null ? '' : String(value)
  }
}
