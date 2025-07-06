import { animate, style, transition, trigger } from '@angular/animations'
import { Overlay } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { TransformNode, Vector3 } from '@babylonjs/core'
import type { ViewerDetails } from '@babylonjs/viewer'
import { ArmorAppearanceDefinitions } from '@nw-data/generated'
import { NwMaterialExtension, updateNwMaterial } from '@nw-viewer/babylon/extensions'
import { catchError, from, of, switchMap, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgCamera,
  svgCircleExclamation,
  svgCubes,
  svgExpand,
  svgFilms,
  svgGlobeSnow,
  svgMoon,
  svgPause,
  svgPlay,
  svgStop,
  svgSun,
  svgXmark,
} from '~/ui/icons/svg'
import { FullscreenService, LayoutModule, ModalRef } from '~/ui/layout'
import { TranslateService } from '../../i18n'
import { ScreenshotModule, ScreenshotService } from '../screenshot'
import { DyePanelComponent } from './dye-panel.component'
import { ModelItemInfo } from './model-viewer.service'
import { ModelViewerStore } from './model-viewer.store'
import { getItemRotation } from './utils/get-item-rotation'
import { getModelUrl } from './utils/get-model-url'
import { Model, Viewer, createViewer, viewerCaptureImage } from './viewer'

export interface ModelViewerState {
  models: ModelItemInfo[]
  index: number
  isLoaded?: boolean
  isModal?: boolean
  viewer?: Viewer
  appearance: ArmorAppearanceDefinitions
}

