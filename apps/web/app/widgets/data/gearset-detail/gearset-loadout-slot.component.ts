import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Injectable,
  Input,
  Optional,
  Output,
  TemplateRef,
} from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map } from 'rxjs'
import { GearsetRecord, GearsetSlotStore } from '~/data'
import { NwModule } from '~/nw'
import { EquipSlot, EquipSlotId, EQUIP_SLOTS, getItemId } from '@nw-data/common'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'

export interface GearsetSquareSlotState {
  slot: EquipSlot
  gearset: GearsetRecord
  dragState: 'idle' | 'error' | 'success'
}

@Injectable()
export abstract class LoadoutSlotEventHandler {
  abstract click(e: MouseEvent, component: GersetLoadoutSlotComponent): void
  abstract dragEnter(e: DragEvent, component: GersetLoadoutSlotComponent): void
  abstract dragLeave(e: DragEvent, component: GersetLoadoutSlotComponent): void
  abstract dragOver(e: DragEvent, component: GersetLoadoutSlotComponent): void
  abstract dragDrop(e: DragEvent, component: GersetLoadoutSlotComponent): void
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-loadout-slot',
  templateUrl: './gearset-loadout-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, CdkMenuModule, TooltipModule],
  providers: [GearsetSlotStore],
  host: {
    class: 'inline-block rounded-md overflow-clip',
    '[class.outline]': 'dragState$() === "success" || dragState$() === "error"',
    '[class.outline-success]': 'dragState$() === "success"',
    '[class.outline-error]': 'dragState$() === "error"',
  },
})
export class GersetLoadoutSlotComponent extends ComponentStore<GearsetSquareSlotState> {
  @Input()
  public set slotId(value: EquipSlotId) {
    this.patchState({ slot: EQUIP_SLOTS.find((it) => it.id === value) })
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    this.patchState({ gearset: value })
  }

  @Input()
  public disabled: boolean

  @Output()
  public pickItem = new EventEmitter<EquipSlotId>()

  @Input()
  public menuTemplate: TemplateRef<any>

  protected iconPlus = svgPlus
  protected iconMenu = svgEllipsisVertical
  protected dragState$ = this.selectSignal((it) => it.dragState)
  protected vm$ = combineLatest({
    item: this.store.item$,
    instance: this.store.instance$,
    rarity: this.store.rarity$,
    isNamed: this.store.isNamed$,
    isArtifact: this.store.isArtifact$,
    itemId: this.store.item$.pipe(map((it) => getItemId(it))),
    slot: this.state$.pipe(map((it) => it.slot)),
  })

  public constructor(
    private store: GearsetSlotStore,
    @Optional()
    private eventHandler: LoadoutSlotEventHandler
  ) {
    super({
      gearset: null,
      slot: null,
      dragState: 'idle',
    })
    this.store.useSlot(this.state$)
  }

  protected pickItemClicked() {
    if (!this.disabled) {
      this.pickItem.emit(this.get((it) => it.slot.id))
    }
  }
  @HostListener('click', ['$event'])
  protected onClick(e: MouseEvent) {
    this.eventHandler?.click(e, this)
  }
  @HostListener('dragenter', ['$event'])
  protected onDragEnter(e: DragEvent) {
    this.eventHandler?.dragEnter(e, this)
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(e: DragEvent) {
    this.eventHandler?.dragLeave(e, this)
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(e: DragEvent) {
    this.eventHandler?.dragOver(e, this)
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    this.eventHandler?.dragDrop(e, this)
  }

  public getSlot() {
    return this.get((it) => it.slot)
  }
}
