import { DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  Renderer2,
  ViewChildren,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, firstValueFrom, map, take, tap } from 'rxjs'

import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { ItemDetailModule } from '~/widgets/item-detail'

import { GearsetRecord, GearsetSlotStore, ItemInstance, ItemInstancesStore } from '~/data'
import { EquipSlot, getItemId, getItemMaxGearScore } from '~/nw/utils'
import { deferStateFlat, shareReplayRefCount } from '~/utils'
import { ItemDetailComponent } from '~/widgets/item-detail/item-detail.component'
import { InventoryPickerService } from '../inventory/inventory-picker.service'
import { ItemDefinitionMaster } from '@nw-data/types'
import { svgEllipsisVertical, svgLink16p, svgLinkSlash16p, svgPlus, svgRotate, svgTrashCan } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'
import { CdkMenuModule } from '@angular/cdk/menu'
import { TooltipModule } from '~/ui/tooltip'

export interface GearsetSlotVM {
  slot?: EquipSlot
  gearset?: GearsetRecord
  instanceId?: string
  instance?: ItemInstance
  canRemove?: boolean
  canBreak?: boolean
  isConsumable?: boolean
  isRune?: boolean
  item?: ItemDefinitionMaster
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-slot',
  templateUrl: './gearset-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    OverlayModule,
    ItemDetailModule,
    DataTableModule,
    IconsModule,
    CdkMenuModule,
    TooltipModule,
  ],
  providers: [GearsetSlotStore],
  host: {
    class: 'block bg-base-100 rounded-md flex flex-col overflow-hidden',
  },
})
export class GearsetSlotComponent {
  @Input()
  public set slot(value: EquipSlot) {
    this.slot$.next(value)
  }
  public get slot() {
    return this.slot$.value
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    this.gearset$.next(value)
  }
  public get gearset() {
    return this.gearset$.value
  }

  @Output()
  public itemRemove = new EventEmitter<void>()

  @Output()
  public itemUnlink = new EventEmitter<ItemInstance>()

  @Output()
  public itemInstantiate = new EventEmitter<ItemInstance>()

  @Input()
  public compact: boolean

  @Input()
  public minimal: boolean

  @ViewChildren(ItemDetailComponent)
  protected itemDetail: QueryList<ItemDetailComponent>
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconPlus = svgPlus
  protected iconChange = svgRotate
  protected iconMenu = svgEllipsisVertical

  protected vm$ = deferStateFlat<GearsetSlotVM>(() =>
    combineLatest({
      slot: this.slot$,
      gearset: this.gearset$,
      instanceId: this.store.instanceId$,
      instance: this.store.instance$,
      isConsumable: this.store.isConsumable$,
      canRemove: this.store.canRemove$,
      canBreak: this.store.canBreak$,
      item: this.store.item$,
      isRune: this.slot$.pipe(map((it) => it.id === 'heartgem')),
    })
  )
    .pipe(
      tap((it) => {
        if (it?.item) {
          this.renderer.removeClass(this.elRef.nativeElement, 'screenshot-hidden')
        } else {
          this.renderer.addClass(this.elRef.nativeElement, 'screenshot-hidden')
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  private slot$ = new BehaviorSubject<EquipSlot>(null)
  private gearset$ = new BehaviorSubject<GearsetRecord>(null)

  protected isGearScoreOpen: boolean
  protected gearScore: number

  public constructor(
    private store: GearsetSlotStore,
    private itemsStore: ItemInstancesStore,
    private picker: InventoryPickerService,
    private renderer: Renderer2,
    private elRef: ElementRef<HTMLElement>
  ) {
    //
  }

  public ngOnInit(): void {
    this.store.useSlot(
      combineLatest({
        gearset: this.gearset$,
        slot: this.slot$,
      })
    )
  }

  protected async pickItem({ instance }: GearsetSlotVM) {
    this.picker
      .pickItem({
        title: 'Choose item for slot',
        itemId: instance ? [instance.itemId] : [],
        multiple: false,
        category: this.slot.itemType,
      })
      .pipe(take(1))
      .subscribe(([item]) => {
        this.store.updateSlot({
          instance: {
            itemId: getItemId(item),
            gearScore: getItemMaxGearScore(item),
            perks: {},
          },
        })
      })
  }

  protected pickPerk({ instance }: GearsetSlotVM, key: string) {
    this.picker
      .choosePerk(instance, key)
      .pipe(take(1))
      .subscribe((perk) => {
        this.store.updatePerk({ perk, key })
      })
  }

  protected async linkItem(it: GearsetSlotVM) {

    this.picker
      .pickInstance({
        title: 'Pick item',
        store: this.itemsStore,
        category: it.slot.itemType,
        selection: [it.instanceId],
        multiple: false,
      })
      .pipe(take(1))
      .subscribe((it) => {
        this.store.updateSlot({
          instanceId: it[0]
        })
      })
  }

  protected updateGearScore(value: number) {
    this.gearScore = value
  }

  protected commitGearScore({}: GearsetSlotVM) {
    this.store.updateGearScore({ gearScore: this.gearScore })
  }

  protected async breakLink() {
    const instance = await firstValueFrom(this.store.instance$)
    this.itemUnlink.next(instance)
  }

  protected remove() {
    this.itemRemove.next()
  }

  protected async instantiate() {
    const instance = await firstValueFrom(this.store.instance$)
    this.itemInstantiate.next(instance)
  }
}
