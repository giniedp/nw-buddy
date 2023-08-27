import type from 'babylonjs'
import type { AbstractViewer } from 'babylonjs-viewer'
import { Dialog, DialogConfig, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core'
import { NwModule } from '~/nw'
import { ItemModelInfo } from './model-viewer.service'
import { IconsModule } from '~/ui/icons'
import { svgExpand, svgXmark } from '~/ui/icons/svg'
import { Subject, takeUntil } from 'rxjs'
import { ComponentStore } from '@ngrx/component-store'
import { eqCaseInsensitive } from '~/utils'

async function loadBabylon() {
  return import('babylonjs-viewer')
}

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, IconsModule],
  host: {
    class: 'layout-col bg-base-300 relative',
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

  @Output()
  public readonly close = new Subject<void>()

  protected readonly models$ = this.select((it) => it.models)
  protected readonly model$ = this.select(({ models, index }) => models[index] || models[0])
  protected readonly buttons$ = this.selectSignal(({ models, index }) => {
    if (!models || models.length <= 1) {
      return []
    }
    return models.map((it, i) => {
      return {
        index: i,
        label: it.label,
        active: i === index
      }
    })
  })
  protected readonly isLoaded$ = this.selectSignal((it) => it.isLoaded)
  protected readonly isModal$ = this.selectSignal((it) => it.isModal)

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand

  private viewer: AbstractViewer

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

  protected onClose() {
    this.ref?.close()
    this.close.next()
  }

  private async showModel(data: ItemModelInfo) {
    if (!data) {
      return
    }
    const { DefaultViewer, BABYLON } = await loadBabylon()
    const { Quaternion, Matrix } = BABYLON

    let rotation = Quaternion.Identity()
    if (isOneHanded(data)) {
      rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
    }
    if (isTwoHanded(data)) {
      if (isGreatSword(data)) {
        rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, -(3 / 4) * Math.PI, 0))
      } else if (isIceMagic(data) || isVoidGauntlet(data)) {
        //
      } else {
        rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
      }
    }
    if (isShield(data)) {
      rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(Math.PI / 2, -Math.PI / 2, 0))
    }
    if (isTool(data) && !isInstrumentDrums(data)) {
      if (isInstrument(data)) {
        rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, 0, Math.PI / 4))
      } else {
        rotation = Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
      }
    }

    if (!this.viewer) {
      this.viewer = new DefaultViewer(this.elRef.nativeElement, {
        model: {
          url: data.url,
          rotationOffsetAngle: 0,
          rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
          entryAnimation: null,
        },
        engine: {
          antialiasing: true,
          hdEnabled: true,
          adaptiveQuality: true,
        },
        //skybox: false,
        ground: false,
        templates: {
          navBar: {
            html: '<div></div>',
          },
        } as any,
      })
      this.viewer.onModelLoadedObservable.add((model) => {
        this.zone.run(() => {
          this.patchState({ isLoaded: true })
        })
      })
    } else {
      this.viewer.loadModel({
        url: data.url,
        rotationOffsetAngle: 0,
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
        entryAnimation: null,
      })
    }
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
