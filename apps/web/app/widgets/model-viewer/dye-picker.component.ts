import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { DyeColorData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'

export interface DyePickerDialogData {
  colors: DyeColorData[]
  color: DyeColorData
}

@Component({
  standalone: true,
  selector: 'nwb-dye-picker',
  templateUrl: './dye-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class DyePickerComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<DyePickerComponent>) {
    options.size ??= ['y-auto', 'x-sm']
    options.content = DyePickerComponent
    return modal.open<DyePickerComponent, DyeColorData>(options)
  }

  @Input()
  public colors: DyeColorData[]

  @Input()
  public color: DyeColorData

  public constructor(private modalRef: ModalRef<DyeColorData>) {
    //
  }

  protected commit(color = this.color) {
    this.modalRef.close(color)
  }

  protected cancel() {
    this.modalRef.close()
  }
}
