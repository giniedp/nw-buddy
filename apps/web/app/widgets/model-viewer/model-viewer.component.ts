import { CdkDialogContainer, DIALOG_DATA, Dialog, DialogConfig, DialogModule, DialogRef } from '@angular/cdk/dialog'
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
  forwardRef,
} from '@angular/core'
import { Itemappearancedefinitions, Mounts } from '@nw-data/generated'
import { Subject, catchError, firstValueFrom, from, map, of, switchMap, takeUntil, tap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgCircleExclamation, svgExpand, svgMoon, svgSun, svgXmark } from '~/ui/icons/svg'
import { TranslateService } from '../../i18n'
import { ScreenshotModule, ScreenshotService } from '../screenshot'
import { ItemModelInfo } from './model-viewer.service'

import { animate, style, transition, trigger } from '@angular/animations'
import { ViewerModel } from 'babylonjs-viewer'
import { ModelViewerStore } from './model-viewer.store'
import { getItemRotation } from './utils/get-item-rotation'
import { supportsWebGL } from './utils/webgl-support'
import { viewerUpdateMode, type DefaultViewer } from './viewer'
import { DyePanelComponent } from './dye-panel.component'

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
  imports: [CommonModule, NwModule, DialogModule, IconsModule, ScreenshotModule, DyePanelComponent],
  providers: [ModelViewerStore],
  host: {
    class: 'layout-col bg-gradient-to-b from-base-300 to-black relative z-0',
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
  public set enableDye(value: boolean) {
    this.store.patchState({ enableDye: value })
  }

  @Input()
  public hideFloor: boolean = false

  @Output()
  public readonly close = new Subject<void>()

  @ViewChild('viewerHost', { static: true })
  protected viewerHost: ElementRef<HTMLElement>

  protected isSuported$ = this.store.isSupported$
  protected isLoading$ = this.store.isLoading$
  protected isEmpty$ = this.store.isEmpty$
  protected hasLoaded$ = this.store.hasLoaded$
  protected hasError$ = this.store.hasError$
  protected canClose$ = this.store.canClose$
  protected canDye$ = this.store.canDye$
  protected buttons$ = this.store.buttons$
  protected mode$ = this.store.mode$

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand
  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation
  protected iconSun = svgSun
  protected iconMoon = svgMoon

  private viewer: DefaultViewer
  private model: ViewerModel
  protected trackByIndex = (i: number) => i

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
    protected store: ModelViewerStore,
    private db: NwDbService
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

    this.store.state$.pipe(takeUntil(this.store.destroy$)).subscribe(() => {
      if (this.model) {
        this.updateDye(this.model)
      }
    })
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

    return viewer
      .loadModel({
        url: data.url,
        rotationOffsetAngle: 0,
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
        entryAnimation: null,
      })
      .then((model) => {
        this.model = model
        this.detectDyeFeature(model)
      })
  }

  private async getViewer() {
    if (this.viewer) {
      return this.viewer
    }
    if (!this.store.isSupported$()) {
      return null
    }

    const { createViewer, registerDyePlugin } = await import('./viewer')
    registerDyePlugin()
    this.viewer = await createViewer({
      element: this.viewerHost.nativeElement,
      zone: this.zone,
      mode: this.mode$(),
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
    this.model = null
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

  protected toggleMode() {
    this.store.patchState({ mode: this.mode$() === 'dark' ? 'light' : 'dark' })
    if (this.viewer) {
      viewerUpdateMode(this.viewer, this.mode$())
    }
  }

  private async detectDyeFeature(model: ViewerModel) {
    const { getAppearance } = await import('./viewer')
    const appearance = model.meshes.map((mesh) => getAppearance(mesh.material)).find((it) => !!it)
    if (!appearance) {
      this.store.patchState({
        appearance: null,
        dyeColors: null,
      })
      return
    }
    const itemType = (appearance as Mounts).MountId ? 'MountDye' : 'Dye'
    const items = await firstValueFrom(this.db.itemsByItemTypeMap)
      .then((it) => it.get(itemType))
      .then((it) => Array.from(it?.values() || []))
      .then((list) => list.map((it) => Number(it.ItemID.match(/\d+/)[0])))
    const colors = await firstValueFrom(this.db.dyeColors).then((list) => {
      return list.filter((it) => items.includes(it.Index))
    })
    this.store.patchState({
      enableDye: !!appearance,
      appearance: appearance,
      dyeColors: colors,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
    })
  }

  private async updateDye(model: ViewerModel) {
    const { updateDyeChannel } = await import('./viewer')
    updateDyeChannel({
      model: model,
      scene: this.viewer.sceneManager.scene,
      dyeR: this.store.dyeR$(),
      dyeG: this.store.dyeG$(),
      dyeB: this.store.dyeB$(),
      dyeA: this.store.dyeA$(),
      debugMask: this.store.dyeDebug$(),
      dyeEnabled: this.store.canDye$(),
    })
  }
}
