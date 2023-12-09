import { GridApi } from '@ag-grid-community/core'
import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { ClipboardService } from '~/ui/clipboard'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgCircleExclamation, svgPen, svgTrashCan } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { SaveStateDialogStore } from './save-state-dialog.store'

export interface ExportDialogOptions<T> {
  title: string
  grid: GridApi
  /**
   * Dialog configuration
   */
  config: DialogConfig<void>
}

@Component({
  standalone: true,
  selector: 'nwb-export-dialog',
  templateUrl: './export-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IconsModule, NwModule, TooltipModule],
  providers: [SaveStateDialogStore],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class ExportDialogComponent {
  public static open<T>(dialog: Dialog, options: ExportDialogOptions<T>) {
    return dialog.open<Array<string | number>>(ExportDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-xs', 'm-2', 'shadow', 'self-end', 'sm:self-center'],
      ...options.config,
      data: options,
    })
  }

  protected iconError = svgCircleExclamation

  protected title: string
  protected grid: GridApi

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
    protected store: SaveStateDialogStore,
    private dialog: Dialog,
    private dialogRef: DialogRef<Array<string | number>>,
    private cdRef: ChangeDetectorRef,
    @Inject(DIALOG_DATA)
    options: ExportDialogOptions<any>
  ) {
    this.title = options.title
    this.grid = options.grid

  }

  protected close() {
    this.dialogRef.close()
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
    this.dialogRef.close()
  }

  protected copyData() {
    const blob = this.data
    this.clipboard.saveBlobToClipoard(blob, blob.type).then(() => {
      this.dialogRef.close()
    }).catch((err) => {
      console.error(err)
      this.hasError = true
      this.cdRef.markForCheck()
    })
  }

  protected downloadData() {
    const blob = this.data
    this.clipboard.saveBlobToFile(blob, this.filename).then(() => {
      this.dialogRef.close()
    }).catch((err) => {
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