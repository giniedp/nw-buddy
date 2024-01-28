import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TablePreset } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

export interface SaveStateDialogOptions<T> {
  /**
   * The dialog title
   */
  title: string
  key: string
  /**
   * Dialog configuration
   */
  config: DialogConfig<void>
}

@Component({
  standalone: true,
  selector: 'nwb-load-state-dialog',
  templateUrl: './load-state-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, TooltipModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class LoadStateDialogComponent {
  public static open<T>(dialog: Dialog, options: SaveStateDialogOptions<T>) {
    return dialog.open<TablePreset>(LoadStateDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-2xl', 'm-2', 'shadow', 'self-end', 'sm:self-center'],
      ...options.config,
      data: options,
    })
  }

  protected title: string

  public constructor(
    protected store: SaveStateDialogStore,
    private dialogRef: DialogRef<TablePreset>,
    @Inject(DIALOG_DATA)
    options: SaveStateDialogOptions<any>
  ) {
    this.title = options.title
    this.store.patchState({ key: options.key })
  }

  protected close() {
    this.dialogRef.close()
  }

  protected async commit() {
    this.dialogRef.close(this.store.selectedData$())
  }

  protected selectEntry(id: string) {
    this.store.patchState({ selection: id })
  }
}
