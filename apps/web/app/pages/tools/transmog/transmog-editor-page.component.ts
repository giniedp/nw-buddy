import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { ToastController } from '@ionic/angular/standalone'
import { getEquipSlotForId } from '@nw-data/common'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { svgCamera, svgLink } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectBreakpoint } from '~/utils'
import { ResizeObserverService } from '~/utils/services/resize-observer.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { TransmogEditorStore } from './transmog-editor-page.store'
import { TransmogEditorPanelComponent } from './transmog-editor-panel.component'
import { IconsModule } from '~/ui/icons'
import { ScreenshotService } from '~/widgets/screenshot'
import type { TransmogViewer } from '~/widgets/model-viewer/viewer'

@Component({
  standalone: true,
  selector: 'nwb-transmog-editor-page',
  templateUrl: './transmog-editor-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ItemFrameModule,
    TransmogEditorPanelComponent,
    LayoutModule,
    TooltipModule,
    IconsModule
  ],
  host: {
    class: 'ion-page relative h-full',
  },
  providers: [TransmogEditorStore],
})
export class TransmogEditorPageComponent implements OnDestroy {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private toast = inject(ToastController)
  private preferences = inject(PreferencesService)
  private screenshots = inject(ScreenshotService)

  protected encodedState: string = null
  protected iconLink = svgLink
  protected iconCamera = svgCamera

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

  protected handleStateChange(value: any) {
    this.preferences.session.set('transmog-editor', value)
    this.encodedState = encodeState(value)
  }

  public constructor() {
    const queryState = decodeState(this.route.snapshot.queryParamMap.get('state'))
    const sessionState = this.preferences.session.get('transmog-editor')
    this.store.load(queryState || sessionState || null)
    if (queryState) {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { state: null },
      })
    }
    effect(() => setTimeout(() => this.onCanvasAvailable(this.canvas()?.nativeElement)))
    effect(() => {
      this.handleStateChange({
        head: this.store.head(),
        chest: this.store.chest(),
        hands: this.store.hands(),
        legs: this.store.legs(),
        feet: this.store.feet(),
      })
    })
  }

  private async onCanvasAvailable(canvas: HTMLCanvasElement) {
    if (!canvas || this.viewer) {
      return
    }
    const { createTransmogViewer } = await import('~/widgets/model-viewer/viewer')
    this.viewer = createTransmogViewer(canvas)
    this.resize
      .observe(canvas)
      .pipe(takeUntilDestroyed(this.dref))
      .subscribe(() => {
        this.viewer.resize()
      })
    effect(
      async () => {
        await this.viewer.useModel('head', this.store.headModels()?.[0]?.url)
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('chest', this.store.chestModels()?.[0]?.url)
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('hands', this.store.handsModels()?.[0]?.url)
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('legs', this.store.legsModels()?.[0]?.url)
        setTimeout(() => this.updateDye())
      },
      {
        injector: this.injector,
      },
    )
    effect(
      async () => {
        await this.viewer.useModel('feet', this.store.feetModels()?.[0]?.url)
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
          await this.viewer.useModel('player', location.origin +'/assets/models/player_male.gltf')
        } else {
          await this.viewer.useModel('player', location.origin +'/assets/models/player_female.gltf')
        }
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
    this.isBooted.set(true)
  }

  public ngOnDestroy(): void {
    this.viewer?.dispose()
  }

  private updateDye() {
    this.viewer.useDye('head', {
      dyeR: this.store.headDye().r,
      dyeG: this.store.headDye().g,
      dyeB: this.store.headDye().b,
      dyeA: this.store.headDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
    })
    this.viewer.useDye('chest', {
      dyeR: this.store.chestDye().r,
      dyeG: this.store.chestDye().g,
      dyeB: this.store.chestDye().b,
      dyeA: this.store.chestDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
    })
    this.viewer.useDye('hands', {
      dyeR: this.store.handsDye().r,
      dyeG: this.store.handsDye().g,
      dyeB: this.store.handsDye().b,
      dyeA: this.store.handsDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
    })
    this.viewer.useDye('legs', {
      dyeR: this.store.legsDye().r,
      dyeG: this.store.legsDye().g,
      dyeB: this.store.legsDye().b,
      dyeA: this.store.legsDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
    })
    this.viewer.useDye('feet', {
      dyeR: this.store.feetDye().r,
      dyeG: this.store.feetDye().g,
      dyeB: this.store.feetDye().b,
      dyeA: this.store.feetDye().a,
      debugMask: this.store.debug(),
      dyeEnabled: true,
    })
  }

  protected copyLink() {
    const url = new URL(this.router.url, location.origin)
    url.searchParams.set('state', this.encodedState)
    navigator.clipboard.writeText(url.toString())
    this.toast
      .create({
        message: 'Link was copied to clipboard',
        duration: 2000,
        position: 'top',
      })
      .then((toast) => toast.present())
  }

  protected async capturePhoto() {
    const data = await this.viewer.takeScreenshot()

    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob)
  }
}

function decodeState(state: string) {
  if (!state) {
    return null
  }
  try {
    return JSON.parse(decompressFromEncodedURIComponent(state))
  } catch (e) {
    console.error('Failed to decode state', e)
    return null
  }
}
function encodeState(state: any) {
  return compressToEncodedURIComponent(JSON.stringify(state))
}
