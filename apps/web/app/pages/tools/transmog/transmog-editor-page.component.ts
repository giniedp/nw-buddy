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

import { animate, style, transition, trigger } from '@angular/animations'
import { FormsModule } from '@angular/forms'
import { IconsModule } from '~/ui/icons'
import { PlatformService } from '~/utils/services/platform.service'
import type { TransmogViewer } from '~/widgets/model-viewer/viewer'
import { ScreenshotService } from '~/widgets/screenshot'
import { TransmogEditorStore } from './transmog-editor-page.store'
import { TransmogEditorPanelComponent } from './transmog-editor-panel.component'

@Component({
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
    IconsModule,
    FormsModule,
  ],
  host: {
    class: 'ion-page relative h-full',
  },
  providers: [TransmogEditorStore],
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0 }), animate('0.3s ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('0.3s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class TransmogEditorPageComponent implements OnDestroy {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private toast = inject(ToastController)
  private preferences = inject(PreferencesService)
  private screenshots = inject(ScreenshotService)
  private platform = inject(PlatformService)

  protected encodedState: string = null
  protected iconLink = svgLink
  protected iconCamera = svgCamera
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

  private modelPlayerMale = 'https://cdn.nw-buddy.de/models-1k/objects/characters/player/male/player_male.glb'
  private modelPlayerFemale = 'https://cdn.nw-buddy.de/models-1k/objects/characters/player/female/player_female.glb'
  private modelScene = location.origin + '/assets/models/frontend.glb'

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
      .observe(canvas as any as Element)
      .pipe(takeUntilDestroyed(this.dref))
      .subscribe(() => {
        this.viewer.resize()
      })
    this.viewer.useModel('level', this.modelScene).then(() => {
      this.isLoading.set(false)
    })
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

  protected copyLink() {
    const url = new URL(this.router.url, this.platform.websiteUrl)
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
