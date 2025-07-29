import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter, switchMap } from 'rxjs'
import { TablePreset } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgPen, svgTrashCan } from '~/ui/icons/svg'
import {
  ConfirmDialogComponent,
  LayoutModule,
  ModalOpenOptions,
  ModalRef,
  ModalService,
  PromptDialogComponent,
} from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

@Component({
  selector: 'nwb-save-state-dialog',
  templateUrl: './save-state-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, LayoutModule, TooltipModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class SaveStateDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<SaveStateDialogComponent>) {
    options.content = SaveStateDialogComponent
    return modal.open<SaveStateDialogComponent, Array<string | number>>(options)
  }

  protected iconBack = svgChevronLeft
  protected iconDelete = svgTrashCan
  protected iconRename = svgPen

  @Input()
  public title: string

  @Input()
  public data: TablePreset

  @Input()
  public set key(value: string) {
    this.store.selectScope(value)
  }

  public constructor(
    protected store: SaveStateDialogStore,
    private modal: ModalService,
    private modalRef: ModalRef<Array<string | number>>,
  ) {
    //
  }

  protected close() {
    this.modalRef.close()
  }

  protected async commit() {
    const id = this.store.selection()
    await this.store.save(id, this.data)
    this.modalRef.close()
  }

  protected selectEntry(id: string) {
    this.store.select(id)
  }

  protected deleteEntry(id: string) {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete',
        body: 'Are you sure you want to delete this entry?',
        positive: 'Delete',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(switchMap(() => this.store.delete(id)))
      .subscribe()
  }

  protected renameEntry(id: string, name: string) {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Rename',
        body: 'New name for this entry:',
        value: name,
        negative: 'Cancel',
        positive: 'OK',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(switchMap((value) => this.store.rename(id, value)))
      .subscribe()
  }

  protected createEntry() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Name',
        body: 'A name for the new entry:',
        value: '',
        negative: 'Cancel',
        positive: 'OK',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(switchMap((value) => this.store.create(value)))
      .subscribe((item) => {
        this.selectEntry(item.id)
      })
  }
}
