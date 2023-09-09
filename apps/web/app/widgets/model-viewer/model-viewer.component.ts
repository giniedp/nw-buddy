import { DIALOG_DATA, Dialog, DialogConfig, DialogModule, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  NO_ERRORS_SCHEMA,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewChild,
} from '@angular/core'
import { Itemappearancedefinitions } from '@nw-data/generated'
import { Subject, catchError, firstValueFrom, from, of, switchMap, takeUntil, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgCircleExclamation, svgExpand, svgXmark } from '~/ui/icons/svg'
import { TranslateService } from '../../i18n'
import { ScreenshotService } from '../screenshot'
import { ItemModelInfo } from './model-viewer.service'

import { animate, style, transition, trigger } from '@angular/animations'
import { ViewerModel } from 'babylonjs-viewer'
import { ModelViewerStore } from './model-viewer.store'
import { getItemRotation } from './utils/get-item-rotation'
import { supportsWebGL } from './utils/webgl-support'
import type { DefaultViewer } from './viewer'
export interface ModelViewerState {
  models: ItemModelInfo[]
  index: number
  isLoaded?: boolean
  isModal?: boolean
  viewer?: DefaultViewer
  appearance: Itemappearancedefinitions
}

@Component({
  standalone: true,
  selector: 'nwb-model-viewer',
  templateUrl: './model-viewer.component.html',
  styleUrls: ['./model-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, IconsModule],
  providers: [ModelViewerStore],
  host: {
    class: 'layout-col bg-base-300 relative z-0',
  },
  schemas: [NO_ERRORS_SCHEMA],
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.150s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.150s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class ModelViewerComponent implements OnInit, OnDestroy {
  public static open(dialog: Dialog, options: DialogConfig<ItemModelInfo[]>) {
    return dialog.open(ModelViewerComponent, options)
  }

  @Input()
  public set models(value: ItemModelInfo[]) {
    this.store.patchState({ models: value })
  }

  @Input()
  public set canClose(value: boolean) {
    this.store.patchState({ canClose: value })
  }

  @Input()
  public hideFloor: boolean = false

  @Output()
  public readonly close = new Subject<void>()

  @ViewChild('viewerHost', { static: true })
  protected viewerHost: ElementRef<HTMLElement>

  protected isSuported$ = this.store.isSupported$
  protected isLoading$ = this.store.isLoading$
  protected hasLoaded$ = this.store.hasLoaded$
  protected hasError$ = this.store.hasError$
  protected canClose$ = this.store.canClose$
  protected buttons$ = this.store.buttons$

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand
  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation

  private viewer: DefaultViewer

  public constructor(
    @Optional()
    private ref: DialogRef,
    @Inject(DIALOG_DATA)
    @Optional()
    data: ItemModelInfo[],
    private elRef: ElementRef<HTMLElement>,
    private zone: NgZone,
    private screenshots: ScreenshotService,
    private i18n: TranslateService,
    private store: ModelViewerStore
  ) {
    this.store.patchState({
      canClose: !!ref,
      isSupported: supportsWebGL(),
    })
  }

  public async ngOnInit() {
    this.store.model$
      .pipe(
        switchMap((data) => {
          this.disposeViewer()
          this.store.patchState({ isLoading: true, hasError: false })
          return from(this.showModel(data)).pipe(
            tap(() => {
              this.store.patchState({ isLoading: false, hasError: false, hasLoaded: true })
            }),
            catchError(() => {
              this.store.patchState({ isLoading: false, hasError: true, hasLoaded: true })
              this.disposeViewer()
              return of(null)
            })
          )
        })
      )
      .pipe(takeUntil(this.store.destroy$))
      .subscribe()
  }

  public ngOnDestroy(): void {
    this.viewer?.dispose()
    this.viewer = null
  }

  protected show(index: number) {
    this.store.patchState({ index: index })
  }

  protected toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  protected closeDialog() {
    this.ref?.close()
    this.close.next()
  }

  private async showModel(data: ItemModelInfo) {
    if (!data?.url) {
      return null
    }
    const viewer = await this.getViewer()
    if (!viewer) {
      return null
    }

    const rotation = await getItemRotation(data?.itemClass)
    viewer.sceneManager.clearScene(true, false)

    return viewer.loadModel({
      url: data.url,
      rotationOffsetAngle: 0,
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
      entryAnimation: null,
    })
  }

  private async getViewer() {
    if (this.viewer) {
      return this.viewer
    }
    if (!this.store.isSupported$()) {
      return null
    }

    const { createViewer } = await import('./viewer')
    this.viewer = await createViewer({
      element: this.viewerHost.nativeElement,
      zone: this.zone,
      hideFloor: this.hideFloor,
      onModelLoaded: (model) => {
        // console.log('modelLoaded', model)
      },
      onModelError: (err) => {
        // console.log('modelError', err)
      },
    })
      .then((viewer) => {
        // console.log('viewerLoaded', viewer)
        return viewer
      })
      .catch((err) => {
        // console.log('viewerError', err)
        return null
      })
    return this.viewer
  }

  private disposeViewer() {
    this.viewer?.dispose()
    this.viewer = null
    this.viewerHost.nativeElement.innerHTML = ''
  }

  protected toggleDebug() {
    this.viewer.sceneManager.scene.debugLayer.show({})
  }

  protected async capturePhoto() {
    const model = await firstValueFrom(this.store.model$)
    const name = await this.i18n.getAsync(model.name)
    const data = await this.viewer.takeScreenshot()
    this.exitFullscreen()
    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob, name)
  }

  private async detectDyeFeature(model: ViewerModel) {
    const { getAppearance } = await import('./viewer')
    const appearance = model.meshes.map((mesh) => getAppearance(mesh.material)).find((it) => !!it)
    console.log('appearance', appearance)
    this.store.patchState({
      appearance: appearance,
    })
  }

  private updateDye() {
    //const appearance = this.get(({ appearance }) => appearance)
  }
}
