import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { combineLatest, filter, switchMap } from 'rxjs'
import { GearsetStore, GearsetsService, ItemInstanceRecord } from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgChevronLeft,
  svgEllipsisVertical,
  svgFolderOpen,
  svgLink,
  svgPaste,
  svgPlus,
  svgSquareArrowUpRight,
  svgTrashCan,
  svgXmark,
} from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetLoadoutComponent, LoadoutSlotEventHandler } from '~/widgets/data/gearset-detail'
import { GearsetTableAdapter } from '~/widgets/data/gearset-table'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { GearsetFormSlotHandler } from './gearset-form-slot-handler'

@Component({
  selector: 'nwb-gearset-form',
  templateUrl: './gearset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NwModule,
    LayoutModule,
    IconsModule,
    ItemDetailModule,
    RouterModule,
    TooltipModule,
    GearsetLoadoutComponent,
  ],
  providers: [
    GearsetStore,
    GearsetFormSlotHandler,
    {
      provide: LoadoutSlotEventHandler,
      useExisting: GearsetFormSlotHandler,
    },
  ],
  host: {
    class: 'block',
  },
})
export class GearsetFormComponent {
  private backend = inject(BackendService)
  private injector = inject(Injector)
  private gearService = inject(GearsetsService)
  private modal = inject(ModalService)
  private preferences = inject(PreferencesService)
  private slotEventHandler = inject(GearsetFormSlotHandler)
  private store = inject(GearsetStore)

  public slots = EQUIP_SLOTS.filter((it) => it.itemType !== 'Consumable')

  public gearset = this.store.gearset
  public isLinkMode = this.store.isLinkMode
  public isCopyMode = this.store.isCopyMode
  public isPublished = this.store.isPublished
  public hasLinkedItems = this.store.hasLinkedItems
  public isSignedIn = this.backend.isSignedIn

  protected iconOpen = svgFolderOpen
  protected iconCreate = svgPlus
  protected iconDelete = svgTrashCan
  protected iconClose = svgXmark
  protected iconMenu = svgBars
  protected iconBack = svgChevronLeft
  protected iconLink = svgLink
  protected iconCopy = svgPaste
  protected iconNav = svgSquareArrowUpRight

  private userId = computed(() => this.backend.sessionUserId() || 'local')
  private currentId = this.preferences.session.storageProperty<string>('recent-gearset-id')


  public constructor() {
    this.store.connectGearsetId(
      combineLatest({
        userId: toObservable(this.userId),
        id: this.currentId.observe(),
      }),
    )
    this.slotEventHandler.itemDropped.subscribe((it) => this.onItemDropped(it.slot, it.item))
  }

  protected handleCreateSet() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create new set',
        body: 'Name for the new gearset',
        value: 'New Gearset',
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearService.create({
            id: null,
            name: newName,
            slots: {},
            tags: [],
          })
        }),
      )
      .subscribe((newSet) => {
        this.currentId.set(newSet.id)
      })
  }

  protected handleUnloadSet() {
    this.currentId.set(null)
  }

  protected async handleLoadGearset() {
    const id = await this.pickGearsetId()
    if (id != null) {
      this.currentId.set(id)
    }
  }

  private async pickGearsetId() {
    return DataViewPicker.open({
      injector: this.injector,
      title: 'Choose a set',
      dataView: {
        adapter: GearsetTableAdapter,
        source: this.gearService.observeRows(this.userId()),
      },
    }).then((it) => it?.[0] as string)
  }

  protected handlePublish() {
    this.store.update({ status: 'public' })
  }

  protected handleUnpublish() {
    this.store.update({ status: 'private' })
  }

  protected handleUpdateMode(mode: 'link' | 'copy') {
    this.store.patchGearset({ createMode: mode })
  }

  private async onItemDropped(slot: EquipSlot, record: ItemInstanceRecord) {
    if (this.store.isLinkMode() && !this.store.isPublished()) {
      this.store.updateSlot(slot.id, record.id)
    } else {
      this.store.updateSlot(slot.id, {
        gearScore: record.gearScore,
        itemId: record.itemId,
        perks: record.perks,
      })
    }
  }
}
