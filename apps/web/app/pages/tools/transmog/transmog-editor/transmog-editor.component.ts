import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { getEquipSlotForId } from '@nw-data/common'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectBreakpoint } from '~/utils'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import type { TransmogViewer } from '~/widgets/model-viewer/viewer/create-transmog-viewer'
import { ScreenshotService } from '~/widgets/screenshot'
import { TransmogEditorPanelComponent } from './transmog-editor-panel.component'
import { TransmogEditorStore } from './transmog-editor.store'

@Component({
  selector: 'nwb-transmog-editor',
  templateUrl: './transmog-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ItemFrameModule,
    TransmogEditorPanelComponent,
    LayoutModule,
    TooltipModule,
    IconsModule,
    FormsModule,
  ],
  host: {
    class: 'ion-page relative h-full',
  },
  providers: [
    TransmogEditorStore,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TransmogEditorComponent,
    },
  ],
})
export class TransmogEditorComponent implements OnDestroy, ControlValueAccessor {
  private screenshots = inject(ScreenshotService)

  protected isLoading = signal(true)
  protected timeOfDay = signal(0.25)

  private store = inject(TransmogEditorStore)
  protected isBooted = signal(false)
  private injector = inject(Injector)
  private resize = inject(ResizeObserverService)
  private dref = inject(DestroyRef)
  private canvas = viewChild('canvas', { read: ElementRef<HTMLCanvasElement> })
  private viewer: TransmogViewer

  protected isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected showSidebar = computed(() => this.isLargeContent())
  protected showModal = computed(() => !this.isLargeContent())
  protected isDisabled = signal(false)
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}

  private modelScene = 'https://cdn.nw-buddy.de/character/stage.glb'
  // private modelScene = '/assets/models/stage.glb'
  private modelPlayerMale = '/assets/models/player_male.glb'
  private modelPlayerFemale = '/assets/models/player_female.glb'
  protected slots = computed(() => {
    const slotIds = ['head', 'chest', 'hands', 'legs', 'feet']
    return slotIds.map((id) => {
      switch (id) {
        case 'head': {
          return {
            id,
            slot: getEquipSlotForId('head'),
            dye: this.store.headDye(),
            debug: this.store.debug(),
          }
        }
        case 'chest': {
          return {
            id,
            slot: getEquipSlotForId('chest'),
            dye: this.store.chestDye(),
            debug: this.store.debug(),
          }
        }
        case 'hands': {
          return {
            id,
            slot: getEquipSlotForId('hands'),
            dye: this.store.handsDye(),
            debug: this.store.debug(),
          }
        }
        case 'legs': {
          return {
            id,
            slot: getEquipSlotForId('legs'),
            dye: this.store.legsDye(),
            debug: this.store.debug(),
          }
        }
        case 'feet': {
          return {
            id,
            slot: getEquipSlotForId('feet'),
            dye: this.store.feetDye(),
            debug: this.store.debug(),
          }
        }
      }
      return null
    })
  })

  public constructor() {
    effect(() => setTimeout(() => this.onCanvasAvailable(this.canvas()?.nativeElement)))
    this.store.changed.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.isDisabled()) {
        this.onChange(this.store.getState())
      }
    })
  }

  public writeValue(obj: any): void {
    this.store.load(obj)
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }

  private async onCanvasAvailable(canvas: HTMLCanvasElement) {
    if (!canvas || this.viewer) {
      return
    }
    const { createTransmogViewer } = await import('~/widgets/model-viewer/viewer/create-transmog-viewer')
    this.viewer = createTransmogViewer(canvas)
    this.viewer.useModel('level', this.modelScene)
    this.resize
      .observe(canvas as any as Element)
      .pipe(takeUntilDestroyed(this.dref))
      .subscribe(() => {
        this.viewer.resize()
      })
    this.isLoading.set(false)
    effect(
      async () => {
        await this.viewer.useModel('head', this.store.headModel())
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('chest', this.store.chestModel())
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('hands', this.store.handsModel())
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('legs', this.store.legsModel())
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('feet', this.store.feetModel())
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        const isMale = this.store.gender() === 'male'
        if (isMale) {
          await this.viewer.useModel('player', this.modelPlayerMale)
        } else {
          await this.viewer.useModel('player', this.modelPlayerFemale)
        }
        this.updateNakedMeshes()
      },
      {
        injector: this.injector,
      },
    )
    effect(
      () => {
        this.updateDye()
      },
      {
        injector: this.injector,
      },
    )
    effect(
      () => {
        this.updateNakedMeshes()
      },
      {
        injector: this.injector,
      },
    )
    effect(
      () => {
        this.viewer.setTimeOfDay(this.timeOfDay())
      },
      {
        injector: this.injector,
      },
    )
    this.isBooted.set(true)
  }

  public ngOnDestroy(): void {
    this.viewer?.dispose()
  }

  private updateDye() {
    this.viewer.useAppearance('head', {
      dyeR: this.store.headDye().r,
      dyeG: this.store.headDye().g,
      dyeB: this.store.headDye().b,
      dyeA: this.store.headDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
      appearance: this.store.headAppearance(),
    })
    this.viewer.useAppearance('chest', {
      dyeR: this.store.chestDye().r,
      dyeG: this.store.chestDye().g,
      dyeB: this.store.chestDye().b,
      dyeA: this.store.chestDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
      appearance: this.store.chestAppearance(),
    })
    this.viewer.useAppearance('hands', {
      dyeR: this.store.handsDye().r,
      dyeG: this.store.handsDye().g,
      dyeB: this.store.handsDye().b,
      dyeA: this.store.handsDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
      appearance: this.store.handsAppearance(),
    })
    this.viewer.useAppearance('legs', {
      dyeR: this.store.legsDye().r,
      dyeG: this.store.legsDye().g,
      dyeB: this.store.legsDye().b,
      dyeA: this.store.legsDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
      appearance: this.store.legsAppearance(),
    })
    this.viewer.useAppearance('feet', {
      dyeR: this.store.feetDye().r,
      dyeG: this.store.feetDye().g,
      dyeB: this.store.feetDye().b,
      dyeA: this.store.feetDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
      appearance: this.store.feetAppearance(),
    })
  }

  private updateNakedMeshes() {
    this.viewer.hideMeshes('player', this.store.hideNakedMeshes())
  }

  public async capturePhoto() {
    const data = await this.viewer.takeScreenshot()

    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob)
  }
}
