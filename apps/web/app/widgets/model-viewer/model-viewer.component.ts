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
} from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import type { AbstractViewer, DefaultViewer } from 'babylonjs-viewer'
import { Subject, takeUntil } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgExpand, svgXmark } from '~/ui/icons/svg'
import { eqCaseInsensitive } from '~/utils'
import { ItemModelInfo } from './model-viewer.service'
import { createViewer, loadBabylon } from './viewer'

export interface ModelViewerState {
  models: ItemModelInfo[]
  index: number
  isLoaded?: boolean
  isModal?: boolean
  viewer?: AbstractViewer
}

@Component({
  standalone: true,
  selector: 'nwb-model-viewer',
  templateUrl: './model-viewer.component.html',
  styleUrls: ['./model-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, IconsModule],
  host: {
    class: 'layout-col bg-base-300 relative z-0',
  },
  schemas: [NO_ERRORS_SCHEMA],
})
export class ModelViewerComponent extends ComponentStore<ModelViewerState> implements OnInit, OnDestroy {
  public static open(dialog: Dialog, options: DialogConfig<ItemModelInfo[]>) {
    return dialog.open(ModelViewerComponent, options)
  }

  @Input()
  public set models(value: ItemModelInfo[]) {
    this.patchState({ models: value })
  }

  @Input()
  public hideFloor: boolean = false

  @Output()
  public readonly close = new Subject<void>()

  protected readonly models$ = this.select((it) => it.models)
  protected readonly model$ = this.select(({ models, index }) => {
    return models?.[index] || models?.[0]
  })
  protected readonly buttons$ = this.selectSignal(({ models, index }) => {
    if (!models || models.length <= 1) {
      return []
    }
    return models.map((it, i) => {
      return {
        index: i,
        label: it.label,
        active: i === index,
      }
    })
  })
  protected readonly isLoaded$ = this.selectSignal((it) => it.isLoaded)
  protected readonly isModal$ = this.selectSignal((it) => it.isModal)

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand

  private viewer: DefaultViewer

  public constructor(
    @Optional()
    private ref: DialogRef,
    @Inject(DIALOG_DATA)
    @Optional()
    data: ItemModelInfo[],
    private elRef: ElementRef<HTMLElement>,
    private zone: NgZone
  ) {
    super({
      models: data || [],
      index: 0,
      isModal: !!ref,
    })
  }

  public async ngOnInit() {
    this.model$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.showModel(data)
    })
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.viewer?.dispose()
    this.viewer = null
  }

  protected show(index: number) {
    this.patchState({ index: index })
  }

  protected toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected closeDialog() {
    this.ref?.close()
    this.close.next()
  }

  private async showModel(data: ItemModelInfo) {
    const viewer = await this.getViewer()
    if (!viewer) {
      return
    }
    if (!data?.url) {
      viewer.sceneManager.clearScene(true, false)
      return
    }
    await viewer.hideOverlayScreen()
    const rotation = await getRotation(data)
    viewer.sceneManager.clearScene(true, false)

    viewer
      .loadModel({
        url: data.url,
        rotationOffsetAngle: 0,
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
        entryAnimation: null,
      })
      .catch(() => {
        this.disposeViewer()
        this.getViewer()
      })
  }

  private async getViewer() {
    if (this.viewer) {
      return this.viewer
    }
    this.viewer = await createViewer({
      element: this.elRef.nativeElement,
      zone: this.zone,
      hideFloor: this.hideFloor,
      // onEngineInit: (viewer) => {
      //   //
      // },
      // onModelLoaded: () => {
      //   console.log('onModelLoaded')
      // },
      // onModelError: (err) => {
      //   console.log('onModelError', err)
      // },
      // onModelProgress: (progress) => {
      //   console.log('onModelProgress', progress)
      // },
    }).catch(() => {
      return null
    })
    return this.viewer
  }

  private disposeViewer() {
    this.viewer.containerElement
    this.viewer?.dispose()
    this.viewer = null
  }
}

function isOneHanded(data: ItemModelInfo) {
  return hasItemClass(data, 'EquippableMainHand')
}

function isTwoHanded(data: ItemModelInfo) {
  return hasItemClass(data, 'EquippableTwoHand')
}

function isMelee(data: ItemModelInfo) {
  return hasItemClass(data, 'Melee')
}

function isRanged(data: ItemModelInfo) {
  return hasItemClass(data, 'Melee')
}

function isGreatSword(data: ItemModelInfo) {
  return hasItemClass(data, 'GreatSword')
}
function isIceMagic(data: ItemModelInfo) {
  return hasItemClass(data, 'IceMagic')
}

function isVoidGauntlet(data: ItemModelInfo) {
  return hasItemClass(data, 'VoidGauntlet')
}

function isMagic(data: ItemModelInfo) {
  return hasItemClass(data, 'Magic')
}

function isShield(data: ItemModelInfo) {
  return hasItemClass(data, 'EquippableOffHand')
}

function isTool(data: ItemModelInfo) {
  return hasItemClass(data, 'EquippableTool')
}

function isOnWall(data: ItemModelInfo) {
  return hasItemClass(data, 'OnWall')
}

function isOnCeiling(data: ItemModelInfo) {
  return hasItemClass(data, 'OnCeiling')
}

function isOnFloor(data: ItemModelInfo) {
  return hasItemClass(data, 'OnFloor')
}
function isOnFurniture(data: ItemModelInfo) {
  return hasItemClass(data, 'OnFurniture')
}
function isInstrument(data: ItemModelInfo) {
  return (
    hasItemClass(data, 'InstrumentFlute') ||
    hasItemClass(data, 'InstrumentGuitar') ||
    hasItemClass(data, 'InstrumentMandolin') ||
    hasItemClass(data, 'InstrumentUprightBass') ||
    hasItemClass(data, 'InstrumentDrums')
  )
}

function isInstrumentDrums(data: ItemModelInfo) {
  return hasItemClass(data, 'InstrumentDrums')
}

function hasItemClass(data: ItemModelInfo, name: string) {
  return !!data.itemClass?.some((it) => eqCaseInsensitive(it, name))
}

async function getRotation(data: ItemModelInfo) {
  const { BABYLON } = await loadBabylon()
  const { Quaternion, Matrix } = BABYLON

  console.log(data)
  if (isOnWall(data)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, Math.PI / 2, 0))
  }
  if (isOnCeiling(data)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, Math.PI, 0))
  }
  if (isOnFloor(data) || isOnFurniture(data)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(Math.PI, 0, 0))
  }
  if (isOneHanded(data)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
  }

  if (isTwoHanded(data)) {
    if (isGreatSword(data)) {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, -(3 / 4) * Math.PI, 0))
    } else if (isIceMagic(data) || isVoidGauntlet(data)) {
      //
    } else {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
    }
  }

  if (isShield(data)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(Math.PI / 2, -Math.PI / 2, 0))
  }
  if (isTool(data) && !isInstrumentDrums(data)) {
    if (isInstrument(data)) {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, 0, Math.PI / 4))
    }
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
  }

  return Quaternion.Identity()
}
