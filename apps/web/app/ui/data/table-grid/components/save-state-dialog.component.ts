import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter, switchMap } from 'rxjs'
import { TablePreset } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgPen, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

export interface SaveStateDialogOptions<T> {
  /**
   * The dialog title
   */
  title: string
  /**
   * The table preset to save
   */
  data: TablePreset
  key: string
  /**
   * Dialog configuration
   */
  config: DialogConfig<void>
}

@Component({
  standalone: true,
  selector: 'nwb-save-state-dialog',
  templateUrl: './save-state-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, TooltipModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class SaveStateDialogComponent {
  public static open<T>(dialog: Dialog, options: SaveStateDialogOptions<T>) {
    return dialog.open<Array<string | number>>(SaveStateDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-2xl', 'm-2', 'shadow', 'self-end', 'sm:self-center'],
      ...options.config,
      data: options,
    })
  }

  protected iconBack = svgChevronLeft
  protected iconDelete = svgTrashCan
  protected iconRename = svgPen

  protected title: string
  protected data: TablePreset
  protected key: string

  public constructor(
    protected store: SaveStateDialogStore,
    private dialog: Dialog,
    private dialogRef: DialogRef<Array<string | number>>,
    @Inject(DIALOG_DATA)
    options: SaveStateDialogOptions<any>,
  ) {
    this.title = options.title
    this.data = options.data
    this.key = options.key
    this.store.patchState({ key: options.key })
  }

  protected close() {
    this.dialogRef.close()
  }

  protected async commit() {
    const id = this.store.selection$()
    await this.store.saveData(id, this.data)
    this.dialogRef.close()
  }

  protected selectEntry(id: string) {
    this.store.patchState({ selection: id })
  }

  protected deleteEntry(id: string) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete',
        body: 'Are you sure you want to delete this entry?',
        positive: 'Delete',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(switchMap(() => this.store.deleteEntry(id)))
      .subscribe(() => {
        //
      })
  }

  protected renameEntry(id: string, name: string) {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Rename',
        body: 'New name for this entry:',
        input: name,
        negative: 'Cancel',
        positive: 'OK',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(switchMap((value) => this.store.updateName(id, value)))
      .subscribe(() => {
        //
      })
  }

  protected createEntry() {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Name',
        body: 'A name for the new entry:',
        input: '',
        negative: 'Cancel',
        positive: 'OK',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(switchMap((value) => this.store.createEntry(value)))
      .subscribe((item) => {
        this.selectEntry(item.id)
      })
  }
}
