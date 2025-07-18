import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Injectable,
  TemplateRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { EquipSlot, EquipSlotId } from '@nw-data/common'
import { GearsetRecord, GearsetSlotStore } from '~/data/gearsets'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgLink16p, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'

export interface GearsetSquareSlotState {
  slot: EquipSlot
  gearset: GearsetRecord
}

@Injectable()
export abstract class LoadoutSlotEventHandler {
  abstract click(e: MouseEvent, component: GearsetLoadoutSlotComponent): void
  abstract dragEnter(e: DragEvent, component: GearsetLoadoutSlotComponent): void
  abstract dragLeave(e: DragEvent, component: GearsetLoadoutSlotComponent): void
  abstract dragOver(e: DragEvent, component: GearsetLoadoutSlotComponent): void
  abstract dragDrop(e: DragEvent, component: GearsetLoadoutSlotComponent): void
}

@Component({
  selector: 'nwb-gearset-loadout-slot',
  templateUrl: './gearset-loadout-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, CdkMenuModule, TooltipModule],
  providers: [GearsetSlotStore],
  host: {
    class: 'inline-block overflow-clip',
    '[class.outline]': 'dragState() === "success" || dragState() === "error"',
    '[class.outline-success]': 'dragState() === "success"',
    '[class.outline-error]': 'dragState() === "error"',
  },
})
export class GearsetLoadoutSlotComponent {
  private eventHandler = inject(LoadoutSlotEventHandler, { optional: true })
  protected store = inject(GearsetSlotStore)
  public readonly slotId = input<EquipSlotId>()
  public readonly gearset = input<GearsetRecord>()

  public disabled = input(false)
  public pickItem = output<EquipSlotId>()
  public menuTemplate = input<TemplateRef<any>>()
  public dragState = signal<'idle' | 'error' | 'success'>('idle')

  protected iconPlus = svgPlus
  protected iconLink = svgLink16p
  protected iconMenu = svgEllipsisVertical

  public constructor() {
    this.store.connect(
      computed(() => {
        return {
          gearset: this.gearset(),
          slotId: this.slotId(),
        }
      }),
    )
  }

  protected pickItemClicked() {
    if (!this.disabled()) {
      this.pickItem.emit(this.slotId())
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
}
