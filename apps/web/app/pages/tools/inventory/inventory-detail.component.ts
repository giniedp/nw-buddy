import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { combineLatest, map, of, switchMap, take } from 'rxjs'
import { GearsetRecord, GearsetStore, ItemInstance, ItemInstanceRow, ItemInstancesStore } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { InventoryPickerService } from './inventory-picker.service'

export interface ItemDetailVM {
  itemRow: ItemInstanceRow
  itemSet: GearsetRecord
  itemSlot: string
  instance: ItemInstance
}
@Component({
  standalone: true,
  selector: 'nwb-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, NwModule, ItemDetailModule, ScreenshotModule, LayoutModule, ItemFrameModule],
  providers: [GearsetStore],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class PlayerItemsDetailComponent {
  protected itemRow$ = combineLatest({
    id: observeRouteParam(this.route, 'id'),
    rows: this.itemsStore.rows$,
  }).pipe(map(({ id, rows }) => (id ? rows?.find((it) => it.record.id === id) : null)))

  protected itemSet$ = observeRouteParam(this.route, 'set').pipe(
    switchMap((id) => {
      if (!id) {
        return of(null)
      }
      this.gearsetStore.loadById(id)
      return this.gearsetStore.gearset$
    })
  )

  protected vm$ = combineLatest({
    itemRow: this.itemRow$,
    itemSet: this.itemSet$,
    itemSlot: observeRouteParam(this.route, 'slot'),
  }).pipe(
    map((data): ItemDetailVM => {
      let instance: ItemInstance
      if (data.itemRow) {
        instance = data.itemRow.record
      }
      if (data.itemSet) {
        const slot = data.itemSet.slots[data.itemSlot]
        if (typeof slot !== 'string') {
          instance = slot
        }
      }
      return {
        ...data,
        instance: instance,
      }
    })
  )

  protected isGearScoreOpen: boolean
  protected overrideGearScore: number
  public constructor(
    private route: ActivatedRoute,
    private service: InventoryPickerService,
    private itemsStore: ItemInstancesStore,
    private gearsetStore: GearsetStore
  ) {
    //
  }

  public setGearScore(vm: ItemDetailVM, gearScore: number) {
    this.overrideGearScore = gearScore
  }

  public commitGearScore(vm: ItemDetailVM) {
    const gearScore = this.overrideGearScore
    if (vm.itemRow) {
      this.itemsStore.updateRecord({
        record: {
          ...vm.itemRow.record,
          gearScore: gearScore,
        },
      })
    } else {
      this.gearsetStore.updateSlot({
        slot: vm.itemSlot,
        value: {
          ...vm.instance,
          gearScore: gearScore,
        },
      })
    }
  }

  public pickPerk(vm: ItemDetailVM, key: string) {
    this.service
      .choosePerk(vm.instance, key)
      .pipe(take(1))
      .subscribe((value) => {
        if (vm.itemRow) {
          this.itemsStore.updateRecord({
            record: {
              ...vm.itemRow.record,
              perks: {
                ...(vm.instance.perks || {}),
                [key]: value ? value.PerkID : null,
              },
            },
          })
        } else {
          this.gearsetStore.updateSlot({
            slot: vm.itemSlot,
            value: {
              ...vm.instance,
              perks: {
                ...(vm.instance.perks || {}),
                [key]: value ? value.PerkID : null,
              },
            },
          })
        }
      })
  }
}
