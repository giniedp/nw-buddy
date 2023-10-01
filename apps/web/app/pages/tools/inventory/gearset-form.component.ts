import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { combineLatest, filter, firstValueFrom, map, switchMap, take, takeUntil } from 'rxjs'
import { GearsetStore, GearsetsDB, ItemInstanceRecord } from '~/data'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import {
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
import { LayoutModule, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetTableAdapter } from '~/widgets/data/gearset-table'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { GearsetLoadoutItemComponent, LoadoutSlotEventHandler } from '~/widgets/data/gearset-detail'
import { selectStream } from '~/utils'
import { GearsetFormSlotHandler } from './gearset-form-slot-handler'

@Component({
  standalone: true,
  selector: 'nwb-gearset-form',
  templateUrl: './gearset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NwModule,
    DialogModule,
    LayoutModule,
    IconsModule,
    ItemDetailModule,
    RouterModule,
    TooltipModule,
    GearsetLoadoutItemComponent,
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
  public slots = EQUIP_SLOTS.filter((it) => it.itemType !== 'Consumable')
  public gearsetId: string

  protected vm$ = combineLatest({
    gearset: this.store.gearset$,
    name: this.store.gearsetName$,
    isLinkMode: this.store.isLinkMode$,
    isCopyMode: this.store.isCopyMode$,
    isLoading: this.store.isLoading$,
  })

  protected iconOpen = svgFolderOpen
  protected iconCreate = svgPlus
  protected iconDelete = svgTrashCan
  protected iconClose = svgXmark
  protected iconMenu = svgEllipsisVertical
  protected iconBack = svgChevronLeft
  protected iconLink = svgLink
  protected iconCopy = svgPaste
  protected iconNav = svgSquareArrowUpRight
  protected currentGearsetId = this.pref.session.storageProperty<string>('recent-gearset-id')
  protected gearsetId$ = selectStream(this.currentGearsetId.observe())
  protected gearset$ = selectStream(this.gearDb.observeByid(this.gearsetId$))

  public constructor(
    private store: GearsetStore,
    private gearDb: GearsetsDB,
    private dialog: Dialog,
    private injector: Injector,
    private pref: PreferencesService,
    private slotEventHandler: GearsetFormSlotHandler
  ) {
    this.store.load(this.gearset$)
    slotEventHandler.itemDropped.subscribe((it) => this.onItemDropped(it.slot, it.item))
  }

  protected createSet() {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create new set',
        body: 'Give this set a name',
        input: 'New Gearset',
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearDb.create({
            id: null,
            name: newName,
            slots: {},
            tags: [],
          })
        })
      )
      .subscribe((newSet) => {
        this.currentGearsetId.set(newSet.id)
      })
  }

  protected unloadSet() {
    this.store.load(null)
    this.currentGearsetId.set(null)
  }

  protected loadSet() {
    this.pickGearsetId().subscribe((id) => {
      this.currentGearsetId.set(id)
    })
  }

  private pickGearsetId() {
    return DataViewPicker.open(this.dialog, {
      title: 'Choose a set',
      dataView: {
        adapter: GearsetTableAdapter,
      },
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(map((it) => it?.[0] as string))
      .pipe(filter((it) => it != null))
      .pipe(take(1))
  }

  protected updateName(name: string) {
    this.store.updateName({ name: name })
  }

  protected updateMode(mode: 'link' | 'copy') {
    this.store.updateMode({ mode: mode })
  }

  protected onItemRemove(slot: EquipSlot) {
    this.store.updateSlot({ slot: slot.id, value: null })
  }

  protected async onItemUnlink(slot: EquipSlot, record: ItemInstanceRecord) {
    this.store.updateSlot({
      slot: slot.id,
      value: {
        gearScore: record.gearScore,
        itemId: record.itemId,
        perks: record.perks,
      },
    })
  }

  protected async onItemDropped(slot: EquipSlot, record: ItemInstanceRecord) {
    if (await firstValueFrom(this.store.isLinkMode$)) {
      this.store.updateSlot({ slot: slot.id, value: record.id })
    } else {
      this.store.updateSlot({
        slot: slot.id,
        value: {
          gearScore: record.gearScore,
          itemId: record.itemId,
          perks: record.perks,
        },
      })
    }
  }
}