@Component({
  selector: 'nwb-model-viewer',
  templateUrl: './model-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    ScreenshotModule,
    DyePanelComponent,
    FormsModule,
    IconsModule,
    LayoutModule,
  ],

  providers: [ModelViewerStore, Overlay],
  host: {
    class: 'layout-col bg-gradient-to-b from-base-300 to-black relative z-0 group',
  },
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.150s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class ModelViewerComponent implements OnDestroy {
  private modalRef = inject(ModalRef, { optional: true })
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private zone = inject(NgZone)
  private screenshots = inject(ScreenshotService)
  private i18n = inject(TranslateService)
  protected store = inject(ModelViewerStore)
  protected errorIcon = svgCircleExclamation
  public readonly models = input<ModelItemInfo[]>()
  public readonly close = output()

  protected canvas = viewChild<string, ElementRef<HTMLCanvasElement>>('canvas', { read: ElementRef })
  protected isSuported = this.store.isSupported
  protected isEmpty = this.store.isEmpty
  protected canDye = this.store.canDye
  protected buttons = this.store.buttons
  protected mode = this.store.mode
  protected isLight = computed(() => this.mode() === 'light')
  protected isLoading = signal(false)
  protected hasLoaded = signal(false)
  protected hasError = signal(false)
  protected progress = signal<string>('')
  protected canClose = signal(!!this.modalRef)
  protected model = signal<Model>(null)
  protected isAnimating = signal(false)

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand
  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation
  protected iconSun = svgSun
  protected iconMoon = svgMoon
  protected iconPlay = svgPlay
  protected iconPause = svgPause
  protected iconStop = svgStop
  protected iconEnv = svgGlobeSnow
  protected iconFilms = svgFilms
  protected iconMore = svgBars
  protected iconEmpty = svgCubes

  private viewer = signal<Viewer>(null)
  private viewerDetails = signal<ViewerDetails>(null)
  private fullscreen = inject(FullscreenService)

  public constructor() {
    effect(() => {
      const models = this.models()
      untracked(() => this.store.setModels(models))
    })
    effect(() => {
      const viewer = this.viewer()
      const mode = this.mode()
      untracked(() => updateMode(viewer, mode))
    })
    effect(() => {
      const viewer = this.viewer()
      const environment = this.store.environment()
      untracked(() => updateEnv(viewer, environment))
    })
    effect(() => {
      const viewer = this.viewer()
      const model = this.model()
      const data = this.store.model()
      untracked(() => updateRotation(viewer, model, data))
    })
    effect(() => {
      const animations = this.model()?.assetContainer?.animationGroups?.map((it) => it.name) || []
      untracked(() => this.store.setAnimations([...animations]))
    })
    effect(() => {
      const index = this.store.animationIndex()
      const viewer = this.viewer()
      if (viewer) {
        viewer.selectedAnimation = index
      }
    })
    this.bindAppearance()
    this.bindDyeState()

    toObservable(this.store.model)
      .pipe(
        switchMap((data) => {
          if (!data) {
            this.hasError.set(false)
            this.hasLoaded.set(false)
            this.isLoading.set(false)
            this.disposeViewer()
            return of(null)
          }
          this.isLoading.set(true)
          this.hasError.set(false)
          return from(this.showModel(data)).pipe(
            tap(() => {
              this.isLoading.set(false)
              this.hasError.set(false)
              this.hasLoaded.set(true)
            }),
            catchError((err) => {
              console.error(err)
              this.isLoading.set(false)
              this.hasError.set(true)
              this.hasLoaded.set(true)
              this.disposeViewer()
              return of(null)
            }),
          )
        }),
      )
      .pipe(takeUntilDestroyed())
      .subscribe()
  }

  public ngOnDestroy(): void {
    this.viewer()?.dispose()
    this.viewer.set(null)
  }

  protected show(index: number) {
    this.store.setIndex(index)
  }

  protected isFullscreen() {
    return this.fullscreen.isActive()
  }
  protected toggleFullscreen() {
    this.fullscreen.toggle(this.elRef.nativeElement)
  }

  protected exitFullscreen() {
    this.fullscreen.exit()
  }

  protected toggleAnimation() {
    this.viewer().toggleAnimation()
  }

  protected closeDialog() {
    this.modalRef?.close()
    this.close.emit()
  }

  private async showModel(data: ModelItemInfo) {
    if (!data?.url) {
      return
    }
    const viewer = await this.getViewer()
    if (!viewer) {
      return null
    }
    let rootUrl = data.rootUrl
    let modelUrl = data.url
    if (!data.rootUrl) {
      const url = getModelUrl(data.url)
      rootUrl = url.rootUrl
      modelUrl = url.modelUrl
    }
    await viewer.loadModel(modelUrl, {
      rootUrl: rootUrl,
      onProgress: (it) => {
        if (it.lengthComputable) {
          this.progress.set(`${Math.round((it.loaded / it.total) * 100)}%`)
        } else {
          this.progress.set('')
        }
      },
    })
    this.model.set(this.viewerDetails()?.model)
  }

  private async getViewer() {
    if (this.viewer()) {
      return this.viewer()
    }
    if (!this.store.isSupported()) {
      return null
    }
    await createViewer({
      element: this.canvas().nativeElement,
      zone: this.zone,
      mode: this.mode(),
      onInitialized: (details) => {
        this.viewerDetails.set(details)
        this.model.set(details.model)
      },
    })
      .then(async (viewer) => {
        this.isAnimating.set(viewer.isAnimationPlaying)
        viewer.onIsAnimationPlayingChanged.add(() => {
          this.isAnimating.set(viewer.isAnimationPlaying)
        })
        await viewer.loadEnvironment('auto', {
          skybox: true,
          lighting: true,
        })

        this.viewer.set(viewer)
      })
      .catch((err) => {
        console.error(err)
        return null
      })
    return this.viewer()
  }

  private disposeViewer() {
    this.viewer()?.dispose()
    this.viewer.set(null)
    this.model.set(null)
  }

  protected async capturePhoto() {
    const viewer = this.viewer()
    const model = this.store.model()
    const name = await this.i18n.getAsync(model.name)
    const data = this.isFullscreen()
      ? await viewerCaptureImage(viewer, window.innerWidth)
      : await viewerCaptureImage(viewer, 2000)
    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob, name)
  }

  protected async toggleMode() {
    this.store.toggleMode()
  }

  private async bindAppearance() {
    effect(() => {
      const model = this.model()
      const appearance = this.store.model()?.appearance
      if (!model) {
        return
      }
      untracked(() => {
        this.store.setAppearance(
          appearance ||
            model.assetContainer.meshes
              .map((mesh) => NwMaterialExtension.getAppearance(mesh.material))
              .find((it) => !!it),
        )
      })
    })
  }

  private async bindDyeState() {
    effect(() => {
      const model = this.model()
      if (!model) {
        return
      }

      const dyeR = this.store.dyeR()
      const dyeG = this.store.dyeG()
      const dyeB = this.store.dyeB()
      const dyeA = this.store.dyeA()
      const appearance = this.store.appearance()
      const debugMask = this.store.dyeDebug()
      untracked(() => {
        updateNwMaterial({
          meshes: model.assetContainer.meshes,
          appearance: appearance
            ? {
                ...appearance,
                MaskAGloss: Number(appearance.MaskAGloss) || 0,
              }
            : null,
          dyeR: dyeR?.ColorAmount,
          dyeROverride: dyeR?.ColorOverride,
          dyeRColor: dyeR?.Color,
          dyeG: dyeG?.ColorAmount,
          dyeGOverride: dyeG?.ColorOverride,
          dyeGColor: dyeG?.Color,
          dyeB: dyeB?.ColorAmount,
          dyeBOverride: dyeB?.ColorOverride,
          dyeBColor: dyeB?.Color,
          dyeA: dyeA?.SpecAmount,
          //dyeAOverride: dyeA?.SpecOverride,
          dyeAColor: dyeA?.SpecColor,
          glossShift: dyeA?.MaskGlossShift,
          debugMask: debugMask,
        })
      })
    })
  }
}

function updateMode(viewer: Viewer, mode: 'dark' | 'light') {
  if (!viewer) {
    return
  }
  viewer.environmentConfig = {
    rotation: 1.85,
    blur: 0.5,
    visible: mode === 'light',
  }
}

async function updateEnv(viewer: Viewer, env: string) {
  if (!viewer) {
    return
  }
  const wasVisible = !!viewer.environmentConfig?.visible
  await viewer.loadEnvironment(env, { lighting: true, skybox: true })
  viewer.environmentConfig = {
    ...viewer.environmentConfig,
    visible: wasVisible,
  }
}

function updateRotation(viewer: Viewer, model: Model, data: ModelItemInfo) {
  if (!model || !viewer) {
    return
  }
  const rotation = getItemRotation(data?.itemClass)

  const root = new TransformNode('root')
  for (const node of model.assetContainer.rootNodes) {
    node.parent = root
  }
  root.rotationQuaternion = rotation
  setTimeout(() => {
    model.resetWorldBounds()
    const center = model.getWorldBounds().center
    const camera = viewer['_camera']
    camera.target = new Vector3(center[0], center[1], center[2])
  })
}
