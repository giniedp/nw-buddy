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
  inject,
  input,
  signal,
} from '@angular/core'
import { EquipSlotId } from '@nw-data/common'
import { GearsetRecord, GearsetSlotStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgPlus } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'

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
    '[class.outline]': 'dragState() === "success" || dragState() === "error"',
    '[class.outline-success]': 'dragState() === "success"',
    '[class.outline-error]': 'dragState() === "error"',
  },
})
export class GersetLoadoutSlotComponent {
  protected store = inject(GearsetSlotStore)
  public readonly slotId = input<EquipSlotId>()
  public readonly gearset = input<GearsetRecord>()
  public readonly dragState = signal<'idle' | 'error' | 'success'>('idle')

  @Input()
  public disabled: boolean

  @Output()
  public pickItem = new EventEmitter<EquipSlotId>()

  @Input()
  public menuTemplate: TemplateRef<any>

  protected iconPlus = svgPlus
  protected iconMenu = svgEllipsisVertical

  public constructor(
    @Optional()
    private eventHandler: LoadoutSlotEventHandler,
  ) {
    this.store.connectState(
      selectSignal({
        gearset: this.gearset,
        slotId: this.slotId,
      }),
    )
  }

  protected pickItemClicked() {
    if (!this.disabled) {
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
