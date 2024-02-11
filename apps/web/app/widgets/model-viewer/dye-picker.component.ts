import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Dyecolors } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'

export interface DyePickerDialogData {
  colors: Dyecolors[]
  color: Dyecolors
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
    return modal.open<DyePickerComponent, Dyecolors>(options)
  }

  @Input()
  public colors: Dyecolors[]

  @Input()
  public color: Dyecolors

  public constructor(private modalRef: ModalRef<Dyecolors>) {
    //
  }

  protected commit(color = this.color) {
    this.modalRef.close(color)
  }

  protected cancel() {
    this.modalRef.close()
  }
}
