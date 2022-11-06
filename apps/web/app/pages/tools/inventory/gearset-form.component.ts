import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { combineLatest, filter, firstValueFrom, map, switchMap, take, tap } from 'rxjs'
import { GearsetsDB, GearsetsStore, GearsetStore, ItemInstanceRecord } from '~/data'
import { NwModule } from '~/nw'
import { EquipSlot, EQUIP_SLOTS } from '~/nw/utils'
import { PreferencesService } from '~/preferences'
import { DataTablePickerDialog } from '~/ui/data-table'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgFolderOpen, svgLink, svgPaste, svgPlus, svgSquareArrowUpRight } from '~/ui/icons/svg'
import { PromptDialogComponent } from '~/ui/modal'
import { GearsetTableAdapter } from '~/widgets/adapter'
import { ItemDetailModule } from '~/widgets/item-detail'
import { GearsetsTableAdapter } from '../gearsets/gearsets-table.adapter'
import { GearsetFormCellComponent } from './gearset-form-cell.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-form',
  templateUrl: './gearset-form.component.html',
  styleUrls: ['./gearset-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NwModule,
    DialogModule,
    CdkMenuModule,
    GearsetFormCellComponent,
    IconsModule,
    ItemDetailModule,
    RouterModule,
  ],
  providers: [GearsetStore],
  host: {
    class: 'layout-col layout-gap',
  },
})
export class GearsetFormComponent {
  public slots = EQUIP_SLOTS
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
  protected iconBack = svgChevronLeft
  protected iconLink = svgLink
  protected iconCopy = svgPaste
  protected iconNav = svgSquareArrowUpRight
  private currentGearsetId = this.pref.session.storageProperty<string>('recent-gearset-id')

  public constructor(
    private store: GearsetStore,
    private gearDb: GearsetsDB,
    private dialog: Dialog,
    private injector: Injector,
    private pref: PreferencesService
  ) {
    //
    const id = this.currentGearsetId.get()
    if (id) {
      this.store.loadById(id)
    } else {
      this.store.load(null)
    }
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
        this.store.loadById(newSet.id)
        this.currentGearsetId.set(newSet.id)
      })
  }

  protected unloadSet() {
    this.store.load(null)
    this.currentGearsetId.set(null)
  }

  protected loadSet() {
    this.store.loadById(
      this.pickGearsetId().pipe(
        tap((it) => {
          this.currentGearsetId.set(it)
        })
      )
    )
  }

  private pickGearsetId() {
    return DataTablePickerDialog.open(this.dialog, {
      adapter: GearsetsTableAdapter.provider({
        noActions: true,
        persistStateId: 'gearsets-picker-table',
      }),
      title: 'Choose a set',
      config: {
        maxWidth: 1024,
        maxHeight: 1024,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(map((it) => it?.[0]))
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
