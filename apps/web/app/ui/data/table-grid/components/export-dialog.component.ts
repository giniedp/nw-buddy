import { GridApi } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ClipboardService } from '~/ui/clipboard'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation } from '~/ui/icons/svg'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

@Component({
  selector: 'nwb-export-dialog',
  templateUrl: './export-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, TooltipModule, LayoutModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class ExportDialogComponent {
  public static open(modal: ModalService, options: ModalOpenOptions<ExportDialogComponent>) {
    options.size ??= 'sm'
    options.content = ExportDialogComponent
    return modal.open<ExportDialogComponent, Array<string | number>>(options)
  }

  protected iconError = svgCircleExclamation

  @Input()
  public title: string

  @Input()
  public grid: GridApi

  protected exportAllCols: boolean = false
  protected exportAllRows: boolean = false
  protected exportOnlySelected: boolean = false
  protected skipHeader: boolean = false
  protected columnSeparator: string = ','
  protected suppressQuotes: boolean = false
  protected filename: string = 'export.csv'
  protected data: Blob
  protected isLoading: boolean = false
  protected hasError: boolean = false
  private clipboard: ClipboardService = inject(ClipboardService)

  public constructor(
    private modalRef: ModalRef<Array<string | number>>,
    private cdRef: ChangeDetectorRef,
  ) {
    //
  }

  protected close() {
    this.modalRef.close()
  }

  protected async export() {
    this.isLoading = true
    this.cdRef.markForCheck()
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      this.data = new Blob([this.getData()], { type: 'text/plain' })
    } catch (e) {
      console.error(e)
      this.hasError = true
    }

    this.isLoading = false
    this.cdRef.markForCheck()
  }

  protected async commit() {
    this.modalRef.close()
  }

  protected copyData() {
    const blob = this.data
    this.clipboard
      .saveBlobToClipoard(blob, blob.type)
      .then(() => {
        this.modalRef.close()
      })
      .catch((err) => {
        console.error(err)
        this.hasError = true
        this.cdRef.markForCheck()
      })
  }

  protected downloadData() {
    const blob = this.data
    this.clipboard
      .saveBlobToFile(blob, this.filename)
      .then(() => {
        this.modalRef.close()
      })
      .catch((err) => {
        console.error(err)
        this.hasError = true
        this.cdRef.markForCheck()
      })
  }

  private getData() {
    return this.grid.getDataAsCsv({
      allColumns: this.exportAllCols,
      exportedRows: this.exportAllRows ? 'all' : 'filteredAndSorted',
      onlySelected: this.exportOnlySelected,
      columnSeparator: this.columnSeparator,
      suppressQuotes: this.suppressQuotes,
      skipColumnGroupHeaders: true,
      skipColumnHeaders: this.skipHeader,
      skipPinnedTop: true,
      skipPinnedBottom: true,
    })
  }
}
