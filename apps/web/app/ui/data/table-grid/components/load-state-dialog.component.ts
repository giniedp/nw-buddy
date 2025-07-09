import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TablePreset } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

@Component({
  selector: 'nwb-load-state-dialog',
  templateUrl: './load-state-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, LayoutModule, TooltipModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class LoadStateDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<LoadStateDialogComponent>) {
    options.content = LoadStateDialogComponent
    return modal.open<LoadStateDialogComponent, TablePreset>(options)
  }

  @Input()
  public title: string

  @Input()
  public set key(value: string) {
    this.store.selectScope(value)
  }

  public constructor(
    protected store: SaveStateDialogStore,
    private modalRef: ModalRef<TablePreset>,
  ) {
    //
  }

  protected close() {
    this.modalRef.close()
  }

  protected async commit() {
    this.modalRef.close(this.store.selectedData())
  }

  protected selectEntry(id: string) {
    this.store.select(id)
  }
}
