import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { ArmorAppearanceDefinitions } from '@nw-data/generated'
import { catchError, from, of, switchMap, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import {
  svgCamera,
  svgCircleExclamation,
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
import { TranslateService } from '../../i18n'
import { ScreenshotModule, ScreenshotService } from '../screenshot'
import { ModelItemInfo } from './model-viewer.service'

import { animate, style, transition, trigger } from '@angular/animations'
import { Overlay } from '@angular/cdk/overlay'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { TransformNode, Vector3 } from '@babylonjs/core'
import { ViewerDetails } from '@babylonjs/viewer'
import { environment } from 'apps/web/environments'
import { LayoutModule, ModalRef } from '~/ui/layout'
import { injectDocument } from '~/utils/injection/document'
import { DyePanelComponent } from './dye-panel.component'
import { ModelViewerStore } from './model-viewer.store'
import { getItemRotation } from './utils/get-item-rotation'
import { Model, NwMaterialExtension, Viewer, createViewer, updateNwMaterial, viewerCaptureImage } from './viewer'
import { getModelUrl } from './utils/get-model-url'

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
  protected iconMore = svgFilms

  private viewer = signal<Viewer>(null)
  private viewerDetails = signal<ViewerDetails>(null)
  private document = injectDocument()

  public constructor() {
    effect(() => {
      const models = this.models()
      untracked(() => this.store.setModels(models))
    })
    effect(() => {
      const viewer = this.viewer()
      const mode = this.mode()
      const environment = this.store.environment()
      untracked(() => updateMode(viewer, mode, environment))
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
          this.isLoading.set(true)
          this.hasError.set(false)
          return from(this.showModel(data)).pipe(
            tap(() => {
              this.isLoading.set(false)
              this.hasError.set(false)
              this.hasLoaded.set(true)
            }),
            catchError(() => {
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
    return !!this.document.fullscreenElement
  }
  protected toggleFullscreen() {
    if (this.isFullscreen()) {
      this.document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected exitFullscreen() {
    if (this.isFullscreen()) {
      this.document.exitFullscreen()
    }
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
    const { rootUrl, modelUrl } = getModelUrl(data.url)
    await viewer.loadModel(modelUrl, {
      rootUrl: rootUrl,
      animationAutoPlay: true,
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
    this.exitFullscreen()
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

function updateMode(viewer: Viewer, mode: 'dark' | 'light', environment: string) {
  if (!viewer) {
    return
  }

  if (mode === 'dark') {
    viewer.loadEnvironment(environment, { lighting: true })
    viewer.loadEnvironment(undefined, { skybox: true })
  } else {
    viewer.loadEnvironment(environment, { skybox: true, lighting: true })
  }
  viewer.environmentConfig = {
    rotation: 1.85,
    blur: 0.5,
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
