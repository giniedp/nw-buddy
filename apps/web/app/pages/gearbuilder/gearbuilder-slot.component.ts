import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ItemDefinitionMaster, Perkbuckets } from '@nw-data/types'
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs'
import { OverlayModule } from '@angular/cdk/overlay'

import { NwDbService, NwModule } from '~/nw'
import { DataTableModule, DataTablePicker, DataTablePickerDialog } from '~/ui/data-table'
import { ItemsTableAdapter, PerksTableAdapter } from '~/widgets/adapter'
import { ItemDetailModule, PerkDetail, PerkOverrideFn } from '~/widgets/item-detail'

import { deferStateFlat, shareReplayRefCount } from '~/utils'
import { GearbuilderStore, GearsetEntry } from './gearbuidler-store'
import { SLOTS } from './slots'
import { isItemArmor, isItemWeapon } from '~/nw/utils'
import { isEqual } from 'lodash'

@Component({
  standalone: true,
  selector: 'nwb-gearbuilder-slot',
  templateUrl: './gearbuilder-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, FormsModule, OverlayModule, ItemDetailModule, DataTableModule],
  host: {
    class: 'block bg-base-100 rounded-md flex flex-col',
  },
})
export class GearSlotComponent {
  @Input()
  public set recordId(value: string) {
    this.recordId$.next(value)
  }
  public get recordId() {
    return this.recordId$.value
  }

  @Input()
  public set slotId(value: string) {
    this.slotId$.next(value)
  }
  public get slotId() {
    return this.slotId$.value
  }

  protected vm$ = deferStateFlat(() =>
    combineLatest({
      slotId: this.slotId$,
      recordId: this.recordId$,
      record: this.record$,
      icon: this.slot$.pipe(map((it) => it.icon)),
      itemType: this.slot$.pipe(map((it) => it.itemType)),
      itemId: this.slotItem$.pipe(map((it) => it?.itemId)),
      itemGs: this.slotItem$.pipe(map((it) => it?.gearScore)),
      itemPerks: this.slotItem$.pipe(map((it) => it?.perks)),
    })
  ).pipe(shareReplayRefCount(1))

  private slotId$ = new BehaviorSubject<string>(null)
  private slot$ = defer(() => this.slotId$)
    .pipe(map((id) => SLOTS.find((it) => it.id === id)))
    .pipe(shareReplayRefCount(1))

  private recordId$ = new BehaviorSubject<string>(null)
  private record$: Observable<GearsetEntry> = defer(() => this.recordId$)
    .pipe(switchMap((it) => this.store.observe(it)))
    .pipe(distinctUntilChanged(isEqual))
    .pipe(shareReplayRefCount(1))

  protected slotItem$ = defer(() =>
    combineLatest({
      slot: this.slot$,
      record: this.record$,
      items: this.db.itemsMap,
    })
  )
    .pipe(
      map(({ slot, record, items }) => {
        const data = record?.items?.[slot.id] || {}
        return {
          ...data,
          item: items.get(data?.itemId),
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  protected isGearScoreOpen: boolean
  public constructor(
    private db: NwDbService,
    private dialog: Dialog,
    private injector: Injector,
    private store: GearbuilderStore
  ) {
    //
  }

  protected toggleGearScore() {
    this.isGearScoreOpen = !this.isGearScoreOpen
  }

  protected async updateGearScore(value: number) {
    const slotId = this.slotId
    const recordId = this.recordId
    this.store.update(recordId, (data) => {
      data.items[slotId] = data.items[slotId] || {}
      data.items[slotId].gearScore = value
      return data
    })
  }

  protected perksMapping: PerkOverrideFn = (item: ItemDefinitionMaster, key: string) => {
    const perkId$ = this.slotItem$.pipe(map((it) => it.perks?.[key]))
    return this.db.perk(perkId$)
  }

  protected async pickItem() {
    const slotId = this.slotId
    const recordId = this.recordId
    const itemId = (await firstValueFrom(this.slotItem$))?.itemId

    this.dialog.closeAll()
    this.openItemsPicker(itemId)
      .closed.pipe(take(1))
      .pipe(filter((it) => it !== undefined))
      .subscribe((value: string) => {
        this.store.update(recordId, (data) => {
          data.items[slotId] = {
            itemId: value,
          }
          return data
        })
      })
  }

  protected async pickPerk(detail: PerkDetail) {
    const slotId = this.slotId
    const recordId = this.recordId
    const perks = (await firstValueFrom(this.slotItem$))?.perks
    const perkId = perks?.[detail.key]

    this.dialog.closeAll()
    this.openPerksPicker(perkId, detail)
      .closed.pipe(take(1))
      .pipe(filter((it) => it !== undefined))
      .subscribe((value: string) => {
        this.store.update(recordId, (data) => {
          data.items[slotId] = data.items[slotId] || {}
          data.items[slotId].perks = data.items[slotId].perks || {}
          data.items[slotId].perks[detail.key] = value
          return data
        })
      })
  }

  private openItemsPicker(value: string) {
    const src$ = combineLatest({
      items: this.db.items,
      type: this.slot$.pipe(map((it) => it.itemType)),
    }).pipe(
      map(({ items, type }) => {
        return items.filter((it) => it.ItemClass?.includes(type))
      })
    )
    return this.dialog.open(DataTablePickerDialog, {
      data: value,
      injector: Injector.create({
        providers: [
          ItemsTableAdapter.provider({
            hideUserData: true,
            source: src$,
          }),
        ],
        parent: this.injector,
      }),
      panelClass: ['w-full', 'h-full'],
    })
  }

  private openPerksPicker(value: string, detail: PerkDetail) {
    const src$ = combineLatest({
      perks: this.db.perks,
      buckets: this.db.perkBucketsMap,
      type: this.slot$.pipe(map((it) => it.itemType)),
      item: this.slotItem$?.pipe(map((it) => it.item)),
    }).pipe(
      map(({ perks, buckets, type, item }) => {
        const bucketId = detail.bucket?.PerkBucketID
        const ids = bucketId ? getPerkIds(bucketId, buckets) : new Set()
        const isGem = detail.perk?.PerkType === 'Gem'
        return perks
          .filter((it) => {
            if (ids.has(it.PerkID)) {
              return true
            }
            if (isGem && item.CanReplaceGem) {
              return it.PerkType === 'Gem'
            }
            return false
          })
          .filter((it) => item.ItemClass?.some((tag) => it.ItemClass?.includes(tag)))
      })
    )

    return this.dialog.open(DataTablePickerDialog, {
      data: value,
      injector: Injector.create({
        providers: [
          PerksTableAdapter.provider({
            source: src$,
          }),
        ],
        parent: this.injector,
      }),
      panelClass: ['w-full', 'h-full'],
    })
  }
}

function getPerkIds(bucketId: string, buckets: Map<string, Perkbuckets>) {
  const bucket = buckets.get(bucketId)
  const result = new Set<string>()
  const ids = Object.keys(bucket)
    .filter((key: string) => /^Perk\d+$/.test(key))
    .map((key) => bucket[key] as string)
  for (const id of ids) {
    if (id.startsWith('[PBID]')) {
      getPerkIds(id.replace('[PBID]', ''), buckets).forEach((value) => {
        result.add(value)
      })
    } else {
      result.add(id)
    }
  }
  return result
}
