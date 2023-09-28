import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { Overlay } from '@angular/cdk/overlay'
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
import { BehaviorSubject, combineLatest, defer, filter, firstValueFrom, map, take, tap } from 'rxjs'

import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { EQUIP_SLOTS, EquipSlot, EquipSlotId, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { GearsetRecord, GearsetSlotStore, ItemInstance, ItemInstancesStore } from '~/data'
import { GsSliderComponent } from '~/ui/gs-input'
import { IconsModule } from '~/ui/icons'
import {
  svgEllipsisVertical,
  svgImage,
  svgLink16p,
  svgLinkSlash16p,
  svgPlus,
  svgRotate,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { ItemDetailComponent } from '~/widgets/data/item-detail/item-detail.component'
import { GearImporterDialogComponent } from '../../inventory/gear-importer-dialog.component'
import { InventoryPickerService } from '../../inventory/inventory-picker.service'

export interface GearsetSlotVM {
  slot?: EquipSlot
  gearset?: GearsetRecord
  instanceId?: string
  instance?: ItemInstance
  canRemove?: boolean
  canBreak?: boolean
  canUseImporter?: boolean
  isEqupment?: boolean
  isRune?: boolean
  item?: ItemDefinitionMaster | Housingitems
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-slot',
  templateUrl: './gearset-pane-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    ItemDetailModule,
    IconsModule,
    LayoutModule,
    TooltipModule,
    ItemFrameModule,
    GsSliderComponent,
  ],
  providers: [GearsetSlotStore],
  host: {
    class: 'block bg-black rounded-md flex flex-col overflow-hidden',
  },
})
export class GearsetPaneSlotComponent {
  @Input()
  public set slot(value: EquipSlot) {
    this.slot$.next(value)
  }
  public get slot() {
    return this.slot$.value
  }

  @Input()
  public set slotId(value: EquipSlotId) {
    this.slot$.next(EQUIP_SLOTS.find((it) => it.id === value))
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
  public square: boolean

  @Input()
  public disabled: boolean

  @ViewChildren(ItemDetailComponent)
  protected itemDetail: QueryList<ItemDetailComponent>
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconPlus = svgPlus
  protected iconChange = svgRotate
  protected iconMenu = svgEllipsisVertical
  protected iconImage = svgImage
  protected gsScrollStrat = this.overlay.scrollStrategies.close({
    threshold: 10,
  })
  protected vm$ = defer(() =>
    combineLatest({
      slot: this.slot$,
      gearset: this.gearset$,
      instanceId: this.store.instanceId$,
      instance: this.store.instance$,
      isEqupment: this.store.isEqupment$,
      canRemove: this.store.canRemove$,
      canBreak: this.store.canBreak$,
      canUseImporter: this.store.slot$.pipe(
        map((slot) => {
          const ids: EquipSlotId[] = [
            'head',
            'chest',
            'hands',
            'legs',
            'feet',
            'amulet',
            'ring',
            'earring',
            'weapon1',
            'weapon2',
            'weapon3',
          ]
          return ids.includes(slot?.id)
        })
      ),
      item: this.store.item$,
      isRune: this.slot$.pipe(map((it) => it.id === 'heartgem')),
    })
  )
    .pipe(
      tap((it: GearsetSlotVM) => {
        this.updateClass('screenshot-hidden', !it?.item)
        this.updateClass('hidden', !it?.item && this.disabled)
      })
    )
    .pipe(shareReplayRefCount(1))

  private slot$ = new BehaviorSubject<EquipSlot>(null)
  private gearset$ = new BehaviorSubject<GearsetRecord>(null)

  protected gearScore: number
  protected gsTarget: Element

  public constructor(
    private store: GearsetSlotStore,
    private itemsStore: ItemInstancesStore,
    private picker: InventoryPickerService,
    private renderer: Renderer2,
    private elRef: ElementRef<HTMLElement>,
    private dialog: Dialog,
    private overlay: Overlay
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

  protected async pickItem({ slot, instance }: GearsetSlotVM) {
    if (slot.itemType === 'Trophies') {
      this.picker
        .pickHousingItem({
          title: 'Select a trophy',
          selection: instance ? [instance.itemId] : [],
          category: this.slot.itemType,
        })
        .pipe(take(1))
        .subscribe(([item]) => {
          this.store.updateSlot({
            instance: {
              itemId: getItemId(item),
              gearScore: null,
              perks: {},
            },
          })
        })
    } else {
      this.picker
        .pickItem({
          title: 'Select an item',
          selection: instance ? [instance.itemId] : [],
          category: this.slot.itemType,
          noSkins: true,
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
  }

  protected async itemFromImage({ slot, instance }: GearsetSlotVM) {
    GearImporterDialogComponent.open(this.dialog, {
      data: slot.id,
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((instance) => {
        this.store.updateSlot({
          instance: instance,
        })
      })
  }

  protected openGsEditor(event: MouseEvent) {
    this.gsTarget = event.currentTarget as Element
  }
  protected closeGsEditor() {
    this.gsTarget = null
    this.commitGearScore()
  }

  protected pickPerk({ instance }: GearsetSlotVM, key: string) {
    this.picker
      .pickPerkForItem(instance, key)
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
          instanceId: it[0] as string,
        })
      })
  }

  protected updateGearScore(value: number) {
    this.gearScore = value
  }

  protected stepGearScore(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.gearScore += 1
    }
    if (event.deltaY > 0) {
      this.gearScore -= 1
    }
  }

  protected commitGearScore() {
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

  private updateClass(name: string, hasClass: boolean) {
    if (hasClass) {
      this.renderer.addClass(this.elRef.nativeElement, name)
    } else {
      this.renderer.removeClass(this.elRef.nativeElement, name)
    }
  }
}
